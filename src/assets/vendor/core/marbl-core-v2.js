/**
 * Marbl Core v2.0.0
 * Universal scripts for all new Marbl properties.
 * Includes: Cursor (with audio/video/image/carousel states), Logo Animation
 * NOT for: legacy live pages (use marbl-core.js v1) or client sites.
 * (c) 2026 Marbl Codes - https://marbl.codes
 *
 * Usage:
 * <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
 * <script src="https://marbl.codes/core/marbl-core-v2.js"></script>
 */

/* ============================================
   MARBL FLUID CURSOR
   ============================================ */
(function() {
  'use strict';

  // More robust touch device detection
  function isTouchDevice() {
    // Check for touch capability
    const hasTouch = (
      ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0)
    );

    // Check for coarse pointer (touch screen)
    const hasCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

    // Check for fine pointer (mouse)
    const hasFinePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

    // If device has fine pointer, show cursor even if touch capable (hybrid devices)
    if (hasFinePointer) {
      return false;
    }

    return hasTouch || hasCoarsePointer;
  }

  // Respect prefers-reduced-motion: the custom cursor (rAF interpolation, state
  // transitions, click pulse) is decorative motion — WCAG 2.3.3 says we skip it
  // when the user has asked for reduced motion. Native cursor remains.
  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Skip on touch-only devices, or when the user has requested reduced motion.
  if (isTouchDevice() || prefersReducedMotion()) {
    return;
  }

  function initCursor() {
    // Check if cursor already exists
    if (document.getElementById('marbl-cursor')) {
      return;
    }

    // Create cursor elements
    const cursor = document.createElement('div');
    cursor.id = 'marbl-cursor';

    const dot = document.createElement('div');
    dot.className = 'marbl-cursor-dot';

    const ring = document.createElement('div');
    ring.className = 'marbl-cursor-ring';

    cursor.appendChild(dot);
    cursor.appendChild(ring);

    // Create and inject styles with maximum specificity
    const styleId = 'marbl-cursor-styles';
    if (!document.getElementById(styleId)) {
      const styles = document.createElement('style');
      styles.id = styleId;
      styles.textContent = `
        /* Marbl Cursor - Hide default cursor */
        html.marbl-cursor-active,
        html.marbl-cursor-active body,
        html.marbl-cursor-active * {
          cursor: none !important;
        }

        /* data-cursor-ignore: restore native browser cursor inside opted-out
           zones (canvases, iframes, third-party widgets). Beats the universal
           cursor-none rule by being a more specific selector. */
        html.marbl-cursor-active [data-cursor-ignore],
        html.marbl-cursor-active [data-cursor-ignore] * {
          cursor: auto !important;
        }

        /* data-cursor-passive: keep the custom cursor visible in its resting
           state (small dot + ring), but never promote it to hovering,
           draggable, text, media, or carousel states regardless of what
           sits underneath. Useful for interactive canvases where you still
           want the branded cursor but not the big ring fighting the canvas's
           own effects (e.g. particle morphs, shader-driven scenes).
           No cursor:auto override — the native pointer stays hidden.
           NOTE: no backticks in this comment — the whole style block is
           itself inside a JS template literal, so a stray backtick would
           terminate it early and kill the script at load. */
        html.marbl-cursor-active [data-cursor-passive],
        html.marbl-cursor-active [data-cursor-passive] * {
          cursor: none !important;
        }

        /* Cursor container */
        #marbl-cursor {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          pointer-events: none !important;
          z-index: 2147483647 !important;
          mix-blend-mode: difference;
        }

        /* Dot - follows mouse tightly */
        #marbl-cursor .marbl-cursor-dot {
          position: absolute !important;
          width: 8px !important;
          height: 8px !important;
          background: #F35226 !important;
          border-radius: 50% !important;
          transform: translate(-50%, -50%) !important;
          transition: transform 0.15s ease, width 0.2s ease, height 0.2s ease, opacity 0.2s ease !important;
          will-change: left, top, transform;
        }

        /* Ring - follows with lag */
        #marbl-cursor .marbl-cursor-ring {
          position: absolute !important;
          width: 40px !important;
          height: 40px !important;
          border: 2px solid #F35226 !important;
          background: transparent !important;
          border-radius: 50% !important;
          transform: translate(-50%, -50%) !important;
          transition: width 0.3s ease, height 0.3s ease, border-color 0.3s ease, opacity 0.2s ease !important;
          opacity: 0.6 !important;
          will-change: left, top, width, height;
        }

        /* Hover state - ring grows, dot shrinks */
        #marbl-cursor.hovering .marbl-cursor-dot {
          transform: translate(-50%, -50%) scale(0.5) !important;
        }

        #marbl-cursor.hovering .marbl-cursor-ring {
          width: 60px !important;
          height: 60px !important;
          border-color: #F35226 !important;
          opacity: 1 !important;
        }

        /* Clicking state */
        #marbl-cursor.clicking .marbl-cursor-dot {
          transform: translate(-50%, -50%) scale(2) !important;
        }

        #marbl-cursor.clicking .marbl-cursor-ring {
          width: 30px !important;
          height: 30px !important;
        }

        /* Hidden state */
        #marbl-cursor.hidden .marbl-cursor-dot,
        #marbl-cursor.hidden .marbl-cursor-ring {
          opacity: 0 !important;
        }

        /* Text input state */
        #marbl-cursor.text-cursor .marbl-cursor-dot {
          width: 3px !important;
          height: 24px !important;
          border-radius: 2px !important;
        }

        #marbl-cursor.text-cursor .marbl-cursor-ring {
          opacity: 0 !important;
        }

        /* Draggable state - grab cursor */
        #marbl-cursor.draggable .marbl-cursor-dot {
          width: 6px !important;
          height: 6px !important;
          background: #fff !important;
        }

        #marbl-cursor.draggable .marbl-cursor-ring {
          width: 44px !important;
          height: 44px !important;
          border-color: #fff !important;
          border-style: dashed !important;
          opacity: 0.6 !important;
        }

        /* Dragging state - active grab */
        #marbl-cursor.dragging .marbl-cursor-dot {
          width: 10px !important;
          height: 10px !important;
          background: #fff !important;
          transform: translate(-50%, -50%) !important;
        }

        #marbl-cursor.dragging .marbl-cursor-ring {
          width: 32px !important;
          height: 32px !important;
          border-color: #fff !important;
          border-style: solid !important;
          opacity: 0.9 !important;
        }

        /* Video state - play icon */
        #marbl-cursor.video-cursor .marbl-cursor-dot {
          width: 0 !important;
          height: 0 !important;
          background: transparent !important;
          border-left: 10px solid #fff !important;
          border-top: 6px solid transparent !important;
          border-bottom: 6px solid transparent !important;
          border-radius: 0 !important;
          transform: translate(-40%, -50%) !important;
        }

        #marbl-cursor.video-cursor .marbl-cursor-ring {
          width: 48px !important;
          height: 48px !important;
          border-color: #fff !important;
          background: rgba(255, 255, 255, 0.05) !important;
          opacity: 0.8 !important;
        }

        /* Image state - zoom/expand */
        #marbl-cursor.image-cursor .marbl-cursor-dot {
          width: 12px !important;
          height: 12px !important;
          background: transparent !important;
          border: 2px solid #fff !important;
          border-radius: 50% !important;
        }

        #marbl-cursor.image-cursor .marbl-cursor-dot::after {
          content: '' !important;
          position: absolute !important;
          bottom: -5px !important;
          right: -5px !important;
          width: 6px !important;
          height: 2px !important;
          background: #fff !important;
          transform: rotate(45deg) !important;
        }

        #marbl-cursor.image-cursor .marbl-cursor-ring {
          width: 44px !important;
          height: 44px !important;
          border-color: #fff !important;
          opacity: 0.5 !important;
        }

        /* Audio state - waveform bars icon */
        #marbl-cursor.audio-cursor .marbl-cursor-dot {
          width: 18px !important;
          height: 18px !important;
          background: transparent !important;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 1200'%3E%3Cpath d='m360 672v-144c0-17.148-9.1484-32.996-24-41.57-14.852-8.5742-33.148-8.5742-48 0-14.852 8.5742-24 24.422-24 41.57v144c0 17.148 9.1484 32.996 24 41.57 14.852 8.5742 33.148 8.5742 48 0 14.852-8.5742 24-24.422 24-41.57z' fill='%23fff'/%3E%3Cpath d='m552 816v-432c0-17.148-9.1484-32.996-24-41.57-14.852-8.5742-33.148-8.5742-48 0-14.852 8.5742-24 24.422-24 41.57v432c0 17.148 9.1484 32.996 24 41.57 14.852 8.5742 33.148 8.5742 48 0 14.852-8.5742 24-24.422 24-41.57z' fill='%23fff'/%3E%3Cpath d='m744 720v-240c0-17.148-9.1484-32.996-24-41.57-14.852-8.5742-33.148-8.5742-48 0-14.852 8.5742-24 24.422-24 41.57v240c0 17.148 9.1484 32.996 24 41.57 14.852 8.5742 33.148 8.5742 48 0 14.852-8.5742 24-24.422 24-41.57z' fill='%23fff'/%3E%3Cpath d='m936 912v-624c0-17.148-9.1484-32.996-24-41.57-14.852-8.5742-33.148-8.5742-48 0-14.852 8.5742-24 24.422-24 41.57v624c0 17.148 9.1484 32.996 24 41.57 14.852 8.5742 33.148 8.5742 48 0 14.852-8.5742 24-24.422 24-41.57z' fill='%23fff'/%3E%3C/svg%3E") !important;
          background-size: contain !important;
          background-repeat: no-repeat !important;
          border-radius: 0 !important;
        }

        #marbl-cursor.audio-cursor .marbl-cursor-dot::before,
        #marbl-cursor.audio-cursor .marbl-cursor-dot::after {
          content: none !important;
        }

        #marbl-cursor.audio-cursor .marbl-cursor-ring {
          width: 60px !important;
          height: 60px !important;
          border-color: #F35226 !important;
          background: none !important;
          opacity: 1 !important;
        }

        /* Carousel cursor - single directional arrow based on position */
        #marbl-cursor.carousel-cursor .marbl-cursor-dot,
        #marbl-cursor.carousel-left .marbl-cursor-dot,
        #marbl-cursor.carousel-right .marbl-cursor-dot {
          width: 0 !important;
          height: 0 !important;
          background: transparent !important;
          border-radius: 0 !important;
        }

        /* Hide default pseudo-elements */
        #marbl-cursor.carousel-cursor .marbl-cursor-dot::before,
        #marbl-cursor.carousel-cursor .marbl-cursor-dot::after,
        #marbl-cursor.carousel-left .marbl-cursor-dot::before,
        #marbl-cursor.carousel-left .marbl-cursor-dot::after,
        #marbl-cursor.carousel-right .marbl-cursor-dot::before,
        #marbl-cursor.carousel-right .marbl-cursor-dot::after {
          content: none !important;
        }

        /* Left arrow (when on left side - can scroll left) - orange ember */
        #marbl-cursor.carousel-left .marbl-cursor-dot {
          border-style: solid !important;
          border-width: 6px 8px 6px 0 !important;
          border-color: transparent #F35226 transparent transparent !important;
        }

        /* Right arrow (when on right side - can scroll right) - orange ember */
        #marbl-cursor.carousel-right .marbl-cursor-dot {
          border-style: solid !important;
          border-width: 6px 0 6px 8px !important;
          border-color: transparent transparent transparent #F35226 !important;
        }

        /* Carousel ring - matches normal cursor (no background, same border color as normal) */
        #marbl-cursor.carousel-cursor .marbl-cursor-ring,
        #marbl-cursor.carousel-left .marbl-cursor-ring,
        #marbl-cursor.carousel-right .marbl-cursor-ring {
          width: 44px !important;
          height: 44px !important;
          border-radius: 50% !important;
          border-color: #F35226 !important;
          background: transparent !important;
          opacity: 0.6 !important;
        }

        /* Carousel dragging state - ember color highlight */
        #marbl-cursor.carousel-dragging .marbl-cursor-dot {
          width: 0 !important;
          height: 0 !important;
          background: transparent !important;
          border-radius: 0 !important;
        }

        #marbl-cursor.carousel-dragging .marbl-cursor-dot::before,
        #marbl-cursor.carousel-dragging .marbl-cursor-dot::after {
          content: none !important;
        }

        #marbl-cursor.carousel-dragging.carousel-left .marbl-cursor-dot {
          border-style: solid !important;
          border-width: 6px 8px 6px 0 !important;
          border-color: transparent #F35226 transparent transparent !important;
        }

        #marbl-cursor.carousel-dragging.carousel-right .marbl-cursor-dot {
          border-style: solid !important;
          border-width: 6px 0 6px 8px !important;
          border-color: transparent transparent transparent #F35226 !important;
        }

        #marbl-cursor.carousel-dragging .marbl-cursor-ring {
          width: 48px !important;
          height: 48px !important;
          border-radius: 50% !important;
          border-color: #F35226 !important;
          background: transparent !important;
          opacity: 1 !important;
        }
      `;

      // Insert at the very end of head for maximum priority
      document.head.appendChild(styles);
    }

    // Add cursor to body
    document.body.appendChild(cursor);

    // Activate custom cursor mode
    document.documentElement.classList.add('marbl-cursor-active');

    // Position state
    let mouseX = -100;
    let mouseY = -100;
    let dotX = -100;
    let dotY = -100;
    let ringX = -100;
    let ringY = -100;
    let isVisible = false;

    // Start hidden
    cursor.classList.add('hidden');

    // Animation loop
    function animate() {
      // Smooth interpolation
      const dotSpeed = 0.35;
      const ringSpeed = 0.15;

      dotX += (mouseX - dotX) * dotSpeed;
      dotY += (mouseY - dotY) * dotSpeed;
      dot.style.left = dotX + 'px';
      dot.style.top = dotY + 'px';

      ringX += (mouseX - ringX) * ringSpeed;
      ringY += (mouseY - ringY) * ringSpeed;
      ring.style.left = ringX + 'px';
      ring.style.top = ringY + 'px';

      requestAnimationFrame(animate);
    }

    animate();

    // Track current carousel element for position detection
    let currentCarousel = null;

    // Mouse move handler
    function onMouseMove(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        cursor.classList.remove('hidden');
        // Jump to position on first move
        dotX = mouseX;
        dotY = mouseY;
        ringX = mouseX;
        ringY = mouseY;
      }

      // Update carousel direction based on mouse position
      if (currentCarousel && (cursor.classList.contains('carousel-cursor') || cursor.classList.contains('carousel-dragging'))) {
        const rect = currentCarousel.getBoundingClientRect();
        const relativeX = mouseX - rect.left;
        const halfWidth = rect.width / 2;

        if (relativeX < halfWidth) {
          cursor.classList.add('carousel-left');
          cursor.classList.remove('carousel-right');
        } else {
          cursor.classList.add('carousel-right');
          cursor.classList.remove('carousel-left');
        }
      }
    }

    // Mouse enter/leave handlers
    function onMouseLeave() {
      cursor.classList.add('hidden');
      isVisible = false;
    }

    function onMouseEnter() {
      if (mouseX > 0 && mouseY > 0) {
        cursor.classList.remove('hidden');
        isVisible = true;
      }
    }

    // Interactive elements to trigger hover state
    const interactiveSelectors = [
      'a',
      'button',
      '[role="button"]',
      'input[type="button"]',
      'input[type="submit"]',
      '.btn',
      '.btn-cta',
      '.btn-cta-secondary',
      '.btn-cta-outline',
      '.btn-outline',
      '.cta-btn',
      '.talk-btn',
      '.quick-link',
      '.secondary-link',
      '.marbl-logo',
      '[data-logo-animate]',
      '.founder-photo',
      '.tag',
      '.filter-btn',
      '.filter-chip',
      '.filter-option',
      '.filter-toggle',
      '.filter-panel-close',
      '.burger-btn',
      '.menu-link',
      '.menu-close',
      '.panel-close',
      '[data-clickable]',
      'canvas',
      'select',
      'label[for]'
    ].join(', ');

    // Text input selectors
    const textInputSelectors = 'input[type="text"], input[type="email"], input[type="password"], input[type="search"], input[type="url"], input[type="tel"], input[type="number"], textarea';

    // Draggable element selectors
    const draggableSelectors = [
      '.category-tabs',
      '[data-draggable]',
      '[draggable="true"]',
      '.draggable',
      '.drag-scroll'
    ].join(', ');

    // Carousel element selectors (horizontal drag with arrows)
    const carouselSelectors = [
      '.carousel-track',
      '.carousel-container',
      '.embla',
      '.embla__container',
      '[data-carousel]',
      '.edition-carousel'
    ].join(', ');

    // Video element selectors
    const videoSelectors = [
      'video',
      '.video-player',
      '.video-thumbnail',
      '[data-video]',
      '.youtube-embed',
      '.video-container'
    ].join(', ');

    // Image element selectors (for zoomable/expandable images)
    const imageSelectors = [
      'img[data-lightbox]',
      'img[data-zoom]',
      '.gallery-image',
      '[data-image-expand]',
      '.lightbox-trigger'
    ].join(', ');

    // Audio element selectors
    const audioSelectors = [
      'audio',
      '.audio-player',
      '.waveform-container',
      '[data-audio]',
      '.feed-item-audio',
      'a[href$=".mp3"]',
      'a[href$=".wav"]',
      'a[href$=".ogg"]',
      '.audio-controls',
      '.play-audio',
      '.marbl-waveform',
      '[data-waveform-player]',
      '.waveform-track'
    ].join(', ');

    // Track if we're currently dragging
    let isDragging = false;

    // Hover detection using event delegation
    function onMouseOver(e) {
      const target = e.target;

      // Check for text inputs first
      if (target.matches && target.matches(textInputSelectors)) {
        cursor.classList.add('text-cursor');
        cursor.classList.remove('hovering', 'draggable', 'video-cursor', 'image-cursor', 'carousel-cursor');
        return;
      }

      // data-cursor-ignore check FIRST - before any special states.
      // Hide the custom cursor entirely and let the native browser cursor
      // take over (CSS rule above restores `cursor: auto` inside these zones).
      if (target.closest && target.closest('[data-cursor-ignore]')) {
        cursor.classList.remove('hovering', 'text-cursor', 'draggable', 'video-cursor', 'image-cursor', 'audio-cursor', 'carousel-cursor');
        cursor.classList.add('hidden');
        return;
      }

      // Leaving a cursor-ignore zone: un-hide the custom cursor if nothing
      // else wants it hidden.
      if (cursor.classList.contains('hidden')) {
        cursor.classList.remove('hidden');
      }

      // data-cursor-passive: strip all state classes and leave the cursor
      // in its resting dot+ring. Checked before every other state detector
      // so zones marked passive never inherit hovering/draggable/media
      // variants from what sits underneath them. Unlike cursor-ignore,
      // passive does NOT hide the cursor and does NOT surface the native
      // pointer — the branded resting state stays on screen.
      if (target.closest && target.closest('[data-cursor-passive]')) {
        cursor.classList.remove('hovering', 'text-cursor', 'draggable', 'video-cursor', 'image-cursor', 'audio-cursor', 'carousel-cursor');
        return;
      }

      // Check for carousel elements (horizontal scrollable)
      if (target.closest && target.closest(carouselSelectors)) {
        currentCarousel = target.closest(carouselSelectors);
        cursor.classList.add('carousel-cursor');
        cursor.classList.remove('hovering', 'text-cursor', 'draggable', 'video-cursor', 'image-cursor', 'audio-cursor');
        return;
      }

      // Check for draggable elements
      if (target.closest && target.closest(draggableSelectors)) {
        cursor.classList.add('draggable');
        cursor.classList.remove('hovering', 'text-cursor', 'video-cursor', 'image-cursor', 'carousel-cursor');
        return;
      }

      // Check for video elements
      if (target.closest && target.closest(videoSelectors)) {
        cursor.classList.add('video-cursor');
        cursor.classList.remove('hovering', 'text-cursor', 'draggable', 'image-cursor', 'carousel-cursor');
        return;
      }

      // Check for expandable images
      if (target.closest && target.closest(imageSelectors)) {
        cursor.classList.add('image-cursor');
        cursor.classList.remove('hovering', 'text-cursor', 'draggable', 'video-cursor', 'audio-cursor', 'carousel-cursor');
        return;
      }

      // Check for audio elements
      if (target.closest && target.closest(audioSelectors)) {
        cursor.classList.add('audio-cursor');
        cursor.classList.remove('hovering', 'text-cursor', 'draggable', 'video-cursor', 'image-cursor', 'carousel-cursor');
        return;
      }

      // Check for interactive elements
      if (target.closest && target.closest(interactiveSelectors)) {
        cursor.classList.add('hovering');
      }
    }

    function onMouseOut(e) {
      const target = e.target;

      if (target.matches && target.matches(textInputSelectors)) {
        cursor.classList.remove('text-cursor');
      }

      if (target.closest && target.closest(carouselSelectors)) {
        if (!isDragging) {
          cursor.classList.remove('carousel-cursor', 'carousel-left', 'carousel-right');
          currentCarousel = null;
        }
      }

      if (target.closest && target.closest(draggableSelectors)) {
        if (!isDragging) {
          cursor.classList.remove('draggable');
        }
      }

      if (target.closest && target.closest(videoSelectors)) {
        cursor.classList.remove('video-cursor');
      }

      if (target.closest && target.closest(imageSelectors)) {
        cursor.classList.remove('image-cursor');
      }

      if (target.closest && target.closest(audioSelectors)) {
        cursor.classList.remove('audio-cursor');
      }

      if (target.closest && target.closest(interactiveSelectors)) {
        cursor.classList.remove('hovering');
      }
    }

    // Enhanced mouse down for draggable elements
    function onMouseDownEnhanced(e) {
      cursor.classList.add('clicking');

      // Check if we're clicking on a carousel element
      if (e.target.closest && e.target.closest(carouselSelectors)) {
        isDragging = true;
        cursor.classList.remove('carousel-cursor');
        cursor.classList.add('carousel-dragging');
        // Keep the direction classes (carousel-left/carousel-right)
        return;
      }

      // Check if we're clicking on a draggable element
      if (e.target.closest && e.target.closest(draggableSelectors)) {
        isDragging = true;
        cursor.classList.remove('draggable');
        cursor.classList.add('dragging');
      }
    }

    // Enhanced mouse up
    function onMouseUpEnhanced() {
      cursor.classList.remove('clicking', 'dragging', 'carousel-dragging');
      // Keep carousel-left/carousel-right if still over carousel
      if (!currentCarousel) {
        cursor.classList.remove('carousel-left', 'carousel-right');
      }
      isDragging = false;
    }

    // Attach event listeners
    document.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);
    document.addEventListener('mousedown', onMouseDownEnhanced);
    document.addEventListener('mouseup', onMouseUpEnhanced);
    document.addEventListener('mouseover', onMouseOver, { passive: true });
    document.addEventListener('mouseout', onMouseOut, { passive: true });

    // Log successful initialization (debug only)
    if (window.MARBL_DEBUG) console.log('[Marbl Cursor] Initialized successfully');
  }

  // Initialize after window load with slight delay to avoid stutter from
  // third-party scripts (Cloudflare Turnstile, analytics, etc.)
  function delayedInit() {
    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => initCursor(), { timeout: 500 });
    } else {
      setTimeout(initCursor, 100);
    }
  }

  if (document.readyState === 'complete') {
    delayedInit();
  } else {
    window.addEventListener('load', delayedInit);
  }
})();


