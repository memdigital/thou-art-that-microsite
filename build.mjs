#!/usr/bin/env node
/**
 * Thou Art That microsite — Phase 3 build (Knowledge Hub).
 *
 * Renders landing (locked) + every manifest entry through the canonical
 * Marbl Knowledge Hub component (knowledge-hub v1.2 LOCKED 28 April 2026).
 * One template covers About + 35 study URLs.
 *
 * Inputs:
 *   src/templates/landing.html     — locked landing page (canonical chrome)
 *   src/templates/kh-page.html     — Knowledge Hub page template (every other route)
 *   src/data/nav.mjs               — URL manifest (36 entries)
 *   content-src/                   — submodule with markdown source
 *   src/content/                   — microsite-local markdown (e.g. about.md)
 *   content-src/audio/mp3/*.mp3    — Nura narration tracks
 *
 * Output:
 *   dist/index.html                          — landing
 *   dist/about/index.html                    — KH-rendered about
 *   dist/study/<slug>/index.html             — KH-rendered study leaves
 *   dist/study/<category>/index.html         — KH-rendered category landings
 *   dist/study/<category>/<slug>/index.html  — KH-rendered category leaves
 *   dist/search-index.json                   — MiniSearch-ready
 *   dist/sitemap.xml                         — full URL list
 *   dist/assets/                             — copied static + vendored assets
 *   dist/assets/audio/                       — copied per-route audio
 *   dist/_headers                            — Cloudflare Pages headers
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync, rmSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import matter from 'gray-matter';
import { SECTIONS, flatten } from './src/data/nav.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');
const CONTENT = join(ROOT, 'content-src');
const AUDIO_SRC = join(CONTENT, 'audio', 'mp3');
const AUDIO_DIST = join(DIST, 'assets', 'audio');

// Base URL prefix. Default `/` for local dev.
// Production: ASSET_BASE=/thou-art-that/ when deploying into the marbl.codes zone.
const BASE = process.env.ASSET_BASE || '/';

// Absolute origin for sitemap + canonical URLs.
const ABS_ORIGIN = 'https://marbl.codes';
const ABS_BASE = ABS_ORIGIN + (BASE === '/' ? '/thou-art-that/' : BASE);

// Configure marked: GFM, no html escaping (content is trusted markdown
// from our own canonical source repo, not user input).
marked.setOptions({
  gfm: true,
  breaks: false,
  pedantic: false,
  headerIds: false,
  mangle: false
});

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function readFile(path) {
  return readFileSync(path, 'utf8');
}

function writeFile(path, content) {
  ensureDir(dirname(path));
  writeFileSync(path, content, 'utf8');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
  });
}

function applyTemplate(template, fields) {
  let out = template;
  for (const [key, value] of Object.entries(fields)) {
    const re = new RegExp('\\{\\{' + key + '\\}\\}', 'g');
    out = out.replace(re, value == null ? '' : value);
  }
  return out;
}

function escapeJsString(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/<[^>]+>/g, '')         // strip any inline HTML tags from heading text
    .replace(/[^\w\s-]/g, '')         // drop punctuation
    .trim()
    .replace(/\s+/g, '-')             // spaces -> hyphens
    .replace(/-+/g, '-');             // collapse runs
}

function stripHtml(html) {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Decode the HTML entities marked emits in text content so we can store
   heading text as plain characters (avoids double-escape when escapeHtml
   re-encodes for emit). Order matters: &amp; last to prevent decoding
   already-decoded ampersands twice. */
function decodeEntities(s) {
  return String(s)
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}


/* ====================================================================
   Markdown link rewriter — turn raw .md links from canonical content
   into TAT URLs (when the target is in our manifest) or GitHub URLs
   (for files we don't expose on TAT, e.g. NOTICE.md / LICENSE.md).
   Locked 30 Apr 2026.
   ==================================================================== */

const GITHUB_REPO_BASE = 'https://github.com/memdigital/thou-art-that/blob/master/';

const SOURCE_TO_URL = (() => {
  const m = new Map();
  for (const item of flatten()) {
    if (!item.source) continue;
    // Only canonical-content-src entries get TAT routes; microsite-local
    // (about, principles-landing, tracks) live elsewhere on the manifest
    // and shouldn't match content-src relative links.
    if (item.sourceLocation === 'microsite') continue;
    m.set(item.source, BASE + item.url);
  }
  return m;
})();

