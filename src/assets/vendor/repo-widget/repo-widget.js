/**
 * Repo widget — shields.io live mode (v2.0.0).
 *
 * Progressive enhancement over the build-time-baked stats. The HTML
 * ships with values baked at build (so AEO crawlers and no-JS clients
 * see real numbers immediately, no FOUC, no layout shift). On
 * DOMContentLoaded this script reads img.shields.io's JSON endpoint
 * for each stat and overwrites the text node if the response is
 * sensible. If the fetch fails or returns a sentinel error message
 * ("not found" / "no releases"), the baked value is retained.
 *
 * Markup contract:
 *   <article class="repo-widget" data-shields-repo="owner/name">
 *     <span data-shields-metric="stars">42</span>
 *     <span data-shields-metric="forks">3</span>
 *     <span data-shields-metric="release">v0.1.0</span>
 *     <time data-shields-metric="last-commit">2 days ago</time>
 *   </article>
 *
 * Network: requires CSP `connect-src https://img.shields.io` on the
 * consuming page. Shields handles GitHub API rate limits + caching
 * upstream so we don't.
 */
(function () {
  'use strict';

  // Shields path per metric. Keep this list in sync with the partial.
  var ENDPOINTS = {
    'stars': 'github/stars',
    'forks': 'github/forks',
    'last-commit': 'github/last-commit',
    'release': 'github/v/release'
  };

  // Shields returns a 200 with sentinel messages for missing data
  // (e.g. "no releases or repo not found"). Treat these as "no upgrade".
  function isSentinel(message) {
    if (!message) return true;
    var lower = String(message).toLowerCase();
    return lower.indexOf('not found') !== -1
        || lower.indexOf('no releases') !== -1
        || lower.indexOf('invalid') !== -1;
  }

  // 2-second timeout per fetch via AbortController. If shields.io is slow
  // or down, we silently keep the baked value rather than leaving the user
  // staring at a stale-feeling page while the request hangs.
  var FETCH_TIMEOUT_MS = 2000;

  function refresh(el) {
    var widget = el.closest('[data-shields-repo]');
    if (!widget) return;
    var repo = widget.getAttribute('data-shields-repo');
    var metric = el.getAttribute('data-shields-metric');
    if (!repo || !metric || !ENDPOINTS[metric]) return;

    var url = 'https://img.shields.io/' + ENDPOINTS[metric] + '/' + repo + '.json';
    var controller = ('AbortController' in window) ? new AbortController() : null;
    var timer = controller
      ? setTimeout(function () { controller.abort(); }, FETCH_TIMEOUT_MS)
      : null;

    var opts = { credentials: 'omit', mode: 'cors' };
    if (controller) opts.signal = controller.signal;

    fetch(url, opts)
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        if (!data || isSentinel(data.message)) return;
        // Defensive: only accept string messages — if shields ever changes
        // shape and returns an object, do not coerce it into the DOM.
        if (typeof data.message !== 'string') return;
        var oldValue = el.textContent;
        el.textContent = data.message;
        // WCAG 2.5.3 (Label in Name): the parent anchor's aria-label is
        // baked at build time and contains the old value. Replace the
        // first occurrence so the accessible name still contains the
        // visible text after the live swap.
        var anchor = el.closest('a[aria-label]');
        if (anchor && oldValue && oldValue !== data.message) {
          var label = anchor.getAttribute('aria-label');
          if (label && label.indexOf(oldValue) !== -1) {
            anchor.setAttribute('aria-label', label.replace(oldValue, data.message));
          }
        }
      })
      .catch(function () { /* keep baked value */ })
      .then(function () { if (timer) clearTimeout(timer); });
  }

  function init() {
    var els = document.querySelectorAll('[data-shields-metric]');
    for (var i = 0; i < els.length; i++) refresh(els[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
