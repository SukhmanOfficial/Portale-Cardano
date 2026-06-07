/**
 * registrazione.js — Registrazione genitore 3 step
 * Sistema Cardano Day · ITIS "G. Cardano", Pavia
 * Step 1: Dati → Step 2: OTP → Step 3: Completato
 */

(function () {
  'use strict';

  var currentStep = 1;
  var registeredEmail = '';
  var registeredNome  = '';

  /* ----------------------------------------------------------
     UTILITY
     ---------------------------------------------------------- */
  function $(id) { return document.getElementById(id); }

  function showStep(n) {
    document.querySelectorAll('[data-step]').forEach(function (el) {
      el.style.display = parseInt(el.dataset.step) === n ? 'block' : 'none';
    });
    currentStep = n;
    // Aggiorna stepper
    document.querySelectorAll('[data-step-indicator]').forEach(function (el) {
      var s = parseInt(el.dataset.stepIndicator);
      el.classList.toggle('stepper__step--active', s === n);
      el.classList.toggle('stepper__step--done',   s < n);
      el.classList.toggle('stepper__step--todo',   s > n);
      var circle = el.querySelector('.stepper__circle');
      if (circle) circle.textContent = s < n ? '✓' : String(s);
    });
  }

  function showAlert(msg) {
    var el = $('reg-alert');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'flex';
  }
  function hideAlert() { var el = $('reg-alert'); if (el) el.style.display = 'none'; }
  function setLoading(btn, on) { if (btn) { btn.disabled = on; btn.classList.toggle('is-loading', on); } }

  /* ----------------------------------------------------------
     TOGGLE PASSWORD
     ---------------------------------------------------------- */
  document.addEventListener('click', function (e) {
    var icon = e.target.closest('[data-toggle-pwd]');
    if (!icon) return;
    var input = document.getElementById(icon.dataset.togglePwd);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
    icon.textContent = input.type === 'password' ? '👁' : '🙈';
  });

  /* ----------------------------------------------------------
     FORZA PASSWORD
     ---------------------------------------------------------- */
  var pwdInput = $('reg-password');
  if (pwdInput) {
    pwdInput.addEventListener('input', function () {
      var val = pwdInput.value;
      var score = 0;
      if (val.length >= 8) score++;
      if (/[A-Z]/.test(val)) score++;
      if (/[0-9]/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;
      var bar   = $('pwd-strength-bar');
      var label = $('pwd-strength-label');
      var pct   = [0,25,50,75,100][score];
      var clr   = ['','#dc2626','#d97706','#2563eb','#16a34a'][score];
      var lbl   = ['','Debole','Discreta','Buona','Ottima'][score];
      if (bar)   { bar.style.width = pct + '%'; bar.style.background = clr; }
      if (label) { label.textContent = lbl; label.style.color = clr; }
    });
  }

  var pwdConfirm = $('reg-password-confirm');
  if (pwdConfirm) {
    pwdConfirm.addEventListener('input', function () {
      var msg = $('pwd-match-msg');
      if (!msg) return;
      if (pwdConfirm.value === pwdInput?.value) {
        msg.textContent = '✓ Password corrispondente'; msg.style.color = 'var(--color-success)';
      } else {
        msg.textContent = '✗ Le password non corrispondono'; msg.style.color = 'var(--color-danger)';
      }
    });
  }

  /* ----------------------------------------------------------
     STEP 1 — INVIA DATI E REGISTRA
     ---------------------------------------------------------- */
  var btnNext = $('reg-btn-next');
  if (btnNext) {
    btnNext.addEventListener('click', async function () {
      hideAlert();
      var nome     = $('reg-nome')?.value.trim()     || '';
      var cognome  = $('reg-cognome')?.value.trim()  || '';
      var email    = $('reg-email')?.value.trim()    || '';
      var via      = $('reg-via')?.value.trim()      || '';
      var cap      = $('reg-cap')?.value.trim()      || '';
      var citta    = $('reg-citta')?.value.trim()    || '';
      var telefono = $('reg-telefono')?.value.trim() || '';
      var password = $('reg-password')?.value        || '';
      var confirm  = $('reg-password-confirm')?.value || '';

      if (!nome || !cognome || !email || !via || !cap || !citta || !telefono || !password)
        return showAlert('Compila tutti i campi obbligatori');
      if (password.length < 8)
        return showAlert('Password troppo corta (min. 8 caratteri)');
      if (password !== confirm)
        return showAlert('Le password non corrispondono');

      setLoading(btnNext, true);
      try {
        await API.auth.register({ nome, cognome, email, password, via, cap, citta, telefono });
        registeredEmail = email;
        registeredNome  = nome;
        var otpLabel = $('otp-email-label');
        if (otpLabel) otpLabel.textContent = email;
        showStep(2);
      } catch (err) {
        showAlert(err.message);
      } finally {
        setLoading(btnNext, false);
      }
    });
  }

  /* ----------------------------------------------------------
     STEP 2 — OTP
     ---------------------------------------------------------- */
  // Gestione input OTP a 6 cifre
  var otpInputs = document.querySelectorAll('.otp-input');
  otpInputs.forEach(function (input, idx) {
    input.addEventListener('input', function () {
      input.value = input.value.replace(/\D/, '');
      if (input.value && idx < otpInputs.length - 1) otpInputs[idx + 1].focus();
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && !input.value && idx > 0) otpInputs[idx - 1].focus();
    });
  });

  // Rinvia OTP
  var btnResend = $('otp-resend-btn');
  if (btnResend) {
    btnResend.addEventListener('click', async function (e) {
      e.preventDefault();
      try {
        await API.auth.resendOtp(registeredEmail);
        alert('Nuovo codice inviato a ' + registeredEmail);
      } catch (err) {
        alert('Errore: ' + err.message);
      }
    });
  }

  // Torna indietro
  var btnOtpBack = $('otp-back-btn');
  if (btnOtpBack) btnOtpBack.addEventListener('click', function () { showStep(1); });

  // Verifica OTP
  var btnVerify = $('reg-btn-verify');
  if (btnVerify) {
    btnVerify.addEventListener('click', async function () {
      var otp = Array.from(otpInputs).map(function (i) { return i.value; }).join('');
      if (otp.length !== 6) {
        var errEl = $('otp-error');
        if (errEl) { errEl.textContent = 'Inserisci tutte le 6 cifre'; errEl.style.display = 'flex'; }
        return;
      }
      setLoading(btnVerify, true);
      try {
        var data = await API.auth.verificaOtp(registeredEmail, otp);
        var successEmail = $('success-email');
        if (successEmail) successEmail.textContent = data.user?.email || registeredEmail;
        showStep(3);
      } catch (err) {
        var errEl2 = $('otp-error');
        if (errEl2) { errEl2.textContent = err.message; errEl2.style.display = 'flex'; }
      } finally {
        setLoading(btnVerify, false);
      }
    });
  }

  /* ----------------------------------------------------------
     STEP 3 — COMPLETATO
     ---------------------------------------------------------- */
  var btnDone = $('reg-btn-done');
  if (btnDone) {
    btnDone.addEventListener('click', function () {
      window.location.href = 'area-personale.html';
    });
  }

  /* ----------------------------------------------------------
     INIT
     ---------------------------------------------------------- */
  showStep(1);

})();
