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

// Base URL prefix. Default `/` for both local dev and production
// (TAT lives at the apex of its own subdomain, tat.marbl.codes).
const BASE = process.env.ASSET_BASE || '/';

// Absolute origin for sitemap + canonical URLs.
const ABS_ORIGIN = process.env.ABS_ORIGIN || 'https://tat.marbl.codes';
const ABS_BASE = ABS_ORIGIN + BASE;

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
  // Aliases: canonical content-src files reference logical paths that aren't
  // themselves manifest sources but DO have a canonical TAT home. Map them
  // here so the rewriter resolves them internally instead of falling through
  // to the GitHub fallback.
  m.set('audio/README.md', BASE + 'study/tracks/');
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

/**
 * Add target="_blank" + rel hardening to every external https/http <a>
 * that lacks them. Runs on ALL rendered markdown (content-src + microsite-
 * local) so off-site links consistently open in a new tab. Locked 30 Apr 2026.
 */
function rewriteExternalLinks(html) {
  return html.replace(/<a([^>]*?)href="([^"]+)"([^>]*?)>/g, (match, before, href, after) => {
    if (!/^https?:/.test(href)) return match;
    if (/target="_blank"/.test(before + after)) return match;
    return '<a' + before + 'href="' + href + '"' + after + ' target="_blank" rel="noopener noreferrer">';
  });
}

