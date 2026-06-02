/**
 * area-genitore.js — Logica area personale genitore
 * Sistema Cardano Day · ITIS G. Cardano, Pavia
 *
 * Gestisce:
 *  - Dati mock (sostituibili con fetch JWT)
 *  - Render dashboard KPI, figli, iscrizioni
 *  - Render pagina QR code
 *  - Sidebar mobile toggle
 *  - Navigazione tra sezioni via hash
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     DATI MOCK — in produzione: fetch con JWT
     ---------------------------------------------------------- */

  const UTENTE = {
    nome: 'Mario',
    cognome: 'Rossi',
    email: 'mario.rossi@email.it',
    initials: 'MR',
  };

  const FIGLI = [
    {
      id: 1,
      nome: 'Laura',
      cognome: 'Rossi',
      initials: 'LR',
      colorClass: '',
      scuola: 'SC. Media G. Pascoli',
      citta: 'Pavia',
      iscrizioni_attive: 2,
      modificabile: false,   // ha iscrizioni attive
    },
    {
      id: 2,
      nome: 'Andrea',
      cognome: 'Rossi',
      initials: 'AR',
      colorClass: 'figlio-card__avatar--orange',
      scuola: 'SC. Media Mazzini',
      citta: 'Vigevano',
      iscrizioni_attive: 1,
      modificabile: true,
    },
  ];

  const ISCRIZIONI = [
    {
      id: 1,
      tipo: 'cardano_day',
      titolo: 'Cardano Day — 24 Novembre 2026',
      figlio: 'Laura Rossi',
      data_conferma: '3 nov 2026',
      stato: 'CONFERMATA',
      laboratori: [
        { badge: 'E1', badgeCls: 'lab-badge',        nome: 'Elettronica', orario: '8:30–10:30' },
        { badge: 'C2', badgeCls: 'lab-badge--purple', nome: 'Chimica',     orario: '11:00–13:00' },
      ],
      // Cardano Day: 4 firme (Entrata, Lab T1, Lab T2, Uscita)
      firme: [true, true, false, false],
      qr_code: 'a3f8c2d1e6b4927f\n3c8e5a1b9d7f4e2c',
    },
    {
      id: 2,
      tipo: 'open_day',
      titolo: 'Open Day — 18 Novembre 2026',
      figlio: 'Andrea Rossi',
      data_conferma: '5 nov 2026',
      stato: 'CONFERMATA',
      percorso: 'Tecnico',
      gruppo: 'T2',
      // Open Day: nessuna firma QR
      qr_code: 'b7d4f1a9c3e8205b\n6f2d8a4c1e7b3f9d',
    },
  ];

  /* ----------------------------------------------------------
     UTILITY
     ---------------------------------------------------------- */

  function $(id) { return document.getElementById(id); }

  function firmeHTML(firme) {
    const labels = ['Entrata', 'Lab T1', 'Lab T2', 'Uscita'];
    let dots = '', line = '', lbls = '';
    firme.forEach(function (done, i) {
      dots += `<div class="firma-dot ${done ? 'firma-dot--done' : 'firma-dot--pending'}">${done ? '✓' : ''}</div>`;
      if (i < firme.length - 1) {
        line += `<div class="firma-line ${done ? 'firma-line--done' : ''}"></div>`;
      }
      lbls += `<span class="firma-label">${labels[i]}</span>`;
    });
    return `<div class="firme-row">${dots + line}</div>
            <div class="firme-labels">${lbls}</div>`;
  }

  function laboriHTML(labs) {
    return labs.map(function (l) {
      return `<div class="lab-slot">
        <div class="lab-badge ${l.badgeCls}">${l.badge}</div>
        <span class="lab-slot__time">${l.orario}</span>
      </div>`;
    }).join('');
  }

  /* ----------------------------------------------------------
     RENDER HELPERS
     ---------------------------------------------------------- */

  function renderKPI() {
    const kpiData = [
      { icon: '👨‍👧', num: FIGLI.length,                            label: 'Figli registrati' },
      { icon: '✅', num: ISCRIZIONI.length,                        label: 'Iscrizioni attive' },
      { icon: '📅', num: 4,                                        label: 'Eventi disponibili' },
      { icon: '📱', num: ISCRIZIONI.length,                        label: 'QR pronti' },
    ];
    const grid = $('kpi-grid');
    if (!grid) return;
    grid.innerHTML = kpiData.map(function (k) {
      return `<div class="kpi-card">
        <div class="kpi-card__icon">${k.icon}</div>
        <div>
          <div class="kpi-card__num">${k.num}</div>
          <div class="kpi-card__label">${k.label}</div>
        </div>
      </div>`;
    }).join('');
  }

  function renderFigli(containerId) {
    const el = $(containerId);
    if (!el) return;
    el.innerHTML = FIGLI.map(function (f) {
      const statoHtml = f.modificabile
        ? `<span class="status-pill status-pill--green">✓ Modificabile</span>`
        : `<span class="status-pill status-pill--warning">⚠ Ha iscrizioni attive — modifica limitata</span>`;
      return `<div class="figlio-card">
        <div class="figlio-card__top">
          <div class="figlio-card__avatar ${f.colorClass}">${f.initials}</div>
          <div class="figlio-card__info">
            <div class="figlio-card__name">${f.nome} ${f.cognome}</div>
            <div class="figlio-card__school">📍 ${f.scuola} — ${f.citta}</div>
          </div>
        </div>
        <div class="figlio-card__status">
          ${statoHtml}
          ${f.iscrizioni_attive ? `<span style="font-size:var(--text-xs);color:var(--color-text-muted)">✓ ${f.iscrizioni_attive} iscrizioni attive</span>` : ''}
        </div>
        <div class="figlio-card__actions">
          <button class="btn-iscrivilo" onclick="goToIscrizione(${f.id})">Iscrivilo</button>
          <button class="btn-modifica"  onclick="goToModificaFiglio(${f.id})">✏ Modifica</button>
        </div>
      </div>`;
    }).join('');
  }

  function renderIscrizioni(containerId) {
    const el = $(containerId);
    if (!el) return;
    el.innerHTML = ISCRIZIONI.map(function (isc) {
      const isOpenDay = isc.tipo === 'open_day';
      const typeBadge = isOpenDay
        ? `<span class="iscrizione-card__type-badge iscrizione-card__type-badge--openday">Open Day</span>`
        : `<span class="iscrizione-card__type-badge iscrizione-card__type-badge--cardano">Cardano Day</span>`;

      const detailHtml = isOpenDay
        ? `<div class="iscrizione-card__detail-label">Percorso scelto</div>
           <div class="iscrizione-card__labs">
             <span class="lab-badge lab-badge--orange" style="width:auto;padding:0 8px;border-radius:4px;font-size:11px;">${isc.percorso}</span>
             &nbsp; Gruppo assegnato: <strong>${isc.gruppo}</strong>
           </div>`
        : `<div class="iscrizione-card__detail-label">Laboratori scelti</div>
           <div class="iscrizione-card__labs">${isc.laboratori.map(function(l){ return l.nome; }).join(' + ')}</div>
           ${laboriHTML(isc.laboratori)}`;

      // Firme solo per Cardano Day
      const firmeSection = !isOpenDay
        ? `<div class="iscrizione-card__detail-label" style="margin-top:var(--space-3)">Stato firme</div>
           ${firmeHTML(isc.firme)}`
        : '';

      return `<div class="iscrizione-card">
        <div class="iscrizione-card__header">
          <div>
            ${typeBadge}
            <div class="iscrizione-card__title" style="margin-top:var(--space-2)">${isc.titolo}</div>
            <div class="iscrizione-card__meta">👤 ${isc.figlio} · Iscrizione confermata il ${isc.data_conferma}</div>
          </div>
          <span class="status-pill status-pill--green">● ${isc.stato}</span>
        </div>
        <div class="iscrizione-card__body">
          <div>
            ${detailHtml}
            ${firmeSection}
          </div>
          <div class="iscrizione-card__qr">
            <div class="qr-preview">QR<br>CODE</div>
            <button class="btn-scarica-qr" onclick="downloadQR(${isc.id})">⬇ Scarica QR</button>
            <button class="btn-annulla" onclick="cancelIscrizione(${isc.id})">Annulla iscrizione</button>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  function renderQRPage() {
    const banner = $('qr-banner');
    if (banner) {
      banner.innerHTML = `
        <div class="qr-sent-banner">
          <div class="qr-sent-banner__icon">✅</div>
          <div>
            <div class="qr-sent-banner__title">QR Code inviati via email!</div>
            <div class="qr-sent-banner__text">
              I QR code sono stati inviati a <strong>${UTENTE.email}</strong> dopo la conferma dell'iscrizione.
              Puoi anche scaricarli da qui in qualsiasi momento.
            </div>
          </div>
        </div>`;
    }

    const grid = $('qr-grid');
    if (!grid) return;
    grid.innerHTML = ISCRIZIONI.map(function (isc) {
      const isOpenDay = isc.tipo === 'open_day';
      const typeClass = isOpenDay ? 'qr-card__event-type--openday' : 'qr-card__event-type--cardano';
      const typeLabel = isOpenDay ? 'Open Day' : 'Cardano Day';

      const detailHtml = isOpenDay
        ? `<div class="qr-card__info-label">Percorso e Gruppo</div>
           <div class="qr-card__info-value">
             <span class="lab-badge lab-badge--orange" style="width:auto;padding:0 8px;border-radius:4px">${isc.percorso}</span>
             &nbsp; <strong>${isc.gruppo}</strong>
           </div>`
        : `<div class="qr-card__info-label">Laboratori assegnati</div>
           <div class="qr-card__info-value">${isc.laboratori.map(function(l){ return `<span class="lab-badge ${l.badgeCls}" style="display:inline-flex;margin-right:4px">${l.badge}</span>`; }).join('')}</div>`;

      // Per Open Day: nessuna firma, solo messaggio "evento non ancora iniziato"
      // Per Cardano Day: mostra se nessuna firma registrata
      const notYetBanner = (isOpenDay || isc.firme.every(function(f){ return !f; }))
        ? `<div class="alert alert--warning" style="margin-top:var(--space-3)">
            ⚠ L'evento non è ancora iniziato — il QR è pronto per il giorno dell'evento
           </div>`
        : '';

      return `<div class="qr-card">
        <div class="qr-card__header">
          <span class="qr-card__event-type ${typeClass}">${typeLabel}</span>
          <span class="status-pill status-pill--green">● Confermata</span>
        </div>
        <div class="qr-card__body">
          <div>
            <div class="qr-card__image">QR<br>CODE</div>
            <div class="qr-card__code">${isc.qr_code}</div>
          </div>
          <div>
            <div class="qr-card__info-label">Figlio</div>
            <div class="qr-card__info-value">${isc.figlio}</div>
            ${detailHtml}
            ${!isOpenDay ? `<div class="qr-card__info-label" style="margin-top:var(--space-3)">Stato firme</div>${firmeHTML(isc.firme)}` : ''}
            ${notYetBanner}
          </div>
        </div>
        <div class="qr-card__actions">
          <button class="btn-action btn-action--orange" onclick="downloadQR(${isc.id}, 'png')">⬇ Scarica PNG</button>
          <button class="btn-action btn-action--dark"   onclick="downloadQR(${isc.id}, 'pdf')">⬇ Scarica PDF</button>
          <button class="btn-action btn-action--outline" onclick="sendQREmail(${isc.id})">✉ Invia email</button>
        </div>
        <button class="btn-stampa" onclick="printQR(${isc.id})">🖨 Stampa</button>
      </div>`;
    }).join('');

    // "Come usare il QR" — solo per Cardano Day (ha le 4 firme)
    const howSection = $('qr-how-section');
    const how = $('qr-how-grid');
    const hasCardano = ISCRIZIONI.some(function (i) { return i.tipo === 'cardano_day'; });

    if (howSection) howSection.style.display = hasCardano ? 'block' : 'none';
    if (!how || !hasCardano) return;

    const steps = [
      { icon: '🚪', title: 'Firma 1 — Entrata',    text: 'Mostra il QR allo staff all\'ingresso principale alle 8:00–8:30' },
      { icon: '🔬', title: 'Firma 2 — Lab Turno 1', text: 'Scansione alla porta del laboratorio assegnato (es. E1, I2)' },
      { icon: '⚙️', title: 'Firma 3 — Lab Turno 2', text: 'Seconda scansione per il laboratorio del turno pomeridiano' },
      { icon: '🏁', title: 'Firma 4 — Uscita',      text: 'Scansione finale all\'uscita per registrare la fine della giornata' },
    ];
    how.innerHTML = steps.map(function (s) {
      return `<div class="qr-how-card">
        <div class="qr-how-card__icon">${s.icon}</div>
        <div class="qr-how-card__title">${s.title}</div>
        <div class="qr-how-card__text">${s.text}</div>
      </div>`;
    }).join('');
  }

  /* ----------------------------------------------------------
     NAVIGAZIONE SEZIONI
     ---------------------------------------------------------- */

  function showSection(name) {
    document.querySelectorAll('[data-section]').forEach(function (el) {
      el.style.display = el.dataset.section === name ? 'block' : 'none';
    });
    document.querySelectorAll('.sidebar__link').forEach(function (el) {
      el.classList.toggle('sidebar__link--active', el.dataset.nav === name);
    });

    // Render on demand
    if (name === 'dashboard') {
      renderKPI();
      renderFigli('figli-grid-dash');
      renderIscrizioni('iscrizioni-list');
    }
    if (name === 'figli') {
      renderFigli('figli-grid-page');
    }
    if (name === 'qr') {
      renderQRPage();
    }

    // Chiudi sidebar mobile
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.remove('is-open');
  }

  /* ----------------------------------------------------------
     AZIONI PUBBLICHE (onclick inline)
     ---------------------------------------------------------- */

  window.goToIscrizione        = function (id) { window.location.href = 'iscrizione-openday.html?figlio=' + id; };
  window.goToModificaFiglio    = function (id) { showSection('figli'); };
  window.downloadQR            = function (id, fmt) { alert('Download QR #' + id + (fmt ? ' .' + fmt : '') + '\n(in produzione: GET /api/qr/?action=download&id=' + id + ')'); };
  window.sendQREmail           = function (id) { alert('Email QR inviata!\n(in produzione: POST /api/qr/?action=email&id=' + id + ')'); };
  window.printQR               = function (id) { window.print(); };
  window.cancelIscrizione      = function (id) {
    if (confirm('Sei sicuro di voler annullare questa iscrizione?')) {
      alert('Iscrizione annullata.\n(in produzione: DELETE /api/registrations/?id=' + id + ')');
    }
  };

  /* ----------------------------------------------------------
     SIDEBAR MOBILE TOGGLE
     ---------------------------------------------------------- */

  function initSidebarToggle() {
    const btn     = $('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (!btn || !sidebar) return;

    btn.addEventListener('click', function () {
      sidebar.classList.toggle('is-open');
    });

    document.addEventListener('click', function (e) {
      if (!sidebar.contains(e.target) && !btn.contains(e.target)) {
        sidebar.classList.remove('is-open');
      }
    });
  }

  /* ----------------------------------------------------------
     SIDEBAR LINK CLICK
     ---------------------------------------------------------- */

  function initSidebarNav() {
    document.querySelectorAll('.sidebar__link[data-nav]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        showSection(el.dataset.nav);
      });
    });
  }

  /* ----------------------------------------------------------
     TOPBAR: nome utente
     ---------------------------------------------------------- */

  function initTopbar() {
    const nameEl = $('topbar-user-name');
    const initEl = $('topbar-avatar');
    if (nameEl) nameEl.textContent = UTENTE.nome + ' ' + UTENTE.cognome;
    if (initEl) initEl.textContent = UTENTE.initials;

    const logoutBtn = $('topbar-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        if (confirm('Vuoi uscire dall\'area personale?')) {
          // localStorage.removeItem('jwt');
          window.location.href = 'index.html';
        }
      });
    }
  }

  /* ----------------------------------------------------------
     INIT
     ---------------------------------------------------------- */

  document.addEventListener('DOMContentLoaded', function () {
    initTopbar();
    initSidebarToggle();
    initSidebarNav();

    // Sezione iniziale da hash URL oppure dashboard
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    showSection(hash);
  });

})();