/* ============================================
   MARBL LOGO ANIMATION
   Requires GSAP to be loaded before this script
   ============================================ */
const MarblLogo = {
  // Default configuration
  config: {
    width: 40,
    height: 24,
    color: '#F35226'
  },

  // Initialize all logos with data-logo-animate attribute
  init(options = {}) {
    this.config = { ...this.config, ...options };

    document.querySelectorAll('[data-logo-animate]').forEach(container => {
      this.createLogo(container);
    });
  },

  // Create animated logo structure
  createLogo(container) {
    const { width, height, color } = this.config;

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'marbl-logo-animated';
    wrapper.style.cssText = `
      position: relative;
      width: ${width}px;
      height: ${height}px;
      display: inline-flex;
      align-items: center;
    `;

    // Create SVG container for animation
    wrapper.innerHTML = `
      <svg class="marbl-logo-slash" viewBox="0 0 600 900" preserveAspectRatio="xMidYMid meet"
           style="position: absolute; width: 37.5%; height: 100%; left: 0;">
        <path d="M305.166 876.706H0L251.392 0H556.558L305.166 876.706Z" fill="${color}"/>
      </svg>
      <svg class="marbl-logo-asterisk" viewBox="550 0 950 900" preserveAspectRatio="xMidYMid meet"
           style="position: absolute; width: 60%; height: 100%; right: 0;">
        <path d="M1198.83 218.304L1417.91 159.301L1494.45 446.433L1293.42 500.576L1424.09 728.081L1167.98 876.712L1051.02 673.105L934.073 876.712L677.954 728.081L806.415 504.436L591.055 446.434L667.599 159.302L903.087 222.725L903.088 0H1198.83V218.304Z" fill="${color}"/>
      </svg>
    `;

    container.appendChild(wrapper);

    const slash = wrapper.querySelector('.marbl-logo-slash');
    const asterisk = wrapper.querySelector('.marbl-logo-asterisk');

    // Set initial state
    gsap.set([slash, asterisk], { x: 0, y: 0, rotation: 0 });

    let isAnimating = false;
    let hoverTimeline = null;

    // Hover animation
    container.addEventListener('mouseenter', () => {
      if (isAnimating) return;
      isAnimating = true;

      // Kill any existing animation
      if (hoverTimeline) hoverTimeline.kill();

      hoverTimeline = gsap.timeline({
        onComplete: () => {
          isAnimating = false;
        }
      });

      // Phase 1: Quick separation
      hoverTimeline.to(slash, {
        x: '-15%',
        duration: 0.15,
        ease: "power2.out"
      }, 0)
      .to(asterisk, {
        x: '15%',
        rotation: 90,
        duration: 0.15,
        ease: "power2.out"
      }, 0)

      // Phase 2: Collision - come together fast
      .to(slash, {
        x: '5%',
        duration: 0.2,
        ease: "power3.in"
      })
      .to(asterisk, {
        x: '-5%',
        rotation: 360,
        duration: 0.2,
        ease: "power3.in"
      }, "<")

      // Phase 3: Bounce back
      .to(slash, {
        x: '-8%',
        duration: 0.12,
        ease: "power2.out"
      })
      .to(asterisk, {
        x: '8%',
        rotation: 400,
        duration: 0.12,
        ease: "power2.out"
      }, "<")

      // Phase 4: Settle toward center
      .to(slash, {
        x: '2%',
        duration: 0.15,
        ease: "power2.out"
      })
      .to(asterisk, {
        x: '-2%',
        rotation: 360,
        duration: 0.15,
        ease: "power2.out"
      }, "<")

      // Phase 5: Final settle with elastic
      .to(slash, {
        x: '0%',
        duration: 0.25,
        ease: "elastic.out(1, 0.5)"
      })
      .to(asterisk, {
        x: '0%',
        rotation: 360,
        duration: 0.25,
        ease: "elastic.out(1, 0.5)"
      }, "<")

      // Phase 6: Shake to lock
      .to([slash, asterisk], {
        y: '-4%',
        duration: 0.08,
        ease: "power2.out"
      })
      .to([slash, asterisk], {
        y: '4%',
        duration: 0.08,
        ease: "power2.inOut"
      })
      .to([slash, asterisk], {
        y: '-2%',
        duration: 0.06,
        ease: "power2.inOut"
      })
      .to([slash, asterisk], {
        y: '0%',
        duration: 0.12,
        ease: "elastic.out(1.5, 0.4)"
      })

      // Final rotation settle
      .to(asterisk, {
        rotation: 370,
        duration: 0.1,
        ease: "power2.out"
      }, "-=0.1")
      .to(asterisk, {
        rotation: 360,
        duration: 0.2,
        ease: "elastic.out(1.5, 0.4)"
      });
    });

    // Reset on mouse leave (only if not animating)
    container.addEventListener('mouseleave', () => {
      if (!isAnimating) {
        gsap.to([slash, asterisk], {
          x: 0,
          y: 0,
          rotation: 0,
          duration: 0.3,
          ease: "power2.out"
        });
      }
    });
  }
};

