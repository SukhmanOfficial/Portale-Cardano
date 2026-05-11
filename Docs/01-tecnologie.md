# 01 — Tecnologie Utilizzate

> **Tipo documento:** Tecnico (sviluppatori)  
> **Sezione PDF:** §1

---

## Stack tecnologico

Il sistema è sviluppato con tecnologie standard del web, senza dipendenze da framework pesanti, per garantire la massima compatibilità con il server scolastico.

| Tecnologia | Ruolo nel sistema | Note |
|------------|-------------------|------|
| **HTML5** | Struttura di tutte le pagine web | Semantica moderna |
| **CSS3** | Grafica, layout responsive, animazioni | Flexbox + Grid, mobile-first |
| **JavaScript** | Interattività, chiamate REST API, gestione QR scanner | Vanilla JS, `fetch()`, no jQuery |
| **PHP 8+** | Backend REST API, logica server, invio email | PDO, `password_hash`, JWT |
| **MySQL 8+** | Database relazionale, persistenza dati | Foreign key, transazioni |
| **Node.js** | Algoritmo bilanciamento gruppi, generazione QR code, statistiche | Script richiamato da PHP via CLI |

---

## Ruolo di Node.js

Node.js **non è un server sempre attivo**: viene eseguito dal server come script a riga di comando, richiamato da PHP tramite `exec()` o `shell_exec()` nei seguenti casi:

- Quando la segreteria clicca **"Dividi per gruppi"** → algoritmo di bilanciamento
- Alla conferma dell'iscrizione → **generazione QR code** (`crypto.randomBytes()`)
- Visualizzazione statistiche avanzate nel pannello segreteria

---

## Architettura generale

```
Browser (PC / Tablet / Smartphone)
        │
        │  fetch() JSON
        ▼
PHP REST API  ←──── MySQL 8+
        │
        │  exec() CLI
        ▼
    Node.js scripts
    (bilanciamento, QR, statistiche)
```

- Frontend **responsive mobile-first**: funziona su PC, tablet e smartphone.
- Comunicazione **REST + JSON**: nessun page reload, tutto tramite `fetch()`.
- **Nessun framework frontend** (no React, no Vue): Vanilla JS puro.
- **Nessun ORM**: query MySQL tramite PDO con prepared statements.

---

## Requisiti server

- PHP **8.0+** con estensioni: `pdo_mysql`, `openssl`, `mbstring`, `json`
- MySQL **8.0+**
- Node.js **18+** (LTS) installato e accessibile via CLI dal processo PHP
- Server mail SMTP configurato per l'invio email (conferme, OTP, QR PDF)
