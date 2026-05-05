# TAT Microsite — Task List

Tweaks and outstanding work for the Thou Art That microsite.

---

## Open

_Nothing outstanding. Add items here as they come up._

### Watching (not blocking)

- **Orphan asset on marbl.codes** — `src/website/assets/audio/thou-art-that-nura.mp3` (3.4 MB) is no longer referenced after the page deletion + redirect. Decision deferred — kept until you confirm it can be binned. The TAT-namespaced image webp files (hero, connection, care, echo) are still referenced by the microsite's `og:image` tags, so they stay.
- **Audio mix recipe is gitignored-private** — `mix-with-bed.mjs` + `_bed-source-60s.mp3` live in `thou-art-that/audio-tools/` (intentionally gitignored alongside `generate-audio.mjs` for secrets-path + stinger-licensing reasons). Reproducible-for-Richard, not reproducible-for-public-forkers. Argus's Moirai note. No action needed unless we ever want public reproducibility.
- **Residual CLS ~0.36 from waveform-player reveal** — Fathom tracking pixel suppression cleared 0.37 of the original 0.41 CLS, but the `mwp-fallback-reveal` animation in `waveform-player.css` still shifts layout when the player initialises. Lighthouse mobile agentic-browsing dropped from 100 to 76 because of this. Not blocking a11y/SEO/best-practices (all 100/100/100). Separate fix when there's an audio-component pass — the animation needs to reserve its final height or use compositor-only properties.
- **Stylelint debt on legacy marbl.codes pages** — about.html, index.html, ecosystem.html, marbl-home.css carry ~40 pre-existing raw colour/spacing values that should be canonical tokens. Pre-commit hook flags them. Tonight's accent fix on these files used `--no-verify` per Richard's call. Cleanup deferred to the legacy-page rebuild pass.

---

## Done — 5 May 2026 (evening — canonical hardening session)

- ✅ **Lighthouse audit on TAT** — desktop 100/100/100/100 (a11y, best-practices, SEO, agentic-browsing), 0 fails. Mobile 100/100/100/76 — only ding is the residual CLS noted above.
- ✅ **WCAG 2.5.3 (Label in Name) fix on repo-widget** — visible "N stars" wasn't a substring of aria-label "Star X/Y on GitHub - currently 0 stars" because the live shields.io fetch overwrote textContent without updating aria-label. Reworded aria-label so visible text is a clean prefix substring; JS now refreshes the parent anchor's aria-label whenever it overwrites the stat value. Canonical + TAT vendored.
- ✅ **CLS suppression on Fathom tracking pixel** — Fathom Analytics injected an unsized 1×1 IMG that caused 0.37 CLS on the worst pages. Pinned `img[src*="cdn.usefathom.com"]` to `position: absolute; 1x1; visibility: hidden` in canonical `marbl-v2.css`. Re-vendored to TAT.
- ✅ **`.marbl-accent` canonical reconciliation — `font-size: 120%`** — single rule across all canonical sources (no more `--loud` variant). 120% scales perfectly with `clamp()` heroes (96px parent → ~115px accent) and any responsive sizing. Sources reconciled byte-for-byte: `marbl-fonts.css`, `marbl-fonts.md`, `brand-kit.md`, `brand-kit/preview.html`. Agent-facing skills updated: `marbl-design-system`, `marbl-brand-guidelines`, `universal-design-system` SKILL.md + `BRAND.md`. Legacy marbl.codes pages also bumped to 120% (about/index/ecosystem/marbl-home.css).
- ✅ **TAT landing hero accent canonicalised** — bespoke `.tat-hero__title-accent` (weight 700, no size bump) replaced with canonical `.marbl-accent` class. Local CSS rule deleted.
- ✅ **Site-header mobile padding 10px → 20px** — `--gap-xs` collapsed felt too tight against the 50px burger circle on phones. Canonical mobile rule now `padding: var(--gap-sm)` uniformly. Site-header.md spec updated with desktop/mobile padding rows + changelog entry. Drive-by tokenisation: `border-radius: 50%` (×2) → `var(--radius-circle, 50%)`.
- ✅ **Component library bundle regenerated** — `npm run build:core` rebaked `marbl-core.css` with all canonical fixes. Pushed; deploy pipeline triggered. Live `marbl.codes/components/` burger menu confirmed clean (no glass effect, no backdrop-filter — legacy `.fullscreen-menu` rules sit dead in the bundle, harmless).
- ✅ **Audio: bed mix under all 13 narrations** — generated lo-fi instrumental bed via ElevenLabs Music API, denoised, mixed under each voice file with stinger preserved. Initially 18 dB separation; dropped bed to volume=0.06 (≥22 dB) to clear WCAG 1.4.7 AAA after Moirai (Ratio) review. Recipe at `thou-art-that/audio-tools/mix-with-bed.mjs` (local).
- ✅ **GH repo widget — fresh stats** — migrated to v2.0.0 hybrid (build-time bake + shields.io live JSON upgrade on DOMContentLoaded). 2s `AbortController` timeout, defensive type checks, CLS-locked stat slots (`tabular-nums` + `min-width: 3ch`), `<link rel="preconnect">` to img.shields.io. Canonical + TAT vendored.
- ✅ **Redirect `marbl.codes/thou-art-that` → `tat.marbl.codes`** — `_redirects` 301 rule at marbl-codes site root. Old page deleted. 7 internal footer/ecosystem links updated.
- ✅ **Title accents on top-level pages** — canonical `.marbl-accent` applied to 7 multi-word top-level page titles via word-boundary regex in `build.mjs` (throws on zero-or-multi match). Single-word titles skipped per design.
- ✅ **About page — "The name" → "Tat Tvam Asi"** — canonical Sanskrit transliteration. (Earlier rename of page title to "About this piece" reverted after Moirai pushback — design must not drive content.)
