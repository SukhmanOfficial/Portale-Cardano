/**
 * divisione-gruppi.js — Anteprima e gestione divisione gruppi
 * Sistema Cardano Day · ITIS "G. Cardano", Pavia
 * Collegato a API reali
 */

(function () {
  'use strict';

  var utente = API.auth.requireLogin(['segreteria', 'admin']);
  if (!utente) return;

  function $(id) { return document.getElementById(id); }

  var params     = new URLSearchParams(window.location.search);
  var id_evento  = parseInt(params.get('evento')) || 0;
  var nMisto     = parseInt(params.get('misto'))   || 4;
  var nLiceo     = parseInt(params.get('liceo'))   || 3;
  var nTecnico   = parseInt(params.get('tecnico')) || 2;

  /* -- STATO -- */
  var GRUPPI = { misto: { label:'Percorso Misto', dotCls:'percorso-dot--misto', gruppi:[] },
                 liceo: { label:'Liceo Sc. Appl.', dotCls:'percorso-dot--liceo', gruppi:[] },
                 tecnico: { label:'Percorso Tecnico', dotCls:'percorso-dot--tecnico', gruppi:[] } };

  var state = { studenteSelezionato: null, destinazione: null };

  /* -- GENERA GRUPPI BILANCIATI -- */
  function distribuisci(iscritti, totale, nGruppi, codice) {
    var base  = Math.floor(totale / nGruppi);
    var extra = totale % nGruppi;
    var gruppi = [];
    var slice4 = iscritti.slice(0, Math.min(4, iscritti.length));
    for (var i = 0; i < nGruppi; i++) {
      var dim = base + (i < extra ? 1 : 0);
      gruppi.push({ codice: codice + (i+1), studenti: slice4.slice(0, Math.min(3, dim)), totale: dim });
    }
    return gruppi;
  }

  /* -- CARICA ISCRIZIONI DALL'API -- */
  async function caricaGruppi() {
    var banner = document.querySelector('.div-banner__text');
    if (banner) banner.textContent = 'Caricamento dati...';
    try {
      if (id_evento) {
        var data = await API.registrations.list({ id_evento: id_evento, stato: 'confermata' });
        var lista = data.data || [];

        var mistoArr   = lista.filter(function(i){ return (i.percorso_nome || '').toUpperCase().includes('MISTO'); });
        var liceoArr   = lista.filter(function(i){ return (i.percorso_nome || '').toUpperCase().includes('LICEO'); });
        var tecnicoArr = lista.filter(function(i){ return (i.percorso_nome || '').toUpperCase().includes('TECNICO'); });

        // Se i gruppi sono già stati eseguiti, mostra quelli reali
        var gruppiDefiniti = lista.some(function(i){ return i.gruppo_codice; });
        if (gruppiDefiniti) {
          var gruppiMap = {};
          lista.forEach(function(i) {
            var g = i.gruppo_codice || 'N/A';
            if (!gruppiMap[g]) gruppiMap[g] = { codice:g, studenti:[], totale:0 };
            gruppiMap[g].totale++;
            if (gruppiMap[g].studenti.length < 3) gruppiMap[g].studenti.push({ initials: i.studente ? i.studente.split(' ').map(function(p){ return p[0]; }).join('') : '??', nome: i.studente || '—', scuola: i.scuola || '—' });
          });
          GRUPPI.misto.gruppi   = Object.values(gruppiMap).filter(function(g){ return g.codice.startsWith('M'); });
          GRUPPI.liceo.gruppi   = Object.values(gruppiMap).filter(function(g){ return g.codice.startsWith('L'); });
          GRUPPI.tecnico.gruppi = Object.values(gruppiMap).filter(function(g){ return g.codice.startsWith('T'); });
        } else {
          // Genera preview con dati reali
          GRUPPI.misto.gruppi   = distribuisciDaIscritti(mistoArr,   nMisto,   'M');
          GRUPPI.liceo.gruppi   = distribuisciDaIscritti(liceoArr,   nLiceo,   'L');
          GRUPPI.tecnico.gruppi = distribuisciDaIscritti(tecnicoArr, nTecnico, 'T');
        }
        if (banner) banner.innerHTML = '✅ Algoritmo completato! <strong>' + lista.length + ' studenti</strong> distribuiti in <strong>' + (nMisto+nLiceo+nTecnico) + ' gruppi</strong>';
      } else {
        if (banner) banner.innerHTML = '⚠ Seleziona un evento dalla segreteria per vedere i gruppi.';
      }
    } catch (err) {
      if (banner) banner.textContent = '⚠ Errore caricamento: ' + err.message;
      console.error(err);
    }
    aggiornaTitoli();
    renderTutti();
  }

  function distribuisciDaIscritti(iscritti, nGruppi, codice) {
    var base  = Math.floor(iscritti.length / nGruppi) || 1;
    var extra = iscritti.length % nGruppi;
    var gruppi = [];
    var idx = 0;
    for (var i = 0; i < nGruppi; i++) {
      var dim = base + (i < extra ? 1 : 0);
      var slice = iscritti.slice(idx, idx + Math.min(3, dim));
      gruppi.push({
        codice: codice + (i+1),
        totale: dim,
        studenti: slice.map(function(s){ return {
          initials: s.studente ? s.studente.split(' ').map(function(p){return p[0];}).join('') : '??',
          nome: s.studente || '—', scuola: s.scuola || '—'
        }; })
      });
      idx += dim;
    }
    return gruppi;
  }



  function aggiornaTitoli() {
    var hM = document.querySelector('#percorso-misto')?.closest('.percorso-section')?.querySelector('.percorso-title');
    var hL = document.querySelector('#percorso-liceo')?.closest('.percorso-section')?.querySelector('.percorso-title');
    var hT = document.querySelector('#percorso-tecnico')?.closest('.percorso-section')?.querySelector('.percorso-title');
    var tot = GRUPPI.misto.gruppi.reduce(function(s,g){return s+g.totale;},0) +
              GRUPPI.liceo.gruppi.reduce(function(s,g){return s+g.totale;},0) +
              GRUPPI.tecnico.gruppi.reduce(function(s,g){return s+g.totale;},0);
    if (hM) hM.textContent = 'Percorso Misto — ' + GRUPPI.misto.gruppi.reduce(function(s,g){return s+g.totale;},0) + ' studenti · ' + nMisto + ' gruppi';
    if (hL) hL.textContent = 'Liceo Sc. Appl. — ' + GRUPPI.liceo.gruppi.reduce(function(s,g){return s+g.totale;},0) + ' studenti · ' + nLiceo + ' gruppi';
    if (hT) hT.textContent = 'Percorso Tecnico — ' + GRUPPI.tecnico.gruppi.reduce(function(s,g){return s+g.totale;},0) + ' studenti · ' + nTecnico + ' gruppi';
  }

  /* -- RENDER GRUPPI -- */
  function renderPercorso(key) {
    var el = $('percorso-' + key);
    if (!el) return;
    el.innerHTML = GRUPPI[key].gruppi.map(function (g) {
      var studHtml = g.studenti.map(function (s) {
        return '<div class="gruppo-studente"><div class="gruppo-studente__initials">' + s.initials + '</div><span>' + s.nome + ' <span style="color:var(--color-text-muted);">· ' + s.scuola + '</span></span></div>';
      }).join('');
      var altri = g.totale - g.studenti.length;
      var altriHtml = altri > 0 ? '<div class="gruppo-altri">+' + altri + ' altri →</div>' : '';
      return '<div class="gruppo-card" draggable="true"' +
        ' onclick="selezionaStudente(\'' + g.codice + '\',\'' + key + '\')"' +
        ' id="gruppo-card-' + g.codice + '"' +
        ' data-codice="' + g.codice + '" data-percorso="' + key + '">' +
        '<div class="drop-zone-hint">📥 Rilascia qui</div>' +
        '<div class="gruppo-card__code">' + g.codice + '</div>' +
        '<div class="gruppo-card__count">' + g.totale + ' studenti</div>' +
        '<div class="gruppo-card__studenti">' + studHtml + altriHtml + '</div>' +
      '</div>';
    }).join('') +
    '<div class="gruppo-card gruppo-card--add" onclick="aggiungiGruppo(\'' + key + '\')">' +
      '+ Aggiungi gruppo ' + GRUPPI[key].gruppi[0]?.codice[0] + (GRUPPI[key].gruppi.length+1) +
    '</div>';
  }

  function renderTutti() {
    Object.keys(GRUPPI).forEach(renderPercorso);
  }

  /* -- SELEZIONE STUDENTE -- */
  window.selezionaStudente = function (codice, percorso) {
    var g = GRUPPI[percorso].gruppi.find(function(g){ return g.codice === codice; });
    if (!g || !g.studenti.length) return;
    state.studenteSelezionato = { nome: g.studenti[0].nome, initials: g.studenti[0].initials, scuola: g.studenti[0].scuola, gruppoCorrente: codice, percorso: percorso };
    state.destinazione = null;
    document.querySelectorAll('.gruppo-card').forEach(function(el){ el.classList.remove('gruppo-card--selected'); });
    var card = $('gruppo-card-' + codice);
    if (card) card.classList.add('gruppo-card--selected');
    aggiornaSposta();
  };

  function aggiornaSposta() {
    var s = state.studenteSelezionato;
    if (!s) return;
    var pg = GRUPPI[s.percorso];
    var altriGruppi = pg.gruppi.filter(function(g){ return g.codice !== s.gruppoCorrente; });
    var sbox = $('sposta-studente-box');
    if (sbox) sbox.innerHTML = '<div class="sposta-studente-box__avatar">' + s.initials + '</div><div><div class="sposta-studente-box__name">' + s.nome + '</div><div class="sposta-studente-box__sub">Attualmente: ' + s.gruppoCorrente + ' · ' + pg.label + '</div></div>';
    var destGrid = $('dest-grid');
    if (destGrid) {
      destGrid.innerHTML = altriGruppi.map(function(g){
        var act = state.destinazione === g.codice ? 'dest-btn--active' : '';
        return '<button class="dest-btn ' + act + '" onclick="selezionaDest(\'' + g.codice + '\')">' +
          '<div style="font-size:var(--text-lg);font-weight:900;">' + g.codice + '</div>' +
          '<div class="dest-btn__sub">' + g.totale + ' stud.</div></button>';
      }).join('');
    }
    var btnConf = $('btn-sposta-conferma');
    if (btnConf) {
      btnConf.textContent = state.destinazione ? '→ SPOSTA IN ' + state.destinazione : 'Seleziona gruppo di destinazione';
      btnConf.disabled    = !state.destinazione;
      btnConf.style.opacity = state.destinazione ? '1' : '0.6';
    }
  }

  window.selezionaDest = function (codice) {
    state.destinazione = codice;
    aggiornaSposta();
  };

  window.spostaStudente = async function () {
    if (!state.studenteSelezionato || !state.destinazione) return;
    var s = state.studenteSelezionato;
    if (!confirm('Spostare ' + s.nome + ' da ' + s.gruppoCorrente + ' a ' + state.destinazione + '?')) return;

    // Trova id iscrizione dal gruppo (in produzione dall'API)
    try {
      // In produzione: API.registrations.sposta(id_iscrizione, state.destinazione)
      alert('Studente spostato! ' + s.nome + ': ' + s.gruppoCorrente + ' → ' + state.destinazione + '\n(in produzione: chiamata API PUT /api/registrations/?action=sposta)');
      state.studenteSelezionato = null;
      state.destinazione = null;
      document.querySelectorAll('.gruppo-card').forEach(function(el){ el.classList.remove('gruppo-card--selected'); });
    } catch (err) { alert('Errore: ' + err.message); }
  };

  window.annullaSposta = function () {
    state.studenteSelezionato = null;
    state.destinazione = null;
    document.querySelectorAll('.gruppo-card').forEach(function(el){ el.classList.remove('gruppo-card--selected'); });
  };

  window.aggiungiGruppo = function (percorso) {
    alert('Aggiungi gruppo al percorso ' + GRUPPI[percorso].label);
  };

  window.rieseguiDivisione = async function () {
    if (!confirm('Rieseguire la divisione? Le assegnazioni correnti verranno sovrascritte.')) return;
    if (!id_evento) { alert('Nessun evento selezionato'); return; }
    try {
      await API.registrations.dividi(id_evento, { MISTO:nMisto, LICEO:nLiceo, TECNICO:nTecnico });
      alert('Divisione rieseguita!');
      caricaGruppi();
    } catch (err) { alert('Errore: ' + err.message); }
  };

  window.confermaInviaEmail = async function () {
    if (!id_evento) { alert('Nessun evento selezionato'); return; }
    if (!confirm('Confermare e inviare email con QR aggiornato a tutti i genitori?')) return;
    try {
      var data = await API.registrations.confermaGruppi(id_evento);
      alert('Email inviate a ' + data.email_inviate + ' genitori!');
      window.location.href = 'segreteria.html';
    } catch (err) { alert('Errore: ' + err.message); }
  };

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
  document.addEventListener('DOMContentLoaded', function () {
    caricaGruppi();
  });

})();

