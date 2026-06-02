/**
 * segreteria.js — Logica pannello segreteria
 * Sistema Cardano Day · ITIS G. Cardano, Pavia
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     DATI MOCK
     ---------------------------------------------------------- */

  const UTENTE = { nome: 'Giulia', cognome: 'Ferrari', initials: 'GF' };

  const EVENTI = [
    {
      id: 1, tipo: 'open_day', titolo: 'Open Day',
      data: '18 Nov 2026', iscrizioni: 87, max: 120,
      stato: 'aperte', gruppi: 'Non eseguita', pubblicato: true,
    },
    {
      id: 2, tipo: 'cardano_day', titolo: 'Cardano Day',
      data: '24 Nov 2026', iscrizioni: 158, max: 300,
      stato: 'aperte', gruppi: 'Eseguita', pubblicato: true,
    },
    {
      id: 3, tipo: 'open_day', titolo: 'Open Day',
      data: '18 Dic 2026', iscrizioni: 0, max: 120,
      stato: 'non_ancora', gruppi: '—', pubblicato: true,
    },
    {
      id: 4, tipo: 'cardano_day', titolo: 'Cardano Day',
      data: '13 Gen 2027', iscrizioni: 0, max: 300,
      stato: 'non_ancora', gruppi: '—', pubblicato: false,
    },
  ];

  const APPROVAZIONI = [
    {
      id: 1, nome: 'Marco', cognome: 'Bianchi', initials: 'MB',
      ruolo: 'staff', email: 'm.bianchi@itiscardanopv.edu.it',
      data: '6 nov 2026 ore 14:23',
    },
    {
      id: 2, nome: 'Sara', cognome: 'Verdi', initials: 'SV',
      ruolo: 'professore', email: 's.verdi@itiscardanopv.edu.it',
      data: '7 nov 2026 ore 9:11',
    },
  ];

  const LAB_STATS = {
    evento: 'Cardano Day 24 Nov',
    t1: [
      { nome: 'Informatica (I1, I2)', usati: 46, max: 50 },
      { nome: 'Meccanica (M1)',        usati: 22, max: 25 },
      { nome: 'Elettronica (E1)',      usati: 18, max: 25 },
      { nome: 'Chimica (C1)',          usati: 20, max: 25 },
      { nome: 'Liceo Sc. Appl. (L1)', usati: 23, max: 25 },
    ],
    t2: [
      { nome: 'Informatica (I2)',       usati: 22, max: 25 },
      { nome: 'Meccanica (M1, M2)',     usati: 44, max: 50 },
      { nome: 'Elettronica (E2)',       usati: 19, max: 25 },
      { nome: 'Chimica (C2)',           usati: 24, max: 25 },
      { nome: 'Liceo Sc. Appl. (L2)',   usati: 21, max: 25 },
    ],
  };

  /* ----------------------------------------------------------
     UTILITY
     ---------------------------------------------------------- */

  function $(id) { return document.getElementById(id); }

  function pct(used, max) { return Math.round((used / max) * 100); }

  function progressCls(p) {
    if (p >= 100) return 'seg-progress__fill--full';
    if (p >= 85)  return 'seg-progress__fill--warn';
    return '';
  }

  /* ----------------------------------------------------------
     RENDER KPI
     ---------------------------------------------------------- */

  function renderKPI() {
    const el = $('kpi-grid');
    if (!el) return;
    const kpis = [
      { num: 387,  cls: 'seg-kpi-num--orange', label: 'Iscrizioni totali',      sub: 'Tutti gli eventi' },
      { num: 342,  cls: 'seg-kpi-num--green',  label: 'Confermate',             sub: '88,4% del totale' },
      { num: 214,  cls: 'seg-kpi-num--black',  label: 'Presenze registrate',    sub: 'Con QR scansionato' },
      { num: 48,   cls: 'seg-kpi-num--blue',   label: 'Utenti attivi',          sub: 'Genitori + Staff' },
      { num: APPROVAZIONI.length, cls: 'seg-kpi-num--red', label: 'Approvazioni in attesa', sub: 'Richieste Staff/Prof' },
    ];
    el.innerHTML = kpis.map(function (k) {
      return `<div class="seg-kpi-card">
        <div class="seg-kpi-num ${k.cls}">${k.num}</div>
        <div class="seg-kpi-label">${k.label}</div>
        <div class="seg-kpi-sub">${k.sub}</div>
      </div>`;
    }).join('');
  }

  /* ----------------------------------------------------------
     RENDER TABELLA EVENTI
     ---------------------------------------------------------- */

  function renderEventi() {
    const el = $('eventi-tbody');
    if (!el) return;
    el.innerHTML = EVENTI.map(function (ev) {
      const typeBadge = ev.tipo === 'open_day'
        ? `<span class="event-type-badge event-type-badge--openday">Open Day</span>`
        : `<span class="event-type-badge event-type-badge--cardano">Cardano Day</span>`;

      const statoCls = ev.stato === 'aperte' ? 'aperte' : ev.stato === 'chiuse' ? 'chiuse' : 'attesa';
      const statoLabel = ev.stato === 'aperte' ? 'Aperte' : ev.stato === 'chiuse' ? 'Chiuse' : 'Non ancora aperte';

      const p = pct(ev.iscrizioni, ev.max);
      const progress = `<div class="seg-progress">
        <div class="seg-progress__bar">
          <div class="seg-progress__fill ${progressCls(p)}" style="width:${p}%"></div>
        </div>
        <span class="seg-progress__text">${ev.iscrizioni}/${ev.max}</span>
      </div>`;

      const gruppiHtml = ev.gruppi === 'Eseguita'
        ? `<span style="color:var(--color-success);font-size:var(--text-xs);font-weight:600;">✓ Eseguita</span>`
        : ev.gruppi === 'Non eseguita'
        ? `<span style="color:var(--color-text-muted);font-size:var(--text-xs);">Non eseguita</span>`
        : `<span style="color:var(--color-text-muted);font-size:var(--text-xs);">—</span>`;

      const pubHtml = ev.pubblicato
        ? `<span class="pub-badge pub-badge--yes">✓ Sì</span>`
        : `<span class="pub-badge pub-badge--no">Bozza</span>`;

      // Azioni contestuali
      let azioni = '';
      if (ev.stato === 'aperte' && ev.gruppi === 'Non eseguita') {
        azioni = `<button class="seg-btn seg-btn--dark" onclick="dividiGruppi(${ev.id})">Dividi</button>
                  <button class="seg-btn seg-btn--outline" onclick="exportEvento(${ev.id})">Export</button>`;
      } else if (ev.gruppi === 'Eseguita') {
        azioni = `<button class="seg-btn seg-btn--outline" onclick="dividiGruppi(${ev.id})">Riesegui</button>
                  <button class="seg-btn seg-btn--outline" onclick="exportEvento(${ev.id})">Export</button>`;
      } else if (!ev.pubblicato) {
        azioni = `<button class="seg-btn seg-btn--green" onclick="pubblicaEvento(${ev.id})">Pubblica</button>`;
      }
      azioni += `<button class="seg-btn seg-btn--icon" onclick="editEvento(${ev.id})" title="Modifica">✏️</button>
                 <button class="seg-btn seg-btn--danger" onclick="deleteEvento(${ev.id})" title="Elimina">🗑</button>`;

      return `<tr>
        <td>${typeBadge}</td>
        <td style="font-weight:600;">${ev.data}</td>
        <td>${progress}</td>
        <td><span class="stato-dot stato-dot--${statoCls}">${statoLabel}</span></td>
        <td>${gruppiHtml}</td>
        <td>${pubHtml}</td>
        <td><div class="seg-row-actions">${azioni}</div></td>
      </tr>`;
    }).join('');
  }

  /* ----------------------------------------------------------
     RENDER APPROVAZIONI
     ---------------------------------------------------------- */

  function renderApprovazioni() {
    const el = $('approv-list');
    if (!el) return;

    // Badge contatore
    const badge = $('approv-count');
    if (badge) badge.textContent = APPROVAZIONI.length + ' richieste';

    if (APPROVAZIONI.length === 0) {
      el.innerHTML = `<div style="padding:var(--space-6);text-align:center;color:var(--color-text-muted);font-size:var(--text-sm);">
        Nessuna approvazione in attesa
      </div>`;
      return;
    }

    el.innerHTML = APPROVAZIONI.map(function (a) {
      const roleCls   = a.ruolo === 'staff' ? 'approv-role-badge--staff' : 'approv-role-badge--prof';
      const roleLabel = a.ruolo === 'staff' ? 'Staff' : 'Professore';
      return `<div class="approv-item" data-approv-id="${a.id}">
        <div class="approv-avatar">${a.initials}</div>
        <div class="approv-info">
          <div class="approv-name">
            ${a.nome} ${a.cognome}
            <span class="approv-role-badge ${roleCls}">${roleLabel}</span>
          </div>
          <div class="approv-email">${a.email}</div>
          <div class="approv-date">Richiesta: ${a.data}</div>
        </div>
        <div class="approv-actions">
          <button class="btn-approva" onclick="approvaUtente(${a.id})">✓ Approva</button>
          <button class="btn-rifiuta" onclick="rifiutaUtente(${a.id})">✗ Rifiuta</button>
        </div>
      </div>`;
    }).join('');
  }

  /* ----------------------------------------------------------
     RENDER DIVIDI GRUPPI WIDGET
     ---------------------------------------------------------- */

  function renderDividiWidget() {
    const percorsi = [
      { nome: 'Percorso Misto',        iscritti: 32 },
      { nome: 'Percorso Liceo Sc. Appl.', iscritti: 28 },
      { nome: 'Percorso Tecnico',      iscritti: 27 },
    ];

    const el = $('dividi-percorsi');
    if (el) {
      el.innerHTML = percorsi.map(function (p) {
        return `<div class="dividi-percorso-row">
          <span>${p.nome}</span>
          <span class="dividi-percorso-count">${p.iscritti} iscritti</span>
        </div>`;
      }).join('');
    }
  }

  /* ----------------------------------------------------------
     RENDER STATISTICHE LABORATORI
     ---------------------------------------------------------- */

  function renderLabStats() {
    const title = $('lab-stats-title');
    if (title) title.textContent = 'Statistiche laboratori — ' + LAB_STATS.evento;

    function renderTurno(rows, containerId) {
      const el = $(containerId);
      if (!el) return;
      el.innerHTML = rows.map(function (r) {
        const p = pct(r.usati, r.max);
        const cls = p >= 100 ? 'lab-stat-row__fill--full' : p >= 85 ? 'lab-stat-row__fill--warn' : '';
        return `<div class="lab-stat-row">
          <span class="lab-stat-row__name">${r.nome}</span>
          <div class="lab-stat-row__bar">
            <div class="lab-stat-row__fill ${cls}" style="width:${p}%"></div>
          </div>
          <span class="lab-stat-row__count">${r.usati}/${r.max}</span>
        </div>`;
      }).join('');
    }

    renderTurno(LAB_STATS.t1, 'lab-stats-t1');
    renderTurno(LAB_STATS.t2, 'lab-stats-t2');
  }

  /* ----------------------------------------------------------
     AZIONI PUBBLICHE
     ---------------------------------------------------------- */

  window.approvaUtente = function (id) {
    if (!confirm('Approvare questo utente?')) return;
    const el = document.querySelector(`[data-approv-id="${id}"]`);
    if (el) { el.style.opacity = '0.4'; el.style.pointerEvents = 'none'; }
    // In produzione: PUT /api/users/?action=approva&id=N
    setTimeout(function () {
      if (el) el.remove();
      alert('Utente approvato. Riceverà una email di conferma.');
    }, 500);
  };

  window.rifiutaUtente = function (id) {
    if (!confirm('Rifiutare questa richiesta?')) return;
    const el = document.querySelector(`[data-approv-id="${id}"]`);
    if (el) el.remove();
  };

  window.dividiGruppi = function (id) {
    window.location.href = 'divisione-gruppi.html?evento=' + id;
  };

  window.exportEvento = function (id) {
    alert('Download Excel — /api/registrations/?action=export&ev=' + id);
  };

  window.pubblicaEvento = function (id) {
    if (!confirm('Pubblicare questo evento?')) return;
    alert('Evento pubblicato! (PUT /api/events/?id=' + id + ')');
  };

  window.editEvento = function (id) {
    window.location.href = 'crea-evento.html?id=' + id;
  };

  window.deleteEvento = function (id) {
    if (!confirm('Eliminare questo evento? L\'operazione non può essere annullata.')) return;
    alert('Evento eliminato. (DELETE /api/events/?id=' + id + ')');
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
    if (name === 'dashboard') {
      renderKPI();
      renderEventi();
      renderApprovazioni();
      renderDividiWidget();
      renderLabStats();
    }
  }

  window.showSection = showSection;

  /* ----------------------------------------------------------
     DIVIDI GRUPPI — pulsante
     ---------------------------------------------------------- */

  function initDividiBtn() {
    const btn = $('btn-esegui-divisione');
    if (!btn) return;
    btn.addEventListener('click', async function () {
      const sel = $('dividi-select');
      const eventoId = sel ? sel.value : 1;
      btn.disabled = true;
      btn.classList.add('is-loading');
      // Simula esecuzione script Node.js
      await new Promise(function (r) { setTimeout(r, 1500); });
      btn.disabled = false;
      btn.classList.remove('is-loading');
      window.location.href = 'divisione-gruppi.html?evento=' + eventoId;
    });
  }

  /* ----------------------------------------------------------
     SIDEBAR MOBILE
     ---------------------------------------------------------- */

  function initSidebarToggle() {
    const btn     = $('sidebar-toggle');
    const sidebar = document.querySelector('.seg-sidebar');
    if (!btn || !sidebar) return;
    btn.addEventListener('click', function () { sidebar.classList.toggle('is-open'); });
    document.addEventListener('click', function (e) {
      if (!sidebar.contains(e.target) && !btn.contains(e.target)) {
        sidebar.classList.remove('is-open');
      }
    });
  }

  /* ----------------------------------------------------------
     INIT
     ---------------------------------------------------------- */

  document.addEventListener('DOMContentLoaded', function () {
    // Topbar utente
    const nameEl = $('topbar-user-name');
    if (nameEl) nameEl.textContent = UTENTE.nome + ' ' + UTENTE.cognome;
    const initEl = $('topbar-avatar');
    if (initEl) initEl.textContent = UTENTE.initials;

    // Nav sidebar
    document.querySelectorAll('.seg-nav-link[data-nav]').forEach(function (el) {
      el.addEventListener('click', function () { showSection(el.dataset.nav); });
    });

    initSidebarToggle();
    initDividiBtn();
    showSection('dashboard');
  });

})();

