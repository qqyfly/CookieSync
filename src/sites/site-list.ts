import type { Site } from './site';

export const SITE_PAGE_SIZE = 10;

export interface SitePage {
  items: Site[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
}

export function sortSitesNewestFirst(sites: Site[]): Site[] {
  return [...sites].sort((a, b) => b.addedAt - a.addedAt || a.origin.localeCompare(b.origin));
}

export function searchSites(sites: Site[], query: string): Site[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return sites;
  return sites.filter((site) => site.origin.toLocaleLowerCase().includes(needle));
}

export function paginateSites(
  sites: Site[],
  requestedPage: number,
  pageSize = SITE_PAGE_SIZE,
): SitePage {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const totalPages = Math.max(1, Math.ceil(sites.length / safePageSize));
  const currentPage = Math.min(totalPages, Math.max(1, Math.floor(requestedPage) || 1));
  const start = (currentPage - 1) * safePageSize;

  return {
    items: sites.slice(start, start + safePageSize),
    currentPage,
    totalItems: sites.length,
    totalPages,
  };
}