/* ============================================================
   DRAG & DROP — sposta studente tra gruppi
   ============================================================ */

var _dragSourceCodice  = null;
var _dragSourcePercorso = null;

document.addEventListener('dragstart', function(e) {
  var card = e.target.closest('.gruppo-card[draggable="true"]');
  if (!card) return;
  _dragSourceCodice   = card.dataset.codice;
  _dragSourcePercorso = card.dataset.percorso;
  card.classList.add('gruppo-card--dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', card.dataset.codice);
});

document.addEventListener('dragend', function(e) {
  document.querySelectorAll('.gruppo-card--dragging, .gruppo-card--drag-over').forEach(function(el) {
    el.classList.remove('gruppo-card--dragging', 'gruppo-card--drag-over');
  });
});

document.addEventListener('dragover', function(e) {
  var card = e.target.closest('.gruppo-card[data-codice]');
  if (!card || card.dataset.codice === _dragSourceCodice) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  // Rimuovi da tutti poi aggiungi solo a questo
  document.querySelectorAll('.gruppo-card--drag-over').forEach(function(el){
    if (el !== card) el.classList.remove('gruppo-card--drag-over');
  });
  card.classList.add('gruppo-card--drag-over');
});

document.addEventListener('dragleave', function(e) {
  var card = e.target.closest('.gruppo-card[data-codice]');
  if (card && !card.contains(e.relatedTarget)) {
    card.classList.remove('gruppo-card--drag-over');
  }
});

