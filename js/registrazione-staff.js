/**
 * registrazione-staff.js — Richiesta accesso Staff/Professore
 * Sistema Cardano Day · ITIS G. Cardano, Pavia
 *
 * Gestisce:
 *  - Tab Staff / Professore
 *  - Validazione email @itiscardanopv.edu.it
 *  - Indicatore forza password
 *  - Verifica coincidenza password
 *  - Invio richiesta → POST /api/auth/?action=register_personale
 *  - Schermata "Richiesta inviata"
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     UTILITY
     ---------------------------------------------------------- */

  function $(id) { return document.getElementById(id); }
  function $$(sel) { return document.querySelectorAll(sel); }

  const DOMAIN = '@itiscardanopv.edu.it';

  function setLoading(btn, on) {
    btn.disabled = on;
    btn.classList.toggle('is-loading', on);
  }

  /* ----------------------------------------------------------
     TAB Staff / Professore
     ---------------------------------------------------------- */

  let tipoSelezionato = 'staff';

  function initTabs() {
    var tabs = $$('.staff-tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        // Aggiorna classe e stile visivo su tutti i tab
        tabs.forEach(function (t) {
          t.classList.remove('staff-tab--active');
          t.style.background = 'rgba(255,255,255,0.04)';
          t.style.color = 'rgba(255,255,255,0.4)';
        });
        // Attiva tab cliccato
        tab.classList.add('staff-tab--active');
        tab.style.background = 'rgba(255,255,255,0.15)';
        tab.style.color = '#fff';
        tipoSelezionato = tab.dataset.tipo;

        // Aggiorna feedback ruolo
        var feedbackEl = document.getElementById('ruolo-selezionato-feedback');
        if (feedbackEl) {
          feedbackEl.textContent = tipoSelezionato === 'staff'
            ? '🧑‍🏫 Stai richiedendo accesso come Staff'
            : '📚 Stai richiedendo accesso come Professore';
        }
      });
    });
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
     EMAIL ISTITUZIONALE — validazione live
     ---------------------------------------------------------- */

  function initEmailValidation() {
    const usernameEl = $('staff-username');
    const feedbackEl = $('email-feedback');
    const splitEl    = $('email-split');
    if (!usernameEl || !feedbackEl) return;

    usernameEl.addEventListener('input', function () {
      const v = usernameEl.value.trim();
      if (!v) {
        feedbackEl.textContent = '';
        feedbackEl.className = 'staff-email-feedback';
        if (splitEl) splitEl.classList.remove('staff-email-split--success', 'staff-email-split--error');
        return;
      }

      // No spazi, no @, no caratteri speciali strani
      const valid = /^[a-z0-9._\-]+$/i.test(v);
      if (valid && v.length >= 2) {
        feedbackEl.textContent = '✓ Email istituzionale valida';
        feedbackEl.className = 'staff-email-feedback staff-email-feedback--ok';
        if (splitEl) {
          splitEl.classList.add('staff-email-split--success');
          splitEl.classList.remove('staff-email-split--error');
        }
      } else {
        feedbackEl.textContent = '✗ Usa solo lettere, numeri e punti';
        feedbackEl.className = 'staff-email-feedback staff-email-feedback--err';
        if (splitEl) {
          splitEl.classList.add('staff-email-split--error');
          splitEl.classList.remove('staff-email-split--success');
        }
      }
    });
  }

  /* ----------------------------------------------------------
     FORZA PASSWORD
     ---------------------------------------------------------- */

  function passwordStrength(v) {
    let s = 0;
    if (v.length >= 8)          s++;
    if (v.length >= 12)         s++;
    if (/[A-Z]/.test(v))        s++;
    if (/[0-9]/.test(v))        s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    if (s <= 1) return { cls: 'weak',   label: 'Sicurezza password: Debole' };
    if (s <= 3) return { cls: 'medium', label: 'Sicurezza password: Buona' };
    return             { cls: 'strong', label: 'Sicurezza password: Ottima' };
  }

  function initPasswordUI() {
    const pwdEl    = $('staff-password');
    const bar      = $('pwd-bar');
    const barLabel = $('pwd-label');
    const confirm  = $('staff-password-confirm');
    const matchMsg = $('pwd-match');
    if (!pwdEl) return;

    pwdEl.addEventListener('input', function () {
      if (!pwdEl.value) {
        if (bar) bar.className = 'staff-pwd-fill';
        if (barLabel) barLabel.textContent = '';
        return;
      }
      const r = passwordStrength(pwdEl.value);
      if (bar) bar.className = 'staff-pwd-fill staff-pwd-fill--' + r.cls;
      if (barLabel) barLabel.textContent = r.label;
      checkMatch();
    });

    function checkMatch() {
      if (!confirm || !confirm.value) return;
      if (confirm.value === pwdEl.value) {
        if (matchMsg) { matchMsg.textContent = '✓ Le password coincidono'; matchMsg.style.color = 'var(--color-success)'; }
        confirm.classList.add('staff-form-input--success');
        confirm.classList.remove('staff-form-input--error');
      } else {
        if (matchMsg) matchMsg.textContent = '';
        confirm.classList.remove('staff-form-input--success');
      }
    }

    if (confirm) confirm.addEventListener('input', checkMatch);
  }

  /* ----------------------------------------------------------
     VALIDAZIONE FORM
     ---------------------------------------------------------- */

  function validate() {
    const fields = [
      { id: 'staff-nome',             check: function(v){ return v.length >= 2; },       msg: 'Inserisci il nome' },
      { id: 'staff-cognome',          check: function(v){ return v.length >= 2; },       msg: 'Inserisci il cognome' },
      { id: 'staff-username',         check: function(v){ return /^[a-z0-9._\-]+$/i.test(v) && v.length >= 2; }, msg: 'Username non valido' },
      { id: 'staff-password',         check: function(v){ return v.length >= 8; },       msg: 'Minimo 8 caratteri' },
      { id: 'staff-password-confirm', check: function(v){ return v === ($('staff-password') ? $('staff-password').value : ''); }, msg: 'Le password non coincidono' },
    ];

    let valid = true;
    fields.forEach(function (f) {
      const el = $(f.id);
      if (!el) return;
      const v = el.value.trim();
      if (!v || !f.check(v)) {
        el.classList.add('staff-form-input--error');
        valid = false;
      } else {
        el.classList.remove('staff-form-input--error');
        el.classList.add('staff-form-input--success');
      }
    });
    return valid;
  }

  /* ----------------------------------------------------------
     SUBMIT
     ---------------------------------------------------------- */

  function initForm() {
    const form = $('staff-reg-form');
    if (!form) return;

    const submitBtn = $('staff-reg-submit');

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      if (!validate()) return;

      const username = $('staff-username') ? $('staff-username').value.trim() : '';
      const email    = username + DOMAIN;

      setLoading(submitBtn, true);

      try {
        // Chiamata API reale
        await API.auth.registerPersonale({
          tipo:     tipoSelezionato,
          nome:     $('staff-nome').value.trim(),
          cognome:  $('staff-cognome').value.trim(),
          email:    email,
          password: $('staff-password').value,
        });

        // Mostra schermata successo
        const emailLabel = $('success-email');
        if (emailLabel) emailLabel.textContent = email;

        const successBox = $('success-box');
        if (successBox) {
          successBox.style.display = 'block';
          successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Disabilita form
        form.querySelectorAll('input, button').forEach(function (el) {
          el.disabled = true;
        });

      } catch (err) {
        const alertEl = $('reg-alert');
        if (alertEl) {
          alertEl.textContent = '⚠ ' + err.message;
          alertEl.style.display = 'flex';
        }
      } finally {
        setLoading(submitBtn, false);
      }
    });
  }

  /* ----------------------------------------------------------
     INIT
     ---------------------------------------------------------- */

  document.addEventListener('DOMContentLoaded', function () {
    initTabs();
    initEmailValidation();
    initPasswordUI();
    initForm();
  });

})();
