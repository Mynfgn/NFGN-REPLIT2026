---
name: Authorize.net Accept.js constraints
description: Critical requirements and gotchas for integrating Authorize.net Accept.js tokenization
---

# Authorize.net Accept.js — Critical Constraints

## Rules
1. **Must be a static `<script>` tag in index.html** — dynamic injection via `document.createElement('script')` triggers error `E_WC_03` regardless of whether the script loads. Authorize.net detects dynamic injection.
2. **Does not work inside iframes** — triggers `E_WC_03`. The Replit preview pane is an iframe. Always test in a real browser tab or the published URL.
3. **Sandbox vs production credentials are completely separate** — sandbox credentials work only with `jstest.authorize.net/v1/Accept.js` and `apitest.authorize.net`; production credentials work only with `js.authorize.net/v1/Accept.js` and `api.authorize.net`. Mixing causes "User authentication failed" (E_WC_07-style errors).
4. **Client Key ≠ Transaction Key** — the Public Client Key is generated separately in Authorize.net under Account → Security Settings → Manage Public Client Key. It's NOT the Transaction Key.

**Why:** Accept.js is a browser-side PCI-DSS tokenizer. Authorize.net enforces these constraints server-side during the tokenization request.

**How to apply:** In `index.html` use the static tag. Control sandbox/production via `AUTHORIZENET_SANDBOX` env var on the backend; the backend serves the correct `acceptJsUrl` from `/api/payments/authorizenet/config`.
