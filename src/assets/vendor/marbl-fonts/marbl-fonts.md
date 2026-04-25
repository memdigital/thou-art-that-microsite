# Marbl Fonts

Self-hosted variable woff2 font stack for every Marbl-owned and Marbl-built site. Single source of truth at `marbl-codes/src/website/components/marbl-fonts/`.

**Live preview:** `./preview.html`
**Status:** Live, locked-in
**License:** SIL Open Font License 1.1 (per-font `LICENSE` files in each `assets/` subdirectory)

---

## The rule

**No Marbl site loads fonts from `fonts.googleapis.com` or `fonts.gstatic.com` ever.** Every site loads `marbl-fonts.css` from the canonical component (or its own vendored copy if fully isolated) and inherits the `--marbl-font-*` tokens.

Why:
- **Privacy / GDPR** — Google Fonts requests leak user IP + User-Agent to a third party (Munich court ruled this a GDPR violation in 2022)
- **Performance** — eliminates two extra DNS lookups + TLS handshakes + CSS-blocking requests on first paint
- **Truth #94** — third-party stylesheets in our CSP are supply-chain surface area

---

## 1. Stack

| Family | Use | Token | Variants |
|---|---|---|---|
| **Inter** | Body, UI, microcopy | `--marbl-font-body` | wght 100-900 (variable) |
| **Urbanist** | Display, headings, hero titles | `--marbl-font-display` | wght 100-900 (variable) |
| **Petrona** | Accent, Label Style, italic emphasis | `--marbl-font-accent` | wght 100-900 normal + italic (variable) |
| *(system)* | Code | `--marbl-font-mono` | n/a — `ui-monospace` system stack |

**Total payload: ~167 KB across 4 woff2 files** for every weight + italic Marbl uses anywhere. Latin subset only.

---

## 2. Files

```
marbl-fonts/
├── marbl-fonts.css                 # @font-face + tokens + utility classes
├── marbl-fonts.md                  # this spec
├── preview.html                    # showcase
├── README.md                       # usage / upgrade procedure
└── assets/
    ├── inter/
    │   ├── inter-variable.woff2    # 48 KB, latin, wght 100-900
    │   └── LICENSE                 # SIL OFL 1.1 - Inter Project Authors
    ├── urbanist/
    │   ├── urbanist-variable.woff2 # 28 KB, latin, wght 100-900
    │   └── LICENSE                 # SIL OFL 1.1 - Urbanist Project Authors
    └── petrona/
        ├── petrona-variable.woff2          # 44 KB, latin, wght 100-900 normal
        ├── petrona-variable-italic.woff2   # 47 KB, latin, wght 100-900 italic
        └── LICENSE                         # SIL OFL 1.1 - Petrona Project Authors
```

