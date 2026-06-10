---
name: iOS Safari EPUB streaming
description: iOS Safari / WebKit intercepts application/epub+zip at the OS level even for Fetch/XHR API calls, not just navigation — causing a "Do you want to download stream.epub?" dialog before JavaScript can consume the response.
---

## The Rule
Never serve EPUB files with `Content-Type: application/epub+zip` from the stream endpoint. Always use `application/octet-stream`.

**Why:** iOS has registered OS-level MIME handlers for epub+zip. WebKit fires these handlers even when the response is consumed by `fetch()` or `XMLHttpRequest`, not by navigation. This manifests as a native download dialog that appears before the JavaScript ArrayBuffer is available, even when `Content-Disposition: inline` is set.

**How to apply:** In `artifacts/api-server/src/routes/bookstore.ts` → stream endpoint:
- `isEpubFile = rawUrl.toLowerCase().includes(".epub")`
- Set `Content-Type: application/octet-stream` (never epub+zip) for both the GCS and external-URL code paths
- Also strip any upstream `epub` MIME type via `safeContentType()` helper
- Add `X-Content-Type-Options: nosniff` to prevent content sniffing fallback

The frontend `EpubViewer` fetches the opaque binary as `ArrayBuffer`, then wraps in `new Blob([buffer], { type: "application/epub+zip" })` and creates a blob URL. epub.js receives the blob URL and processes it correctly — it never sees the HTTP response directly.

**Frontend side is also needed:** Even with the server fix, pass a blob URL (not the raw stream URL) to `ePub()`. The `EpubViewer` component already does this fetch-then-blob pattern. Both fixes must be in place.
