/**
 * area-genitore.js — Dashboard genitore
 * Sistema Cardano Day · ITIS "G. Cardano", Pavia
 * Collegato a API.users.* e API.registrations.*
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     AUTH CHECK
     ---------------------------------------------------------- */
  var utente = API.auth.requireLogin(['genitore']);
  if (!utente) return;

  /* ----------------------------------------------------------
     UTILITY
     ---------------------------------------------------------- */
  function $(id) { return document.getElementById(id); }

  function showSection(name) {
    document.querySelectorAll('[data-section]').forEach(function (el) {
      el.style.display = el.dataset.section === name ? 'block' : 'none';
    });
    document.querySelectorAll('.area-nav__link[data-nav]').forEach(function (el) {
      el.classList.toggle('area-nav__link--active', el.dataset.nav === name);
    });
  }

  function formatData(str) {
    if (!str) return '—';
    var d = new Date(str);
    return d.toLocaleDateString('it-IT', { day:'2-digit', month:'short', year:'numeric' });
  }

  /* ----------------------------------------------------------
     TOPBAR UTENTE
     ---------------------------------------------------------- */
  var nameEl = $('topbar-user-name');
  if (nameEl) nameEl.textContent = utente.nome + ' ' + utente.cognome;
  var initEl = document.querySelector('.area-topbar__avatar');
  if (initEl) initEl.textContent = (utente.nome[0] + utente.cognome[0]).toUpperCase();

  /* ----------------------------------------------------------
     CARICA ISCRIZIONI
     ---------------------------------------------------------- */
  async function caricaIscrizioni() {
    var grid = $('iscrizioni-grid');
    if (!grid) return;
    grid.innerHTML = '<div style="text-align:center;color:var(--color-text-muted);padding:2rem;">Caricamento...</div>';
    try {
      var data = await API.registrations.mie();
      var iscrizioni = data.data || [];
      if (iscrizioni.length === 0) {
        grid.innerHTML = '<div style="text-align:center;color:var(--color-text-muted);padding:3rem;"><div style="font-size:2rem;margin-bottom:1rem;">📋</div><div>Nessuna iscrizione — <a href="index.html#eventi" style="color:var(--color-primary);">Iscriviti a un evento</a></div></div>';
        return;
      }
      grid.innerHTML = iscrizioni.map(function (i) {
        var firme = i.firme_count || 0;
        var label = i.evento_tipo === 'cardano_day'
          ? (i.lab_t1 || '—') + (i.lab_t2 ? ' + ' + i.lab_t2 : '')
          : i.percorso_nome || '—';
        var gruppoBadge = i.gruppo_codice
          ? '<span style="background:var(--color-primary);color:#fff;padding:2px 10px;border-radius:4px;font-weight:700;">' + i.gruppo_codice + '</span>'
          : '<em style="color:var(--color-text-muted);font-size:var(--text-xs);">Assegnato dopo chiusura</em>';
        var statoCls = i.stato === 'confermata' ? 'color:var(--color-success)' : 'color:var(--color-danger)';
        return '<div class="iscrizione-card">' +
          '<div class="iscrizione-card__header">' +
            '<div class="iscrizione-card__tipo ' + (i.evento_tipo === 'cardano_day' ? 'iscrizione-card__tipo--cardano' : '') + '">' +
              (i.evento_tipo === 'cardano_day' ? 'Cardano Day' : 'Open Day') +
            '</div>' +
            '<span style="font-size:var(--text-xs);' + statoCls + ';font-weight:700;">' + i.stato + '</span>' +
          '</div>' +
          '<div class="iscrizione-card__event">' + (i.evento || '—') + '</div>' +
          '<div class="iscrizione-card__date">📅 ' + formatData(i.data_evento) + '</div>' +
          '<div style="margin:0.5rem 0;font-size:var(--text-xs);color:var(--color-text-muted);">Studente: <strong>' + (i.studente || '—') + '</strong></div>' +
          '<div style="margin:0.5rem 0;font-size:var(--text-xs);color:var(--color-text-muted);">Percorso: ' + label + '</div>' +
          '<div style="margin:0.5rem 0;">Gruppo: ' + gruppoBadge + '</div>' +
          (i.evento_tipo === 'cardano_day' ? '<div class="firme-mini">' + renderFirmeMini(firme) + '</div>' : '') +
          '<div class="iscrizione-card__actions">' +
            '<button class="btn-qr" onclick="mostraQr(\'' + i.qr_token + '\')">📱 QR Code</button>' +
            (i.stato === 'confermata' ? '<button class="btn-annulla-iscr" onclick="annullaIscrizione(' + i.id + ')">Annulla</button>' : '') +
          '</div>' +
        '</div>';
      }).join('');
    } catch (err) {
      grid.innerHTML = '<div style="text-align:center;color:var(--color-danger);padding:2rem;">Errore: ' + err.message + '</div>';
    }
  }

  function renderFirmeMini(n) {
    var firme = ['Entrata','Lab T1','Lab T2','Uscita'];
    return firme.map(function (f, i) {
      var done = i < n;
      return '<span class="firma-dot ' + (done ? 'firma-dot--done' : '') + '" title="' + f + '">' + (done ? '✓' : String(i+1)) + '</span>';
    }).join('');
  }

  /* ----------------------------------------------------------
     MOSTRA QR CODE
     ---------------------------------------------------------- */
  window.mostraQr = function (token) {
    var modal = $('qr-modal');
    var img   = $('qr-img');
    if (!token) return;
    // Usa Google Charts API per generare QR (affidabile e senza dipendenze)
    var qrUrl = 'https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=' + encodeURIComponent(token) + '&choe=UTF-8';
    if (img) img.src = qrUrl;
    var tokenEl = $('qr-token-text');
    if (tokenEl) tokenEl.textContent = token.substring(0, 16) + '...';
    if (modal) modal.style.display = 'flex';
  };

  window.chiudiQr = function () {
    var modal = $('qr-modal');
    if (modal) modal.style.display = 'none';
  };

  /* ----------------------------------------------------------
     ANNULLA ISCRIZIONE
     ---------------------------------------------------------- */
  window.annullaIscrizione = function (id) {
    if (!confirm('Annullare questa iscrizione? L\'operazione non può essere annullata.')) return;
    API.registrations.cancel(id)
      .then(function () { caricaIscrizioni(); })
      .catch(function (err) { alert('Errore: ' + err.message); });
  };

  /* ----------------------------------------------------------
     CARICA FIGLI
     ---------------------------------------------------------- */
  async function caricaFigli() {
    var lista = $('figli-lista');
    if (!lista) return;
    try {
      var data = await API.users.figli();
      var figli = data.data || [];
      if (figli.length === 0) {
        lista.innerHTML = '<div style="color:var(--color-text-muted);font-size:var(--text-sm);padding:1rem 0;">Nessun figlio aggiunto</div>';
        return;
      }
      lista.innerHTML = figli.map(function (f) {
        return '<div class="figlio-row">' +
          '<div class="figlio-row__avatar">' + f.nome[0] + f.cognome[0] + '</div>' +
          '<div class="figlio-row__info">' +
            '<div class="figlio-row__name">' + f.nome + ' ' + f.cognome + '</div>' +
            '<div class="figlio-row__school">' + (f.nome_scuola_media || f.scuola || '—') + '</div>' +
          '</div>' +
          '<button class="btn-del-figlio" onclick="rimuoviFiglio(' + f.id + ',\'' + f.nome + '\')"  title="Rimuovi">✕</button>' +
        '</div>';
      }).join('');
    } catch (err) {
      lista.innerHTML = '<div style="color:var(--color-danger);">Errore: ' + err.message + '</div>';
    }
  }

  window.rimuoviFiglio = function (id, nome) {
    if (!confirm('Rimuovere ' + nome + ' dal tuo profilo?')) return;
    API.users.delFiglio(id)
      .then(function () { caricaFigli(); })
      .catch(function (err) { alert('Errore: ' + err.message); });
  };

  /* ----------------------------------------------------------
     AGGIUNGI FIGLIO
     ---------------------------------------------------------- */
  var formFiglio = $('form-aggiungi-figlio');
  if (formFiglio) {
    formFiglio.addEventListener('submit', async function (e) {
      e.preventDefault();
      var nome    = $('figlio-nome')?.value.trim()    || '';
      var cognome = $('figlio-cognome')?.value.trim() || '';
      var scuola  = $('figlio-scuola')?.value.trim()  || '';
      if (!nome || !cognome) return alert('Nome e cognome obbligatori');
      try {
        await API.users.addFiglio({ nome, cognome, scuola });
        formFiglio.reset();
        caricaFigli();
      } catch (err) {
        alert('Errore: ' + err.message);
      }
    });
  }

  /* ----------------------------------------------------------
     NAVIGAZIONE + INIT
     ---------------------------------------------------------- */
  document.querySelectorAll('.area-nav__link[data-nav]').forEach(function (el) {
    el.addEventListener('click', function () { showSection(el.dataset.nav); });
  });

  var btnLogout = document.querySelector('[data-logout]');
  if (btnLogout) btnLogout.addEventListener('click', function () {
    if (confirm('Vuoi uscire?')) API.auth.logout();
  });

  caricaIscrizioni();
  caricaFigli();
  showSection('iscrizioni');

})();
