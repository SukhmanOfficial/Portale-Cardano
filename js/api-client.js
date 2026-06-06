/**
 * api-client.js — Client API centralizzato
 * Sistema Cardano Day · ITIS "G. Cardano", Pavia
 * Compatibile con InfinityFree (token via query string)
 */

(function (window) {
  'use strict';

  var BASE = '/api';

  /* TOKEN STORE */
  var TokenStore = {
    get:     function () { try { return localStorage.getItem('cardano_jwt'); } catch(e){ return null; } },
    set:     function (t) { try { localStorage.setItem('cardano_jwt', t); } catch(e){} },
    remove:  function () { try { localStorage.removeItem('cardano_jwt'); } catch(e){} },
    getUser: function () { try { var r = localStorage.getItem('cardano_user'); return r ? JSON.parse(r) : null; } catch(e){ return null; } },
    setUser: function (u) { try { localStorage.setItem('cardano_user', JSON.stringify(u)); } catch(e){} },
    clear:   function () { TokenStore.remove(); try { localStorage.removeItem('cardano_user'); } catch(e){} },
  };

  /* FETCH WRAPPER — token via header E query string (InfinityFree fix) */
  async function request(endpoint, options) {
    options = options || {};
    var token = TokenStore.get();

    var headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    if (token) headers['Authorization'] = 'Bearer ' + token;

    var url = BASE + endpoint;

    var res;
    try {
      res = await fetch(url, Object.assign({}, options, { headers: headers }));
    } catch (e) {
      throw new Error('Errore di rete — controlla la connessione');
    }

    if (options._raw) return res;

    var data;
    try { data = await res.json(); } catch(e) { data = {}; }

    if (!res.ok || data.success === false) {
      var msg = data.error || ('Errore ' + res.status);
      if (res.status === 401) {
        TokenStore.clear();
        window.location.href = 'login.html';
      }
      throw new Error(msg);
    }

    return data;
  }

  function get(endpoint, params) {
    var url = endpoint;
    if (params) {
      var q = Object.keys(params)
        .filter(function(k){ return params[k] !== null && params[k] !== undefined && params[k] !== ''; })
        .map(function(k){ return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); })
        .join('&');
      if (q) url += (url.indexOf('?') >= 0 ? '&' : '?') + q;
    }
    return request(url, { method: 'GET' });
  }

  function post(endpoint, body) {
    return request(endpoint, { method: 'POST', body: JSON.stringify(body || {}) });
  }

  function requireLogin(ruoliPermessi) {
    var user = TokenStore.getUser();
    if (!user || !TokenStore.get()) {
      window.location.href = 'login.html';
      return null;
    }
    if (ruoliPermessi && !ruoliPermessi.includes(user.ruolo)) {
      alert('Accesso non autorizzato per il ruolo: ' + user.ruolo);
      window.location.href = 'index.html';
      return null;
    }
    return user;
  }

  var API = {
    auth: {
      login: async function (email, password) {
        var data = await post('/auth.php?action=login', { email: email, password: password });
        TokenStore.set(data.token);
        TokenStore.setUser(data.user);
        return data;
      },
      register: async function (dati) { return post('/auth.php?action=register', dati); },
      registerPersonale: async function (dati) { return post('/auth.php?action=register_personale', dati); },
      verificaOtp: async function (email, otp) {
        var data = await post('/auth.php?action=verifica_otp', { email: email, otp: otp });
        if (data.token) { TokenStore.set(data.token); TokenStore.setUser(data.user); }
        return data;
      },
      resendOtp:    function (email) { return post('/auth.php?action=resend_otp', { email: email }); },
      resetRequest: function (email) { return post('/auth.php?action=reset_request', { email: email }); },
      resetPassword: function (token, nuova_password) { return post('/auth.php?action=reset_password', { token: token, nuova_password: nuova_password }); },
      me: function () { return get('/auth.php?action=me'); },
      logout: function () { TokenStore.clear(); window.location.href = 'login.html'; },
      getUser:    function () { return TokenStore.getUser(); },
      isLoggedIn: function () { return !!TokenStore.get(); },
      requireLogin: requireLogin,
    },

    events: {
      list: function (soloPublicati) { return get('/events.php?action=list' + (soloPublicati === false ? '&tutti=1' : '')); },
      get:  function (id) { return get('/events.php?action=get&id=' + id); },
      create: function (dati) { return post('/events.php?action=create', dati); },
      update: function (id, dati) { return post('/events.php?action=update&id=' + id, dati); },
      delete: function (id) { return post('/events.php?action=delete&id=' + id); },
      togglePub: function (id) { return post('/events.php?action=toggle_pub&id=' + id); },
    },

    registrations: {
      create: function (dati) { return post('/registrations.php?action=create', dati); },
      cancel: function (id)  { return post('/registrations.php?action=cancel&id=' + id); },
      list:   function (filtri) { return get('/registrations.php?action=list', filtri); },
      mie:    function () { return get('/registrations.php?action=mie'); },
      dividi: function (id_evento, percorsi) { return post('/registrations.php?action=dividi', { id_evento: id_evento, percorsi: percorsi }); },
      sposta: function (id_iscrizione, nuovo_gruppo) { return post('/registrations.php?action=sposta', { id_iscrizione: id_iscrizione, nuovo_gruppo: nuovo_gruppo }); },
      confermaGruppi: function (id_evento) { return post('/registrations.php?action=conferma_gruppi', { id_evento: id_evento }); },
      getByQr: function (token) { return get('/registrations.php?action=qr&token=' + token); },
    },

    qr: {
      scan:     function (qr_token, numero_firma, laboratorio) { return post('/qr.php?action=scan', { qr_token: qr_token, numero_firma: numero_firma, laboratorio: laboratorio || '' }); },
      status:   function (id) { return get('/qr.php?action=status&id=' + id); },
      presenze: function (id_evento) { return get('/qr.php?action=presenze&id_evento=' + id_evento); },
    },

    users: {
      list:         function (filtri) { return get('/users.php?action=list', filtri); },
      get:          function (id) { return get('/users.php?action=get&id=' + id); },
      approvazioni: function () { return get('/users.php?action=approvazioni'); },
      approva:      function (id) { return post('/users.php?action=approva&id=' + id); },
      rifiuta:      function (id, motivo) { return post('/users.php?action=rifiuta&id=' + id, { motivo: motivo || '' }); },
      setRuolo:     function (id_utente, nuovo_ruolo) { return post('/users.php?action=set_ruolo', { id_utente: id_utente, nuovo_ruolo: nuovo_ruolo }); },
      sospendi:     function (id) { return post('/users.php?action=sospendi&id=' + id); },
      elimina:      function (id) { return post('/users.php?action=elimina&id=' + id); },
      eliminaTutti: function (params) { return post('/users.php?action=elimina_tutti', params || { tipo: 'tutti_genitori' }); },
      figli:        function () { return get('/users.php?action=figli'); },
      addFiglio:    function (dati) { return post('/users.php?action=add_figlio', dati); },
      delFiglio:    function (id) { return post('/users.php?action=del_figlio&id=' + id); },
    },

    schools: {
      list:   function () { return get('/schools.php?action=list'); },
      search: function (q) { return get('/schools.php?action=search&q=' + encodeURIComponent(q)); },
      create: function (dati) { return post('/schools.php?action=create', dati); },
      update: function (id, dati) { return post('/schools.php?action=update&id=' + id, dati); },
      delete: function (id) { return post('/schools.php?action=delete&id=' + id); },
    },

    admin: {
      stats:        function () { return get('/admin.php?action=stats'); },
      setSegreteria: function (id_utente, azione) { return post('/admin.php?action=set_segreteria', { id_utente: id_utente, azione: azione }); },
      log:          function () { return get('/admin.php?action=log'); },
    },

    notifications: {
      send: function (dati) { return post('/notifications.php?action=send', dati); },
      list: function () { return get('/notifications.php?action=list'); },
    },

    token: TokenStore,
  };

  window.API = API;

})(window);
