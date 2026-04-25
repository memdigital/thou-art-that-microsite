/**
 * Marbl Codes — Fullscreen Menu (v2.1)
 * Universal component: ships on every Marbl site.
 * 40/60 split with 60-tick SVG clock (London time).
 *
 * Accessibility: dialog role, focus trap, aria-expanded, inert background.
 * Performance: clock uses setInterval (1Hz), not requestAnimationFrame.
 * Dependency: GSAP 3.12+ required. Falls back to instant open/close if missing.
 */

class MarblMenu {
  constructor() {
    this.overlay = document.querySelector('.menu-overlay');
    this.toggle = document.querySelector('.menu-toggle');
    this.panelBack = document.querySelector('.menu-overlay__panel--back');
    this.panelFront = document.querySelector('.menu-overlay__panel--front');
    this.content = document.querySelector('.menu-overlay__content');
    this.navItems = document.querySelectorAll('.menu-overlay__nav-item a');
    this.navLabels = document.querySelectorAll('.menu-overlay__nav-label');
    this.centre = document.querySelector('.menu-overlay__centre');
    this.right = document.querySelector('.menu-overlay__right');
    this.sections = document.querySelectorAll('.menu-overlay__section');
    this.siteHeader = document.querySelector('.site-header');
    this.mainContent = document.querySelector('main');

    this.isOpen = false;
    this.isAnimating = false;
    this.timeline = null;
    this.clockInterval = null;
    this.lastSecond = -1;

    if (!this.overlay || !this.toggle) return;

    this._buildClock();
    this._splitText();
    this._buildTimeline();
    this._bindEvents();
  }

  /* ── Clock: 60 ticks, 1Hz update ── */

