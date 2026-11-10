import type { Site } from './site';

const STORAGE_KEY = 'cookiesync.sites';

export async function loadSites(): Promise<Site[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const sites = result[STORAGE_KEY] as unknown;
  if (!Array.isArray(sites)) return [];
  return sites.filter(isSite).sort((a, b) => a.origin.localeCompare(b.origin));
}

export async function saveSites(sites: Site[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: sites });
}

function isSite(value: unknown): value is Site {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Site>;
  return typeof candidate.origin === 'string' && typeof candidate.addedAt === 'number';
}
