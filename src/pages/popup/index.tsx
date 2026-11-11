import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { normalizeSiteUrl, type Site } from '../../sites/site';
import { sortSitesNewestFirst } from '../../sites/site-list';
import { loadSites, saveSites } from '../../sites/site-store';
import './popup.css';

function Popup() {
  const [sites, setSites] = useState<Site[]>([]);
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void loadSites()
      .then(setSites)
      .catch(() => setError('Could not load the saved website list.'))
      .finally(() => setLoaded(true));
  }, []);

  async function addSite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      const origin = normalizeSiteUrl(address);
      if (sites.some((site) => site.origin === origin)) {
        setError('That website is already on your list.');
        return;
      }
      const updated = sortSitesNewestFirst([...sites, { origin, addedAt: Date.now() }]);
      await saveSites(updated);
      setSites(updated);
      setAddress('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not add that website.');
    }
  }

  async function removeSite(origin: string) {
    const updated = sites.filter((site) => site.origin !== origin);
    try {
      await saveSites(updated);
      setSites(updated);
      setError('');
    } catch {
      setError('Could not remove that website.');
    }
  }

  return (
    <main className="popup-shell">
      <header className="brand-row">
        <div className="brand-mark" aria-hidden="true">CS</div>
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

      <form className="add-form" onSubmit={(event) => void addSite(event)}>
        <label htmlFor="site-address">Add a website</label>
        <div className="input-row">
          <input
            id="site-address"
            type="text"
            inputMode="url"
            autoComplete="url"
            placeholder="https://example.com"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            aria-describedby={error ? 'form-error' : 'site-help'}
          />
          <button type="submit" disabled={!loaded || !address.trim()} aria-label="Add website">+</button>
        </div>
        <p className="field-help" id="site-help">Enter a hostname or URL. The list stores its origin only.</p>
        {error && <p className="form-error" id="form-error" role="alert">{error}</p>}
      </form>

      <section className="site-section" aria-labelledby="sites-heading">
        <div className="section-heading">
          <h2 id="sites-heading">Selected websites</h2>
          <span className="count-badge">{sites.length}</span>
          <button className="view-all-button" type="button" onClick={() => void chrome.runtime.openOptionsPage()}>
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
        <p>This initial version does not access, collect, or send cookies.</p>
      </footer>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Popup />);
