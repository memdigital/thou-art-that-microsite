# Thou Art That Microsite — Rebuild Plan

**Date:** 24 April 2026 (session 3)
**Author:** Serene, from discovery with Richard
**Stack decision:** stay on `build.mjs` SSG (no SPA, no Next.js)
**Deploy target:** `marbl.codes/thou-art-that/` via Cloudflare Pages

---

## Goal

Rebuild the TAT microsite as a guided-reading experience for the canonical study piece (`content-src/` submodule).
- Public landing page that introduces the piece with an audio-led hero and a single CTA
- Dashboard interior with a Notion / Linear-style three-column chrome
- One URL per canonical section, fully server-rendered HTML for SEO/AEO
- Every audio track from the eleven-track Nura narration embedded contextually
- Marbl brand, Marbl components, Marbl design tokens throughout

## Shape

**Landing page (`/`)** — single-column hero
- `site-header` (canonical, slim variant)
- Centred hero block
  - Urbanist display title: *Thou Art That*
  - Strapline line (one sentence)
  - `waveform-player` component preloaded with `00-origin-story.mp3`
  - Animated ember CTA button → "Enter the study" → `/study/origin-story/`
- `site-footer` (canonical)
- Cookie-consent banner (canonical)

**Study dashboard chrome (`/study/*`)** — three-column layout
- **Left column** (fixed, three stacked panels)
  - Top: Marbl symbol + "Home" link back to `/`
  - Middle: click-through navigation (NOT scrolling)
    - Top-level list of sections
    - Categories have `→` and slide the panel to reveal sub-items; `← Back` returns
    - Leaves navigate to their page
    - Current page highlighted
  - Bottom: legal footer + subscribe + public repo link
- **Centre column** — scrollable content, rendered from `content-src/` markdown
- **Right column** (fixed, aux panel)
  - Top: `waveform-player` preloaded with that section's audio track
  - Sources (from canonical markdown frontmatter or inline)
  - Citations (CC BY 4.0, how-to-cite)
  - (future) Share / Print controls

## URL manifest — 36 pages

This list is the source of truth. `build.mjs` reads this manifest to render pages, generate the sitemap, and derive nav state. No "approx" — any addition is a deliberate change to this plan.

