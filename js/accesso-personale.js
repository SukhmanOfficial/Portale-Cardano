/**
 * accesso-personale.js — Login personale scolastico
 * Sistema Cardano Day · ITIS G. Cardano, Pavia
 *
 * Gestisce:
 *  - Login con email istituzionale + password
 *  - Redirect in base al ruolo (staff → scanner, segreteria → dashboard, admin → admin)
 *  - Link a registrazione staff
 *  - Recupero password
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     UTILITY
     ---------------------------------------------------------- */

  function $(id) { return document.getElementById(id); }

  function setLoading(btn, on) {
    btn.disabled = on;
    btn.classList.toggle('is-loading', on);
  }

  function showAlert(id, msg) {
    const el = $(id);
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'flex';
  }

  function hideAlert(id) {
    const el = $(id);
    if (el) el.style.display = 'none';
  }

  /* ----------------------------------------------------------
     TOGGLE PASSWORD
     ---------------------------------------------------------- */

  document.addEventListener('click', function (e) {
    const icon = e.target.closest('[data-toggle-pwd]');
    if (!icon) return;
    const input = document.getElementById(icon.dataset.togglePwd);
    if (!input) return;
    input.type = input.type === 'text' ? 'password' : 'text';
    icon.textContent = input.type === 'text' ? '🙈' : '👁';
  });

  /* ----------------------------------------------------------
     LOGIN FORM
     ---------------------------------------------------------- */

  function initLogin() {
    const form = $('login-form');
    if (!form) return;

    const emailInput = $('login-email');
    const pwdInput   = $('login-password');
    const submitBtn  = $('login-submit');

    // Blur validation
    if (emailInput) {
      emailInput.addEventListener('blur', function () {
        const v = emailInput.value.trim();
        if (!v) return;
        if (!v.includes('@itiscardanopv.edu.it') && !v.includes('@')) {
          emailInput.classList.add('staff-form-input--error');
        } else {
          emailInput.classList.remove('staff-form-input--error');
        }
      });
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      hideAlert('login-alert');

      const email    = emailInput ? emailInput.value.trim() : '';
      const password = pwdInput   ? pwdInput.value : '';

      if (!email || !password) {
        showAlert('login-alert', '⚠ Inserisci email e password');
        return;
      }

      setLoading(submitBtn, true);

      try {
        

        // Chiamata API reale
        await API.auth.login(email, password);
        throw new Error('Credenziali non valide. Riprova.');

      } catch (err) {
        showAlert('login-alert', '⚠ ' + err.message);
      } finally {
        setLoading(submitBtn, false);
      }
    });
  }

  /* ----------------------------------------------------------
     INIT
     ---------------------------------------------------------- */

  document.addEventListener('DOMContentLoaded', function () {
    initLogin();
  });

})();
