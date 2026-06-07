/**
 * config.js — Configurazione globale Sistema Cardano Day
 * ITIS "G. Cardano" — Pavia
 */

/* ----------------------------------------------------------
   CALCOLO AUTOMATICO ANNO SCOLASTICO
   ---------------------------------------------------------- */

function _getAnnoScolastico() {
  // 1. Controlla override da segreteria/admin
  try {
    const override = localStorage.getItem('cardano_anno_override');
    if (override && /^\d{4}[\u2013-]\d{2}$/.test(override)) {
      return override;
    }
  } catch (e) { /* localStorage non disponibile */ }

  // 2. Calcolo automatico
  // - Set→Dic: anno corrente / anno+1 (es. 2026–27)
  // - Gen→Ago: anno-1 / anno corrente (es. 2026–27)
  const oggi = new Date();
  const anno = oggi.getFullYear();
  const mese = oggi.getMonth() + 1;
  if (mese >= 9) {
    return anno + '\u2013' + String(anno + 1).slice(2);
  } else {
    return (anno - 1) + '\u2013' + String(anno).slice(2);
  }
}

/* ----------------------------------------------------------
   CONFIGURAZIONE GLOBALE
   ---------------------------------------------------------- */

const CONFIG = {

  get anno_scolastico() { return _getAnnoScolastico(); },

  /* Statistiche hero — modificabili qui */
  stats: {
    eventi:     '4',
    laboratori: '5',
    posti:      '300+',
  },

  istituto: {
    nome:       'ITIS "G. Cardano"',
    nome_lungo: 'ITIS "G. Cardano" \u2014 Pavia',
    citta:      'Pavia',
    logo:       'assets/logo.jpg',
    indirizzo:  'Via Verdi 19, 27100 Pavia (PV)',
    sito:       'https://www.itiscardanopv.edu.it',
    email:      'info@itiscardanopv.edu.it',
  },

  ui: {
    navbar_sub:  'Pavia \u00b7 Sistema Iscrizioni',
    footer_desc: 'Sistema di gestione iscrizioni Open Day e Cardano Day per le famiglie degli studenti delle scuole medie della provincia di Pavia.',
    footer_copy: '\u00a9 {anno_corr} ITIS "G. Cardano", Pavia. Tutti i diritti riservati.',
    version:     'Sistema Cardano Day v1.0',
    auth_sub:    'Sistema Iscrizioni {anno}',
  },

};

/* ----------------------------------------------------------
   HELPER
   ---------------------------------------------------------- */

CONFIG.text = function (key) {
  const val = key.split('.').reduce(function (o, k) { return o && o[k]; }, CONFIG);
  if (typeof val !== 'string') return '';
  return val
    .replace(/\{anno\}/g, CONFIG.anno_scolastico)
    .replace(/\{anno_corr\}/g, new Date().getFullYear());
};

/* ----------------------------------------------------------
   API PUBBLICA — segreteria/admin
   ---------------------------------------------------------- */

CONFIG.setAnnoOverride = function (anno) {
  try {
    if (!anno) {
      localStorage.removeItem('cardano_anno_override');
    } else {
      localStorage.setItem('cardano_anno_override', anno);
    }
    CONFIG._applyAll();
  } catch (e) {
    console.warn('[CONFIG] localStorage non disponibile');
  }
};

CONFIG.hasOverride = function () {
  try { return !!localStorage.getItem('cardano_anno_override'); }
  catch (e) { return false; }
};

CONFIG.getAnno = function () { return CONFIG.anno_scolastico; };

/* ----------------------------------------------------------
   INIT
   ---------------------------------------------------------- */

CONFIG._applyAll = function () {
  document.querySelectorAll('[data-config]').forEach(function (el) {
    const key = el.dataset.config;
    const val = CONFIG.text(key);
    if (val) el.innerHTML = val;
  });
};

document.addEventListener('DOMContentLoaded', function () {
  // Anno scolastico gestito solo da localStorage (impostato dall'admin)
  CONFIG._applyAll();
  console.log(
    '[CONFIG] Anno scolastico:', CONFIG.anno_scolastico,
    CONFIG.hasOverride() ? '(override manuale)' : '(automatico)'
  );
});
