/**
 * auth.js — Login genitore + reset password
 * Sistema Cardano Day · ITIS "G. Cardano", Pavia
 * Collegato a API.auth.*
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     TOGGLE PASSWORD VISIBILITÀ
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
     MOSTRA ERRORE
     ---------------------------------------------------------- */
  function showAlert(msg) {
    var el = document.getElementById('login-alert');
    if (!el) return;
    el.innerHTML = '<span style="font-size:1.1rem;flex-shrink:0;">⚠️</span><span>' + msg + '</span>';
    el.style.display = 'flex';
    // Animazione shake
    el.style.animation = 'none';
    el.offsetHeight; // reflow
    el.style.animation = 'shake .4s ease';
  }

  function hideAlert() {
    var el = document.getElementById('login-alert');
    if (el) el.style.display = 'none';
  }

  function setLoading(btn, on) {
    if (!btn) return;
    btn.disabled = on;
    btn.classList.toggle('is-loading', on);
  }

  /* ----------------------------------------------------------
     FORM LOGIN GENITORE
     ---------------------------------------------------------- */
  var loginForm = document.getElementById('login-form');
  if (loginForm) {
    // Se già loggato come genitore → vai ad area personale
    if (API.auth.isLoggedIn()) {
      var u = API.auth.getUser();
      if (u && u.ruolo === 'genitore') {
        window.location.href = 'area-personale.html';
      }
    }

    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      hideAlert();

      var email    = document.getElementById('login-email')?.value.trim() || '';
      var password = document.getElementById('login-password')?.value || '';
      var btn      = document.getElementById('login-submit');

      if (!email || !password) { showAlert('Inserisci email e password'); return; }

      setLoading(btn, true);
      try {
        var data = await API.auth.login(email, password);
        // Redirect in base al ruolo
        var ruolo = data.user.ruolo;
        if (ruolo === 'genitore') {
          window.location.href = 'area-personale.html';
        } else if (ruolo === 'segreteria') {
          window.location.href = 'segreteria.html';
        } else if (ruolo === 'admin') {
          window.location.href = 'admin.html';
        } else {
          window.location.href = 'scanner.html';
        }
      } catch (err) {
        var msg = err.message || '';
        if (msg.includes('password') || msg.includes('credenziali') || msg.includes('non valide') || msg.includes('not found') || msg.includes('401') || msg === 'Errore interno') {
          showAlert('Email o password non corrette. Riprova.');
        } else if (msg.includes('verificat') || msg.includes('OTP') || msg.includes('non_verificato')) {
          showAlert('Account non verificato. Controlla la tua email e inserisci il codice OTP.');
        } else if (msg.includes('sospeso')) {
          showAlert('Account sospeso. Contatta la segreteria.');
        } else if (msg.includes('attesa') || msg.includes('approv')) {
          showAlert('Account in attesa di approvazione dalla segreteria.');
        } else if (msg.includes('rete') || msg.includes('network') || msg.includes('fetch')) {
          showAlert('Errore di connessione. Controlla la tua rete e riprova.');
        } else {
          showAlert('Email o password non corrette. Riprova.');
        }
        setLoading(btn, false);
      }
    });
  }

  /* ----------------------------------------------------------
     FORM LOGIN STAFF (accesso-personale.html)
     ---------------------------------------------------------- */
  var loginFormStaff = document.getElementById('login-form');
  var isStaffPage = window.location.pathname.includes('accesso-personale');
  if (loginFormStaff && isStaffPage) {
    if (API.auth.isLoggedIn()) {
      var u2 = API.auth.getUser();
      if (u2 && ['staff','professore','segreteria','admin'].includes(u2.ruolo)) {
        redirectByRuolo(u2.ruolo);
      }
    }
  }

  function redirectByRuolo(ruolo) {
    if (ruolo === 'segreteria') window.location.href = 'segreteria.html';
    else if (ruolo === 'admin') window.location.href = 'admin.html';
    else window.location.href = 'scanner.html';
  }

  /* ----------------------------------------------------------
     RESET PASSWORD (link "Password dimenticata?")
     ---------------------------------------------------------- */
  document.querySelectorAll('[href="#forgot"]').forEach(function (link) {
    link.addEventListener('click', async function (e) {
      e.preventDefault();
      var email = prompt('Inserisci la tua email per ricevere il link di reset:');
      if (!email) return;
      try {
        await API.auth.resetRequest(email.trim());
        alert('Se l\'email è registrata, riceverai le istruzioni entro pochi minuti.');
      } catch (err) {
        alert('Errore: ' + err.message);
      }
    });
  });

})();
