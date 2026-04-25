/**
 * Marbl Codes — Fullscreen Menu (v2)
 * 40/60 split with 60-tick SVG clock
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

    this.isOpen = false;
    this.isAnimating = false;
    this.timeline = null;
    this.clockRAF = null;

    if (!this.overlay || !this.toggle) return;

    this._buildClock();
    this._splitText();
    this._buildTimeline();
    this._bindEvents();
  }

  /* ── Clock: 60 ticks ── */

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
  }

  _startClock() {
    const tick = () => {
      const now = new Date();
      const londonStr = now.toLocaleString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      const parts = londonStr.split(':');
      const h = parseInt(parts[0]);
      const m = parseInt(parts[1]);
      const s = parseInt(parts[2]);

      // Light up ticks 0 through current second
      if (this.ticks) {
        this.ticks.forEach((tick, i) => {
          if (i <= s) {
            tick.classList.add('menu-clock__tick--active');
          } else {
            tick.classList.remove('menu-clock__tick--active');
          }
        });
      }

      // Digital time
      if (this.digitalDisplay) {
        this.digitalDisplay.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }

      this.clockRAF = requestAnimationFrame(tick);
    };

    tick();
  }

  _stopClock() {
    if (this.clockRAF) {
      cancelAnimationFrame(this.clockRAF);
      this.clockRAF = null;
    }
    // Reset all ticks
    if (this.ticks) {
      this.ticks.forEach(t => t.classList.remove('menu-clock__tick--active'));
    }
  }

  /* ── Text split ── */

  _splitText() {
    this.navItems.forEach(item => {
      if (typeof SplitText !== 'undefined') {
        new SplitText(item, { type: 'chars', charsClass: 'char' });
      } else {
        const text = item.textContent;
        item.innerHTML = '';
        text.split('').forEach(char => {
          const span = document.createElement('span');
          span.classList.add('char');
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
      }
    });

    // Hide nav labels initially so they animate in with the timeline
    if (this.navLabels.length) {
      gsap.set(this.navLabels, { opacity: 0, y: 8 });
    }

    this.timeline
      .to(this.panelBack, { clipPath: 'inset(0 0 0% 0)', duration: 0.8 })
      .to(this.panelFront, { clipPath: 'inset(0 0 0% 0)', duration: 0.8 }, '-=0.6')
      .to(this.content, { opacity: 1, duration: 0.3, ease: 'power2.out' }, '-=0.3');

    // Nav group labels fade + slide in before the character stagger
    if (this.navLabels.length) {
      this.timeline.fromTo(this.navLabels, { opacity: 0, y: 8 }, {
        opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out'
      }, '-=0.1');
    }

    this.timeline.fromTo(this.allChars, { opacity: 0, y: '100%' }, {
        opacity: 1, y: '0%', duration: 0.6, stagger: 0.02, ease: 'power3.out'
      }, '-=0.2');

    // Clock fades in
    if (this.centre) {
      this.timeline.fromTo(this.centre, { opacity: 0, scale: 0.95 }, {
        opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out'
      }, '-=0.3');
    }

    // Right sections stagger in
    if (this.sections.length) {
      this.timeline.fromTo(this.sections, { opacity: 0, y: 20 }, {
        opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out'
      }, '-=0.4');
    }
  }

  /* ── Events ── */

  _bindEvents() {
    this.toggle.addEventListener('click', () => this._toggle());
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

    this.overlay.classList.add('is-open');
    this.toggle.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    if (window.innerWidth <= 768) {
      document.querySelector('.site-header')?.classList.add('menu-is-open');
    }
    this._startClock();

    this.timeline.timeScale(1).play().then(() => { this.isAnimating = false; });
  }

  _close() {
    if (this.isAnimating || !this.isOpen) return;
    this.isAnimating = true;
    this.isOpen = false;

    this.toggle.classList.remove('is-open');
    document.querySelector('.site-header')?.classList.remove('menu-is-open');
    this._stopClock();

    this.timeline.timeScale(1.5).reverse();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap !== 'undefined') {
    new MarblMenu();
  }
});
