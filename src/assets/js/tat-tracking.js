/**
 * TAT site-wide Fathom tracking via data-attributes.
 *
 * Mark any element with data-fathom-event="Event name" and a click on it
 * (or its descendants) fires fathom.trackEvent. Works for buttons, links,
 * any clickable element. Safe if Fathom is blocked or not loaded.
 *
 * For waveform-player play tracking, see tat-pill.js (uses same data-attr
 * on the .marbl-waveform region, fires on first play of that audio).
 *
 * Auto-tracked (no markup needed):
 *  - menu open/close (any [aria-controls=marbl-menu] toggle)
 *  - external link clicks (target=_blank with non-same-origin href)
 *  - audio MP3 download links (href ending .mp3 with download attr or text)
 *
 * CSP-compliant: vendored .js, no inline.
 */
(function () {
  'use strict';

  function track(eventName) {
    if (!eventName) return;
    if (typeof window.fathom === 'undefined' || !window.fathom.trackEvent) return;
    window.fathom.trackEvent(eventName);
  }

  function isExternal(url) {
    try {
      var u = new URL(url, window.location.href);
      return u.origin !== window.location.origin;
    } catch (e) {
      return false;
    }
  }

  function init() {
    // Generic data-fathom-event delegator.
    document.addEventListener('click', function (e) {
      var target = e.target;
      while (target && target !== document.body) {
        var ev = target.getAttribute && target.getAttribute('data-fathom-event');
        if (ev) {
          track(ev);
          return;
        }
        target = target.parentNode;
      }
    }, true);

    // External link auto-tracking.
    document.addEventListener('click', function (e) {
      var a = e.target;
      while (a && a !== document.body && a.tagName !== 'A') a = a.parentNode;
      if (!a || a.tagName !== 'A') return;
      if (a.getAttribute('data-fathom-event')) return; // already handled above
      var href = a.getAttribute('href');
      if (!href) return;
      if (href.charAt(0) === '#') return;
      if (href.toLowerCase().indexOf('mailto:') === 0) {
        track('Email click - ' + href.slice(7).split('?')[0]);
        return;
      }
      // MP3 download
      if (href.toLowerCase().indexOf('.mp3') !== -1) {
        var label = a.textContent.replace(/\s+/g, ' ').trim().slice(0, 60);
        track('Audio download - ' + (label || href));
        return;
      }
      if (isExternal(href)) {
        var host = '';
        try { host = new URL(href, window.location.href).hostname; } catch (e) {}
        track('External link - ' + (host || href));
      }
    }, true);

    // Menu open tracking.
    var menuToggles = document.querySelectorAll('[aria-controls="marbl-menu"]');
    for (var i = 0; i < menuToggles.length; i++) {
      menuToggles[i].addEventListener('click', function () {
        // Defer one tick so aria-expanded reflects new state.
        setTimeout(function () {
          var open = menuToggles[0].getAttribute('aria-expanded') === 'true';
          track(open ? 'Menu opened' : 'Menu closed');
        }, 0);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
