/**
 * gestione-utenti.js — Gestione Utenti Segreteria
 * Sistema Cardano Day · ITIS G. Cardano, Pavia
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     DATI MOCK
     ---------------------------------------------------------- */

  const APPROVAZIONI = [
    { id: 1, nome: 'Marco', cognome: 'Bianchi', initials: 'MB', ruolo: 'staff',
      email: 'm.bianchi@itiscardanopv.edu.it', data: '6 novembre 2026 ore 14:23' },
    { id: 2, nome: 'Sara', cognome: 'Verdi', initials: 'SV', ruolo: 'professore',
      email: 's.verdi@itiscardanopv.edu.it', data: '7 novembre 2026 ore 9:11' },
  ];

  const UTENTI = [
    { id: 1, nome: 'Giulia',  cognome: 'Ferrari', initials: 'GF', avatarCls: 'u-avatar--orange',
      ruolo: 'segreteria', email: 'g.ferrari@itiscardanopv.edu.it', stato: 'attivo',
      iscrizioni: null, registrato: '1 set 2026' },
    { id: 2, nome: 'Luca',   cognome: 'Conti',   initials: 'LC', avatarCls: 'u-avatar--dark',
      ruolo: 'staff', email: 'l.conti@itiscardanopv.edu.it', stato: 'attivo',
      iscrizioni: null, registrato: '3 set 2026' },
    { id: 3, nome: 'Mario',  cognome: 'Rossi',   initials: 'MR', avatarCls: 'u-avatar--blue',
      ruolo: 'genitore', email: 'mario.rossi@email.it', stato: 'attivo',
      iscrizioni: '2 iscrizioni', registrato: '2 nov 2026' },
    { id: 4, nome: 'Anna',   cognome: 'Bianchi', initials: 'AB', avatarCls: 'u-avatar--green',
      ruolo: 'genitore', email: 'a.bianchi@email.it', stato: 'non-verif',
      iscrizioni: '0 iscrizioni', registrato: '7 nov 2026' },
    { id: 5, nome: 'Carlo',  cognome: 'Ferrari', initials: 'CF', avatarCls: 'u-avatar--red',
      ruolo: 'genitore', email: 'c.ferrari@email.it', stato: 'sospeso',
      iscrizioni: '1 annullata', registrato: '5 nov 2026' },
  ];

  /* ----------------------------------------------------------
     UTILITY
     ---------------------------------------------------------- */

  function $(id) { return document.getElementById(id); }

  const RUOLO_LABEL = {
    segreteria: 'Segreteria',
    staff:      'Staff/Prof.',
    genitore:   'Genitore',
    admin:      'Admin',
  };

  const STATO_CLS = {
    'attivo':    'stato-badge--attivo',
    'non-verif': 'stato-badge--non-verif',
    'sospeso':   'stato-badge--sospeso',
  };

  const STATO_LABEL = {
    'attivo':    '● Attivo',
    'non-verif': '● Non verificato',
    'sospeso':   '● Sospeso',
  };

  /* ----------------------------------------------------------
     RENDER APPROVAZIONI
     ---------------------------------------------------------- */

  function renderApprovazioni() {
    const el = $('approv-list');
    const badge = $('approv-badge');
    if (badge) badge.textContent = APPROVAZIONI.length + ' richieste';

    if (!el) return;

    if (APPROVAZIONI.length === 0) {
      el.innerHTML = `<div style="padding:var(--space-6);text-align:center;color:var(--color-text-muted);font-size:var(--text-sm);">
        Nessuna approvazione in attesa ✓
      </div>`;
      return;
    }

    el.innerHTML = APPROVAZIONI.map(function (a) {
      const roleCls   = a.ruolo === 'staff' ? 'approv-role-badge--staff' : 'approv-role-badge--prof';
      const roleLabel = a.ruolo === 'staff' ? 'Staff' : 'Professore';
      return `<div class="approv-item" id="approv-${a.id}">
        <div class="approv-avatar">${a.initials}</div>
        <div class="approv-info">
          <div class="approv-name">
            ${a.nome} ${a.cognome}
            <span class="approv-role-badge ${roleCls}">${roleLabel}</span>
          </div>
          <div class="approv-email">${a.email}</div>
          <div class="approv-date">Richiesta inviata: ${a.data}</div>
        </div>
        <div class="approv-actions">
          <button class="btn-approva" onclick="approva(${a.id})">✓ Approva</button>
          <button class="btn-rifiuta" onclick="rifiuta(${a.id})">✗ Rifiuta</button>
        </div>
      </div>`;
    }).join('');
  }

  /* ----------------------------------------------------------
     RENDER TABELLA UTENTI
     ---------------------------------------------------------- */

  function renderUtenti(filtroTesto, filtroRuolo, filtroStato) {
    const el = $('utenti-tbody');
    if (!el) return;

    let lista = UTENTI.slice();

    if (filtroTesto) {
      const f = filtroTesto.toLowerCase();
      lista = lista.filter(function (u) {
        return (u.nome + ' ' + u.cognome + ' ' + u.email).toLowerCase().includes(f);
      });
    }

    if (filtroRuolo && filtroRuolo !== 'tutti') {
      lista = lista.filter(function (u) { return u.ruolo === filtroRuolo; });
    }

    if (filtroStato && filtroStato !== 'tutti') {
      lista = lista.filter(function (u) { return u.stato === filtroStato; });
    }

    const count = $('utenti-count');
    if (count) count.textContent = UTENTI.length + ' utenti totali';

    el.innerHTML = lista.map(function (u) {
      const azioni = u.ruolo === 'segreteria' || u.ruolo === 'staff'
        ? `<button class="btn-modifica-ruolo" onclick="modificaRuolo(${u.id})">Modifica ruolo</button>
           <button class="btn-elimina" onclick="eliminaUtente(${u.id})">Elimina</button>`
        : `<button class="btn-dettaglio" onclick="dettaglio(${u.id})">Dettaglio</button>
           <button class="btn-elimina" onclick="eliminaUtente(${u.id})">Elimina</button>`;

      return `<tr>
        <td>
          <div class="u-cell">
            <div class="u-avatar ${u.avatarCls}">${u.initials}</div>
            <div>
              <div class="u-cell__name">${u.nome} ${u.cognome}</div>
              <div class="u-cell__sub">${RUOLO_LABEL[u.ruolo] || u.ruolo}</div>
            </div>
          </div>
        </td>
        <td style="color:var(--color-text-secondary);">${u.email}</td>
        <td><span class="ruolo-badge ruolo-badge--${u.ruolo}">${RUOLO_LABEL[u.ruolo]}</span></td>
        <td><span class="stato-badge ${STATO_CLS[u.stato]}">${STATO_LABEL[u.stato]}</span></td>
        <td style="color:var(--color-text-muted);">${u.iscrizioni || '—'}</td>
        <td style="color:var(--color-text-muted);">${u.registrato}</td>
        <td>
          <div style="display:flex;gap:var(--space-2);flex-wrap:wrap;">
            ${azioni}
          </div>
        </td>
      </tr>`;
    }).join('');

    const footer = $('utenti-footer');
    if (footer) footer.textContent = `Mostrando ${lista.length} di ${UTENTI.length} utenti`;
  }

  /* ----------------------------------------------------------
     AZIONI PUBBLICHE
     ---------------------------------------------------------- */

  window.approva = function (id) {
    if (!confirm('Approvare questo utente?')) return;
    const el = $('approv-' + id);
    if (el) { el.style.opacity = '0.4'; el.style.pointerEvents = 'none'; }
    setTimeout(function () { if (el) el.remove(); }, 400);
    // In produzione: PUT /api/users/?action=approva&id=N
  };

  window.rifiuta = function (id) {
    if (!confirm('Rifiutare questa richiesta?')) return;
    const el = $('approv-' + id);
    if (el) el.remove();
  };

  window.modificaRuolo = function (id) {
    const u = UTENTI.find(function (u) { return u.id === id; });
    if (!u) return;
    const nuovoRuolo = prompt('Nuovo ruolo per ' + u.nome + ' ' + u.cognome + ':\n(segreteria / staff / genitore)', u.ruolo);
    if (nuovoRuolo && nuovoRuolo !== u.ruolo) {
      alert('Ruolo aggiornato a: ' + nuovoRuolo + '\n(in produzione: PUT /api/users/?action=ruolo&id=' + id + ')');
    }
  };

  window.dettaglio = function (id) {
    const u = UTENTI.find(function (u) { return u.id === id; });
    if (!u) return;
    alert(`Dettaglio utente:\nNome: ${u.nome} ${u.cognome}\nEmail: ${u.email}\nRuolo: ${RUOLO_LABEL[u.ruolo]}\nStato: ${STATO_LABEL[u.stato]}\nRegistrato: ${u.registrato}`);
  };

  window.eliminaUtente = function (id) {
    const u = UTENTI.find(function (u) { return u.id === id; });
    if (!u) return;
    if (!confirm('Eliminare ' + u.nome + ' ' + u.cognome + '?\nQuesta operazione non può essere annullata.')) return;
    alert('Utente eliminato.\n(in produzione: DELETE /api/users/?id=' + id + ')');
  };

  /* ----------------------------------------------------------
     INVIA NOTIFICA
     ---------------------------------------------------------- */

  window.inviaNotifica = function () {
    const dest    = $('notifica-dest')?.value || '';
    const oggetto = $('notifica-oggetto')?.value.trim() || '';
    const msg     = $('notifica-msg')?.value.trim() || '';

    if (!oggetto || !msg) { alert('Compila oggetto e messaggio prima di inviare.'); return; }

    if (confirm(`Inviare email a: ${dest}\nOggetto: ${oggetto}\n\nConfermi?`)) {
      alert('Email inviata!\n(in produzione: POST /api/users/ con action=notifica)');
    }
  };

  window.salvaBozza = function () {
    alert('Bozza salvata.');
  };

  /* ----------------------------------------------------------
     NAVIGAZIONE TAB
     ---------------------------------------------------------- */

  function showTab(name) {
    document.querySelectorAll('[data-tab]').forEach(function (el) {
      el.style.display = el.dataset.tab === name ? 'block' : 'none';
    });
    document.querySelectorAll('.page-tab').forEach(function (el) {
      el.classList.toggle('page-tab--active', el.dataset.tabTarget === name);
    });
  }

  /* ----------------------------------------------------------
     INIT
     ---------------------------------------------------------- */

  document.addEventListener('DOMContentLoaded', function () {
    renderApprovazioni();
    renderUtenti();

    // Filtri
    const search = $('search-utenti');
    const selRuolo = $('filter-ruolo');
    const selStato = $('filter-stato');

    function aggiorna() {
      renderUtenti(
        search?.value || '',
        selRuolo?.value || 'tutti',
        selStato?.value || 'tutti'
      );
    }

    if (search)   search.addEventListener('input', aggiorna);
    if (selRuolo) selRuolo.addEventListener('change', aggiorna);
    if (selStato) selStato.addEventListener('change', aggiorna);

    // Tab
    document.querySelectorAll('.page-tab[data-tab-target]').forEach(function (el) {
      el.addEventListener('click', function () { showTab(el.dataset.tabTarget); });
    });

    showTab('tutti');

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
