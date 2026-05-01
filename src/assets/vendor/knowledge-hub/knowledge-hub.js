/**
 * Knowledge Hub — interaction layer.
 *
 * Wires up: sidebar search filter, tier-collapse on group labels,
 * mobile sidebar drawer toggle, smooth-scroll TOC anchors,
 * and IntersectionObserver scroll-spy on the right TOC.
 *
 * Settled: 28 April 2026
 */

(function () {
  'use strict';

  const ready = (fn) => {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  };

  ready(() => {
    initTierToggle();
    initSearch();
    initMobileDrawer();
    initScrollSpy();
    initHotkeys();
  });

  /* === Tier toggle on .kh-nav__group (nestable, any depth) ===
     Each group has a direct-child label-button and direct-child children panel.
     :scope > selector ensures nested groups don't fight their parents.
     Accordion behaviour (locked 30 Apr 2026): opening a group automatically
     closes its sibling groups at the same tier, so only one branch is open
     at a time per parent. */
  function initTierToggle() {
    document.querySelectorAll('.kh-nav__group').forEach((group) => {
      const label = group.querySelector(':scope > .kh-nav__group-label');
      if (!label) return;
      if (!group.hasAttribute('aria-expanded')) {
        group.setAttribute('aria-expanded', 'true');
      }
      label.addEventListener('click', (e) => {
        e.stopPropagation();
        const expanded = group.getAttribute('aria-expanded') === 'true';
        if (expanded) {
          group.setAttribute('aria-expanded', 'false');
          return;
        }
        // Opening: close sibling groups at the same tier first.
        const parent = group.parentElement;
        if (parent) {
          parent.querySelectorAll(':scope > .kh-nav__group[aria-expanded="true"]').forEach((sibling) => {
            if (sibling !== group) sibling.setAttribute('aria-expanded', 'false');
          });
        }
        group.setAttribute('aria-expanded', 'true');
      });
    });
  }

  /* === Sidebar search (progressive enhancement) ===
     Default: filter .kh-nav__item by link text (fast, no deps).
     Upgraded: when window.MiniSearch + /search-index.json (or
     ./sample/search-index.json relative to preview) are available, switch to
     full-text fuzzy search with a results panel under the input.
     Index location: data-search-index attr on .kh-sidebar__search wins;
     otherwise tries /search-index.json then ./sample/search-index.json. */
  function initSearch() {
    const input = document.querySelector('.kh-sidebar__search');
    if (!input) return;
    const items = Array.from(document.querySelectorAll('.kh-nav__item'));
    const groups = Array.from(document.querySelectorAll('.kh-nav__group'));

    let mini = null;
    let docs = [];
    let resultsPanel = null;
    const indexUrls = [
      input.getAttribute('data-search-index'),
      '/search-index.json',
      './sample/search-index.json',
    ].filter(Boolean);

    const filterNav = (q) => {
      items.forEach((item) => {
        const link = item.querySelector('.kh-nav__link');
        const text = (link ? link.textContent : '').toLowerCase();
        const match = !q || text.includes(q);
        item.classList.toggle('is-hidden', !match);
      });
      groups.forEach((group) => {
        const visible = group.querySelectorAll('.kh-nav__item:not(.is-hidden)').length;
        group.classList.toggle('is-hidden', q && visible === 0);
        if (q) {
          // Save the pre-search state once, then expand-all so the user
          // can see which group every match lives in. Locked 30 Apr 2026.
          if (group.dataset.preSearchExpanded === undefined) {
            group.dataset.preSearchExpanded = group.getAttribute('aria-expanded') || 'false';
          }
          group.setAttribute('aria-expanded', 'true');
        } else if (group.dataset.preSearchExpanded !== undefined) {
          // Search cleared — restore the original collapsed/expanded state
          // so we don't leave the sidebar fully unfurled (was a bug).
          group.setAttribute('aria-expanded', group.dataset.preSearchExpanded);
          delete group.dataset.preSearchExpanded;
        }
      });
    };

    const ensureResultsPanel = () => {
      if (resultsPanel) return resultsPanel;
      resultsPanel = document.createElement('div');
      resultsPanel.className = 'kh-search-results';
      resultsPanel.setAttribute('role', 'listbox');
      resultsPanel.setAttribute('aria-label', 'Search results');
      // Append to body so position:fixed escapes any ancestor with
      // overflow:auto (the sidebar) which would otherwise clip + trigger
      // a scrollbar on the sidebar itself.
      document.body.appendChild(resultsPanel);
      return resultsPanel;
    };

    /* Position the panel directly under the search input, full width of
       the input. Recalculate on scroll + resize. */
    const positionPanel = () => {
      if (!resultsPanel || !resultsPanel.classList.contains('is-open')) return;
      const r = input.getBoundingClientRect();
      resultsPanel.style.top = (r.bottom + 4) + 'px';
      resultsPanel.style.left = r.left + 'px';
      resultsPanel.style.width = r.width + 'px';
    };
    window.addEventListener('scroll', positionPanel, { passive: true });
    window.addEventListener('resize', positionPanel);

    const renderResults = (q, results) => {
      const panel = ensureResultsPanel();
      if (!q) { panel.innerHTML = ''; panel.classList.remove('is-open'); return; }
      if (results.length === 0) {
        panel.innerHTML = '<p class="kh-search-results__empty">No results.</p>';
        panel.classList.add('is-open');
        positionPanel();
        return;
      }
      panel.innerHTML = results.slice(0, 8).map((r) => {
        const doc = docs.find((d) => d.id === r.id);
        if (!doc) return '';
        const snippet = makeSnippet(doc.content, q);
        return `
          <a class="kh-search-results__item" href="${escapeAttr(doc.url || '#')}" role="option">
            <span class="kh-search-results__crumb">${escapeHtml(doc.group || '')}</span>
            <span class="kh-search-results__title">${highlight(doc.title, q)}</span>
            <span class="kh-search-results__snippet">${highlight(snippet, q)}</span>
          </a>
        `;
      }).join('');
      panel.classList.add('is-open');
      positionPanel();
    };

    const makeSnippet = (content, q) => {
      if (!content) return '';
      const lower = content.toLowerCase();
      const idx = lower.indexOf(q.toLowerCase());
      if (idx === -1) return content.slice(0, 140) + (content.length > 140 ? '…' : '');
      const start = Math.max(0, idx - 50);
      const end = Math.min(content.length, idx + q.length + 90);
      return (start > 0 ? '…' : '') + content.slice(start, end) + (end < content.length ? '…' : '');
    };

    const highlight = (text, q) => {
      if (!q) return escapeHtml(text);
      const escaped = escapeHtml(text);
      const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return escaped.replace(new RegExp(safeQ, 'ig'), (m) => `<mark>${m}</mark>`);
    };

    const escapeHtml = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const escapeAttr = (s) => escapeHtml(s);

    const tryUpgrade = async () => {
      if (typeof window.MiniSearch === 'undefined') return;
      for (const url of indexUrls) {
        try {
          const res = await fetch(url, { cache: 'force-cache' });
          if (!res.ok) continue;
          const data = await res.json();
          docs = data.documents || [];
          if (!docs.length) continue;
          mini = new window.MiniSearch({
            fields: ['title', 'headings', 'content', 'group'],
            storeFields: ['id', 'title', 'url', 'group'],
            searchOptions: { boost: { title: 3, headings: 2 }, fuzzy: 0.2, prefix: true },
          });
          mini.addAll(docs.map((d) => ({ ...d, headings: (d.headings || []).join(' ') })));
          return;
        } catch (e) { /* try next */ }
      }
    };

    tryUpgrade();

    input.addEventListener('input', () => {
      const q = input.value.trim();
      filterNav(q.toLowerCase());
      if (mini && q.length >= 2) {
        const results = mini.search(q);
        renderResults(q, results);
      } else if (resultsPanel) {
        resultsPanel.innerHTML = '';
        resultsPanel.classList.remove('is-open');
      }
    });

    input.addEventListener('blur', () => {
      // Delay so click on a result registers before panel hides.
      setTimeout(() => { if (resultsPanel) resultsPanel.classList.remove('is-open'); }, 150);
    });
    input.addEventListener('focus', () => {
      if (resultsPanel && resultsPanel.children.length) {
        resultsPanel.classList.add('is-open');
        positionPanel();
      }
    });
  }

  /* === Hotkeys ===
     "/" or Cmd/Ctrl+K focus the search input. Esc blurs + closes results.
     "/" only fires when not already typing in another input. */
  function initHotkeys() {
    const input = document.querySelector('.kh-sidebar__search');
    if (!input) return;
    document.addEventListener('keydown', (e) => {
      const inField = e.target.matches('input, textarea, [contenteditable]');
      if ((e.key === '/' && !inField) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        input.focus();
        input.select();
      }
      if (e.key === 'Escape' && document.activeElement === input) {
        input.blur();
      }
    });
  }

  /* === Mobile sidebar drawer ===
     The .kh-sidebar__toggle button toggles aria-expanded on .kh-sidebar.
     CSS handles the visual collapse via grid-rows transition. */
  function initMobileDrawer() {
    const sidebar = document.querySelector('.kh-sidebar');
    const toggle = document.querySelector('.kh-sidebar__toggle');
    if (!sidebar || !toggle) return;
    // Default: collapsed on mobile, expanded on desktop. Listen to a
    // matchMedia change event (not window.resize) so we only fire on the
    // actual breakpoint crossing. Mobile keyboards trigger resize events
    // when an input gains focus, and a plain resize handler would
    // force-close the drawer the moment a user tapped the search box.
    // Locked 1 May 2026.
    const mql = window.matchMedia('(max-width: 768px)');
    const setInitial = () => {
      sidebar.setAttribute('aria-expanded', mql.matches ? 'false' : 'true');
    };
    setInitial();
    if (mql.addEventListener) {
      mql.addEventListener('change', setInitial);
    } else if (mql.addListener) {
      mql.addListener(setInitial);
    }

    toggle.addEventListener('click', () => {
      const expanded = sidebar.getAttribute('aria-expanded') === 'true';
      sidebar.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    });
  }

  /* === TOC scroll-spy + smooth scroll ===
     Watch every [id] heading inside .kh-article__body. Whichever is closest
     to the top of the viewport gets aria-current on its TOC link. */
  function initScrollSpy() {
    const tocLinks = Array.from(document.querySelectorAll('.kh-toc__link'));
    if (tocLinks.length === 0) return;

    // Smooth-scroll anchor clicks (CSS scroll-behavior covers this too,
    // but we also clear stale aria-current on click for instant feedback).
    tocLinks.forEach((link) => {
      link.addEventListener('click', () => {
        tocLinks.forEach((l) => l.removeAttribute('aria-current'));
        link.setAttribute('aria-current', 'true');
      });
    });

    const headings = tocLinks
      .map((link) => {
        const id = link.getAttribute('href') || '';
        return id.startsWith('#') ? document.getElementById(id.slice(1)) : null;
      })
      .filter(Boolean);

    if (headings.length === 0) return;

    const linkFor = (heading) => tocLinks.find((l) => l.getAttribute('href') === '#' + heading.id);

    // rootMargin: top offset accounts for the article scroll-margin-top.
    // Bottom -60% means a heading "activates" once it's in the upper 40% of the viewport.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const link = linkFor(entry.target);
            if (!link) return;
            tocLinks.forEach((l) => l.removeAttribute('aria-current'));
            link.setAttribute('aria-current', 'true');
          }
        });
      },
      { rootMargin: '0px 0px -60% 0px', threshold: 0 }
    );

    headings.forEach((h) => observer.observe(h));
  }
})();
