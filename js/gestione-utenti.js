/**
 * gestione-utenti.js — Gestione Utenti Segreteria
 * Sistema Cardano Day · ITIS "G. Cardano", Pavia
 * Collegato a API reali
 */

(function () {
  'use strict';

  var utente = API.auth.requireLogin(['segreteria', 'admin']);
  if (!utente) return;

  function $(id) { return document.getElementById(id); }
  function fmtData(s) { if (!s) return '—'; return new Date(s).toLocaleDateString('it-IT', {day:'2-digit',month:'short',year:'numeric'}); }

  var RUOLO_LBL  = { segreteria:'Segreteria', staff:'Staff', professore:'Prof.', genitore:'Genitore', admin:'Admin' };
  var STATO_CLS  = { attivo:'stato-badge--attivo', non_verificato:'stato-badge--non-verif', sospeso:'stato-badge--sospeso' };
  var STATO_LBL  = { attivo:'● Attivo', non_verificato:'● Non verificato', sospeso:'● Sospeso' };

  /* -- APPROVAZIONI -- */
  async function renderApprovazioni() {
    var [el1, el2] = [$('approv-list'), $('approv-list-2')];
    try {
      var data = await API.users.approvazioni();
      var lista = data.data || [];

      var badge = $('approv-badge');
      if (badge) badge.textContent = lista.length + ' richieste';
      var badge2 = $('tab-count-approv');
      if (badge2) badge2.textContent = lista.length;

      var html = lista.length === 0
        ? '<div style="padding:var(--space-6);text-align:center;color:var(--color-text-muted);">✓ Nessuna approvazione in attesa</div>'
        : lista.map(function (a) {
            var rl  = a.ruolo === 'staff' ? 'Staff' : 'Professore';
            var cls = a.ruolo === 'staff' ? 'approv-role-badge--staff' : 'approv-role-badge--prof';
            return '<div class="approv-item" id="app-' + a.id + '">' +
              '<div class="approv-avatar">' + a.nome[0] + a.cognome[0] + '</div>' +
              '<div class="approv-info">' +
                '<div class="approv-name">' + a.nome + ' ' + a.cognome +
                  '<span class="approv-role-badge ' + cls + '">' + rl + '</span></div>' +
                '<div class="approv-email">' + a.email + '</div>' +
                '<div class="approv-date">Richiesta: ' + fmtData(a.creato_il) + '</div>' +
              '</div>' +
              '<div class="approv-actions">' +
                '<button class="btn-approva" onclick="approva(' + a.id + ')">✓ Approva</button>' +
                '<button class="btn-rifiuta" onclick="rifiuta(' + a.id + ')">✗ Rifiuta</button>' +
              '</div></div>';
          }).join('');

      if (el1) el1.innerHTML = html;
      if (el2) el2.innerHTML = html;
    } catch (err) {
      var errHtml = '<div style="color:var(--color-danger);padding:1rem;">Errore: ' + err.message + '</div>';
      if (el1) el1.innerHTML = errHtml;
    }
  }

  window.approva = async function (id) {
    if (!confirm('Approvare questo utente?')) return;
    try {
      await API.users.approva(id);
      renderApprovazioni();
      renderUtenti();
    } catch (err) { alert('Errore: ' + err.message); }
  };

  window.rifiuta = async function (id) {
    var motivo = prompt('Motivo del rifiuto (opzionale):') || '';
    try {
      await API.users.rifiuta(id, motivo);
      renderApprovazioni();
    } catch (err) { alert('Errore: ' + err.message); }
  };

  /* -- TABELLA UTENTI -- */
  async function renderUtenti(filtroTesto, filtroRuolo, filtroStato) {
    var tbody  = $('utenti-tbody');
    var footer = $('utenti-footer');
    var count  = $('utenti-count');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--color-text-muted);">Caricamento...</td></tr>';

    try {
      var filtri = {};
      if (filtroTesto  && filtroTesto.trim())   filtri.search = filtroTesto;
      if (filtroRuolo  && filtroRuolo !== 'tutti') filtri.ruolo = filtroRuolo;
      if (filtroStato  && filtroStato !== 'tutti') filtri.stato = filtroStato;

      var data  = await API.users.list(filtri);
      var lista = data.data || [];

      if (count) count.textContent = lista.length + ' utenti totali';
      var tabCount = $('tab-count-tutti');
      if (tabCount) tabCount.textContent = lista.length;

      tbody.innerHTML = lista.map(function (u) {
        var rl = RUOLO_LBL[u.ruolo]  || u.ruolo;
        var sc = STATO_CLS[u.stato]  || 'stato-badge--non-verif';
        var sl = STATO_LBL[u.stato]  || u.stato;
        var ini = (u.nome[0] + u.cognome[0]).toUpperCase();
        var azioni = u.ruolo !== 'admin'
          ? '<button class="btn-modifica-ruolo" onclick="modificaRuolo(' + u.id + ',\'' + u.ruolo + '\')">✏ Ruolo</button>' +
            '<button class="btn-elimina" onclick="eliminaUtente(' + u.id + ')">🗑</button>'
          : '<span style="color:var(--color-text-muted);font-size:var(--text-xs);">Admin</span>';
        return '<tr>' +
          '<td><div class="u-cell"><div class="u-avatar u-avatar--orange">' + ini + '</div>' +
          '<div><div class="u-cell__name">' + u.nome + ' ' + u.cognome + '</div>' +
          '<div class="u-cell__sub">' + rl + '</div></div></div></td>' +
          '<td style="color:var(--color-text-secondary);">' + u.email + '</td>' +
          '<td><span class="ruolo-badge ruolo-badge--' + u.ruolo + '">' + rl + '</span></td>' +
          '<td><span class="stato-badge ' + sc + '">' + sl + '</span></td>' +
          '<td style="color:var(--color-text-muted);">' + (u.iscrizioni_attive || '—') + '</td>' +
          '<td style="color:var(--color-text-muted);">' + fmtData(u.creato_il) + '</td>' +
          '<td><div style="display:flex;gap:var(--space-2);">' + azioni + '</div></td></tr>';
      }).join('');
      if (footer) footer.textContent = 'Mostrando ' + lista.length + ' utenti';
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="7" style="color:var(--color-danger);text-align:center;padding:2rem;">Errore: ' + err.message + '</td></tr>';
    }
  }

  /* -- AZIONI -- */
  window.modificaRuolo = async function (id, ruoloAttuale) {
    var nuovo = prompt('Nuovo ruolo (staff / professore / segreteria / genitore):\nAttuale: ' + ruoloAttuale);
    if (!nuovo || nuovo === ruoloAttuale) return;
    try {
      await API.users.setRuolo(id, nuovo);
      renderUtenti();
    } catch (err) { alert('Errore: ' + err.message); }
  };

  window.eliminaUtente = async function (id) {
    if (!confirm('Eliminare questo utente? L\'operazione non può essere annullata.')) return;
    try {
      await API.users.elimina(id);
      renderUtenti();
    } catch (err) { alert('Errore: ' + err.message); }
  };

  window.salvaBozza = function () {
    var ogg = document.getElementById('notifica-oggetto');
    var msg = document.getElementById('notifica-msg');
    var bozza = {
      oggetto: ogg ? ogg.value : '',
      messaggio: msg ? msg.value : '',
      salvato: new Date().toLocaleTimeString('it-IT')
    };
    try {
      localStorage.setItem('cardano_notifica_bozza', JSON.stringify(bozza));
      alert('✓ Bozza salvata alle ' + bozza.salvato);
    } catch(e) {
      alert('Errore nel salvataggio della bozza');
    }
  };

  window.inviaNotifica = async function () {
    var dest = $('notifica-dest')?.value    || '';
    var ogg  = $('notifica-oggetto')?.value.trim() || '';
    var msg  = $('notifica-msg')?.value.trim()     || '';
    if (!ogg || !msg) return alert('Compila oggetto e messaggio.');
    if (!confirm('Inviare email a: ' + dest + '?')) return;
    alert('Email inviata! (Configura API notifiche nel backend)');
  };

  /* -- TAB -- */
  function showTab(name) {
    document.querySelectorAll('[data-tab]').forEach(function (el) {
      el.style.display = el.dataset.tab === name ? 'block' : 'none';
    });
    document.querySelectorAll('.page-tab').forEach(function (el) {
      el.classList.toggle('page-tab--active', el.dataset.tabTarget === name);
    });
    if (name === 'approvazioni') renderApprovazioni();
  }

  /* -- FILTRI -- */
  function aggiorna() {
    renderUtenti(
      $('search-utenti')?.value  || '',
      $('filter-ruolo')?.value   || 'tutti',
      $('filter-stato')?.value   || 'tutti'
    );
  }

  document.querySelectorAll('.page-tab[data-tab-target]').forEach(function (el) {
    el.addEventListener('click', function () { showTab(el.dataset.tabTarget); });
  });
  var s = $('search-utenti'); if (s) s.addEventListener('input', aggiorna);
  var r = $('filter-ruolo');  if (r) r.addEventListener('change', aggiorna);
  var st = $('filter-stato'); if (st) st.addEventListener('change', aggiorna);

  /* -- SIDEBAR MOBILE -- */
  var toggle  = $('sidebar-toggle');
  var sidebar = document.querySelector('.seg-sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', function () { sidebar.classList.toggle('is-open'); });
    document.addEventListener('click', function (e) {
      if (!sidebar.contains(e.target) && !toggle.contains(e.target)) sidebar.classList.remove('is-open');
    });
  }
  function updateToggle() { if (toggle) toggle.style.display = window.innerWidth <= 900 ? 'block' : 'none'; }
  updateToggle(); window.addEventListener('resize', updateToggle);

  /* -- INIT -- */
  // Init immediato (script in fondo al body, DOM già pronto)
  renderApprovazioni();
    renderUtenti();
    showTab('tutti');

})();