/* ----------------------------------------------------------
   ANNO SCOLASTICO — Override da segreteria
   ---------------------------------------------------------- */

function aggiornaDisplayAnno() {
  const el = document.getElementById('anno-corrente');
  const tipoEl = document.getElementById('anno-tipo');
  if (!el || typeof CONFIG === 'undefined') return;
  el.textContent = CONFIG.getAnno();
  if (tipoEl) {
    tipoEl.textContent = CONFIG.hasOverride()
      ? '⚙ Impostato manualmente'
      : '⟳ Calcolato automaticamente';
    tipoEl.style.color = CONFIG.hasOverride()
      ? 'var(--color-warning)'
      : 'var(--color-success)';
  }
}

window.salvaAnnoOverride = function () {
  const input = document.getElementById('anno-input');
  const feedback = document.getElementById('anno-feedback');
  if (!input || !feedback) return;

  const val = input.value.trim();

  // Validazione formato: AAAA–AA o AAAA-AA
  if (val && !/^\d{4}[\u2013\-]\d{2}$/.test(val)) {
    feedback.textContent = '⚠ Formato non valido. Usa: 2027–28';
    feedback.style.color = 'var(--color-danger)';
    feedback.style.display = 'block';
    return;
  }

  // Normalizza il trattino in en-dash
  const normalizzato = val.replace('-', '\u2013');
  CONFIG.setAnnoOverride(normalizzato || null);
  aggiornaDisplayAnno();

  feedback.textContent = val
    ? '✓ Anno scolastico impostato a ' + normalizzato
    : '✓ Reset eseguito — ora usa il calcolo automatico';
  feedback.style.color = 'var(--color-success)';
  feedback.style.display = 'block';

  setTimeout(function () { feedback.style.display = 'none'; }, 3000);
};

