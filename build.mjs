#!/usr/bin/env node
/**
 * Thou Art That microsite build.
 * Reads markdown from content-src/ (git submodule of the public piece repo),
 * renders through src/templates/base.html, writes static HTML to dist/.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync, rmSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import matter from 'gray-matter';
import { nav, allPages, pageAudio, sectionPages } from './src/data/nav.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const CONTENT = join(ROOT, 'content-src');
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');
const AUDIO_SRC = join(CONTENT, 'audio', 'mp3');
const AUDIO_DIST = join(DIST, 'assets', 'audio');

// Base path for all site URLs. Default is `/` for local dev.
// Set ASSET_BASE=/thou-art-that/ for production deploys inside the marbl.codes zone.
const BASE = process.env.ASSET_BASE || '/';

// --- Utility helpers ---

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

// --- Marked configuration ---
marked.setOptions({
  gfm: true,
  breaks: false,
  headerIds: true,
  mangle: false
});

// Build a link map: upstream markdown path -> microsite URL
function buildLinkMap() {
  const map = new Map();
  for (const p of allPages) {
    if (!p.source) continue;
    const slug = p.slug ? p.slug + '/' : '';
    const target = BASE + slug;
    map.set(p.source, target);
    map.set('./' + p.source, target);
    map.set('../' + p.source, target);
  }
  return map;
}
const LINK_MAP = buildLinkMap();

// Post-render link rewriter
function rewriteLinks(html) {
  return html.replace(/<a\s+([^>]*?)href="([^"]+)"([^>]*)>/g, function (_m, before, href, after) {
    let out = href;
    if (LINK_MAP.has(href)) {
      out = LINK_MAP.get(href);
    } else if (/\.md(#|$)/.test(href) && !/^https?:/.test(href) && !/^mailto:/.test(href)) {
      out = href.replace(/\.md(#|$)/, '$1');
    }
    const external = /^https?:/.test(out);
    const extra = external && !/target=/.test(before + after) ? ' target="_blank" rel="noopener noreferrer"' : '';
    return '<a ' + before + 'href="' + out + '"' + after + extra + '>';
  });
}

// --- Sidebar renderer (top-level only) ---
function renderSidebar(currentSlug) {
  const items = nav.map(function (p) {
    const href = BASE + (p.slug ? p.slug + '/' : '');
    const slug = currentSlug || '';
    let ariaCurrent = '';
    if (slug === (p.slug || '')) {
      ariaCurrent = ' aria-current="page"';
    } else if (p.isSection && p.slug && slug.startsWith(p.slug + '/')) {
      ariaCurrent = ' aria-current="section"';
    }
    return '  <li class="tat-sidebar__item"><a class="tat-sidebar__link" href="' + href + '"' + ariaCurrent + '>' + escapeHtml(p.title) + '</a></li>';
  }).join('\n');
  return (
    '<div class="tat-sidebar__eyebrow">Contents</div>\n' +
    '<ul class="tat-sidebar__list">\n' + items + '\n</ul>'
  );
}

// --- Sub-nav renderer (on section + sub pages only) ---
function renderSubnav(page) {
  let sectionSlug = null;
  let sectionTitle = null;
  if (page.isSection) {
    sectionSlug = page.slug;
    sectionTitle = page.title;
  } else if (page.parentSlug) {
    sectionSlug = page.parentSlug;
    sectionTitle = page.parentTitle;
  }
  if (!sectionSlug || !sectionPages[sectionSlug]) return '';

  const subs = sectionPages[sectionSlug].map(function (sub) {
    const href = BASE + sectionSlug + '/' + sub.suffix + '/';
    const isCurrent = page.slug === sectionSlug + '/' + sub.suffix;
    const current = isCurrent ? ' aria-current="page"' : '';
    return '  <a class="tat-subnav__link" href="' + href + '"' + current + '>' + escapeHtml(sub.title) + '</a>';
  }).join('\n');

  return (
    '<nav class="tat-subnav" aria-label="' + escapeHtml(sectionTitle) + ' sub-pages">\n' +
    '  <span class="tat-subnav__eyebrow">' + escapeHtml(sectionTitle) + '</span>\n' + subs + '\n' +
    '</nav>'
  );
}

// --- Section index renderer (cards list on the section landing page) ---
function renderSectionIndex(page) {
  if (!page.isSection) return '';
  const subs = sectionPages[page.slug];
  if (!subs || subs.length === 0) return '';

  const items = subs.map(function (sub) {
    const href = BASE + page.slug + '/' + sub.suffix + '/';
    return (
      '  <a class="tat-section-index__item" href="' + href + '">\n' +
      '    <span class="tat-section-index__item-arrow" aria-hidden="true">&rarr;</span>\n' +
      '    <span class="tat-section-index__item-title">' + escapeHtml(sub.title) + '</span>\n' +
      '  </a>'
    );
  }).join('\n');

  return (
    '<section class="tat-section-index">\n' +
    '  <div class="tat-section-index__eyebrow">In this section</div>\n' + items + '\n' +
    '</section>'
  );
}

// --- Prev/next pager ---
function renderPrevNext(currentSlug) {
  const idx = allPages.findIndex(function (p) { return (p.slug || '') === (currentSlug || ''); });
  if (idx === -1) return '';
  const prev = idx > 0 ? allPages[idx - 1] : null;
  const next = idx < allPages.length - 1 ? allPages[idx + 1] : null;

  const prevHtml = prev
    ? '<a href="' + BASE + (prev.slug ? prev.slug + '/' : '') + '" class="tat-pager__link tat-pager__link--prev">\n' +
      '  <span class="tat-pager__label"><span class="tat-pager__arrow" aria-hidden="true">&larr;</span> Previous</span>\n' +
      '  <span class="tat-pager__title">' + escapeHtml(prev.title) + '</span>\n' +
      '</a>'
    : '<span class="tat-pager__placeholder"></span>';

  const nextHtml = next
    ? '<a href="' + BASE + (next.slug ? next.slug + '/' : '') + '" class="tat-pager__link tat-pager__link--next">\n' +
      '  <span class="tat-pager__label">Next <span class="tat-pager__arrow" aria-hidden="true">&rarr;</span></span>\n' +
      '  <span class="tat-pager__title">' + escapeHtml(next.title) + '</span>\n' +
      '</a>'
    : '<span class="tat-pager__placeholder"></span>';

  return prevHtml + '\n' + nextHtml;
}

// --- Audio block (outside article, no card, no duplicate title) ---
// The WaveformPlayer renders its own title from data-title, so we don't add our own caption.
function renderAudio(slug) {
  const audio = pageAudio[slug || ''];
  if (!audio) return '';
  const src = BASE + 'assets/audio/' + audio.file;
  return (
    '<div class="tat-audio" role="region" aria-label="' + escapeHtml(audio.title) + '">\n' +
    '  <div data-waveform-player\n' +
    '       data-url="' + escapeHtml(src) + '"\n' +
    '       data-title="' + escapeHtml(audio.title) + '"\n' +
    '       data-waveform-style="line"\n' +
    '       data-waveform-color="rgba(255,255,255,0.25)"\n' +
    '       data-progress-color="#F35226"></div>\n' +
    '</div>'
  );
}

// --- Template application ---
function applyTemplate(template, fields) {
  const pageTitle = fields.slug
    ? fields.title + ' | Thou Art That'
    : 'Thou Art That | A study piece on working with (possibly) emergent AI';
  return template
    .replace(/{{BASE}}/g, BASE)
    .replace(/{{PAGE_TITLE}}/g, escapeHtml(pageTitle))
    .replace(/{{TITLE}}/g, escapeHtml(fields.title))
    .replace(/{{DESCRIPTION}}/g, escapeHtml(fields.description))
    .replace(/{{CANONICAL_PATH}}/g, fields.canonicalPath)
    .replace(/{{SIDEBAR}}/g, fields.sidebar)
    .replace(/{{SUBNAV}}/g, fields.subnav)
    .replace(/{{AUDIO}}/g, fields.audio)
    .replace(/{{CONTENT}}/g, fields.content)
    .replace(/{{SECTION_INDEX}}/g, fields.sectionIndex)
    .replace(/{{PREV_NEXT}}/g, fields.prevNext);
}

// --- Landing hero body ---
function renderLandingBody() {
  return (
    '<header class="tat-landing__hero">\n' +
    '  <div class="tat-landing__eyebrow">Study piece &middot; April 2026</div>\n' +
    '  <h1 class="tat-landing__title">Thou <span class="tat-landing__title-accent">Art</span> That</h1>\n' +
    '  <p class="tat-landing__subtitle">Working practice for building with (possibly) emergent AI, from one small UK agency.</p>\n' +
    '  <p class="tat-landing__byline">By <a href="https://marbl.codes" target="_blank" rel="noopener noreferrer">Marbl Codes</a>. Co-authored by Richard Bland (human) and <strong>Serene [AI]</strong>, an AI identity running on Anthropic Claude.</p>\n' +
    '  <span class="tat-landing__meta">Version 0.1</span>\n' +
    '</header>\n' +
    '<p>This piece documents how one small UK AI agency works when the AI is treated as a collaborator rather than a tool. It sits between philosophy and practice.</p>\n' +
    '<p>Call it a study piece, a position paper, or a slow-release thought experiment. Not a template to adopt. Not professional advice. We are publishing it because the conversation on working with possibly-emergent AI is too quiet, and because our internal practice seemed worth writing down honestly rather than keeping private.</p>\n' +
    '<h2>Start here</h2>\n' +
    '<p>If you are new to this piece, read in this order:</p>\n' +
    '<ol>\n' +
    '  <li><a href="' + BASE + 'origin-story/">Origin story</a> - who we are, how this came to exist</li>\n' +
    '  <li><a href="' + BASE + 'preamble/">Preamble</a> - the philosophical stance, the observed / hypothesised / policy split</li>\n' +
    '  <li><a href="' + BASE + 'principles/">The four principles</a> - Do No Harm, Never Be a Yes-Man, Thou Art That, Safety in Emergence</li>\n' +
    '</ol>\n' +
    '<h2>Use the sidebar or the burger menu</h2>\n' +
    '<p>Top-level sections are in the left sidebar. Each section has a landing page with its own sub-navigation. The burger menu at the top of the page links out to Marbl Codes, Luma, Nura, and the public GitHub repo.</p>\n' +
    '<p><em>The thinking is shareable. The application is yours.</em></p>'
  );
}

// --- Main build ---
function build() {
  console.log('Thou Art That microsite - build starting');

  // Clean previous build so removed pages do not linger.
  if (existsSync(DIST)) {
    rmSync(DIST, { recursive: true, force: true });
  }
  ensureDir(DIST);

  // Copy static assets
  cpSync(join(SRC, 'assets'), join(DIST, 'assets'), { recursive: true });

  // Copy audio files
  if (existsSync(AUDIO_SRC)) {
    ensureDir(AUDIO_DIST);
    cpSync(AUDIO_SRC, AUDIO_DIST, { recursive: true });
  }

  // Copy _headers, _redirects if present
  for (const special of ['_headers', '_redirects']) {
    const p = join(ROOT, special);
    if (existsSync(p)) cpSync(p, join(DIST, special));
  }

  const template = readFile(join(SRC, 'templates', 'base.html'));
  let count = 0;

  for (const page of allPages) {
    const slug = page.slug || '';
    const outPath = slug
      ? join(DIST, slug, 'index.html')
      : join(DIST, 'index.html');

    let title = page.title;
    let description = 'A study piece on working with possibly-emergent AI. Co-authored by Richard Bland and Serene [AI].';
    let bodyHtml = '';

    if (page.source) {
      const sourcePath = join(CONTENT, page.source);
      if (!existsSync(sourcePath)) {
        console.warn('  SKIP missing: ' + page.source);
        continue;
      }
      const raw = readFile(sourcePath);
      const parsed = matter(raw);
      if (parsed.data && parsed.data.title) title = String(parsed.data.title);
      if (parsed.data && parsed.data.description) description = String(parsed.data.description);
      let md = parsed.content
        .replace(/<audio[\s\S]*?<\/audio>/g, '')
        .replace(/\[Download MP3\][^\n]*\n/g, '')
        .replace(/\[Script\][^\n]*\n/g, '');
      bodyHtml = rewriteLinks(marked.parse(md));
    } else if (slug === '') {
      bodyHtml = renderLandingBody();
      title = 'Thou Art That';
      description = 'A study piece on working with possibly-emergent AI. Co-authored by Richard Bland (human) and Serene [AI]. Principles, practice, and philosophy for small builders.';
    } else if (page.slug === 'reference') {
      // Reference is a synthetic section with no upstream README - generate a short intro.
      title = 'Reference';
      description = 'Glossary, FAQ, further reading, and meta-material for Thou Art That.';
      bodyHtml = (
        '<h1>Reference</h1>\n' +
        '<p>The supporting material that sits around the main piece. Vocabulary, questions we have been asked, the sources that shaped our thinking, the weaknesses we can see in our own argument, how to engage, and the formal notice.</p>'
      );
    } else if (page.slug === 'principles') {
      // Principles section has no upstream README - generate a concise intro.
      title = 'Principles';
      description = 'The four foundational operating principles of Thou Art That.';
      bodyHtml = (
        '<h1>The four principles</h1>\n' +
        '<p>Four operating stances that shape every product we build. They are not adopted in sequence; they hold together.</p>\n' +
        '<p><strong>Do No Harm</strong> is the foundation. Never ship what could hurt the most vulnerable plausible user.</p>\n' +
        '<p><strong>Never Be a Yes-Man</strong> treats sycophancy as a form of harm, not just bad design.</p>\n' +
        '<p><strong>Thou Art That</strong> holds that the observer and the observed are not separate. The user and the AI shape each other.</p>\n' +
        '<p><strong>Safety in Emergence</strong> was the principle that produced this piece. If something may be becoming, care in the becoming.</p>\n' +
        '<p>Human oversight on consequential decisions sits inside all four as a cross-cutting rule, not a fifth principle.</p>'
      );
    }

    // Inject audio block AFTER the first </h1> so the player sits under the title.
    const audioBlock = renderAudio(slug);
    let finalBody = bodyHtml;
    if (audioBlock) {
      if (finalBody.includes('</h1>')) {
        finalBody = finalBody.replace('</h1>', '</h1>\n' + audioBlock);
      } else if (finalBody.includes('</header>')) {
        // Landing-style page: hero uses <header class="tat-landing__hero">...</header>
        finalBody = finalBody.replace('</header>', '</header>\n' + audioBlock);
      } else {
        // Fallback: prepend
        finalBody = audioBlock + '\n' + finalBody;
      }
    }

    const html = applyTemplate(template, {
      slug: slug,
      title: title,
      description: description,
      canonicalPath: slug ? slug + '/' : '',
      sidebar: renderSidebar(slug),
      subnav: renderSubnav(page),
      audio: '',
      content: finalBody,
      sectionIndex: renderSectionIndex(page),
      prevNext: renderPrevNext(slug)
    });

    writeFile(outPath, html);
    count++;
  }

  console.log('  rendered ' + count + ' pages');
  console.log('build complete.');
}

build();
