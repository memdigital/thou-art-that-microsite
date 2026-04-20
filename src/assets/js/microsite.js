/**
 * Thou Art That microsite client JS.
 * - Initialises ArrayPress WaveformPlayer instances
 * - Populates the GitHub chip star count
 *   (via CF Worker proxy once deployed; falls back to direct api.github.com
 *   with localStorage cache for local dev / unauthenticated traffic)
 */

(function () {
  'use strict';

  // --- Waveform players ---
  function initWaveformPlayers() {
    if (typeof WaveformPlayer === 'undefined') {
      setTimeout(initWaveformPlayers, 100);
      return;
    }
    var players = document.querySelectorAll('[data-waveform-player]:not([data-waveform-initialized])');
    players.forEach(function (player) {
      player.setAttribute('data-waveform-initialized', 'true');
      try {
        new WaveformPlayer(player);
      } catch (e) {
        console.error('WaveformPlayer init error:', e);
      }
    });
  }

  // --- GitHub chip ---
  var GH_REPO = 'memdigital/thou-art-that';
  var WORKER_ENDPOINT = 'https://github-stats.marbl-codes.workers.dev/repos/' + GH_REPO;
  var DIRECT_ENDPOINT = 'https://api.github.com/repos/' + GH_REPO;
  var CACHE_KEY = 'tat:gh:' + GH_REPO;
  var CACHE_TTL = 5 * 60 * 1000;

  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.fetched_at) return null;
      if (Date.now() - parsed.fetched_at > CACHE_TTL) return null;
      return parsed;
    } catch (e) { return null; }
  }

  function writeCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        stargazers_count: data.stargazers_count,
        fetched_at: Date.now()
      }));
    } catch (e) { /* quota, private mode */ }
  }

  function formatStars(n) {
    if (typeof n !== 'number') return '';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k stars';
    if (n === 1) return '1 star';
    return n + ' stars';
  }

  function fetchJson(url) {
    return fetch(url, { headers: { 'Accept': 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      });
  }

  function paintStars(el, n) {
    if (typeof n !== 'number') return;
    el.textContent = formatStars(n);
  }

  function loadGitHubStats() {
    var chip = document.querySelector('[data-tat-github]');
    if (!chip) return;
    var starsEl = chip.querySelector('[data-tat-github-stars]');
    if (!starsEl) return;

    var cached = readCache();
    if (cached) {
      paintStars(starsEl, cached.stargazers_count);
      return;
    }

    fetchJson(WORKER_ENDPOINT)
      .catch(function () { return fetchJson(DIRECT_ENDPOINT); })
      .then(function (data) {
        writeCache(data);
        paintStars(starsEl, data.stargazers_count);
      })
      .catch(function () { /* silent - the link still works */ });
  }

  // --- Init ---
  function init() {
    initWaveformPlayers();
    loadGitHubStats();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
