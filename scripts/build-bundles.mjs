#!/usr/bin/env node
/**
 * TAT bundle builder - concats CSS + JS into the canonical Marbl
 * two-bundle pattern: marbl-core (universal chrome) + tat (project).
 *
 * Per feedback_marbl_two_bundle_architecture.md:
 *   - marbl-core.css/js = universal chrome shared across all Marbl-owned sites
 *   - <project>.css/js  = site-specific (TAT use of canonical components +
 *                          TAT-local templates + project-only third-party)
 *
 * Outputs:
 *   dist/assets/marbl-core.css
 *   dist/assets/tat.css
 *   dist/assets/marbl-core.js
 *   dist/assets/tat.js
 *   dist/assets/.bundle-hash         JSON map of short hashes per bundle for cache-busting
 *
 * Third-party kept separate (single-file) for clear attribution + license:
 *   - vendor/gsap/gsap.min.js
 *   - vendor/arraypress/v1.5.2/waveform-player.min.js + .css
 *   - vendor/minisearch/minisearch.min.js
 *
 * Called by build.mjs after the dist/assets directory is populated.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');
const ASSETS = join(DIST, 'assets');

// ---- bundle definitions ----
// Each bundle is an ordered list of source files (relative to repo root).
// Order matters - cascade order determines override winners.

const BUNDLES = {
  'marbl-core.css': [
    'src/assets/vendor/marbl-fonts/marbl-fonts.css',
    'src/assets/vendor/core/marbl-v2.css',
    'src/assets/vendor/site-header/site-header.css',
    'src/assets/vendor/site-footer/site-footer.css',
    'src/assets/vendor/menu/menu.css',
    'src/assets/vendor/cookie-consent/cookie-consent.css',
    'src/assets/vendor/ui-items/button.css',
    'src/assets/vendor/ui-items/avatar.css'
  ],
  'tat.css': [
    'src/assets/vendor/knowledge-hub/knowledge-hub.css',
    'src/assets/vendor/waveform-player/waveform-player.css',
    'src/assets/vendor/repo-widget/repo-widget.css',
    'src/assets/css/landing.css',
    'src/assets/css/about.css',
    'src/assets/css/kh-content.css'
  ],
  'marbl-core.js': [
    'src/assets/vendor/core/marbl-core-v2.js',
    'src/assets/vendor/menu/menu.js',
    'src/assets/vendor/site-footer/site-footer.js'
  ],
  'tat.js': [
    'src/assets/vendor/waveform-player/waveform-player-init.js',
    'src/assets/vendor/knowledge-hub/knowledge-hub.js',
    'src/assets/js/tat-pill.js',
    'src/assets/js/tat-tracking.js'
  ]
};

function bannerLine(filename) {
  return `\n/* === ${filename} === */\n`;
}

/**
 * Rewrite relative url(...) references in a CSS file's content to absolute
 * paths rooted at /assets/. Source file at src/assets/X/Y/file.css with
 * url('./bg.png') becomes url('/assets/X/Y/bg.png'). Critical when the CSS
 * gets concatenated into a different location (the bundle) - relative URLs
 * would otherwise resolve from the bundle's location and 404.
 *
 * Leaves alone: data: URIs, absolute http/https URLs, paths starting with /.
 */
function rewriteRelativeUrls(cssContent, sourceFileRelativePath) {
  // Source file: 'src/assets/vendor/marbl-fonts/marbl-fonts.css'
  // Strip leading 'src/' then drop the filename, leaving the directory:
  //   'assets/vendor/marbl-fonts'
  const sourceDir = sourceFileRelativePath.replace(/^src\//, '').split('/').slice(0, -1).join('/');

  return cssContent.replace(
    /url\(\s*(['"]?)(?!data:|https?:|\/)([^'")\s]+)\1\s*\)/g,
    (_match, quote, relPath) => {
      // Normalise ./foo and foo to /assets/.../foo, collapse ../ chunks.
      const cleaned = relPath.replace(/^\.\//, '');
      const parts = (sourceDir + '/' + cleaned).split('/');
      const stack = [];
      for (const p of parts) {
        if (p === '..') stack.pop();
        else if (p && p !== '.') stack.push(p);
      }
      return `url('/${stack.join('/')}')`;
    }
  );
}

function build() {
  if (!existsSync(ASSETS)) mkdirSync(ASSETS, { recursive: true });

  const hashes = {};
  let totalIn = 0;
  let totalOut = 0;

  for (const [bundleName, sources] of Object.entries(BUNDLES)) {
    const parts = [];
    for (const src of sources) {
      const path = join(ROOT, src);
      if (!existsSync(path)) {
        console.warn(`  bundle: missing source ${src} - skipping`);
        continue;
      }
      let content = readFileSync(path, 'utf8');
      // URL-rewrite for CSS bundles only - JS doesn't have the same problem.
      if (bundleName.endsWith('.css')) {
        content = rewriteRelativeUrls(content, src);
      }
      totalIn += content.length;
      parts.push(bannerLine(src));
      parts.push(content);
    }
    const out = parts.join('');
    const outPath = join(ASSETS, bundleName);
    writeFileSync(outPath, out, 'utf8');
    totalOut += out.length;

    const hash = createHash('sha256').update(out).digest('hex').slice(0, 8);
    hashes[bundleName] = hash;
    console.log(`  bundle: ${bundleName} (${sources.length} files, ${(out.length / 1024).toFixed(1)} KB, hash ${hash})`);
  }

  writeFileSync(join(ASSETS, '.bundle-hash'), JSON.stringify(hashes, null, 2));

  return hashes;
}

// Allow standalone invocation OR import.
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  build();
}

export { build, BUNDLES };
