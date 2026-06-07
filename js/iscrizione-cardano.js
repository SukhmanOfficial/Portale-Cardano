/**
 * iscrizione-cardano.js — Iscrizione Cardano Day
 * Sistema Cardano Day · ITIS "G. Cardano", Pavia
 */

(function () {
  'use strict';

  var utente = API.auth.requireLogin(['genitore']);
  if (!utente) return;

  var state = { step: 2, figlio_id: null, lab_t1: null, lab_t2: null, evento: null, figli: [], laboratori: [] };

  function $(id) { return document.getElementById(id); }
  function setLoading(btn, on) { if (btn) { btn.disabled = on; btn.classList.toggle('is-loading', on); } }

  var STEPS = ['Evento','Figlio e laboratori','Riepilogo','QR Code'];
  function updateStepper() {
    var c = $('iscrizione-stepper');
    if (!c) return;
    c.innerHTML = STEPS.map(function (s, i) {
      var n = i + 1;
      var cls = n < state.step ? 'iscrizione-stepper__step--done' : n === state.step ? 'iscrizione-stepper__step--active' : 'iscrizione-stepper__step--todo';
      return '<div class="iscrizione-stepper__step ' + cls + '"><div class="iscrizione-stepper__circle">' + (n < state.step ? '✓' : n) + '</div><div class="iscrizione-stepper__label"><span class="iscrizione-stepper__label-main">' + s + '</span></div></div>';
    }).join('');
  }

  function goToStep(n) {
    document.querySelectorAll('[data-step]').forEach(function (el) { el.style.display = parseInt(el.dataset.step) === n ? 'block' : 'none'; });
    state.step = n;
    updateStepper();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* -- CARICA EVENTO -- */
  async function caricaEvento() {
    var params = new URLSearchParams(window.location.search);
    var id = parseInt(params.get('evento'));
    if (!id) {
      try {
        var lista = await API.events.list();
        var eventi = (lista.data || []).filter(function(e){ return e.tipo === 'cardano_day' && e.pubblicato; });
        if (!eventi.length) { mostraErrorePagina('Nessun Cardano Day disponibile al momento.'); return; }
        id = eventi[0].id;
      } catch(err) { mostraErrorePagina('Errore: ' + err.message); return; }
    }
    try {
      var data = await API.events.get(id);
      state.evento = data.data;
      state.laboratori = data.data.laboratori || [];
      renderEventoCard();
      renderLaboratori();
    } catch (err) { mostraErrorePagina('Errore: ' + err.message); }
  }

  function mostraErrorePagina(msg) {
    var main = document.querySelector('.iscrizione-main');
    if (main) main.innerHTML = '<div style="text-align:center;padding:4rem 2rem;color:var(--color-danger);"><div style="font-size:3rem;margin-bottom:1rem;">⚠️</div><div style="font-size:1.1rem;font-weight:600;">' + msg + '</div><a href="area-personale.html" style="display:inline-block;margin-top:1.5rem;color:var(--color-primary);">← Torna alla tua area</a></div>';
  }

  function renderEventoCard() {
    var ev = state.evento;
    if (!ev) return;
    var d = new Date(ev.data_evento);
    var titleEl = document.querySelector('.evento-selezionato__title');
    if (titleEl) titleEl.textContent = ev.titolo;
    var dayEl = document.querySelector('.evento-selezionato__date-day');
    var monEl = document.querySelector('.evento-selezionato__date-month');
    if (dayEl) dayEl.textContent = d.getDate();
    if (monEl) monEl.textContent = d.toLocaleString('it-IT',{month:'short'}).toUpperCase();
  }

  /* -- CARICA FIGLI -- */
  async function caricaFigli() {
    try {
      var data = await API.users.figli();
      state.figli = data.data || [];
      renderFigli();
    } catch (err) { alert('Errore figli: ' + err.message); }
  }

  function renderFigli() {
    var grid = $('figli-select-grid');
    if (!grid) return;
    grid.innerHTML = state.figli.map(function (f) {
      var sel = state.figlio_id === f.id ? 'figlio-option--selected' : '';
      return '<div class="figlio-option ' + sel + '" onclick="selectFiglio(' + f.id + ')">' +
        '<div class="figlio-option__avatar">' + f.nome[0] + f.cognome[0] + '</div>' +
        '<div class="figlio-option__info"><div class="figlio-option__name">' + f.nome + ' ' + f.cognome + '</div>' +
        '<div class="figlio-option__school">📍 ' + (f.nome_scuola_media || f.scuola || '—') + '</div></div>' +
        '<div class="figlio-option__radio"></div></div>';
    }).join('');
  }

  function renderLaboratori() {
    var t1 = $('lab-grid-t1');
    var t2 = $('lab-grid-t2');
    if (!t1 || !t2) return;
    var html = state.laboratori.map(function (lab) {
      var icons = { I:'💻', E:'⚡', M:'⚙️', C:'🧪', L:'🔬' };
      return function (turno) {
        var sel = (turno === 1 ? state.lab_t1 : state.lab_t2) === lab.id ? 'lab-card--selected' : '';
        return '<div class="lab-card ' + sel + '" onclick="selectLab(' + turno + ',' + lab.id + ')">' +
          '<div class="lab-card__icon">' + (icons[lab.codice] || '🔬') + '</div>' +
          '<div class="lab-card__name">' + lab.nome + '</div>' +
          '<div class="lab-card__posti">' + (turno === 1 ? lab.aule_t1 * lab.posti_aula_t1 : lab.aule_t2 * lab.posti_aula_t2) + ' posti</div>' +
        '</div>';
      };
    });
    t1.innerHTML = state.laboratori.map(function(lab) {
      var icons = { I:'💻', E:'⚡', M:'⚙️', C:'🧪', L:'🔬' };
      var sel = state.lab_t1 === lab.id ? 'lab-card--selected' : '';
      return '<div class="lab-card ' + sel + '" onclick="selectLab(1,' + lab.id + ')">' +
        '<div class="lab-card__icon">' + (icons[lab.codice] || '🔬') + '</div>' +
        '<div class="lab-card__name">' + lab.nome + '</div>' +
        '<div class="lab-card__posti">' + (lab.aule_t1 * lab.posti_aula_t1) + ' posti T1</div></div>';
    }).join('');
    t2.innerHTML = state.laboratori.map(function(lab) {
      var icons = { I:'💻', E:'⚡', M:'⚙️', C:'🧪', L:'🔬' };
      var sel = state.lab_t2 === lab.id ? 'lab-card--selected' : '';
      return '<div class="lab-card ' + sel + '" onclick="selectLab(2,' + lab.id + ')">' +
        '<div class="lab-card__icon">' + (icons[lab.codice] || '🔬') + '</div>' +
        '<div class="lab-card__name">' + lab.nome + '</div>' +
        '<div class="lab-card__posti">' + (lab.aule_t2 * lab.posti_aula_t2) + ' posti T2</div></div>';
    }).join('');
  }

  window.selectFiglio = function (id) { state.figlio_id = id; renderFigli(); updateBtnNext(); };
  window.selectLab = function (turno, id) {
    if (turno === 1) state.lab_t1 = id;
    else { if (id === state.lab_t1) return alert('Scegli un laboratorio diverso per il Turno 2'); state.lab_t2 = id; }
    renderLaboratori();
    updateBtnNext();
    aggiornaRiepilogoLaterali();
  };

  function updateBtnNext() {
    var btn = $('btn-step-next');
    if (!btn) return;
    var ok = state.figlio_id && state.lab_t1;
    btn.disabled = !ok;
    btn.style.opacity = ok ? '1' : '0.5';
  }

  function aggiornaRiepilogoLaterali() {
    var c = $('sidebar-riepilogo-rows');
    if (!c) return;
    var f  = state.figli.find(function(x){ return x.id === state.figlio_id; });
    var l1 = state.laboratori.find(function(x){ return x.id === state.lab_t1; });
    var l2 = state.laboratori.find(function(x){ return x.id === state.lab_t2; });
    c.innerHTML = [
      { label: 'Evento',    value: state.evento?.titolo || '—' },
      { label: 'Figlio',    value: f ? f.nome + ' ' + f.cognome : null },
      { label: 'Lab T1',    value: l1 ? l1.nome : null },
      { label: 'Lab T2',    value: l2 ? l2.nome : null, italic: l2 ? null : 'Opzionale' },
      { label: 'Aule',      italic: 'Assegnate dalla segreteria' },
    ].map(function (r) {
      return '<div class="sidebar-riepilogo__row"><span class="sidebar-riepilogo__label">' + r.label + '</span>' +
        '<span class="sidebar-riepilogo__value">' + (r.italic && !r.value ? '<em>' + r.italic + '</em>' : (r.value || '<em style="color:var(--color-text-muted)">—</em>')) + '</span></div>';
    }).join('');
  }

  function renderRiepilogo() {
    var f  = state.figli.find(function(x){ return x.id === state.figlio_id; });
    var l1 = state.laboratori.find(function(x){ return x.id === state.lab_t1; });
    var l2 = state.laboratori.find(function(x){ return x.id === state.lab_t2; });
    var c = $('riepilogo-rows');
    if (!c) return;
    c.innerHTML = [
      { label: 'Evento',    value: state.evento?.titolo || '—' },
      { label: 'Figlio',    value: f ? f.nome + ' ' + f.cognome : '—' },
      { label: 'Lab T1',    value: l1 ? l1.nome : '—' },
      { label: 'Lab T2',    value: l2 ? l2.nome : 'Non selezionato' },
      { label: 'Aule',      italic: 'Assegnate dalla segreteria dopo chiusura iscrizioni' },
    ].map(function (r) {
      return '<div class="riepilogo-row"><span class="riepilogo-row__label">' + r.label + '</span><span class="riepilogo-row__value">' + (r.italic ? '<em>' + r.italic + '</em>' : r.value) + '</span></div>';
    }).join('');
  }

  /* -- CONFERMA -- */
  var btnConferma = $('btn-step-conferma');
  if (btnConferma) {
    btnConferma.addEventListener('click', async function () {
      setLoading(btnConferma, true);
      try {
        var data = await API.registrations.create({
          id_figlio:  state.figlio_id,
          id_evento:  state.evento?.id,
          id_lab_t1:  state.lab_t1,
          id_lab_t2:  state.lab_t2 || null,
        });
        var f  = state.figli.find(function(x){ return x.id === state.figlio_id; });
        var l1 = state.laboratori.find(function(x){ return x.id === state.lab_t1; });
        var det = $('conferma-details');
        if (det) det.innerHTML = '<div class="riepilogo-row"><span class="riepilogo-row__label">Evento</span><span class="riepilogo-row__value">' + (state.evento?.titolo||'') + '</span></div>' +
          '<div class="riepilogo-row"><span class="riepilogo-row__label">Figlio</span><span class="riepilogo-row__value">' + (f ? f.nome+' '+f.cognome : '') + '</span></div>' +
          '<div class="riepilogo-row"><span class="riepilogo-row__label">Lab T1</span><span class="riepilogo-row__value">' + (l1?.nome || '') + '</span></div>';
        goToStep(4);
      } catch (err) {
        alert('Errore: ' + err.message);
      } finally {
        setLoading(btnConferma, false);
      }
    });
  }

  var btnNext = $('btn-step-next');
  if (btnNext) btnNext.addEventListener('click', function () { if (!state.figlio_id || !state.lab_t1) return; renderRiepilogo(); goToStep(3); });
  var btnBack3 = $('btn-back-3');
  if (btnBack3) btnBack3.addEventListener('click', function () { goToStep(2); });

  // Init immediato (script in fondo al body, DOM già pronto)
  (async function () {
    await caricaEvento();
      await caricaFigli();
      goToStep(2);
      updateStepper();
  })();


})();
