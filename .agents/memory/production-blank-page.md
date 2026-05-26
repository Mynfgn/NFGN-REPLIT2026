---
name: Production blank page fix
description: runtimeErrorOverlay Vite plugin must be excluded from production builds or it causes blank page (nav bar only) in the published app.
---

## The Rule
`@replit/vite-plugin-runtime-error-modal` (runtimeErrorOverlay) must be inside the dev-only plugin block in `artifacts/nfgn/vite.config.ts`. It must NOT be an unconditional plugin.

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
