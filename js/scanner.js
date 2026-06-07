/**
 * scanner.js — Scanner QR con 4 tab firme
 * Sistema Cardano Day · ITIS G. Cardano, Pavia
 *
 * - 4 tab fissi: Entrata | Lab T1 | Lab T2 | Uscita
 * - Salva stato firma in localStorage
 * - Segreteria può bloccare Entrata e Uscita
 */

(function () {
  'use strict';

  var utente = API.auth.requireLogin(['staff','professore','segreteria','admin']);
  if (!utente) return;

  var isSegreteria = ['segreteria','admin'].includes(utente.ruolo);

  /* ----------------------------------------------------------
     STATO localStorage
     ---------------------------------------------------------- */
  var LS_KEY = 'cardano_scanner_stato';

  function getSavedState() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : { firmaAttiva: 1, bloccoEntrata: false, bloccoUscita: false };
    } catch(e) { return { firmaAttiva: 1, bloccoEntrata: false, bloccoUscita: false }; }
  }

  function saveState(s) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch(e) {}
  }

  var stato = getSavedState();

  /* ----------------------------------------------------------
     FIRME CONFIG
     ---------------------------------------------------------- */
  var FIRME = [
    { num: 1, label: 'Entrata',   icon: '🚪', desc: 'Ingresso principale' },
    { num: 2, label: 'Lab T1',    icon: '🔬', desc: 'Laboratorio Turno 1 · 8:30' },
    { num: 3, label: 'Lab T2',    icon: '⚡', desc: 'Laboratorio Turno 2 · 11:00' },
    { num: 4, label: 'Uscita',    icon: '✅', desc: 'Uscita dalla scuola' },
  ];

  function $ (id) { return document.getElementById(id); }

  /* ----------------------------------------------------------
     TOPBAR
     ---------------------------------------------------------- */
  var nameEl = $('topbar-user-name');
  if (nameEl) nameEl.textContent = utente.nome + ' ' + utente.cognome;
  var initEl = $('topbar-avatar');
  if (initEl) initEl.textContent = (utente.nome[0] + utente.cognome[0]).toUpperCase();

  /* ----------------------------------------------------------
     NAVIGAZIONE SEZIONI
     ---------------------------------------------------------- */
  function showSection(name) {
    document.querySelectorAll('[data-section]').forEach(function(el){
      el.style.display = el.dataset.section === name ? 'block' : 'none';
    });
    document.querySelectorAll('[data-nav]').forEach(function(el){
      el.classList.toggle('scan-nav-link--active', el.dataset.nav === name);
      el.classList.toggle('mobile-nav-item--active', el.dataset.nav === name);
    });
    if (name === 'studenti') caricaStudenti();
  }

  document.querySelectorAll('[data-nav]').forEach(function(btn){
    btn.addEventListener('click', function(){ showSection(btn.dataset.nav); });
  });

  /* ----------------------------------------------------------
     RENDER 4 TAB FIRME
     ---------------------------------------------------------- */
  function renderFirmeTabs() {
    var container = $('firme-tabs');
    if (!container) return;

    container.innerHTML = FIRME.map(function(f) {
      var isActive  = stato.firmaAttiva === f.num;
      var isBlocked = (f.num === 1 && stato.bloccoEntrata) || (f.num === 4 && stato.bloccoUscita);
      var activeCls = isActive  ? 'firma-tab--active'  : '';
      var blockCls  = isBlocked ? 'firma-tab--blocked' : '';

      return '<button class="firma-tab ' + activeCls + ' ' + blockCls + '" ' +
        'onclick="selezionaFirma(' + f.num + ')" ' +
        (isBlocked ? 'disabled title="Bloccata dalla segreteria"' : '') + '>' +
        '<span class="firma-tab__icon">' + f.icon + '</span>' +
        '<span class="firma-tab__label">' + f.label + '</span>' +
        (isBlocked ? '<span class="firma-tab__lock">🔒</span>' : '') +
        (isActive  ? '<span class="firma-tab__dot"></span>' : '') +
      '</button>';
    }).join('');

    // Aggiorna titolo scanner
    var firma = FIRME.find(function(f){ return f.num === stato.firmaAttiva; });
    var titleEl = $('scanner-title');
    if (titleEl && firma) titleEl.innerHTML = 'Scanner QR — <em>Firma ' + firma.num + ' · ' + firma.label + '</em>';
    var subEl = $('scanner-sub');
    if (subEl && firma) subEl.textContent = firma.desc;

    // Aggiorna fasi sidebar
    renderFasiSidebar();

    // Blocchi segreteria
    if (isSegreteria) renderBlocchiSegreteria();
  }

  window.selezionaFirma = function(num) {
    var firma = FIRME.find(function(f){ return f.num === num; });
    if (!firma) return;
    if ((num === 1 && stato.bloccoEntrata) || (num === 4 && stato.bloccoUscita)) {
      alert('Questa firma è bloccata dalla segreteria.');
      return;
    }
    stato.firmaAttiva = num;
    saveState(stato);
    renderFirmeTabs();
  };

  /* ----------------------------------------------------------
     FASI SIDEBAR
     ---------------------------------------------------------- */
  function renderFasiSidebar() {
    var el = $('fasi-list');
    if (!el) return;
    el.innerHTML = FIRME.map(function(f) {
      var isActive  = stato.firmaAttiva === f.num;
      var isBlocked = (f.num === 1 && stato.bloccoEntrata) || (f.num === 4 && stato.bloccoUscita);
      return '<div class="scan-fase' + (isActive ? ' scan-fase--active' : '') + (isBlocked ? ' scan-fase--blocked' : '') + '">' +
        '<span class="scan-fase__icon">' + (isBlocked ? '🔒' : f.icon) + '</span>' +
        '<span class="scan-fase__label">' + f.label + '</span>' +
        (isActive ? '<span class="scan-fase__dot"></span>' : '') +
      '</div>';
    }).join('');
  }

  /* ----------------------------------------------------------
     PANNELLO BLOCCHI (solo segreteria)
     ---------------------------------------------------------- */
  function renderBlocchiSegreteria() {
    var container = $('blocchi-segreteria');
    if (!container) return;
    container.innerHTML =
      '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:rgba(255,255,255,0.4);margin-bottom:var(--space-2);">Controllo firme</div>' +
      '<div style="display:flex;flex-direction:column;gap:var(--space-2);">' +
        '<label class="blocco-toggle">' +
          '<input type="checkbox" ' + (stato.bloccoEntrata ? 'checked' : '') + ' onchange="toggleBlocco(\'entrata\',this.checked)" />' +
          '<span>🔒 Blocca Entrata</span>' +
        '</label>' +
        '<label class="blocco-toggle">' +
          '<input type="checkbox" ' + (stato.bloccoUscita ? 'checked' : '') + ' onchange="toggleBlocco(\'uscita\',this.checked)" />' +
          '<span>🔒 Blocca Uscita</span>' +
        '</label>' +
      '</div>';
  }

  window.toggleBlocco = function(tipo, bloccato) {
    if (tipo === 'entrata') stato.bloccoEntrata = bloccato;
    if (tipo === 'uscita')  stato.bloccoUscita  = bloccato;
    saveState(stato);
    renderFirmeTabs();
    // Se la firma attiva è stata bloccata → passa alla successiva libera
    var firmaCorrente = FIRME.find(function(f){ return f.num === stato.firmaAttiva; });
    var bloccataCorrente = (stato.firmaAttiva === 1 && stato.bloccoEntrata) ||
                           (stato.firmaAttiva === 4 && stato.bloccoUscita);
    if (bloccataCorrente) {
      var libera = FIRME.find(function(f){
        return !((f.num===1&&stato.bloccoEntrata)||(f.num===4&&stato.bloccoUscita));
      });
      if (libera) selezionaFirma(libera.num);
    }
  };

  /* ----------------------------------------------------------
     SCANSIONE QR
     ---------------------------------------------------------- */
  async function processaScan(token) {
    if (!token || !token.trim()) return;
    var firm = FIRME.find(function(f){ return f.num === stato.firmaAttiva; });

    // Verifica blocchi
    if ((stato.firmaAttiva===1&&stato.bloccoEntrata)||(stato.firmaAttiva===4&&stato.bloccoUscita)) {
      mostraErrore('Firma "' + (firm?.label||'') + '" bloccata dalla segreteria.');
      return;
    }

    var resultBox = $('result-box');
    if (resultBox) {
      resultBox.className = 'result-box result-box--loading';
      resultBox.innerHTML = '<div style="text-align:center;padding:2rem;color:rgba(255,255,255,0.6);">Verifica in corso...</div>';
    }

    try {
      var labSelect = $('lab-select');
      var lab = labSelect ? labSelect.value : '';
      var data = await API.qr.scan(token.trim(), stato.firmaAttiva, lab);
      mostraSuccesso(data);
    } catch (err) {
      mostraErrore(err.message);
    }
  }

  function mostraSuccesso(data) {
    var resultBox = $('result-box');
    if (!resultBox) return;
    resultBox.className = 'result-box result-box--success';

    var firma = FIRME.find(function(f){ return f.num === stato.firmaAttiva; });
    var firmeHtml = renderFirmeMiniStatus(data.firme || [], data.firme_totali || 0);

    resultBox.innerHTML =
      '<div class="result-status result-status--ok">✓ ' + (data.firma_appena || firma?.label || 'Registrata') + '</div>' +
      '<div class="result-studente">' + (data.studente || '') + '</div>' +
      '<div class="result-detail">' + (data.scuola || '') + '</div>' +
      '<div class="result-detail">Gruppo: <strong>' + (data.gruppo || '—') + '</strong>' +
        (data.aula_t1 ? ' · Aula T1: <strong>' + data.aula_t1 + '</strong>' : '') +
        (data.aula_t2 ? ' · Aula T2: <strong>' + data.aula_t2 + '</strong>' : '') +
      '</div>' +
      firmeHtml +
      (data.prossima_firma
        ? '<div class="result-next">→ Prossima firma: <strong>' + data.prossima_firma + '</strong></div>'
        : '<div class="result-done">✅ Tutte le firme completate!</div>');

    // Avanza automaticamente alla prossima firma
    if (data.prossima_firma && !stato.bloccoEntrata && !stato.bloccoUscita) {
      var prossimaNum = (stato.firmaAttiva % 4) + 1;
      var libera = !((prossimaNum===1&&stato.bloccoEntrata)||(prossimaNum===4&&stato.bloccoUscita));
      if (libera && prossimaNum <= 4) {
        setTimeout(function(){
          selezionaFirma(prossimaNum);
        }, 1500);
      }
    }
  }

  function renderFirmeMiniStatus(firme, count) {
    return '<div class="firme-status">' +
      FIRME.map(function(f) {
        var done = f.num <= count;
        return '<div class="firma-step ' + (done ? 'firma-step--done' : '') + '">' +
          '<div class="firma-step__circle">' + (done ? '✓' : f.num) + '</div>' +
          '<div class="firma-step__label">' + f.label + '</div>' +
        '</div>';
      }).join('') +
    '</div>';
  }

  function mostraErrore(msg) {
    var resultBox = $('result-box');
    if (!resultBox) return;
    resultBox.className = 'result-box result-box--error';
    resultBox.innerHTML =
      '<div class="result-status result-status--error">✗ Errore</div>' +
      '<div class="result-detail">' + msg + '</div>';
    setTimeout(function(){
      if (resultBox.className.includes('error')) {
        resultBox.className = 'result-box result-box--waiting';
        resultBox.innerHTML = '';
      }
    }, 4000);
  }

  /* ----------------------------------------------------------
     INPUT MANUALE
     ---------------------------------------------------------- */
  var btnVerifica = $('btn-verifica');
  if (btnVerifica) {
    btnVerifica.addEventListener('click', function(){
      var input = $('manual-input');
      var token = input ? input.value.trim() : '';
      if (token) { processaScan(token); if (input) input.value = ''; }
    });
  }

  var manualInput = $('manual-input');
  if (manualInput) {
    manualInput.addEventListener('keypress', function(e){
      if (e.key === 'Enter') {
        var token = manualInput.value.trim();
        if (token) { processaScan(token); manualInput.value = ''; }
      }
    });
  }

  /* Demo scan */
  var btnDemo = $('btn-demo-scan');
  if (btnDemo) {
    btnDemo.addEventListener('click', function(){
      processaScan('demo_token_test_' + Date.now());
    });
  }

  /* ----------------------------------------------------------
     ELENCO STUDENTI
     ---------------------------------------------------------- */
  async function caricaStudenti() {
    var tbody  = $('studenti-tbody');
    var footer = $('studenti-footer');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:rgba(255,255,255,0.4);">Caricamento...</td></tr>';

    try {
      var params = new URLSearchParams(window.location.search);
      var id_evento = params.get('evento') || 0;
      var data = await API.qr.presenze(id_evento);
      var presenze = data.presenze || [];
      var totali   = data.totali   || {};

      if (!presenze.length) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:rgba(255,255,255,0.4);">Nessuno studente trovato</td></tr>';
        return;
      }

      tbody.innerHTML = presenze.map(function(s) {
        var firme = FIRME.map(function(f) {
          var fatto = f.num <= s.firme_count;
          return '<td style="text-align:center;color:' + (fatto ? 'var(--color-success)' : 'rgba(255,255,255,0.3)') + ';font-weight:' + (fatto ? '700' : '400') + ';">' + (fatto ? '✓' : '—') + '</td>';
        }).join('');
        return '<tr>' +
          '<td style="font-weight:600;">' + (s.studente||'—') + '</td>' +
          '<td>' + (s.scuola||'—') + '</td>' +
          '<td>' + (s.percorso||'—') + '</td>' +
          '<td>' + (s.percorso||'—') + '</td>' +
          firme +
        '</tr>';
      }).join('');

      if (footer) footer.textContent = (totali.iscritti||0) + ' iscritti · ' + (totali.entrati||0) + ' entrati · ' + (totali.completati||0) + ' completati';

    } catch(err) {
      tbody.innerHTML = '<tr><td colspan="8" style="color:var(--color-danger);text-align:center;padding:2rem;">Errore: ' + err.message + '</td></tr>';
    }
  }

  /* Ricerca studenti */
  var searchInput = $('studenti-search');
  if (searchInput) {
    searchInput.addEventListener('input', function(){
      var q = searchInput.value.toLowerCase();
      document.querySelectorAll('#studenti-tbody tr').forEach(function(tr){
        tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }

  /* ----------------------------------------------------------
     LOGOUT + SIDEBAR MOBILE
     ---------------------------------------------------------- */
  document.querySelectorAll('.scan-topbar__logout').forEach(function(btn){
    btn.addEventListener('click', function(){ if (confirm('Vuoi uscire?')) API.auth.logout(); });
  });

  var toggle  = $('sidebar-toggle');
  var sidebar = document.querySelector('.scan-sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', function(){ sidebar.classList.toggle('is-open'); });
    document.addEventListener('click', function(e){
      if (!sidebar.contains(e.target) && !toggle.contains(e.target)) sidebar.classList.remove('is-open');
    });
  }
  function updateToggle(){ if (toggle) toggle.style.display = window.innerWidth <= 900 ? 'block' : 'none'; }
  updateToggle();
  window.addEventListener('resize', updateToggle);

  /* ----------------------------------------------------------
     INIT
     ---------------------------------------------------------- */
  // Init immediato (script in fondo al body, DOM già pronto)
  renderFirmeTabs();
    showSection('scanner');

})();
