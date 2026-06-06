/**
 * segreteria.js — Dashboard Segreteria
 * Sistema Cardano Day · ITIS "G. Cardano", Pavia
 * Collegato a API reali
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     AUTH CHECK
     ---------------------------------------------------------- */
  var utente = API.auth.requireLogin(['segreteria', 'admin']);
  if (!utente) return;

  /* ----------------------------------------------------------
     UTILITY
     ---------------------------------------------------------- */
  function $(id) { return document.getElementById(id); }
  function fmtData(s) {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('it-IT', { day:'2-digit', month:'short', year:'numeric' });
  }
  function fmtNum(n) { return n != null ? n : '—'; }

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
    document.querySelectorAll('[data-section]').forEach(function (el) {
      el.style.display = el.dataset.section === name ? 'block' : 'none';
    });
    document.querySelectorAll('.seg-nav-link[data-nav]').forEach(function (el) {
      el.classList.toggle('seg-nav-link--active', el.dataset.nav === name);
    });
    // Render sezione al click
    var renders = {
      dashboard:    renderDashboard,
      eventi:       renderEventiSez,
      iscrizioni:   function(){ caricaOpzioniEventi(); renderIscrizioniSez(); },
      utenti:       renderUtentiSez,
      approvazioni: renderApprovazioniSez,
      divisione:    caricaEventiDividi,
      notifiche:    function(){},
      scuole:       renderScuoleSez,
      impostazioni: aggiornaDisplayAnno,
    };
    if (renders[name]) renders[name]();
  }
  window.showSection = showSection;

  document.querySelectorAll('.seg-nav-link[data-nav]').forEach(function (el) {
    el.addEventListener('click', function () { showSection(el.dataset.nav); });
  });

  /* ----------------------------------------------------------
     SIDEBAR MOBILE
     ---------------------------------------------------------- */
  var toggle  = $('sidebar-toggle');
  var sidebar = document.querySelector('.seg-sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', function () { sidebar.classList.toggle('is-open'); });
    document.addEventListener('click', function (e) {
      if (!sidebar.contains(e.target) && !toggle.contains(e.target)) sidebar.classList.remove('is-open');
    });
  }
  function updateToggle() { if (toggle) toggle.style.display = window.innerWidth <= 900 ? 'block' : 'none'; }
  updateToggle();
  window.addEventListener('resize', updateToggle);

  /* ----------------------------------------------------------
     LOGOUT
     ---------------------------------------------------------- */
  document.querySelectorAll('.seg-topbar__logout').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (confirm('Vuoi uscire?')) API.auth.logout();
    });
  });

  /* ----------------------------------------------------------
     DASHBOARD — KPI
     ---------------------------------------------------------- */
  async function renderDashboard() {
    try {
      var [eventiData, iscrizioniData] = await Promise.all([
        API.events.list(false),
        API.registrations.list({ stato: 'confermata' }),
      ]);
      var eventi     = eventiData.data || [];
      var iscrizioni = iscrizioniData.data || [];

      // KPI
      var kpiMap = {
        'kpi-iscrizioni': iscrizioni.length,
        'kpi-eventi':     eventi.length,
        'kpi-approvazioni': 0,
      };
      Object.keys(kpiMap).forEach(function(id) {
        var el = $(id);
        if (el) el.textContent = kpiMap[id];
      });

      // Approvazioni
      var appData = await API.users.approvazioni();
      var appr = appData.data || [];
      var badgeEl = $('approv-count');
      if (badgeEl) badgeEl.textContent = appr.length + ' richieste';
      var apprKpi = $('kpi-approvazioni');
      if (apprKpi) apprKpi.textContent = appr.length;
      renderApprovazioniList(appr, 'approv-list');

      // Tabella eventi dashboard
      renderEventiTabella(eventi, 'eventi-tbody');

    } catch (err) {
      console.error('[Dashboard]', err.message);
    }
  }

  /* ----------------------------------------------------------
     APPROVAZIONI — render lista
     ---------------------------------------------------------- */
  function renderApprovazioniList(lista, containerId) {
    var el = $(containerId);
    if (!el) return;
    if (!lista.length) {
      el.innerHTML = '<div style="padding:var(--space-6);text-align:center;color:var(--color-text-muted);font-size:var(--text-sm);">✓ Nessuna approvazione in attesa</div>';
      return;
    }
    el.innerHTML = lista.map(function (a) {
      var roleLbl = a.ruolo === 'staff' ? 'Staff' : 'Professore';
      var roleCls = a.ruolo === 'staff' ? 'approv-role-badge--staff' : 'approv-role-badge--prof';
      return '<div class="approv-item" id="approv-item-' + a.id + '">' +
        '<div class="approv-avatar">' + a.nome[0] + a.cognome[0] + '</div>' +
        '<div class="approv-info">' +
          '<div class="approv-name">' + a.nome + ' ' + a.cognome +
            '<span class="approv-role-badge ' + roleCls + '">' + roleLbl + '</span></div>' +
          '<div class="approv-email">' + a.email + '</div>' +
          '<div class="approv-date">Richiesta: ' + fmtData(a.creato_il) + '</div>' +
        '</div>' +
        '<div class="approv-actions">' +
          '<button class="btn-approva" onclick="approvaUtente(' + a.id + ')">✓ Approva</button>' +
          '<button class="btn-rifiuta" onclick="rifiutaUtente(' + a.id + ')">✗ Rifiuta</button>' +
        '</div></div>';
    }).join('');
  }

  window.approvaUtente = async function (id) {
    if (!confirm('Approvare questo utente?')) return;
    try {
      await API.users.approva(id);
      document.querySelectorAll('#approv-item-' + id).forEach(function(el){ el.remove(); });
      renderDashboard();
    } catch (err) { alert('Errore: ' + err.message); }
  };

  window.rifiutaUtente = async function (id) {
    var motivo = prompt('Motivo del rifiuto (opzionale):') || '';
    try {
      await API.users.rifiuta(id, motivo);
      document.querySelectorAll('#approv-item-' + id).forEach(function(el){ el.remove(); });
      renderDashboard();
    } catch (err) { alert('Errore: ' + err.message); }
  };

  /* ----------------------------------------------------------
     EVENTI — tabella
     ---------------------------------------------------------- */
  function renderEventiTabella(eventi, tbodyId) {
    var tbody = $(tbodyId);
    if (!tbody) return;
    if (!eventi.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--color-text-muted);padding:2rem;">Nessun evento</td></tr>';
      return;
    }
    tbody.innerHTML = eventi.map(function (ev) {
      var typeBadge = ev.tipo === 'open_day'
        ? '<span class="event-type-badge event-type-badge--openday">Open Day</span>'
        : '<span class="event-type-badge event-type-badge--cardano">Cardano Day</span>';
      var iscritti = ev.iscritti || 0;
      var pct = ev.posti_max > 0 ? Math.round((iscritti / ev.posti_max) * 100) : 0;
      var progress = '<div class="seg-progress"><div class="seg-progress__bar"><div class="seg-progress__fill" style="width:' + pct + '%"></div></div><span class="seg-progress__text">' + iscritti + '/' + ev.posti_max + '</span></div>';
      var aperte = ev.iscrizioni_aperte;
      var statoCls = aperte ? 'stato-dot--attivo' : 'stato-dot--non-attivo';
      var statoLbl = aperte ? 'Aperte' : 'Chiuse';
      var pubHtml = ev.pubblicato
        ? '<span class="pub-badge pub-badge--yes">✓ Sì</span>'
        : '<span class="pub-badge pub-badge--no">Bozza</span>';
      return '<tr>' +
        '<td>' + typeBadge + '</td>' +
        '<td style="font-weight:600;">' + fmtData(ev.data_evento) + '</td>' +
        '<td>' + progress + '</td>' +
        '<td><span class="stato-dot ' + statoCls + '">' + statoLbl + '</span></td>' +
        '<td>' + (ev.gruppi_confermati ? '<span style="color:var(--color-success);font-size:var(--text-xs);font-weight:600;">✓ Confermati</span>' : ev.gruppi_eseguiti ? '<span style="color:var(--color-warning);font-size:var(--text-xs);">Eseguiti</span>' : '<span style="color:var(--color-text-muted);font-size:var(--text-xs);">Non ancora</span>') + '</td>' +
        '<td>' + pubHtml + '</td>' +
        '<td><div class="seg-row-actions">' +
          '<button class="seg-btn seg-btn--icon" onclick="window.location.href=\'crea-evento.html?id=' + ev.id + '\'" title="Modifica">✏️</button>' +
          '<button class="seg-btn seg-btn--outline" onclick="eseguiDivisioneEvento(' + ev.id + ')">Dividi</button>' +
          '<button class="seg-btn seg-btn--outline" onclick="exportExcelIscrizioni({id_evento:' + ev.id + '})" title="Scarica iscrizioni evento">📊</button>' +
          '<button class="seg-btn seg-btn--icon" onclick="togglePubblicato(' + ev.id + ')" title="Pubblica/Nascondi">👁</button>' +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  window.togglePubblicato = async function (id) {
    try {
      await API.events.togglePub(id);
      renderEventiSez();
    } catch (err) { alert('Errore: ' + err.message); }
  };

  /* ----------------------------------------------------------
     SEZIONE EVENTI (inline)
     ---------------------------------------------------------- */
  async function renderEventiSez() {
    try {
      var data   = await API.events.list(false);
      var eventi = data.data || [];
      renderEventiTabella(eventi, 'eventi-tbody-sez');
    } catch (err) {
      var tb = $('eventi-tbody-sez');
      if (tb) tb.innerHTML = '<tr><td colspan="7" style="color:var(--color-danger);text-align:center;padding:2rem;">Errore: ' + err.message + '</td></tr>';
    }
  }

  /* ----------------------------------------------------------
     SEZIONE ISCRIZIONI (inline)
     ---------------------------------------------------------- */
  /* Popola dropdown eventi nel filtro iscrizioni */
  async function caricaOpzioniEventi() {
    var sel = document.getElementById('iscr-filter-evento');
    if (!sel) return;
    try {
      var data   = await API.events.list(false);
      var eventi = data.data || [];
      // Mantieni l'opzione "tutti" e aggiungi gli eventi reali
      sel.innerHTML = '<option value="tutti">📋 Tutti gli eventi (' + eventi.reduce(function(s,e){ return s + (e.iscritti||0); }, 0) + ' iscritti)</option>' +
        eventi.map(function(ev) {
          var tipo = ev.tipo === 'open_day' ? 'Open Day' : 'Cardano Day';
          var data = new Date(ev.data_evento).toLocaleDateString('it-IT', {day:'2-digit',month:'short',year:'numeric'});
          return '<option value="' + ev.id + '">' + tipo + ' — ' + data + ' (' + (ev.iscritti||0) + '/' + ev.posti_max + ')</option>';
        }).join('');
    } catch(err) { console.error('[caricaOpzioniEventi]', err.message); }
  }

  async function renderIscrizioniSez(filtroTesto, filtroEvento, filtroStato) {
    var tbody  = $('iscrizioni-tbody');
    var footer = $('iscrizioni-footer');
    var count  = $('iscr-count');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--color-text-muted);">Caricamento...</td></tr>';
    try {
      var filtri = {};
      if (filtroTesto)  filtri.search    = filtroTesto;
      if (filtroEvento && filtroEvento !== 'tutti') filtri.id_evento = filtroEvento;
      if (filtroStato  && filtroStato  !== 'tutti') filtri.stato     = filtroStato;

      var data  = await API.registrations.list(filtri);
      var lista = data.data || [];
      if (count) count.textContent = lista.length + ' iscrizioni';
      if (!lista.length) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--color-text-muted);padding:2rem;">Nessuna iscrizione trovata</td></tr>';
        return;
      }
      tbody.innerHTML = lista.map(function (i) {
        var statoCls = i.stato === 'confermata' ? 'color:var(--color-success)' : 'color:var(--color-danger)';
        var percorso = i.percorso_nome || (i.lab_t1_nome ? i.lab_t1_nome + (i.lab_t2_nome ? '+'+i.lab_t2_nome : '') : '—');
        return '<tr>' +
          '<td style="font-weight:600;">' + (i.studente || '—') + '</td>' +
          '<td style="color:var(--color-text-secondary);">' + (i.genitore || '—') + '</td>' +
          '<td>' + (i.evento || '—') + '</td>' +
          '<td>' + percorso + '</td>' +
          '<td>' + (i.gruppo_codice || '—') + '</td>' +
          '<td><span style="font-size:var(--text-xs);font-weight:700;' + statoCls + ';">' + i.stato + '</span></td>' +
          '<td style="color:var(--color-text-muted);">' + fmtData(i.creato_il) + '</td>' +
          '<td><button class="seg-btn seg-btn--icon" onclick="annullaIscrizione(' + i.id + ')" title="Annulla">🗑</button></td>' +
        '</tr>';
      }).join('');
      if (footer) footer.textContent = 'Mostrando ' + lista.length + ' iscrizioni';
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="8" style="color:var(--color-danger);text-align:center;padding:2rem;">Errore: ' + err.message + '</td></tr>';
    }
  }

  window.filterIscrizioni = function () {
    renderIscrizioniSez(
      $('iscr-search')?.value || '',
      $('iscr-filter-evento')?.value || 'tutti',
      $('iscr-filter-stato')?.value || 'tutti'
    );
  };

  window.annullaIscrizione = async function (id) {
    if (!confirm('Annullare questa iscrizione?')) return;
    try {
      await API.registrations.cancel(id);
      renderIscrizioniSez();
    } catch (err) { alert('Errore: ' + err.message); }
  };

  /* ----------------------------------------------------------
     SEZIONE UTENTI (inline)
     ---------------------------------------------------------- */
  async function renderUtentiSez(filtroTesto, filtroRuolo) {
    var tbody  = $('utenti-sez-tbody');
    var footer = $('utenti-sez-footer');
    var count  = $('utenti-sez-count');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--color-text-muted);">Caricamento...</td></tr>';
    try {
      var filtri = {};
      if (filtroTesto && filtroTesto.trim()) filtri.search = filtroTesto;
      if (filtroRuolo && filtroRuolo !== 'tutti') filtri.ruolo = filtroRuolo;

      var [utentiData, apprData] = await Promise.all([
        API.users.list(filtri),
        API.users.approvazioni(),
      ]);
      var lista = utentiData.data || [];
      var appr  = apprData.data  || [];

      if (count) count.textContent = lista.length + ' utenti';

      // Approvazioni in cima
      renderApprovazioniList(appr, 'approv-list-utenti');
      var badge = $('approv-badge-utenti');
      if (badge) badge.textContent = appr.length + ' richieste';

      var RUOLO_LABEL = { segreteria:'Segreteria', staff:'Staff', professore:'Prof.', genitore:'Genitore', admin:'Admin' };
      var STATO_CLS   = { attivo:'stato-badge--attivo', non_verificato:'stato-badge--non-verif', sospeso:'stato-badge--sospeso' };
      var STATO_LBL   = { attivo:'● Attivo', non_verificato:'● Non verificato', sospeso:'● Sospeso' };

      tbody.innerHTML = lista.map(function (u) {
        var rl = RUOLO_LABEL[u.ruolo] || u.ruolo;
        var sc = STATO_CLS[u.stato]   || 'stato-badge--non-verif';
        var sl = STATO_LBL[u.stato]   || u.stato;
        var ini = (u.nome[0] + u.cognome[0]).toUpperCase();
        return '<tr>' +
          '<td><div class="u-cell"><div class="u-avatar u-avatar--orange">' + ini + '</div>' +
          '<div><div class="u-cell__name">' + u.nome + ' ' + u.cognome + '</div>' +
          '<div class="u-cell__sub">' + rl + '</div></div></div></td>' +
          '<td style="color:var(--color-text-secondary);">' + u.email + '</td>' +
          '<td><span class="ruolo-badge ruolo-badge--' + u.ruolo + '">' + rl + '</span></td>' +
          '<td><span class="stato-badge ' + sc + '">' + sl + '</span></td>' +
          '<td style="color:var(--color-text-muted);">' + (u.iscrizioni_attive || '—') + '</td>' +
          '<td style="color:var(--color-text-muted);">' + fmtData(u.creato_il) + '</td>' +
          '<td><div style="display:flex;gap:var(--space-2);">' +
            (u.ruolo !== 'admin' ? '<button class="btn-elimina" onclick="eliminaUtenteSeg(' + u.id + ')">🗑 Elimina</button>' : '<span style="color:var(--color-text-muted);font-size:var(--text-xs);">Admin</span>') +
          '</div></td></tr>';
      }).join('');
      if (footer) footer.textContent = 'Mostrando ' + lista.length + ' utenti';
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="7" style="color:var(--color-danger);text-align:center;padding:2rem;">Errore: ' + err.message + '</td></tr>';
    }
  }

  window.filterUtentiSez = function () {
    renderUtentiSez(
      $('utenti-sez-search')?.value || '',
      $('utenti-sez-ruolo')?.value  || 'tutti'
    );
  };

  window.eliminaUtenteSeg = async function (id) {
    if (!confirm('Eliminare questo utente? L\'operazione non può essere annullata.')) return;
    try {
      await API.users.elimina(id);
      renderUtentiSez();
    } catch (err) { alert('Errore: ' + err.message); }
  };

  /* ----------------------------------------------------------
     MENU ELIMINA DAL DB
     ---------------------------------------------------------- */

  window.toggleEliminaMenu = function () {
    var menu = document.getElementById('elimina-menu');
    if (!menu) return;
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    // Chiudi cliccando fuori
    setTimeout(function () {
      document.addEventListener('click', function handler(e) {
        var wrap = document.getElementById('elimina-menu-wrap');
        if (wrap && !wrap.contains(e.target)) {
          menu.style.display = 'none';
          document.removeEventListener('click', handler);
        }
      });
    }, 10);
  };

  /* Elimina genitori di un evento specifico */
  window.eliminaUtentiPerEvento = async function () {
    document.getElementById('elimina-menu').style.display = 'none';
    try {
      // Carica eventi per far scegliere
      var data   = await API.events.list(false);
      var eventi = data.data || [];
      if (!eventi.length) { alert('Nessun evento trovato.'); return; }

      var opzioni = eventi.map(function (ev, i) {
        var tipo = ev.tipo === 'open_day' ? 'Open Day' : 'Cardano Day';
        var d    = new Date(ev.data_evento).toLocaleDateString('it-IT', {day:'2-digit',month:'short',year:'numeric'});
        return (i+1) + '. ' + tipo + ' — ' + d + ' (' + (ev.iscritti||0) + ' iscritti)';
      }).join('\n');

      var scelta = prompt('Scegli il numero dell\'evento:\n\n' + opzioni);
      if (!scelta) return;
      var idx = parseInt(scelta) - 1;
      if (isNaN(idx) || idx < 0 || idx >= eventi.length) { alert('Scelta non valida.'); return; }

      var ev = eventi[idx];
      var tipo = ev.tipo === 'open_day' ? 'Open Day' : 'Cardano Day';
      var d    = new Date(ev.data_evento).toLocaleDateString('it-IT');

      if (!confirm('⚠ Eliminare tutti i genitori iscritti a:\n' + tipo + ' — ' + d + '?\n\nVerranno rimossi anche i loro figli e iscrizioni.')) return;
      if (!confirm('CONFERMA FINALE — operazione irreversibile. Continuare?')) return;

      var res = await API.users.eliminaTutti({ tipo: 'per_evento', id_evento: ev.id });
      alert('✓ ' + res.eliminati + ' genitori eliminati (evento: ' + tipo + ' — ' + d + ').');
      renderUtentiSez();
    } catch (err) { alert('Errore: ' + err.message); }
  };

  /* Elimina TUTTI i genitori da tutti gli eventi */
  window.eliminaTuttiGenitoriDB = async function () {
    document.getElementById('elimina-menu').style.display = 'none';
    if (!confirm('⚠ ATTENZIONE!\n\nEliminare TUTTI i genitori dal database?\nVerranno rimossi anche tutti i figli e tutte le iscrizioni.\nOperazione irreversibile.')) return;
    if (!confirm('SEI ASSOLUTAMENTE SICURO? Scrivi OK nella prossima finestra.')) return;
    var conf = prompt('Scrivi ELIMINA per confermare:');
    if (conf !== 'ELIMINA') { alert('Operazione annullata.'); return; }
    try {
      var data = await API.users.eliminaTutti({ tipo: 'tutti_genitori' });
      alert('✓ ' + data.eliminati + ' genitori eliminati dal database.');
      renderUtentiSez();
    } catch (err) { alert('Errore: ' + err.message); }
  };

  /* Elimina Staff / Professori */
  window.eliminaStaffDB = async function (ruoli) {
    document.getElementById('elimina-menu').style.display = 'none';
    var lbl = ruoli === 'staff' ? 'Staff' : ruoli === 'professore' ? 'Professori' : 'Staff e Professori';
    if (!confirm('⚠ Eliminare tutti i ' + lbl + ' dal database?\nPerderanno l'accesso al sistema.\nOperazione irreversibile.')) return;
    if (!confirm('CONFERMA FINALE — continuare?')) return;
    try {
      var data = await API.users.eliminaTutti({ tipo: 'staff', ruoli: ruoli });
      alert('✓ ' + data.eliminati + ' utenti (' + lbl + ') eliminati.');
      renderUtentiSez();
    } catch (err) { alert('Errore: ' + err.message); }
  };

  /* Vecchia funzione mantenuta per retrocompatibilità */
  window.eliminaTuttiUtenti = window.eliminaTuttiGenitoriDB;

  /* ----------------------------------------------------------
     SEZIONE APPROVAZIONI
     ---------------------------------------------------------- */
  async function renderApprovazioniSez() {
    try {
      var data = await API.users.approvazioni();
      renderApprovazioniList(data.data || [], 'approv-list-2');
    } catch (err) { console.error('[Approvazioni]', err.message); }
  }

  /* ----------------------------------------------------------
     SEZIONE SCUOLE MEDIE
     ---------------------------------------------------------- */
  async function renderScuoleSez(filtro) {
    var tbody  = $('scuole-tbody');
    var footer = $('scuole-footer');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--color-text-muted);">Caricamento...</td></tr>';
    try {
      var data  = filtro
        ? await API.schools.search(filtro)
        : await API.schools.list();
      var lista = data.data || [];
      tbody.innerHTML = lista.map(function (s) {
        return '<tr>' +
          '<td style="font-weight:600;">' + s.nome + '</td>' +
          '<td>' + s.citta + '</td>' +
          '<td>' + s.provincia + '</td>' +
          '<td>' + (s.studenti_registrati || 0) + '</td>' +
          '<td><div style="display:flex;gap:var(--space-2);">' +
            '<button class="seg-btn seg-btn--icon" onclick="eliminaScuola(' + s.id + ')" title="Elimina">🗑</button>' +
          '</div></td></tr>';
      }).join('');
      if (footer) footer.textContent = lista.length + ' scuole registrate';
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="5" style="color:var(--color-danger);text-align:center;padding:2rem;">Errore: ' + err.message + '</td></tr>';
    }
  }

  window.filterScuole = function () { renderScuoleSez($('scuole-search')?.value || ''); };

  window.aggiungiScuola = async function () {
    var nome  = prompt('Nome scuola media:');
    if (!nome) return;
    var citta = prompt('Città:') || '';
    try {
      await API.schools.create({ nome: nome, citta: citta, provincia: 'PV' });
      renderScuoleSez();
    } catch (err) { alert('Errore: ' + err.message); }
  };

  window.eliminaScuola = async function (id) {
    if (!confirm('Eliminare questa scuola?')) return;
    try {
      await API.schools.delete(id);
      renderScuoleSez();
    } catch (err) { alert('Errore: ' + err.message); }
  };

  /* ----------------------------------------------------------
     EXPORT EXCEL (download CSV reale)
     ---------------------------------------------------------- */
  function scaricaCSV(nomeFile, righe) {
    var csv  = righe.map(function(r){ return r.map(function(c){ return '"' + String(c).replace(/"/g,'""') + '"'; }).join(','); }).join('\n');
    var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href = url; a.download = nomeFile; a.click();
    URL.revokeObjectURL(url);
  }

  /* Export iscrizioni — rispetta i filtri attivi o scarica tutto */
  window.exportExcelIscrizioni = async function (filtri) {
    try {
      var params = filtri || {};
      var data = await API.registrations.list(params);
      var lista = data.data || [];
      var nomeEvento = params.id_evento ? '_evento' + params.id_evento : '_tutti';
      var righe = [['Studente','Genitore','Email Genitore','Evento','Data Evento','Percorso/Lab','Gruppo','Aula T1','Aula T2','Stato','Iscritto il']];
      lista.forEach(function(i){
        righe.push([
          i.studente||'', i.genitore||'', i.genitore_email||'',
          i.evento||'', i.data_evento||'',
          i.percorso_nome || ((i.lab_t1_nome||'') + (i.lab_t2_nome ? ' + '+i.lab_t2_nome : '')),
          i.gruppo_codice||'', i.aula_t1||'', i.aula_t2||'',
          i.stato||'', i.creato_il||''
        ]);
      });
      scaricaCSV('iscrizioni' + nomeEvento + '_' + new Date().toISOString().slice(0,10) + '.csv', righe);
      return lista.length;
    } catch (err) { alert('Errore export: ' + err.message); return 0; }
  };

  /* Export con i filtri attualmente selezionati nella sezione iscrizioni */
  window.exportConFiltri = async function () {
    var filtroEvento = document.getElementById('iscr-filter-evento')?.value || 'tutti';
    var filtroStato  = document.getElementById('iscr-filter-stato')?.value  || 'tutti';
    var filtroSearch = document.getElementById('iscr-search')?.value        || '';
    var params = {};
    if (filtroEvento && filtroEvento !== 'tutti') params.id_evento = filtroEvento;
    if (filtroStato  && filtroStato  !== 'tutti') params.stato     = filtroStato;
    if (filtroSearch.trim()) params.search = filtroSearch.trim();
    var n = await exportExcelIscrizioni(params);
    if (n > 0) alert('Export completato: ' + n + ' iscrizioni scaricate.');
  };

  window.exportExcelEventi = async function () {
    try {
      var data = await API.events.list(false);
      var lista = data.data || [];
      var righe = [['Tipo','Titolo','Data','Iscritti','Posti Max','Pubblicato','Gruppi']];
      lista.forEach(function(ev){
        righe.push([ev.tipo,ev.titolo,ev.data_evento,ev.iscritti||0,ev.posti_max,ev.pubblicato?'Sì':'No',ev.gruppi_eseguiti?'Sì':'No']);
      });
      scaricaCSV('eventi_' + new Date().toISOString().slice(0,10) + '.csv', righe);
    } catch (err) { alert('Errore export: ' + err.message); }
  };

  window.exportExcelUtenti = async function () {
    try {
      var data = await API.users.list({});
      var lista = data.data || [];
      var righe = [['Nome','Cognome','Email','Ruolo','Stato','Iscrizioni attive','Registrato il']];
      lista.forEach(function(u){
        righe.push([u.nome,u.cognome,u.email,u.ruolo,u.stato,u.iscrizioni_attive||0,u.creato_il||'']);
      });
      scaricaCSV('utenti_' + new Date().toISOString().slice(0,10) + '.csv', righe);
    } catch (err) { alert('Errore export: ' + err.message); }
  };

  window.exportExcelScuole = async function () {
    try {
      var data = await API.schools.list();
      var lista = data.data || [];
      var righe = [['Nome','Città','Provincia','Studenti registrati']];
      lista.forEach(function(s){ righe.push([s.nome,s.citta,s.provincia,s.studenti_registrati||0]); });
      scaricaCSV('scuole_medie_' + new Date().toISOString().slice(0,10) + '.csv', righe);
    } catch (err) { alert('Errore export: ' + err.message); }
  };

  window.exportExcelGlobale = function () { exportExcelIscrizioni({}); };

  /* ----------------------------------------------------------
     NOTIFICHE
     ---------------------------------------------------------- */
  window.inviaNotificaSez = async function () {
    var dest = $('notifica-dest-sez')?.value   || '';
    var ogg  = $('notifica-oggetto-sez')?.value.trim() || '';
    var msg  = $('notifica-msg-sez')?.value.trim()     || '';
    if (!ogg || !msg) return alert('Compila oggetto e messaggio.');
    if (!confirm('Inviare email a: ' + dest + '?')) return;
    try {
      var data = await API.notifications.send({ destinatari: dest, oggetto: ogg, corpo: msg });
      alert('Email inviate a ' + data.email_inviate + ' destinatari!');
    } catch (err) { alert('Errore invio: ' + err.message); }
  };

  /* ----------------------------------------------------------
     DIVIDI GRUPPI — widget dashboard
     ---------------------------------------------------------- */
  var _dividiEventoId   = null;
  var _dividiEventoTipo = 'open_day';
  var _numGruppi = { MISTO: 4, LICEO: 3, TECNICO: 2 };

  // Carica eventi nel dropdown dividi
  async function caricaEventiDividi() {
    var menu = $('dividi-dropdown-menu');
    if (!menu) return;
    try {
      var data   = await API.events.list(false);
      var eventi = data.data || [];
      menu.innerHTML = eventi.map(function (ev, idx) {
        var tipo  = ev.tipo === 'open_day' ? 'Open Day' : 'Cardano Day';
        var tipoCls = ev.tipo === 'open_day' ? 'dividi-dropdown__item-type--openday' : 'dividi-dropdown__item-type--cardano';
        return '<div class="dividi-dropdown__item' + (idx===0?' dividi-dropdown__item--active':'') + '" ' +
          'data-value="' + ev.id + '" data-tipo="' + ev.tipo + '" ' +
          'onclick="selectDividiEvento(this)">' +
          '<span class="dividi-dropdown__item-type ' + tipoCls + '">' + tipo + '</span>' +
          new Date(ev.data_evento).toLocaleDateString('it-IT', {day:'2-digit',month:'long',year:'numeric'}) +
        '</div>';
      }).join('');
      if (eventi.length) {
        _dividiEventoId   = eventi[0].id;
        _dividiEventoTipo = eventi[0].tipo;
        var lbl = $('dividi-dropdown-label');
        if (lbl) {
          var e0 = eventi[0];
          lbl.textContent = (e0.tipo==='open_day'?'Open Day':'Cardano Day') + ' — ' +
            new Date(e0.data_evento).toLocaleDateString('it-IT',{day:'2-digit',month:'long',year:'numeric'});
        }
        aggiornaDividiStats(eventi[0]);
      }
    } catch(err) { console.error('[dividi]', err.message); }
  }

  async function aggiornaDividiStats(ev) {
    var totStat = $('dividi-stat-iscritti');
    var grpStat = $('dividi-stat-gruppi');
    if (totStat) totStat.textContent = ev.iscritti || 0;
    if (grpStat) grpStat.textContent = _numGruppi.MISTO + _numGruppi.LICEO + _numGruppi.TECNICO;

    var isOD = ev.tipo === 'open_day';
    var openDiv   = $('dividi-openday-config');
    var cardanoDiv = $('dividi-cardano-config');
    if (openDiv)   openDiv.style.display   = isOD ? 'block' : 'none';
    if (cardanoDiv) cardanoDiv.style.display = isOD ? 'none'  : 'block';

    if (!isOD) {
      // Carica labs
      var labList = $('dividi-cardano-labs');
      if (labList && ev.laboratori) {
        labList.innerHTML = ev.laboratori.map(function(lab){
          var pct1 = lab.aule_t1 * lab.posti_aula_t1 > 0 ? 50 : 0;
          return '<div class="dividi-lab-row">' +
            '<div class="dividi-lab-badge">' + lab.codice + '</div>' +
            '<div class="dividi-lab-nome">' + lab.nome + '</div>' +
            '<div style="flex:1;"><div style="font-size:10px;color:rgba(255,255,255,0.4);margin-bottom:3px;">T1: ' + lab.aule_t1*lab.posti_aula_t1 + ' posti</div>' +
            '<div class="dividi-lab-bar"><div class="dividi-lab-bar-fill" style="width:' + pct1 + '%"></div></div></div>' +
          '</div>';
        }).join('');
      }
    }

    aggiornaDividiPreview();
  }

  function aggiornaDividiPreview() {
    ['misto','liceo','tecnico'].forEach(function(p) {
      var n  = _numGruppi[p.toUpperCase()];
      var numEl  = $('num-gruppi-' + p);
      var prevEl = $('preview-' + p);
      if (numEl) numEl.textContent = n;
        if (prevEl) prevEl.textContent = '';
    });
    var grpStat = $('dividi-stat-gruppi');
    if (grpStat) grpStat.textContent = _numGruppi.MISTO + _numGruppi.LICEO + _numGruppi.TECNICO;
  }

  window.cambiaNumGruppi = function (percorso, delta) {
    var key = percorso.toUpperCase();
    _numGruppi[key] = Math.max(1, Math.min(20, (_numGruppi[key] || 1) + delta));
    aggiornaDividiPreview();
  };

  window.toggleDividiDropdown = function () {
    var dd = $('dividi-dropdown');
    if (dd) dd.setAttribute('aria-expanded', dd.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
    var menu = $('dividi-dropdown-menu');
    if (menu) menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  };

  window.selectDividiEvento = async function (el) {
    _dividiEventoId   = parseInt(el.dataset.value);
    _dividiEventoTipo = el.dataset.tipo;
    var lbl = $('dividi-dropdown-label');
    if (lbl) lbl.textContent = el.textContent.trim();
    var menu = $('dividi-dropdown-menu');
    if (menu) menu.style.display = 'none';
    document.querySelectorAll('.dividi-dropdown__item').forEach(function(d){ d.classList.remove('dividi-dropdown__item--active'); });
    el.classList.add('dividi-dropdown__item--active');
    try {
      var data = await API.events.get(_dividiEventoId);
      aggiornaDividiStats(data.data);
    } catch(err) { console.error(err); }
  };

  // Bottone esegui divisione
  var btnDividi = $('btn-esegui-divisione');
  if (btnDividi) {
    btnDividi.addEventListener('click', async function () {
      if (!_dividiEventoId) return alert('Seleziona un evento');
      btnDividi.disabled = true;
      btnDividi.classList.add('is-loading');
      try {
        await API.registrations.dividi(_dividiEventoId, {
          MISTO:   _numGruppi.MISTO,
          LICEO:   _numGruppi.LICEO,
          TECNICO: _numGruppi.TECNICO,
        });
        var conf = confirm('Divisione completata!\n\nMisto: ' + _numGruppi.MISTO + ' gruppi\nLiceo: ' + _numGruppi.LICEO + ' gruppi\nTecnico: ' + _numGruppi.TECNICO + ' gruppi\n\nVuoi andare all\'anteprima?');
        if (conf) window.location.href = 'divisione-gruppi.html?evento=' + _dividiEventoId +
          '&misto=' + _numGruppi.MISTO + '&liceo=' + _numGruppi.LICEO + '&tecnico=' + _numGruppi.TECNICO;
      } catch (err) {
        alert('Errore divisione: ' + err.message);
      } finally {
        btnDividi.disabled = false;
        btnDividi.classList.remove('is-loading');
        var lbl = btnDividi.querySelector('.btn-label');
        if (lbl) lbl.textContent = '▶ ESEGUI DIVISIONE GRUPPI';
      }
    });
  }

  /* ----------------------------------------------------------
     ANNO SCOLASTICO (impostazioni)
     ---------------------------------------------------------- */
  window.aggiornaDisplayAnno = function () {
    var el = $('anno-display');
    if (el && typeof CONFIG !== 'undefined') el.textContent = CONFIG.getAnno();
    var overrideEl = $('anno-override-check');
    if (overrideEl && typeof CONFIG !== 'undefined') overrideEl.checked = CONFIG.hasOverride();
  };

  window.salvaAnnoOverride = function () {
    var input = $('anno-override-input');
    var val   = input ? input.value.trim() : '';
    if (!val) return alert('Inserisci un anno valido (es. 2026–27)');
    if (typeof CONFIG !== 'undefined') CONFIG.setAnnoOverride(val);
    aggiornaDisplayAnno();
    alert('Anno scolastico impostato a: ' + val);
  };

  window.resetAnnoOverride = function () {
    if (typeof CONFIG !== 'undefined') CONFIG.setAnnoOverride(null);
    aggiornaDisplayAnno();
    alert('Anno scolastico ripristinato al calcolo automatico');
  };

  /* ----------------------------------------------------------
     INIT
     ---------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', async function () {
    showSection('dashboard');
    await caricaEventiDividi();
  });

})();

/* ============================================================
   EXPORT CON CAMPI SELEZIONABILI
   ============================================================ */

var _exportDatiCache = null;
var _exportTipo      = 'iscrizioni';

var CAMPI_ISCRIZIONI = [
  { key: 'studente',       label: 'Nome studente',    default: true },
  { key: 'genitore',       label: 'Nome genitore',    default: true },
  { key: 'genitore_email', label: 'Email genitore',   default: true },
  { key: 'evento',         label: 'Evento',           default: true },
  { key: 'data_evento',    label: 'Data evento',      default: true },
  { key: 'percorso_nome',  label: 'Percorso',         default: true },
  { key: 'gruppo_codice',  label: 'Gruppo',           default: true },
  { key: 'aula_t1',        label: 'Aula T1',          default: false },
  { key: 'aula_t2',        label: 'Aula T2',          default: false },
  { key: 'scuola',         label: 'Scuola media',     default: false },
  { key: 'stato',          label: 'Stato iscrizione', default: true },
  { key: 'creato_il',      label: 'Data iscrizione',  default: false },
];

window.apriExportCampi = async function(tipo) {
  _exportTipo = tipo || 'iscrizioni';
  var modal = document.getElementById('export-modal');
  var lista = document.getElementById('export-campi-list');
  if (!modal || !lista) return;

  lista.innerHTML = CAMPI_ISCRIZIONI.map(function(campo) {
    return '<label style="display:flex;align-items:center;gap:var(--space-2);font-size:var(--text-sm);cursor:pointer;padding:var(--space-2);border:1px solid var(--color-border);border-radius:var(--radius-md);">' +
      '<input type="checkbox" id="campo-' + campo.key + '" ' + (campo.default ? 'checked' : '') + ' style="accent-color:var(--color-primary);cursor:pointer;" />' +
      campo.label +
    '</label>';
  }).join('');

  modal.style.display = 'flex';

  // Precarica i dati
  try {
    var data = await API.registrations.list({});
    _exportDatiCache = data.data || [];
  } catch(err) { _exportDatiCache = []; }
};

window.eseguiExportCampi = function() {
  var modal = document.getElementById('export-modal');
  if (modal) modal.style.display = 'none';

  var campiSelezionati = CAMPI_ISCRIZIONI.filter(function(c) {
    var el = document.getElementById('campo-' + c.key);
    return el && el.checked;
  });

  if (!campiSelezionati.length) { alert('Seleziona almeno un campo.'); return; }
  if (!_exportDatiCache || !_exportDatiCache.length) { alert('Nessun dato disponibile.'); return; }

  var righe = [campiSelezionati.map(function(c){ return c.label; })];
  _exportDatiCache.forEach(function(row) {
    righe.push(campiSelezionati.map(function(c) {
      var v = row[c.key];
      if (c.key === 'percorso_nome' && !v && row.lab_t1_nome) {
        v = row.lab_t1_nome + (row.lab_t2_nome ? ' + ' + row.lab_t2_nome : '');
      }
      return v != null ? String(v) : '—';
    }));
  });

  scaricaCSV('iscrizioni_personalizzato_' + new Date().toISOString().slice(0,10) + '.csv', righe);
};

// Sostituisci il pulsante export normale con quello con campi
window.exportExcelIscrizioni = async function(filtri) {
  apriExportCampi('iscrizioni');
};
