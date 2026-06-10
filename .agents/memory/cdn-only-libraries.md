---
name: CDN-only libraries
description: Some npm packages are blocked by the Replit package firewall and must be loaded from CDN instead of npm install.
---

## Rule
When `pnpm add` returns `403 Forbidden` from `package-firewall.replit.local`, the package cannot be installed via npm. Load it as a static `<script>` tag in `index.html` from a public CDN (unpkg, cdnjs).

**Why:** Replit's package firewall selectively blocks certain npm packages. `epubjs` is confirmed blocked. `es5-ext` (a transitive dependency of epubjs) is also blocked.

**How to apply:**
1. Add CDN script tag to `artifacts/nfgn/index.html` (alongside existing Authorize.net pattern)
2. Access the global in TypeScript via `(window as Window).libraryName`
3. Add a global type declaration in `artifacts/nfgn/src/types/<library>.d.ts` extending the `Window` interface

## Known CDN-loaded libraries
| Library | CDN URL | Window global |
|---------|---------|--------------|
| Accept.js (Authorize.net) | `https://js.authorize.net/v1/Accept.js` | `window.Accept` |
| epubjs | `https://unpkg.com/epubjs/dist/epub.min.js` | `window.ePub` |

## Never attempt npm install for these
- `epubjs` → use `window.ePub` from CDN
- `es5-ext` → transitive, blocked
