# 12 — API REST

## 12.1 — Panoramica

Il backend PHP espone endpoint REST. Il frontend comunica via `fetch()` in JSON.  
Ogni richiesta protetta include il token JWT nell'header `Authorization: Bearer <token>`.

### Convenzione URL

```
Base URL: /api/
Formato:  /api/<risorsa>/?action=<azione>&id=<id>
Metodi:   GET · POST · PUT · DELETE
Risposta: JSON
```

### Codici HTTP utilizzati

| Codice | Significato |
|--------|-------------|
| `200` | Successo |
| `201` | Risorsa creata |
| `400` | Dati non validi |
| `401` | Non autenticato (token mancante o scaduto) |
| `403` | Non autorizzato (ruolo insufficiente) |
| `404` | Risorsa non trovata |
| `409` | Conflitto (es. email già registrata) |
| `500` | Errore interno del server |

---

## 12.2 — Endpoint Autenticazione

| Endpoint | Metodo | Accesso | Descrizione |
|----------|--------|---------|-------------|
| `/api/auth/?action=register` | POST | Pubblico | Registrazione genitore |
| `/api/auth/?action=register_personale` | POST | URL separato | Registrazione Staff/Professore (richiede email @itiscardanopv.edu.it) |
| `/api/auth/?action=login` | POST | Pubblico / URL separato | Login → JWT 7 giorni |
| `/api/auth/?action=verify` | POST | Pubblico | Verifica OTP email |
| `/api/auth/?action=forgot` | POST | Pubblico | Richiesta reset password via email |
| `/api/auth/?action=reset` | POST | Pubblico | Reset password con codice temporaneo |

### Esempi

**POST /api/auth/?action=register**
```json
// Request body
{
  "nome": "Mario",
  "cognome": "Rossi",
  "email": "mario.rossi@email.it",
  "password": "Password123!",
  "via_civico": "Via Roma, 14",
  "cap": "27100",
  "citta": "Pavia",
  "cellulare": "+39 345 678 9012"
}

// Response 201
{
  "success": true,
  "message": "Account creato. Verifica la tua email con il codice OTP.",
  "user_id": 42
}
```

**POST /api/auth/?action=login**
```json
// Request body
{
  "email": "mario.rossi@email.it",
  "password": "Password123!"
}

// Response 200
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 42,
    "nome": "Mario",
    "cognome": "Rossi",
    "ruolo": "genitore"
  }
}
```

---

## 12.3 — Endpoint Eventi

| Endpoint | Metodo | Accesso | Descrizione |
|----------|--------|---------|-------------|
| `/api/events/` | GET | Pubblico | Lista eventi con stato iscrizioni |
| `/api/events/` | POST | Segreteria | Crea nuovo evento |
| `/api/events/?id=N` | PUT | Segreteria | Modifica evento esistente |
| `/api/events/?id=N` | DELETE | Segreteria | Elimina evento |

### Esempio GET /api/events/

```json
// Response 200
{
  "events": [
    {
      "id": 1,
      "tipo": "open_day",
      "titolo": "Open Day — Novembre 2026",
      "data_evento": "2026-11-18",
      "posti_max": 120,
      "posti_disponibili": 87,
      "apertura_iscrizioni": "2026-11-01T08:00:00",
      "chiusura_iscrizioni": "2026-11-10T23:59:00",
      "stato": "aperte",
      "pubblicato": true,
      "percorsi": [
        { "nome": "Misto", "posti": 60, "disponibili": 28 },
        { "nome": "Liceo Sc. Appl.", "posti": 60, "disponibili": 35 },
        { "nome": "Tecnico", "posti": 60, "disponibili": 24 }
      ]
    }
  ]
}
```

---

## 12.4 — Endpoint Utenti

| Endpoint | Metodo | Accesso | Descrizione |
|----------|--------|---------|-------------|
| `/api/users/?action=list` | GET | Seg. / Admin | Lista tutti gli utenti |
| `/api/users/?id=N` | DELETE | Segreteria | Elimina utente (genitore/staff/prof) |
| `/api/users/?action=approva&id=N` | PUT | Segreteria | Approva/rifiuta richiesta ruolo |
| `/api/users/?action=ruolo&id=N` | PUT | Segreteria | Modifica ruolo utente |

---

## 12.5 — Endpoint Admin

