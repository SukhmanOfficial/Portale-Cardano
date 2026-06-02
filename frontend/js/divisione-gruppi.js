/**
 * divisione-gruppi.js — Anteprima e gestione divisione gruppi
 * Sistema Cardano Day · ITIS G. Cardano, Pavia
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     DATI MOCK
     ---------------------------------------------------------- */

  const EVENTO = { titolo: 'Open Day', data: '18 Nov' };

  const GRUPPI = {
    misto: {
      label: 'Percorso Misto',
      dotCls: 'percorso-dot--misto',
      totale: 32,
      gruppi: [
        { codice: 'M1', studenti: [
          { initials: 'LA', nome: 'Abbiati Laura',    scuola: 'Manzoni · PV' },
          { initials: 'BM', nome: 'Bianchi Marco',    scuola: 'Don Bosco · VO' },
          { initials: 'CS', nome: 'Colombo Sara',     scuola: 'Pascoli · PV' },
          { initials: 'DL', nome: 'De Luca Antonio',  scuola: 'Mazzini · VG' },
        ], totale: 8 },
        { codice: 'M2', studenti: [
          { initials: 'FG', nome: 'Ferrari Giulia',   scuola: 'Manzoni · VG' },
          { initials: 'GL', nome: 'Gatti Lorenzo',    scuola: 'Carducci · MO' },
          { initials: 'LV', nome: 'Lodi Valentina',   scuola: 'De Amicis · PV' },
        ], totale: 8 },
        { codice: 'M3', studenti: [
          { initials: 'MP', nome: 'Martini Pietro',   scuola: 'Manzoni · VG' },
          { initials: 'NF', nome: 'Negri Fabio',      scuola: 'Pascoli · PV' },
        ], totale: 8 },
        { codice: 'M4', studenti: [
          { initials: 'PR', nome: 'Pavan Rosa',       scuola: 'Manzoni · VG' },
          { initials: 'RC', nome: 'Rossi Chiara',     scuola: 'Don Bosco · VO' },
        ], totale: 8 },
      ],
    },
    liceo: {
      label: 'Liceo Sc. Appl.',
      dotCls: 'percorso-dot--liceo',
      totale: 28,
      gruppi: [
        { codice: 'L1', studenti: [
          { initials: 'AR', nome: 'Albanese Riccardo', scuola: 'Manzoni · PV' },
        ], totale: 10 },
        { codice: 'L2', studenti: [
          { initials: 'BC', nome: 'Badino Chiara',    scuola: 'Pascoli · PV' },
        ], totale: 9 },
        { codice: 'L3', studenti: [
          { initials: 'CR', nome: 'Carbone Roberto',  scuola: 'Don Bosco · VO' },
        ], totale: 9 },
      ],
    },
    tecnico: {
      label: 'Percorso Tecnico',
      dotCls: 'percorso-dot--tecnico',
      totale: 27,
      gruppi: [
        { codice: 'T1', studenti: [
          { initials: 'DA', nome: "D'Angelo Marco",   scuola: 'Mazzini · VG' },
        ], totale: 14 },
        { codice: 'T2', studenti: [
          { initials: 'EL', nome: 'Esposito Lucia',   scuola: 'Volta · PV' },
        ], totale: 13 },
      ],
    },
  };

  /* ----------------------------------------------------------
     STATO
     ---------------------------------------------------------- */

  const state = {
    studenteSelezionato: null,   // { nome, initials, scuola, gruppoCorrente, percorso }
    destinazione: null,          // codice gruppo es. 'M3'
  };

  /* ----------------------------------------------------------
     UTILITY
     ---------------------------------------------------------- */

  function $(id) { return document.getElementById(id); }

  /* ----------------------------------------------------------
     RENDER GRUPPI
     ---------------------------------------------------------- */

  function renderPercorso(key) {
    const p   = GRUPPI[key];
    const el  = $('percorso-' + key);
    if (!el) return;

    el.innerHTML = p.gruppi.map(function (g) {
      const studentiHTML = g.studenti.map(function (s) {
        return `<div class="gruppo-studente">
          <div class="gruppo-studente__initials">${s.initials}</div>
          <span>${s.nome} <span style="color:var(--color-text-muted);">· ${s.scuola}</span></span>
        </div>`;
      }).join('');

      const altri = g.totale - g.studenti.length;
      const altriHTML = altri > 0
        ? `<div class="gruppo-altri">+${altri} altri →</div>`
        : '';

      return `<div class="gruppo-card" onclick="selezionaStudente('${g.codice}','${key}')"
                   id="gruppo-card-${g.codice}">
        <div class="gruppo-card__code">${g.codice}</div>
        <div class="gruppo-card__count">${g.totale} studenti</div>
        <div class="gruppo-card__studenti">
          ${studentiHTML}
          ${altriHTML}
        </div>
      </div>`;
    }).join('');

    // Aggiungi gruppo
    el.innerHTML += `<div class="gruppo-card gruppo-card--add" onclick="aggiungiGruppo('${key}')">
      + Aggiungi gruppo ${p.gruppi[0].codice[0]}${p.gruppi.length + 1}
    </div>`;
  }

  function renderTutti() {
    Object.keys(GRUPPI).forEach(renderPercorso);
  }

  /* ----------------------------------------------------------
     SELEZIONE STUDENTE — apre pannello sposta
     ---------------------------------------------------------- */

  window.selezionaStudente = function (codiceGruppo, percorso) {
    const pg = GRUPPI[percorso];
    const g  = pg.gruppi.find(function (g) { return g.codice === codiceGruppo; });
    if (!g || g.studenti.length === 0) return;

    // Prende il primo studente del gruppo come demo
    const s = g.studenti[0];

    state.studenteSelezionato = {
      nome:          s.nome,
      initials:      s.initials,
      scuola:        s.scuola,
      gruppoCorrente: codiceGruppo,
      percorso:      percorso,
    };
    state.destinazione = null;

    // Evidenzia card selezionata
    document.querySelectorAll('.gruppo-card').forEach(function (el) {
      el.classList.remove('gruppo-card--selected');
    });
    const card = $('gruppo-card-' + codiceGruppo);
    if (card) card.classList.add('gruppo-card--selected');

    aggiornaSposta();
  };

  /* ----------------------------------------------------------
     PANNELLO SPOSTA — aggiorna UI
     ---------------------------------------------------------- */

  function aggiornaSposta() {
    const s = state.studenteSelezionato;
    if (!s) return;

    const panel = $('sposta-panel');
    if (!panel) return;

    const pg = GRUPPI[s.percorso];
    const altriGruppi = pg.gruppi.filter(function (g) {
      return g.codice !== s.gruppoCorrente;
    });

    // Studente selezionato
    const studenteBox = $('sposta-studente-box');
    if (studenteBox) {
      studenteBox.innerHTML = `
        <div class="sposta-studente-box__avatar">${s.initials}</div>
        <div>
          <div class="sposta-studente-box__name">${s.nome}</div>
          <div class="sposta-studente-box__sub">Attualmente: Gruppo ${s.gruppoCorrente} · ${pg.label}</div>
        </div>`;
    }

    // Bottoni destinazione
    const destGrid = $('dest-grid');
    if (destGrid) {
      destGrid.innerHTML = altriGruppi.map(function (g) {
        const activeCls = state.destinazione === g.codice ? 'dest-btn--active' : '';
        return `<button class="dest-btn ${activeCls}" onclick="selezionaDest('${g.codice}')">
          <div style="font-size:var(--text-lg);font-weight:900;">${g.codice}</div>
          <div class="dest-btn__sub">${g.totale}/8 posti</div>
        </button>`;
      }).join('');

      // Bottone "stesso percorso diverso" disabilitato come riferimento
      const lockCls = 'dest-btn--locked';
      const altroPercorso = s.percorso === 'misto' ? 'L1' : 'M1';
      destGrid.innerHTML += `<button class="dest-btn ${lockCls}" disabled>
        <div style="font-size:var(--text-lg);font-weight:900;">${altroPercorso}</div>
        <div class="dest-btn__sub">Percorso diverso</div>
      </button>`;
    }

    // Lista scambia
    const scambiaList = $('scambia-list');
    if (scambiaList && state.destinazione) {
      const destGruppo = pg.gruppi.find(function (g) { return g.codice === state.destinazione; });
      if (destGruppo) {
        scambiaList.innerHTML = destGruppo.studenti.slice(0, 2).map(function (s) {
          return `<div class="scambia-item">
            <div class="scambia-initials">${s.initials}</div>
            <div>
              <div style="font-weight:600;">${s.nome}</div>
              <div style="color:rgba(255,255,255,0.5);">${s.scuola}</div>
            </div>
          </div>`;
        }).join('');
      }
    }

    // Nota destinazione
    const nota = $('sposta-dest-note');
    if (nota && state.destinazione) {
      nota.textContent = `✓ Destinazione: ${state.destinazione} — 1 posto disponibile\nIl genitore riceverà una nuova email con QR aggiornato`;
      nota.style.display = 'block';
    } else if (nota) {
      nota.style.display = 'none';
    }

    // Pulsante conferma
    const btnConferma = $('btn-sposta-conferma');
    if (btnConferma) {
      btnConferma.textContent = state.destinazione
        ? `→ SPOSTA IN ${state.destinazione}`
        : 'Seleziona gruppo di destinazione';
      btnConferma.disabled = !state.destinazione;
      btnConferma.style.opacity = state.destinazione ? '1' : '0.6';
    }
  }

  window.selezionaDest = function (codice) {
    state.destinazione = codice;
    aggiornaSposta();
  };

  /* ----------------------------------------------------------
     AZIONI PUBBLICHE
     ---------------------------------------------------------- */

  window.aggiungiGruppo = function (percorso) {
    alert('Aggiungi gruppo al percorso ' + GRUPPI[percorso].label +
          '\n(in produzione: POST /api/registrations/?action=aggiungi_gruppo)');
  };

  window.spostaStudente = function () {
    if (!state.studenteSelezionato || !state.destinazione) return;
    const s = state.studenteSelezionato;
    if (!confirm(`Spostare ${s.nome} dal gruppo ${s.gruppoCorrente} al gruppo ${state.destinazione}?\n\nIl genitore riceverà una email con il QR aggiornato.`)) return;
    alert(`Studente spostato!\n${s.nome}: ${s.gruppoCorrente} → ${state.destinazione}\n(in produzione: PUT /api/registrations/?action=sposta)`);
    state.studenteSelezionato = null;
    state.destinazione = null;
    document.querySelectorAll('.gruppo-card').forEach(function (el) {
      el.classList.remove('gruppo-card--selected');
    });
  };

  window.annullaSposta = function () {
    state.studenteSelezionato = null;
    state.destinazione = null;
    document.querySelectorAll('.gruppo-card').forEach(function (el) {
      el.classList.remove('gruppo-card--selected');
    });
    const nota = $('sposta-dest-note');
    if (nota) nota.style.display = 'none';
  };

  window.rieseguiDivisione = function () {
    if (!confirm('Rieseguire la divisione? Le assegnazioni correnti verranno sovrascritte.')) return;
    alert('Script Node.js avviato...\n(in produzione: POST /api/registrations/?action=dividi)');
  };

  window.confermaInviaEmail = function () {
    if (!confirm('Confermare e inviare email con QR aggiornato a tutti i 87 genitori?')) return;
    alert('Email inviate!\n(in produzione: POST /api/registrations/?action=conferma_gruppi)');
    window.location.href = 'segreteria.html';
  };

  /* ----------------------------------------------------------
     INIT
     ---------------------------------------------------------- */

  document.addEventListener('DOMContentLoaded', function () {
    renderTutti();

    // Sidebar mobile
    const toggle  = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.seg-sidebar');
    if (toggle && sidebar) {
      toggle.addEventListener('click', function () { sidebar.classList.toggle('is-open'); });
      document.addEventListener('click', function (e) {
        if (!sidebar.contains(e.target) && !toggle.contains(e.target)) sidebar.classList.remove('is-open');
      });
    }

    function updateToggle() {
      if (toggle) toggle.style.display = window.innerWidth <= 900 ? 'block' : 'none';
    }
    updateToggle();
    window.addEventListener('resize', updateToggle);
  });

})();