Source: [`@fontsource-variable/{inter,urbanist,petrona}`](https://fontsource.org/) — pre-subsetted woff2 mirrors of Google Fonts.

---

## 3. Loading on a site

### Same-origin sites (everything under `marbl.codes`)

Load the canonical CSS directly:

```html
<link rel="stylesheet" href="https://marbl.codes/components/marbl-fonts/marbl-fonts.css">
```

### Isolated sites (microsites with strict CSP, separate hosting)

Copy the entire `marbl-fonts/` directory into the site's `assets/vendor/` and load the local copy:

```html
<link rel="stylesheet" href="/assets/vendor/marbl-fonts/marbl-fonts.css">
```

This matches the pattern used in `thou-art-that-microsite/src/assets/vendor/`. Re-vendor on font upgrades.

### Preload hints (optional, recommended on hero pages)

For pages where Inter is the LCP element (most pages), add a preload link in `<head>` BEFORE the stylesheet:

```html
<link rel="preload" href="https://marbl.codes/components/marbl-fonts/assets/inter/inter-variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="https://marbl.codes/components/marbl-fonts/marbl-fonts.css">
```

Skip preload for fonts the page doesn't immediately use — it competes with critical CSS for bandwidth.

---

## 4. Using the tokens

```css
body {
  font-family: var(--marbl-font-body);
}

h1, h2, h3, .display {
  font-family: var(--marbl-font-display);
}

.label, em.label-style, .marbl-label {
  font-family: var(--marbl-font-accent);
  font-style: italic;
}

code, pre {
  font-family: var(--marbl-font-mono);
}
```

Or use the utility classes for one-offs:

```html
<h1 class="marbl-text-display">Display heading</h1>
<p class="marbl-text-body">Body copy</p>
<em class="marbl-text-accent">Italic accent</em>
```

---

## 5. Why variable fonts

A variable font (VF) is a single woff2 that contains every weight from 100 (Thin) to 900 (Black) interpolated continuously. It replaces 5+ separate static weight files with one.

Trade-offs:
- ✅ **Smaller total payload** vs loading 5 static weights (especially for Inter where we use 5)
- ✅ **Single HTTP/2 request** for all weights of a family
- ✅ **Smooth weight transitions** — `font-weight: 350` works (between Light and Regular)
- ⚠️ **No support pre-2018** — IE11, old Safari (16.4-) don't support variable fonts at all. We don't support those browsers. Truth #41.

The `format('woff2-variations')` hint is a defensive aid for older Firefox; modern browsers ignore it and use `format('woff2')`.

---

## 6. CSP impact

After installing this component on a site, the CSP can drop these directives:

**Remove:**
```
font-src ... https://fonts.gstatic.com ...
style-src ... https://fonts.googleapis.com ...
```

**Remove from `<head>`:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?..." rel="stylesheet">
```

CSP for fonts collapses to `font-src 'self'` (or `font-src 'self' data:` if any inline SVG fonts are used).

---

## 7. Fallback strategy

The font tokens use **Inter** as the second-tier display fallback (after `Urbanist`) because Inter is itself a body font that handles display weights well. If Inter has loaded but Urbanist hasn't, headings still look on-brand. The system font stack at the end (`system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI'`) renders instantly while the web fonts load (`font-display: swap`).

This produces a brief but graceful FOUT (Flash of Unstyled Text) rather than FOIT (Flash of Invisible Text). Acceptable per Marbl's accessibility guidance — invisible text is worse than slightly-different text.

---

## 8. Do / Don't

- **Do:** load `marbl-fonts.css` once, in `<head>`, before any other stylesheet that uses the tokens
- **Do:** add preload for `inter-variable.woff2` on body-text-heavy hero pages
- **Do:** scope `font-family` declarations to the tokens, not literal `'Inter'` strings — keeps swap-ability
- **Do:** keep the SIL OFL `LICENSE` files alongside the woff2 files in any deployment
- **Don't:** load any `fonts.googleapis.com` or `fonts.gstatic.com` URL anywhere in the codebase
- **Don't:** add other Google Fonts to a Marbl site without updating this component first
- **Don't:** convert woff2 to woff/ttf — woff2 is universally supported in every browser we target
- **Don't:** add latin-ext / Cyrillic / Vietnamese subsets without explicit need — the latin subset is intentional

---

## 9. Upgrade procedure

When upgrading any of the three fonts:

1. Download the new variable woff2 from fontsource:
   ```bash
   curl -sSfL "https://cdn.jsdelivr.net/npm/@fontsource-variable/{font}/files/{font}-latin-wght-normal.woff2" -o assets/{font}/{font}-variable.woff2
   ```
2. Refresh the LICENSE if it changed:
   ```bash
   curl -sSfL "https://cdn.jsdelivr.net/npm/@fontsource-variable/{font}/LICENSE" -o assets/{font}/LICENSE
   ```
3. Test in `preview.html` — render every weight and confirm no glyph regressions
4. Re-vendor into any sites using their own copy (TAT microsite, future isolated builds)
5. Update Changelog below with date + version + what changed

---

## Changelog

- **2026-04-25** — Initial component. Inter, Urbanist, Petrona variable fonts vendored from `@fontsource-variable/*`. SIL OFL 1.1 LICENSE files included. Latin subset only. Replaces Google Fonts CDN loading across all Marbl sites. Per Universal Truth #94 supply-chain hardening + GDPR-by-default privacy stance.
