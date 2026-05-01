/**
 * TAT pill controller - bridges Marbl pill UI to ArrayPress WaveformPlayer.
 *
 * Scoped per .marbl-waveform region so multiple players on a page never clash.
 * No IDs required - finds buttons by class within each pill's region.
 *
 * Per-region opt-in tracking:
 *   <div class="marbl-waveform" data-fathom-event="Origin story play"> ... </div>
 *
 * CSP-compliant: vendored .js, no inline.
 */
(function () {
  'use strict';

  function fmt(s) {
    if (isNaN(s)) return '0:00';
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function wirePill(region) {
    var pill = region.querySelector('.mwp-controls-pill');
    if (!pill) return;
    var playBtn = pill.querySelector('.mwp-btn--play');
    if (!playBtn) return;

    var iconPlay = playBtn.querySelector('.icon-play');
    var iconPause = playBtn.querySelector('.icon-pause');
    var timeEl = pill.querySelector('.mwp-time-display');
    var volBtn = pill.querySelector('.mwp-btn--volume');
    var volSlider = pill.querySelector('.mwp-volume-slider');
    var volRange = pill.querySelector('input[type="range"]');
    var statusEl = region.parentNode ? region.parentNode.querySelector('[role="status"][aria-live]') : null;
    var apPlayer = region.querySelector('[data-waveform-player]');
    var fathomEvent = region.getAttribute('data-fathom-event');

    var audio = null;
    var wired = false;
    var attempts = 0;
    var MAX = 30;
    var fathomFired = false;

    function setPlaying(playing) {
      if (iconPlay) iconPlay.hidden = playing;
      if (iconPause) iconPause.hidden = !playing;
      playBtn.setAttribute('aria-pressed', String(playing));
      playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
      pill.classList.toggle('is-expanded', playing);
      if (statusEl) {
        statusEl.textContent = playing
          ? 'Playing'
          : (audio ? 'Paused at ' + fmt(audio.currentTime) : '');
      }
    }

    function trackPlayOnce() {
      if (fathomFired || !fathomEvent) return;
      fathomFired = true;
      if (typeof window.fathom !== 'undefined' && window.fathom.trackEvent) {
        window.fathom.trackEvent(fathomEvent);
      }
    }

    function wireAudio(a) {
      if (wired) return;
      audio = a;
      wired = true;
      audio.addEventListener('play', function () { setPlaying(true); trackPlayOnce(); });
      audio.addEventListener('pause', function () { setPlaying(false); });
      audio.addEventListener('ended', function () { setPlaying(false); });
      audio.addEventListener('timeupdate', function () {
        if (timeEl) timeEl.textContent = fmt(audio.currentTime);
      });
      if (volRange) volRange.value = Math.round(audio.volume * 100);
    }

    function findAudio() {
      if (typeof window.WaveformPlayer === 'undefined') return false;
      var instances = window.WaveformPlayer.instances;
      if (!instances) return false;
      var matched = false;
      function check(inst) {
        if (matched || wired || !inst || !inst.audio) return;
        // Match this region's player by element identity (the data-waveform-player div).
        if (inst.element === apPlayer || inst.container === apPlayer) {
          wireAudio(inst.audio);
          matched = true;
        }
      }
      if (instances instanceof Map) {
        instances.forEach(function (inst) { check(inst); });
      } else if (typeof instances === 'object') {
        Object.keys(instances).forEach(function (k) { check(instances[k]); });
      }
      // Fallback: if no element-identity match (older AP version), wire the first
      // instance whose audio src matches our data-url. Last resort.
      if (!matched && apPlayer) {
        var url = apPlayer.getAttribute('data-url');
        function checkByUrl(inst) {
          if (matched || wired || !inst || !inst.audio || !url) return;
          if (inst.audio.src && inst.audio.src.indexOf(url) !== -1) {
            wireAudio(inst.audio);
            matched = true;
          }
        }
        if (instances instanceof Map) {
          instances.forEach(checkByUrl);
        } else {
          Object.keys(instances).forEach(function (k) { checkByUrl(instances[k]); });
        }
      }
      return wired;
    }

    function poll() {
      if (wired) return;
      if (findAudio()) return;
      attempts++;
      if (attempts < MAX) setTimeout(poll, 300);
    }

    playBtn.addEventListener('click', function () {
      if (!apPlayer) return;
      var nativeBtn = apPlayer.querySelector('button');
      if (nativeBtn) {
        nativeBtn.click();
        if (!wired || (audio && !audio.src)) {
          setTimeout(function () { findAudio(); }, 200);
        }
      }
    });

    if (volRange) {
      volRange.addEventListener('input', function () {
        if (audio) audio.volume = volRange.value / 100;
      });
    }

    if (volBtn && volSlider) {
      volBtn.addEventListener('click', function () {
        var open = volBtn.getAttribute('aria-expanded') === 'true';
        volBtn.setAttribute('aria-expanded', String(!open));
        volSlider.classList.toggle('is-open', !open);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && volSlider.classList.contains('is-open')) {
          volSlider.classList.remove('is-open');
          volBtn.setAttribute('aria-expanded', 'false');
          volBtn.focus();
        }
      });
    }

    poll();
  }

  function init() {
    var regions = document.querySelectorAll('.marbl-waveform');
    for (var i = 0; i < regions.length; i++) wirePill(regions[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
