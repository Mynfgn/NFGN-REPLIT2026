---
name: epub.js openAs requirement
description: ePub(url) treats URLs without a .epub extension as exploded-directory EPUBs unless openAs:"epub" is passed
---

## Rule

Always call `ePub(url, { openAs: "epub" })` when the URL does not end with `.epub`.

**Why:** epub.js infers input type from the URL path. If the path doesn't end with `.epub` (e.g. `/api/bookstore/books/2/stream?token=...`), epub.js opens it in "directory" mode — it treats the URL as a base path and tries to fetch `META-INF/container.xml`, `content.opf`, etc. as relative paths. All of those return 404. The book never opens.

**How to apply:** Any time epub.js is initialized with a non-standard URL (API proxy path, CDN URL without extension, signed URL):

```javascript
const epubBook = ePub(streamUrl, { openAs: "epub" });
```

**Symptom when missing:** Browser console / server logs show a cascade of 404s like:
```
GET /api/bookstore/books/2/META-INF/container.xml → 404
GET /api/bookstore/books/2/content.opf            → 404
```
and the reader stays on the spinner indefinitely.
