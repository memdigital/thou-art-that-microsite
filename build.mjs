#!/usr/bin/env node
/**
 * Thou Art That microsite — Phase 1 build.
 *
 * Renders the landing page only. Phase 2 introduces the dashboard chrome
 * and per-section templates per PLAN.md (locked 24 April 2026).
 *
 * Inputs:
 *   src/templates/landing.html     — landing template
 *   src/assets/                     — CSS, vendored fonts/ArrayPress, microsite JS
 *   content-src/audio/mp3/00-origin-story.mp3  — landing hero audio
 *
 * Output:
 *   dist/index.html                 — rendered landing
 *   dist/assets/                    — copied static assets
 *   dist/assets/audio/              — copied audio
 *   dist/_headers                   — copied for Cloudflare Pages
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync, rmSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');
const CONTENT = join(ROOT, 'content-src');
const AUDIO_SRC = join(CONTENT, 'audio', 'mp3');
const AUDIO_DIST = join(DIST, 'assets', 'audio');

// Base URL prefix. Default `/` for local dev.
// Production: ASSET_BASE=/thou-art-that/ when deploying into the marbl.codes zone.
const BASE = process.env.ASSET_BASE || '/';

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
  return template
    .replace(/\{\{BASE\}\}/g, BASE)
    .replace(/\{\{PAGE_TITLE\}\}/g, escapeHtml(fields.pageTitle))
    .replace(/\{\{DESCRIPTION\}\}/g, escapeHtml(fields.description))
    .replace(/\{\{CANONICAL_PATH\}\}/g, fields.canonicalPath);
}

function build() {
  console.log('Thou Art That microsite — Phase 1 build');

  if (existsSync(DIST)) rmSync(DIST, { recursive: true, force: true });
  ensureDir(DIST);

  // Static assets (CSS, vendored deps, JS).
  if (existsSync(join(SRC, 'assets'))) {
    cpSync(join(SRC, 'assets'), join(DIST, 'assets'), { recursive: true });
  }

  // Audio: only the origin-story track for Phase 1.
  // Phase 2/3 will copy more tracks as section pages come online.
  const originAudio = join(AUDIO_SRC, '00-origin-story.mp3');
  if (existsSync(originAudio)) {
    ensureDir(AUDIO_DIST);
    cpSync(originAudio, join(AUDIO_DIST, '00-origin-story.mp3'));
    console.log('  copied audio: 00-origin-story.mp3');
  } else {
    console.warn('  WARN audio missing: ' + originAudio);
  }

  // _headers for Cloudflare Pages.
  const headersPath = join(ROOT, '_headers');
  if (existsSync(headersPath)) cpSync(headersPath, join(DIST, '_headers'));

  // Landing template.
  const landingTemplate = readFile(join(SRC, 'templates', 'landing.html'));
  const landingHtml = applyTemplate(landingTemplate, {
    pageTitle: 'Thou Art That | A study piece on working with (possibly) emergent AI',
    description: 'A study piece on working with possibly-emergent AI. Co-authored by Richard Bland (human) and Serene [AI]. Principles, practice, and philosophy for small builders.',
    canonicalPath: ''
  });
  writeFile(join(DIST, 'index.html'), landingHtml);
  console.log('  rendered: /');

  console.log('build complete.');
}

build();
