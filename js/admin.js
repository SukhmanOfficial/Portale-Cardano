/**
 * admin.js — Pannello Amministratore
 * Sistema Cardano Day · ITIS "G. Cardano", Pavia
 */

(function () {
  'use strict';

  var utente = API.auth.requireLogin(['admin']);
  if (!utente) return;

  function $(id) { return document.getElementById(id); }
  function fmtData(s) {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('it-IT', {day:'2-digit', month:'short', year:'numeric'});
  }

  function showMsg(elId, msg, tipo) {
    var el = $(elId);
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    el.style.color = tipo === 'ok' ? 'var(--color-success)' : 'var(--color-danger)';
    setTimeout(function(){ el.style.display = 'none'; }, 4000);
  }

  /* ----------------------------------------------------------
     TOPBAR
     ---------------------------------------------------------- */
  var nameEl = $('topbar-user-name');
  if (nameEl) nameEl.textContent = utente.nome + ' ' + utente.cognome;
  var initEl = $('topbar-avatar');
  if (initEl) initEl.textContent = (utente.nome[0] + utente.cognome[0]).toUpperCase();

  /* ----------------------------------------------------------
     NAVIGAZIONE
     ---------------------------------------------------------- */
  function showSection(name) {
    document.querySelectorAll('[data-section]').forEach(function (el) {
      el.style.display = el.dataset.section === name ? 'block' : 'none';
    });
    document.querySelectorAll('.seg-nav-link[data-nav]').forEach(function (el) {
      el.classList.toggle('seg-nav-link--active', el.dataset.nav === name);
    });
    var renders = {
      dashboard:   renderDashboard,
      utenti:      renderUtentiSez,
      eventi:      renderEventiSez,
      iscrizioni:  renderIscrizioniSez,
      statistiche: renderStatistiche,
      segreteria:  renderSegreteria,
      impostazioni: aggiornaImpostazioni,
    };
    if (renders[name]) renders[name]();
  }
  window.showSection = showSection;

  document.querySelectorAll('.seg-nav-link[data-nav]').forEach(function (el) {
    el.addEventListener('click', function () { showSection(el.dataset.nav); });
  });

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
  updateToggle();
  window.addEventListener('resize', updateToggle);

  /* -- LOGOUT -- */
  document.querySelectorAll('.seg-topbar__logout').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (confirm('Vuoi uscire?')) API.auth.logout();
    });
  });

  /* ----------------------------------------------------------
     DASHBOARD — KPI reali
     ---------------------------------------------------------- */
  async function renderDashboard() {
    try {
      var data  = await API.admin.stats();
      var stats = data.data || {};

      var kpis = [
        { num: stats.iscrizioni && stats.iscrizioni.confermate != null ? stats.iscrizioni.confermate : 0, cls: 'admin-kpi-num--orange', label: 'Iscrizioni totali',    sub: 'Sola lettura' },
        { num: stats.utenti && stats.utenti.totale != null ? stats.utenti.totale : 0,                     cls: 'admin-kpi-num--blue',   label: 'Utenti attivi',        sub: 'Sola lettura' },
        { num: stats.eventi && stats.eventi.totale != null ? stats.eventi.totale : 0,                     cls: 'admin-kpi-num--black',  label: 'Eventi in programma',  sub: 'Sola lettura' },
        { num: stats.utenti && stats.utenti.segreteria != null ? stats.utenti.segreteria : 0,             cls: 'admin-kpi-num--purple', label: 'Segreterie attive',    sub: 'Gestibile da Admin' },
      ];

      var html = kpis.map(function (k) {
        return '<div class="admin-kpi-card">' +
          '<div class="admin-kpi-num ' + k.cls + '">' + k.num + '</div>' +
          '<div class="admin-kpi-label">' + k.label + '</div>' +
          '<div class="admin-kpi-sub">' + k.sub + '</div>' +
        '</div>';
      }).join('');

      var grid = $('admin-kpi-grid');
      if (grid) grid.innerHTML = html;
      var grid2 = $('admin-kpi-grid-2');
      if (grid2) grid2.innerHTML = html;

      renderEventiList(stats.ultimi_eventi || [], 'admin-eventi-list');
      renderSegreteria();

    } catch (err) {
      console.error('[Admin Dashboard]', err.message);
    }
  }

  /* ----------------------------------------------------------
     EVENTI — sola lettura
     ---------------------------------------------------------- */
  async function renderEventiSez() {
    try {
      var data = await API.events.list(false);
      renderEventiList(data.data || [], 'admin-eventi-list-2');
    } catch (err) {
      console.error('[Admin eventi]', err.message);
    }
  }

  function renderEventiList(eventi, containerId) {
    var el = $(containerId);
    if (!el) return;
    if (!eventi.length) {
      el.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--color-text-muted);">Nessun evento</div>';
      return;
    }
    el.innerHTML = eventi.map(function (ev) {
      var typeLbl = ev.tipo === 'open_day' ? 'Open Day' : 'Cardano Day';
      var typeCls = ev.tipo === 'open_day' ? 'evento-type-pill--openday' : 'evento-type-pill--cardano';
      var statoLbl = ev.iscrizioni_aperte ? 'Attivo' : ev.pubblicato ? 'In attesa' : 'Bozza';
      var statoCls = ev.iscrizioni_aperte ? 'admin-evento-stato--attivo' : ev.pubblicato ? 'admin-evento-stato--attesa' : 'admin-evento-stato--bozza';
      return '<div class="admin-evento-row">' +
        '<span class="evento-type-pill ' + typeCls + '">' + typeLbl + '</span>' +
        '<div class="admin-evento-info">' +
          '<div class="admin-evento-date">' + fmtData(ev.data_evento) + '</div>' +
          '<div class="admin-evento-sub">' + (ev.iscritti || 0) + '/' + ev.posti_max + ' iscritti</div>' +
        '</div>' +
        '<span class="admin-evento-stato ' + statoCls + '">' + statoLbl + '</span>' +
      '</div>';
    }).join('');
  }

  /* ----------------------------------------------------------
     UTENTI — sola lettura con tabella reale
     ---------------------------------------------------------- */
  async function renderUtentiSez() {
    var tbody  = $('admin-utenti-tbody-2') || $('admin-utenti-tbody');
    var tbody2 = $('admin-utenti-tbody');
    if (!tbody) return;

    var loading = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--color-text-muted);">Caricamento...</td></tr>';
    tbody.innerHTML = loading;
    if (tbody2 && tbody2 !== tbody) tbody2.innerHTML = loading;

    try {
      var data  = await API.users.list({});
      var lista = data.data || [];
      var RUOLO = { segreteria:'Segreteria', staff:'Staff', professore:'Prof.', genitore:'Genitore', admin:'Admin' };

      var html = lista.length ? lista.map(function (u) {
        var rl = RUOLO[u.ruolo] || u.ruolo;
        var azione = u.ruolo === 'segreteria'
          ? '<button class="btn-revoca" onclick="revocaruolo(' + u.id + ')">Revoca</button>'
          : (u.ruolo === 'staff' || u.ruolo === 'professore')
            ? '<button class="btn-promuovi" onclick="promuoviSegreteria(' + u.id + ')">Promuovi</button>'
            : '<span style="color:var(--color-text-muted);font-size:var(--text-xs);">—</span>';
        return '<tr>' +
          '<td style="font-weight:600;">' + u.nome + ' ' + u.cognome + '</td>' +
          '<td style="color:var(--color-text-secondary);font-size:var(--text-xs);">' + u.email + '</td>' +
          '<td><span class="ruolo-badge ruolo-badge--' + u.ruolo + '">' + rl + '</span></td>' +
          '<td><span class="stato-badge stato-badge--' + (u.stato === 'attivo' ? 'attivo' : 'non-verif') + '">● ' + (u.stato === 'attivo' ? 'Attivo' : u.stato) + '</span></td>' +
          '<td style="color:var(--color-text-muted);">' + (u.iscrizioni_attive || '—') + '</td>' +
          '<td>' + azione + '</td></tr>';
      }).join('') : '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--color-text-muted);">Nessun utente</td></tr>';

      tbody.innerHTML = html;
      if (tbody2 && tbody2 !== tbody) tbody2.innerHTML = html;

    } catch (err) {
      var errHtml = '<tr><td colspan="6" style="color:var(--color-danger);text-align:center;padding:2rem;">Errore: ' + err.message + '</td></tr>';
      tbody.innerHTML = errHtml;
      if (tbody2 && tbody2 !== tbody) tbody2.innerHTML = errHtml;
    }
  }

  /* ----------------------------------------------------------
     ISCRIZIONI — sola lettura con dati reali
     ---------------------------------------------------------- */
  async function renderIscrizioniSez() {
    var container = $('admin-iscrizioni-content');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--color-text-muted);">Caricamento...</div>';
    try {
      var data  = await API.registrations.list({});
      var lista = data.data || [];
      if (!lista.length) {
        container.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--color-text-muted);">Nessuna iscrizione</div>';
        return;
      }
      container.innerHTML = '<div style="overflow-x:auto;">' +
        '<table class="admin-utenti-table">' +
        '<thead><tr><th>Studente</th><th>Genitore</th><th>Evento</th><th>Percorso/Lab</th><th>Gruppo</th><th>Stato</th></tr></thead>' +
        '<tbody>' +
        lista.map(function (i) {
          var percorso = i.percorso_nome || ((i.lab_t1_nome || '') + (i.lab_t2_nome ? ' + ' + i.lab_t2_nome : '')) || '—';
          var statoCls = i.stato === 'confermata' ? 'color:var(--color-success)' : 'color:var(--color-danger)';
          return '<tr>' +
            '<td style="font-weight:600;">' + (i.studente || '—') + '</td>' +
            '<td style="color:var(--color-text-secondary);">' + (i.genitore || '—') + '</td>' +
            '<td>' + (i.evento || '—') + '</td>' +
            '<td>' + percorso + '</td>' +
            '<td>' + (i.gruppo_codice || '—') + '</td>' +
            '<td style="font-weight:700;' + statoCls + ';">' + (i.stato || '—') + '</td>' +
          '</tr>';
        }).join('') +
        '</tbody></table></div>';
    } catch (err) {
      container.innerHTML = '<div style="color:var(--color-danger);padding:2rem;">Errore: ' + err.message + '</div>';
    }
  }

  /* ----------------------------------------------------------
     STATISTICHE — dati reali
     ---------------------------------------------------------- */
  async function renderStatistiche() {
    var grid = $('admin-kpi-grid-2');
    if (!grid) return;
    grid.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--color-text-muted);">Caricamento...</div>';
    try {
      var data  = await API.admin.stats();
      var stats = data.data || {};
      var kpis  = [
        { num: stats.iscrizioni && stats.iscrizioni.confermate != null ? stats.iscrizioni.confermate : 0, cls: 'admin-kpi-num--orange', label: 'Iscrizioni confermate' },
        { num: stats.utenti && stats.utenti.totale != null ? stats.utenti.totale : 0,                     cls: 'admin-kpi-num--blue',   label: 'Utenti registrati' },
        { num: stats.eventi && stats.eventi.totale != null ? stats.eventi.totale : 0,                     cls: 'admin-kpi-num--black',  label: 'Eventi creati' },
        { num: stats.utenti && stats.utenti.segreteria != null ? stats.utenti.segreteria : 0,             cls: 'admin-kpi-num--purple', label: 'Segreterie attive' },
        { num: stats.utenti && stats.utenti.in_attesa != null ? stats.utenti.in_attesa : 0,               cls: 'admin-kpi-num--orange', label: 'Utenti in attesa' },
        { num: stats.iscrizioni && stats.iscrizioni.annullate != null ? stats.iscrizioni.annullate : 0,   cls: 'admin-kpi-num--black',  label: 'Iscrizioni annullate' },
      ];
      grid.innerHTML = kpis.map(function (k) {
        return '<div class="admin-kpi-card">' +
          '<div class="admin-kpi-num ' + k.cls + '">' + k.num + '</div>' +
          '<div class="admin-kpi-label">' + k.label + '</div>' +
        '</div>';
      }).join('');
    } catch (err) {
      grid.innerHTML = '<div style="color:var(--color-danger);padding:2rem;">Errore: ' + err.message + '</div>';
    }
  }

  /* ----------------------------------------------------------
     GESTIONE SEGRETERIA
     ---------------------------------------------------------- */
  async function renderSegreteria() {
    var tbodies = ['seg-mgmt-tbody', 'seg-mgmt-tbody-2'];
    tbodies.forEach(function(id) {
      var tb = $(id);
      if (tb) tb.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--color-text-muted);">Caricamento...</td></tr>';
    });

    try {
      var r1    = await API.users.list({ ruolo: 'segreteria' });
      var r2    = await API.users.list({ ruolo: 'staff' });
      var r3    = await API.users.list({ ruolo: 'professore' });
      var tutti = (r1.data || []).concat(r2.data || []).concat(r3.data || []);

      var html = tutti.length ? tutti.map(function (u) {
        var badge = u.ruolo === 'segreteria'
          ? '<span class="ruolo-badge ruolo-badge--segreteria">Segreteria</span>'
          : '<span class="ruolo-badge ruolo-badge--staff">' + (u.ruolo === 'professore' ? 'Professore' : 'Staff') + '</span>';
        var btn = u.ruolo === 'segreteria'
          ? '<button class="btn-revoca" onclick="revocaruolo(' + u.id + ')">Revoca</button>'
          : '<button class="btn-promuovi" onclick="promuoviSegreteria(' + u.id + ')">Promuovi</button>';
        var statoCls = u.stato === 'attivo' ? 'stato-dot--attivo' : 'stato-dot--non-attivo';
        return '<tr>' +
          '<td><div class="u-cell-sm"><span class="u-cell-sm__name">' + u.nome + ' ' + u.cognome + '</span>' +
          '<span class="u-cell-sm__email">' + u.email + '</span></div></td>' +
          '<td>' + badge + '</td>' +
          '<td><span class="stato-dot ' + statoCls + '">' + (u.stato === 'attivo' ? 'Attivo' : u.stato) + '</span></td>' +
          '<td>' + btn + '</td></tr>';
      }).join('') : '<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--color-text-muted);">Nessun utente</td></tr>';

      tbodies.forEach(function(id) {
        var tb = $(id);
        if (tb) tb.innerHTML = html;
      });

    } catch (err) {
      tbodies.forEach(function(id) {
        var tb = $(id);
        if (tb) tb.innerHTML = '<tr><td colspan="4" style="color:var(--color-danger);text-align:center;padding:2rem;">Errore: ' + err.message + '</td></tr>';
      });
    }
  }

  window.promuoviSegreteria = async function (id) {
    var el = document.querySelector('[onclick="promuoviSegreteria(' + id + ')"]');
    if (el) { el.disabled = true; el.textContent = '...'; }
    try {
      await API.admin.setSegreteria(id, 'promuovi');
      renderSegreteria();
      renderUtentiSez();
      showMsg('admin-msg', 'Utente promosso a Segreteria', 'ok');
    } catch (err) {
      showMsg('admin-msg', 'Errore: ' + err.message, 'err');
      if (el) { el.disabled = false; el.textContent = 'Promuovi'; }
    }
  };

  window.revocaruolo = async function (id) {
    var el = document.querySelector('[onclick="revocaruolo(' + id + ')"]');
    if (el) { el.disabled = true; el.textContent = '...'; }
    try {
      await API.admin.setSegreteria(id, 'revoca');
      renderSegreteria();
      renderUtentiSez();
      showMsg('admin-msg', 'Ruolo Segreteria revocato', 'ok');
    } catch (err) {
      showMsg('admin-msg', 'Errore: ' + err.message, 'err');
      if (el) { el.disabled = false; el.textContent = 'Revoca'; }
    }
  };

  /* ----------------------------------------------------------
     IMPOSTAZIONI — anno scolastico + dati istituto modificabili
     ---------------------------------------------------------- */
  function aggiornaImpostazioni() {
    // Anno scolastico
    var annoDisplay = $('anno-display');
    var annoStatus  = $('anno-override-status');
    if (annoDisplay && typeof CONFIG !== 'undefined') {
      annoDisplay.textContent = CONFIG.getAnno();
    }
    if (annoStatus && typeof CONFIG !== 'undefined') {
      annoStatus.textContent = CONFIG.hasOverride() ? '(override manuale attivo)' : '(calcolo automatico)';
    }
    var annoInput = $('anno-override-input');
    if (annoInput && typeof CONFIG !== 'undefined' && CONFIG.hasOverride()) {
      annoInput.value = CONFIG.getAnno();
    }

    // Popola campi dati istituto
    if (typeof CONFIG !== 'undefined') {
      var ist = CONFIG.istituto || {};
      var map = {
        'ist-nome':     ist.nome     || '',
        'ist-indirizzo':ist.indirizzo|| '',
        'ist-citta':    ist.citta    || '',
        'ist-tel':      ist.telefono || '',
        'ist-email':    ist.email    || '',
        'ist-sito':     ist.sito     || '',
      };
      Object.keys(map).forEach(function(id) {
        var el = $(id);
        if (el) el.value = map[id];
      });
    }
  }

  window.salvaAnnoOverride = function () {
    var input = $('anno-override-input');
    var val   = input ? input.value.trim() : '';
    if (!val) {
      showMsg('anno-msg', 'Inserisci un anno valido (es. 2026-27)', 'err');
      return;
    }
    if (typeof CONFIG !== 'undefined') CONFIG.setAnnoOverride(val);
    aggiornaImpostazioni();
    showMsg('anno-msg', 'Anno scolastico salvato: ' + val, 'ok');
  };

  window.resetAnnoOverride = function () {
    if (typeof CONFIG !== 'undefined') CONFIG.setAnnoOverride(null);
    var input = $('anno-override-input');
    if (input) input.value = '';
    aggiornaImpostazioni();
    showMsg('anno-msg', 'Anno scolastico ripristinato al calcolo automatico', 'ok');
  };

  window.salvaIstituto = function () {
    var dati = {
      nome:     ($('ist-nome')     || {}).value || '',
      indirizzo:($('ist-indirizzo')|| {}).value || '',
      citta:    ($('ist-citta')    || {}).value || '',
      telefono: ($('ist-tel')      || {}).value || '',
      email:    ($('ist-email')    || {}).value || '',
      sito:     ($('ist-sito')     || {}).value || '',
    };
    try {
      localStorage.setItem('cardano_istituto_override', JSON.stringify(dati));
      showMsg('istituto-msg', 'Dati istituto salvati', 'ok');
    } catch(e) {
      showMsg('istituto-msg', 'Errore salvataggio', 'err');
    }
  };

  /* ----------------------------------------------------------
     INIT
     ---------------------------------------------------------- */
  // Init immediato (script in fondo al body, DOM già pronto)
  showSection('dashboard');

})();
