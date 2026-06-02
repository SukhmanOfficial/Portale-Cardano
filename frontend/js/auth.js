/**
 * auth.js — Login e Registrazione Genitore
 * Sistema Cardano Day · ITIS G. Cardano, Pavia
 *
 * Gestisce:
 *  - Login: validazione, toggle password, submit → POST /api/auth/?action=login
 *  - Registrazione: stepper 3 passi, validazione campi, CAP↔Città auto
 *  - OTP: 6 celle, focus automatico, invio → POST /api/auth/?action=verify
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     UTILITY
     ---------------------------------------------------------- */

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return (ctx || document).querySelectorAll(sel); }

  function showError(inputEl, msg) {
    inputEl.classList.add('form-input--error');
    inputEl.classList.remove('form-input--success');
    let err = inputEl.parentElement.querySelector('.form-error');
    if (!err) {
      err = document.createElement('div');
      err.className = 'form-error';
      inputEl.parentElement.appendChild(err);
    }
    err.innerHTML = '⚠ ' + msg;
  }

  function showSuccess(inputEl) {
    inputEl.classList.remove('form-input--error');
    inputEl.classList.add('form-input--success');
    const err = inputEl.parentElement.querySelector('.form-error');
    if (err) err.remove();
  }

  function clearState(inputEl) {
    inputEl.classList.remove('form-input--error', 'form-input--success');
    const err = inputEl.parentElement.querySelector('.form-error');
    if (err) err.remove();
  }

  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function isValidPhone(v) {
    return /^[\d\s\+\-\(\)]{8,15}$/.test(v.replace(/\s/g, ''));
  }

  function setLoading(btn, loading) {
    btn.disabled = loading;
    btn.classList.toggle('is-loading', loading);
  }

  /* ----------------------------------------------------------
     TOGGLE PASSWORD VISIBILITY
     Funziona su qualsiasi .form-input-icon[data-toggle-pwd]
     ---------------------------------------------------------- */

  document.addEventListener('click', function (e) {
    const icon = e.target.closest('[data-toggle-pwd]');
    if (!icon) return;
    const targetId = icon.dataset.togglePwd;
    const input = document.getElementById(targetId);
    if (!input) return;
    const isText = input.type === 'text';
    input.type = isText ? 'password' : 'text';
    icon.textContent = isText ? '👁' : '🙈';
  });

  /* ----------------------------------------------------------
     INDICATORE FORZA PASSWORD
     ---------------------------------------------------------- */

  function checkPasswordStrength(val) {
    let score = 0;
    if (val.length >= 8)  score++;
    if (val.length >= 12) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    if (score <= 1) return { level: 'weak',   label: 'Sicurezza password: Debole' };
    if (score <= 3) return { level: 'medium', label: 'Sicurezza password: Buona' };
    return                { level: 'strong', label: 'Sicurezza password: Ottima' };
  }

  function initPasswordStrength(inputId, barId, labelId) {
    const input = document.getElementById(inputId);
    const bar   = document.getElementById(barId);
    const label = document.getElementById(labelId);
    if (!input || !bar || !label) return;

    input.addEventListener('input', function () {
      const result = checkPasswordStrength(input.value);
      bar.className = 'password-strength__fill password-strength__fill--' + result.level;
      label.textContent = result.label;
    });
  }

  /* ----------------------------------------------------------
     AUTO CAP ↔ CITTÀ
     ---------------------------------------------------------- */

  // Mappa semplificata CAP → Città (province Lombardia)
  // In produzione: chiamata API /api/geo/?cap=<valore>
  const CAP_MAP = {
    '27100': 'Pavia',    '27010': 'Pavia',    '27020': 'Pavia',
    '27028': 'San Martino Siccomario',
    '27029': 'Vigevano', '27058': 'Voghera',
    '20100': 'Milano',   '20121': 'Milano',
    '27050': 'Mortara',  '27045': 'Stradella',
  };

  const CITTA_MAP = {};
  Object.entries(CAP_MAP).forEach(function ([cap, citta]) {
    if (!CITTA_MAP[citta.toLowerCase()]) CITTA_MAP[citta.toLowerCase()] = cap;
  });

  function initCapCittaAuto(capId, cittaId) {
    const capInput   = document.getElementById(capId);
    const cittaInput = document.getElementById(cittaId);
    if (!capInput || !cittaInput) return;

    capInput.addEventListener('input', function () {
      const val = capInput.value.trim();
      if (val.length === 5 && CAP_MAP[val]) {
        cittaInput.value = CAP_MAP[val];
        cittaInput.dispatchEvent(new Event('input'));
      }
    });

    cittaInput.addEventListener('input', function () {
      const val = cittaInput.value.trim().toLowerCase();
      if (CITTA_MAP[val]) {
        capInput.value = CITTA_MAP[val];
      }
    });
  }

  /* ----------------------------------------------------------
     LOGIN
     ---------------------------------------------------------- */

  function initLogin() {
    const form     = document.getElementById('login-form');
    if (!form) return;

    const emailInput = document.getElementById('login-email');
    const pwdInput   = document.getElementById('login-password');
    const alertBox   = document.getElementById('login-alert');
    const submitBtn  = document.getElementById('login-submit');

    // Validazione blur
    emailInput.addEventListener('blur', function () {
      if (!emailInput.value) return clearState(emailInput);
      if (!isValidEmail(emailInput.value)) {
        showError(emailInput, 'Inserisci un indirizzo email valido');
      } else {
        showSuccess(emailInput);
      }
    });

    pwdInput.addEventListener('blur', function () {
      if (!pwdInput.value) return clearState(pwdInput);
      if (pwdInput.value.length < 8) {
        showError(pwdInput, 'La password deve essere di almeno 8 caratteri');
      } else {
        showSuccess(pwdInput);
      }
    });

    // Submit
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const email    = emailInput.value.trim();
      const password = pwdInput.value;
      let valid = true;

      if (!email || !isValidEmail(email)) {
        showError(emailInput, 'Email non valida'); valid = false;
      }
      if (!password || password.length < 8) {
        showError(pwdInput, 'Password non valida'); valid = false;
      }
      if (!valid) return;

      // Nascondi alert precedenti
      alertBox.style.display = 'none';
      setLoading(submitBtn, true);

      try {
        /* === PRODUZIONE ===
        const res  = await fetch('/api/auth/?action=login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Credenziali errate');
        localStorage.setItem('jwt', data.token);
        const redirect = new URLSearchParams(location.search).get('redirect') || '/area-personale.html';
        window.location.href = redirect;
        */

        // === DEMO: simula errore dopo 1s ===
        await new Promise(function(r) { setTimeout(r, 1000); });
        throw new Error('Email o password non corretti. Riprova.');

      } catch (err) {
        alertBox.textContent = '⚠ ' + err.message;
        alertBox.style.display = 'flex';
      } finally {
        setLoading(submitBtn, false);
      }
    });
  }

  /* ----------------------------------------------------------
     REGISTRAZIONE — Stepper 3 step
     ---------------------------------------------------------- */

  var currentStep = 1;

  function goToStep(step) {
    // Nasconde tutti i pannelli
    $$('[data-step]').forEach(function (el) {
      el.style.display = 'none';
    });
    // Mostra il pannello corrente
    const panel = $('[data-step="' + step + '"]');
    if (panel) panel.style.display = 'block';

    // Aggiorna stepper UI
    $$('.stepper__step').forEach(function (el, idx) {
      const s = idx + 1;
      el.classList.remove('stepper__step--todo', 'stepper__step--active', 'stepper__step--done');
      if (s < step)       el.classList.add('stepper__step--done');
      else if (s === step) el.classList.add('stepper__step--active');
      else                el.classList.add('stepper__step--todo');
    });

    currentStep = step;
  }

  function validateStep1() {
    const fields = [
      { id: 'reg-nome',     check: function(v) { return v.length >= 2; }, msg: 'Inserisci il nome' },
      { id: 'reg-cognome',  check: function(v) { return v.length >= 2; }, msg: 'Inserisci il cognome' },
      { id: 'reg-email',    check: isValidEmail,                          msg: 'Email non valida' },
      { id: 'reg-via',      check: function(v) { return v.length >= 3; }, msg: 'Inserisci via e numero civico' },
      { id: 'reg-cap',      check: function(v) { return /^\d{5}$/.test(v); }, msg: 'CAP non valido (5 cifre)' },
      { id: 'reg-citta',    check: function(v) { return v.length >= 2; }, msg: 'Inserisci la città' },
      { id: 'reg-telefono', check: isValidPhone,                          msg: 'Numero non valido' },
      { id: 'reg-password', check: function(v) { return v.length >= 8; }, msg: 'Minimo 8 caratteri' },
      {
        id: 'reg-password-confirm',
        check: function(v) {
          return v === document.getElementById('reg-password').value;
        },
        msg: 'Le password non coincidono'
      },
    ];

    let valid = true;
    fields.forEach(function (f) {
      const el = document.getElementById(f.id);
      if (!el) return;
      const val = el.value.trim();
      if (!val || !f.check(val)) {
        showError(el, f.msg);
        valid = false;
      } else {
        showSuccess(el);
      }
    });

    return valid;
  }

  function initRegistrazione() {
    const form = document.getElementById('reg-form');
    if (!form) return;

    // CAP ↔ Città auto
    initCapCittaAuto('reg-cap', 'reg-citta');

    // Forza password
    initPasswordStrength('reg-password', 'pwd-strength-bar', 'pwd-strength-label');

    // Conferma password: verifica in tempo reale
    const pwdConfirm = document.getElementById('reg-password-confirm');
    const pwdMain    = document.getElementById('reg-password');
    if (pwdConfirm && pwdMain) {
      pwdConfirm.addEventListener('input', function () {
        const match = document.getElementById('pwd-match-msg');
        if (pwdConfirm.value === pwdMain.value && pwdConfirm.value) {
          if (match) match.textContent = '✓ Le password coincidono';
          if (match) match.style.color = 'var(--color-success)';
          showSuccess(pwdConfirm);
        } else if (pwdConfirm.value) {
          if (match) match.textContent = '';
          clearState(pwdConfirm);
        }
      });
    }

    // Pulsante avanti Step 1 → Step 2
    const btnNext = document.getElementById('reg-btn-next');
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
              nome:     document.getElementById('reg-nome').value.trim(),
              cognome:  document.getElementById('reg-cognome').value.trim(),
              email:    document.getElementById('reg-email').value.trim(),
              password: document.getElementById('reg-password').value,
              via_civico: document.getElementById('reg-via').value.trim(),
              cap:      document.getElementById('reg-cap').value.trim(),
              citta:    document.getElementById('reg-citta').value.trim(),
              cellulare: document.getElementById('reg-telefono').value.trim(),
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Errore registrazione');
          */

          // === DEMO ===
          await new Promise(function(r) { setTimeout(r, 800); });

          // Mostra email nel pannello OTP
          const emailLabel = document.getElementById('otp-email-label');
          if (emailLabel) {
            emailLabel.textContent = document.getElementById('reg-email').value.trim();
          }

          goToStep(2);
          // Focus prima cella OTP
          const firstOtp = document.querySelector('.otp-input');
          if (firstOtp) firstOtp.focus();

        } catch (err) {
          const alertBox = document.getElementById('reg-alert');
          if (alertBox) {
            alertBox.textContent = '⚠ ' + err.message;
            alertBox.style.display = 'flex';
          }
        } finally {
          setLoading(btnNext, false);
        }
      });
    }

    // Submit OTP
    const btnVerify = document.getElementById('reg-btn-verify');
    if (btnVerify) {
      btnVerify.addEventListener('click', async function () {
        const otp = Array.from($$('.otp-input')).map(function(i) { return i.value; }).join('');
        if (otp.length < 6) {
          const err = document.getElementById('otp-error');
          if (err) { err.textContent = '⚠ Inserisci il codice completo a 6 cifre'; err.style.display = 'flex'; }
          return;
        }

        setLoading(btnVerify, true);
        try {
          /* === PRODUZIONE ===
          const res = await fetch('/api/auth/?action=verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: document.getElementById('reg-email').value.trim(), otp }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Codice non valido');
          localStorage.setItem('jwt', data.token);
          */

          // === DEMO ===
          await new Promise(function(r) { setTimeout(r, 800); });

          goToStep(3);

        } catch (err) {
          const errEl = document.getElementById('otp-error');
          if (errEl) { errEl.textContent = '⚠ ' + err.message; errEl.style.display = 'flex'; }
        } finally {
          setLoading(btnVerify, false);
        }
      });
    }

    // Vai all'area personale
    const btnDone = document.getElementById('reg-btn-done');
    if (btnDone) {
      btnDone.addEventListener('click', function () {
        window.location.href = 'area-personale.html';
      });
    }

    // Init primo step
    goToStep(1);
  }

  /* ----------------------------------------------------------
     OTP INPUT — navigazione automatica tra celle
     ---------------------------------------------------------- */

  function initOtpInputs() {
    const inputs = Array.from($$('.otp-input'));
    if (!inputs.length) return;

    inputs.forEach(function (input, idx) {
      input.addEventListener('input', function () {
        // Accetta solo cifre
        input.value = input.value.replace(/\D/g, '').slice(-1);
        input.classList.toggle('is-filled', !!input.value);
        // Avanza al prossimo
        if (input.value && idx < inputs.length - 1) {
          inputs[idx + 1].focus();
        }
      });

      input.addEventListener('keydown', function (e) {
        // Backspace: torna indietro
        if (e.key === 'Backspace' && !input.value && idx > 0) {
          inputs[idx - 1].focus();
          inputs[idx - 1].value = '';
          inputs[idx - 1].classList.remove('is-filled');
        }
        // Incolla (paste)
        if (e.key === 'v' && (e.ctrlKey || e.metaKey)) return;
      });
    });

    // Gestione incolla
    inputs[0].addEventListener('paste', function (e) {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData)
        .getData('text').replace(/\D/g, '').slice(0, 6);
      text.split('').forEach(function (char, i) {
        if (inputs[i]) {
          inputs[i].value = char;
          inputs[i].classList.add('is-filled');
        }
      });
      const nextEmpty = inputs.findIndex(function(inp) { return !inp.value; });
      if (nextEmpty !== -1) inputs[nextEmpty].focus();
      else inputs[inputs.length - 1].focus();
    });
  }

  /* ----------------------------------------------------------
     INIT GLOBALE
     ---------------------------------------------------------- */

  document.addEventListener('DOMContentLoaded', function () {
    initLogin();
    initRegistrazione();
    initOtpInputs();
  });

})();