function resolveRelativePath(currentDir, href) {
  let path = href;
  let dir = currentDir;
  if (path.startsWith('./')) path = path.slice(2);
  while (path.startsWith('../')) {
    if (dir.includes('/')) dir = dir.substring(0, dir.lastIndexOf('/'));
    else dir = '';
    path = path.slice(3);
  }
  return dir ? dir + '/' + path : path;
}

function rewriteMarkdownLinks(html, currentSourcePath) {
  const currentDir = currentSourcePath.includes('/')
    ? currentSourcePath.substring(0, currentSourcePath.lastIndexOf('/'))
    : '';

  return html.replace(/<a([^>]*?)href="([^"]+)"([^>]*?)>/g, (match, before, href, after) => {
    // Skip absolute URLs, anchors, and mail/tel.
    if (/^(https?:|mailto:|tel:|#|\/)/.test(href)) return match;
    // Only act on .md links and folder-trailing-slash links.
    const isMd = /\.md(#[^"]*)?$/.test(href);
    const isFolder = href.endsWith('/');
    if (!isMd && !isFolder) return match;

    // Split fragment if present (preserve #section).
    let fragment = '';
    let cleanHref = href;
    const hashIdx = cleanHref.indexOf('#');
    if (hashIdx >= 0) {
      fragment = cleanHref.slice(hashIdx);
      cleanHref = cleanHref.slice(0, hashIdx);
    }

    const resolved = resolveRelativePath(currentDir, cleanHref);

    // Try direct manifest match.
    let url = SOURCE_TO_URL.get(resolved);
    // Try with README.md appended (folder-style link to a category).
    if (!url) {
      const withReadme = resolved.endsWith('/') ? resolved + 'README.md' : resolved + '/README.md';
      url = SOURCE_TO_URL.get(withReadme);
    }

    if (url) return '<a' + before + 'href="' + url + fragment + '"' + after + '>';

    // Not in manifest — fall back to GitHub for the canonical study repo.
    return '<a' + before + 'href="' + GITHUB_REPO_BASE + resolved + fragment + '"' + after + ' target="_blank" rel="noopener noreferrer">';
  });
}


/* ====================================================================
   Markdown rendering
   ==================================================================== */

/**
 * Read a markdown source file. `sourceLocation` switches between the
 * canonical content-src submodule and the microsite-local src/content/
 * area (used for About).
 *
 * Returns { html, frontmatter, headings } where headings is a list of
 * h2/h3 with id + text in document order (used for the right-column TOC).
 */
