/**
 * home.js — Home a singola pagina con scroll
 * Sistema Cardano Day · ITIS G. Cardano, Pavia
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     FOOTER ANNO
     ---------------------------------------------------------- */
  // Init immediato (script in fondo al body)
  var footerAnno = document.getElementById('footer-anno');
  if (footerAnno) footerAnno.textContent = new Date().getFullYear();

  /* ----------------------------------------------------------
     CARICA EVENTI DALL'API
     ---------------------------------------------------------- */
  async function caricaEventi() {
    try {
      var data   = await API.events.list(true);
      var eventi = data.data || [];
      renderEventsGrid(eventi);
      renderCalendar(eventi);
      aggiornaBanner(eventi);
      aggiornaStat(eventi.length);
    } catch (err) {
      var grid = document.getElementById('events-grid');
      if (grid) grid.innerHTML = '<div style="grid-column:1/-1;padding:3rem;text-align:center;color:var(--color-text-muted);">Impossibile caricare gli eventi.<br><small>' + err.message + '</small></div>';
    }
  }

  /* ----------------------------------------------------------
     GRIGLIA EVENTI
     ---------------------------------------------------------- */
  function renderEventsGrid(eventi) {
    var grid = document.getElementById('events-grid');
    if (!grid) return;
    if (!eventi.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;padding:3rem;text-align:center;color:var(--color-text-muted);">Nessun evento disponibile al momento.</div>';
      return;
    }
    grid.innerHTML = eventi.map(renderCard).join('');
  }

  /* ----------------------------------------------------------
     CALENDARIO
     ---------------------------------------------------------- */
  function renderCalendar(eventi) {
    var list = document.getElementById('calendar-list');
    if (!list) return;
    if (!eventi.length) {
      list.innerHTML = '<li style="color:var(--color-text-muted);">Nessun evento in programma</li>';
      return;
    }
    list.innerHTML = eventi.map(function (ev) {
      var d      = new Date(ev.data_evento);
      var data   = d.toLocaleDateString('it-IT', { day:'2-digit', month:'short', year:'numeric' }).toUpperCase();
      var aperte = ev.iscrizioni_aperte;
      return '<li class="calendar-item">' +
        '<span class="calendar-item__dot ' + (aperte ? 'calendar-item__dot--active' : 'calendar-item__dot--future') + '"></span>' +
        '<div class="calendar-item__date"><span class="' + (aperte ? 'calendar-item__date--active' : '') + '">' + data + '</span></div>' +
        '<div class="calendar-item__info">' +
          '<div class="calendar-item__name">' + ev.titolo + '</div>' +
          '<div class="calendar-item__sub">Chiusura: ' + formatDateShort(ev.chiusura_iscrizioni) + '</div>' +
        '</div>' +
      '</li>';
    }).join('');
  }

  /* ----------------------------------------------------------
     BANNER
     ---------------------------------------------------------- */
  function aggiornaBanner(eventi) {
    var prossimo = eventi.find(function (e) { return e.iscrizioni_aperte; });
    if (!prossimo) { var b = document.getElementById('banner-event'); if (b) b.style.display = 'none'; return; }
    var txt   = document.getElementById('banner-event-text');
    var cta   = document.getElementById('banner-event-cta');
    var badge = document.querySelector('.banner-event__date-badge');
    var d = new Date(prossimo.data_evento);
    if (badge) badge.textContent = d.toLocaleDateString('it-IT', {day:'2-digit',month:'short',year:'numeric'}).toUpperCase();
    if (txt)   txt.textContent   = prossimo.titolo + ' — Iscrizioni aperte fino al ' + formatDateShort(prossimo.chiusura_iscrizioni);
    if (cta)   cta.onclick       = function () { handleIscriviti(prossimo.id, prossimo.tipo); };
  }

  function aggiornaStat(n) {
    var el = document.getElementById('stat-eventi');
    if (el && n > 0) el.textContent = n;
  }

  /* ----------------------------------------------------------
     RENDER CARD EVENTO
     ---------------------------------------------------------- */
  function renderCard(ev) {
    var d        = new Date(ev.data_evento);
    var giorno   = d.getDate();
    var mese     = d.toLocaleString('it-IT', { month:'short' }).toUpperCase();
    var aperte   = ev.iscrizioni_aperte;
    var iscritti = ev.iscritti || 0;
    var pct      = ev.posti_max > 0 ? Math.round((iscritti / ev.posti_max) * 100) : 0;
    var typeLbl  = ev.tipo === 'open_day' ? 'Open Day' : 'Cardano Day';
    var dateBoxCls = !aperte ? 'event-card__date-box--gray' : ev.tipo === 'open_day' ? 'event-card__date-box--orange' : 'event-card__date-box--dark';
    var badgeHtml = aperte
      ? '<span class="badge badge-open">Iscrizioni aperte</span>'
      : new Date(ev.apertura_iscrizioni) > new Date()
        ? '<span class="badge badge-soon">Non ancora aperte</span>'
        : '<span class="badge badge-closed">Iscrizioni chiuse</span>';
    var progressHtml = aperte
      ? '<div class="event-card__spots"><span>Posti disponibili</span><span class="event-card__spots-count">' + (ev.posti_max - iscritti) + ' / ' + ev.posti_max + '</span></div>' +
        '<div class="progress-bar"><div class="progress-bar__fill' + (pct > 80 ? ' progress-bar__fill--warning' : '') + '" style="width:' + pct + '%"></div></div>'
      : '';
    var ctaHtml = aperte
      ? '<button class="event-card__cta event-card__cta--' + (ev.tipo==='open_day'?'primary':'dark') + '" onclick="handleIscriviti(' + ev.id + ',\'' + ev.tipo + '\')">ISCRIVITI ORA</button>'
      : '<div class="event-card__cta event-card__cta--disabled">Iscrizioni non aperte</div>';

    return '<div class="event-card ' + (aperte ? 'event-card--open' : 'event-card--disabled') + '">' +
      '<div class="event-card__header"><span class="event-card__type' + (ev.tipo==='open_day'?' event-card__type--openday':'') + '">' + typeLbl + '</span>' + badgeHtml + '</div>' +
      '<div class="event-card__date-row">' +
        '<div class="event-card__date-box ' + dateBoxCls + '"><span class="event-card__date-day">' + giorno + '</span><span class="event-card__date-month">' + mese + '</span></div>' +
        '<div class="event-card__info"><div class="event-card__name">' + ev.titolo + '</div><div class="event-card__location">ITIS G. Cardano — Via Verdi 19, Pavia</div></div>' +
      '</div>' +
      progressHtml +
      '<div class="event-card__tags">' + renderTags(ev) + '</div>' +
      '<div class="event-card__meta">' +
        '<span class="event-card__meta-item"><span class="event-card__meta-icon">📅</span>Apertura: ' + formatDateShort(ev.apertura_iscrizioni) + '</span>' +
        '<span class="event-card__meta-item"><span class="event-card__meta-icon">🕐</span>Chiusura: ' + formatDateShort(ev.chiusura_iscrizioni) + '</span>' +
      '</div>' +
      ctaHtml +
    '</div>';
  }

  var TAG_CLS = { MISTO:'tag--misto', LICEO:'tag--liceo', TECNICO:'tag--tecnico', I:'tag--info', E:'tag--elett', M:'tag--mecc', C:'tag--chim', L:'tag--liceolab' };
  function renderTags(ev) {
    var items = ev.percorsi || ev.laboratori || [];
    return items.map(function (p) {
      return '<span class="tag ' + (TAG_CLS[p.codice] || '') + '">' + p.nome + (p.posti_max ? ' · ' + p.posti_max + ' posti' : '') + '</span>';
    }).join('');
  }

  function formatDateShort(str) {
    if (!str) return '—';
    var d = new Date(str);
    return d.toLocaleDateString('it-IT', {day:'2-digit',month:'short'}) + ' ore ' + d.toLocaleTimeString('it-IT', {hour:'2-digit',minute:'2-digit'});
  }

  /* ----------------------------------------------------------
     ISCRIVITI
     ---------------------------------------------------------- */
  window.handleIscriviti = function (eventId, tipo) {
    var pagina = tipo === 'cardano_day' ? 'iscrizione-cardano.html' : 'iscrizione-openday.html';
    window.location.href = pagina + '?evento=' + eventId;
  };

  /* ----------------------------------------------------------
     INIT
     ---------------------------------------------------------- */
  caricaEventi();

})();