// Auto-init logo when DOM is ready if GSAP is available.
// Deferred via requestIdleCallback because MarblLogo.init() calls gsap.set()
// which forces a synchronous layout (~33ms in gsap.min.js Pd per Lighthouse
// trace on subscribe.marbl.codes 15 Apr 2026). Running it after first paint
// keeps the cursor + hero animations smooth; the logo hover animation is
// fully wired by the time anyone can actually mouse over the logo.
if (typeof document !== 'undefined') {
  const scheduleInit = () => {
    if (typeof gsap === 'undefined') return;
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => MarblLogo.init(), { timeout: 500 });
    } else {
      setTimeout(() => MarblLogo.init(), 0);
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleInit);
  } else {
    scheduleInit();
  }
}


/* ============================================
   MARBL BURGER MENU
   ============================================ */
(function(window) {
  'use strict';

  const MarblBurgerMenu = {
    isOpen: false,
    overlay: null,
    config: {
      currentSite: null,
      onOpen: null,
      onClose: null
    },

    // Simple menu structure
    menuData: {
      links: [
        { label: 'Marbl', url: 'https://marbl.codes', id: 'marbl' },
        { label: 'Luma', url: 'https://luma.marbl.codes', id: 'luma' },
        { label: 'Nura', url: 'https://nura.marbl.codes', id: 'nura' },
        { label: 'Tala', url: 'https://tala.marbl.codes', id: 'tala' },
        { label: 'Atlas', url: 'https://atlas.marbl.codes', id: 'atlas' },
        { label: 'Sera', url: 'https://sera.marbl.codes', id: 'sera' },
        { label: 'Vela', url: 'https://vela.marbl.codes', id: 'vela' }
      ],
      social: [
        {
          label: 'YouTube',
          url: 'https://www.youtube.com/@MarblCodes',
          svg: '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>'
        },
        {
          label: 'LinkedIn',
          url: 'https://www.linkedin.com/in/richardbland1985/',
          svg: '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>'
        },
        {
          label: 'GitHub',
          url: 'https://github.com/memdigital',
          svg: '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>'
        }
      ],
      footer: [
        { label: 'Privacy', url: 'https://marbl.codes/legal/privacy' },
        { label: 'Terms', url: 'https://marbl.codes/legal/terms' },
        { label: 'Contact', url: 'mailto:hello@marbl.codes' }
      ]
    },

    init(userConfig = {}) {
      this.config = { ...this.config, ...userConfig };

      // Auto-detect current site
      if (!this.config.currentSite) {
        const hostname = window.location.hostname;
        if (hostname.includes('nura.')) this.config.currentSite = 'nura';
        else if (hostname.includes('luma.')) this.config.currentSite = 'luma';
        else if (hostname.includes('tala.')) this.config.currentSite = 'tala';
        else if (hostname.includes('atlas.')) this.config.currentSite = 'atlas';
        else if (hostname.includes('sera.')) this.config.currentSite = 'sera';
        else if (hostname.includes('vela.')) this.config.currentSite = 'vela';
        else this.config.currentSite = 'marbl';
      }

      this.createOverlay();
      this.bindEvents();
    },

    createOverlay() {
      this.overlay = document.createElement('div');
      this.overlay.className = 'burger-menu-overlay';
      this.overlay.setAttribute('aria-hidden', 'true');

      const { links, social, footer } = this.menuData;
      const currentSite = this.config.currentSite;

      this.overlay.innerHTML = `
        <div class="burger-menu-container">
          <button class="burger-menu-close" aria-label="Close menu">
            <span></span>
            <span></span>
          </button>

          <nav class="burger-menu-nav" role="navigation">
            <div class="burger-menu-links">
              ${links.map((link, i) => `
                <a href="${link.url}"
                   class="burger-menu-link ${currentSite === link.id ? 'is-current' : ''}"
                   style="transition-delay: ${0.1 + i * 0.08}s">
                  ${link.label}
                </a>
              `).join('')}
            </div>

            <div class="burger-menu-social">
              ${social.map(link => `
                <a href="${link.url}" class="burger-menu-social-link" target="_blank" rel="noopener" title="${link.label}">
                  ${link.svg}
                </a>
              `).join('')}
            </div>

            <div class="burger-menu-footer">
              ${footer.map(link => `
                <a href="${link.url}" class="burger-menu-footer-link">${link.label}</a>
              `).join('')}
            </div>
          </nav>
        </div>
      `;

      document.body.appendChild(this.overlay);

      // Close button
      this.overlay.querySelector('.burger-menu-close').addEventListener('click', () => this.close());

      // Close on background click
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) this.close();
      });
    },

    bindEvents() {
      const toggles = document.querySelectorAll('[data-burger-toggle]');

      toggles.forEach(toggle => {
        if (!toggle.innerHTML.trim()) {
          toggle.innerHTML = `
            <span class="burger-line"></span>
            <span class="burger-line"></span>
            <span class="burger-line"></span>
          `;
        }
        /* Accessibility contract on the toggle: aria-expanded + aria-controls
           so screen readers announce the open/closed state. */
        toggle.setAttribute('aria-expanded', 'false');
        if (this.overlay && this.overlay.id) {
          toggle.setAttribute('aria-controls', this.overlay.id);
        } else if (this.overlay && !this.overlay.id) {
          this.overlay.id = 'marbl-burger-menu-overlay';
          toggle.setAttribute('aria-controls', 'marbl-burger-menu-overlay');
        }
        toggle.addEventListener('click', () => this.toggle());
      });

      // Escape to close
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) this.close();
      });

      /* Focus trap: when the overlay is open, Tab cycles inside it.
         Shift+Tab at the first focusable wraps to the last, and vice versa. */
      document.addEventListener('keydown', (e) => {
        if (!this.isOpen || e.key !== 'Tab') return;
        const focusables = this.overlay.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      });
    },

    toggle() {
      this.isOpen ? this.close() : this.open();
    },

    open() {
      this.isOpen = true;
      /* Remember where focus was before opening so we can restore it on close. */
      this.previousFocus = document.activeElement;
      this.overlay.classList.add('is-open');
      this.overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      document.body.classList.add('menu-is-open');
      document.querySelectorAll('[data-burger-toggle]').forEach(t => {
        t.classList.add('is-open');
        t.setAttribute('aria-expanded', 'true');
      });
      /* Move focus into the overlay so keyboard users land inside it. */
      const closeBtn = this.overlay.querySelector('.burger-menu-close');
      if (closeBtn) closeBtn.focus();
      if (this.config.onOpen) this.config.onOpen();
    },

    close() {
      this.isOpen = false;
      this.overlay.classList.remove('is-open');
      this.overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      document.body.classList.remove('menu-is-open');
      document.querySelectorAll('[data-burger-toggle]').forEach(t => {
        t.classList.remove('is-open');
        t.setAttribute('aria-expanded', 'false');
      });
      /* Restore focus to whatever opened the menu (WCAG 2.4.3). */
      if (this.previousFocus && typeof this.previousFocus.focus === 'function') {
        this.previousFocus.focus();
      }
      if (this.config.onClose) this.config.onClose();
    }
  };

  // Auto-init
  const autoInit = () => {
    if (document.querySelector('[data-burger-toggle]')) {
      MarblBurgerMenu.init();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  window.MarblBurgerMenu = MarblBurgerMenu;
})(window);


