/**
 * Pill Nav behaviour.
 *
 * The hover / focus-within reveal is pure CSS - this script only adds the touch
 * (click) toggle and the matching ARIA state, plus outside-click and Escape to
 * close. On desktop the CSS reveal still works without JS; JS makes it usable on
 * touch devices where there is no hover.
 *
 * No dependencies. Self-initialises on DOMContentLoaded; safe to load deferred.
 *
 * Extracted from Marbl Events (PublicLayout.astro) 18 June 2026.
 */
(function () {
  "use strict";

  function initPillNav(menu) {
    var burger = menu.querySelector(".nav-burger");
    if (!burger) return;

    function setOpen(open) {
      menu.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
    }

    // Click the burger to toggle (the only open path on touch / mobile).
    burger.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(!menu.classList.contains("is-open"));
    });

    // Click anywhere outside the menu closes it.
    document.addEventListener("click", function (e) {
      if (menu.classList.contains("is-open") && !menu.contains(e.target)) {
        setOpen(false);
      }
    });

    // Escape closes.
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        setOpen(false);
      }
    });
  }

  function init() {
    var menus = document.querySelectorAll(".nav-menu");
    for (var i = 0; i < menus.length; i++) initPillNav(menus[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
