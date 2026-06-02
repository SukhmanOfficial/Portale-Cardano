# 02 — Tecnologie e Architettura

## Stack tecnologico

| Tecnologia | Versione | Ruolo nel sistema |
|------------|----------|-------------------|
| **HTML5** | — | Struttura di tutte le pagine web (semantica moderna) |
| **CSS3** | — | Layout responsive, animazioni (Flexbox + Grid, mobile-first) |
| **JavaScript** | Vanilla ES6+ | Interattività, chiamate API REST, gestione scanner QR (`fetch()`, no jQuery) |
| **PHP** | 8+ | Backend REST API, logica server, invio email (PDO, `password_hash`, JWT) |
| **MySQL** | 8+ | Database relazionale, persistenza dati (foreign key, transazioni) |
| **Node.js** | LTS | Algoritmo bilanciamento gruppi, generazione QR code, statistiche |

> 💡 Node.js viene eseguito **dal server come script a riga di comando** richiamato da PHP (via CLI) nel momento in cui la segreteria clicca "Dividi per gruppi". Non è un server Node.js standalone.

---

## Architettura generale

```
┌──────────────────────────────────────────────┐
│               CLIENT (Browser)               │
│   HTML5 + CSS3 + Vanilla JavaScript          │
│   fetch() → JSON → REST API                  │
└───────────────────┬──────────────────────────┘
                    │ HTTPS / REST
┌───────────────────▼──────────────────────────┐
│             BACKEND (PHP 8+)                 │
│   /api/* → endpoint REST                     │
│   JWT (HS256) · PDO · bcrypt                 │
│   Invio email (SMTP)                         │
│   Chiama Node.js via CLI per:                │
│     - Divisione gruppi                       │
│     - Generazione QR code                   │
│     - Statistiche                            │
└───────┬───────────────────┬──────────────────┘
        │                   │
┌───────▼───────┐   ┌───────▼───────┐
│  MySQL 8+     │   │  Node.js      │
│  Database     │   │  Script CLI   │
│  relazionale  │   │  QR · Gruppi  │
└───────────────┘   └───────────────┘
```

---

## Struttura delle pagine

### Area pubblica (Genitore)

| Pagina | URL | Accesso |
|--------|-----|---------|
| Home page | `/` | Tutti |
| Login genitore | `/login` | Tutti |
| Registrazione genitore | `/registrazione` | Tutti |
| Area personale genitore | `/area-personale` | Genitore autenticato |
| QR Code | `/area-personale/qr` | Genitore autenticato |
| Iscrizione evento | `/iscrizione` | Genitore autenticato |
| I miei figli | `/area-personale/figli` | Genitore autenticato |

### Area personale scolastico (Staff / Segreteria / Admin)

| Pagina | URL | Accesso |
|--------|-----|---------|
| Login personale | `/accesso-personale` | URL non pubblico |
| Registrazione Staff/Prof | `/accesso-personale/registrazione` | URL non pubblico |
| Pannello Staff | `/staff` | Staff / Professore |
| Scanner QR | `/staff/scanner` | Staff / Professore |
| Elenco studenti | `/staff/studenti` | Staff / Professore |
| Pannello Segreteria | `/segreteria` | Segreteria |
| Gestione eventi | `/segreteria/eventi` | Segreteria |
| Divisione gruppi | `/segreteria/gruppi` | Segreteria |
| Gestione utenti | `/segreteria/utenti` | Segreteria |
| Pannello Admin | `/admin` | Admin |

---

## Comunicazione Frontend ↔ Backend

Tutte le chiamate avvengono via `fetch()` in formato JSON.

```javascript
// Esempio chiamata autenticata
const response = await fetch('/api/registrations/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}`
  },
  body: JSON.stringify({ id_figlio: 3, id_evento: 1, id_percorso: 2 })
});
const data = await response.json();
```

### Token JWT

Ogni richiesta protetta include il token nell'header `Authorization: Bearer <token>`.

```json
// Payload JWT (esempio)
{
  "id": 7,
  "email": "mario.rossi@email.it",
  "ruolo": "genitore",
  "nome": "Mario",
  "cognome": "Rossi",
  "exp": 1764000000
}
```

> ⚠️ Il token JWT **non contiene la password**. Se il ruolo viene modificato, l'utente deve rieffettuare il login per ottenere un token aggiornato.

---

## Ruolo di Node.js

Node.js viene invocato da PHP come processo esterno in 3 scenari:

| Scenario | Quando | Output |
|----------|--------|--------|
| **Divisione gruppi** | Segreteria clicca "Dividi per gruppi" | Assegnazioni salvate su DB |
| **Generazione QR code** | Dopo conferma iscrizione | File QR PNG + codice hex 32 char |
| **Statistiche** | Dashboard segreteria | Dati aggregati JSON |

```php
// Esempio invocazione PHP → Node.js
$output = shell_exec("node /scripts/dividi_gruppi.js --evento=24");
$result = json_decode($output, true);
```

Il QR code viene generato con `crypto.randomBytes(16).toString('hex')` — crittograficamente sicuro.

---

## Compatibilità e responsività

- **Mobile-first**: CSS costruito partendo dal mobile, con breakpoint per tablet e desktop
- **Breakpoint principali**: 480px (mobile), 768px (tablet), 1200px (desktop)
- **Scanner QR**: funziona via fotocamera su dispositivi mobili (browser moderni)
- **Nessun framework CSS**: CSS3 puro con Flexbox e Grid

---

*Sezione precedente: [01 — Overview](../01_overview/01_overview.md) | Successiva: [03 — Autenticazione](../03_autenticazione/03_autenticazione.md)*