window.resetAnnoOverride = function () {
  CONFIG.setAnnoOverride(null);
  const input = document.getElementById('anno-input');
  if (input) input.value = '';
  aggiornaDisplayAnno();
  const feedback = document.getElementById('anno-feedback');
  if (feedback) {
    feedback.textContent = '✓ Reset — ora usa il calcolo automatico';
    feedback.style.color = 'var(--color-success)';
    feedback.style.display = 'block';
    setTimeout(function () { feedback.style.display = 'none'; }, 3000);
  }
};

// Aggiorna display quando si apre la sezione impostazioni
const _origShowSection = window.showSection;
window.showSection = function (name) {
  _origShowSection(name);
  if (name === 'impostazioni') aggiornaDisplayAnno();
};

/* ----------------------------------------------------------
   DROPDOWN CUSTOM — Dividi gruppi
   ---------------------------------------------------------- */

window.toggleDividiDropdown = function () {
  const dd = document.getElementById('dividi-dropdown');
  if (!dd) return;
  dd.classList.toggle('is-open');
  dd.setAttribute('aria-expanded', dd.classList.contains('is-open'));
};

window.selectDividiEvento = function (el) {
  const dd     = document.getElementById('dividi-dropdown');
  const label  = document.getElementById('dividi-dropdown-label');
  const menu   = document.getElementById('dividi-dropdown-menu');

  // Aggiorna selezione visiva
  if (menu) menu.querySelectorAll('.dividi-dropdown__item').forEach(function (i) {
    i.classList.remove('dividi-dropdown__item--active');
  });
  el.classList.add('dividi-dropdown__item--active');

  // Aggiorna testo selezionato
  if (label) {
    const tipo = el.querySelector('.dividi-dropdown__item-type').textContent;
    const data = el.textContent.replace(tipo, '').trim();
    label.textContent = tipo + ' — ' + data;
  }

  // Chiudi dropdown
  if (dd) { dd.classList.remove('is-open'); dd.setAttribute('aria-expanded', 'false'); }
};

// Chiudi dropdown cliccando fuori
document.addEventListener('click', function (e) {
  const dd = document.getElementById('dividi-dropdown');
  if (dd && !dd.contains(e.target)) {
    dd.classList.remove('is-open');
    dd.setAttribute('aria-expanded', 'false');
  }
});
