# Thou Art That Microsite

Static microsite for [*Thou Art That*](https://github.com/memdigital/thou-art-that) — a study piece on working with possibly-emergent AI, by Richard Bland and Serene [AI].

Deployed to `marbl.codes/thou-art-that/` via Cloudflare Pages.

## Stack

Plain HTML + vanilla CSS + small Node build script. Matches the marbl-codes pattern (no framework overhead, static output to Cloudflare Pages).

- **Content source:** git submodule of `github.com/memdigital/thou-art-that` (the public study piece)
- **Render:** `marked` (markdown → HTML) + `gray-matter` (frontmatter)
- **Templates:** HTML with simple `{{placeholder}}` interpolation
- **Styling:** vendored `marbl.css` from marbl.codes + local overrides
- **Interactive bits:** ArrayPress WaveformPlayer for audio, vanilla JS for GitHub widget

## Layout

1000px max-width including sidebar. Narrow content column (~720px reading measure). Simple sidebar linking all framework pages. Matches the marbl.codes header / footer / burger menu patterns.

## Build

```bash
git clone --recurse-submodules git@github.com:memdigital/thou-art-that-microsite.git
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

Cloudflare Pages project `thou-art-that-microsite`. Build command: `npm run build`. Build output: `dist/`. Served at `marbl.codes/thou-art-that/*` via a Cloudflare Worker path-rewrite (see `workers/proxy/` TBD).

`git submodule update --init --recursive` must be part of the CF Pages build command so the content is available at build time.

## Structure

```
thou-art-that-microsite/
├── build.mjs                    # render script (markdown → HTML via templates)
├── content-src/                 # git submodule (public thou-art-that repo)
├── src/
│   ├── pages/                   # markdown frontmatter + layout refs
│   ├── templates/               # HTML shells with placeholders
│   ├── components/              # header, sidebar, footer, waveform, github-widget
│   └── assets/
│       ├── css/                 # marbl.css (vendored) + microsite overrides
│       ├── js/                  # waveform init + github widget
│       └── images/              # banner, social, og
├── workers/
│   └── github-stats/            # CF Worker proxying GH API (star count)
├── dist/                        # build output (gitignored)
├── _headers                     # Cloudflare Pages security headers
└── _redirects                   # if needed
```

## Licence

Microsite build code: MIT.
Content (from the submodule) inherits the upstream licence: CC BY 4.0 for docs, MIT for code samples. See the licence file in the `content-src/` submodule for full terms.
