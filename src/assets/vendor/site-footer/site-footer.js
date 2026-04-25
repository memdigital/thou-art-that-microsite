/**
 * Site Footer — impressum tooltip click-to-pin behaviour.
 * Universal component: ships on every Marbl site.
 *
 * Hover reveals via CSS. Click toggles .is-pinned (stays open until
 * click outside or Escape). Focus returns to trigger on close.
 */
(function () {
  var impressums = document.querySelectorAll('.footer-impressum');
  if (!impressums.length) return;

  impressums.forEach(function (wrap) {
    var trigger = wrap.querySelector('.footer-impressum__trigger');
    if (!trigger) return;

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = wrap.classList.toggle('is-pinned');
      trigger.setAttribute('aria-expanded', String(open));
    });
  });

  function closeAll(returnFocus) {
    impressums.forEach(function (wrap) {
      if (wrap.classList.contains('is-pinned')) {
        wrap.classList.remove('is-pinned');
        var trigger = wrap.querySelector('.footer-impressum__trigger');
        if (trigger) {
          trigger.setAttribute('aria-expanded', 'false');
          if (returnFocus) trigger.focus();
        }
      }
    });
  }

  document.addEventListener('click', function (e) {
    var inside = false;
    impressums.forEach(function (wrap) {
      if (wrap.contains(e.target)) inside = true;
    });
    if (!inside) closeAll(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAll(true);
  });
})();
