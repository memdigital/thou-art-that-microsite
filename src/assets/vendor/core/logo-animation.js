/**
 * Marbl Logo Hover Animation
 * Creates the stinger effect on logo hover (without glow)
 *
 * Usage:
 * 1. Include GSAP: <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
 * 2. Include this script: <script src="https://marbl.codes/core/logo-animation.js"></script>
 * 3. Replace static logo SVG with the animated version:
 *    <a href="/" class="marbl-logo" data-logo-animate>
 *      <!-- Logo will be injected here -->
 *    </a>
 * 4. Call MarblLogo.init() after DOM is ready
 */

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

// Auto-init when DOM is ready if not using modules
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Only auto-init if GSAP is available
      if (typeof gsap !== 'undefined') {
        MarblLogo.init();
      }
    });
  } else {
    if (typeof gsap !== 'undefined') {
      MarblLogo.init();
    }
  }
}
