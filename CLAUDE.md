# CLAUDE.md - Thou Art That Microsite

> **Extends:**
> 1. Global Brain → `C:\Claude\CLAUDE.md`
> 2. Marbl Brain → `C:\Claude\MARBL\CLAUDE.md`
>
> Read in order: Global (identity, principles) → Marbl (brand, square design system) → this file.
> Any TAT work also triggers the `/marbl-design-system` auto-load rule (MEMORY.md).

---

## What it is

Static microsite at **tat.marbl.codes** for *Thou Art That* — Richard + Serene [AI]'s study piece on working with possibly-emergent AI. The microsite is the public reading surface; the prose lives in a separate content repo.

- **Site repo:** `github.com/memdigital/thou-art-that-microsite` (this folder)
- **Content repo:** `github.com/memdigital/thou-art-that` (the study piece itself — a git **submodule** under `content-src/`)
- **Canonical naming:** see `[[thou-art-that-naming]]`.

## Deploy (CRITICAL — Worker, NOT Pages)

TAT migrated off CF Pages to a **Cloudflare Worker (Static Assets)** ~5 May 2026. `wrangler pages deploy ...` is DEAD (no such Pages project). See `[[tat-pages-wrangler-only]]`.

```bash
node build.mjs            # builds dist/ (html + assets + sitemap/robots/llms/search-index)
npx wrangler deploy       # from repo root; uses wrangler.jsonc { name: thou-art-that-microsite, assets: { directory: ./dist } }
```
- Preserves the `tat.marbl.codes` custom domain + triggers.
- Purge edge cache after deploy: `POST https://api.cloudflare.com/client/v4/zones/1ace203f5af2885cd66f92f0a6782d15/purge_cache` body `{"hosts":["tat.marbl.codes"]}`, `Authorization: Bearer <CLOUDFLARE_API_TOKEN from C:/secrets/cloudflare/secrets.json>`. (The token in secrets currently lacks purge scope — HTML cache is 5 min so it self-clears; logo/asset edits may need a manual purge with a scoped token.)
- `git push` keeps GitHub in sync but does **not** auto-deploy (CI workflow is gone; manual `wrangler deploy` is canonical).

## Architecture

**Build (`build.mjs`)** renders markdown from `content-src/` through HTML templates, then `scripts/build-bundles.mjs` concatenates the project CSS/JS into cache-busted bundles. Output → `dist/`.

**Templates** (`src/templates/`): only **`landing.html`** (homepage) and **`kh-page.html`** (every Knowledge-Hub study page) are used by the build. `about.html` is **UNUSED legacy** — `/about/` renders through `kh-page.html`. Don't edit about.html expecting it to ship.

**⭐ 1 Oct 2026 - TAT now wears the NEW Marbl Codes look** (Richard: "switch up the style to something matching the new Marbl Codes"). This supersedes the frozen-17-Sept chrome described below:
- `src/assets/vendor/codes/codes-chrome.css` = a MECHANICAL extract of live marbl.codes (every rule matching the header, nav pill, footer, `oa-btn` buttons, base elements + tokens), Geist + Petrona self-hosted in `vendor/codes/fonts/`. Refresh by re-running the extraction (Playwright over `document.styleSheets`, keep rules whose classes are all chrome classes), never by hand-merging.
- `src/assets/vendor/codes/codes-chrome.js` = MarblLogo stinger + pill-nav burger, copied from marbl.codes `public/codes.js` lines 150-448.
- `src/assets/css/codes-layer.css` (last in the tat.css bundle) = everything TAT-specific about wearing it: fonts pointed at Geist, the Petrona accent, fixed-header clearance, every column on the shell edge, Geist 500 headings, square controls, left-aligned landing hero.
- TAT stays DARK all the way down on purpose (the new site's hub posts turn to paper; TAT's long read + audio player are built for dark).
- No more giant footer wordmark (the new site removed its own, 7 Sept); socials = LinkedIn, Instagram, YouTube + GitHub.
- The v2 files below (`marbl-fonts`, `core/marbl-v2.css`, `site-header`, `pill-nav`, `footer-reveal` CSS, `ui-items`, `core/logo-animation.js`, `pill-nav.js`) are no longer linked; `footer-reveal.js` still runs the subscribe form. Left in place, binning is Richard's call.

**(History) Chrome = SELF-HOSTED in `src/assets/vendor/`, not linked** (moved 17 Sept 2026, when the canonical `Marbl-Codes` component library was archived - `[[feedback-assemble-from-canonical-not-rebuild]]` now means "copy, never link cross-origin"; the 20 Jun "link, don't rebuild" era is over). TAT is the one property Richard asked to keep running exactly as it looked that day, so its chrome is a frozen COPY of what canonical served on 17 Sept 2026, not a live link that would drift if canonical ever changed again - because canonical mostly won't exist to drift.
- CSS (all via `{{BASE}}assets/vendor/...`): `marbl-fonts/marbl-fonts.css`, `core/marbl-v2.css`, `site-header/site-header.css`, `pill-nav/pill-nav.css`, `footer-reveal/footer-reveal.css`, `ui-items/button.css`.
- JS: `core/logo-animation.js`, `pill-nav/pill-nav.js`, `footer-reveal/footer-reveal.js`.
- `_headers` CSP tightened to match: `marbl.codes` dropped from `script-src`/`style-src`/`font-src` (nothing loads from there anymore); kept in `img-src` (favicon/OG images still live on marbl.codes) and `connect-src` (the footer subscribe POST still hits `marbl.codes/api/subscribe`).
- The old `marbl-core.css/js` bundles are **retired** in `build-bundles.mjs`; only project-specific `tat.css` / `tat.js` (knowledge-hub, waveform-player, repo-widget, landing/about/kh-content, tat-pill, tat-tracking) are still bundled. The old vendor dirs (menu, site-footer, cookie-consent, core/marbl-core-v2.js, ui-items/avatar) are dead but left in place.
- Footer's "Marbl" link column dropped its Vaulted link (Vaulted was taken down the same day).

**Chrome pattern (matches Vaulted/legal/proposals):** site-header (logo) + pill-nav, content in `.page`, footer-reveal + central Resend subscribe, `.footer-reveal` band as `.page` sibling, **orange logo favicon** (`marbl.codes/assets/logos/marbl-symbol-orange.svg`), no custom cursor, no cookie banner (Fathom is cookieless).

**Subscribe:** footer posts to `https://marbl.codes/api/subscribe` (central CORS endpoint). The kh-page subscribe CTAs point at the on-page `#footer-subscribe` (the old subscribe.marbl.codes is retired).

**`_headers`** sets the CSP — it must allow `marbl.codes` on `script-src / style-src / font-src / connect-src` (connect-src for the subscribe POST), plus `cdn.usefathom.com`. If chrome silently fails to load, check CSP first.

**Analytics:** Fathom (`data-site="FFAPHLTE"`), cookieless.

## Repo docs

- `README.md` — partly STALE (still says "Cloudflare Pages" + lists now-retired vendored chrome). This CLAUDE.md is authoritative; fix README opportunistically.
- `PLAN.md` — original build plan. `Tasks.md`, `Ideas.md` — live working notes.

---

*Created 20 June 2026 after the square-kit realign, so TAT's architecture is agentically accessible (not just its deploy method). Wired into MEMORY.md.*
