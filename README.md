# Thou Art That Microsite

Static microsite for [*Thou Art That*](https://github.com/memdigital/thou-art-that) — a study piece on working with possibly-emergent AI, by Richard Bland and Serene [AI].

Deployed to **[tat.marbl.codes](https://tat.marbl.codes)** via Cloudflare Pages.

## Stack

Plain HTML + vanilla CSS + small Node build script. Matches the marbl-codes pattern (no framework overhead, static output to Cloudflare Pages).

- **Content source:** git submodule of `github.com/memdigital/thou-art-that` (the public study piece)
- **Render:** `marked` (markdown → HTML) + `gray-matter` (frontmatter)
- **Templates:** HTML with simple `{{placeholder}}` interpolation
- **Styling:** vendored Marbl canonical components (marbl-fonts, marbl-v2 core, site-header, site-footer, menu, ui-items, knowledge-hub, waveform-player)
- **Knowledge Hub:** every section page rendered through the canonical Marbl Knowledge Hub component (v1.4)

## Build

```bash
git clone --recurse-submodules https://github.com/memdigital/thou-art-that-microsite.git
cd thou-art-that-microsite
npm install
npm run build          # static output to dist/
npm run dev            # build + serve + watch on localhost:4321
```

If you cloned without `--recurse-submodules`:

```bash
git submodule update --init --recursive
```

## Content sync

The content lives upstream at `github.com/memdigital/thou-art-that`. To pull the latest content:

```bash
git submodule update --remote content-src
git add content-src
git commit -m "Update content to latest upstream"
```

## Deploy

Cloudflare Pages project `thou-art-that-microsite`, connected to this GitHub repo. Build command: `npm run build`. Build output: `dist/`. Served at `tat.marbl.codes`.

**Submodule init must be enabled** in the CF Pages build settings so `content-src/` is populated at build time.

## Structure

```
thou-art-that-microsite/
├── build.mjs                    # render script (markdown → HTML via templates)
├── content-src/                 # git submodule (public thou-art-that repo)
├── src/
│   ├── content/                 # microsite-local markdown (about, tracks)
│   ├── data/
│   │   └── nav.mjs              # 36-URL manifest (the source of truth)
│   ├── templates/               # landing.html + kh-page.html + about.html
│   └── assets/
│       ├── css/                 # microsite-local CSS (about, kh-content, landing)
│       └── vendor/              # vendored Marbl canonical components
├── workers/
│   └── github-stats/            # CF Worker proxying GH API (star count)
├── dist/                        # build output (gitignored)
└── _headers                     # Cloudflare Pages security + cache headers
```

## Licence

Microsite build code: MIT.
Content (from the `content-src/` submodule) inherits the upstream licence: CC BY 4.0. See the licence file in the `thou-art-that` repo for full terms.
