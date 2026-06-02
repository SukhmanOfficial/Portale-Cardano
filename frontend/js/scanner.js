/**
 * scanner.js — Scanner QR Staff / Professore
 * Sistema Cardano Day · ITIS G. Cardano, Pavia
 *
 * Gestisce:
 *  - Simulazione scansione QR (in produzione: libreria jsQR o BarcodeDetector API)
 *  - Stato delle 4 firme
 *  - Render risultato: OK / Lab errato / Firma precedente mancante
 *  - Input manuale codice
 *  - Elenco studenti con firme e filtri
 *  - Navigazione sezioni (Scanner / Studenti / Riepilogo)
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     DATI MOCK
     ---------------------------------------------------------- */

  const EVENTO = {
    id: 2,
    tipo: 'cardano_day',
    titolo: 'Cardano Day',
    data: '24 Novembre 2026',
    firma_corrente: 2,   // 1=Entrata 2=Lab T1 3=Lab T2 4=Uscita
  };

  const UTENTE = { nome: 'Luca', cognome: 'Conti', initials: 'LC', ruolo: 'Staff' };

  const FASI = [
    { num: 1, nome: 'Firma 1 — Entrata',   orario: '8:00–8:30',   stato: 'done' },
    { num: 2, nome: 'Firma 2 — Lab Turno 1', orario: '8:30–10:30', stato: 'active' },
    { num: 3, nome: 'Firma 3 — Lab Turno 2', orario: '11:00–13:00', stato: 'todo' },
    { num: 4, nome: 'Firma 4 — Uscita',    orario: 'Fine giornata', stato: 'todo' },
  ];

  const LABORATORI = [
    { codice: 'I1', nome: 'Informatica — Aula 1' },
    { codice: 'I2', nome: 'Informatica — Aula 2' },
    { codice: 'E1', nome: 'Elettronica — Aula 1' },
    { codice: 'E2', nome: 'Elettronica — Aula 2' },
    { codice: 'M1', nome: 'Meccanica — Aula 1' },
    { codice: 'M2', nome: 'Meccanica — Aula 2' },
    { codice: 'C1', nome: 'Chimica — Aula 1' },
    { codice: 'C2', nome: 'Chimica — Aula 2' },
    { codice: 'L1', nome: 'Liceo Sc. Appl. — Aula 1' },
  ];

  const STUDENTI = [
    { nome: 'Abbiati', cognome: 'Laura',   initials: 'LA', scuola: 'Manzoni', citta: 'Pavia',    labT1: 'E1', labT2: 'C2', f1: true,  f2: true,  f3: false, f4: false },
    { nome: 'Barocelli', cognome: 'Luca',  initials: 'BL', scuola: 'Pascoli', citta: 'Voghera',  labT1: 'E1', labT2: 'C2', f1: true,  f2: true,  f3: false, f4: false },
    { nome: 'Bigi', cognome: 'C.J. Corrado', initials: 'BC', scuola: 'Volta', citta: 'Pavia',   labT1: 'E1', labT2: 'M2', f1: false, f2: true,  f3: false, f4: false, anomalia: true },
    { nome: 'Bosincianu', cognome: 'Matei', initials: 'BM', scuola: 'Mazzini', citta: 'Vigevano', labT1: 'E1', labT2: 'I2', f1: true,  f2: false, f3: false, f4: false },
    { nome: 'Colombo', cognome: 'Sara',    initials: 'CS', scuola: 'De Amicis', citta: 'Pavia',  labT1: 'E1', labT2: null, f1: true,  f2: true,  f3: false, f4: false },
  ];

  // Simulazione risultati scansione (3 scenari demo)
  const DEMO_SCANSIONI = [
    {
      tipo: 'ok',
      studente: { nome: 'Laura', cognome: 'Abbiati', initials: 'LA', scuola: 'SC. Media Manzoni', citta: 'Pavia', qr: 'e1b2c3d4f5a6...32f' },
      labT1: 'E1', labT2: 'C2', orarioT1: '8:30–10:30', orarioT2: '11:00–13:00',
      labNomeT1: 'Elettronica · Aula 1', labNomeT2: 'C2 · Chimica Aula 2',
      firme: [true, true, false, false],
      ora: '8:34',
    },
    {
      tipo: 'lab_errato',
      studente: { nome: 'Andrea', cognome: 'Ricci', initials: 'AR', scuola: 'SC. Media Pascoli', citta: 'Vigevano', qr: 'f9e8d7c6...41a' },
      labAssegnato: 'M1', labNomeAssegnato: 'Meccanica — Aula M1',
      orarioT1: '8:30–10:30',
      labCorrente: 'E1',
      firme: [true, false, false, false],
    },
    {
      tipo: 'firma_mancante',
      studente: { nome: 'Federico', cognome: 'Bianchi', initials: 'FB', scuola: 'SC. Media Volta', citta: 'Pavia', qr: 'a2b3c4d5...99e' },
      labT1: 'E1', orarioT1: '8:30–10:30',
      firme: [false, false, false, false],
    },
  ];

  let demoIdx = 0;
  let scannerAttivo = true;

  /* ----------------------------------------------------------
     UTILITY
     ---------------------------------------------------------- */

  function $(id) { return document.getElementById(id); }

  function firmeRow(firme, firmaCorrente) {
    const labels = ['Entrata', 'Lab T1', 'Lab T2', 'Uscita'];
    let dots = '', connectors = '', lbls = '';
    firme.forEach(function (done, i) {
      const n = i + 1;
      let cls = 'firma-circle--pending';
      let content = '';
      if (done)                { cls = 'firma-circle--done';   content = '✓'; }
      else if (n === firmaCorrente && !done) { cls = 'firma-circle--active'; content = String(n); }
      dots += `<div class="firma-circle ${cls}">${content}</div>`;
      if (i < firme.length - 1) {
        connectors += `<div class="firma-connector ${done ? 'firma-connector--done' : ''}"></div>`;
      }
      lbls += `<span class="firma-lbl">${labels[i]}</span>`;
    });
    return `<div class="result-firme-row">${dots.split('</div>').join('</div>').replace(/<\/div><\/div>/g, '') + connectors}</div>
            <div class="firma-labels">${lbls}</div>`;
  }

  /* ----------------------------------------------------------
     RENDER FASI SIDEBAR
     ---------------------------------------------------------- */

  function renderFasi() {
    const el = $('fasi-list');
    if (!el) return;
    el.innerHTML = FASI.map(function (f) {
      return `<div class="scan-fase scan-fase--${f.stato}" onclick="setFaseCorrente(${f.num})">
        <div class="scan-fase__num">${f.stato === 'done' ? '✓' : f.num}</div>
        <div class="scan-fase__info">
          <div class="scan-fase__name">${f.nome}</div>
          <div class="scan-fase__orario">${f.stato === 'done' ? 'Completata · ' : ''}${f.orario}</div>
        </div>
      </div>`;
    }).join('');
  }

  /* ----------------------------------------------------------
     RENDER LABORATORI SELECT
     ---------------------------------------------------------- */

  function renderLabSelect() {
    const el = $('lab-select');
    if (!el) return;
    el.innerHTML = LABORATORI.map(function (l) {
      const sel = l.codice === 'E1' ? 'selected' : '';
      return `<option value="${l.codice}" ${sel}>${l.codice} — ${l.nome}</option>`;
    }).join('');
  }

  /* ----------------------------------------------------------
     RENDER RISULTATO SCANSIONE
     ---------------------------------------------------------- */

  function renderRisultato(scan) {
    const el = $('result-box');
    if (!el) return;

    if (!scan) {
      el.className = 'result-box result-box--waiting';
      el.innerHTML = `
        <div style="font-size:3rem;opacity:0.2;">📱</div>
        <div style="font-size:var(--text-sm);text-align:center;line-height:1.6;">
          In attesa di scansione...<br>
          <span style="font-size:var(--text-xs);">Inquadra il QR code dello studente</span>
        </div>`;
      return;
    }

    el.className = 'result-box';

    if (scan.tipo === 'ok') {
      el.innerHTML = `
        <div class="result-header result-header--ok">
          <div class="result-header__icon">✓</div>
          <div>
            <div class="result-header__title">QR valido — Firma registrata</div>
            <div class="result-header__sub">Firma ${EVENTO.firma_corrente} · Lab Turno 1 · ore ${scan.ora}</div>
          </div>
        </div>
        <div class="result-body">
          <div class="result-student">
            <div class="result-student__avatar">${scan.studente.initials}</div>
            <div>
              <div class="result-student__name">${scan.studente.nome} ${scan.studente.cognome}</div>
              <div class="result-student__school">${scan.studente.scuola} — ${scan.studente.citta}</div>
              <div class="result-student__qr">QA: ${scan.studente.qr}</div>
            </div>
          </div>
          <div class="result-info-grid">
            <div>
              <div class="result-info-label">Laboratorio assegnato</div>
              <div class="result-lab-badge">${scan.labT1}</div>
              <div class="result-info-value" style="margin-top:4px;font-size:var(--text-xs);">${scan.labNomeT1}</div>
            </div>
            <div>
              <div class="result-info-label">Lab Turno 2</div>
              <div class="result-info-value">${scan.labNomeT2}</div>
              <div class="result-info-value" style="color:var(--color-text-muted);font-size:var(--text-xs);">Ore ${scan.orarioT2}</div>
            </div>
          </div>
          <div class="result-firme" style="margin-bottom:var(--space-3);">
            <div class="result-info-label">Stato firme</div>
            ${firmeRow(scan.firme, EVENTO.firma_corrente)}
          </div>
          <div class="result-alert result-alert--ok">✓ Firma ${EVENTO.firma_corrente} registrata alle ${scan.ora} — Studente nel laboratorio corretto</div>
          <div class="result-actions">
            <button class="btn-prossimo" onclick="prossimoStudente()">▶ Prossimo studente</button>
            <button class="btn-segnala" onclick="segnalaProblema()">⚠ Segnala problema</button>
          </div>
        </div>`;

    } else if (scan.tipo === 'lab_errato') {
      el.innerHTML = `
        <div class="result-header result-header--error">
          <div class="result-header__icon">✗</div>
          <div>
            <div class="result-header__title">Laboratorio errato!</div>
            <div class="result-header__sub">Lo studente deve andare altrove</div>
          </div>
        </div>
        <div class="result-body">
          <div class="result-student">
            <div class="result-student__avatar" style="background:var(--color-primary);">${scan.studente.initials}</div>
            <div>
              <div class="result-student__name">${scan.studente.nome} ${scan.studente.cognome}</div>
              <div class="result-student__school">${scan.studente.scuola} — ${scan.studente.citta}</div>
            </div>
          </div>
          <div class="result-alert result-alert--error">
            ⚠ Questo studente è assegnato a un laboratorio diverso:
          </div>
          <div class="result-lab-error">
            <strong>Deve andare in: ${scan.labNomeAssegnato}</strong><br>
            Turno 1 : ${scan.orarioT1}<br>
            Non in: ${scan.labCorrente} (questo laboratorio)
          </div>
          <div class="result-actions">
            <button class="btn-informa" onclick="prossimoStudente()">Informa lo studente</button>
            <button class="btn-segnala" onclick="segnalaProblema()">⚠ Segnala problema</button>
          </div>
        </div>`;

    } else if (scan.tipo === 'firma_mancante') {
      el.innerHTML = `
        <div class="result-header result-header--warning">
          <div class="result-header__icon">⚠</div>
          <div>
            <div class="result-header__title">Attenzione — Firma precedente mancante</div>
            <div class="result-header__sub">Firma 1 (entrata) non registrata</div>
          </div>
        </div>
        <div class="result-body">
          <div class="result-student">
            <div class="result-student__avatar" style="background:var(--color-warning);">${scan.studente.initials}</div>
            <div>
              <div class="result-student__name">${scan.studente.nome} ${scan.studente.cognome}</div>
              <div class="result-student__school">${scan.studente.scuola} — ${scan.studente.citta}</div>
            </div>
          </div>
          <div class="result-alert result-alert--warning">
            La firma 1 (entrata) non risulta registrata per questo studente.
            Potrebbe aver saltato il controllo all'ingresso.
          </div>
          <div class="result-firme" style="margin-bottom:var(--space-4);">
            ${firmeRow(scan.firme, EVENTO.firma_corrente)}
          </div>
          <div class="result-actions">
            <button class="btn-registra-comunque" onclick="prossimoStudente()">Registra comunque Firma 2</button>
            <button class="btn-segnala" onclick="segnalaProblema()">Segnala anomalia alla segreteria</button>
          </div>
        </div>`;
    }
  }

  /* ----------------------------------------------------------
     RENDER ELENCO STUDENTI
     ---------------------------------------------------------- */

  function renderStudenti(filtro) {
    const el = $('studenti-tbody');
    if (!el) return;

    const lista = filtro
      ? STUDENTI.filter(function (s) {
          return (s.nome + ' ' + s.cognome).toLowerCase().includes(filtro.toLowerCase()) ||
                 s.scuola.toLowerCase().includes(filtro.toLowerCase());
        })
      : STUDENTI;

    el.innerHTML = lista.map(function (s) {
      const anomalyCls = s.anomalia ? 'row-anomaly' : '';
      function fIcon(done) {
        return done ? '<span class="firma-icon">✅</span>' : '<span class="firma-icon" style="opacity:0.2;">—</span>';
      }
      const labT2 = s.labT2
        ? `<span class="lab-chip">${s.labT2}</span>`
        : '<span style="color:var(--color-text-muted);font-size:var(--text-xs);">—</span>';

      return `<tr class="${anomalyCls}">
        <td style="font-weight:600;">${s.cognome} ${s.nome}</td>
        <td style="color:var(--color-text-muted);">${s.scuola} · ${s.citta}</td>
        <td><span class="lab-chip">${s.labT1}</span></td>
        <td>${labT2}</td>
        <td>${fIcon(s.f1)}</td>
        <td>${fIcon(s.f2)}${s.anomalia ? ' <span style="color:var(--color-warning);font-size:11px;">⚠</span>' : ''}</td>
        <td>${fIcon(s.f3)}</td>
        <td>${fIcon(s.f4)}</td>
      </tr>`;
    }).join('');

    const footer = $('studenti-footer');
    if (footer) {
      const anomalie = STUDENTI.filter(function (s) { return s.anomalia; }).length;
      const anomalyHtml = anomalie > 0
        ? `<span class="anomaly-note">⚠ ${anomalie} anomalia rilevata (riga gialla)</span>`
        : '';
      footer.innerHTML = `<span>Mostrando ${lista.length} di ${STUDENTI.length} studenti · Elettronica E1</span>
                          ${anomalyHtml}
                          <span style="color:var(--color-text-muted);">Sola lettura — modifiche riservate alla Segreteria</span>`;
    }
  }

  /* ----------------------------------------------------------
     NAVIGAZIONE SEZIONI
     ---------------------------------------------------------- */

  function showSection(name) {
    document.querySelectorAll('[data-section]').forEach(function (el) {
      el.style.display = el.dataset.section === name ? 'block' : 'none';
    });
    document.querySelectorAll('[data-nav]').forEach(function (el) {
      el.classList.toggle('scan-nav-link--active', el.dataset.nav === name);
      el.classList.toggle('mobile-nav-item--active', el.dataset.nav === name);
    });
    if (name === 'studenti') renderStudenti();
  }

  window.showSection = showSection;

  /* ----------------------------------------------------------
     AZIONI PUBBLICHE
     ---------------------------------------------------------- */

  window.prossimoStudente = function () {
    renderRisultato(null);
    const input = $('manual-input');
    if (input) input.value = '';
    // Focus scanner
  };

  window.segnalaProblema = function () {
    alert('Anomalia segnalata alla segreteria. (POST /api/qr/?action=anomalia)');
  };

  window.setFaseCorrente = function (num) {
    EVENTO.firma_corrente = num;
    const title = $('scanner-title');
    const labels = ['', 'Firma 1 · Entrata', 'Firma 2 · Lab T1', 'Firma 3 · Lab T2', 'Firma 4 · Uscita'];
    if (title) title.innerHTML = `Scanner QR — <em>${labels[num]}</em>`;
    renderFasi();
  };

  /* ----------------------------------------------------------
     DEMO SCANSIONE — simula risultati ciclicamente
     ---------------------------------------------------------- */

  function eseguiScansione(codice) {
    // In produzione: POST /api/qr/?action=scan con { qr_codice, firma, lab }
    const scan = codice
      ? DEMO_SCANSIONI.find(function (s) { return s.tipo === 'ok'; }) || DEMO_SCANSIONI[0]
      : DEMO_SCANSIONI[demoIdx % DEMO_SCANSIONI.length];

    demoIdx++;
    renderRisultato(scan);

    // Aggiorna tab studenti se aperto
    renderStudenti();
  }

  /* ----------------------------------------------------------
     INIT
     ---------------------------------------------------------- */

  document.addEventListener('DOMContentLoaded', function () {

    // Topbar
    const nameEl = $('topbar-user-name');
    if (nameEl) nameEl.textContent = UTENTE.nome + ' ' + UTENTE.cognome;
    const initEl = $('topbar-avatar');
    if (initEl) initEl.textContent = UTENTE.initials;

    renderFasi();
    renderLabSelect();
    renderRisultato(null);
    renderStudenti();

    // Bottone demo scansione
    const btnDemo = $('btn-demo-scan');
    if (btnDemo) btnDemo.addEventListener('click', function () { eseguiScansione(null); });

    // Input manuale
    const btnVerifica = $('btn-verifica');
    const manualInput = $('manual-input');
    if (btnVerifica && manualInput) {
      btnVerifica.addEventListener('click', function () {
        const val = manualInput.value.trim();
        if (!val) return;
        eseguiScansione(val);
      });
      manualInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') eseguiScansione(manualInput.value.trim());
      });
    }

    // Ricerca studenti
    const search = $('studenti-search');
    if (search) search.addEventListener('input', function () { renderStudenti(search.value); });

    // Nav sidebar + mobile
    document.querySelectorAll('[data-nav]').forEach(function (el) {
      el.addEventListener('click', function () { showSection(el.dataset.nav); });
    });

    // Sidebar mobile toggle
    const sidebarToggle = $('sidebar-toggle');
    const sidebar = document.querySelector('.scan-sidebar');
    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener('click', function () { sidebar.classList.toggle('is-open'); });
      document.addEventListener('click', function (e) {
        if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
          sidebar.classList.remove('is-open');
        }
      });
    }

    // Sidebar toggle visibilità
    function updateToggle() {
      if (sidebarToggle) sidebarToggle.style.display = window.innerWidth <= 900 ? 'block' : 'none';
    }
    updateToggle();
    window.addEventListener('resize', updateToggle);

    showSection('scanner');
  });

})();