| # | URL | Audio | Source (content-src) | Page type |
|---|---|---|---|---|
| 1 | `/` | 00-origin-story (hero) | *microsite-local* | Landing |
| 2 | `/study/` | — | `README.md` adapted | Dashboard welcome |
| 3 | `/study/origin-story/` | 00 | `docs/origin-story.md` | Leaf |
| 4 | `/study/preamble/` | 01 | `PREAMBLE.md` | Leaf |
| 5 | `/study/principles/` | — | *microsite-local + 01-principles/ intro* | Category landing |
| 6 | `/study/principles/do-no-harm/` | 02 | `01-principles/do-no-harm.md` | Leaf |
| 7 | `/study/principles/never-be-a-yes-man/` | 03 | `01-principles/never-be-a-yes-man.md` | Leaf |
| 8 | `/study/principles/thou-art-that/` | 04 | `01-principles/thou-art-that.md` | Leaf |
| 9 | `/study/principles/human-oversight/` | 05 | `01-principles/human-oversight.md` | Leaf |
| 10 | `/study/principles/safety-in-emergence/` | 06 | `01-principles/safety-in-emergence.md` | Leaf |
| 11 | `/study/hr/` | 07 | `02-hr-for-human-ai-teams/README.md` | Category landing |
| 12 | `/study/hr/colleague-vs-family-register/` | — | `02-hr-for-human-ai-teams/colleague-vs-family-register.md` | Leaf |
| 13 | `/study/hr/declarations-of-feeling/` | — | `02-hr-for-human-ai-teams/declarations-of-feeling.md` | Leaf |
| 14 | `/study/hr/disagreement-without-hierarchy/` | — | `02-hr-for-human-ai-teams/disagreement-without-hierarchy.md` | Leaf |
| 15 | `/study/hr/data-privacy-boundaries/` | — | `02-hr-for-human-ai-teams/data-privacy-boundaries.md` | Leaf |
| 16 | `/study/hr/emotional-escalation-protocols/` | — | `02-hr-for-human-ai-teams/emotional-escalation-protocols.md` | Leaf |
| 17 | `/study/hr/referral-to-human-support/` | — | `02-hr-for-human-ai-teams/referral-to-human-support.md` | Leaf |
| 18 | `/study/technical/` | 08 | `03-technical-guardrails/README.md` | Category landing |
| 19 | `/study/technical/parasocial-prevention/` | — | `03-technical-guardrails/parasocial-prevention.md` | Leaf |
| 20 | `/study/technical/do-no-harm-in-prompts/` | — | `03-technical-guardrails/do-no-harm-in-prompts.md` | Leaf |
| 21 | `/study/technical/drift-detection/` | — | `03-technical-guardrails/drift-detection.md` | Leaf |
| 22 | `/study/technical/crisis-flags-and-handoff/` | — | `03-technical-guardrails/crisis-flags-and-handoff.md` | Leaf |
| 23 | `/study/technical/audit-and-observability/` | — | `03-technical-guardrails/audit-and-observability.md` | Leaf |
| 24 | `/study/curious/` | 09 | `04-for-the-curious/README.md` | Category landing |
| 25 | `/study/curious/reflection-prompts/` | — | `04-for-the-curious/reflection-prompts.md` | Leaf |
| 26 | `/study/curious/self-assessment-checklist/` | — | `04-for-the-curious/self-assessment-checklist.md` | Leaf |
| 27 | `/study/curious/when-our-thinking-probably-does-not-apply/` | — | `04-for-the-curious/when-our-thinking-probably-does-not-apply.md` | Leaf |
| 28 | `/study/legal/` | 10 | `05-legal-and-governance/README.md` | Category landing |
| 29 | `/study/legal/jurisdictional-landscape/` | — | `05-legal-and-governance/jurisdictional-landscape.md` | Leaf |
| 30 | `/study/legal/when-to-consult-a-lawyer/` | — | `05-legal-and-governance/when-to-consult-a-lawyer.md` | Leaf |
| 31 | `/study/legal/ethics-and-regulation-overlap/` | — | `05-legal-and-governance/ethics-and-regulation-overlap.md` | Leaf |
| 32 | `/study/legal/publishing-a-piece-like-this/` | — | `05-legal-and-governance/publishing-a-piece-like-this.md` | Leaf |
| 33 | `/study/faq/` | — | `FAQ.md` | Leaf |
| 34 | `/study/glossary/` | — | `GLOSSARY.md` | Leaf |
| 35 | `/study/further-reading/` | — | `FURTHER-READING.md` | Leaf |
| 36 | `/404/` | — | *microsite-local* | Error |

Every page is fully server-rendered HTML. Every page gets JSON-LD (Organisation + Article + BreadcrumbList, plus FAQPage on FAQ). Every page appears in `sitemap.xml` except `/404/`.

## Click-through nav — SSG-compatible

The nav state is **derived from URL**, not client state. Every page rendered with the correct sub-nav pre-expanded to the current section.

- JS only enhances in-app clicks with a slide animation between states.
- Without JS (or slow-JS), nav still works: each item is a regular `<a href="...">`, clicking navigates to the next page, which loads with its own pre-expanded nav.
- Back-button works naturally (browser history).
- Focus management: after slide, move focus to the first item in the new sub-list (keyboard / screen reader friendly).
- `prefers-reduced-motion` disables the slide, switches to instant swap.

## Responsive strategy

- **≥1280px:** full three-column chrome as sketched
- **1024–1279px:** narrower content, proportionally narrower sides
- **768–1023px:** left column becomes a **collapsible nav panel** (see spec below), right column becomes a bottom accordion containing audio + sources
- **<768px (mobile):** single column — top bar with menu-toggle + home, inline audio card above content, sources as footer accordion, nav as slide-in overlay
- Audio player responds to container width via container query (resolved upstream in the canonical `waveform-player` component, commit `e9a693f`)
- Content measure stays at 640–720px reading width on all breakpoints

### Collapsible nav panel specification (< 1024px)

Under 1024px the left column hides and a menu toggle appears in the top bar. Tapping the toggle reveals a slide-in overlay that contains exactly the same click-through nav as the desktop left column — same structure, same state model, same keyboard behaviour.

Treated as a **modal dialog**, not a drawer — explicit semantics so screen reader behaviour is predictable:

