/**
 * registrazione.js — Logica pagina registrazione genitore
 * Sistema Cardano Day · ITIS G. Cardano, Pavia
 *
 * Gestisce:
 *  - Stepper 3 step
 *  - Validazione campi step 1
 *  - CAP ↔ Città autocomplete
 *  - Indicatore forza password
 *  - OTP: 6 celle, focus automatico, paste, reinvio
 *  - Step 3: schermata completato
 *
 * Nota: le chiamate API sono commentate con === PRODUZIONE ===
 * e sostituite con simulazioni per il frontend standalone.
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     UTILITY
     ---------------------------------------------------------- */

  function $(id) { return document.getElementById(id); }
  function $$(sel) { return document.querySelectorAll(sel); }

  function showErr(el, msg) {
    el.classList.add('form-input--error');
    el.classList.remove('form-input--success');
    let box = el.closest('.form-group').querySelector('.form-error');
    if (!box) {
      box = document.createElement('div');
      box.className = 'form-error';
      el.after(box);
    }
    box.innerHTML = '⚠ ' + msg;
  }

  function showOk(el) {
    el.classList.remove('form-input--error');
    el.classList.add('form-input--success');
    const box = el.closest('.form-group').querySelector('.form-error');
    if (box) box.remove();
  }

  function clearField(el) {
    el.classList.remove('form-input--error', 'form-input--success');
    const box = el.closest('.form-group')?.querySelector('.form-error');
    if (box) box.remove();
  }

  function isEmail(v)  { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function isPhone(v)  { return /^[\d\s\+\-\(\)]{8,}$/.test(v); }
  function isCAP(v)    { return /^\d{5}$/.test(v); }

  function setLoading(btn, on) {
    btn.disabled = on;
    btn.classList.toggle('is-loading', on);
  }

  /* ----------------------------------------------------------
     CAP ↔ CITTÀ AUTOCOMPLETE
     Mappa locale — in produzione: GET /api/geo/?cap=<val>
     ---------------------------------------------------------- */

  const CAP_DB = {
    '27100': 'Pavia',      '27010': 'Pavia',
    '27029': 'Vigevano',   '27058': 'Voghera',
    '27050': 'Mortara',    '27045': 'Stradella',
    '27020': 'San Genesio ed Uniti',
    '27028': 'San Martino Siccomario',
    '20100': 'Milano',     '20121': 'Milano',
    '20122': 'Milano',     '20900': 'Monza',
  };

  const CITTA_DB = {};
  Object.entries(CAP_DB).forEach(function ([cap, citta]) {
    const key = citta.toLowerCase();
    if (!CITTA_DB[key]) CITTA_DB[key] = cap;
  });

  function initCapCitta() {
    const capEl    = $('reg-cap');
    const cittaEl  = $('reg-citta');
    const autoBadge = $('citta-auto-badge');
    if (!capEl || !cittaEl) return;

    capEl.addEventListener('input', function () {
      const v = capEl.value.trim();
      if (isCAP(v) && CAP_DB[v]) {
        cittaEl.value = CAP_DB[v];
        if (autoBadge) autoBadge.style.display = 'inline';
        showOk(cittaEl);
      } else {
        if (autoBadge) autoBadge.style.display = 'none';
      }
    });

    cittaEl.addEventListener('input', function () {
      if (autoBadge) autoBadge.style.display = 'none';
      const key = cittaEl.value.trim().toLowerCase();
      if (CITTA_DB[key]) {
        capEl.value = CITTA_DB[key];
        showOk(capEl);
      }
    });
  }

  /* ----------------------------------------------------------
     INDICATORE FORZA PASSWORD
     ---------------------------------------------------------- */

  function passwordStrength(v) {
    let s = 0;
    if (v.length >= 8)         s++;
    if (v.length >= 12)        s++;
    if (/[A-Z]/.test(v))       s++;
    if (/[0-9]/.test(v))       s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    if (s <= 1) return { cls: 'weak',   label: 'Sicurezza password: Debole' };
    if (s <= 3) return { cls: 'medium', label: 'Sicurezza password: Buona' };
    return             { cls: 'strong', label: 'Sicurezza password: Ottima' };
  }

  function initPasswordUI() {
    const pwdEl    = $('reg-password');
    const bar      = $('pwd-strength-bar');
    const barLabel = $('pwd-strength-label');
    const confirm  = $('reg-password-confirm');
    const matchMsg = $('pwd-match-msg');
    if (!pwdEl) return;

    pwdEl.addEventListener('input', function () {
      const r = passwordStrength(pwdEl.value);
      if (bar) {
        bar.className = 'password-strength__fill password-strength__fill--' + r.cls;
      }
      if (barLabel) barLabel.textContent = pwdEl.value ? r.label : '';
      // Ri-verifica conferma
      if (confirm && confirm.value) checkConfirm();
    });

    function checkConfirm() {
      if (!confirm.value) return;
      if (confirm.value === pwdEl.value) {
        if (matchMsg) { matchMsg.textContent = '✓ Le password coincidono'; matchMsg.style.color = 'var(--color-success)'; }
        showOk(confirm);
      } else {
        if (matchMsg) matchMsg.textContent = '';
        clearField(confirm);
      }
    }

    if (confirm) confirm.addEventListener('input', checkConfirm);
  }

  /* ----------------------------------------------------------
     VALIDAZIONE STEP 1
     ---------------------------------------------------------- */

  function validateStep1() {
    const rules = [
      { id: 'reg-nome',             fn: function(v){ return v.length >= 2; },    msg: 'Inserisci il nome (minimo 2 caratteri)' },
      { id: 'reg-cognome',          fn: function(v){ return v.length >= 2; },    msg: 'Inserisci il cognome (minimo 2 caratteri)' },
      { id: 'reg-email',            fn: isEmail,                                 msg: 'Inserisci un indirizzo email valido' },
      { id: 'reg-via',              fn: function(v){ return v.length >= 5; },    msg: 'Inserisci via e numero civico' },
      { id: 'reg-cap',              fn: isCAP,                                   msg: 'CAP non valido (5 cifre numeriche)' },
      { id: 'reg-citta',            fn: function(v){ return v.length >= 2; },    msg: 'Inserisci la città' },
      { id: 'reg-telefono',         fn: isPhone,                                 msg: 'Numero di cellulare non valido' },
      { id: 'reg-password',         fn: function(v){ return v.length >= 8; },    msg: 'La password deve avere almeno 8 caratteri' },
      {
        id: 'reg-password-confirm',
        fn: function(v) { return v === $('reg-password').value; },
        msg: 'Le password non coincidono'
      },
    ];

    let valid = true;
    rules.forEach(function (r) {
      const el = $(r.id);
      if (!el) return;
      const v = el.value.trim();
      if (!v || !r.fn(v)) { showErr(el, r.msg); valid = false; }
      else showOk(el);
    });
    return valid;
  }

  /* ----------------------------------------------------------
     STEPPER — cambia step visibile
     ---------------------------------------------------------- */

  function goToStep(step) {
    // Pannelli
    document.querySelectorAll('[data-step]').forEach(function (el) {
      el.style.display = el.dataset.step === String(step) ? 'block' : 'none';
    });

    // Indicatori step
    document.querySelectorAll('[data-step-indicator]').forEach(function (el) {
      const s = parseInt(el.dataset.stepIndicator);
      el.classList.remove('stepper__step--todo', 'stepper__step--active', 'stepper__step--done');
      const circle = el.querySelector('.stepper__circle');
      if (s < step)  {
        el.classList.add('stepper__step--done');
        if (circle) circle.textContent = '✓';
      } else if (s === step) {
        el.classList.add('stepper__step--active');
        if (circle) circle.textContent = String(s);
      } else {
        el.classList.add('stepper__step--todo');
        if (circle) circle.textContent = String(s);
      }
    });
  }

  /* ----------------------------------------------------------
     OTP INPUTS — navigazione automatica
     ---------------------------------------------------------- */

  function initOTP() {
    const inputs = Array.from($$('.otp-input'));
    if (!inputs.length) return;

    inputs.forEach(function (inp, i) {
      inp.addEventListener('input', function () {
        inp.value = inp.value.replace(/\D/g, '').slice(-1);
        inp.classList.toggle('is-filled', !!inp.value);
        if (inp.value && i < inputs.length - 1) inputs[i + 1].focus();
      });

      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !inp.value && i > 0) {
          inputs[i - 1].value = '';
          inputs[i - 1].classList.remove('is-filled');
          inputs[i - 1].focus();
        }
      });
    });

    // Incolla codice intero
    inputs[0].addEventListener('paste', function (e) {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData)
        .getData('text').replace(/\D/g, '').slice(0, 6);
      text.split('').forEach(function (ch, i) {
        if (inputs[i]) { inputs[i].value = ch; inputs[i].classList.add('is-filled'); }
      });
      const next = inputs.findIndex(function(inp){ return !inp.value; });
      (next !== -1 ? inputs[next] : inputs[inputs.length - 1]).focus();
    });
  }

  /* ----------------------------------------------------------
     OTP — countdown reinvio (60s)
     ---------------------------------------------------------- */

  function startResendCountdown() {
    const btn = $('otp-resend-btn');
    if (!btn) return;

    let sec = 60;
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.5';

    const timer = setInterval(function () {
      sec--;
      btn.textContent = 'Reinvia email (' + sec + 's)';
      if (sec <= 0) {
        clearInterval(timer);
        btn.textContent = 'Reinvia email';
        btn.style.pointerEvents = '';
        btn.style.opacity = '';
      }
    }, 1000);
  }

  /* ----------------------------------------------------------
     INIT PRINCIPALE
     ---------------------------------------------------------- */

  document.addEventListener('DOMContentLoaded', function () {

    initCapCitta();
    initPasswordUI();
    initOTP();
    goToStep(1);

    /* ---------- Pulsante AVANTI (step 1 → 2) ---------- */
    const btnNext = $('reg-btn-next');
    if (btnNext) {
      btnNext.addEventListener('click', async function () {
        if (!validateStep1()) return;

        setLoading(btnNext, true);
        try {
          /* === PRODUZIONE ===
          const res = await fetch('/api/auth/?action=register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nome:      $('reg-nome').value.trim(),
              cognome:   $('reg-cognome').value.trim(),
              email:     $('reg-email').value.trim(),
              password:  $('reg-password').value,
              via_civico: $('reg-via').value.trim(),
              cap:       $('reg-cap').value.trim(),
              citta:     $('reg-citta').value.trim(),
              cellulare: $('reg-telefono').value.trim(),
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Errore durante la registrazione');
          */

          // === DEMO: simula risposta server (1s) ===
          await new Promise(function(r) { setTimeout(r, 900); });

          // Mostra email nel pannello OTP
          const emailLabel = $('otp-email-label');
          if (emailLabel) emailLabel.textContent = $('reg-email').value.trim();

          goToStep(2);
          startResendCountdown();

          // Focus prima cella
          const firstOtp = document.querySelector('.otp-input');
          if (firstOtp) setTimeout(function(){ firstOtp.focus(); }, 100);

        } catch (err) {
          const alert = $('reg-alert');
          if (alert) { alert.textContent = '⚠ ' + err.message; alert.style.display = 'flex'; }
        } finally {
          setLoading(btnNext, false);
        }
      });
    }

    /* ---------- Pulsante VERIFICA OTP (step 2 → 3) ---------- */
    const btnVerify = $('reg-btn-verify');
    if (btnVerify) {
      btnVerify.addEventListener('click', async function () {
        const otp = Array.from($$('.otp-input')).map(function(i){ return i.value; }).join('');
        const errEl = $('otp-error');

        if (otp.length < 6) {
          if (errEl) { errEl.textContent = '⚠ Inserisci il codice completo a 6 cifre'; errEl.style.display = 'flex'; }
          return;
        }
        if (errEl) errEl.style.display = 'none';

        setLoading(btnVerify, true);
        try {
          /* === PRODUZIONE ===
          const res = await fetch('/api/auth/?action=verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: $('reg-email').value.trim(), otp }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Codice non valido o scaduto');
          localStorage.setItem('jwt', data.token);
          */

          // === DEMO ===
          await new Promise(function(r) { setTimeout(r, 800); });

          // Compila schermata completato
          const successEmail = $('success-email');
          if (successEmail) successEmail.textContent = $('reg-email').value.trim();

          goToStep(3);

        } catch (err) {
          if (errEl) { errEl.textContent = '⚠ ' + err.message; errEl.style.display = 'flex'; }
        } finally {
          setLoading(btnVerify, false);
        }
      });
    }

    /* ---------- Torna indietro da OTP ---------- */
    const btnBack = $('otp-back-btn');
    if (btnBack) {
      btnBack.addEventListener('click', function () { goToStep(1); });
    }

    /* ---------- Reinvia OTP ---------- */
    const btnResend = $('otp-resend-btn');
    if (btnResend) {
      btnResend.addEventListener('click', async function (e) {
        e.preventDefault();
        try {
          /* === PRODUZIONE ===
          await fetch('/api/auth/?action=resend_otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: $('reg-email').value.trim() }),
          });
          */
          await new Promise(function(r){ setTimeout(r, 500); });
          startResendCountdown();
          // Svuota celle
          $$('.otp-input').forEach(function(inp){ inp.value = ''; inp.classList.remove('is-filled'); });
          $$('.otp-input')[0].focus();
        } catch (_) {}
      });
    }

    /* ---------- Vai all'area personale ---------- */
    const btnDone = $('reg-btn-done');
    if (btnDone) {
      btnDone.addEventListener('click', function () {
        window.location.href = 'area-personale.html';
      });
    }

    /* ---------- Blur validation sui campi ---------- */
    const blurRules = [
      { id: 'reg-nome',     fn: function(v){ return v.length >= 2; },  msg: 'Inserisci il nome' },
      { id: 'reg-cognome',  fn: function(v){ return v.length >= 2; },  msg: 'Inserisci il cognome' },
      { id: 'reg-email',    fn: isEmail,                               msg: 'Email non valida' },
      { id: 'reg-via',      fn: function(v){ return v.length >= 5; },  msg: 'Inserisci via e numero civico' },
      { id: 'reg-cap',      fn: isCAP,                                 msg: 'CAP non valido (5 cifre)' },
      { id: 'reg-citta',    fn: function(v){ return v.length >= 2; },  msg: 'Inserisci la città' },
      { id: 'reg-telefono', fn: isPhone,                               msg: 'Numero non valido' },
      { id: 'reg-password', fn: function(v){ return v.length >= 8; },  msg: 'Minimo 8 caratteri' },
    ];

    blurRules.forEach(function (r) {
      const el = $(r.id);
      if (!el) return;
      el.addEventListener('blur', function () {
        const v = el.value.trim();
        if (!v) { clearField(el); return; }
        if (!r.fn(v)) showErr(el, r.msg);
        else showOk(el);
      });
    });

  });

})();
