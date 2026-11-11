import { describe, expect, it } from 'vitest';
import { paginateSites, searchSites, sortSitesNewestFirst } from '../../src/sites/site-list';
import type { Site } from '../../src/sites/site';

const sites: Site[] = [
  { origin: 'https://alpha.example', addedAt: 10 },
  { origin: 'https://beta.example', addedAt: 30 },
  { origin: 'https://gamma.example', addedAt: 20 },
];

describe('site list helpers', () => {
  it('sorts the newest websites first without mutating the input', () => {
    expect(sortSitesNewestFirst(sites).map((site) => site.origin)).toEqual([
      'https://beta.example',
      'https://gamma.example',
      'https://alpha.example',
    ]);
    expect(sites[0].origin).toBe('https://alpha.example');
  });

  it('searches origins without case sensitivity', () => {
    expect(searchSites(sites, 'BETA')).toEqual([sites[1]]);
  });

  it('returns the requested page and clamps out-of-range page numbers', () => {
    const manySites = Array.from({ length: 21 }, (_, index) => ({
      origin: `https://site-${index}.example`,
      addedAt: index,
    }));
    expect(paginateSites(manySites, 2).items).toHaveLength(10);
    expect(paginateSites(manySites, 99).currentPage).toBe(3);
    expect(paginateSites(manySites, 3).items).toHaveLength(1);
  });

  it('keeps empty results on a valid first page', () => {
    expect(paginateSites([], 1)).toMatchObject({
      items: [],
      currentPage: 1,
      totalItems: 0,
      totalPages: 1,
    });
  });
});
