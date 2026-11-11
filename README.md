# CookieSync

CookieSync is a Chrome Manifest V3 extension starter based on [JohnBra/vite-web-extension](https://github.com/JohnBra/vite-web-extension), using React, TypeScript, Vite, CRXJS, and Tailwind CSS.

## Current scope

The popup lets the user maintain a list of website origins, stored in `chrome.storage.local`. Remote synchronization is not implemented. This version does not read, collect, display, upload, store, or replay cookie values. It requests no cookie or website host permissions.

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

- `src/pages/popup/` — React popup UI and styles.
- `src/sites/` — website-origin validation and local site-list storage.
- `public/icons/` — editable SVG cookie icon and Chrome-sized PNG exports.
- `manifest.json` — minimal MV3 manifest. Only the `storage` permission is present.
- `vite.config.chrome.ts` — Chrome build configuration using CRXJS.
- `tests/unit/` — unit tests for site URL validation.

The Go service/API, remote storage, cookie access, and automation-script client are outside this starter's implementation scope.