document.addEventListener('drop', function(e) {
  var destCard = e.target.closest('.gruppo-card[data-codice]');
  if (!destCard || !_dragSourceCodice) return;
  e.preventDefault();
  destCard.classList.remove('gruppo-card--drag-over');

  var destCodice   = destCard.dataset.codice;
  var destPercorso = destCard.dataset.percorso;

  if (destCodice === _dragSourceCodice) return;

  // Trova primo studente del gruppo sorgente
  var srcGruppo = GRUPPI[_dragSourcePercorso]?.gruppi?.find(function(g){ return g.codice === _dragSourceCodice; });
  if (!srcGruppo || !srcGruppo.studenti.length) return;

  var studente = srcGruppo.studenti[0];

  // Mostra conferma
  if (!confirm('Spostare ' + studente.nome + '\nda ' + _dragSourceCodice + ' → ' + destCodice + '?')) {
    _dragSourceCodice = null; _dragSourcePercorso = null;
    return;
  }

  // Aggiorna dati locali
  srcGruppo.studenti.shift();
  srcGruppo.totale = Math.max(0, srcGruppo.totale - 1);
  var destGruppo = GRUPPI[destPercorso]?.gruppi?.find(function(g){ return g.codice === destCodice; });
  if (destGruppo) {
    destGruppo.studenti.push(studente);
    destGruppo.totale++;
  }

  _dragSourceCodice = null;
  _dragSourcePercorso = null;
  renderTutti();

  // In produzione chiama API
  // API.registrations.sposta(id_iscrizione, destCodice);
});
