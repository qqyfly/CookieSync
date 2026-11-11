# CookieSync architecture proposal

**Status:** Approved for the initial starter; remote sync remains a future design phase  
**Scope:** A Chrome-only Manifest V3 extension for a user-selected website list, with planned remote synchronization through a Go service. The initial implementation stores only website origins locally. It does not read or transmit cookies or replay sessions.

## Product model and security boundary

Cookie values are bearer credentials: anyone who obtains a valid session cookie may be able to act as that account without its password. The extension and future service must therefore be treated as credential-management software, not as ordinary settings synchronization.

This proposal assumes the user is syncing their own browser sessions for websites and automation they own or are explicitly authorized to operate. Site selection must be explicit and visible. Do not silently collect cookies, broaden access to all sites, or expose snapshots to unauthenticated clients. The future service must authenticate the extension and the consuming script, authorize them to the same user/site scope, protect cookie values in transit and at rest, and never log cookie values. Provide per-site disable and remote delete/revoke behavior.

The current starter is deliberately limited to managing site origins in `chrome.storage.local`, saving a server URL locally, and opening Settings from the extension icon's context menu. It requests `storage` and `contextMenus`; it has no cookie or host permissions. Cookie capture, network sync, backend code, and script-side retrieval are not part of this implementation.

Prefer a Go HTTPS API as the only client-facing boundary. The extension should not connect directly to SQL or MQTT. A practical initial server design is authenticated HTTPS upload/read endpoints with encrypted SQL-backed snapshots; MQTT can publish a small “snapshot updated” notification for consumers. Do not publish raw cookie values to a broadly subscribed MQTT topic. If MQTT must carry cookie payloads, it needs strict topic ACLs, TLS, client authentication, and payload encryption. Keep the transport/storage choice behind the Go service so the extension protocol does not depend on either database or broker.

### Expected data flow

```text
User selects and authorizes a site in popup
        │
        ▼
Extension service worker ── reads only that site's cookies ──► HTTPS Go API
                                                               │
                                              encrypted snapshot in SQL
                                              optional MQTT update notice
                                                               │
                                                               ▼
                                            authenticated user-owned script
                                            fetches latest authorized snapshot
```

The extension can be developed first with an interface and a local fake API for development, but real remote synchronization is a later phase. The Go API contract should be agreed before implementing the production client. It should define user identity, site identity, snapshot version/time, cookie schema, expiry/overwrite semantics, deletion, errors, and authentication. Do not build the browser extension around assumptions about SQL or MQTT internals.

## Official guidance and template review

### Chrome and TypeScript guidance

