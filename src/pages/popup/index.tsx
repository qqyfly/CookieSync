import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { normalizeSiteUrl, siteOriginPermissionPattern, type Site } from '../../sites/site';
import { finishPendingSite, loadPendingSite, loadSites, savePendingSite, saveSites } from '../../sites/site-store';
import { readSiteCookies, readSiteListCookies } from '../../cookies/cookies';
import './popup.css';

// Expose on window for easy access in DevTools console
Object.assign(window, { readSiteListCookies, readSiteCookies });

function Popup() {
  const [sites, setSites] = useState<Site[]>([]);
  const [currentSite, setCurrentSite] = useState('');
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        let storedSites = await loadSites();
        const pendingSite = await loadPendingSite();
        if (pendingSite) {
          const permissionPattern = siteOriginPermissionPattern(pendingSite.origin);
          const granted = await chrome.permissions.contains({ origins: [permissionPattern] });
          storedSites = await finishPendingSite(pendingSite, granted);
          if (granted) {
            void readSiteListCookies(storedSites);
          }
        }
        setSites(storedSites);
      } catch {
        setError('Could not load the saved website list.');
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    void chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab?.url) {
        try {
          setCurrentSite(normalizeSiteUrl(tab.url));
        } catch {
          setCurrentSite('');
        }
      }
    });
  }, []);

  async function addCurrentSite() {
    setError('');
    if (!currentSite) {
      setError('Open an HTTP or HTTPS website, then try again.');
      return;
    }
    if (sites.some((site) => site.origin === currentSite)) {
      setError('That website is already on your list.');
      return;
    }

    setAdding(true);
    const permissionPattern = siteOriginPermissionPattern(currentSite);
    const pendingSite = { origin: currentSite, addedAt: Date.now() };
    try {
      // Request immediately from the click handler so Chrome can show its permission prompt.
      const permissionRequest = chrome.permissions.request({ origins: [permissionPattern] });
      const pendingWrite = savePendingSite(pendingSite);
      const granted = await permissionRequest;
      await pendingWrite;
      const updated = await finishPendingSite(pendingSite, granted);
      setSites(updated);
      if (!granted) {
        setError('Permission was not granted, so the website was not added.');
      } else {
        // Read cookies after accepting read cookie permission
        if (!chrome?.cookies) {
          setError('Reload extension at chrome://extensions to apply "cookies" permission.');
        } else {
          try {
            await readSiteListCookies(updated);
          } catch (cookieErr) {
            console.error('[CookieSync] Error reading cookies after permission grant:', cookieErr);
          }
        }
      }
    } catch (cause) {
      await finishPendingSite(pendingSite, false).catch(() => undefined);
      await chrome.permissions.remove({ origins: [permissionPattern] }).catch(() => false);
      setError(cause instanceof Error ? cause.message : 'Could not add that website.');
    } finally {
      setAdding(false);
    }
  }

  async function removeSite(origin: string) {
    const updated = sites.filter((site) => site.origin !== origin);
    try {
      await saveSites(updated);
      setSites(updated);
      await chrome.permissions.remove({ origins: [siteOriginPermissionPattern(origin)] });
      setError('');
    } catch {
      setError('Could not remove that website.');
    }
  }

  return (
    <main className="popup-shell">
      <header className="brand-row">
        <img className="brand-mark" src="/icons/icon-48.png" alt="CookieSync logo" width="38" height="38" />
        <div>
          <p className="eyebrow">COOKIE SYNC</p>
          <h1>Website list</h1>
        </div>
        <span className="status-pill"><span /> Local only</span>
      </header>

      <section className="intro-card" aria-label="Current project status">
        <div className="intro-icon" aria-hidden="true">↗</div>
        <div>
          <p className="intro-title">Sync is not connected</p>
          <p className="intro-copy">This starter saves your selected websites on this device. Remote sync is not implemented.</p>
        </div>
      </section>

      <section className="add-form" aria-label="Add the current website">
        <button className="add-current-button" type="button" onClick={() => void addCurrentSite()} disabled={!loaded || !currentSite || adding}>
          {adding ? 'Requesting permission…' : 'Add current site'}
        </button>
        <p className="field-help" id="site-help">
          {currentSite ? `Current site: ${new URL(currentSite).hostname}. Chrome will ask before granting site access.` : 'Open an HTTP or HTTPS website to add it.'}
        </p>
        {error && <p className="form-error" id="form-error" role="alert">{error}</p>}
      </section>

      <section className="site-section" aria-labelledby="sites-heading">
        <div className="section-heading">
          <h2 id="sites-heading">Selected websites</h2>
          <span className="count-badge">{sites.length}</span>
          <button
            className="view-all-button"
            type="button"
            onClick={() => void chrome.tabs.create({ url: chrome.runtime.getURL('src/pages/sites/index.html') })}
          >
            View all <span aria-hidden="true">↗</span>
          </button>
        </div>
        {!loaded ? (
          <p className="empty-state">Loading your list…</p>
        ) : sites.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon" aria-hidden="true">◎</span>
            <p>No websites yet</p>
            <span>Add a site above to get started.</span>
          </div>
        ) : (
          <ul className="site-list">
            {sites.slice(0, 3).map((site) => (
              <li className="site-item" key={site.origin}>
                <span className="site-favicon" aria-hidden="true">{site.origin.replace(/^https?:\/\//, '').charAt(0).toUpperCase()}</span>
                <span className="site-origin">{site.origin.replace(/^https?:\/\//, '')}</span>
                <button className="remove-button" type="button" onClick={() => void removeSite(site.origin)} aria-label={`Remove ${site.origin}`} title="Remove website">×</button>
              </li>
            ))}
          </ul>
        )}
        {loaded && sites.length > 3 && (
          <p className="latest-note">Showing the 3 most recently added websites.</p>
        )}
      </section>

      <footer className="privacy-note">
        <span aria-hidden="true">◇</span>
        <p>Cookies for accepted websites are read locally and printed to the console.</p>
      </footer>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Popup />);
