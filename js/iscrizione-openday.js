/**
 * iscrizione-openday.js — Iscrizione Open Day
 * Sistema Cardano Day · ITIS "G. Cardano", Pavia
 */

(function () {
  'use strict';

  var utente = API.auth.requireLogin(['genitore']);
  if (!utente) return;

  var state = { step: 2, figlio_id: null, percorso_id: null, evento: null, figli: [], percorsi: [] };

  function $(id) { return document.getElementById(id); }
  function setLoading(btn, on) { if (btn) { btn.disabled = on; btn.classList.toggle('is-loading', on); } }

  /* -- STEPPER -- */
  var STEPS = ['Evento','Figlio e percorso','Riepilogo','QR Code'];
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
    document.querySelectorAll('[data-step]').forEach(function (el) {
      el.style.display = parseInt(el.dataset.step) === n ? 'block' : 'none';
    });
    state.step = n;
    updateStepper();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* -- CARICA EVENTO -- */
  async function caricaEvento() {
    var params = new URLSearchParams(window.location.search);
    var id = parseInt(params.get('evento'));
    if (!id) {
      // Nessun ID passato — carica il primo evento open_day disponibile
      try {
        var lista = await API.events.list();
        var eventi = (lista.data || []).filter(function(e){ return e.tipo === 'open_day' && e.pubblicato; });
        if (!eventi.length) { mostraErrorePagina('Nessun Open Day disponibile al momento.'); return; }
        id = eventi[0].id;
      } catch(err) { mostraErrorePagina('Errore: ' + err.message); return; }
    }
    try {
      var data = await API.events.get(id);
      state.evento = data.data;
      state.percorsi = data.data.percorsi || [];
      renderEventoCard();
      renderPercorsi();
    } catch (err) {
      mostraErrorePagina('Errore caricamento evento: ' + err.message);
    }
  }

  function mostraErrorePagina(msg) {
    var main = document.querySelector('.iscrizione-main');
    if (main) main.innerHTML = '<div style="text-align:center;padding:4rem 2rem;color:var(--color-danger);"><div style="font-size:3rem;margin-bottom:1rem;">⚠️</div><div style="font-size:1.1rem;font-weight:600;">' + msg + '</div><a href="area-personale.html" style="display:inline-block;margin-top:1.5rem;color:var(--color-primary);">← Torna alla tua area</a></div>';
  }

  function renderEventoCard() {
    var ev = state.evento;
    if (!ev) return;
    var d = new Date(ev.data_evento);
    var giorno = d.getDate();
    var mese = d.toLocaleString('it-IT', { month: 'short' }).toUpperCase();
    var titleEl = document.querySelector('.evento-selezionato__title');
    var subEl   = document.querySelector('.evento-selezionato__sub');
    var postiEl = document.querySelector('.evento-selezionato__posti');
    if (titleEl) titleEl.textContent = ev.titolo;
    if (subEl)   subEl.textContent   = 'ITIS G. Cardano, Pavia';
    if (postiEl) postiEl.textContent = '● ' + (ev.posti_max - ev.iscritti_totali) + ' posti ancora disponibili';
    var dayEl = document.querySelector('.evento-selezionato__date-day');
    var monEl = document.querySelector('.evento-selezionato__date-month');
    if (dayEl) dayEl.textContent = giorno;
    if (monEl) monEl.textContent = mese;
  }

  /* -- CARICA FIGLI -- */
  async function caricaFigli() {
    try {
      var data = await API.users.figli();
      state.figli = data.data || [];
      renderFigli();
    } catch (err) {
      alert('Errore caricamento figli: ' + err.message);
    }
  }

  function renderFigli() {
    var grid = $('figli-select-grid');
    if (!grid) return;
    if (state.figli.length === 0) {
      grid.innerHTML = '<div style="color:var(--color-text-muted);font-size:var(--text-sm);">Nessun figlio registrato — <a href="area-personale.html">Aggiungi dalla tua area personale</a></div>';
      return;
    }
    grid.innerHTML = state.figli.map(function (f) {
      var sel = state.figlio_id === f.id ? 'figlio-option--selected' : '';
      return '<div class="figlio-option ' + sel + '" onclick="selectFiglio(' + f.id + ')">' +
        '<div class="figlio-option__avatar">' + f.nome[0] + f.cognome[0] + '</div>' +
        '<div class="figlio-option__info"><div class="figlio-option__name">' + f.nome + ' ' + f.cognome + '</div>' +
        '<div class="figlio-option__school">📍 ' + (f.nome_scuola_media || f.scuola || '—') + '</div></div>' +
        '<div class="figlio-option__radio"></div></div>';
    }).join('');
  }

  function renderPercorsi() {
    var grid = $('percorsi-grid');
    if (!grid || !state.percorsi.length) return;
    grid.innerHTML = state.percorsi.map(function (p) {
      var icons = { MISTO:'🎓', LICEO:'🔬', TECNICO:'⚙️' };
      var pct = p.posti_max > 0 ? Math.round(((p.posti_max - p.posti_max) / p.posti_max) * 100) : 0;
      var sel = state.percorso_id === p.id ? 'percorso-card--selected' : '';
      return '<div class="percorso-card ' + sel + '" onclick="selectPercorso(' + p.id + ')">' +
        '<div class="percorso-card__icon">' + (icons[p.codice] || '🎓') + '</div>' +
        '<div class="percorso-card__name">' + p.nome + '</div>' +
        '<div class="percorso-card__desc">' + (p.descrizione || '') + '</div>' +
        '<div class="percorso-card__footer"><div>' +
          '<div class="percorso-card__posti-num">' + p.posti_max + '</div>' +
          '<div class="percorso-card__posti-label">posti totali</div></div></div>' +
        '<div class="percorso-progress"><div class="percorso-progress__fill" style="width:' + pct + '%"></div></div>' +
      '</div>';
    }).join('');
  }

  window.selectFiglio = function (id) {
    state.figlio_id = id;
    renderFigli();
    updateBtnNext();
    updateSidebar();
  };

  window.selectPercorso = function (id) {
    state.percorso_id = id;
    renderPercorsi();
    updateBtnNext();
    updateSidebar();
  };

  function updateBtnNext() {
    var btn = $('btn-step-next');
    if (!btn) return;
    var ok = state.figlio_id && state.percorso_id;
    btn.disabled = !ok;
    btn.style.opacity = ok ? '1' : '0.5';
  }

  function updateSidebar() {
    var f = state.figli.find(function(x){ return x.id === state.figlio_id; });
    var p = state.percorsi.find(function(x){ return x.id === state.percorso_id; });
    var c = $('sidebar-riepilogo-rows');
    if (!c) return;
    var ev = state.evento;
    c.innerHTML = [
      { label: 'Evento',   value: ev ? ev.titolo : '—' },
      { label: 'Figlio',   value: f ? f.nome + ' ' + f.cognome : null },
      { label: 'Percorso', value: p ? p.nome : null },
      { label: 'Gruppo',   value: null, italic: 'Assegnato dopo chiusura' },
    ].map(function (r) {
      return '<div class="sidebar-riepilogo__row"><span class="sidebar-riepilogo__label">' + r.label + '</span>' +
        '<span class="sidebar-riepilogo__value">' + (r.italic ? '<em>' + r.italic + '</em>' : (r.value || '<em style="color:var(--color-text-muted)">—</em>')) + '</span></div>';
    }).join('');
  }

  /* -- STEP 3 RIEPILOGO -- */
  function renderRiepilogo() {
    var f = state.figli.find(function(x){ return x.id === state.figlio_id; });
    var p = state.percorsi.find(function(x){ return x.id === state.percorso_id; });
    var c = $('riepilogo-rows');
    if (!c || !f || !p) return;
    var ev = state.evento;
    c.innerHTML = [
      { label: 'Evento',          value: ev ? ev.titolo : '—' },
      { label: 'Figlio',          value: f.nome + ' ' + f.cognome },
      { label: 'Scuola',          value: f.nome_scuola_media || f.scuola || '—' },
      { label: 'Percorso scelto', badge: p.codice, value: p.nome },
      { label: 'Gruppo',          italic: 'Assegnato via email dopo chiusura' },
    ].map(function (r) {
      var val = r.badge ? '<span style="background:var(--color-primary);color:#fff;padding:2px 10px;border-radius:4px;font-size:12px;font-weight:700;">' + r.badge + '</span>' :
                r.italic ? '<em>' + r.italic + '</em>' : r.value || '—';
      return '<div class="riepilogo-row"><span class="riepilogo-row__label">' + r.label + '</span><span class="riepilogo-row__value">' + val + '</span></div>';
    }).join('');
  }

  /* -- CONFERMA ISCRIZIONE -- */
  var btnConferma = $('btn-step-conferma');
  if (btnConferma) {
    btnConferma.addEventListener('click', async function () {
      setLoading(btnConferma, true);
      try {
        var data = await API.registrations.create({
          id_figlio:   state.figlio_id,
          id_evento:   state.evento?.id,
          id_percorso: state.percorso_id,
        });
        // Step 4 — conferma
        var f = state.figli.find(function(x){ return x.id === state.figlio_id; });
        var p = state.percorsi.find(function(x){ return x.id === state.percorso_id; });
        var det = $('conferma-details');
        if (det) det.innerHTML =
          '<div class="riepilogo-row"><span class="riepilogo-row__label">Evento</span><span class="riepilogo-row__value">' + (state.evento?.titolo || '') + '</span></div>' +
          '<div class="riepilogo-row"><span class="riepilogo-row__label">Figlio</span><span class="riepilogo-row__value">' + (f ? f.nome + ' ' + f.cognome : '') + '</span></div>' +
          '<div class="riepilogo-row"><span class="riepilogo-row__label">Percorso</span><span class="riepilogo-row__value"><span style="background:var(--color-primary);color:#fff;padding:2px 10px;border-radius:4px;font-size:12px;font-weight:700;">' + (p?.codice || '') + '</span></span></div>';
        goToStep(4);
      } catch (err) {
        alert('Errore: ' + err.message);
      } finally {
        setLoading(btnConferma, false);
      }
    });
  }

  /* -- NAVIGAZIONE -- */
  var btnNext = $('btn-step-next');
  if (btnNext) {
    btnNext.addEventListener('click', function () {
      if (!state.figlio_id || !state.percorso_id) return;
      renderRiepilogo();
      goToStep(3);
    });
  }
  var btnBack3 = $('btn-back-3');
  if (btnBack3) btnBack3.addEventListener('click', function () { goToStep(2); });

  /* -- INIT -- */
  // Init immediato (script in fondo al body, DOM già pronto)
  (async function () {
    await caricaEvento();
      await caricaFigli();
      goToStep(2);
      updateStepper();
      updateSidebar();
  })();


})();
