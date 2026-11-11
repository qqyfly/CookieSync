# CookieSync

CookieSync is a Chrome Manifest V3 extension starter based on [JohnBra/vite-web-extension](https://github.com/JohnBra/vite-web-extension), using React, TypeScript, Vite, CRXJS, and Tailwind CSS.

## Current scope

The popup lets the user maintain a list of website origins, stored in `chrome.storage.local`; it shows the five most recently added sites. **View all** opens a full-page list with search and pagination. Remote synchronization is not implemented. This version does not read, collect, display, upload, store, or replay cookie values. It requests no cookie or website host permissions.

The extension icon's right-click menu contains a single **Settings** item. The Settings page saves an optional remote server URL in `chrome.storage.local`. It does not make network requests; the backend and sync protocol are not implemented.

## Development

Requirements: Node.js 22 or newer and npm.

```sh
npm install
npm run dev
```

`npm run dev` watches the source files and writes transformed extension files to `dist_chrome/`. In `chrome://extensions`, remove any old CookieSync entry that points at the project root, then use **Load unpacked** and select the `dist_chrome/` folder. After a source change rebuilds, click the extension's reload button to load the new output. Do not load the project root or open the source popup HTML directly; Chrome must load the built extension so `.tsx` is compiled to JavaScript.

For a one-time production package:

```sh
npm run check
npm run build
```

Load `dist_chrome/` as an unpacked extension to try the production build. The popup's selected-site list is local to the current Chrome profile.

## Project layout

- `src/pages/popup/` — compact React popup showing the latest five sites.
- `src/pages/sites/` — full-page searchable, paginated site list.
- `src/pages/settings/` — local-only remote server URL setting.
- `src/background/` — service worker that adds the icon's single **Settings** context-menu item.
- `src/sites/` — website-origin validation and local site-list storage.
- `src/settings/` — server URL validation and local storage.
- `public/icons/` — editable SVG cookie icon and Chrome-sized PNG exports.
- `manifest.json` — MV3 manifest with `storage` and `contextMenus` permissions; no cookie or host permissions.
- `vite.config.chrome.ts` — Chrome build configuration using CRXJS.
- `tests/unit/` — unit tests for site URL validation, sorting, search, pagination, and server URL validation.

The Go service/API, remote storage, cookie access, and automation-script client are outside this starter's implementation scope.
