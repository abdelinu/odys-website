/**
 * ODYS CRM — front capture.
 *
 * Sends buying intent to the module's capture endpoint. Anonymous events
 * (WhatsApp tap, add to cart) carry no personal data; an e-mail is sent only
 * when the visitor typed it into a form they submitted. Everything is wrapped
 * in try/catch: the shop must keep working if capture fails.
 *
 * The same rules run here and in capture.php. This copy is for the visitor —
 * instant feedback, less noise on the wire — and is never trusted: the server
 * re-validates every field and is the only thing standing between the table
 * and a request that never touched this file.
 */
(function () {
  'use strict';

  var cfg = window.odysCrm;
  if (!cfg || !cfg.url) return;

  var LIMITS = { name: 128, subject: 255, payload: 2000, page: 255, email: 190, phone: 32 };
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
  /* client-side throttle, so a chatty page cannot spam the endpoint */
  var MIN_GAP_MS = 400;
  var lastSent = 0;

  function text(value, max) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/<[^>]*>/g, '')
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001F\u007F]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, max);
  }

  function email(value) {
    var v = text(value, LIMITS.email);
    return EMAIL_RE.test(v) ? v : '';
  }

  function phone(value) {
    var v = String(value || '').replace(/[^0-9+ ]/g, '').replace(/\s+/g, ' ').trim();
    var digits = v.replace(/\D/g, '');
    return digits.length >= 6 && digits.length <= 18 ? v.slice(0, LIMITS.phone) : '';
  }

  /** A path on this shop, never an absolute or scheme-bearing URL. */
  function path(value) {
    var v = String(value || '');
    if (!v || v.charAt(0) !== '/' || v.charAt(1) === '/' || v.indexOf('..') !== -1) return '';
    if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return '';
    return v.slice(0, LIMITS.page);
  }

  function visitorId() {
    try {
      var m = document.cookie.match(/(?:^|; )odys_vid=([^;]+)/);
      if (m) return m[1].replace(/[^a-z0-9]/gi, '').slice(0, 48);
      var id = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      document.cookie = 'odys_vid=' + id + ';path=/;max-age=15552000;samesite=lax';
      return id;
    } catch (e) {
      return '';
    }
  }

  function send(source, data) {
    try {
      var now = Date.now();
      if (now - lastSent < MIN_GAP_MS) return;
      lastSent = now;

      var body = {
        source: text(source, 32),
        visitor: visitorId(),
        page: path(location.pathname)
      };
      if (data) {
        if (data.email) { body.email = email(data.email); if (!body.email) return; }
        if (data.phone) { body.phone = phone(data.phone); if (!body.phone) return; }
        if (data.name) body.name = text(data.name, LIMITS.name);
        if (data.subject) body.subject = text(data.subject, LIMITS.subject);
        if (data.payload) body.payload = text(data.payload, LIMITS.payload);
      }
      if (!body.visitor && !body.email && !body.phone) return;

      fetch(cfg.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        keepalive: true,
        body: JSON.stringify(body)
      }).catch(function () {});
    } catch (e) { /* never break the page */ }
  }

  /** Mark a field invalid for the visitor without blocking their submission. */
  function flag(field, message) {
    try {
      if (!field || typeof field.setCustomValidity !== 'function') return;
      field.setCustomValidity(message || '');
      if (message) field.reportValidity && field.reportValidity();
    } catch (e) { /* older browsers */ }
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

    var wa = t.closest('a[href*="wa.me"], .wa-btn, [data-action="wa-order"]');
    if (wa) {
      send('whatsapp', { subject: document.title });
      return;
    }

    var add = t.closest('[data-action="add-to-cart"], .pc-add, .btn-cart');
    if (add) {
      send('cart', { subject: add.dataset.name || add.dataset.code || document.title });
    }
  }, true);

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || !form.matches) return;

    if (form.closest('#nvQuiz')) {
      var d = new FormData(form);
      send('quiz', {
        subject: 'Famille ' + text(d.get('fam'), 40),
        payload: JSON.stringify({
          fam: text(d.get('fam'), 40),
          occasion: text(d.get('occ'), 40),
          intensite: text(d.get('int'), 40)
        })
      });
      return;
    }

    var field = form.querySelector('input[type="email"]');
    if (field && field.value && /newsletter|nl-form/i.test(form.className + ' ' + form.id)) {
      var address = email(field.value);
      flag(field, address ? '' : 'Vérifiez votre adresse e-mail.');
      if (!address) { e.preventDefault(); return; }
      send('newsletter', { email: address });
    }
  }, true);

  /* clear a custom error as soon as the visitor edits the field */
  document.addEventListener('input', function (e) {
    if (e.target && e.target.type === 'email') flag(e.target, '');
  }, true);
})();
