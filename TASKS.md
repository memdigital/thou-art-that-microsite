# TAT Microsite — Task List

Tweaks and outstanding work for the Thou Art That microsite.

---

## Open

_Nothing outstanding from the 5 May 2026 session. Add items here as they come up._

### Watching (not blocking)

- **Orphan asset on marbl.codes** — `src/website/assets/audio/thou-art-that-nura.mp3` (3.4 MB) is no longer referenced after the page deletion + redirect. Decision deferred — kept until you confirm it can be binned. The TAT-namespaced image webp files (hero, connection, care, echo) are still referenced by the microsite's `og:image` tags, so they stay.
- **Audio mix recipe is gitignored-private** — `mix-with-bed.mjs` + `_bed-source-60s.mp3` live in `thou-art-that/audio-tools/` (intentionally gitignored alongside `generate-audio.mjs` for secrets-path + stinger-licensing reasons). Reproducible-for-Richard, not reproducible-for-public-forkers. Argus's Moirai note. No action needed unless we ever want public reproducibility.

---

## Done — 5 May 2026

- ✅ **Audio: bed mix under all 13 narrations** — generated lo-fi instrumental bed via ElevenLabs Music API, denoised, mixed under each voice file with stinger preserved. Initially mixed at 18 dB voice/bed separation, then dropped bed to volume=0.06 (≥22 dB separation) to clear WCAG 1.4.7 AAA after Moirai (Ratio) review. Recipe lives at `thou-art-that/audio-tools/mix-with-bed.mjs` (local).
- ✅ **GH repo widget — fresh stats** — migrated to v2.0.0 hybrid (build-time bake + shields.io live JSON upgrade on DOMContentLoaded). 2s `AbortController` timeout, defensive type checks, CLS-locked stat slots (`tabular-nums` + `min-width: 3ch`), `<link rel="preconnect">` to img.shields.io. Canonical (marbl-codes) + vendored (TAT) both shipped.
- ✅ **Redirect `marbl.codes/thou-art-that` → `tat.marbl.codes`** — `_redirects` 301 rule at marbl-codes site root (CF Pages format, not .htaccess — marbl.codes runs on Pages). Old page deleted. 7 internal footer/ecosystem links across marbl-codes pages updated to point at the subdomain directly.
- ✅ **Title accents on top-level pages** — canonical `.marbl-accent` (Petrona italic 800wt 1.1em ember) promoted from inline-on-each-page to canonical `marbl-fonts.css` utility. Applied to 7 multi-word top-level page titles via word-boundary regex in `build.mjs` (throws on zero-or-multi match). Single-word titles skipped per design.
- ✅ **About page — rename "The name" section to "Tat Tvam Asi"** — canonical Sanskrit transliteration. (Earlier rename of page title to "About this piece" was reverted after Moirai pushback — design must not drive content.)
