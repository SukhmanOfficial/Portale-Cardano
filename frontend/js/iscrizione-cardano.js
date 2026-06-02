/**
 * iscrizione-cardano.js — Logica iscrizione Cardano Day
 * Sistema Cardano Day · ITIS G. Cardano, Pavia
 *
 * Step 1 — Evento       (già selezionato, mostrato)
 * Step 2 — Figlio e laboratori (max 2, uno per turno)
 * Step 3 — Riepilogo e conferma
 * Step 4 — QR Code ricevuto
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     DATI MOCK — sostituire con fetch JWT in produzione
     ---------------------------------------------------------- */

  const EVENTO = {
    id: 2,
    titolo: 'Cardano Day — Novembre 2026',
    data: { giorno: '24', mese: 'NOV' },
    location: 'ITIS G. Cardano, Pavia',
    tipo: 'Laboratori 8:30–13:00',
    posti_disponibili: 142,
    chiusura: '16 nov ore 23:59',
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

  // Laboratori disponibili per ogni turno
  // posti_disponibili: totale posti liberi in quel lab (tutti i turni sommati)
  const LABORATORI = [
    {
      id: 1,
      codice: 'I',
      nome: 'Informatica',
      icon: '💻',
      colore: '#3B82F6',
      posti_t1: 46,
      max_t1: 50,
      posti_t2: 22,
      max_t2: 25,
    },
    {
      id: 2,
      codice: 'E',
      nome: 'Elettronica',
      icon: '⚡',
      colore: '#F59E0B',
      posti_t1: 18,
      max_t1: 25,
      posti_t2: 19,
      max_t2: 25,
    },
    {
      id: 3,
      codice: 'M',
      nome: 'Meccanica',
      icon: '⚙️',
      colore: '#6B7280',
      posti_t1: 22,
      max_t1: 25,
      posti_t2: 44,
      max_t2: 50,
    },
    {
      id: 4,
      codice: 'C',
      nome: 'Chimica',
      icon: '🧪',
      colore: '#8B5CF6',
      posti_t1: 20,
      max_t1: 25,
      posti_t2: 24,
      max_t2: 25,
    },
    {
      id: 5,
      codice: 'L',
      nome: 'Liceo Sc. Appl.',
      icon: '🔬',
      colore: '#10B981',
      posti_t1: 23,
      max_t1: 25,
      posti_t2: 21,
      max_t2: 25,
    },
  ];

  const TURNI = [
    { id: 1, label: 'Turno 1', orario: '8:30 – 10:30' },
    { id: 2, label: 'Turno 2', orario: '11:00 – 13:00' },
  ];

  /* ----------------------------------------------------------
     STATO
     ---------------------------------------------------------- */

  const state = {
    step: 2,
    figlio_id: null,
    lab_t1: null,   // id laboratorio turno 1 (null = nessuno)
    lab_t2: null,   // id laboratorio turno 2 (null = nessuno, opzionale)
  };

  /* ----------------------------------------------------------
     UTILITY
     ---------------------------------------------------------- */

  function $(id) { return document.getElementById(id); }

  function getLab(id) { return LABORATORI.find(function (l) { return l.id === id; }); }
  function getFiglio()  { return FIGLI.find(function (f) { return f.id === state.figlio_id; }); }

  function setLoading(btn, on) {
    btn.disabled = on;
    btn.classList.toggle('is-loading', on);
  }

  function pctFill(used, max) {
    return Math.round((used / max) * 100);
  }

  /* ----------------------------------------------------------
     STEPPER
     ---------------------------------------------------------- */

  const STEPS = [
    { label: 'Evento',          sub: 'Selezionato' },
    { label: 'Figlio e lab',    sub: 'In corso' },
    { label: 'Riepilogo',       sub: 'Conferma' },
    { label: 'QR Code',         sub: 'Ricezione' },
  ];

  function updateStepper() {
    const el = $('iscrizione-stepper');
    if (!el) return;
    el.innerHTML = STEPS.map(function (s, i) {
      const n = i + 1;
      let cls = 'iscrizione-stepper__step--todo';
      let circle = String(n);
      if (n < state.step)        { cls = 'iscrizione-stepper__step--done';   circle = '✓'; }
      else if (n === state.step) { cls = 'iscrizione-stepper__step--active'; }
      const connCls = n < state.step ? 'iscrizione-stepper__step--done' : '';
      return `<div class="iscrizione-stepper__step ${cls} ${connCls}">
        <div class="iscrizione-stepper__circle">${circle}</div>
        <div class="iscrizione-stepper__label">
          <span class="iscrizione-stepper__label-main">${s.label}</span>
          <span class="iscrizione-stepper__label-sub">${n === state.step ? s.sub : (n < state.step ? 'Completato' : '')}</span>
        </div>
      </div>`;
    }).join('');
  }

  /* ----------------------------------------------------------
     RENDER LABORATORI — per un dato turno
     ---------------------------------------------------------- */

  function renderLabGrid(turnoId, containerId) {
    const el = $(containerId);
    if (!el) return;

    const selectedInThisTurno = turnoId === 1 ? state.lab_t1 : state.lab_t2;
    const selectedInOtherTurno = turnoId === 1 ? state.lab_t2 : state.lab_t1;

    el.innerHTML = LABORATORI.map(function (lab) {
      const posti = turnoId === 1 ? lab.posti_t1 : lab.posti_t2;
      const max   = turnoId === 1 ? lab.max_t1   : lab.max_t2;
      const used  = max - posti;
      const pct   = pctFill(used, max);
      const esaurito  = posti === 0;

      // Lab già scelto nell'altro turno → disabilitato (stesso lab)
      const stessoLab = selectedInOtherTurno === lab.id;

      // Per T2: se T1 non è ancora scelto, nessun blocco
      const isSel     = selectedInThisTurno === lab.id;

      let extraCls = '';
      let disabilitato = false;
      if (esaurito)  { extraCls = 'lab-card--esaurito'; disabilitato = true; }
      if (stessoLab) { extraCls = 'lab-card--stessa-scelta'; disabilitato = true; }
      if (isSel)     { extraCls = 'lab-card--selected'; }

      const onclick = disabilitato ? '' : `onclick="selectLab(${turnoId}, ${lab.id})"`;

      return `<div class="lab-card ${extraCls}" ${onclick} data-lab-id="${lab.id}" data-turno="${turnoId}">
        <div class="lab-card__icon">${lab.icon}</div>
        <div class="lab-card__name">${lab.nome}</div>
        <div class="lab-card__code" style="background:${lab.colore}22;color:${lab.colore};border:1px solid ${lab.colore}44;">
          ${lab.codice}
        </div>
        ${stessoLab ? `<div class="lab-card__blocked">Già scelto T${turnoId === 1 ? 2 : 1}</div>` : ''}
        ${esaurito  ? `<div class="lab-card__blocked">Esaurito</div>` : ''}
        <div class="lab-card__posti">
          <span class="lab-card__posti-num">${esaurito ? 0 : posti}</span>
          <span class="lab-card__posti-label">posti</span>
        </div>
        <div class="lab-card__progress">
          <div class="lab-card__progress-fill" style="width:${pct}%;background:${lab.colore};"></div>
        </div>
      </div>`;
    }).join('');
  }

  /* ----------------------------------------------------------
     RENDER STEP 2
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

    // Turno 1
    renderLabGrid(1, 'lab-grid-t1');

    // Turno 2
    renderLabGrid(2, 'lab-grid-t2');

    // Riepilogo selezione
    updateSelectionSummary();
    updateSidebarRiepilogo();
    updateBtnNext();
  }

  /* ----------------------------------------------------------
     RIEPILOGO SELEZIONE (sotto alle griglie)
     ---------------------------------------------------------- */

  function updateSelectionSummary() {
    const el = $('selection-summary');
    if (!el) return;

    const labT1 = getLab(state.lab_t1);
    const labT2 = getLab(state.lab_t2);

    if (!labT1 && !labT2) {
      el.style.display = 'none';
      return;
    }

    el.style.display = 'flex';
    let html = '<span style="font-size:var(--text-sm);color:var(--color-text-secondary);margin-right:var(--space-2);">✓ Hai selezionato:</span>';

    if (labT1) {
      html += `<span class="sel-badge" style="background:${labT1.colore}22;color:${labT1.colore};border:1px solid ${labT1.colore}44;">
        ${labT1.nome} (Turno 1)
      </span>`;
    }
    if (labT1 && labT2) {
      html += `<span style="color:var(--color-text-muted);font-size:var(--text-sm);">+</span>`;
    }
    if (labT2) {
      html += `<span class="sel-badge" style="background:${labT2.colore}22;color:${labT2.colore};border:1px solid ${labT2.colore}44;">
        ${labT2.nome} (Turno 2)
      </span>`;
    }

    el.innerHTML = html;
  }

  /* ----------------------------------------------------------
     SIDEBAR RIEPILOGO
     ---------------------------------------------------------- */

  function updateSidebarRiepilogo() {
    const el = $('sidebar-riepilogo-rows');
    if (!el) return;

    const figlio = getFiglio();
    const labT1  = getLab(state.lab_t1);
    const labT2  = getLab(state.lab_t2);

    const rows = [
      { label: 'Evento',    value: '24 Nov 2026 · Cardano Day' },
      { label: 'Figlio',    value: figlio ? figlio.nome + ' ' + figlio.cognome : null },
      { label: 'Lab T1',    value: labT1 ? labT1.nome + ' (' + TURNI[0].orario + ')' : null },
      { label: 'Lab T2',    value: labT2 ? labT2.nome + ' (' + TURNI[1].orario + ')' : null, italic: !labT2 ? 'Opzionale' : null },
      { label: 'Aule',      value: null, italic: 'Assegnate dopo chiusura' },
    ];

    el.innerHTML = rows.map(function (r) {
      let val = '';
      if (r.italic && !r.value) {
        val = `<em style="color:rgba(0,0,0,0.35);font-weight:400;">${r.italic}</em>`;
      } else {
        val = r.value || `<em style="color:var(--color-text-muted);font-weight:400;">—</em>`;
      }
      return `<div class="sidebar-riepilogo__row">
        <span class="sidebar-riepilogo__label">${r.label}</span>
        <span class="sidebar-riepilogo__value">${val}</span>
      </div>`;
    }).join('');
  }

  /* ----------------------------------------------------------
     ABILITA PULSANTE AVANTI
     ---------------------------------------------------------- */

  function updateBtnNext() {
    const btn = $('btn-step-next');
    if (!btn) return;
    // Serve almeno figlio + 1 lab (T1)
    const ready = state.figlio_id !== null && state.lab_t1 !== null;
    btn.disabled = !ready;
    btn.style.opacity = ready ? '1' : '0.5';
  }

  /* ----------------------------------------------------------
     RENDER STEP 3 — Riepilogo
     ---------------------------------------------------------- */

  function renderStep3() {
    const figlio = getFiglio();
    const labT1  = getLab(state.lab_t1);
    const labT2  = getLab(state.lab_t2);
    const el = $('riepilogo-rows');
    if (!el) return;

    function labBadge(lab, turno) {
      if (!lab) return '<em style="color:var(--color-text-muted);font-weight:400">—</em>';
      return `<span class="lab-badge-inline" style="background:${lab.colore};color:#fff;">
        ${lab.codice}
      </span> ${lab.nome}`;
    }

    const rows = [
      { label: 'Evento',             value: EVENTO.titolo + ' · 24 NOV' },
      { label: 'Figlio',             value: figlio ? figlio.nome + ' ' + figlio.cognome : '—' },
      { label: 'Scuola',             value: figlio ? figlio.scuola + ' · ' + figlio.citta : '—' },
      { label: 'Laboratorio Turno 1 (8:30)', html: labBadge(labT1, 1) },
      { label: 'Laboratorio Turno 2 (11:00)', html: labBadge(labT2, 2) || '<em style="color:var(--color-text-muted);font-weight:400">Non selezionato</em>' },
      { label: 'Aule assegnate',     italic: 'Dopo divisione gruppi (email)' },
    ];

    el.innerHTML = rows.map(function (r) {
      let val = '';
      if (r.html)   val = r.html;
      else if (r.italic) val = `<em style="color:var(--color-text-muted);font-weight:400">${r.italic}</em>`;
      else val = r.value;
      return `<div class="riepilogo-row">
        <span class="riepilogo-row__label">${r.label}</span>
        <span class="riepilogo-row__value">${val}</span>
      </div>`;
    }).join('');
  }

  /* ----------------------------------------------------------
     AZIONI PUBBLICHE (onclick inline)
     ---------------------------------------------------------- */

  window.selectFiglio = function (id) {
    state.figlio_id = id;
    document.querySelectorAll('.figlio-option').forEach(function (el) {
      el.classList.toggle('figlio-option--selected', parseInt(el.dataset.figlioId) === id);
    });
    updateSidebarRiepilogo();
    updateBtnNext();
  };

  window.selectLab = function (turnoId, labId) {
    if (turnoId === 1) {
      // Toggle: se già selezionato, deseleziona
      state.lab_t1 = state.lab_t1 === labId ? null : labId;
      // Se lab_t2 è lo stesso di lab_t1 appena selezionato, resetta
      if (state.lab_t1 && state.lab_t1 === state.lab_t2) state.lab_t2 = null;
    } else {
      state.lab_t2 = state.lab_t2 === labId ? null : labId;
      if (state.lab_t2 && state.lab_t2 === state.lab_t1) state.lab_t2 = null;
    }
    renderStep2();
  };

  /* ----------------------------------------------------------
     NAVIGAZIONE STEP
     ---------------------------------------------------------- */

  function goToStep(n) {
    document.querySelectorAll('[data-step]').forEach(function (el) {
      el.style.display = 'none';
    });
    const panel = document.querySelector('[data-step="' + n + '"]');
    if (panel) panel.style.display = 'block';
    state.step = n;
    updateStepper();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ----------------------------------------------------------
     INIT
     ---------------------------------------------------------- */

  document.addEventListener('DOMContentLoaded', function () {
    goToStep(2);
    renderStep2();
    updateStepper();

    // Pulsante avanti step 2 → 3
    const btnNext = $('btn-step-next');
    if (btnNext) {
      btnNext.addEventListener('click', function () {
        if (!state.figlio_id || !state.lab_t1) return;
        renderStep3();
        goToStep(3);
      });
    }

    // Pulsante conferma step 3 → 4
    const btnConferma = $('btn-step-conferma');
    if (btnConferma) {
      btnConferma.addEventListener('click', async function () {
        setLoading(btnConferma, true);
        try {
          /* === PRODUZIONE ===
          const res = await fetch('/api/registrations/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + localStorage.getItem('jwt'),
            },
            body: JSON.stringify({
              id_figlio: state.figlio_id,
              id_evento: EVENTO.id,
              laboratori: [
                state.lab_t1,
                state.lab_t2,
              ].filter(Boolean),
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Errore durante l\'iscrizione');
          */

          // === DEMO ===
          await new Promise(function (r) { setTimeout(r, 1200); });

          // Popola step 4
          const figlio = getFiglio();
          const labT1  = getLab(state.lab_t1);
          const labT2  = getLab(state.lab_t2);
          const det = $('conferma-details');
          if (det) {
            det.innerHTML = `
              <div class="riepilogo-row"><span class="riepilogo-row__label">Evento</span><span class="riepilogo-row__value">${EVENTO.titolo}</span></div>
              <div class="riepilogo-row"><span class="riepilogo-row__label">Figlio</span><span class="riepilogo-row__value">${figlio ? figlio.nome + ' ' + figlio.cognome : '—'}</span></div>
              <div class="riepilogo-row"><span class="riepilogo-row__label">Lab Turno 1</span><span class="riepilogo-row__value">
                <span class="lab-badge-inline" style="background:${labT1.colore};color:#fff;">${labT1.codice}</span> ${labT1.nome}
              </span></div>
              ${labT2 ? `<div class="riepilogo-row"><span class="riepilogo-row__label">Lab Turno 2</span><span class="riepilogo-row__value">
                <span class="lab-badge-inline" style="background:${labT2.colore};color:#fff;">${labT2.codice}</span> ${labT2.nome}
              </span></div>` : ''}
              <div class="riepilogo-row"><span class="riepilogo-row__label">Aule</span><span class="riepilogo-row__value"><em style="color:var(--color-text-muted);font-weight:400">Assegnate via email dopo chiusura</em></span></div>
            `;
          }

          goToStep(4);

        } catch (err) {
          alert('Errore: ' + err.message);
        } finally {
          setLoading(btnConferma, false);
        }
      });
    }

    // Torna indietro da step 3
    const btnBack3 = $('btn-back-3');
    if (btnBack3) btnBack3.addEventListener('click', function () { goToStep(2); });
  });

})();