- Chrome's `cookies` API requires both the `cookies` permission and host permissions for the cookie hosts. The permissions guidance recommends optional permissions where practical. For a user-added website list, request `optional_host_permissions` for the exact site when the user adds it, and remove that grant when the site is removed where Chrome allows it. Avoid a permanent broad host grant. [Chrome: cookies API](https://developer.chrome.com/docs/extensions/reference/api/cookies) · [Chrome: declare permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions)
- Extension service workers are event-driven, can be suspended and restarted, and cannot access the DOM. Keep event registration at the service-worker entry point and persist durable state rather than depending on in-memory globals. [Chrome: extension service workers](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers)
- Extension pages/service workers can make cross-origin `fetch()` calls when the manifest grants host permission for the remote service. Keep that permission limited to the configured API origin. [Chrome: cross-origin network requests](https://developer.chrome.com/docs/extensions/develop/concepts/network-requests)
- Use `chrome.storage` for extension settings and non-secret state such as selected site patterns and sync status. Do not treat extension storage as a secure vault for long-lived API secrets. [Chrome: storage API](https://developer.chrome.com/docs/extensions/reference/api/storage)
- TypeScript's official docs define `tsconfig.json` as project configuration and provide `tsc --init`; TypeScript does not mandate a universal directory layout. Project references are intended for larger codebases and are unnecessary here. [TypeScript: tsconfig.json](https://www.typescriptlang.org/docs/handbook/tsconfig-json) · [TypeScript: project references](https://www.typescriptlang.org/docs/handbook/project-references)
- Chrome does not offer an official extension generator. Use the official Chrome samples for API patterns and `npm init` / `tsc --init` for the basic project. Use Vite plus CRXJS for the separate MV3 entry points and packaged output, without a full extension framework or UI framework.

### Open-source template references

| Template | Useful practices | Not adopted initially |
| --- | --- | --- |
| [GoogleChrome/chrome-extensions-samples](https://github.com/GoogleChrome/chrome-extensions-samples) | First-party examples for extension APIs and Manifest V3 behavior. | A collection of samples is not a single application scaffold. |
| [antfu-collective/vitesse-webext](https://github.com/antfu-collective/vitesse-webext) | Vite-powered extension build and explicit extension entry points. | Vue, UnoCSS, auto-imports, and its broader starter ecosystem. |
| [JohnBra/vite-web-extension](https://github.com/JohnBra/vite-web-extension) | TypeScript, Vite, MV3, and explicit organization of extension surfaces. | React, Tailwind, cross-browser support, and unused pages. |

The proposal adopts the shared useful practices: distinct execution-context entry points, a reproducible package build, strict types, linting, unit tests for pure logic, and an explicit Chrome debugging workflow. It avoids multiple UI frameworks, broad permissions, cross-browser compatibility layers, and pre-created extension pages.

## Proposed directory structure

```text
CookieSync/
├── .github/workflows/ci.yml        # lint, typecheck, unit tests, production build
├── docs/architecture.md            # architecture and future API/security decisions
├── public/icons/                   # editable SVG source and PNG extension icons
├── src/background/                 # service-worker registration for the icon context menu
├── src/pages/popup/                # React popup with the five most recently added sites
├── src/pages/sites/                # full-page searchable and paginated site list
├── src/pages/settings/             # local-only remote server URL setting
├── src/settings/                   # server URL validation and local storage
├── src/sites/                      # website URL validation and local list storage
├── tests/unit/                     # Vitest tests for site validation, search and pagination
├── manifest.json                   # MV3 permissions, icon, popup, options page and worker
├── vite.config.chrome.ts           # Vite + CRXJS Chrome build
├── eslint.config.mjs               # TypeScript-aware static analysis
├── package.json                    # scripts and dependencies
├── tsconfig.json                   # strict TypeScript configuration
├── .editorconfig / .gitignore      # editor defaults and generated-file exclusions
└── README.md                       # setup, development, and current scope
```

The current starter does not yet define a sync client or cookie adapter. Add them only in a later, separately reviewed phase. A separate Go service repository should own API handlers, authentication, authorization, encryption/key management, SQL persistence, and optional MQTT notifications. Cookie access, if later approved for authorized use, belongs in an explicit extension permission boundary and does not require a content script.

### Directory and configuration responsibilities

| Path | Purpose |
| --- | --- |
| `manifest.json` | Authored MV3 manifest at the repository root, following the selected template. It declares `storage` and `contextMenus`; no cookie or website host permissions are requested. |
| `src/background/` | Registers the extension icon's one **Settings** right-click menu item and opens the settings page when selected. |
| `src/popup/` | User-facing site allowlist and controls for add, enable, disable, sync, delete, and sync status. Never display full cookie values; display only safe metadata such as site, last sync time, and outcome. |
| `src/sites/` | Validates and stores user-selected origins and coordinates Chrome optional host permission requests. Reject malformed URLs and normalize to exact origins; do not accept arbitrary wildcard patterns from input. |
| `src/cookies/` | Encapsulates Chrome cookie API use and snapshot conversion. Only include cookies matching enabled sites; preserve required attributes such as domain/path/secure/HTTP-only/expiry as required for an authorized consumer. Never log values or put them in error messages. |
| `src/sync/` | Future HTTPS client and protocol boundary. Send data only to the configured, trusted API origin over TLS. Keep authentication material short-lived where possible and out of source control, logs, and ordinary extension settings. |
| `src/domain/` | Deterministic site/snapshot rules independent of Chrome, network, and DOM APIs. Keep it small and directly testable. |
| `src/shared/` | Small shared data types/constants used by multiple contexts; avoid a general-purpose utility dumping ground. |
| `public/icons/` | Static icons copied into the built package. |
| `tests/unit/` | Vitest tests for URL validation, site scoping, snapshot selection, and sync-state rules. Browser API integration is verified in Chrome. Never use real session cookies in fixtures. |
| `docs/` | Human-maintained architecture and protocol decisions. Update when the actual API or data flow is agreed. |
| `.github/workflows/ci.yml` | Runs lint, typecheck, unit tests, and build on pull requests/default branch. It currently uses `npm install`; commit a generated lockfile and switch CI to `npm ci` when dependency installation is available. It does not publish or upload cookie data. |
| `AGENTS.md` | Short agent rules: architecture boundaries, permission review, handling of secrets, commands, expected manual checks, and required handoff summary. Link to this file instead of duplicating it. |
| `.editorconfig` | Consistent formatting defaults. |
| `.gitignore` | Excludes `node_modules/`, `dist/`, coverage, local environment files, and editor state. Commit source and the npm lockfile. |
| `package.json` / `package-lock.json` | npm scripts and direct development dependencies. Commit the generated npm lockfile for reproducible installs; use one package manager and one lockfile. |
| `tsconfig.json` | Strict checking, module/target settings for Vite, and Chrome API types. Use one Chrome type package and keep it aligned to the supported Chrome version. |
| `eslint.config.js` | TypeScript-aware static analysis for correctness. Keep formatting rules in EditorConfig or a formatter rather than duplicating them in lint. |
| `vite.config.ts` | Vite and CRXJS configuration for popup/service-worker inputs and an installable package in `dist/`. Keep custom build logic small. |

## Cookie synchronization and remote service design

1. **Site enrollment:** The user enters/selects a website in the popup. The extension validates and normalizes its origin, explains that the site's current session cookies will be sent to the configured service, then requests optional host access for that site. Each site can be paused or removed independently.
2. **Snapshot capture:** The service worker reads cookies only for enrolled and enabled sites using `chrome.cookies`. Cookie events may mark a site's snapshot dirty and schedule a sync. The extension should avoid unnecessarily frequent full snapshots and must tolerate service-worker suspension.
3. **Upload:** The future client sends a bounded, versioned snapshot to the configured Go API over HTTPS. The API authenticates the extension, checks user/site authorization, validates size and schema, and encrypts cookie values at rest. API credentials must not be hard-coded, committed, or logged.
4. **Storage and notification:** Prefer SQL for durable “latest snapshot” state. If consumers need push notification, MQTT should signal that a version changed; the consumer then fetches the authorized snapshot over the API. This keeps bearer cookie values out of broker topics and retained messages. A different choice requires a documented threat model and access controls.
5. **Consumption:** The separate automation script authenticates as the same authorized user/service identity, requests only the named site's latest snapshot, checks expiry/version, and uses it only for the approved automation. It must not query other users' or sites' snapshots.
6. **Disable and removal:** Disabling stops capture and upload. Removing a site requests remote deletion, removes local site state, and relinquishes the optional host permission when possible. Provide a full account-level revoke/delete operation in the future service.

The initial extension proposal does not select an authentication protocol. Before implementing real sync, decide how the extension and scripts authenticate without embedding a reusable service secret in a downloadable extension. Define key rotation, rate limits, audit events that exclude cookie values, server-side retention/expiry, backup protection, and account-level revocation as part of the Go service design.

## Build, test, and debugging choices

- **Build/development:** Vite plus `@crxjs/vite-plugin` for MV3 packaging. The development command runs Vite's build watcher and writes compiled output to `dist_chrome/`; load that directory as an unpacked extension and reload it after rebuilds. No UI framework beyond the selected React template and no general extension framework.
- **Language/API types:** TypeScript strict mode, `typescript`, and one Chrome API typing package (`@types/chrome` or `chrome-types`).
- **Unit tests:** Vitest for pure site validation, cookie selection, snapshot metadata, and state-transition rules. Use synthetic cookie fixtures only. Keep Chrome API calls behind narrow boundaries so they can be separately checked in Chrome.
- **Static analysis:** ESLint with TypeScript-aware rules. Provide `lint`, `typecheck`, `test`, `build`, and combined `check` scripts.
- **Git/CI:** Commit source, documentation, workflow, and lockfile. Ignore build output and test coverage. CI runs `npm install` then `npm run check` until the lockfile is generated, then should use `npm ci`. It must not use live browser profiles, credentials, or cookie fixtures from real sites.
- **Debugging:** Load `dist/` unpacked via `chrome://extensions`. Inspect the service worker from the extension card and popup through its DevTools. Never paste cookie values into console logs or bug reports. Validate permissions and exercise add/disable/remove flows with test accounts and synthetic or disposable sessions.

## Development workflow for people and AI coding agents

1. Read `AGENTS.md`, this architecture, the relevant Chrome API docs, and acceptance criteria before editing.
2. Identify whether the change belongs to site enrollment, cookie capture, sync protocol, popup, or pure domain rules. Keep Chrome/network effects at explicit boundaries.
3. For any cookie or host-permission change, document the minimum permission and site scope. Do not broaden access as a convenience.
4. For API work, use a fake/local service and synthetic cookies. Do not capture or transmit real cookies during automated tests or agent work.
5. Make focused changes, add unit tests for deterministic logic, and avoid new abstractions/dependencies without a concrete need.
6. Run `npm run check`, then manually exercise the changed flow in Chrome with a disposable test account. Report commands, manual checks, and known gaps in the handoff.
7. Use reviewable Git commits or pull requests. Never commit cookies, API tokens, browser-profile data, or production snapshots.
8. Update this document and `AGENTS.md` when the structure, permissions, API contract, or data flow changes.

## Decision summary

Use a small TypeScript MV3 extension with a popup-controlled site allowlist, per-site optional host permission requests, a service-worker cookie reader, and a future HTTPS client to a Go API. Keep the extension independent from SQL and MQTT. Start with durable SQL snapshots behind the API and use MQTT only for update notifications if needed. Treat cookie values as credentials throughout collection, transfer, storage, testing, debugging, and deletion. Add more extension surfaces or infrastructure only when a concrete requirement calls for them.