| Endpoint | Metodo | Accesso | Descrizione |
|----------|--------|---------|-------------|
| `/api/admin/?action=set_segreteria` | PUT | Admin | Assegna/revoca ruolo Segreteria |
| `/api/admin/?action=dashboard` | GET | Admin | Dashboard in sola lettura |

---

## 12.6 — Endpoint Iscrizioni

| Endpoint | Metodo | Accesso | Descrizione |
|----------|--------|---------|-------------|
| `/api/registrations/` | GET | Genitore | Lista iscrizioni del genitore autenticato |
| `/api/registrations/` | POST | Genitore | Crea iscrizione + genera QR + invia email |
| `/api/registrations/?id=N` | DELETE | Genitore | Annulla iscrizione (se entro chiusura) |
| `/api/registrations/?action=dividi&ev=N` | POST | Segreteria | Esegue script Node.js bilanciamento |
| `/api/registrations/?action=export&ev=N` | GET | Segreteria | Export Excel .xlsx iscrizioni |

### Esempio POST /api/registrations/

```json
// Request body — Open Day
{
  "id_figlio": 3,
  "id_evento": 1,
  "id_percorso": 2
}

// Request body — Cardano Day
{
  "id_figlio": 3,
  "id_evento": 2,
  "laboratori": ["E", "C"]
}

// Response 201
{
  "success": true,
  "iscrizione_id": 88,
  "qr_code": "a3f8c2d1e6b4927f3c8e5a1b9d7f4e2c",
  "message": "Iscrizione confermata. QR code inviato via email."
}
```

---

## 12.7 — Endpoint QR Code

| Endpoint | Metodo | Accesso | Descrizione |
|----------|--------|---------|-------------|
| `/api/qr/?action=scan` | POST | Staff / Prof. | Scansiona QR — registra firma 1/2/3/4 |
| `/api/qr/?action=download&id=N` | GET | Genitore | Scarica QR code (PNG o PDF) |

### Esempio POST /api/qr/?action=scan

```json
// Request body
{
  "qr_codice": "a3f8c2d1e6b4927f3c8e5a1b9d7f4e2c",
  "firma": 2,
  "laboratorio": "E",
  "aula": "E1"
}

// Response 200 — QR Valido
{
  "success": true,
  "firma": 2,
  "studente": {
    "nome": "Laura",
    "cognome": "Abbiati",
    "scuola": "SC. Media Manzoni",
    "citta": "Pavia"
  },
  "assegnazione": {
    "lab_t1": "E1",
    "lab_t2": "C2",
    "orario_t1": "8:30–10:30",
    "orario_t2": "11:00–13:00"
  },
  "lab_corretto": true,
  "timestamp": "2026-11-24T08:34:15"
}

// Response 200 — Lab Errato
{
  "success": false,
  "errore": "laboratorio_errato",
  "studente": { ... },
  "messaggio": "Deve andare in: Meccanica — Aula M1",
  "lab_corretto": "M1"
}
```

---

## 12.8 — Endpoint Figli

| Endpoint | Metodo | Accesso | Descrizione |
|----------|--------|---------|-------------|
| `/api/children/` | GET | Genitore | Lista figli del genitore autenticato |
| `/api/children/` | POST | Genitore | Aggiunge nuovo figlio |
| `/api/children/?id=N` | PUT | Genitore | Modifica figlio (se senza iscrizioni attive) |
| `/api/children/?id=N` | DELETE | Genitore | Elimina figlio (se senza iscrizioni attive) |

---

## 12.9 — Endpoint Scuole

| Endpoint | Metodo | Accesso | Descrizione |
|----------|--------|---------|-------------|
| `/api/schools/?q=<testo>` | GET | Genitore | Ricerca scuole (min. 3 caratteri) |
| `/api/schools/` | POST | Segreteria | Aggiunge scuola singola |
| `/api/schools/import` | POST | Segreteria | Import CSV scuole |

---

## 12.10 — Endpoint Assegnazioni (Staff)

| Endpoint | Metodo | Accesso | Descrizione |
|----------|--------|---------|-------------|
| `/api/assignments/?event=N` | GET | Staff / Prof. | Elenco studenti con aule (Cardano Day) o gruppi (Open Day) |
| `/api/assignments/?event=N&lab=E&aula=E1` | GET | Staff / Prof. | Filtro per laboratorio e aula |

---

*Sezione precedente: [11 — Admin](../11_admin/11_admin.md) | Successiva: [13 — Database](../13_database/13_database.md)*
