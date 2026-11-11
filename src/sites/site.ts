export interface Site {
  origin: string;
  addedAt: number;
}

export function normalizeSiteUrl(input: string): string {
  const candidate = input.trim();
  if (!candidate) {
    throw new Error('Enter a website address.');
  }

  let url: URL;
  try {
    const hasScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(candidate)
      || (/^[a-z][a-z\d+.-]*:/i.test(candidate) && !/^[a-z][a-z\d.-]*:\d+(?:\/|$)/i.test(candidate));
    url = new URL(hasScheme ? candidate : `https://${candidate}`);
  } catch {
    throw new Error('Enter a valid website address, such as https://example.com.');
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Only HTTP and HTTPS websites can be added.');
  }
  if (url.username || url.password) {
    throw new Error('Website addresses must not contain a username or password.');
  }
  if (!url.hostname || url.hostname.includes(' ')) {
    throw new Error('Enter a valid website hostname.');
  }

  return url.origin;
}

export function siteOriginPermissionPattern(origin: string): string {
  const url = new URL(origin);
  return `${url.protocol}//${url.hostname}/*`;
}