/* ============================================
   MARBL COOKIE CONSENT
   ============================================ */
(function(window) {
  'use strict';

  const MarblCookieConsent = {
    storageKey: 'marbl_cookie_consent',
    expiryDays: 7, // GDPR compliant - re-prompt after 7 days
    banner: null,

    init() {
      // Check if consent already given and not expired
      if (this.hasConsent()) {
        return;
      }

      this.createBanner();
      this.bindEvents();

      // Show banner after a brief delay for smoother UX
      setTimeout(() => {
        this.show();
      }, 1000);
    },

    hasConsent() {
      try {
        const consent = localStorage.getItem(this.storageKey);
        if (!consent) return false;

        // Check if consent has expired (stored as timestamp)
        const consentTime = parseInt(consent, 10);
        if (isNaN(consentTime)) {
          // Legacy format ('accepted' string) - treat as expired
          localStorage.removeItem(this.storageKey);
          return false;
        }

        const now = Date.now();
        const expiryMs = this.expiryDays * 24 * 60 * 60 * 1000;

        if (now - consentTime > expiryMs) {
          // Consent has expired
          localStorage.removeItem(this.storageKey);
          return false;
        }

        return true;
      } catch (e) {
        // localStorage not available
        return false;
      }
    },

    setConsent() {
      try {
        // Store timestamp for expiry checking
        localStorage.setItem(this.storageKey, Date.now().toString());
      } catch (e) {
        // localStorage not available, consent will be asked again next visit
      }
    },

    createBanner() {
      this.banner = document.createElement('div');
      this.banner.className = 'cookie-consent';
      this.banner.setAttribute('role', 'dialog');
      this.banner.setAttribute('aria-label', 'Cookie consent');

      this.banner.innerHTML = `
        <div class="cookie-consent-content">
          <p class="cookie-consent-label">Hey, Friends!</p>
          <p class="cookie-consent-text">
            We only use functional scripts and GDPR friendly analytics. Okay with these
            <span class="cookie-consent-accent">lovely bis-cu-its?</span>
          </p>
          <div class="cookie-consent-footer">
            <p class="cookie-consent-links">
              <a href="https://marbl.codes/legal/cookies" target="_blank" rel="noopener">Cookies</a>
              <a href="https://marbl.codes/legal/privacy" target="_blank" rel="noopener">Privacy</a>
              <a href="https://marbl.codes/legal/terms" target="_blank" rel="noopener">Terms</a>
            </p>
            <button class="cookie-consent-btn cookie-consent-btn--accept" type="button" data-cookie-accept>
              Yummy
              <span class="cookie-consent-btn__icon" aria-hidden="true">
                <svg viewBox="0 0 1200 1200" xmlns="http://www.w3.org/2000/svg">
                  <path d="m843.74 225c0-31.031 25.219-56.25 56.25-56.25s56.25 25.219 56.25 56.25-25.219 56.25-56.25 56.25-56.25-25.219-56.25-56.25zm93.75 187.69c0 20.719 16.969 37.688 37.688 37.688s37.688-16.969 37.688-37.688-17.062-37.688-37.688-37.688-37.688 16.969-37.688 37.688zm121.87 187.31c0 253.31-206.06 459.37-459.37 459.37-253.31 0-459.37-206.06-459.37-459.37s206.06-459.37 459.37-459.37c21.094 0 42.188 1.4062 62.625 4.3125 2.7188 0.375 5.1562 1.9688 6.6562 4.2188 1.5 2.3438 1.875 5.1562 1.0312 7.7812-3.0938 10.031-4.6875 20.25-4.6875 30.562 0 39.75 22.219 75.281 57.938 92.719 4.0312 1.9688 6.0938 6.5625 4.875 10.969-4.4062 15.656-6.5625 31.875-6.5625 48.281 0 99.281 80.812 180 180.1 180 1.6875 0 3.2812 0 4.875-0.1875 4.125-0.375 8.1562 1.9688 9.6562 5.9062 15.562 39.75 53.25 65.438 96 65.438 11.719 0 23.25-1.9688 34.312-5.8125 2.8125-1.0312 5.9062-0.5625 8.3438 1.125s3.9375 4.4062 4.125 7.4062c0.09375 2.1562 0.09375 4.3125 0.09375 6.6562zm-675-187.5c0 46.5 37.875 84.375 84.375 84.375s84.375-37.875 84.375-84.375-37.875-84.375-84.375-84.375-84.375 37.875-84.375 84.375zm225 318.74c0-56.906-46.219-103.12-103.12-103.12s-103.12 46.219-103.12 103.12 46.219 103.12 103.12 103.12 103.12-46.219 103.12-103.12zm225 37.5c0-15.469-12.656-28.125-28.125-28.125s-28.125 12.656-28.125 28.125 12.656 28.125 28.125 28.125 28.125-12.656 28.125-28.125z"/>
                </svg>
              </span>
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(this.banner);

      // Crumb burst container - fires on accept click, stays above everything.
      this.crumbs = document.createElement('div');
      this.crumbs.className = 'cookie-crumbs';
      this.crumbs.setAttribute('aria-hidden', 'true');
      this.crumbs.innerHTML = Array.from({ length: 16 }, (_, i) => `<span class="crumb crumb--${i + 1}"></span>`).join('');
      document.body.appendChild(this.crumbs);
    },

    bindEvents() {
      const acceptBtn = this.banner.querySelector('[data-cookie-accept]');
      if (acceptBtn) {
        acceptBtn.addEventListener('click', () => this.accept());
      }
    },

    show() {
      if (this.banner) {
        this.banner.classList.add('is-visible');
      }
    },

    hide() {
      if (this.banner) {
        this.banner.classList.remove('is-visible');
        this.banner.classList.add('is-hidden');

        // Remove from DOM after animation
        setTimeout(() => {
          if (this.banner && this.banner.parentNode) {
            this.banner.parentNode.removeChild(this.banner);
          }
        }, 400);
      }
    },

    accept() {
      // Fire the ember crumb burst over everything before dismissing.
      if (this.crumbs) {
        // Anchor burst to the button's centre so particles explode
        // from the button itself, not the viewport corner.
        const acceptBtn = this.banner && this.banner.querySelector('[data-cookie-accept]');
        if (acceptBtn) {
          const rect = acceptBtn.getBoundingClientRect();
          this.crumbs.style.left = (rect.left + rect.width / 2) + 'px';
          this.crumbs.style.top = (rect.top + rect.height / 2) + 'px';
        }
        this.crumbs.classList.remove('is-bursting');
        void this.crumbs.offsetWidth;
        this.crumbs.classList.add('is-bursting');
        setTimeout(() => {
          if (this.crumbs && this.crumbs.parentNode) {
            this.crumbs.parentNode.removeChild(this.crumbs);
          }
        }, 1300);
      }
      this.setConsent();
      this.hide();
    }
  };

  // Auto-init when DOM is ready
  const autoInit = () => {
    MarblCookieConsent.init();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  window.MarblCookieConsent = MarblCookieConsent;
})(window);


/* ============================================
   INITIALIZATION COMPLETE
   ============================================ */
if (window.MARBL_DEBUG) console.log('[Marbl Core] All modules loaded successfully');
