/**
 * crea-evento.js — Form creazione/modifica evento
 * Sistema Cardano Day · ITIS G. Cardano, Pavia
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     STATO
     ---------------------------------------------------------- */

  const state = {
    tipo: 'open_day',
    laboratori: [
      { id: 1, nome: 'Informatica', codice: 'I', icon: '💻', aule_t1: 2, posti_t1: 25, aule_t2: 1, posti_t2: 25 },
      { id: 2, nome: 'Elettronica', codice: 'E', icon: '⚡', aule_t1: 1, posti_t1: 25, aule_t2: 1, posti_t2: 25 },
      { id: 3, nome: 'Meccanica',   codice: 'M', icon: '⚙️', aule_t1: 1, posti_t1: 25, aule_t2: 2, posti_t2: 25 },
      { id: 4, nome: 'Chimica',     codice: 'C', icon: '🧪', aule_t1: 1, posti_t1: 25, aule_t2: 1, posti_t2: 25 },
      { id: 5, nome: 'Liceo Sc.Appl.', codice: 'L', icon: '🔬', aule_t1: 1, posti_t1: 25, aule_t2: 1, posti_t2: 25 },
    ],
  };

  /* ----------------------------------------------------------
     UTILITY
     ---------------------------------------------------------- */

  function $(id)  { return document.getElementById(id); }
  function val(id){ const el = $(id); return el ? el.value : ''; }

  function calcolaTotale() {
    return state.laboratori.reduce(function (tot, lab) {
      return tot + (lab.aule_t1 * lab.posti_t1) + (lab.aule_t2 * lab.posti_t2);
    }, 0);
  }

  /* ----------------------------------------------------------
     TIPO EVENTO — switch Open Day / Cardano Day
     ---------------------------------------------------------- */

  window.setTipo = function (tipo) {
    state.tipo = tipo;

    // Aggiorna tab
    document.querySelectorAll('.tipo-tab').forEach(function (el) {
      el.classList.toggle('tipo-tab--active', el.dataset.tipo === tipo);
    });

    // Mostra/nascondi sezioni
    const turniSection = $('turni-section');
    const labSection   = $('lab-section');
    if (turniSection) turniSection.classList.toggle('visible', tipo === 'cardano_day');
    if (labSection)   labSection.style.display   = tipo === 'cardano_day' ? 'block' : 'none';

    // Aggiorna posti max se Cardano Day
    const postiInput = $('ev-posti');
    if (postiInput && tipo === 'cardano_day') {
      postiInput.value = calcolaTotale();
    }

    aggiornaAnteprima();
  };

  /* ----------------------------------------------------------
     RENDER LABORATORI
     ---------------------------------------------------------- */

  function renderLaboratori() {
    const container = $('lab-list');
    if (!container) return;

    container.innerHTML = state.laboratori.map(function (lab) {
      const totT1 = lab.aule_t1 * lab.posti_t1;
      const totT2 = lab.aule_t2 * lab.posti_t2;

      return `<div class="lab-config-card" id="lab-card-${lab.id}">
        <div class="lab-config-card__header">
          <span class="lab-config-icon" aria-hidden="true">${lab.icon}</span>
          <span class="lab-config-name">${lab.nome}</span>
          <div class="lab-config-badge">${lab.codice}</div>
          <button onclick="rimuoviLab(${lab.id})"
            style="margin-left:auto;background:none;border:none;cursor:pointer;color:var(--color-danger);font-size:var(--text-base);"
            title="Rimuovi laboratorio">✕</button>
        </div>
        <div class="lab-turni-grid">
          <div class="lab-turno-config">
            <div class="lab-turno-config__label">Turno 1 · 8:30–10:30</div>
            <div class="lab-turno-config__row">
              <input type="number" class="lab-num-input" min="1" max="9" value="${lab.aule_t1}"
                onchange="aggiornaLab(${lab.id},'aule_t1',this.value)"
                aria-label="Aule turno 1 ${lab.nome}" />
              aule ×
              <input type="number" class="lab-posti-input" min="1" max="99" value="${lab.posti_t1}"
                onchange="aggiornaLab(${lab.id},'posti_t1',this.value)"
                aria-label="Posti per aula turno 1 ${lab.nome}" />
              posti
            </div>
            <div class="lab-total-note">= ${totT1} posti totali</div>
          </div>
          <div class="lab-turno-config">
            <div class="lab-turno-config__label">Turno 2 · 11:00–13:00</div>
            <div class="lab-turno-config__row">
              <input type="number" class="lab-num-input" min="1" max="9" value="${lab.aule_t2}"
                onchange="aggiornaLab(${lab.id},'aule_t2',this.value)"
                aria-label="Aule turno 2 ${lab.nome}" />
              aule ×
              <input type="number" class="lab-posti-input" min="1" max="99" value="${lab.posti_t2}"
                onchange="aggiornaLab(${lab.id},'posti_t2',this.value)"
                aria-label="Posti per aula turno 2 ${lab.nome}" />
              posti
            </div>
            <div class="lab-total-note">= ${totT2} posti totali</div>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  /* ----------------------------------------------------------
     AZIONI LABORATORI
     ---------------------------------------------------------- */

  window.aggiornaLab = function (id, campo, valore) {
    const lab = state.laboratori.find(function (l) { return l.id === id; });
    if (!lab) return;
    lab[campo] = parseInt(valore) || 1;

    // Aggiorna nota totale
    const card = $('lab-card-' + id);
    if (card) {
      const notes = card.querySelectorAll('.lab-total-note');
      if (notes[0]) notes[0].textContent = '= ' + (lab.aule_t1 * lab.posti_t1) + ' posti totali';
      if (notes[1]) notes[1].textContent = '= ' + (lab.aule_t2 * lab.posti_t2) + ' posti totali';
    }

    // Aggiorna posti max
    const postiInput = $('ev-posti');
    if (postiInput && state.tipo === 'cardano_day') {
      postiInput.value = calcolaTotale();
    }

    aggiornaAnteprima();
  };

  window.rimuoviLab = function (id) {
    if (state.laboratori.length <= 1) { alert('Deve esserci almeno un laboratorio.'); return; }
    state.laboratori = state.laboratori.filter(function (l) { return l.id !== id; });
    renderLaboratori();
    aggiornaAnteprima();
  };

  window.aggiungiLaboratorio = function () {
    const nomi = ['Informatica','Elettronica','Meccanica','Chimica','Liceo Sc.Appl.','Fisica','Biologia'];
    const codici = ['I','E','M','C','L','F','B'];
    const icone  = ['💻','⚡','⚙️','🧪','🔬','🔭','🌿'];
    const idx    = state.laboratori.length % nomi.length;
    const newId  = Date.now();
    state.laboratori.push({
      id: newId, nome: nomi[idx], codice: codici[idx], icon: icone[idx],
      aule_t1: 1, posti_t1: 25, aule_t2: 1, posti_t2: 25,
    });
    renderLaboratori();
    aggiornaAnteprima();
  };

  /* ----------------------------------------------------------
     ANTEPRIMA LIVE
     ---------------------------------------------------------- */

  function aggiornaAnteprima() {
    const titolo = val('ev-titolo') || (state.tipo === 'open_day' ? 'Open Day' : 'Cardano Day');
    const data   = val('ev-data');
    const posti  = val('ev-posti');
    const pubblicato = val('ev-pubblicato');

    // Data preview
    let giorno = '—', mese = '—';
    if (data) {
      const d = new Date(data);
      giorno = d.getDate();
      mese   = d.toLocaleString('it-IT', { month: 'short' }).toUpperCase();
    }

    const prevDay = $('prev-day');
    const prevMon = $('prev-month');
    if (prevDay) prevDay.textContent = giorno;
    if (prevMon) prevMon.textContent = mese;

    const prevName = $('prev-name');
    if (prevName) prevName.textContent = titolo;

    const prevPosti = $('prev-posti');
    if (prevPosti) prevPosti.textContent = posti ? '● ' + posti + ' posti disponibili' : '';

    const prevAp  = $('prev-apertura');
    const prevCh  = $('prev-chiusura');
    if (prevAp) prevAp.textContent = val('ev-apertura') ? 'Iscrizioni ' + val('ev-apertura') + ' …' : '—';
    if (prevCh) prevCh.textContent = val('ev-chiusura')  ? '… ' + val('ev-chiusura')  : '';

    // Tags laboratori (Cardano Day)
    const prevTags = $('prev-tags');
    if (prevTags) {
      if (state.tipo === 'cardano_day') {
        const tagCls = { I:'tag--info', E:'tag--elett', M:'tag--mecc', C:'tag--chim', L:'tag--liceolab' };
        prevTags.innerHTML = state.laboratori.map(function (lab) {
          const cls = tagCls[lab.codice] || '';
          return `<span class="ev-preview__tag ev-preview__tag--${cls.replace('tag--','')}">${lab.nome}</span>`;
        }).join('');
      } else {
        prevTags.innerHTML = `
          <span class="ev-preview__tag ev-preview__tag--misto">Misto</span>
          <span class="ev-preview__tag ev-preview__tag--liceo" style="background:#7C3AED;">Liceo Sc.Appl.</span>
          <span class="ev-preview__tag ev-preview__tag--info">Tecnico</span>`;
      }
    }

    // Riepilogo configurazione
    const nLab   = state.tipo === 'cardano_day' ? state.laboratori.length : 3;
    const nTurni = state.tipo === 'cardano_day' ? '2 (8:30 / 11:00)' : '—';
    const totPosti = state.tipo === 'cardano_day' ? calcolaTotale() : (parseInt(posti) || 0);

    const riepilogoEl = $('riepilogo-config');
    if (riepilogoEl) {
      riepilogoEl.innerHTML = `
        <div class="riepilogo-config__title">Riepilogo configurazione</div>
        <div class="riepilogo-config__row">
          <span class="riepilogo-config__label">Tipo:</span>
          <span class="riepilogo-config__value">${state.tipo === 'open_day' ? 'Open Day' : 'Cardano Day'}</span>
        </div>
        <div class="riepilogo-config__row">
          <span class="riepilogo-config__label">Data:</span>
          <span class="riepilogo-config__value">${data ? new Date(data).toLocaleDateString('it-IT') : '—'}</span>
        </div>
        <div class="riepilogo-config__row">
          <span class="riepilogo-config__label">Posti totali:</span>
          <span class="riepilogo-config__value riepilogo-config__value--warn">${totPosti || '—'}</span>
        </div>
        <div class="riepilogo-config__row">
          <span class="riepilogo-config__label">Laboratori:</span>
          <span class="riepilogo-config__value">${nLab}</span>
        </div>
        <div class="riepilogo-config__row">
          <span class="riepilogo-config__label">Turni:</span>
          <span class="riepilogo-config__value">${nTurni}</span>
        </div>`;
    }
  }

  /* ----------------------------------------------------------
     SUBMIT
     ---------------------------------------------------------- */

  function raccogliDati() {
    return {
      tipo:       state.tipo,
      titolo:     val('ev-titolo'),
      data:       val('ev-data'),
      descrizione: val('ev-descrizione'),
      posti_max:  parseInt(val('ev-posti')) || 0,
      pubblicato: val('ev-pubblicato') === 'si',
      apertura:   val('ev-apertura'),
      chiusura:   val('ev-chiusura'),
      inizio_t1:  val('ev-inizio-t1'),
      fine_t1:    val('ev-fine-t1'),
      inizio_t2:  val('ev-inizio-t2'),
      fine_t2:    val('ev-fine-t2'),
      laboratori: state.tipo === 'cardano_day' ? state.laboratori : [],
    };
  }

  function validaDati(dati) {
    if (!dati.titolo) { alert('Inserisci il titolo dell\'evento.'); return false; }
    if (!dati.data)   { alert('Inserisci la data dell\'evento.'); return false; }
    if (!dati.posti_max || dati.posti_max < 1) { alert('Inserisci i posti massimi.'); return false; }
    if (!dati.apertura) { alert('Inserisci la data di apertura iscrizioni.'); return false; }
    if (!dati.chiusura) { alert('Inserisci la data di chiusura iscrizioni.'); return false; }
    return true;
  }

  window.pubblicaEvento = async function () {
    const dati = raccogliDati();
    dati.pubblicato = true;
    if (!validaDati(dati)) return;

    const btn = $('btn-pubblica');
    if (btn) { btn.disabled = true; btn.textContent = 'Pubblicazione...'; }

    try {
      /* === PRODUZIONE ===
      const res = await fetch('/api/events/', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+localStorage.getItem('jwt') },
        body: JSON.stringify(dati),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore');
      */
      await new Promise(function (r) { setTimeout(r, 900); });
      alert('Evento pubblicato con successo!');
      window.location.href = 'segreteria.html';
    } catch (err) {
      alert('Errore: ' + err.message);
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = '✓ Pubblica evento'; }
    }
  };

  window.salvaBozza = async function () {
    const dati = raccogliDati();
    dati.pubblicato = false;
    if (!dati.titolo) { alert('Inserisci almeno il titolo.'); return; }

    const btn = $('btn-bozza');
    if (btn) { btn.disabled = true; btn.textContent = 'Salvataggio...'; }

    try {
      await new Promise(function (r) { setTimeout(r, 600); });
      alert('Bozza salvata.');
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = '💾 Salva come bozza'; }
    }
  };

  /* ----------------------------------------------------------
     INIT
     ---------------------------------------------------------- */

  document.addEventListener('DOMContentLoaded', function () {
    // Listener anteprima live su tutti i campi
    ['ev-titolo','ev-data','ev-posti','ev-pubblicato',
     'ev-apertura','ev-chiusura','ev-inizio-t1','ev-fine-t1',
     'ev-inizio-t2','ev-fine-t2'].forEach(function (id) {
      const el = $(id);
      if (el) el.addEventListener('input', aggiornaAnteprima);
    });

    // Imposta tipo iniziale
    setTipo('cardano_day');
    renderLaboratori();
    aggiornaAnteprima();

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
  });

})();
