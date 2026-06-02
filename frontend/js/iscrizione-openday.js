/**
 * iscrizione-openday.js — Logica iscrizione Open Day
 * Sistema Cardano Day · ITIS G. Cardano, Pavia
 *
 * Step 1 — Evento       (già selezionato, mostrarlo)
 * Step 2 — Figlio e percorso
 * Step 3 — Riepilogo e conferma
 * Step 4 — QR Code ricevuto
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     DATI MOCK — sostituire con fetch JWT in produzione
     ---------------------------------------------------------- */

  const EVENTO = {
    id: 1,
    titolo: 'Open Day — Novembre 2026',
    data: { giorno: '18', mese: 'NOV' },
    location: 'ITIS G. Cardano, Pavia',
    tipo: 'Giornata orientamento',
    posti_disponibili: 87,
    chiusura: '10 nov ore 23:59',
  };

  const FIGLI = [
    {
      id: 1,
      nome: 'Laura',
      cognome: 'Rossi',
      initials: 'LR',
      avatarCls: '',
      scuola: 'SC. Media G. Pascoli',
      citta: 'Pavia',
    },
    {
      id: 2,
      nome: 'Andrea',
      cognome: 'Rossi',
      initials: 'AR',
      avatarCls: 'figlio-option__avatar--orange',
      scuola: 'SC. Media Mazzini',
      citta: 'Vigevano',
    },
  ];

  const PERCORSI = [
    {
      id: 1,
      codice: 'MISTO',
      nome: 'Percorso Misto',
      desc: 'Visita sia i laboratori tecnici che le aule scientifiche. Ideale per chi vuole esplorare tutte le possibilità dell\'istituto.',
      icon: '🎓',
      posti_disponibili: 28,
      posti_max: 60,
      esaurito: false,
    },
    {
      id: 2,
      codice: 'LICEO',
      nome: 'Liceo Sc. Appl.',
      desc: 'Focalizzato sulle scienze applicate, matematica avanzata e laboratori di fisica e chimica. Per chi ama le scienze pure.',
      icon: '🔬',
      posti_disponibili: 35,
      posti_max: 60,
      esaurito: false,
    },
    {
      id: 3,
      codice: 'TECNICO',
      nome: 'Percorso Tecnico',
      desc: 'Dedicato agli indirizzi tecnici: Informatica, Elettronica, Meccanica, Chimica. Per chi vuole un futuro professionale tecnico.',
      icon: '⚙️',
      posti_disponibili: 0,
      posti_max: 60,
      esaurito: true,
    },
  ];

  /* ----------------------------------------------------------
     STATO APPLICAZIONE
     ---------------------------------------------------------- */

  const state = {
    step: 2,           // partiamo dallo step 2 (evento già selezionato)
    figlio_id: null,
    percorso_id: null,
  };

  /* ----------------------------------------------------------
     UTILITY
     ---------------------------------------------------------- */

  function $(id) { return document.getElementById(id); }

  function setLoading(btn, on) {
    btn.disabled = on;
    btn.classList.toggle('is-loading', on);
  }

  function getFiglio()   { return FIGLI.find(function(f){ return f.id === state.figlio_id; }); }
  function getPercorso() { return PERCORSI.find(function(p){ return p.id === state.percorso_id; }); }

  /* ----------------------------------------------------------
     STEPPER UI
     ---------------------------------------------------------- */

  const STEPS = [
    { label: 'Evento',          sub: 'Selezionato' },
    { label: 'Figlio e percorso', sub: 'In corso' },
    { label: 'Riepilogo',       sub: 'Conferma' },
    { label: 'QR Code',         sub: 'Ricezione' },
  ];

  function updateStepper() {
    const container = $('iscrizione-stepper');
    if (!container) return;

    container.innerHTML = STEPS.map(function (s, i) {
      const n = i + 1;
      let cls = 'iscrizione-stepper__step--todo';
      let circle = String(n);
      if (n < state.step)       { cls = 'iscrizione-stepper__step--done';   circle = '✓'; }
      else if (n === state.step) { cls = 'iscrizione-stepper__step--active'; }

      // Aggiunge classe done al connettore dello step precedente
      const connectorCls = n < state.step ? 'iscrizione-stepper__step--done' : '';

      return `<div class="iscrizione-stepper__step ${cls} ${connectorCls}">
        <div class="iscrizione-stepper__circle">${circle}</div>
        <div class="iscrizione-stepper__label">
          <span class="iscrizione-stepper__label-main">${s.label}</span>
          <span class="iscrizione-stepper__label-sub">${n === state.step ? s.sub : (n < state.step ? 'Completato' : '')}</span>
        </div>
      </div>`;
    }).join('');
  }

  /* ----------------------------------------------------------
     RENDER STEP 2 — Figlio e percorso
     ---------------------------------------------------------- */

  function renderStep2() {
    // Figli
    const figliGrid = $('figli-select-grid');
    if (figliGrid) {
      figliGrid.innerHTML = FIGLI.map(function (f) {
        const sel = state.figlio_id === f.id ? 'figlio-option--selected' : '';
        return `<div class="figlio-option ${sel}" data-figlio-id="${f.id}" onclick="selectFiglio(${f.id})">
          <div class="figlio-option__avatar ${f.avatarCls}">${f.initials}</div>
          <div class="figlio-option__info">
            <div class="figlio-option__name">${f.nome} ${f.cognome}</div>
            <div class="figlio-option__school">📍 ${f.scuola} · ${f.citta}</div>
          </div>
          <div class="figlio-option__radio"></div>
        </div>`;
      }).join('');
    }

    // Percorsi
    const percorsiGrid = $('percorsi-grid');
    if (percorsiGrid) {
      percorsiGrid.innerHTML = PERCORSI.map(function (p) {
        const sel = state.percorso_id === p.id ? 'percorso-card--selected' : '';
        const esaurito = p.esaurito ? 'percorso-card--esaurito' : '';
        const pct = Math.round(((p.posti_max - p.posti_disponibili) / p.posti_max) * 100);
        const onclick = p.esaurito ? '' : `onclick="selectPercorso(${p.id})"`;

        return `<div class="percorso-card ${sel} ${esaurito}" ${onclick}>
          <div class="percorso-card__icon">${p.icon}</div>
          <div class="percorso-card__name">${p.nome}</div>
          <div class="percorso-card__desc">${p.desc}</div>
          <div class="percorso-card__footer">
            <div>
              <div class="percorso-card__posti-num">${p.esaurito ? 0 : p.posti_disponibili}</div>
              <div class="percorso-card__posti-label">posti disponibili</div>
            </div>
            <div class="percorso-card__occupati">${p.posti_max - p.posti_disponibili}/${p.posti_max}<br>occupati</div>
          </div>
          <div class="percorso-progress">
            <div class="percorso-progress__fill" style="width:${pct}%"></div>
          </div>
        </div>`;
      }).join('');
    }

    updateSidebarRiepilogo();
    updateBtnNext();
  }

  /* ----------------------------------------------------------
     RENDER STEP 3 — Riepilogo
     ---------------------------------------------------------- */

  function renderStep3() {
    const figlio   = getFiglio();
    const percorso = getPercorso();
    const container = $('riepilogo-rows');
    if (!container) return;

    const rows = [
      { label: 'Evento',           value: EVENTO.titolo + ' · ' + EVENTO.data.giorno + ' ' + EVENTO.data.mese },
      { label: 'Figlio',           value: figlio ? figlio.nome + ' ' + figlio.cognome : '—' },
      { label: 'Scuola',           value: figlio ? figlio.scuola + ' · ' + figlio.citta : '—' },
      { label: 'Percorso scelto',  value: percorso ? percorso.nome : '—', badge: percorso ? percorso.codice : null },
      { label: 'Gruppo assegnato', value: null, italic: 'Dopo divisione gruppi (email)' },
    ];

    container.innerHTML = rows.map(function (r) {
      let val = '';
      if (r.badge) {
        val = `<span style="background:var(--color-primary);color:#fff;padding:2px 10px;border-radius:4px;font-size:12px;font-weight:700;">${r.badge}</span>`;
      } else if (r.italic) {
        val = `<em>${r.italic}</em>`;
      } else {
        val = r.value || '—';
      }
      return `<div class="riepilogo-row">
        <span class="riepilogo-row__label">${r.label}</span>
        <span class="riepilogo-row__value">${val}</span>
      </div>`;
    }).join('');
  }

  /* ----------------------------------------------------------
     SIDEBAR RIEPILOGO (aggiornata ad ogni selezione)
     ---------------------------------------------------------- */

  function updateSidebarRiepilogo() {
    const figlio   = getFiglio();
    const percorso = getPercorso();

    const rows = [
      { label: 'Evento',     value: '18 Nov 2026 · Open Day' },
      { label: 'Figlio',     value: figlio ? figlio.nome + ' ' + figlio.cognome : null },
      { label: 'Percorso',   value: percorso ? percorso.nome : null },
      { label: 'Gruppo',     value: null, italic: 'Assegnato dopo chiusura' },
    ];

    const container = $('sidebar-riepilogo-rows');
    if (!container) return;

    container.innerHTML = rows.map(function (r) {
      return `<div class="sidebar-riepilogo__row">
        <span class="sidebar-riepilogo__label">${r.label}</span>
        <span class="sidebar-riepilogo__value">
          ${r.italic ? `<em>${r.italic}</em>` : (r.value || '<em style="color:var(--color-text-muted);font-weight:400">—</em>')}
        </span>
      </div>`;
    }).join('');
  }

  /* ----------------------------------------------------------
     ABILITA/DISABILITA pulsante avanti
     ---------------------------------------------------------- */

  function updateBtnNext() {
    const btn = $('btn-step-next');
    if (!btn) return;
    const ready = state.figlio_id !== null && state.percorso_id !== null;
    btn.disabled = !ready;
    btn.style.opacity = ready ? '1' : '0.5';
  }

  /* ----------------------------------------------------------
     SELEZIONI PUBBLICHE (onclick inline)
     ---------------------------------------------------------- */

  window.selectFiglio = function (id) {
    state.figlio_id = id;
    // Aggiorna UI figli
    document.querySelectorAll('.figlio-option').forEach(function (el) {
      const sel = parseInt(el.dataset.figlioId) === id;
      el.classList.toggle('figlio-option--selected', sel);
    });
    updateSidebarRiepilogo();
    updateBtnNext();
  };

  window.selectPercorso = function (id) {
    const p = PERCORSI.find(function(p){ return p.id === id; });
    if (p && p.esaurito) return;
    state.percorso_id = id;
    // Aggiorna UI percorsi
    document.querySelectorAll('.percorso-card:not(.percorso-card--esaurito)').forEach(function (el) {
      // cerca id dal onclick attr
    });
    renderStep2(); // re-render per aggiornare selezione visiva
  };

  /* ----------------------------------------------------------
     NAVIGAZIONE STEP
     ---------------------------------------------------------- */

  function goToStep(n) {
    // Nascondi tutti
    document.querySelectorAll('[data-step]').forEach(function (el) {
      el.style.display = 'none';
    });
    // Mostra step corrente
    const panel = document.querySelector('[data-step="' + n + '"]');
    if (panel) panel.style.display = 'block';

    state.step = n;
    updateStepper();

    // Scroll top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ----------------------------------------------------------
     PULSANTE AVANTI — step 2 → 3
     ---------------------------------------------------------- */

  function initBtnNext() {
    const btn = $('btn-step-next');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (!state.figlio_id || !state.percorso_id) return;
      renderStep3();
      goToStep(3);
    });
  }

  /* ----------------------------------------------------------
     PULSANTE CONFERMA — step 3 → 4
     ---------------------------------------------------------- */

  function initBtnConferma() {
    const btn = $('btn-step-conferma');
    if (!btn) return;

    btn.addEventListener('click', async function () {
      setLoading(btn, true);
      try {
        /* === PRODUZIONE ===
        const res = await fetch('/api/registrations/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('jwt'),
          },
          body: JSON.stringify({
            id_figlio:    state.figlio_id,
            id_evento:    EVENTO.id,
            id_percorso:  state.percorso_id,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Errore durante l\'iscrizione');
        */

        // === DEMO ===
        await new Promise(function(r){ setTimeout(r, 1200); });

        // Popola step 4
        const figlio   = getFiglio();
        const percorso = getPercorso();
        const el = $('conferma-details');
        if (el && figlio && percorso) {
          el.innerHTML = `
            <div class="riepilogo-row"><span class="riepilogo-row__label">Evento</span><span class="riepilogo-row__value">${EVENTO.titolo}</span></div>
            <div class="riepilogo-row"><span class="riepilogo-row__label">Figlio</span><span class="riepilogo-row__value">${figlio.nome} ${figlio.cognome}</span></div>
            <div class="riepilogo-row"><span class="riepilogo-row__label">Percorso</span><span class="riepilogo-row__value"><span style="background:var(--color-primary);color:#fff;padding:2px 10px;border-radius:4px;font-size:12px;font-weight:700;">${percorso.codice}</span></span></div>
            <div class="riepilogo-row"><span class="riepilogo-row__label">Gruppo</span><span class="riepilogo-row__value"><em>Assegnato via email dopo chiusura</em></span></div>
          `;
        }

        goToStep(4);

      } catch (err) {
        alert('Errore: ' + err.message);
      } finally {
        setLoading(btn, false);
      }
    });
  }

  /* ----------------------------------------------------------
     PULSANTI TORNA INDIETRO
     ---------------------------------------------------------- */

  function initBackButtons() {
    const back3 = $('btn-back-3');
    if (back3) back3.addEventListener('click', function () { goToStep(2); });
  }

  /* ----------------------------------------------------------
     INIT
     ---------------------------------------------------------- */

  document.addEventListener('DOMContentLoaded', function () {
    goToStep(2);
    renderStep2();
    initBtnNext();
    initBtnConferma();
    initBackButtons();
    updateStepper();
  });

})();
