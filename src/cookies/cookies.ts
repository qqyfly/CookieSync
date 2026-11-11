import type { Site } from '../sites/site';
import { loadSites } from '../sites/site-store';

export interface SiteCookies {
  origin: string;
  cookies: chrome.cookies.Cookie[];
}

/**
 * Reads all cookies for a specific website origin using chrome.cookies.getAll
 * and prints them to the console.
 *
 * @param origin The website origin (e.g. "https://example.com").
 * @returns The array of cookies retrieved for that origin.
 */
export async function readSiteCookies(origin: string): Promise<chrome.cookies.Cookie[]> {
  if (!chrome?.cookies) {
    const errorMsg =
      'chrome.cookies API is unavailable. Please reload the extension at chrome://extensions (click the ↺ reload button on the CookieSync extension card) to enable the newly added "cookies" permission.';
    console.error(`[CookieSync] ${errorMsg}`);
    return [];
  }

  try {
    const cookies = await chrome.cookies.getAll({ url: origin });
    console.log(`[CookieSync] Cookies for ${origin} (${cookies.length} found):`, cookies);
    if (cookies.length > 0 && typeof console.table === 'function') {
      console.table(
        cookies.map((c) => ({
          name: c.name,
          domain: c.domain,
          path: c.path,
          secure: c.secure,
          httpOnly: c.httpOnly,
          session: c.session,
          value: c.value,
        })),
      );
    }
    return cookies;
  } catch (error) {
    console.error(`[CookieSync] Error reading cookies for ${origin}:`, error);
    return [];
  }
}

/**
 * Reads all cookies for every website in the website list using chrome.cookies.getAll
 * and prints them to the console.
 *
 * @param sites Optional list of sites (or array of origins). If not provided,
 *              the saved website list is loaded from storage.
 * @returns An array of results containing origin and cookies for each site.
 */
export async function readSiteListCookies(
  sites?: Site[] | string[],
): Promise<SiteCookies[]> {
  if (!chrome?.cookies) {
    const errorMsg =
      'chrome.cookies API is unavailable. Please reload the extension at chrome://extensions (click the ↺ reload button on the CookieSync extension card) to enable the newly added "cookies" permission.';
    console.error(`[CookieSync] ${errorMsg}`);
    return [];
  }

  let targetSites: { origin: string }[];

  if (!sites) {
    targetSites = await loadSites();
  } else if (sites.length > 0 && typeof sites[0] === 'string') {
    targetSites = (sites as string[]).map((origin) => ({ origin }));
  } else {
    targetSites = sites as Site[];
  }

  console.log(`[CookieSync] Reading cookies for website list (${targetSites.length} site(s))...`);

  const results: SiteCookies[] = [];
  for (const site of targetSites) {
    const cookies = await readSiteCookies(site.origin);
    results.push({ origin: site.origin, cookies });
  }

  console.log('[CookieSync] Website list cookies summary:', results);
  return results;
}

// Convenient aliases
export const readAllCookiesForSites = readSiteListCookies;
export const readWebsiteListCookies = readSiteListCookies;
