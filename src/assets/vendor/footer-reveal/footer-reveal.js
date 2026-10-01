/**
 * Site Footer — subscribe form (progressive enhancement).
 * Universal component: ships on every Marbl site.
 *
 * Posts to the CENTRAL endpoint https://marbl.codes/api/subscribe (a Pages
 * Function). Absolute URL so the footer works on EVERY Marbl site — same-origin
 * on marbl.codes, cross-origin elsewhere via CORS (allowed Marbl apexes only).
 * Fail-soft.
 *
 * Invisible Cloudflare Turnstile, opt-in: the library carries NO live key, so
 * the widget only activates when the consumer site puts its public sitekey on
 * the form as data-turnstile-sitekey. The challenge runs at SUBMIT time
 * (execution:'execute') so the token is always fresh - they expire after 300
 * seconds. Invisible mode shows no UI. If the script is blocked or errors, we
 * submit with a null token and let the server decide - a visitor running a
 * privacy blocker must never find the form simply dead.
 */
(function () {
  var form = document.getElementById('footer-subscribe');
  if (!form) return;

  var input = form.querySelector('.footer-subscribe__input');
  var msg = form.parentElement.querySelector('.footer-subscribe__msg');
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  var TS_SITEKEY = form.getAttribute('data-turnstile-sitekey') || null;
  var tsWidget = null;
  var pending = null; // email value waiting on a Turnstile token
  var timer = null;

  function send(value, token) {
    fetch('https://marbl.codes/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: value, source: 'footer', turnstileToken: token })
    })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (body) {
        if (msg) msg.textContent = body.message || body.error || 'Thanks, we will be in touch.';
        if (!body.error) form.reset();
      })
      .catch(function () {
        if (msg) msg.textContent = 'Something went wrong, please try again.';
      });
  }

  function flush(token) {
    if (timer) { clearTimeout(timer); timer = null; }
    if (pending === null) return;
    var v = pending; pending = null;
    send(v, token);
    if (window.turnstile && tsWidget !== null) { try { window.turnstile.reset(tsWidget); } catch (err) {} }
  }

  function renderWidget() {
    try {
      var holder = document.createElement('div');
      form.appendChild(holder);
      tsWidget = window.turnstile.render(holder, {
        sitekey: TS_SITEKEY,
        execution: 'execute',
        callback: function (token) { flush(token); },
        'error-callback': function () { flush(null); }
      });
    } catch (err) { tsWidget = null; }
  }

  if (TS_SITEKEY) {
    if (window.turnstile) {
      renderWidget();
    } else {
      window.__marblTsOnload = renderWidget;
      var ts = document.createElement('script');
      ts.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__marblTsOnload';
      ts.async = true;
      document.head.appendChild(ts);
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var value = (input && input.value ? input.value : '').trim();

    if (!EMAIL.test(value)) {
      if (msg) msg.textContent = 'Enter a valid email address.';
      if (input) input.focus();
      return;
    }

    if (msg) msg.textContent = 'One moment...';
    if (window.turnstile && tsWidget !== null) {
      pending = value;
      // Never leave a person hanging on a stuck challenge: after 8s, send anyway
      // with a null token and let the server rule on it.
      timer = setTimeout(function () { flush(null); }, 8000);
      try { window.turnstile.execute(tsWidget); } catch (err) { flush(null); }
    } else {
      send(value, null);
    }
  });
})();
