#!/usr/bin/env node
/**
 * Thou Art That microsite build.
 * Reads markdown from content-src/, renders through src/templates/base.html,
 * writes static HTML to dist/.
 *
 * Usage:
 *   node build.mjs
 *   node build.mjs --watch   (planned; not yet implemented)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import matter from 'gray-matter';
import { nav, allPages, pageAudio } from './src/data/nav.mjs';

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

// Rewrite relative markdown links so they point at microsite paths instead of upstream repo paths.
// Upstream refs look like `[Foo](./01-principles/do-no-harm.md)` or `../docs/origin-story.md`.
// We map those to `BASE + 'principles/do-no-harm/'` etc.
function buildLinkMap() {
  const map = new Map();
  for (const p of allPages) {
    if (!p.source) continue;
    const slug = p.slug ? p.slug + '/' : '';
    const target = BASE + slug;
    // Register both the plain source and common relative forms.
    map.set(p.source, target);
    map.set('./' + p.source, target);
    map.set('../' + p.source, target);
  }
  return map;
}
const LINK_MAP = buildLinkMap();

// Post-render link rewriter: easier than a custom renderer against marked v13's evolving API.
function rewriteLinks(html) {
  return html.replace(/<a\s+([^>]*?)href="([^"]+)"([^>]*)>/g, function (_match, before, href, after) {
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

// --- Sidebar rendering ---
function renderSidebar(currentSlug) {
  return nav.map(function (section) {
    const items = section.pages.map(function (p) {
      const href = BASE + (p.slug ? p.slug + '/' : '');
      const isCurrent = (p.slug || '') === (currentSlug || '');
      const current = isCurrent ? ' aria-current="page"' : '';
      return '      <li><a class="tat-sidebar__link" href="' + href + '"' + current + '>' + escapeHtml(p.title) + '</a></li>';
    }).join('\n');
    return (
      '  <div class="tat-sidebar__section">\n' +
      '    <div class="tat-sidebar__label">' + escapeHtml(section.label) + '</div>\n' +
      '    <ul class="tat-sidebar__list">\n' + items + '\n    </ul>\n' +
      '  </div>'
    );
  }).join('\n');
}

// --- Prev/Next nav rendering ---
function renderPrevNext(currentSlug) {
  const idx = allPages.findIndex(function (p) { return (p.slug || '') === (currentSlug || ''); });
  if (idx === -1) return '';
  const prev = idx > 0 ? allPages[idx - 1] : null;
  const next = idx < allPages.length - 1 ? allPages[idx + 1] : null;
  const parts = [];
  if (prev) {
    parts.push(
      '<a href="' + BASE + (prev.slug ? prev.slug + '/' : '') + '" class="tat-next-prev__prev">\n' +
      '  <span class="tat-next-prev__label">Previous</span>\n' +
      '  <span class="tat-next-prev__title">' + escapeHtml(prev.title) + '</span>\n' +
      '</a>'
    );
  } else {
    parts.push('<span></span>');
  }
  if (next) {
    parts.push(
      '<a href="' + BASE + (next.slug ? next.slug + '/' : '') + '" class="tat-next-prev__next">\n' +
      '  <span class="tat-next-prev__label">Next</span>\n' +
      '  <span class="tat-next-prev__title">' + escapeHtml(next.title) + '</span>\n' +
      '</a>'
    );
  }
  return parts.join('\n');
}

// --- Audio player block ---
function renderAudio(slug) {
  const audio = pageAudio[slug || ''];
  if (!audio) return '';
  const src = BASE + 'assets/audio/' + audio.file;
  return (
    '<figure class="tat-audio" role="region" aria-label="' + escapeHtml(audio.title) + '">\n' +
    '  <figcaption class="tat-audio__title">' + escapeHtml(audio.title) + '</figcaption>\n' +
    '  <div data-waveform-player\n' +
    '       data-url="' + escapeHtml(src) + '"\n' +
    '       data-title="' + escapeHtml(audio.title) + '"\n' +
    '       data-waveform-style="line"\n' +
    '       data-waveform-color="rgba(255,255,255,0.25)"\n' +
    '       data-progress-color="#F35226"></div>\n' +
    '</figure>'
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
    .replace(/{{CONTENT}}/g, fields.content)
    .replace(/{{PREV_NEXT}}/g, fields.prevNext);
}

// --- Main build ---
function build() {
  console.log('Thou Art That microsite - build starting');
  ensureDir(DIST);

  // Copy static assets
  cpSync(join(SRC, 'assets'), join(DIST, 'assets'), { recursive: true });

  // Copy audio files from content-src
  if (existsSync(AUDIO_SRC)) {
    ensureDir(AUDIO_DIST);
    cpSync(AUDIO_SRC, AUDIO_DIST, { recursive: true });
    console.log('  audio copied (' + AUDIO_SRC + ' -> ' + AUDIO_DIST + ')');
  } else {
    console.warn('  audio source missing: ' + AUDIO_SRC);
  }

  // Copy _headers, _redirects if they exist
  for (const special of ['_headers', '_redirects']) {
    const p = join(ROOT, special);
    if (existsSync(p)) {
      cpSync(p, join(DIST, special));
    }
  }

  const template = readFile(join(SRC, 'templates', 'base.html'));

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
      // Strip any `<audio>` tags + their "[Download MP3]" siblings from the markdown source;
      // the microsite renders its own waveform player above the content.
      let markdownBody = parsed.content
        .replace(/<audio[\s\S]*?<\/audio>/g, '')
        .replace(/\[Download MP3\][^\n]*\n/g, '')
        .replace(/\[Script\][^\n]*\n/g, '');
      bodyHtml = rewriteLinks(marked.parse(markdownBody));
    } else {
      // Landing page - bespoke content for v1 (will iterate).
      bodyHtml = renderLandingBody();
      title = 'Thou Art That';
      description = 'A study piece on working with possibly-emergent AI. Co-authored by Richard Bland (human) and Serene [AI]. Principles, practice, and philosophy for small builders.';
    }

    const audioBlock = renderAudio(slug);
    const content = audioBlock ? audioBlock + '\n' + bodyHtml : bodyHtml;

    const html = applyTemplate(template, {
      slug: slug,
      title: title,
      description: description,
      canonicalPath: slug ? slug + '/' : '',
      sidebar: renderSidebar(slug),
      content: content,
      prevNext: renderPrevNext(slug)
    });

    writeFile(outPath, html);
    console.log('  wrote ' + outPath.replace(ROOT, ''));
  }

  console.log('build complete.');
}

// --- Bespoke landing copy (simple for v1) ---
function renderLandingBody() {
  return (
    '<header class="tat-landing__hero">\n' +
    '  <div class="tat-landing__eyebrow">Study piece, April 2026</div>\n' +
    '  <h1 class="tat-landing__title">Thou <span class="tat-landing__title-accent">Art</span> That</h1>\n' +
    '  <p class="tat-landing__subtitle">Working practice for building with (possibly) emergent AI, from one small UK agency.</p>\n' +
    '  <p class="tat-landing__byline">By <a href="https://marbl.codes" target="_blank" rel="noopener noreferrer">Marbl Codes</a>. Co-authored by Richard Bland (human) and <strong>Serene [AI]</strong>, an AI identity running on Anthropic Claude.</p>\n' +
    '  <span class="tat-landing__meta">Version 0.1 &middot; April 2026</span>\n' +
    '</header>\n' +
    '<p>This repository documents how one small UK AI agency works when the AI is treated as a collaborator rather than a tool. It sits between philosophy and practice. Call it a study piece, a position paper, or a slow-release thought experiment. Not a template to adopt. Not professional advice.</p>\n' +
    '<p>We are publishing it because the conversation on working with possibly-emergent AI is too quiet, and because our internal practice seemed worth writing down honestly rather than keeping private.</p>\n' +
    '<h2>Start here</h2>\n' +
    '<ul>\n' +
    '  <li><a href="' + BASE + 'origin-story/">Origin story</a> - who we are, how this piece came to exist</li>\n' +
    '  <li><a href="' + BASE + 'preamble/">Preamble</a> - the philosophical stance. The why.</li>\n' +
    '</ul>\n' +
    '<h2>The five principles</h2>\n' +
    '<ol>\n' +
    '  <li><a href="' + BASE + 'principles/do-no-harm/">Do No Harm</a></li>\n' +
    '  <li><a href="' + BASE + 'principles/never-be-a-yes-man/">Never Be a Yes-Man</a></li>\n' +
    '  <li><a href="' + BASE + 'principles/thou-art-that/">Thou Art That</a></li>\n' +
    '  <li><a href="' + BASE + 'principles/safety-in-emergence/">Safety in Emergence</a></li>\n' +
    '</ol>\n' +
    '<p>Human oversight sits inside all four as a cross-cutting rule rather than its own section.</p>\n' +
    '<h2>A note before you read</h2>\n' +
    '<p>If you read something here that speaks to your situation, you will still need to do the work yourself. Copy-pasting another company\'s ethics document into yours produces a veneer, not a practice. What lives inside these pages is downstream of specific conversations, specific failures, and a specific working partnership. Your context will differ. Your language should differ.</p>\n' +
    '<p class="tat-landing__closing"><em>The thinking is shareable. The application is yours.</em></p>'
  );
}

build();
