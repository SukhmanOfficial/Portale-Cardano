/**
 * admin.js — Pannello Amministratore
 * Sistema Cardano Day · ITIS G. Cardano, Pavia
 *
 * L'Admin ha visibilità completa in sola lettura.
 * Unica azione disponibile: assegnare/revocare ruolo Segreteria.
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     DATI MOCK
     ---------------------------------------------------------- */

  const UTENTE_ADMIN = { nome: 'Giuseppe', cognome: 'Dirigente', initials: 'GD' };

  const UTENTI = [
    { id: 1, nome: 'Giulia Ferrari',   email: 'g.ferrari@itiscardanopv.edu.it', ruolo: 'segreteria', stato: 'attivo',    iscrizioni: null },
    { id: 2, nome: 'Marco Bianchi',    email: 'm.bianchi@itiscardanopv.edu.it',  ruolo: 'segreteria', stato: 'attivo',    iscrizioni: null },
    { id: 3, nome: 'Sara Verdi',       email: 's.verdi@itiscardanopv.edu.it',    ruolo: 'staff',      stato: 'attivo',    iscrizioni: null },
    { id: 4, nome: 'Luca Conti',       email: 'l.conti@itiscardanopv.edu.it',    ruolo: 'staff',      stato: 'attivo',    iscrizioni: null },
    { id: 5, nome: 'Mario Rossi',      email: 'mario.rossi@email.it',            ruolo: 'genitore',   stato: 'attivo',    iscrizioni: '2 iscrizioni' },
    { id: 6, nome: 'Anna Bianchi',     email: 'a.bianchi@email.it',              ruolo: 'genitore',   stato: 'non-attivo', iscrizioni: '0 iscrizioni' },
  ];

  const EVENTI = [
    { tipo: 'open_day',    data: '18 Novembre 2026',  sub: '87/120 iscritti · Iscrizioni aperte', stato: 'attivo' },
    { tipo: 'cardano_day', data: '24 Novembre 2026',  sub: '158/300 iscritti · Iscrizioni aperte', stato: 'attivo' },
    { tipo: 'open_day',    data: '18 Dicembre 2026',  sub: '0/120 iscritti · Non ancora aperto', stato: 'attesa' },
    { tipo: 'cardano_day', data: '13 Gennaio 2027',   sub: '0/300 iscritti · Bozza', stato: 'bozza' },
  ];

  /* ----------------------------------------------------------
     UTILITY
     ---------------------------------------------------------- */

  function $(id) { return document.getElementById(id); }

  /* ----------------------------------------------------------
     RENDER KPI
     ---------------------------------------------------------- */

  function renderKPI() {
    const grid = $('admin-kpi-grid');
    if (!grid) return;
    const kpis = [
      { num: 387, cls: 'admin-kpi-num--orange', label: 'Iscrizioni totali',   sub: 'Sola lettura' },
      { num: 48,  cls: 'admin-kpi-num--blue',   label: 'Utenti attivi',       sub: 'Sola lettura' },
      { num: 4,   cls: 'admin-kpi-num--black',  label: 'Eventi in programma', sub: 'Sola lettura' },
      { num: 2,   cls: 'admin-kpi-num--purple', label: 'Segreterie attive',   sub: 'Gestibile da Admin' },
    ];
    grid.innerHTML = kpis.map(function (k) {
      return `<div class="admin-kpi-card">
        <span class="admin-kpi-card__lock" aria-hidden="true">🔒</span>
        <div class="admin-kpi-num ${k.cls}">${k.num}</div>
        <div class="admin-kpi-label">${k.label}</div>
        <div class="admin-kpi-sub">${k.sub}</div>
      </div>`;
    }).join('');
  }

  /* ----------------------------------------------------------
     RENDER TABELLA GESTIONE SEGRETERIA
     ---------------------------------------------------------- */

  function renderGestioneSegreteria() {
    const tbody = $('seg-mgmt-tbody');
    if (!tbody) return;

    tbody.innerHTML = UTENTI.map(function (u) {
      let ruoloBadge = '';
      let azioneBtn  = '';

      if (u.ruolo === 'segreteria') {
        ruoloBadge = `<span class="ruolo-badge ruolo-badge--segreteria">Segreteria</span>`;
        azioneBtn  = `<button class="btn-revoca" onclick="revocaruolo(${u.id})">Revoca Segreteria</button>`;
      } else if (u.ruolo === 'staff') {
        ruoloBadge = `<span class="ruolo-badge ruolo-badge--staff">Staff/Prof.</span>`;
        azioneBtn  = `<button class="btn-promuovi" onclick="promuoviSegreteria(${u.id})">Promuovi a Segreteria</button>`;
      } else {
        ruoloBadge = `<span class="ruolo-badge ruolo-badge--genitore">Genitore</span>`;
        azioneBtn  = `<button class="btn-non-appl" disabled>Non applicabile</button>`;
      }

      const statoCls = u.stato === 'attivo' ? 'stato-dot--attivo' : 'stato-dot--non-attivo';
      const statoLabel = u.stato === 'attivo' ? 'Attiva' : 'Non attivo';

      return `<tr>
        <td>
          <div class="u-cell-sm">
            <span class="u-cell-sm__name">${u.nome}</span>
            <span class="u-cell-sm__email">${u.email}</span>
          </div>
        </td>
        <td>${ruoloBadge}</td>
        <td><span class="stato-dot ${statoCls}">${statoLabel}</span></td>
        <td>${azioneBtn}</td>
      </tr>`;
    }).join('');
  }

  /* ----------------------------------------------------------
     RENDER TABELLA UTENTI — sola lettura
     ---------------------------------------------------------- */

  function renderUtenti() {
    const tbody = $('admin-utenti-tbody');
    if (!tbody) return;

    tbody.innerHTML = UTENTI.map(function (u) {
      let ruoloBadge = '';
      if (u.ruolo === 'segreteria') ruoloBadge = `<span class="ruolo-badge ruolo-badge--segreteria">Segreteria</span>`;
      else if (u.ruolo === 'staff') ruoloBadge = `<span class="ruolo-badge ruolo-badge--staff">Staff/Prof.</span>`;
      else ruoloBadge = `<span class="ruolo-badge ruolo-badge--genitore">Genitore</span>`;

      const statoCls   = u.stato === 'attivo' ? 'stato-dot--attivo' : 'stato-dot--non-attivo';
      const statoLabel = u.stato === 'attivo' ? '● Attivo' : '● Non verificato';

      // Azione: solo Revoca/Promuovi per segreteria/staff
      let azione = '';
      if (u.ruolo === 'segreteria') {
        azione = `<button class="btn-revoca" onclick="revocaruolo(${u.id})">Revoca</button>`;
      } else if (u.ruolo === 'staff') {
        azione = `<button class="btn-promuovi" onclick="promuoviSegreteria(${u.id})">Promuovi</button>`;
      } else {
        azione = `<span class="btn-non-appl" style="display:inline-block;">🔒 Solo lettura</span>`;
      }

      return `<tr>
        <td style="font-weight:600;">${u.nome}</td>
        <td style="color:var(--color-text-secondary);font-size:var(--text-xs);">${u.email}</td>
        <td>${ruoloBadge}</td>
        <td><span class="stato-dot ${statoCls}" style="font-size:var(--text-xs);">${statoLabel}</span></td>
        <td style="color:var(--color-text-muted);font-size:var(--text-xs);">${u.iscrizioni || '—'}</td>
        <td>${azione}</td>
      </tr>`;
    }).join('');
  }

  /* ----------------------------------------------------------
     RENDER EVENTI — sola lettura
     ---------------------------------------------------------- */

  function renderEventi() {
    const list = $('admin-eventi-list');
    if (!list) return;

    list.innerHTML = EVENTI.map(function (ev) {
      const typeLabel = ev.tipo === 'open_day' ? 'Open Day' : 'Cardano Day';
      const typeCls   = ev.tipo === 'open_day' ? 'evento-type-pill--openday' : 'evento-type-pill--cardano';
      const statoCls  = 'admin-evento-stato--' + ev.stato;
      const statoLabel = ev.stato === 'attivo' ? 'Attivo' : ev.stato === 'attesa' ? 'In attesa' : '+ Bozza';

      return `<div class="admin-evento-row">
        <span class="evento-type-pill ${typeCls}">${typeLabel}</span>
        <div class="admin-evento-info">
          <div class="admin-evento-date">${ev.data}</div>
          <div class="admin-evento-sub">${ev.sub}</div>
        </div>
        <span class="admin-evento-stato ${statoCls}">${statoLabel}</span>
        <span class="admin-lock-icon" aria-hidden="true">🔒</span>
      </div>`;
    }).join('');
  }

  /* ----------------------------------------------------------
     AZIONI ADMIN — unico permesso: promuovi/revoca segreteria
     ---------------------------------------------------------- */

  window.promuoviSegreteria = function (id) {
    const u = UTENTI.find(function (u) { return u.id === id; });
    if (!u || u.ruolo !== 'staff') return;

    if (!confirm(`Promuovere ${u.nome} al ruolo Segreteria?\n\nAvrà accesso completo: eventi, utenti, statistiche, divisione gruppi.`)) return;

    u.ruolo = 'segreteria';
    renderGestioneSegreteria();
    renderUtenti();
    alert(`✓ ${u.nome} è ora Segreteria.\n(in produzione: PUT /api/admin/?action=set_segreteria)`);
  };

  window.revocaruolo = function (id) {
    const u = UTENTI.find(function (u) { return u.id === id; });
    if (!u || u.ruolo !== 'segreteria') return;

    const altreSegreterie = UTENTI.filter(function (u2) {
      return u2.ruolo === 'segreteria' && u2.id !== id;
    });

    if (altreSegreterie.length === 0) {
      alert('Attenzione: non puoi revocare l\'unica segreteria attiva.\nDevono esserci almeno 2 segreterie per revocare una.');
      return;
    }

    if (!confirm(`Revocare il ruolo Segreteria a ${u.nome}?\n\nTornerà al ruolo Staff/Professore.`)) return;

    u.ruolo = 'staff';
    renderGestioneSegreteria();
    renderUtenti();
    alert(`✓ Ruolo Segreteria revocato a ${u.nome}.\n(in produzione: PUT /api/admin/?action=set_segreteria)`);
  };

  /* ----------------------------------------------------------
     NAVIGAZIONE SEZIONI
     ---------------------------------------------------------- */

  function showSection(name) {
    document.querySelectorAll('[data-section]').forEach(function (el) {
      el.style.display = el.dataset.section === name ? 'block' : 'none';
    });
    document.querySelectorAll('.seg-nav-link[data-nav]').forEach(function (el) {
      el.classList.toggle('seg-nav-link--active', el.dataset.nav === name);
    });
  }

  window.showSection = showSection;

  /* ----------------------------------------------------------
     INIT
     ---------------------------------------------------------- */

  document.addEventListener('DOMContentLoaded', function () {
    // Topbar
    const nameEl = $('topbar-user-name');
    if (nameEl) nameEl.textContent = UTENTE_ADMIN.nome + ' ' + UTENTE_ADMIN.cognome;
    const initEl = $('topbar-avatar');
    if (initEl) initEl.textContent = UTENTE_ADMIN.initials;

    renderKPI();
    renderGestioneSegreteria();
    renderEventi();
    renderUtenti();

    // Nav sidebar
    document.querySelectorAll('.seg-nav-link[data-nav]').forEach(function (el) {
      el.addEventListener('click', function () { showSection(el.dataset.nav); });
    });

    // Sidebar mobile
    const toggle  = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.seg-sidebar');
    if (toggle && sidebar) {
      toggle.addEventListener('click', function () { sidebar.classList.toggle('is-open'); });
      document.addEventListener('click', function (e) {
        if (!sidebar.contains(e.target) && !toggle.contains(e.target)) sidebar.classList.remove('is-open');
      });
    }
    function updateToggle() { if (toggle) toggle.style.display = window.innerWidth <= 900 ? 'block' : 'none'; }
    updateToggle();
    window.addEventListener('resize', updateToggle);

    showSection('dashboard');
  });

})();
