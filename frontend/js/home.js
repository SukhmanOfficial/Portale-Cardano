/**
 * home.js — Logica pagina home
 * Sistema Cardano Day · ITIS G. Cardano, Pavia
 *
 * In produzione i dati arrivano da GET /api/events/
 * Qui uso dati statici per il frontend standalone.
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     DATI EVENTI (sostituire con fetch('/api/events/') in prod)
     ---------------------------------------------------------- */

  const EVENTS_DATA = [
    {
      id: 1,
      tipo: 'open_day',
      titolo: 'Open Day — Novembre 2026',
      data: { giorno: '18', mese: 'NOV' },
      location: 'ITIS G. Cardano, Pavia',
      posti_max: 120,
      posti_disponibili: 87,
      apertura: '1 nov ore 8:00',
      chiusura: '10 nov ore 23:59',
      stato: 'aperte',        // aperte | non_ancora | chiuse
      percorsi: [
        { nome: 'Misto',           posti: 28, classe: 'tag--misto' },
        { nome: 'Liceo Sc.Appl.',  posti: 35, classe: 'tag--liceo' },
        { nome: 'Tecnico',         posti: 24, classe: 'tag--tecnico' },
      ],
    },
    {
      id: 2,
      tipo: 'cardano_day',
      titolo: 'Cardano Day — Novembre 2026',
      data: { giorno: '24', mese: 'NOV' },
      location: 'ITIS G. Cardano, Pavia',
      posti_max: 300,
      posti_disponibili: 142,
      apertura: '1 nov ore 8:00',
      chiusura: '16 nov ore 23:59',
      stato: 'aperte',
      laboratori: [
        { nome: 'Informatica', classe: 'tag--info' },
        { nome: 'Elettronica', classe: 'tag--elett' },
        { nome: 'Meccanica',   classe: 'tag--mecc' },
        { nome: 'Chimica',     classe: 'tag--chim' },
        { nome: 'Liceo Sc.Appl.', classe: 'tag--liceolab' },
      ],
    },
    {
      id: 3,
      tipo: 'open_day',
      titolo: 'Open Day — Dicembre 2026',
      data: { giorno: '18', mese: 'DIC' },
      location: 'ITIS G. Cardano, Pavia',
      posti_max: 120,
      posti_disponibili: 120,
      apertura: '1 dic ore 8:00',
      chiusura: '10 dic ore 23:59',
      stato: 'non_ancora',
      percorsi: [
        { nome: 'Misto',          posti: null, classe: 'tag--misto' },
        { nome: 'Liceo Sc.Appl.', posti: null, classe: 'tag--liceo' },
        { nome: 'Tecnico',        posti: null, classe: 'tag--tecnico' },
      ],
    },
    {
      id: 4,
      tipo: 'cardano_day',
      titolo: 'Cardano Day — Gennaio 2027',
      data: { giorno: '13', mese: 'GEN' },
      location: 'ITIS G. Cardano, Pavia',
      posti_max: 300,
      posti_disponibili: 300,
      apertura: '15 dic ore 8:00',
      chiusura: '5 gen ore 23:59',
      stato: 'non_ancora',
      laboratori: [
        { nome: 'Informatica', classe: 'tag--info' },
        { nome: 'Elettronica', classe: 'tag--elett' },
        { nome: 'Meccanica',   classe: 'tag--mecc' },
        { nome: 'Chimica',     classe: 'tag--chim' },
      ],
    },
  ];

  /* ----------------------------------------------------------
     HELPER: Badge stato
     ---------------------------------------------------------- */

  function renderBadge(stato) {
    const map = {
      aperte:     { cls: 'badge-open',   label: 'Iscrizioni aperte' },
      non_ancora: { cls: 'badge-soon',   label: 'Iscrizioni non ancora aperte' },
      chiuse:     { cls: 'badge-closed', label: 'Iscrizioni chiuse' },
    };
    const b = map[stato] || map.chiuse;
    return `<span class="badge ${b.cls}">${b.label}</span>`;
  }

  /* ----------------------------------------------------------
     HELPER: Tag percorsi / laboratori
     ---------------------------------------------------------- */

  function renderTags(event) {
    const items = event.percorsi || event.laboratori || [];
    return items.map(function (item) {
      const label = item.posti != null
        ? `${item.nome} · ${item.posti} posti`
        : item.nome;
      return `<span class="tag ${item.classe}">${label}</span>`;
    }).join('');
  }

  /* ----------------------------------------------------------
     HELPER: Progress bar
     ---------------------------------------------------------- */

  function renderProgress(event) {
    const pct = Math.round(
      ((event.posti_max - event.posti_disponibili) / event.posti_max) * 100
    );
    const cls = pct > 80 ? 'progress-bar__fill--warning' : '';
    return `
      <div class="event-card__spots">
        <span>Posti disponibili</span>
        <span class="event-card__spots-count">
          ${event.posti_disponibili} / ${event.posti_max}
        </span>
      </div>
      <div class="progress-bar">
        <div class="progress-bar__fill ${cls}" style="width:${pct}%"></div>
      </div>
    `;
  }

  /* ----------------------------------------------------------
     HELPER: Colore date-box
     ---------------------------------------------------------- */

  function dateBoxClass(event) {
    if (event.stato !== 'aperte') return 'event-card__date-box--gray';
    return event.tipo === 'open_day'
      ? 'event-card__date-box--orange'
      : 'event-card__date-box--dark';
  }

  /* ----------------------------------------------------------
     HELPER: CTA bottone
     ---------------------------------------------------------- */

  function renderCta(event) {
    if (event.stato === 'aperte') {
      return `<button class="event-card__cta event-card__cta--${event.tipo === 'open_day' ? 'primary' : 'dark'}"
                onclick="handleIscriviti(${event.id})">
                ISCRIVITI ORA
              </button>`;
    }
    return `<div class="event-card__cta event-card__cta--disabled">
              Iscrizioni non ancora aperte
            </div>`;
  }

  /* ----------------------------------------------------------
     RENDER singola card evento
     ---------------------------------------------------------- */

  function renderEventCard(event) {
    const typeLabel = event.tipo === 'open_day' ? 'Open Day' : 'Cardano Day';
    const typeClass = event.tipo === 'open_day' ? 'event-card__type--openday' : '';
    const cardClass = event.stato !== 'aperte' ? 'event-card--disabled' : 'event-card--open';

    return `
      <div class="event-card ${cardClass}" data-event-id="${event.id}">

        <div class="event-card__header">
          <span class="event-card__type ${typeClass}">${typeLabel}</span>
          ${renderBadge(event.stato)}
        </div>

        <div class="event-card__date-row">
          <div class="event-card__date-box ${dateBoxClass(event)}">
            <span class="event-card__date-day">${event.data.giorno}</span>
            <span class="event-card__date-month">${event.data.mese}</span>
          </div>
          <div class="event-card__info">
            <div class="event-card__name">${event.titolo}</div>
            <div class="event-card__location">${event.location}</div>
          </div>
        </div>

        ${event.stato === 'aperte' ? renderProgress(event) : ''}

        <div class="event-card__tags">
          ${renderTags(event)}
        </div>

        <div class="event-card__meta">
          <span class="event-card__meta-item">
            <span class="event-card__meta-icon">📅</span>
            Apertura: ${event.apertura}
          </span>
          <span class="event-card__meta-item">
            <span class="event-card__meta-icon">🕐</span>
            Chiusura: ${event.chiusura}
          </span>
        </div>

        ${renderCta(event)}
      </div>
    `;
  }

  /* ----------------------------------------------------------
     RENDER griglia eventi
     ---------------------------------------------------------- */

  function renderEvents() {
    const container = document.getElementById('events-grid');
    if (!container) return;
    container.innerHTML = EVENTS_DATA.map(renderEventCard).join('');
  }

  /* ----------------------------------------------------------
     AZIONE: click Iscriviti
     ---------------------------------------------------------- */

  window.handleIscriviti = function (eventId) {
    // In produzione: controlla se l'utente è loggato
    // Se loggato → redirect a /iscrizione?evento=<id>
    // Se non loggato → redirect a /login
    const isLoggedIn = false; // da sostituire con check JWT
    if (isLoggedIn) {
      window.location.href = '/iscrizione?evento=' + eventId;
    } else {
      window.location.href = '/login?redirect=/iscrizione%3Fevento%3D' + eventId;
    }
  };

  /* ----------------------------------------------------------
     BANNER prossimo evento — aggiornamento dinamico
     ---------------------------------------------------------- */

  function updateBanner() {
    const prossimo = EVENTS_DATA.find(function (e) { return e.stato === 'aperte'; });
    if (!prossimo) return;

    const bannerText = document.getElementById('banner-event-text');
    if (bannerText) {
      bannerText.textContent =
        prossimo.titolo + ' — Iscrizioni aperte fino al ' + prossimo.chiusura;
    }

    const bannerCta = document.getElementById('banner-event-cta');
    if (bannerCta) {
      bannerCta.onclick = function () { handleIscriviti(prossimo.id); };
    }
  }

  /* ----------------------------------------------------------
     INIT
     ---------------------------------------------------------- */

  document.addEventListener('DOMContentLoaded', function () {
    renderEvents();
    updateBanner();
  });

})();
