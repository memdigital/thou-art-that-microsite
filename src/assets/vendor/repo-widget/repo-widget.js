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

  function refresh(el) {
    var widget = el.closest('[data-shields-repo]');
    if (!widget) return;
    var repo = widget.getAttribute('data-shields-repo');
    var metric = el.getAttribute('data-shields-metric');
    if (!repo || !metric || !ENDPOINTS[metric]) return;

    var url = 'https://img.shields.io/' + ENDPOINTS[metric] + '/' + repo + '.json';
    fetch(url, { credentials: 'omit', mode: 'cors' })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        if (!data || isSentinel(data.message)) return;
        el.textContent = data.message;
      })
      .catch(function () { /* keep baked value */ });
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