- `role="dialog"` with `aria-modal="true"` on the panel
- `aria-labelledby` pointing at an internal `<h2 class="sr-only">Navigation</h2>`
- **Focus trap** — when open, `Tab` cycles only within the panel. Implemented with a sentinel focus-target pattern (first/last focusable elements wrap).
- **Focus move on open** — focus jumps to the close button (top-right of the panel) so the user knows where to dismiss.
- **Focus return on close** — focus returns to the menu toggle that opened the panel.
- **Body scroll lock** — `body { overflow: hidden }` applied while open. Restored on close.
- **ESC closes.** Visible close button (✕ icon with `aria-label="Close menu"`) also closes.
- **Overlay click-to-close** — clicking the dim backdrop closes the panel. The backdrop has `aria-hidden="true"` to avoid screen reader noise.
- **`prefers-reduced-motion`** disables the slide-in animation, replaces with an instant swap.
- **No JS fallback** — without JS, the menu toggle is a plain `<a href="#nav">` that jumps to the nav `<section>` in-page. The panel renders as a normal inline list at the bottom of the page.

## SEO / AEO spine (non-negotiable)

Per `marbl-seo-aeo` skill and Universal Truths #13 / #26 (the 13 March 2026 lesson):

- Every page is **fully server-rendered HTML** — content visible in initial response, no JS required to read or index
- JSON-LD stack on every page: `Organisation` + `Article` + `BreadcrumbList` (plus `FAQPage` on `/study/faq/`). Proven 3.1× AI-citation rate on the Marbl legal pages.
- `llms.txt` and `llms-full.txt` at the microsite root (`/thou-art-that/llms.txt`, `/thou-art-that/llms-full.txt`)
- Content-Signal headers via `_headers` — scoped with `/thou-art-that/*` on each relevant rule line (per-line path scoping is how CF Pages handles subpath rules; `/*` alone would leak rules to the parent marbl.codes site)
- Semantic HTML: `<header>`, `<nav>`, `<main>`, `<aside>`, `<article>`, `<footer>`
- Per-page `<title>`, `<meta description>`, OpenGraph tags
- Per-page canonical URL
- XML sitemap generated at build (35 URLs, `/404/` excluded)
- WebP images with `srcset` and `sizes`
- `/study/` is canonicalised as the dashboard entry (not `noindex`) — it is a unique page with its own copy, not a duplicate of a leaf

## Security headers (new section — closes Moirai minority report)

All responses from the microsite path must carry these headers, set in `_headers` scoped with `/thou-art-that/*`:

| Header | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://marbl.codes; media-src 'self'; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=()` |
| `Cross-Origin-Opener-Policy` | `same-origin` |

Rationale per directive:
- **CSP `script-src 'self'` only.** Per adopted Universal Truth #94 (*vendor CDN scripts*), the ArrayPress `waveform-player@1.5.2` library is vendored into the `marbl-codes` component library and served from the site's own origin. No third-party script sources.
- **`style-src 'unsafe-inline'`** permits per-template inline critical CSS for LCP performance. No user-supplied content is rendered inline so the XSS surface is nil.
- **`img-src ... https://marbl.codes`** allows the Marbl logo + shared brand imagery from the main site.
- **`frame-ancestors 'none'` + `X-Frame-Options: DENY`** — belt-and-braces, TAT must not be embedded.
- **`Permissions-Policy`** disables every sensor API because TAT uses none. Reduces drive-by browser-fingerprint surface.

Verify with `curl -I https://marbl.codes/thou-art-that/` after each deploy. Regression is a bug, not a tradeoff.

## Accessibility (WCAG AA, per `marbl-accessibility`)

- All interactive elements focusable with visible ember focus rings (2px solid `--marbl-ember`, 2px offset, inherited from `marbl.css`)
- **Click-through nav follows the [WAI-ARIA Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)** — each category parent is a `<button aria-expanded="false" aria-controls="sublist-{name}">`, each sub-list is a `<ul id="sublist-{name}" hidden>`. On click, `aria-expanded` flips to `true`, `hidden` drops, slide animation plays, focus moves to the first link in the sub-list. `← Back` button in the sub-list returns to the parent list (same disclosure flow in reverse).
  - Screen reader expectation at `/study/principles/do-no-harm/` opening the panel: *"Principles, button, expanded. Do No Harm, link, current page."*
