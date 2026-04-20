/**
 * Thou Art That microsite client JS.
 * - Initialises ArrayPress WaveformPlayer instances
 * - Fetches GitHub repo star count via a CF Worker proxy (edge-cached)
 * - Graceful fallback if the Worker is unreachable
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

  // --- GitHub stats widget ---
  // Fetches through a Marbl-owned Worker proxy that caches at the edge.
  // Falls back silently if unreachable - the "View on GitHub" link still works.
  function loadGitHubStats() {
    var widget = document.querySelector('[data-tat-github]');
    if (!widget) return;
    var starsEl = widget.querySelector('[data-tat-github-stars]');
    if (!starsEl) return;

    var endpoint = 'https://github-stats.marbl-codes.workers.dev/repos/memdigital/thou-art-that';

    fetch(endpoint, { headers: { 'Accept': 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (typeof data.stargazers_count === 'number') {
          var n = data.stargazers_count;
          var label = n === 1 ? '1 star' : n.toLocaleString('en-GB') + ' stars';
          starsEl.textContent = label;
        }
      })
      .catch(function () {
        // Leave blank on failure; link still works.
      });
  }

  // --- Init ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initWaveformPlayers();
      loadGitHubStats();
    });
  } else {
    initWaveformPlayers();
    loadGitHubStats();
  }
})();
