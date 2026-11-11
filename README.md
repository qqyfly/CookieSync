# CookieSync

CookieSync is a Chrome Manifest V3 extension starter based on [JohnBra/vite-web-extension](https://github.com/JohnBra/vite-web-extension), using React, TypeScript, Vite, CRXJS, and Tailwind CSS.

## Current scope

The popup lets the user maintain a list of website origins, stored in `chrome.storage.local`; it shows the most recently added sites. **View all** opens a full-page list with search and pagination. Once permission is accepted for a website, the extension reads all cookies for the website list using `chrome.cookies.getAll` and prints them out to the console. Remote synchronization is not implemented.

The extension icon's right-click menu contains a single **Settings** item. The Settings page saves an optional remote server URL in `chrome.storage.local`. It does not make network requests; the backend and sync protocol are not implemented. **View all** opens the websites page directly in a new tab, without registering it as Chrome's built-in Options page.

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

- `src/pages/popup/` — compact React popup showing recently added sites and options to add the active site or read cookies.
- `src/pages/sites/` — full-page searchable, paginated site list with buttons to read cookies per site or for all sites.
- `src/pages/settings/` — local-only remote server URL setting.
- `src/background/` — service worker that adds the icon's single **Settings** context-menu item and handles cookie read requests.
- `src/cookies/` — reads cookies for individual sites or all sites in the website list using `chrome.cookies.getAll` and prints them to the console.
- `src/sites/` — website-origin validation and local site-list storage.
- `src/settings/` — server URL validation and local storage.
- `public/icons/` — editable SVG cookie icon and Chrome-sized PNG exports.
- `manifest.json` — MV3 manifest declaring `storage`, `contextMenus`, `activeTab`, `cookies`, and optional host permissions.
- `vite.config.chrome.ts` — Chrome build configuration using CRXJS.
- `tests/unit/` — unit tests for site URL validation, sorting, search, pagination, server URL validation, and cookie reading.

The Go service/API, remote storage, and automation-script client are outside this starter's implementation scope.