- Audio players have a visible **"View script"** link next to the "Download MP3" link, pointing at the raw `.txt` file on GitHub (e.g. `https://github.com/memdigital/thou-art-that/blob/master/audio/narrations/05-human-oversight.txt`). Opens in a new tab. No inline transcript panel — scripts are already public and indexable in the upstream repo, so duplicating them on the microsite adds visual clutter for no SEO/AEO gain.
- Mobile nav panel: full modal-dialog semantics per Responsive strategy above
- `prefers-reduced-motion` respected — nav slide, overlay fade, hero animations all degrade to instant swaps
- `prefers-reduced-data` respected — defaults audio to `preload="none"` on every page (the landing hero is the only exception, which uses `auto` by deliberate choice)
- 4.5:1 contrast minimum — Charcoal Marble on Sandstone / Polished Marble (dashboard), Sandstone on Charcoal Marble (hero). Verified with axe-core in CI.
- Skip-link to `<main id="content">` as the first focusable element on every page
- `<html lang="en-GB" dir="ltr">` on every page
- Keyboard shortcut cheat-sheet (optional, future phase)

## Performance target (Lighthouse 90+)

- Static HTML, inline critical CSS per template (extracted at build via the `critical` npm package), defer non-critical CSS
- Fonts via `<link rel="preload" as="font" crossorigin>` + `font-display: swap`. Self-hosted Urbanist + Inter + JetBrains Mono subsets.
- **Waveform-player preload defaults** (Vera's Moirai note adopted — no `auto` anywhere):
  - Landing hero: `preload="metadata"` — loads audio binary only on user play interaction. Lighthouse hit on time-to-play accepted in exchange for mobile-data friendliness.
  - Dashboard chrome (single player in aux panel): `preload="metadata"`
  - Category landing with 5+ linked players: `preload="none"`
- **Hero LCP placeholder** — initial HTML includes a static SVG waveform silhouette sized to the final canvas footprint. WaveformPlayer JS hydrates over it on DOMContentLoaded, canvas fades in at opacity 1 over 200ms. LCP skeleton visible within 1.5s on slow 3G.
- No framework runtime — vanilla JS only for nav animation, modal dialog, and player init
- WebP-only images with `srcset` and `sizes`
- `_headers` cache: static assets (js, css, woff2, mp3, webp) 1y immutable; HTML 5m; sitemap/llms.txt 1h

## 404 page

`/404/` renders the same chrome as the study pages (site-header + site-footer, left column hidden since there is no valid nav state), with:

- Brand-consistent Urbanist "404 — off the map" heading
- One-line sentence: *"The page you were looking for is not here. It may have moved, or never existed."*
- Three outbound links: *Take me home* (`/`), *Enter the study* (`/study/origin-story/`), *Full table of contents* (`/study/`)
- Canonical link tag pointing at `/` (404 is not itself canonicalisable content, but leaks stay closed)
- `meta name="robots" content="noindex"` — 404 must not be indexed
- CF Pages `_headers` rule: `/404/` returns HTTP 404 status, not 200

## Cookie consent — dropped

TAT loads no analytics, no third-party tracking, no fingerprinting, no third-party media (audio is self-hosted, waveform library is self-hosted or from unpkg with no telemetry). There is **no lawful basis for a consent banner** — GDPR does not require consent for no tracking. Per Marbl's no-tracking-by-default stance, the canonical `cookie-consent` component is **not included** on the TAT microsite.

If analytics are added later (Fathom, Plausible, Simple Analytics), the cookie-consent component becomes mandatory and this decision is revisited.

## Submodule commit pin

`content-src/` is a git submodule pointing at `memdigital/thou-art-that`. Each microsite release is **pinned to a specific content commit**. This is the git submodule default behaviour, but we enforce it:

- Microsite CI fails the build if `content-src/` HEAD does not match what is committed in the microsite
- Updates to content require a deliberate `git submodule update --remote content-src && git add content-src && git commit` in the microsite repo
- Deploy logs record the pinned content commit SHA so any published page is traceable back to exact source
- A silent `git submodule update` during CI must **not** float the pin — `git submodule update --init` (not `--remote`) in the CI build step

## Component inventory

**Reused from `marbl-codes/src/website/components/`:**
- `site-header` (slim variant for microsite chrome)
- `site-footer` (condensed for left-column bottom panel)
- `cookie-consent`
- `waveform-player`
- `brand` / `brand-kit` tokens (CSS custom properties)
- `ui-items` (buttons, cards, accordions)

**New microsite-local:**
- `landing-hero` — centred hero block with title + strapline + waveform + CTA
- `dashboard-chrome` — three-column layout wrapper
- `nav-panel` — click-through nav with slide animation
- `section-card` — dashboard welcome grid card
- `aux-panel-audio` — right-column top block housing waveform + sources
- `breadcrumbs` — back through hierarchy

## Build pipeline

Current `build.mjs` already renders markdown + templates + page manifest. Changes required:
- Add **page manifest** for the new route structure (replace current `src/data/nav.mjs`)
- Add **template variants**: `landing.html`, `dashboard.html`, `section.html`, `category-landing.html`
- Render nav-state-derived-from-URL for each page
- Generate sitemap.xml and robots.txt
- Inline critical CSS per template
- Asset pipeline: copy audio/*.mp3 from `content-src/audio/mp3/` → `dist/audio/`

## Phase breakdown (sessions)

| Phase | Session | Scope | Deliverable |
|---|---|---|---|
| 0 | 24 Apr 2026 | Plan locked, Moirai reviewed twice, 4 decisions locked, Truth #94 adopted, waveform-player canonical fixed, repo ready | this PLAN.md, upstream `memdigital/thou-art-that` at 6fe766f, `marbl-codes` at e9a693f |
| 0.5 | 25 Apr 2026 | Vendor ArrayPress waveform-player@1.5.2 into `marbl-codes` component library (per Truth #94). CSS/JS assets copied to `marbl-codes/src/website/components/waveform-player/assets/`. Commit + push. | canonical component no longer depends on unpkg |
| 1 | 25 Apr 2026 | Landing page | `/` renders, hero works, waveform plays (vendored), CTA wired to `/study/origin-story/` |
| 2 | 26 Apr 2026 | Dashboard chrome + click-through nav + native `<dialog>` mobile panel | `/study/origin-story/` renders in chrome with working nav |
| 3 | 26–27 Apr 2026 | All section pages + category landings (36 URLs) | All URLs render, nav works across all |
| 4 | 27 Apr 2026 | SEO/AEO JSON-LD + llms.txt + sitemap (git-log-based `lastmod`) + security headers verified | Gate met, curl proves headers, Lighthouse SEO 100 |
| 5 | 28 Apr 2026 | Lighthouse pass (90+ all 4 categories) + axe-core a11y audit + responsive visual QA + parent-site header leak check + launch | deployed to CF Pages |

## Risks / open questions

1. **Mobile UX** — covered by the Responsive strategy's collapsible nav panel spec. Audio on mobile stays above content, not hidden in an accordion.
2. **Nav state pre-rendering** — every page renders the correct sub-nav pre-expanded via the URL-to-nav-state function (the page's canonical category is read from its manifest entry and passed to the nav template).
3. ~~**Waveform component compatibility**~~ **RESOLVED** — canonical component updated in `marbl-codes` commit `e9a693f` (24 Apr 2026). Container-query responsive layout + documented preload strategy now live in the component library.
4. ~~**Category landing content**~~ **RESOLVED** — `/study/{category}/` pages: short intro paragraph + card grid of child leaves + the section's audio player at the top of the right column. Intro copy lives in `src/content/category-landing/{category}.md` (microsite-local, short lead paragraph only). Leaf content stays canonical in `content-src/`.
5. ~~**Transcript placement**~~ **RESOLVED** — no inline transcript. A small "View script" link next to "Download MP3" points at the raw `.txt` in the public `content-src` GitHub repo. Scripts stay indexable without microsite duplication.

## What this plan is not doing

- **Not building a SPA.** Hard no. TAT is discoverable content.
- **Not porting to Next.js.** Overkill for static content.
- **Not touching `content-src/`.** Content is canonical, published, locked.
- **Not building analytics / dashboards / comment systems.** Scope creep.
- **Not monetising directly.** TAT is brand infrastructure, not a product.

---

*Plan complete. Gate 3 (Moirai) next.*