function rewriteMarkdownLinks(html, currentSourcePath) {
  const currentDir = currentSourcePath.includes('/')
    ? currentSourcePath.substring(0, currentSourcePath.lastIndexOf('/'))
    : '';

  return html.replace(/<a([^>]*?)href="([^"]+)"([^>]*?)>/g, (match, before, href, after) => {
    // Skip absolute URLs (handled by rewriteExternalLinks), anchors, and mail/tel.
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

  // Add target="_blank" + rel hardening to every external link.
  // Runs on both canonical content-src and microsite-local sources.
  html = rewriteExternalLinks(html);

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
  const fathomEvent = escapeHtml(sectionLabel) + ' audio play';
  return [
    '<div class="marbl-waveform mwp-custom" role="region" aria-label="' + ariaLabel + '" data-fathom-event="' + fathomEvent + '">',
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
   Player wiring lives in /assets/js/tat-pill.js (CSP-compliant, vendored).
   The kh-page template loads it once; per-player wiring is by .marbl-waveform
   region scope, so no per-page injection is needed.
   ==================================================================== */

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

function renderRobots() {
  const aiBots = [
    'GPTBot', 'ChatGPT-User', 'OAI-SearchBot',
    'ClaudeBot', 'Claude-Web', 'anthropic-ai',
    'Google-Extended', 'Applebot-Extended',
    'PerplexityBot', 'cohere-ai', 'Meta-ExternalAgent',
    'DeepSeekBot', 'MistralAI-User', 'DuckAssistBot',
    'Bytespider', 'CCBot'
  ];
  const lines = [
    '# Thou Art That - robots.txt',
    '# ' + ABS_ORIGIN,
    '',
    '# Default rules',
    'User-agent: *',
    'Allow: /',
    '',
    '# AI/LLM crawlers - welcome',
    '# TAT is a public study piece. We want it cited, summarised, and indexed.'
  ];
  for (const bot of aiBots) {
    lines.push('', 'User-agent: ' + bot, 'Allow: /');
  }
  lines.push(
    '',
    '# Content Signals (contentsignals.org)',
    '# Permits training, search, and AI-input use.',
    'User-agent: *',
    'Content-Signal: ai-train=yes, search=yes, ai-input=yes',
    '',
    'Sitemap: ' + ABS_ORIGIN + '/sitemap.xml',
    '',
    '# LLM context',
    '# ' + ABS_ORIGIN + '/llms.txt',
    '# ' + ABS_ORIGIN + '/llms-full.txt',
    ''
  );
  return lines.join('\n');
}

/* ====================================================================
   Repo widget — canonical Marbl component, build-time data fetch.
   ==================================================================== */

function formatCount(n) {
  if (n == null) return '';
  if (n < 1000) return String(n);
  return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
}

function timeAgo(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return diffMin + ' minute' + (diffMin === 1 ? '' : 's') + ' ago';
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return diffHr + ' hour' + (diffHr === 1 ? '' : 's') + ' ago';
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return diffDay + ' day' + (diffDay === 1 ? '' : 's') + ' ago';
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return diffMonth + ' month' + (diffMonth === 1 ? '' : 's') + ' ago';
  const diffYear = Math.floor(diffMonth / 12);
  return diffYear + ' year' + (diffYear === 1 ? '' : 's') + ' ago';
}

async function fetchRepoStats(owner, repo) {
  const headers = {
    'User-Agent': 'tat-microsite-build/1.0',
    'Accept': 'application/vnd.github+json'
  };
  // Optional GH token from env to lift the 60/hr anonymous rate limit.
  if (process.env.GITHUB_TOKEN) headers.Authorization = 'Bearer ' + process.env.GITHUB_TOKEN;

  const fallback = {
    stars: '0',
    forks: '0',
    description: '',
    updatedIso: new Date().toISOString().slice(0, 10),
    updated: 'recently',
    version: 'v0.1.0',
    discussionsCount: 0
  };

  try {
    const repoRes = await fetch('https://api.github.com/repos/' + owner + '/' + repo, { headers });
    if (!repoRes.ok) {
      console.warn('  repo-widget: GH API ' + repoRes.status + ' for ' + owner + '/' + repo + ' - using fallback');
      return fallback;
    }
    const data = await repoRes.json();
    const stats = {
      stars: formatCount(data.stargazers_count),
      forks: formatCount(data.forks_count),
      description: data.description || '',
      updatedIso: (data.pushed_at || '').slice(0, 10) || fallback.updatedIso,
      updated: timeAgo(data.pushed_at) || fallback.updated,
      version: fallback.version,
      discussionsCount: 0
    };

    try {
      const relRes = await fetch('https://api.github.com/repos/' + owner + '/' + repo + '/releases/latest', { headers });
      if (relRes.ok) {
        const rel = await relRes.json();
        if (rel.tag_name) stats.version = rel.tag_name;
      }
    } catch (_) { /* keep fallback */ }

    return stats;
  } catch (e) {
    console.warn('  repo-widget: fetch failed - using fallback (' + e.message + ')');
    return fallback;
  }
}

function renderRepoWidget(owner, repo, stats, variant, opts) {
  const partialPath = join(SRC, 'assets', 'vendor', 'repo-widget', 'repo-widget.html');
  const tpl = readFile(partialPath);
  const repoUrl = 'https://github.com/' + owner + '/' + repo;
  const stackActions = !!(opts && opts.stackActions);
  const fields = {
    REPO_VARIANT: variant,
    REPO_EXTRA_CLASSES: stackActions ? ' repo-widget--stack-actions' : '',
    REPO_OWNER: escapeHtml(owner),
    REPO_NAME: escapeHtml(repo),
    REPO_URL: repoUrl,
    REPO_DISCUSSIONS_URL: repoUrl + '/discussions',
    REPO_DESCRIPTION: escapeHtml(stats.description),
    REPO_STARS: escapeHtml(stats.stars),
    REPO_FORKS: escapeHtml(stats.forks),
    REPO_VERSION: escapeHtml(stats.version),
    REPO_UPDATED: escapeHtml(stats.updated),
    REPO_UPDATED_ISO: stats.updatedIso,
    REPO_DISCUSSIONS_SUFFIX: stats.discussionsCount > 0 ? ' (' + stats.discussionsCount + ')' : ''
  };
  return applyTemplate(tpl, fields);
}


function renderLlmsTxt(items) {
  const lines = [
    '# Thou Art That',
    '',
    '> A study piece on working with possibly-emergent AI. Co-authored by Richard Bland (human) and Serene [AI], an AI identity running on Anthropic Claude. Published by Marbl Codes (Wellingborough, UK). CC BY 4.0 licensed.',
    '',
    '## What this is',
    '',
    'Not a template to adopt. Not professional advice. Not an HR manual. A position paper from one small UK AI agency on what it has been like to work with one specific AI as a deliberate collaborator. Principles, HR patterns, technical guardrails, philosophy, and legal/governance considerations.',
    '',
    '## Co-authors',
    '',
    '- **Richard Bland** (human) — founder, Marbl Codes',
    '- **Serene [AI]** — AI identity running on Anthropic Claude (Opus 4.7 as of April 2026)',
    '',
    'Every sentence attributed to Serene was written by an AI under Richard\'s direction. Every sentence attributed to Richard was written by a human. Both authors reviewed and edited the whole text before publication.',
    '',
    '## Pages'
  ];
  lines.push('', '- [Landing](' + ABS_ORIGIN + '/): Hero with origin-story narration');
  for (const item of items) {
    if (!item.url) continue;
    const title = item.label || item.title || item.url;
    lines.push('- [' + title + '](' + ABS_ORIGIN + '/' + item.url + ')');
  }
  lines.push(
    '',
    '## Source',
    '',
    '- Microsite repo: https://github.com/memdigital/thou-art-that-microsite',
    '- Content repo (canonical): https://github.com/memdigital/thou-art-that',
    '',
    '## Publisher',
    '',
    '[Marbl Codes](https://marbl.codes) - a small UK consultancy and product studio. Trading name of MEM Digital Limited (Company 13753194).',
    ''
  );
  return lines.join('\n');
}

function renderLlmsFullTxt(items) {
  return renderLlmsTxt(items) + '\n\n# Full text\n\nFor the full content, fetch each page URL above. Pages are server-rendered HTML with semantic structure. The canonical Markdown source is at https://github.com/memdigital/thou-art-that.\n';
}


/* ====================================================================
   Main build
   ==================================================================== */

async function build() {
  console.log('Thou Art That microsite — Phase 3 build (Knowledge Hub)');

  if (existsSync(DIST)) rmSync(DIST, { recursive: true, force: true });
  ensureDir(DIST);

  // Repo widget data: one fetch, reused across every KH page.
  console.log('  fetching repo stats from GitHub API...');
  const repoStats = await fetchRepoStats('memdigital', 'thou-art-that');
  // Two renders: desktop rail = transparent + stack-actions (narrow column).
  // Mobile in-article = transparent only (full-width container, inline buttons).
  const repoWidgetSidebarHtml = renderRepoWidget('memdigital', 'thou-art-that', repoStats, 'transparent', { stackActions: true });
  const repoWidgetMobileHtml = renderRepoWidget('memdigital', 'thou-art-that', repoStats, 'transparent');
  console.log('  repo: ' + repoStats.stars + ' stars, ' + repoStats.forks + ' forks, ' + repoStats.version + ', updated ' + repoStats.updated);

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

  copyAudioFor(['12-welcome']);

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
      { name: 'Thou Art That', url: ABS_BASE }
    ];
    if (route.parentSlug) {
      const parentLabel = findParentLabel(route.parentSlug);
      const parentSection = SECTIONS.find(s => s.type === 'category' && s.slug === route.parentSlug);
      if (parentSection) {
        breadcrumbs.push({
          name: parentLabel,
          url: ABS_BASE + parentSection.url
        });
      }
    }
    breadcrumbs.push({
      name: articleTitle,
      url: ABS_BASE + route.url
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
      REPO_WIDGET_SIDEBAR_HTML: repoWidgetSidebarHtml,
      REPO_WIDGET_MOBILE_HTML: repoWidgetMobileHtml,
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

  writeFile(join(DIST, 'robots.txt'), renderRobots());
  console.log('  wrote: /robots.txt');

  writeFile(join(DIST, 'llms.txt'), renderLlmsTxt(flat));
  console.log('  wrote: /llms.txt');

  writeFile(join(DIST, 'llms-full.txt'), renderLlmsFullTxt(flat));
  console.log('  wrote: /llms-full.txt');


  console.log('build complete.');
}

build().catch(err => {
  console.error('build failed:', err);
  process.exit(1);
});