  _buildClock() {
    const svg = document.querySelector('[data-clock-svg]');
    if (!svg) return;

    const cx = 100, cy = 100, r = 88;

    for (let i = 0; i < 60; i++) {
      const angle = (i * 6 - 90) * (Math.PI / 180);
      const outer = r;
      const inner = i % 5 === 0 ? r - 14 : r - 8;

      const x1 = cx + outer * Math.cos(angle);
      const y1 = cy + outer * Math.sin(angle);
      const x2 = cx + inner * Math.cos(angle);
      const y2 = cy + inner * Math.sin(angle);

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.setAttribute('class', 'menu-clock__tick');
      line.setAttribute('data-tick', i);
      svg.appendChild(line);
    }

    this.ticks = svg.querySelectorAll('.menu-clock__tick');
    this.digitalDisplay = document.querySelector('[data-clock-digital]');

    // Resolve the viewer's IANA timezone from their OS/browser settings —
    // no geolocation prompt, no network call, no permission needed. Falls
    // back to Europe/London if Intl doesn't expose the zone for any reason
    // (ancient runtime, locked-down environment). The resolved zone is
    // cached for the lifetime of the menu instance; users don't hop
    // timezones while browsing, so there's no need to re-resolve per tick.
    this.userTimeZone = 'Europe/London';
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) this.userTimeZone = tz;
    } catch (_) { /* keep fallback */ }
  }

  _startClock() {
    this._updateClock();
    this.clockInterval = setInterval(() => this._updateClock(), 1000);
  }

  _updateClock() {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: this.userTimeZone,
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    });
    const parts = Object.fromEntries(
      fmt.formatToParts(new Date()).map(p => [p.type, p.value])
    );
    const h = parseInt(parts.hour);
    const m = parseInt(parts.minute);
    const s = parseInt(parts.second);

    if (s === this.lastSecond) return;
    this.lastSecond = s;

    if (this.ticks) {
      this.ticks.forEach((tick, i) => {
        tick.classList.toggle('menu-clock__tick--active', i <= s);
      });
    }

    if (this.digitalDisplay) {
      this.digitalDisplay.textContent =
        String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    }
  }

  _stopClock() {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }
    this.lastSecond = -1;
    if (this.ticks) {
      this.ticks.forEach(t => t.classList.remove('menu-clock__tick--active'));
    }
  }

  /* ── Text split (screen reader safe) ── */

  _splitText() {
    this.navItems.forEach(item => {
      const text = item.textContent;

      /* Preserve the full word for screen readers */
      item.setAttribute('aria-label', text);

      if (typeof SplitText !== 'undefined') {
        new SplitText(item, { type: 'chars', charsClass: 'char' });
        /* Both code paths must produce identical SR output: the full word is
           announced via aria-label on `item`, and each generated char is
           announced as decorative-only. */
        item.querySelectorAll('.char').forEach(c => c.setAttribute('aria-hidden', 'true'));
      } else {
        item.innerHTML = '';
        text.split('').forEach(char => {
          const span = document.createElement('span');
          span.classList.add('char');
          span.setAttribute('aria-hidden', 'true');
          span.textContent = char === ' ' ? '\u00A0' : char;
          item.appendChild(span);
        });
      }
    });
    this.allChars = this.overlay.querySelectorAll('.char');
  }

  /* ── GSAP timeline ── */

  _buildTimeline() {
    this.timeline = gsap.timeline({
      paused: true,
      defaults: { ease: 'power4.inOut' },
      onReverseComplete: () => {
        this.overlay.classList.remove('is-open');
        document.body.style.overflow = '';
        this.isAnimating = false;

        /* Restore accessibility after close */
        if (this.mainContent) this.mainContent.removeAttribute('inert');
        this.toggle.focus();
      }
    });

    if (this.navLabels.length) {
      gsap.set(this.navLabels, { opacity: 0, y: 8 });
    }

    this.timeline
      .to(this.panelBack, { clipPath: 'inset(0 0 0% 0)', duration: 0.8 })
      .to(this.panelFront, { clipPath: 'inset(0 0 0% 0)', duration: 0.8 }, '-=0.6')
      .to(this.content, { opacity: 1, duration: 0.3, ease: 'power2.out' }, '-=0.3');

    if (this.navLabels.length) {
      this.timeline.fromTo(this.navLabels, { opacity: 0, y: 8 }, {
        opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out'
      }, '-=0.1');
    }

    this.timeline.fromTo(this.allChars, { opacity: 0, y: '100%' }, {
        opacity: 1, y: '0%', duration: 0.6, stagger: 0.02, ease: 'power3.out'
      }, '-=0.2');

    if (this.centre) {
      this.timeline.fromTo(this.centre, { opacity: 0, scale: 0.95 }, {
        opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out'
      }, '-=0.3');
    }

    if (this.sections.length) {
      this.timeline.fromTo(this.sections, { opacity: 0, y: 20 }, {
        opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out'
      }, '-=0.4');
    }
  }

  /* ── Focus trap ── */

  _getFocusable() {
    return this.overlay.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
  }

  _trapFocus(e) {
    if (e.key !== 'Tab') return;
    const focusable = this._getFocusable();
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /* ── Events ── */

  _bindEvents() {
    this.toggle.addEventListener('click', () => this._toggle());
    this._trapHandler = (e) => this._trapFocus(e);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this._close();
    });

    this.navItems.forEach(item => {
      item.addEventListener('click', () => { if (this.isOpen) this._close(); });
    });
  }

  _toggle() {
    if (this.isAnimating) return;
    this.isOpen ? this._close() : this._open();
  }

  _open() {
    if (this.isAnimating || this.isOpen) return;
    this.isAnimating = true;
    this.isOpen = true;

    /* Visual */
    this.overlay.classList.add('is-open');
    this.toggle.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    this.siteHeader?.classList.add('menu-is-open');
    this._startClock();

    /* Accessibility */
    this.toggle.setAttribute('aria-expanded', 'true');
    this.toggle.setAttribute('aria-label', 'Close menu');
    if (this.mainContent) this.mainContent.setAttribute('inert', '');

    /* Focus trap */
    document.addEventListener('keydown', this._trapHandler);

    /* Animate, then move focus */
    this.timeline.timeScale(1).play().then(() => {
      this.isAnimating = false;
      const firstLink = this.overlay.querySelector('.menu-overlay__nav-item a');
      if (firstLink) firstLink.focus();
    });
  }

  _close() {
    if (this.isAnimating || !this.isOpen) return;
    this.isAnimating = true;
    this.isOpen = false;

    /* Visual */
    this.toggle.classList.remove('is-open');
    this.siteHeader?.classList.remove('menu-is-open');
    this._stopClock();

    /* Accessibility */
    this.toggle.setAttribute('aria-expanded', 'false');
    this.toggle.setAttribute('aria-label', 'Open menu');

    /* Remove focus trap */
    document.removeEventListener('keydown', this._trapHandler);

    /* Animate (onReverseComplete handles inert removal + focus restore) */
    this.timeline.timeScale(1.5).reverse();
  }
}

/* Init: GSAP required. If missing, fall back to instant toggle. */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap !== 'undefined') {
    new MarblMenu();
  } else {
    /* No-animation fallback: menu still works for keyboard/screen reader users */
    const toggle = document.querySelector('.menu-toggle');
    const overlay = document.querySelector('.menu-overlay');
    if (toggle && overlay) {
      toggle.addEventListener('click', () => {
        const open = overlay.classList.toggle('is-open');
        toggle.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        document.body.style.overflow = open ? 'hidden' : '';
      });
    }
  }
});
