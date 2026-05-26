---
name: Production blank page fix
description: runtimeErrorOverlay Vite plugin must be excluded from production builds or it causes blank page (nav bar only) in the published app.
---

## Rule 1 — runtimeErrorOverlay must be dev-only
`@replit/vite-plugin-runtime-error-modal` (runtimeErrorOverlay) must be inside the dev-only plugin block in `artifacts/nfgn/vite.config.ts`. It must NOT be an unconditional plugin.

## Rule 2 — PORT and BASE_PATH must NOT be required (no throw) in vite.config.ts
Replit's deployment build step (`pnpm --filter @workspace/nfgn run build`) does NOT pass `PORT` or `BASE_PATH` as env vars. If vite.config.ts throws when they are missing, the production build silently fails and the old `dist/public` (possibly stale/wrong) gets served.

**Fix:** Use safe defaults: `const port = process.env.PORT ? Number(process.env.PORT) : 3000;` and `const basePath = process.env.BASE_PATH ?? "/";`. Neither value is embedded in the build output — PORT only configures the dev server, BASE_PATH sets the Vite `base` option (defaults to "/" which is correct for production).

**Why:** The plugin injects Replit-specific runtime code that connects to Replit's dev infrastructure. In the published/deployed app this connection fails and can prevent page content from rendering, leaving only the nav bar visible. The error is swallowed silently — no JS console errors, no error boundary trigger.

**How to apply:** Always keep runtimeErrorOverlay inside the `process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined` guard block alongside cartographer and devBanner.

Correct pattern in vite.config.ts:
```js
...(process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
  ? [
      runtimeErrorOverlay(),
      // cartographer, devBanner...
    ]
  : []),
```
