/**
 * accesso-personale.js — Login personale scolastico
 * Sistema Cardano Day · ITIS G. Cardano, Pavia
 */

(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function setLoading(btn, on) {
    btn.disabled = on;
    btn.textContent = on ? 'Accesso in corso...' : 'ACCEDI AL PANNELLO';
  }

  function showAlert(id, msg) {
    var el = $(id);
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'flex';
  }

  function hideAlert(id) {
    var el = $(id);
    if (el) el.style.display = 'none';
  }

  /* Toggle password */
  document.addEventListener('click', function (e) {
    var icon = e.target.closest('[data-toggle-pwd]');
    if (!icon) return;
    var input = document.getElementById(icon.dataset.togglePwd);
    if (!input) return;
    input.type = input.type === 'text' ? 'password' : 'text';
    icon.textContent = input.type === 'text' ? '🙈' : '👁';
  });

  function initLogin() {
    var form      = $('login-form');
    if (!form) return;

    var emailInput = $('login-email');
    var pwdInput   = $('login-password');
    var submitBtn  = $('login-submit');

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      hideAlert('login-alert');

      var email    = emailInput ? emailInput.value.trim() : '';
      var password = pwdInput   ? pwdInput.value : '';

      if (!email || !password) {
        showAlert('login-alert', '⚠ Inserisci email e password');
        return;
      }

      setLoading(submitBtn, true);

      try {
        var data = await API.auth.login(email, password);
        var ruolo = data.user ? data.user.ruolo : '';

        // Redirect in base al ruolo
        if (ruolo === 'admin') {
          window.location.href = 'admin.html';
        } else if (ruolo === 'segreteria') {
          window.location.href = 'segreteria.html';
        } else if (ruolo === 'staff' || ruolo === 'professore') {
          window.location.href = 'scanner.html';
        } else {
          showAlert('login-alert', '⚠ Ruolo non autorizzato: ' + ruolo);
          setLoading(submitBtn, false);
        }
      } catch (err) {
        showAlert('login-alert', '⚠ ' + err.message);
        setLoading(submitBtn, false);
      }
    });
  }

  // Init immediato (script in fondo al body, DOM già pronto)
  // Se già loggato redirect automatico
    var user = API.auth.getUser();
    if (user && API.auth.isLoggedIn()) {
      if (user.ruolo === 'admin') window.location.href = 'admin.html';
      else if (user.ruolo === 'segreteria') window.location.href = 'segreteria.html';
      else if (user.ruolo === 'staff' || user.ruolo === 'professore') window.location.href = 'scanner.html';
    }
    initLogin();

})();
