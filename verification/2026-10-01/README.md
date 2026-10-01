# TAT verification - 1 October 2026

**Change:** self-host the brand icons, share image, team photo and footer wordmark. They pointed at old marbl.codes paths that went dead in the 28 Sept sweep (`530` from marbl.codes; the footer wordmark mask `/marbl/marblcodes.svg` was a `404`).

**Evidence (local `dist/` served under the real URL via Playwright, before deploy):**
- `asset-check.txt` - home and About at 390 and 1440: zero failed requests, zero broken images, all three icon links resolve to `/assets/brand/`.
- `tat-390.png`, `tat-1440.png`, `tat-about-390.png`, `tat-about-1440.png`, `footer-390.png`, `footer-1440.png` - guest render (fresh context, no cookies).
- `headers-live-before.txt` - live response headers. CSP `img-src` includes `'self'`, so the self-hosted images and the CSS mask are allowed.
- 47 root-relative `/assets/` references in the built HTML, all present in `dist/`.

**Not run:** Lighthouse. Asset URLs only; no layout, script or weight change worth measuring.

**Found, not fixed (pre-existing on live):** `/about/` overflows at 390 - `.kh-article` is 415px wide, document 435px. Flagged to Richard.

**After deploy:** Richard's phone check on tat.marbl.codes (favicon, footer wordmark, About photo).