function renderMarkdownSource(relativePath, sourceLocation = 'content-src') {
  const fullPath = sourceLocation === 'microsite'
    ? join(ROOT, relativePath)
    : join(CONTENT, relativePath);

  if (!existsSync(fullPath)) {
    console.warn('  WARN markdown missing: ' + relativePath);
    return { html: '<p><em>Source not found.</em></p>', frontmatter: {}, headings: [] };
  }

  const raw = readFile(fullPath);
  const { content, data } = matter(raw);

  // Strip the first H1 — KH renders title from the manifest label / frontmatter
  // so styles stay consistent with nav state.
  let stripped = content.replace(/^\s*#\s+[^\n]+\n+/, '');

  // Strip the leading audio blockquote present in canonical content-src
  // study files (e.g. `> **Audio version** ... <audio controls src=...>`).
  // KH renders audio as a content block at top of body via {{AUDIO_HTML}}.
  // Heuristic: drop a blockquote that contains an <audio ...> tag.
  stripped = stripped.replace(/^[\s]*(?:>[^\n]*\n?)*?>\s*[^\n]*<audio[\s\S]*?(?=\n\n|\n#|$)/m, '');
  // Catch trailing > spacers left after the audio strip
  stripped = stripped.replace(/^(>\s*\n)+/m, '');

  let html = marked.parse(stripped);

  // Strip <hr> tags entirely — surrounding h2 80px section margin handles
  // the visual break already, and bare horizontal rules read as random
  // noise mid-article. Source semantics lost on purpose (Richard 30 Apr 2026).
  html = html.replace(/<hr\s*\/?>(\s*\n)?/gi, '');

  // Rewrite .md / folder links in content. Canonical content-src files
  // link to each other via relative .md paths (e.g. ./01-principles/
  // do-no-harm.md). Map those to TAT routes where possible; otherwise
  // fall back to GitHub for files we don't expose (NOTICE, LICENSE, etc).
  if (sourceLocation !== 'microsite') {
    html = rewriteMarkdownLinks(html, relativePath);
  }

  // Inject ids onto h2/h3 + harvest headings for the right TOC.
  // Decode entities (&#39; etc) to plain chars before storing so emit-time
  // escapeHtml does single-pass encoding (avoids the &amp;#39; double-escape).
  const headings = [];
  const seenIds = new Set();
  html = html.replace(/<(h[23])([^>]*)>([\s\S]*?)<\/\1>/g, (_, tag, attrs, text) => {
    const cleanText = decodeEntities(text.replace(/<[^>]+>/g, '').trim());
    let id = slugify(cleanText) || tag + '-' + (headings.length + 1);
    let n = 1;
    while (seenIds.has(id)) { n += 1; id = slugify(cleanText) + '-' + n; }
    seenIds.add(id);
    headings.push({ level: tag === 'h2' ? 2 : 3, id, text: cleanText });
    return '<' + tag + attrs + ' id="' + id + '">' + text + '</' + tag + '>';
  });

  return { html, frontmatter: data, headings };
}


/* ====================================================================
   KH Sidebar nav — collapsible 3-tier tree per knowledge-hub.md §5.1
   ==================================================================== */

function renderKhSidebarHtml(currentRoute) {
  const currentUrl = currentRoute.url;
  const currentParentSlug = currentRoute.parentSlug || null;

  const lines = [];

  for (const section of SECTIONS) {
    if (section.type === 'leaf') {
      // Top-level leaf — flat list item, no group wrapper.
      const isCurrent = section.url === currentUrl;
      lines.push(
        '<li class="kh-nav__item">' +
          '<a class="kh-nav__link" href="' + BASE + escapeHtml(section.url) + '"' +
          (isCurrent ? ' aria-current="page"' : '') + '>' +
            escapeHtml(section.label) +
          '</a>' +
        '</li>'
      );
    } else {
      // Category — collapsible group. Auto-expanded if current page is the
      // category landing OR a child of this category.
      const isAncestor = section.slug === currentParentSlug
        || (currentRoute.isCategory && currentRoute.slug === section.slug);
      lines.push(
        '<li class="kh-nav__group" aria-expanded="' + (isAncestor ? 'true' : 'false') + '">' +
          '<button class="kh-nav__group-label" type="button">' +
            '<svg class="kh-nav__group-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9L12 15L18 9"/></svg>' +
            '<span>' + escapeHtml(section.label) + '</span>' +
          '</button>' +
          '<div class="kh-nav__children"><ul class="kh-nav__children-inner">'
      );

      // Category landing (Overview) — first child entry.
      const landingIsCurrent = section.url === currentUrl;
      lines.push(
        '<li class="kh-nav__item">' +
          '<a class="kh-nav__link" href="' + BASE + escapeHtml(section.url) + '"' +
          (landingIsCurrent ? ' aria-current="page"' : '') + '>' +
            'Overview' +
          '</a>' +
        '</li>'
      );

      // Category children — flat leaves under this group.
      for (const child of section.children) {
        const isCurrent = child.url === currentUrl;
        lines.push(
          '<li class="kh-nav__item">' +
            '<a class="kh-nav__link" href="' + BASE + escapeHtml(child.url) + '"' +
            (isCurrent ? ' aria-current="page"' : '') + '>' +
              escapeHtml(child.label) +
            '</a>' +
          '</li>'
        );
      }

      lines.push('</ul></div></li>');
    }
  }

  return lines.join('\n              ');
}


/* ====================================================================
   KH Pagination — canonical .kh-pagination shape per knowledge-hub.html
   ==================================================================== */

function renderKhPaginationHtml(prev, next) {
  if (!prev && !next) return '';
  const lines = ['<nav class="kh-pagination" aria-label="Page navigation">'];
  if (prev) {
    lines.push(
      '<a href="' + BASE + escapeHtml(prev.url) + '" class="kh-pagination__link kh-pagination__link--prev" rel="prev">' +
        '<span class="kh-pagination__label">Previous</span>' +
        '<span class="kh-pagination__title">' + escapeHtml(prev.label) + '</span>' +
      '</a>'
    );
  } else {
    lines.push('<span></span>');
  }
  if (next) {
    lines.push(
      '<a href="' + BASE + escapeHtml(next.url) + '" class="kh-pagination__link kh-pagination__link--next" rel="next">' +
        '<span class="kh-pagination__label">Next</span>' +
        '<span class="kh-pagination__title">' + escapeHtml(next.label) + '</span>' +
      '</a>'
    );
  } else {
    lines.push('<span></span>');
  }
  lines.push('</nav>');
  return lines.join('\n        ');
}


/* ====================================================================
   KH On-this-page TOC
   ==================================================================== */

function renderTocHtml(headings) {
  if (!headings || headings.length === 0) return '';
  return headings.map(h => (
    '<li class="kh-toc__item' + (h.level === 3 ? ' kh-toc__item--nested' : '') + '">' +
      '<a class="kh-toc__link" href="#' + escapeHtml(h.id) + '">' + escapeHtml(h.text) + '</a>' +
    '</li>'
  )).join('\n        ');
}


/* ====================================================================
   Audio HTML — same custom mwp-controls-pill markup as landing page.
   The pill chrome lives in waveform-player.css; we emit identical
   structure so the player looks/feels exactly like the landing one.
   ==================================================================== */

function renderAudioHtml(audioBasename, sectionLabel, slug) {
  if (!audioBasename) return '';
  const audioUrl = BASE + 'assets/audio/' + audioBasename + '.mp3';
  const playerId = 'study-player-' + slug;
  const ariaLabel = escapeHtml(sectionLabel) + ', narrated by Nura [AI]';
  return [
    '<div class="marbl-waveform mwp-custom" role="region" aria-label="' + ariaLabel + '">',
    '  <div class="mwp-inline">',
    '    <div class="mwp-controls-pill" id="pill-controls-' + slug + '">',
    '      <button class="mwp-btn mwp-btn--play" id="mwp-play-' + slug + '" aria-label="Play" aria-pressed="false">',
    '        <svg class="icon-play" viewBox="0 0 24 24" aria-hidden="true"><polygon points="6,3 20,12 6,21"/></svg>',
    '        <svg class="icon-pause" viewBox="0 0 24 24" aria-hidden="true" hidden><rect x="5" y="3" width="4" height="18"/><rect x="15" y="3" width="4" height="18"/></svg>',
    '      </button>',
    '      <div class="mwp-divider"></div>',
    '      <span class="mwp-time"><span class="mwp-time-display" id="mwp-time-' + slug + '">0:00</span></span>',
    '      <div class="mwp-pill-expandable mwp-divider"></div>',
    '      <div class="mwp-pill-expandable mwp-volume-wrap">',
    '        <button class="mwp-btn mwp-btn--volume" id="mwp-vol-btn-' + slug + '" aria-label="Volume" aria-expanded="false" aria-controls="mwp-vol-slider-' + slug + '">',
    '          <svg viewBox="0 0 1200 1200" aria-hidden="true"><path d="m120 600h240v480h-240z"/><path d="m840 120h240v960h-240z"/><path d="m480 360h240v720h-240z"/></svg>',
    '        </button>',
    '        <div class="mwp-volume-slider" id="mwp-vol-slider-' + slug + '" role="group" aria-label="Volume control">',
    '          <input type="range" min="0" max="100" value="80" id="mwp-vol-range-' + slug + '" aria-label="Volume level">',
    '        </div>',
    '      </div>',
    '    </div>',
    '    <div class="mwp-waveform-area">',
    '      <div data-waveform-player',
    '           id="' + playerId + '"',
    '           data-url="' + audioUrl + '"',
    '           data-title="' + escapeHtml(sectionLabel) + ', narrated by Nura [AI]"',
    '           data-waveform-style="line"',
    '           data-waveform-color="rgba(255,255,255,0.25)"',
    '           data-progress-color="#F35226"></div>',
    '      <audio class="mwp-fallback" controls preload="metadata" src="' + audioUrl + '">',
    '        Your browser does not support audio playback. <a href="' + audioUrl + '">Download the narration (MP3)</a>.',
    '      </audio>',
    '    </div>',
    '  </div>',
    '</div>',
    '<div role="status" aria-live="polite" aria-atomic="true" class="sr-only" id="mwp-status-' + slug + '"></div>'
  ].join('\n        ');
}


/* ====================================================================
   Player wiring script — same logic as landing.html, parameterised
   with the route slug so multiple players on a site never clash.
   ==================================================================== */

function renderPlayerScript(audioBasename, slug, sectionLabel) {
  if (!audioBasename) return '';
  const playerId = 'study-player-' + slug;
  const fathomLabel = sectionLabel + ' play';
  return [
    '<script>',
    '(function(){',
    '  "use strict";',
    '  var playBtn   = document.getElementById("mwp-play-' + slug + '");',
    '  if (!playBtn) return;',
    '  var iconPlay  = playBtn.querySelector(".icon-play");',
    '  var iconPause = playBtn.querySelector(".icon-pause");',
    '  var timeEl    = document.getElementById("mwp-time-' + slug + '");',
    '  var pillEl    = document.getElementById("pill-controls-' + slug + '");',
    '  var volBtn    = document.getElementById("mwp-vol-btn-' + slug + '");',
    '  var volSlider = document.getElementById("mwp-vol-slider-' + slug + '");',
    '  var volRange  = document.getElementById("mwp-vol-range-' + slug + '");',
    '  var statusEl  = document.getElementById("mwp-status-' + slug + '");',
    '  var audio = null, wired = false, attempts = 0, MAX = 30, fathomFired = false;',
    '  function fmt(s){ if(isNaN(s))return"0:00"; var m=Math.floor(s/60),sec=Math.floor(s%60); return m+":"+(sec<10?"0":"")+sec; }',
    '  function setPlaying(p){ iconPlay.hidden=p; iconPause.hidden=!p; playBtn.setAttribute("aria-pressed",String(p)); playBtn.setAttribute("aria-label",p?"Pause":"Play"); pillEl.classList.toggle("is-expanded",p); statusEl.textContent=p?"Playing":(audio?"Paused at "+fmt(audio.currentTime):""); }',
    '  function trackPlayOnce(){ if(fathomFired)return; fathomFired=true; if(typeof fathom!=="undefined"&&fathom.trackEvent){ fathom.trackEvent("' + escapeJsString(fathomLabel) + '"); } }',
    '  function wireAudio(a){ if(wired)return; audio=a; wired=true; audio.addEventListener("play",function(){setPlaying(true);trackPlayOnce();}); audio.addEventListener("pause",function(){setPlaying(false);}); audio.addEventListener("ended",function(){setPlaying(false);}); audio.addEventListener("timeupdate",function(){timeEl.textContent=fmt(audio.currentTime);}); volRange.value=Math.round(audio.volume*100); }',
    '  function findAudio(){ if(typeof WaveformPlayer==="undefined")return false; var ins=WaveformPlayer.instances; if(!ins)return false; if(ins instanceof Map){ ins.forEach(function(i){ if(i.audio&&!wired)wireAudio(i.audio); }); } else if(typeof ins==="object"){ Object.keys(ins).forEach(function(k){ if(ins[k].audio&&!wired)wireAudio(ins[k].audio); }); } return wired; }',
    '  function poll(){ if(wired)return; if(findAudio())return; attempts++; if(attempts<MAX) setTimeout(poll,300); }',
    '  playBtn.addEventListener("click",function(){ var el=document.getElementById("' + playerId + '"); var nb=el?el.querySelector("button"):null; if(nb){ nb.click(); if(!wired||(audio&&!audio.src)) setTimeout(function(){findAudio();},200); } });',
    '  volRange.addEventListener("input",function(){ if(audio) audio.volume=volRange.value/100; });',
    '  volBtn.addEventListener("click",function(){ var open=volBtn.getAttribute("aria-expanded")==="true"; volBtn.setAttribute("aria-expanded",String(!open)); volSlider.classList.toggle("is-open",!open); });',
    '  document.addEventListener("keydown",function(e){ if(e.key==="Escape"&&volSlider.classList.contains("is-open")){ volSlider.classList.remove("is-open"); volBtn.setAttribute("aria-expanded","false"); volBtn.focus(); } });',
    '  poll();',
    '})();',
    '</script>'
  ].join('\n  ');
}

function findParentLabel(parentSlug) {
  for (const section of SECTIONS) {
    if (section.type === 'category' && section.slug === parentSlug) return section.label;
  }
  return 'Thou Art That';
}


/* ====================================================================
   Breadcrumb JSON-LD
   ==================================================================== */

function renderBreadcrumbJson(breadcrumbs) {
  // breadcrumbs is an array of { name, url } in order
  const items = breadcrumbs.map((b, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: b.name,
    item: b.url
  }));
  return JSON.stringify(items);
}


/* ====================================================================
   Audio copying — only copy what routes need
   ==================================================================== */

function copyAudioFor(audioBasenames) {
  ensureDir(AUDIO_DIST);
  for (const basename of audioBasenames) {
    if (!basename) continue;
    const src = join(AUDIO_SRC, basename + '.mp3');
    const dst = join(AUDIO_DIST, basename + '.mp3');
    if (existsSync(dst)) continue;  // already copied
    if (existsSync(src)) {
      cpSync(src, dst);
      console.log('  copied audio: ' + basename + '.mp3');
    } else {
      console.warn('  WARN audio missing: ' + basename + '.mp3');
    }
  }
}


/* ====================================================================
   Search index (MiniSearch shape — knowledge-hub.md §6.4)
   ==================================================================== */

function renderSearchIndex(documents) {
  return JSON.stringify({ documents }, null, 2);
}


/* ====================================================================
   Sitemap.xml
   ==================================================================== */

function renderSitemap(items, today) {
  const urls = ['<url><loc>' + ABS_BASE + '</loc><lastmod>' + today + '</lastmod><priority>1.0</priority></url>'];
  for (const item of items) {
    urls.push('<url><loc>' + ABS_BASE + item.url + '</loc><lastmod>' + today + '</lastmod></url>');
  }
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  ' +
    urls.join('\n  ') +
    '\n</urlset>\n';
}


/* ====================================================================
   Main build
   ==================================================================== */

function build() {
  console.log('Thou Art That microsite — Phase 3 build (Knowledge Hub)');

  if (existsSync(DIST)) rmSync(DIST, { recursive: true, force: true });
  ensureDir(DIST);

  // Static assets (CSS, vendored deps, JS).
  if (existsSync(join(SRC, 'assets'))) {
    cpSync(join(SRC, 'assets'), join(DIST, 'assets'), { recursive: true });
  }

  // _headers for Cloudflare Pages.
  const headersPath = join(ROOT, '_headers');
  if (existsSync(headersPath)) cpSync(headersPath, join(DIST, '_headers'));


  /* ------------------------------------------------------------------
     Landing — locked, untouched
     ------------------------------------------------------------------ */

  copyAudioFor(['00-origin-story']);

  const landingTpl = readFile(join(SRC, 'templates', 'landing.html'));
  const landingHtml = applyTemplate(landingTpl, {
    BASE: BASE,
    PAGE_TITLE: escapeHtml('Thou Art That | A study piece on working with (possibly) emergent AI'),
    DESCRIPTION: escapeHtml('A study piece on working with possibly-emergent AI. Co-authored by Richard Bland (human) and Serene [AI]. Principles, practice, and philosophy for small builders.'),
    CANONICAL_PATH: ''
  });
  writeFile(join(DIST, 'index.html'), landingHtml);
  console.log('  rendered: /');


  /* ------------------------------------------------------------------
     Phase 3 — every manifest entry through the KH template
     ------------------------------------------------------------------ */

  const flat = flatten();
  const khTpl = readFile(join(SRC, 'templates', 'kh-page.html'));
  const today = new Date().toISOString().slice(0, 10);

  // Hub "start" = first manifest entry. Used by the KH sidebar home button.
  // Site logo still points at landing (BASE). Locked 30 Apr 2026.
  const hubHomeUrl = BASE + (flat[0] ? flat[0].url : '');

  // Collect for search index after the loop.
  const searchDocs = [];

  // Copy audio for every route that has one.
  copyAudioFor(flat.map(r => r.audio).filter(Boolean));

  for (const route of flat) {
    const sourceLocation = route.sourceLocation || 'content-src';
    const { html: rawBodyHtml, frontmatter, headings } = renderMarkdownSource(route.source, sourceLocation);

    // Title + eyebrow + lead resolution.
    const articleTitle = frontmatter.title || route.label;
    const eyebrow = frontmatter.eyebrow
      || (route.parentSlug ? findParentLabel(route.parentSlug) : (route.isCategory ? 'Thou Art That' : 'Thou Art That'));
    const leadHtml = frontmatter.lead
      ? '<p class="kh-article__lead">' + frontmatter.lead + '</p>'
      : '';

    const sidebarNavHtml = renderKhSidebarHtml(route);
    const paginationHtml = renderKhPaginationHtml(route.prev, route.next);
    const audioHtml = renderAudioHtml(route.audio, route.label, route.slug);
    const playerScript = renderPlayerScript(route.audio, route.slug, route.label);
    const tocHtml = renderTocHtml(headings);

    // View Transition opt-in: only origin-story (the landing -> study entry
    // point) declares @view-transition. Pairs with the matching rule in
    // landing.css. All other study pages omit it so navigation between
    // them stays instant per Richard's call 29 Apr 2026.
    const viewTransitionStyle = route.slug === 'origin-story' && !route.parentSlug
      ? '<style>@view-transition { navigation: auto; }</style>'
      : '';

    // Breadcrumb chain.
    const breadcrumbs = [
      { name: 'Thou Art That', url: 'https://marbl.codes/thou-art-that/' }
    ];
    if (route.parentSlug) {
      const parentLabel = findParentLabel(route.parentSlug);
      const parentSection = SECTIONS.find(s => s.type === 'category' && s.slug === route.parentSlug);
      if (parentSection) {
        breadcrumbs.push({
          name: parentLabel,
          url: 'https://marbl.codes/thou-art-that/' + parentSection.url
        });
      }
    }
    breadcrumbs.push({
      name: articleTitle,
      url: 'https://marbl.codes/thou-art-that/' + route.url
    });

    const pageTitle = articleTitle + ' | Thou Art That';
    const description = frontmatter.description
      || (frontmatter.lead ? frontmatter.lead.replace(/[*_`]/g, '') : '')
      || (articleTitle + ' from Thou Art That, a study piece on working with possibly-emergent AI by Richard Bland and Serene [AI].');

    const fullHtml = applyTemplate(khTpl, {
      BASE: BASE,
      PAGE_TITLE: escapeHtml(pageTitle),
      DESCRIPTION: escapeHtml(description),
      CANONICAL_PATH: route.url,
      EYEBROW: escapeHtml(eyebrow),
      ARTICLE_TITLE: escapeHtml(articleTitle),
      LEAD_HTML: leadHtml,
      SIDEBAR_NAV_HTML: sidebarNavHtml,
      AUDIO_HTML: audioHtml,
      CONTENT_HTML: rawBodyHtml,
      PAGINATION_HTML: paginationHtml,
      TOC_HTML: tocHtml,
      PLAYER_SCRIPT: playerScript,
      BREADCRUMB_JSON: renderBreadcrumbJson(breadcrumbs),
      VIEW_TRANSITION_STYLE: viewTransitionStyle,
      HUB_HOME_URL: hubHomeUrl
    });

    writeFile(join(DIST, route.url, 'index.html'), fullHtml);
    console.log('  rendered: /' + route.url);

    // Add to search index.
    searchDocs.push({
      id: route.url,
      title: articleTitle,
      headings: headings.map(h => h.text),
      content: stripHtml(rawBodyHtml).slice(0, 5000),
      url: '/' + route.url,
      group: route.parentSlug ? findParentLabel(route.parentSlug) : eyebrow
    });
  }


  /* ------------------------------------------------------------------
     Search index + sitemap
     ------------------------------------------------------------------ */

  writeFile(join(DIST, 'search-index.json'), renderSearchIndex(searchDocs));
  console.log('  wrote: /search-index.json (' + searchDocs.length + ' documents)');

  writeFile(join(DIST, 'sitemap.xml'), renderSitemap(flat, today));
  console.log('  wrote: /sitemap.xml');


  console.log('build complete.');
}

build();
