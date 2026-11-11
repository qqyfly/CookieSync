import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { loadServerUrl, saveServerUrl } from '../../settings/server-url';
import './settings.css';

function SettingsPage() {
  const [serverUrl, setServerUrl] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void loadServerUrl()
      .then(setServerUrl)
      .catch(() => setError('Could not load the saved server URL.'))
      .finally(() => setLoaded(true));
  }, []);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await saveServerUrl(serverUrl);
      setMessage(serverUrl.trim() ? 'Server URL saved on this device.' : 'Server URL removed.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the server URL.');
    }
  }

  return (
    <main className="settings-page">
      <header className="settings-header">
        <a className="back-link" href={chrome.runtime.getURL('src/pages/sites/index.html')}>
          <span aria-hidden="true">←</span> Selected websites
        </a>
        <div className="settings-brand">
          <img src="/icons/icon-48.png" alt="" width="40" height="40" />
          <div>
            <p className="settings-eyebrow">COOKIE SYNC</p>
            <h1>Settings</h1>
          </div>
        </div>
        <p className="settings-subtitle">Configure the service address for a future sync integration.</p>
      </header>

      <section className="settings-card" aria-labelledby="server-title">
        <div className="settings-card-heading">
          <span className="settings-symbol" aria-hidden="true">↗</span>
          <div>
            <h2 id="server-title">Remote server</h2>
            <p>Set the base URL for your self-hosted service.</p>
          </div>
          <span className="local-pill"><span /> Saved locally</span>
        </div>

        <form onSubmit={(event) => void handleSave(event)}>
          <label htmlFor="server-url">Server URL</label>
          <div className="server-input-row">
            <input
              id="server-url"
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder="https://api.example.com"
              value={serverUrl}
              onChange={(event) => {
                setServerUrl(event.target.value);
                setMessage('');
                setError('');
              }}
              disabled={!loaded}
              aria-describedby="server-help"
            />
            <button type="submit" disabled={!loaded}>Save</button>
          </div>
          <p id="server-help" className="server-help">Enter the service origin, optionally followed by a base path. Do not include credentials.</p>
          {error && <p className="settings-error" role="alert">{error}</p>}
          {message && <p className="settings-success" role="status">{message}</p>}
        </form>

        <div className="settings-notice">
          <span aria-hidden="true">ⓘ</span>
          <p>This version only saves the URL in this Chrome profile. It does not contact the server or sync cookie data.</p>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<SettingsPage />);
