import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Site } from '../../sites/site';
import { paginateSites, searchSites, SITE_PAGE_SIZE, sortSitesNewestFirst } from '../../sites/site-list';
import { loadSites, saveSites } from '../../sites/site-store';
import { readSiteCookies, readSiteListCookies } from '../../cookies/cookies';
import './sites.css';

// Expose on window for easy access in DevTools console
Object.assign(window, { readSiteListCookies, readSiteCookies });

function SelectedSitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const refresh = () => {
      void loadSites()
        .then((nextSites) => {
          if (active) setSites(nextSites);
        })
        .catch(() => {
          if (active) setError('Could not load the saved website list.');
        })
        .finally(() => {
          if (active) setLoaded(true);
        });
    };

    const onStorageChanged = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
      if (area === 'local' && changes['cookiesync.sites']) refresh();
    };

    refresh();
    chrome.storage.onChanged.addListener(onStorageChanged);
    return () => {
      active = false;
      chrome.storage.onChanged.removeListener(onStorageChanged);
    };
  }, []);

  const filtered = useMemo(
    () => searchSites(sortSitesNewestFirst(sites), query),
    [sites, query],
  );
  const result = useMemo(() => paginateSites(filtered, page), [filtered, page]);
  const pageNumbers = useMemo(() => {
    const first = Math.max(1, Math.min(result.currentPage - 2, result.totalPages - 4));
    const last = Math.min(result.totalPages, first + 4);
    return Array.from({ length: last - first + 1 }, (_, index) => first + index);
  }, [result.currentPage, result.totalPages]);

  async function removeSite(origin: string) {
    const updated = sites.filter((site) => site.origin !== origin);
    try {
      await saveSites(updated);
      setSites(sortSitesNewestFirst(updated));
      setError('');
    } catch {
      setError('Could not remove that website.');
    }
  }

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  async function handleReadCookies(origin?: string) {
    if (!chrome?.cookies) {
      setError('Please reload the extension at chrome://extensions (click ↺ on CookieSync) to activate the newly added "cookies" permission.');
      return;
    }
    setError('');
    if (origin) {
      await readSiteCookies(origin);
    } else {
      await readSiteListCookies(sites);
    }
  }

  return (
    <main className="sites-page">
      <header className="sites-header">
        <div className="sites-brand">
          <img src="/icons/icon-48.png" alt="" width="40" height="40" />
          <div>
            <p className="sites-eyebrow">COOKIE SYNC</p>
            <h1>Selected websites</h1>
          </div>
        </div>
        <p className="sites-subtitle">Search and manage every website in your local list.</p>
      </header>

      <section className="sites-card" aria-labelledby="list-title">
        <div className="sites-toolbar">
          <div>
            <h2 id="list-title">Website list</h2>
            <p>{result.totalItems} {result.totalItems === 1 ? 'website' : 'websites'}</p>
          </div>
          <div className="toolbar-actions">
            <button
              className="read-all-button"
              type="button"
              onClick={() => void handleReadCookies()}
              disabled={sites.length === 0}
              title="Read all cookies for saved websites and print to console"
            >
              Read all cookies
            </button>
            <label className="search-box">
              <span className="search-icon" aria-hidden="true">⌕</span>
              <span className="sr-only">Search websites</span>
              <input
                type="search"
                placeholder="Search websites"
                value={query}
                onChange={(event) => updateQuery(event.target.value)}
              />
              {query && <button type="button" onClick={() => updateQuery('')} aria-label="Clear search">×</button>}
            </label>
          </div>
        </div>

        {error && <p className="sites-error" role="alert">{error}</p>}
        {!loaded ? (
          <div className="sites-empty">Loading websites…</div>
        ) : result.totalItems === 0 ? (
          <div className="sites-empty">
            <span className="sites-empty-icon" aria-hidden="true">◎</span>
            <strong>{query ? 'No matches found' : 'No websites yet'}</strong>
            <span>{query ? 'Try a different search.' : 'Add websites from the extension popup.'}</span>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Website</th>
                    <th scope="col">Added</th>
                    <th scope="col"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((site) => (
                    <tr key={site.origin}>
                      <td>
                        <div className="site-cell">
                          <span className="site-avatar" aria-hidden="true">
                            {site.origin.replace(/^https?:\/\//, '').charAt(0).toUpperCase()}
                          </span>
                          <span>{site.origin.replace(/^https?:\/\//, '')}</span>
                        </div>
                      </td>
                      <td className="date-cell">{new Date(site.addedAt).toLocaleDateString()}</td>
                      <td className="action-cell">
                        <button
                          type="button"
                          className="read-site-button"
                          onClick={() => void handleReadCookies(site.origin)}
                          aria-label={`Read cookies for ${site.origin}`}
                          title="Read cookies and print to console"
                        >
                          Read cookies
                        </button>
                        <button type="button" onClick={() => void removeSite(site.origin)} aria-label={`Remove ${site.origin}`}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <nav className="pagination" aria-label="Website pages">
              <span className="pagination-summary">
                Showing {Math.min((result.currentPage - 1) * SITE_PAGE_SIZE + 1, result.totalItems)}–{Math.min(result.currentPage * SITE_PAGE_SIZE, result.totalItems)} of {result.totalItems}
              </span>
              <div className="pagination-controls">
                <button type="button" onClick={() => setPage(result.currentPage - 1)} disabled={result.currentPage === 1}>
                  Previous
                </button>
                {pageNumbers.map((number) => (
                  <button
                    className={number === result.currentPage ? 'page-number active' : 'page-number'}
                    type="button"
                    key={number}
                    onClick={() => setPage(number)}
                    aria-label={`Page ${number}`}
                    aria-current={number === result.currentPage ? 'page' : undefined}
                  >
                    {number}
                  </button>
                ))}
                <button type="button" onClick={() => setPage(result.currentPage + 1)} disabled={result.currentPage === result.totalPages}>
                  Next
                </button>
              </div>
            </nav>
          </>
        )}
      </section>

      <footer className="sites-footer">
        <span aria-hidden="true">◇</span>
        <p>Websites are stored locally in this Chrome profile. Cookies are read locally and printed to the console.</p>
      </footer>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<SelectedSitesPage />);
