# Marbl Fonts (component)

Self-hosted Marbl typography stack — Inter, Urbanist, Petrona — as variable woff2 with SIL OFL licences.

See `marbl-fonts.md` for the full spec.

## Quick start

```html
<link rel="stylesheet" href="https://marbl.codes/components/marbl-fonts/marbl-fonts.css">
```

```css
body { font-family: var(--marbl-font-body); }
h1   { font-family: var(--marbl-font-display); }
em   { font-family: var(--marbl-font-accent); font-style: italic; }
```

## What's here

```
marbl-fonts.css                              @font-face + tokens + utility classes
marbl-fonts.md                               full spec
preview.html                                 showcase / smoke test
assets/inter/inter-variable.woff2            48 KB, latin, wght 100-900
assets/inter/LICENSE                         SIL OFL 1.1
assets/urbanist/urbanist-variable.woff2      28 KB, latin, wght 100-900
assets/urbanist/LICENSE                      SIL OFL 1.1
assets/petrona/petrona-variable.woff2        44 KB, latin, wght 100-900 normal
assets/petrona/petrona-variable-italic.woff2 47 KB, latin, wght 100-900 italic
assets/petrona/LICENSE                       SIL OFL 1.1
```

Total payload: **~167 KB** for every weight + italic Marbl uses anywhere.

## Why this exists

Google Fonts CDN loading was removed across all Marbl sites on 2026-04-25. Three reasons: GDPR (Munich court ruled the IP leak a violation), performance (two third-party DNS + TLS hops gone), and Universal Truth #94 (supply-chain). Self-hosted from same origin under `script-src 'self'` and `font-src 'self'`.

See `marbl-fonts.md` for the upgrade procedure when fonts need refreshing.
