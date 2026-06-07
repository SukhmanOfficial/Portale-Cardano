/**
 * area-genitore.js — Dashboard genitore
 * Sistema Cardano Day · ITIS "G. Cardano", Pavia
 */

(function () {
  'use strict';

  var utente = API.auth.requireLogin(['genitore']);
  if (!utente) return;

  function $(id) { return document.getElementById(id); }

  /* ----------------------------------------------------------
     TOAST — notifiche inline (no alert)
     ---------------------------------------------------------- */
  function toast(msg, tipo) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'toast toast--' + (tipo || 'info') + ' toast--show';
    clearTimeout(t._timer);
    t._timer = setTimeout(function() { t.classList.remove('toast--show'); }, 3500);
  }

  /* ----------------------------------------------------------
     DIALOG — conferma inline (no confirm)
     ---------------------------------------------------------- */
  function dialog(msg, onSi) {
    var d = document.getElementById('dialog-modal');
    var dmsg = document.getElementById('dialog-msg');
    var dsi = document.getElementById('dialog-si');
    var dno = document.getElementById('dialog-no');
    if (!d) { if (confirm(msg)) onSi(); return; }
    dmsg.textContent = msg;
    d.style.display = 'flex';
    dsi.onclick = function() { d.style.display = 'none'; onSi(); };
    dno.onclick = function() { d.style.display = 'none'; };
  }

  /* ----------------------------------------------------------
     NAVIGAZIONE SEZIONI
     ---------------------------------------------------------- */
  function showSection(name) {
    document.querySelectorAll('[data-section]').forEach(function (el) {
      el.style.display = el.dataset.section === name ? 'block' : 'none';
    });
    document.querySelectorAll('[data-nav]').forEach(function (el) {
      el.classList.toggle('sidebar__link--active', el.dataset.nav === name);
    });
  }
  window._showSection = showSection;

  function formatData(str) {
    if (!str) return '—';
    var d = new Date(str);
    return d.toLocaleDateString('it-IT', { day:'2-digit', month:'short', year:'numeric' });
  }

  /* ----------------------------------------------------------
     TOPBAR
     ---------------------------------------------------------- */
  var nameEl = $('topbar-user-name');
  if (nameEl) nameEl.textContent = utente.nome + ' ' + utente.cognome;
  var welcomeEl = $('welcome-name');
  if (welcomeEl) welcomeEl.textContent = utente.nome;
  var initEl = document.querySelector('.area-topbar__avatar');
  if (initEl) initEl.textContent = (utente.nome[0] + utente.cognome[0]).toUpperCase();

  /* ----------------------------------------------------------
     CARICA EVENTI — mostra cards nella dashboard
     ---------------------------------------------------------- */
  async function caricaEventi() {
    var grid = $('eventi-dashboard-grid');
    if (!grid) return;
    try {
      var data = await API.events.list();
      var eventi = (data.data || []).filter(function(e){ return e.pubblicato; });
      if (!eventi.length) {
        grid.innerHTML = '<div class="empty-state"><div class="empty-state__icon">📅</div><div class="empty-state__text">Nessun evento disponibile al momento.</div></div>';
        return;
      }
      grid.innerHTML = eventi.map(function(ev) {
        var isCardano = ev.tipo === 'cardano_day';
        var pagina = isCardano ? 'iscrizione-cardano.html' : 'iscrizione-openday.html';
        var posti = ev.posti_max - (ev.iscritti || 0);
        var aperte = ev.iscrizioni_aperte;
        var d = new Date(ev.data_evento);
        var giorno = d.getDate();
        var mese = d.toLocaleString('it-IT', { month: 'short' }).toUpperCase();
        return '<div class="evento-card' + (isCardano ? ' evento-card--cardano' : '') + '">' +
          '<div class="evento-card__date"><span class="evento-card__day">' + giorno + '</span><span class="evento-card__month">' + mese + '</span></div>' +
          '<div class="evento-card__body">' +
            '<div class="evento-card__badge">' + (isCardano ? 'Cardano Day' : 'Open Day') + '</div>' +
            '<div class="evento-card__title">' + ev.titolo + '</div>' +
            '<div class="evento-card__meta">' +
              (aperte ? '🟢 Iscrizioni aperte · ' + posti + ' posti disponibili' : '🔴 Iscrizioni chiuse') +
            '</div>' +
          '</div>' +
          '<div class="evento-card__action">' +
            (aperte
            ? '<button class="evento-card__btn" onclick="iscrivitiOra(' + ev.id + ',\'' + ev.tipo + '\');">Iscriviti →</button>'
              : '<span class="evento-card__btn evento-card__btn--disabled">Chiuse</span>') +
          '</div>' +
        '</div>';
      }).join('');
    } catch (err) {
      grid.innerHTML = '<div class="empty-state"><div class="empty-state__text" style="color:var(--color-danger);">Errore caricamento eventi</div></div>';
    }
  }

  /* ----------------------------------------------------------
     CARICA ISCRIZIONI
     ---------------------------------------------------------- */
  function renderIscrizioneCard(i, idx, opzioni) {
    opzioni = opzioni || {};
    var firme = i.firme_count || 0;
    var label = i.evento_tipo === 'cardano_day'
      ? (i.lab_t1 || '—') + (i.lab_t2 ? ' + ' + i.lab_t2 : '')
      : i.percorso_nome || '—';
    var gruppoBadge = i.gruppo_codice
      ? '<span class="gruppo-badge">' + i.gruppo_codice + '</span>'
      : '<em class="text-muted">Assegnato dopo chiusura</em>';
    var statoClass = i.stato === 'confermata' ? 'stato-ok' : (i.stato === 'annullata' ? 'stato-err' : 'stato-warn');
    var isCardano = i.evento_tipo === 'cardano_day';
    return '<div class="iscrizione-card-new">' +
      '<div class="iscrizione-card-new__header">' +
        '<span class="tipo-badge ' + (isCardano ? 'tipo-badge--cardano' : 'tipo-badge--openday') + '">' +
          (isCardano ? 'Cardano Day' : 'Open Day') +
        '</span>' +
        '<span class="' + statoClass + '">' + i.stato + '</span>' +
      '</div>' +
      '<div class="iscrizione-card-new__title">' + (i.evento || '—') + '</div>' +
      '<div class="iscrizione-card-new__rows">' +
        '<div class="iscrizione-card-new__row"><span>📅 Data</span><span>' + formatData(i.data_evento) + '</span></div>' +
        '<div class="iscrizione-card-new__row"><span>👤 Studente</span><span><strong>' + (i.studente || '—') + '</strong></span></div>' +
        '<div class="iscrizione-card-new__row"><span>📚 ' + (isCardano ? 'Laboratori' : 'Percorso') + '</span><span>' + label + '</span></div>' +
        '<div class="iscrizione-card-new__row"><span>🏷 Gruppo</span><span>' + gruppoBadge + '</span></div>' +
      '</div>' +
      (isCardano && !opzioni.soloQr ? '<div class="firme-mini">' + renderFirmeMini(firme) + '</div>' : '') +
      (!opzioni.soloQr && i.stato !== 'annullata' ?
        '<div class="iscrizione-card-new__actions">' +
          '<button class="btn-qr-new" onclick="mostraQr(' + idx + ')">📱 QR Code</button>' +
          (i.stato === 'confermata' ? '<button class="btn-annulla-new" onclick="annullaIscrizione(' + i.id + ')">Annulla</button>' : '') +
        '</div>' : '') +
      (opzioni.soloQr ?
        '<div class="iscrizione-card-new__actions">' +
          '<button class="btn-qr-new" style="width:100%;" onclick="mostraQr(' + idx + ')">📱 Mostra QR Code</button>' +
        '</div>' : '') +
    '</div>';
  }

  async function caricaIscrizioni() {
    var grids = [$('iscrizioni-grid'), $('iscrizioni-list'), $('qr-iscrizioni-grid')];
    var loading = '<div class="empty-state"><div class="empty-state__text">Caricamento...</div></div>';
    grids.forEach(function(g){ if(g) g.innerHTML = loading; });

    try {
      var data = await API.registrations.mie();
      var tutte = data.data || [];
      window._iscrizioniCache = tutte;

      // Attive (confermate/in_attesa)
      var attive = tutte.filter(function(i){ return i.stato !== 'annullata'; });
      // Storico (tutte)
      var storico = $('storico-grid');

      var emptyAttive = '<div class="empty-state"><div class="empty-state__icon">📋</div><div class="empty-state__text">Nessuna iscrizione attiva.</div></div>';
      var emptyStorico = '<div class="empty-state"><div class="empty-state__icon">📁</div><div class="empty-state__text">Nessuna iscrizione trovata</div></div>';

      if (!attive.length) {
        [$('iscrizioni-grid'), $('iscrizioni-list'), $('qr-iscrizioni-grid')].forEach(function(g){ if(g) g.innerHTML = emptyAttive; });
      } else {
        var htmlAttive = attive.map(function(i, idx){ return renderIscrizioneCard(i, idx, {}); }).join('');
        var htmlQr = attive.map(function(i, idx){ return renderIscrizioneCard(i, idx, {soloQr:true}); }).join('');
        if ($('iscrizioni-grid')) $('iscrizioni-grid').innerHTML = htmlAttive;
        if ($('iscrizioni-list')) $('iscrizioni-list').innerHTML = htmlAttive;
        if ($('qr-iscrizioni-grid')) $('qr-iscrizioni-grid').innerHTML = htmlQr;
      }

      // Storico — tutte comprese annullate
      if (storico) {
        if (!tutte.length) {
          storico.innerHTML = emptyStorico;
        } else {
          storico.innerHTML = tutte.map(function(i, idx){ return renderIscrizioneCard(i, idx, {}); }).join('');
        }
      }

    } catch (err) {
      var errHtml = '<div class="empty-state"><div class="empty-state__text" style="color:var(--color-danger);">Errore caricamento iscrizioni</div></div>';
      grids.forEach(function(g){ if(g) g.innerHTML = errHtml; });
    }
  }

  function renderFirmeMini(n) {
    var firme = ['Entrata','Lab T1','Lab T2','Uscita'];
    return firme.map(function (f, i) {
      var done = i < n;
      return '<span class="firma-dot ' + (done ? 'firma-dot--done' : '') + '" title="' + f + '">' + (done ? '✓' : String(i+1)) + '</span>';
    }).join('');
  }

  /* ----------------------------------------------------------
     QR CODE MODAL
     ---------------------------------------------------------- */
  window.mostraQr = function (idx) {
    var modal   = $('qr-modal');
    var canvas  = $('qr-canvas');
    var tokenEl = $('qr-token-text');
    var infoEl  = $('qr-modal-info');
    if (!modal) return;
    var iscr = window._iscrizioniCache && window._iscrizioniCache[idx];
    if (!iscr) return;
    var token   = iscr.qr_token   || '';
    var tipo    = iscr.evento_tipo || '';
    var gruppo  = iscr.gruppo_codice || '';
    var studente = iscr.studente  || '';
    var evento  = iscr.evento     || '';

    if (canvas && window.QRCode && token) {
      QRCode.toCanvas(canvas, token, { width: 220, margin: 2, color: { dark: '#1A1A1A', light: '#FFFFFF' } }, function(err){ if(err) console.error(err); });
    }
    if (tokenEl) tokenEl.textContent = token.substring(0, 20) + '...';
    if (infoEl) {
      var html = '';
      if (studente) html += '<div style="font-weight:700;font-size:1rem;color:var(--color-text);margin-bottom:2px;">' + studente + '</div>';
      if (evento)   html += '<div style="font-size:.8rem;color:var(--color-text-muted);margin-bottom:.75rem;">' + evento + '</div>';
      if (tipo === 'open_day') {
        if (gruppo) {
          html += '<div style="background:#E8500A;color:#fff;border-radius:10px;padding:.5rem 1.4rem;font-size:1.8rem;font-weight:900;letter-spacing:4px;display:inline-block;margin-bottom:.4rem;">' + gruppo + '</div>';
          html += '<div style="font-size:.72rem;color:#888;margin-bottom:.4rem;">Gruppo assegnato — mostralo alla segreteria</div>';
        } else {
          html += '<div style="background:#F5F5F5;color:#888;border-radius:8px;padding:.4rem 1rem;font-size:.8rem;margin-bottom:.5rem;display:inline-block;">Gruppo assegnato dopo chiusura iscrizioni</div>';
        }
        html += '<div style="font-size:.7rem;color:#bbb;">Mostra questo QR se hai perso il foglio con il gruppo</div>';
      } else {
        if (gruppo) html += '<div style="background:#1A1A1A;color:#fff;border-radius:8px;padding:.3rem .9rem;font-size:1.1rem;font-weight:700;display:inline-block;margin-bottom:.4rem;">' + gruppo + '</div>';
        html += '<div style="font-size:.72rem;color:#888;">Verrà scansionato 4 volte durante la giornata</div>';
      }
      infoEl.innerHTML = html;
    }
    modal.style.display = 'flex';
  };

  window.chiudiQr = function () {
    var modal = $('qr-modal');
    if (modal) modal.style.display = 'none';
  };

  /* ----------------------------------------------------------
     ANNULLA ISCRIZIONE
     ---------------------------------------------------------- */
  window.annullaIscrizione = function (id) {
    dialog(`Annullare questa iscrizione? L'operazione non può essere annullata.`, function() {
      API.registrations.cancel(id)
        .then(function () { caricaIscrizioni(); toast('Iscrizione annullata', 'success'); })
        .catch(function (err) { toast('Errore: ' + err.message, 'error'); });
    });
  };

  /* ----------------------------------------------------------
     CARICA FIGLI
     ---------------------------------------------------------- */
  async function caricaFigli() {
    var listaPage = $('figli-grid-page');
    var listaDash = $('figli-grid-dash');
    try {
      var data = await API.users.figli();
      var figli = data.data || [];
      var colors = ['var(--color-primary)', '#2563eb', '#059669', '#7c3aed', '#b45309'];
      if (!figli.length) {
        var empty = '<div class="empty-state"><div class="empty-state__icon">👶</div><div class="empty-state__text">Nessun figlio aggiunto ancora</div></div>';
        if (listaPage) listaPage.innerHTML = empty;
        if (listaDash) listaDash.innerHTML = empty;
        return;
      }
      var html = figli.map(function (f, idx) {
        var initials = (f.nome[0] + f.cognome[0]).toUpperCase();
        var color = colors[idx % colors.length];
        var scuola = f.nome_scuola_media || f.scuola || '';
        return '<div class="figlio-card">' +
          '<div class="figlio-card__top">' +
            '<div class="figlio-card__avatar" style="background:' + color + '">' + initials + '</div>' +
            '<div class="figlio-card__info">' +
              '<div class="figlio-card__name">' + f.nome + ' ' + f.cognome + '</div>' +
              (scuola ? '<div class="figlio-card__school">🏫 ' + scuola + '</div>' : '') +
            '</div>' +
            '<button data-id="' + f.id + '" data-nome="' + f.nome + '" onclick="rimuoviFiglioBtn(this)" title="Rimuovi" class="btn-rimuovi-figlio">✕</button>' +
          '</div>' +
        '</div>';
      }).join('');
      if (listaPage) listaPage.innerHTML = html;
      if (listaDash) listaDash.innerHTML = html;
    } catch (err) {
      var errHtml = '<div class="empty-state"><div class="empty-state__text" style="color:var(--color-danger);">Errore caricamento figli</div></div>';
      if (listaPage) listaPage.innerHTML = errHtml;
      if (listaDash) listaDash.innerHTML = errHtml;
    }
  }

  window.rimuoviFiglioBtn = function (btn) {
    var id = parseInt(btn.dataset.id);
    var nome = btn.dataset.nome;
    window.rimuoviFiglio(id, nome);
  };

  window.rimuoviFiglio = function (id, nome) {
    dialog(`Rimuovere ${nome} dal tuo profilo?`, function() {
      API.users.delFiglio(id)
        .then(function () { caricaFigli(); toast(nome + ' rimosso', 'success'); })
        .catch(function (err) { toast('Errore: ' + err.message, 'error'); });
    });
  };

  /* ----------------------------------------------------------
     AGGIUNGI FIGLIO
     ---------------------------------------------------------- */
  var btnSalvaFiglio = $('btn-salva-figlio');
  if (btnSalvaFiglio) {
    btnSalvaFiglio.addEventListener('click', async function () {
      var nome    = $('figlio-nome')    ? $('figlio-nome').value.trim()    : '';
      var cognome = $('figlio-cognome') ? $('figlio-cognome').value.trim() : '';
      var scuola  = $('figlio-scuola')  ? $('figlio-scuola').value.trim()  : '';
      var msg = $('figlio-msg');
      if (!nome || !cognome) {
        if (msg) { msg.textContent = 'Nome e cognome sono obbligatori'; msg.style.color = 'var(--color-danger)'; msg.style.display = 'block'; }
        return;
      }
      btnSalvaFiglio.disabled = true;
      btnSalvaFiglio.textContent = 'Salvataggio...';
      try {
        await API.users.addFiglio({ nome: nome, cognome: cognome, scuola: scuola });
        if ($('figlio-nome'))    $('figlio-nome').value    = '';
        if ($('figlio-cognome')) $('figlio-cognome').value = '';
        if ($('figlio-scuola'))  $('figlio-scuola').value  = '';
        if (msg) msg.style.display = 'none';
        caricaFigli();
        toast('Figlio aggiunto con successo', 'success');
        showSection('figli');
      } catch (err) {
        if (msg) { msg.textContent = 'Errore: ' + err.message; msg.style.color = 'var(--color-danger)'; msg.style.display = 'block'; }
      } finally {
        btnSalvaFiglio.disabled = false;
        btnSalvaFiglio.textContent = 'Salva figlio';
      }
    });
  }

  /* ----------------------------------------------------------
     NAVIGAZIONE
     ---------------------------------------------------------- */
  document.querySelectorAll('[data-nav]').forEach(function (el) {
    el.addEventListener('click', function () { showSection(el.dataset.nav); });
  });

  var btnLogout = document.querySelector('[data-logout]');
  if (btnLogout) btnLogout.addEventListener('click', function () {
    dialog('Vuoi uscire?', function() { API.auth.logout(); });
  });

  /* ----------------------------------------------------------
     ISCRIVITI ORA
     ---------------------------------------------------------- */
  window.iscrivitiOra = async function (eventoId, tipo) {
    if (eventoId) {
      var pagina = tipo === 'cardano_day' ? 'iscrizione-cardano.html' : 'iscrizione-openday.html';
      window.location.href = pagina + '?evento=' + eventoId;
      return;
    }
    try {
      var data = await API.events.list();
      var eventi = (data.data || []).filter(function(e){ return e.pubblicato && e.iscrizioni_aperte; });
      if (!eventi.length) { toast('Nessun evento con iscrizioni aperte', 'info'); return; }
      if (eventi.length === 1) {
        var ev = eventi[0];
        var pagina = ev.tipo === 'cardano_day' ? 'iscrizione-cardano.html' : 'iscrizione-openday.html';
        window.location.href = pagina + '?evento=' + ev.id;
      }
    } catch (err) { toast('Errore: ' + err.message, 'error'); }
  };

  /* ----------------------------------------------------------
     CAMBIA PASSWORD
     ---------------------------------------------------------- */
  window.togglePwdField = function(id, btn) {
    var input = document.getElementById(id);
    if (!input) return;
    var show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.textContent = show ? '🙈' : '👁';
  };

  window.cambiaPassword = async function () {
    var attuale  = $('pwd-attuale')  ? $('pwd-attuale').value  : '';
    var nuova    = $('pwd-nuova')    ? $('pwd-nuova').value    : '';
    var conferma = $('pwd-conferma') ? $('pwd-conferma').value : '';
    var msg = $('pwd-msg');
    var btn = $('btn-cambia-pwd');

    function showMsg(testo, tipo) {
      if (!msg) return;
      msg.textContent = testo;
      msg.style.display = 'block';
      msg.style.background = tipo === 'ok' ? 'rgba(22,163,74,.1)' : 'rgba(220,38,38,.1)';
      msg.style.color = tipo === 'ok' ? 'var(--color-success)' : 'var(--color-danger)';
      msg.style.border = tipo === 'ok' ? '1px solid rgba(22,163,74,.3)' : '1px solid rgba(220,38,38,.3)';
    }

    if (!attuale || !nuova || !conferma) { showMsg('Compila tutti i campi', 'err'); return; }
    if (nuova.length < 8) { showMsg('La nuova password deve avere almeno 8 caratteri', 'err'); return; }
    if (nuova !== conferma) { showMsg('Le password non coincidono', 'err'); return; }

    if (btn) { btn.disabled = true; btn.textContent = 'Aggiornamento...'; }
    try {
      // Prima verifica login con password attuale, poi aggiorna
      await API.auth.login(utente.email, attuale);
      await API.auth.resetPassword('__direct__', nuova); // endpoint dedicato
      // Fallback: usa reset_password con token temporaneo generato dal server
      // Per ora usiamo una chiamata diretta al backend
      var res = await fetch('/api/auth.php?action=change_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + API.token.get() },
        body: JSON.stringify({ password_attuale: attuale, nuova_password: nuova })
      });
      var data = await res.json();
      if (!data.success) throw new Error(data.error || 'Errore');
      showMsg('Password aggiornata con successo!', 'ok');
      if ($('pwd-attuale'))  $('pwd-attuale').value  = '';
      if ($('pwd-nuova'))    $('pwd-nuova').value    = '';
      if ($('pwd-conferma')) $('pwd-conferma').value = '';
      toast('Password aggiornata', 'success');
    } catch (err) {
      showMsg(err.message === 'Credenziali non valide' ? 'Password attuale non corretta' : 'Errore: ' + err.message, 'err');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Aggiorna password'; }
    }
  };

  /* ----------------------------------------------------------
     INIT
     ---------------------------------------------------------- */
  caricaEventi();
  caricaIscrizioni();
  caricaFigli();
  showSection('dashboard');

})();
