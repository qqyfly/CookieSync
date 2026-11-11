const STORAGE_KEY = 'cookiesync.serverUrl';

export async function loadServerUrl(): Promise<string> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return typeof result[STORAGE_KEY] === 'string' ? result[STORAGE_KEY] : '';
}

export async function saveServerUrl(value: string): Promise<void> {
  const normalized = normalizeServerUrl(value);
  if (normalized) {
    await chrome.storage.local.set({ [STORAGE_KEY]: normalized });
  } else {
    await chrome.storage.local.remove(STORAGE_KEY);
  }
}

export function normalizeServerUrl(input: string): string {
  const candidate = input.trim();
  if (!candidate) return '';

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error('Enter a full server URL, such as https://api.example.com.');
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('The server URL must use HTTPS or HTTP.');
  }
  if (url.username || url.password) {
    throw new Error('Do not include a username or password in the server URL.');
  }
  if (url.search || url.hash) {
    throw new Error('The server URL must not include a query string or fragment.');
  }

  const path = url.pathname.replace(/\/+$/, '');
  return `${url.origin}${path}`;
}
