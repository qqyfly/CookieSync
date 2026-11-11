import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readAllCookiesForSites, readSiteCookies, readSiteListCookies, readWebsiteListCookies } from '../../src/cookies/cookies';
import type { Site } from '../../src/sites/site';

describe('cookie reader module', () => {
  const fakeCookies: chrome.cookies.Cookie[] = [
    {
      name: 'session_token',
      value: 'xyz123',
      domain: 'example.com',
      hostOnly: true,
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
      session: true,
      storeId: '0',
    },
    {
      name: 'preferences',
      value: 'theme_dark',
      domain: 'example.com',
      hostOnly: false,
      path: '/',
      secure: false,
      httpOnly: false,
      sameSite: 'no_restriction',
      session: false,
      storeId: '0',
    },
  ];

  let getAllMock: ReturnType<typeof vi.fn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    getAllMock = vi.fn().mockResolvedValue(fakeCookies);

    const storageData: Record<string, unknown> = {
      'cookiesync.sites': [
        { origin: 'https://site-a.example', addedAt: 100 },
        { origin: 'https://site-b.example', addedAt: 200 },
      ],
    };

    vi.stubGlobal('chrome', {
      cookies: {
        getAll: getAllMock,
      },
      storage: {
        local: {
          get: vi.fn().mockImplementation((key: string) =>
            Promise.resolve({ [key]: storageData[key] }),
          ),
          set: vi.fn().mockResolvedValue(undefined),
        },
      },
    });

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('readSiteCookies queries chrome.cookies.getAll with origin URL and logs result', async () => {
    const cookies = await readSiteCookies('https://site-a.example');

    expect(getAllMock).toHaveBeenCalledWith({ url: 'https://site-a.example' });
    expect(cookies).toEqual(fakeCookies);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Cookies for https://site-a.example'),
      fakeCookies,
    );
  });

  it('readSiteCookies catches errors and logs them to console', async () => {
    const error = new Error('Permission denied');
    getAllMock.mockRejectedValueOnce(error);

    const cookies = await readSiteCookies('https://denied.example');

    expect(cookies).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error reading cookies for https://denied.example'),
      error,
    );
  });

  it('handles chrome.cookies being undefined gracefully', async () => {
    vi.stubGlobal('chrome', {
      storage: {
        local: {
          get: vi.fn().mockResolvedValue({}),
        },
      },
    });

    const singleResult = await readSiteCookies('https://site-a.example');
    expect(singleResult).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('chrome.cookies API is unavailable'),
    );

    const listResult = await readSiteListCookies();
    expect(listResult).toEqual([]);
  });

  it('readSiteListCookies reads cookies for all given sites', async () => {
    const sites: Site[] = [
      { origin: 'https://alpha.example', addedAt: 1 },
      { origin: 'https://beta.example', addedAt: 2 },
    ];

    const results = await readSiteListCookies(sites);

    expect(getAllMock).toHaveBeenCalledTimes(2);
    expect(getAllMock).toHaveBeenNthCalledWith(1, { url: 'https://alpha.example' });
    expect(getAllMock).toHaveBeenNthCalledWith(2, { url: 'https://beta.example' });
    expect(results).toEqual([
      { origin: 'https://alpha.example', cookies: fakeCookies },
      { origin: 'https://beta.example', cookies: fakeCookies },
    ]);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Reading cookies for website list (2 site(s))'),
    );
  });

  it('readSiteListCookies works with an array of string origins', async () => {
    const origins = ['https://foo.example', 'https://bar.example'];
    const results = await readSiteListCookies(origins);

    expect(getAllMock).toHaveBeenCalledTimes(2);
    expect(getAllMock).toHaveBeenNthCalledWith(1, { url: 'https://foo.example' });
    expect(getAllMock).toHaveBeenNthCalledWith(2, { url: 'https://bar.example' });
    expect(results).toHaveLength(2);
  });

  it('readSiteListCookies loads stored sites when no argument is passed', async () => {
    const results = await readSiteListCookies();

    expect(getAllMock).toHaveBeenCalledTimes(2);
    expect(getAllMock).toHaveBeenNthCalledWith(1, { url: 'https://site-b.example' });
    expect(getAllMock).toHaveBeenNthCalledWith(2, { url: 'https://site-a.example' });
    expect(results).toHaveLength(2);
  });

  it('provides aliases readAllCookiesForSites and readWebsiteListCookies', () => {
    expect(readAllCookiesForSites).toBe(readSiteListCookies);
    expect(readWebsiteListCookies).toBe(readSiteListCookies);
  });
});
