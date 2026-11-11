import type { Site } from './site';
import { sortSitesNewestFirst } from './site-list';

const STORAGE_KEY = 'cookiesync.sites';
const PENDING_SITE_KEY = 'cookiesync.pendingSite';

export async function loadSites(): Promise<Site[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const sites = result[STORAGE_KEY] as unknown;
  if (!Array.isArray(sites)) return [];
  return sortSitesNewestFirst(sites.filter(isSite));
}

export async function saveSites(sites: Site[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: sites });
}

export async function savePendingSite(site: Site): Promise<void> {
  await chrome.storage.local.set({ [PENDING_SITE_KEY]: site });
}

export async function loadPendingSite(): Promise<Site | undefined> {
  const result = await chrome.storage.local.get(PENDING_SITE_KEY);
  return isSite(result[PENDING_SITE_KEY]) ? result[PENDING_SITE_KEY] : undefined;
}

export async function finishPendingSite(site: Site, granted: boolean): Promise<Site[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const storedSites = result[STORAGE_KEY];
  const currentSites = Array.isArray(storedSites) ? storedSites.filter(isSite) : [];
  const updated = granted
    ? sortSitesNewestFirst([
      ...currentSites.filter((candidate) => candidate.origin !== site.origin),
      site,
    ])
    : sortSitesNewestFirst(currentSites);

  await chrome.storage.local.set({
    [STORAGE_KEY]: updated,
    [PENDING_SITE_KEY]: null,
  });
  return updated;
}

function isSite(value: unknown): value is Site {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Site>;
  return typeof candidate.origin === 'string' && typeof candidate.addedAt === 'number';
}
