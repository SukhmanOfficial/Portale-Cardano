/**
 * crea-evento.js — Crea / modifica evento
 * Sistema Cardano Day · ITIS "G. Cardano", Pavia
 * Collegato a API reali
 */

(function () {
  'use strict';

  var utente = API.auth.requireLogin(['segreteria', 'admin']);
  if (!utente) return;

  var state = {
    tipo: 'open_day',
    laboratori: [
      { id:1, nome:'Informatica',    codice:'I', icon:'💻', aule_t1:2, posti_t1:25, aule_t2:1, posti_t2:25 },
      { id:2, nome:'Elettronica',    codice:'E', icon:'⚡', aule_t1:1, posti_t1:25, aule_t2:1, posti_t2:25 },
      { id:3, nome:'Meccanica',      codice:'M', icon:'⚙️', aule_t1:1, posti_t1:25, aule_t2:2, posti_t2:25 },
      { id:4, nome:'Chimica',        codice:'C', icon:'🧪', aule_t1:1, posti_t1:25, aule_t2:1, posti_t2:25 },
      { id:5, nome:'Liceo Sc.Appl.', codice:'L', icon:'🔬', aule_t1:1, posti_t1:25, aule_t2:1, posti_t2:25 },
    ],
    eventoId: null, // se modifica
  };

  function $(id)   { return document.getElementById(id); }
  function val(id) { var el=$(id); return el ? el.value : ''; }

  /* -- CONTROLLA SE MODIFICA (id in URL) -- */
  var params = new URLSearchParams(window.location.search);
  state.eventoId = params.get('id') ? parseInt(params.get('id')) : null;

  /* -- TIPO EVENTO -- */
  window.setTipo = function (tipo) {
    state.tipo = tipo;
    document.querySelectorAll('.tipo-tab').forEach(function (el) {
      el.classList.toggle('tipo-tab--active', el.dataset.tipo === tipo);
    });
    var turniSection  = $('turni-section');
    var labSection    = $('lab-section');
    var postiSection  = $('posti-percorso-section');
    if (turniSection) turniSection.classList.toggle('visible', tipo === 'cardano_day');
    if (labSection)   labSection.style.display   = tipo === 'cardano_day' ? 'block' : 'none';
    if (postiSection) postiSection.style.display  = tipo === 'open_day'   ? 'block' : 'none';

    // Titolo automatico
    var titoloInput = $('ev-titolo');
    if (titoloInput) {
      var dataVal = val('ev-data');
      var mese    = '';
      if (dataVal) {
        var d = new Date(dataVal + 'T00:00:00');
        mese  = d.toLocaleString('it-IT', { month:'long' });
        mese  = mese.charAt(0).toUpperCase() + mese.slice(1);
      }
      var label = tipo === 'open_day' ? 'Open Day' : 'Cardano Day';
      titoloInput.value = mese ? label + ' \u2014 ' + mese + ' ' + new Date().getFullYear() : label;
    }

    if (tipo === 'open_day') aggiornaTotalePosti();
    else { var pi = $('ev-posti'); if (pi) pi.value = calcolaTotale(); }
    aggiornaAnteprima();
  };

  /* -- POSTI PER PERCORSO (Open Day) -- */
  window.aggiornaTotalePosti = function () {
    var m = parseInt(val('posti-misto'))   || 0;
    var l = parseInt(val('posti-liceo'))   || 0;
    var t = parseInt(val('posti-tecnico')) || 0;
    var tot = m + l + t;
    var pi  = $('ev-posti');
    if (pi) pi.value = tot;
    var lbl = $('posti-totale-label');
    if (lbl) lbl.textContent = tot;
    aggiornaAnteprima();
  };

  function calcolaTotale() {
    return state.laboratori.reduce(function (s, lab) {
      return s + lab.aule_t1 * lab.posti_t1 + lab.aule_t2 * lab.posti_t2;
    }, 0);
  }

  /* -- RENDER LABORATORI -- */
  function renderLaboratori() {
    var container = $('lab-list');
    if (!container) return;
    container.innerHTML = state.laboratori.map(function (lab) {
      var totT1 = lab.aule_t1 * lab.posti_t1;
      var totT2 = lab.aule_t2 * lab.posti_t2;
      return '<div class="lab-config-card" id="lab-card-' + lab.id + '">' +
        '<div class="lab-config-card__header">' +
          '<span class="lab-config-icon">' + lab.icon + '</span>' +
          '<span class="lab-config-name">' + lab.nome + '</span>' +
          '<div class="lab-config-badge">' + lab.codice + '</div>' +
          '<button onclick="rimuoviLab(' + lab.id + ')" style="margin-left:auto;background:none;border:none;cursor:pointer;color:var(--color-danger);">✕</button>' +
        '</div>' +
        '<div class="lab-turni-grid">' +
          '<div class="lab-turno-config">' +
            '<div class="lab-turno-config__label">Turno 1</div>' +
            '<div class="lab-turno-config__row">' +
              '<input type="number" class="lab-num-input" min="1" max="9" value="' + lab.aule_t1 + '" onchange="aggiornaLab(' + lab.id + ',\'aule_t1\',this.value)"/> aule × ' +
              '<input type="number" class="lab-posti-input" min="1" max="99" value="' + lab.posti_t1 + '" onchange="aggiornaLab(' + lab.id + ',\'posti_t1\',this.value)"/> posti' +
            '</div><div class="lab-total-note">= ' + totT1 + ' posti totali</div>' +
          '</div>' +
          '<div class="lab-turno-config">' +
            '<div class="lab-turno-config__label">Turno 2</div>' +
            '<div class="lab-turno-config__row">' +
              '<input type="number" class="lab-num-input" min="1" max="9" value="' + lab.aule_t2 + '" onchange="aggiornaLab(' + lab.id + ',\'aule_t2\',this.value)"/> aule × ' +
              '<input type="number" class="lab-posti-input" min="1" max="99" value="' + lab.posti_t2 + '" onchange="aggiornaLab(' + lab.id + ',\'posti_t2\',this.value)"/> posti' +
            '</div><div class="lab-total-note">= ' + totT2 + ' posti totali</div>' +
          '</div>' +
        '</div></div>';
    }).join('');
  }

  window.aggiornaLab = function (id, campo, valore) {
    var lab = state.laboratori.find(function(l){ return l.id === id; });
    if (!lab) return;
    lab[campo] = parseInt(valore) || 1;
    var card = $('lab-card-' + id);
    if (card) {
      var notes = card.querySelectorAll('.lab-total-note');
      if (notes[0]) notes[0].textContent = '= ' + lab.aule_t1*lab.posti_t1 + ' posti totali';
      if (notes[1]) notes[1].textContent = '= ' + lab.aule_t2*lab.posti_t2 + ' posti totali';
    }
    var pi = $('ev-posti');
    if (pi && state.tipo === 'cardano_day') pi.value = calcolaTotale();
    aggiornaAnteprima();
  };

  window.rimuoviLab = function (id) {
    if (state.laboratori.length <= 1) { alert('Almeno un laboratorio richiesto'); return; }
    state.laboratori = state.laboratori.filter(function(l){ return l.id !== id; });
    renderLaboratori(); aggiornaAnteprima();
  };

  window.aggiungiLaboratorio = function () {
    var nomi  = ['Fisica','Biologia','Disegno','Robotica'];
    var cod   = ['F','B','D','R'];
    var icon  = ['🔭','🌿','✏️','🤖'];
    var idx   = state.laboratori.length % nomi.length;
    state.laboratori.push({ id: Date.now(), nome:nomi[idx], codice:cod[idx], icon:icon[idx], aule_t1:1, posti_t1:25, aule_t2:1, posti_t2:25 });
    renderLaboratori(); aggiornaAnteprima();
  };

  /* -- ANTEPRIMA LIVE -- */
  function aggiornaAnteprima() {
    var titolo = val('ev-titolo');
    var data   = val('ev-data');
    var posti  = val('ev-posti');
    var d = data ? new Date(data+'T00:00:00') : null;
    var dayEl  = $('prev-day');   if (dayEl)  dayEl.textContent  = d ? d.getDate() : '—';
    var monEl  = $('prev-month'); if (monEl)  monEl.textContent  = d ? d.toLocaleString('it-IT',{month:'short'}).toUpperCase() : '—';
    var nameEl = $('prev-name');  if (nameEl) nameEl.textContent = titolo || (state.tipo==='open_day'?'Open Day':'Cardano Day');
    var postiEl = $('prev-posti'); if (postiEl && posti) postiEl.textContent = '● ' + posti + ' posti';
    var apEl    = $('prev-apertura'); if (apEl) apEl.textContent = val('ev-apertura') ? 'Iscrizioni: ' + val('ev-apertura') : '—';
    var chEl    = $('prev-chiusura'); if (chEl) chEl.textContent = val('ev-chiusura') ? '→ ' + val('ev-chiusura') : '';

    var tagsEl = $('prev-tags');
    if (tagsEl) {
      if (state.tipo === 'cardano_day') {
        tagsEl.innerHTML = state.laboratori.map(function(l){ return '<span class="ev-preview__tag ev-preview__tag--info">' + l.nome + '</span>'; }).join('');
      } else {
        tagsEl.innerHTML = '<span class="ev-preview__tag ev-preview__tag--misto">Misto</span><span class="ev-preview__tag ev-preview__tag--info">Liceo</span><span class="ev-preview__tag ev-preview__tag--info">Tecnico</span>';
      }
    }
  }

  /* -- RACCOLTA DATI -- */
  function raccogliDati() {
    return {
      tipo:                 state.tipo,
      titolo:               val('ev-titolo'),
      descrizione:          val('ev-descrizione'),
      data_evento:          val('ev-data'),
      posti_max:            parseInt(val('ev-posti')) || 0,
      pubblicato:           val('ev-pubblicato') === 'si' ? 1 : 0,
      apertura_iscrizioni:  val('ev-apertura'),
      chiusura_iscrizioni:  val('ev-chiusura'),
      inizio_t1:            val('ev-inizio-t1') || null,
      fine_t1:              val('ev-fine-t1')   || null,
      inizio_t2:            val('ev-inizio-t2') || null,
      fine_t2:              val('ev-fine-t2')   || null,
      percorsi: state.tipo === 'open_day' ? [
        { codice:'MISTO',   nome:'Percorso Misto',       posti_max: parseInt(val('posti-misto'))   || 100 },
        { codice:'LICEO',   nome:'Liceo Sc. Appl.',      posti_max: parseInt(val('posti-liceo'))   || 100 },
        { codice:'TECNICO', nome:'Percorso Tecnico',     posti_max: parseInt(val('posti-tecnico')) || 100 },
      ] : [],
      laboratori: state.tipo === 'cardano_day' ? state.laboratori.map(function(l){
        return { codice:l.codice, nome:l.nome, aule_t1:l.aule_t1, posti_t1:l.posti_t1, aule_t2:l.aule_t2, posti_t2:l.posti_t2 };
      }) : [],
    };
  }

  function valida(dati) {
    if (!dati.titolo)            { alert('Inserisci il titolo');               return false; }
    if (!dati.data_evento)       { alert('Inserisci la data');                  return false; }
    if (!dati.posti_max)         { alert('Inserisci i posti massimi');          return false; }
    if (!dati.apertura_iscrizioni) { alert('Inserisci la data di apertura');   return false; }
    if (!dati.chiusura_iscrizioni) { alert('Inserisci la data di chiusura');   return false; }
    return true;
  }

  /* -- PUBBLICA -- */
  window.pubblicaEvento = async function () {
    var dati = raccogliDati();
    dati.pubblicato = 1;
    if (!valida(dati)) return;
    var btn = $('btn-pubblica');
    if (btn) { btn.disabled = true; btn.textContent = 'Pubblicazione...'; }
    try {
      if (state.eventoId) await API.events.update(state.eventoId, dati);
      else await API.events.create(dati);
      alert('Evento pubblicato con successo!');
      window.location.href = 'segreteria.html';
    } catch (err) {
      alert('Errore: ' + err.message);
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = '✓ Pubblica evento'; }
    }
  };

  /* -- SALVA BOZZA -- */
  window.salvaBozza = async function () {
    var dati = raccogliDati();
    dati.pubblicato = 0;
    if (!dati.titolo) { alert('Inserisci almeno il titolo'); return; }
    var btn = $('btn-bozza');
    if (btn) { btn.disabled = true; btn.textContent = 'Salvataggio...'; }
    try {
      if (state.eventoId) await API.events.update(state.eventoId, dati);
      else await API.events.create(dati);
      alert('Bozza salvata!');
    } catch (err) {
      alert('Errore: ' + err.message);
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = '💾 Salva come bozza'; }
    }
  };

  /* -- CARICA SE MODIFICA -- */
  async function caricaEvento() {
    if (!state.eventoId) return;
    try {
      var data = await API.events.get(state.eventoId);
      var ev   = data.data;
      var setVal = function(id, v) { var el=$(id); if(el&&v!=null) el.value=v; };
      setVal('ev-titolo',      ev.titolo);
      setVal('ev-data',        ev.data_evento);
      setVal('ev-descrizione', ev.descrizione);
      setVal('ev-posti',       ev.posti_max);
      setVal('ev-pubblicato',  ev.pubblicato ? 'si' : 'no');
      setVal('ev-apertura',    ev.apertura_iscrizioni?.slice(0,16));
      setVal('ev-chiusura',    ev.chiusura_iscrizioni?.slice(0,16));
      setVal('ev-inizio-t1',   ev.inizio_turno1);
      setVal('ev-fine-t1',     ev.fine_turno1);
      setVal('ev-inizio-t2',   ev.inizio_turno2);
      setVal('ev-fine-t2',     ev.fine_turno2);
      if (ev.tipo === 'cardano_day' && ev.laboratori?.length) {
        state.laboratori = ev.laboratori.map(function(l){ return { id:l.id, nome:l.nome, codice:l.codice, icon:'🔬', aule_t1:l.aule_t1, posti_t1:l.posti_aula_t1, aule_t2:l.aule_t2, posti_t2:l.posti_aula_t2 }; });
      }
      setTipo(ev.tipo);
    } catch (err) { console.error('[Carica evento]', err.message); }
  }

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
  updateToggle(); window.addEventListener('resize', updateToggle);

  /* -- INIT -- */
  document.addEventListener('DOMContentLoaded', async function () {
    ['ev-titolo','ev-data','ev-posti','ev-pubblicato','ev-apertura','ev-chiusura',
     'ev-inizio-t1','ev-fine-t1','ev-inizio-t2','ev-fine-t2',
     'posti-misto','posti-liceo','posti-tecnico'].forEach(function(id) {
      var el = $(id);
      if (el) el.addEventListener('input', aggiornaAnteprima);
    });

    if (state.eventoId) {
      await caricaEvento();
    } else {
      setTipo('open_day');
    }
    renderLaboratori();
    aggiornaAnteprima();
  });

})();
