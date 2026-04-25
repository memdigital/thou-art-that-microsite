/**
 * Waveform Player - init snippet
 * Include after the ArrayPress WaveformPlayer v1.5.2 library script.
 * Polls until the WaveformPlayer global is available (max 5s), then
 * instantiates every uninitialised [data-waveform-player] on the page.
 * Patches the library's drawWaveform to remove canvas shadow/glow.
 * On failure, leaves native <audio> fallback visible.
 */

(function () {
  'use strict';

  var MAX_ATTEMPTS = 50;
  var attempts = 0;

  function killGlow() {
    if (WaveformPlayer.prototype.__marblGlowPatched) return;
    var originalDraw = WaveformPlayer.prototype.drawWaveform;
    if (!originalDraw) return;
    WaveformPlayer.prototype.drawWaveform = function () {
      // Wrap with save/restore + pre-zero the shadow properties so no glow state
      // leaks into the original draw call, and any state changes it makes are rolled back.
      if (this.ctx) {
        this.ctx.save();
        this.ctx.shadowBlur = 0;
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
      }
      try {
        return originalDraw.apply(this, arguments);
      } finally {
        if (this.ctx) this.ctx.restore();
      }
    };
    WaveformPlayer.prototype.__marblGlowPatched = true;
  }

  function initWaveformPlayers() {
    if (typeof WaveformPlayer === 'undefined') {
      if (++attempts > MAX_ATTEMPTS) return;
      setTimeout(initWaveformPlayers, 100);
      return;
    }

    killGlow();

    var players = document.querySelectorAll('[data-waveform-player]:not([data-waveform-initialized])');
    players.forEach(function (player) {
      // Capture the .mwp-waveform-area container BEFORE init — the library
      // wraps the [data-waveform-player] element in a `.waveform-player` div,
      // which moves player.parentElement away from .mwp-waveform-area and
      // breaks any post-init parent-relative queries (notably the fallback hide).
      var area = player.closest('.mwp-waveform-area');
      try {
        new WaveformPlayer(player);
        player.setAttribute('data-waveform-initialized', 'true');
        // Hide native audio fallback on successful init.
        // Use the pre-captured `area` reference (closest .mwp-waveform-area)
        // because player.parentElement is now the library wrapper.
        var fallback = area && area.querySelector('audio.mwp-fallback');
        if (fallback) fallback.hidden = true;
      } catch (e) {
        // Init failed - native <audio> fallback stays visible
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[waveform-player] init failed, native audio fallback remains visible:', e);
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWaveformPlayers);
  } else {
    initWaveformPlayers();
  }
})();
