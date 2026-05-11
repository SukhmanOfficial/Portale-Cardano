# 13 — Architettura REST API

> **Tipo documento:** Tecnico (sviluppatori)  
> **Sezione PDF:** §13

---

## Panoramica

Il backend PHP espone endpoint REST. Il frontend comunica tramite `fetch()` in JSON. Ogni richiesta protetta richiede il token JWT nell'header `Authorization`.

```
Authorization: Bearer <token_jwt>
```

---

## Autenticazione

| Endpoint | Metodo | Accesso | Descrizione |
|----------|--------|---------|-------------|
| `/api/auth/?action=register` | `POST` | Pubblico | Registrazione genitore (con indirizzo e cellulare) |
| `/api/auth/?action=register-staff` | `POST` | Nascosto | Richiesta ruolo staff/professore |
| `/api/auth/?action=login` | `POST` | Pubblico | Login → risposta con token JWT |
| `/api/auth/?action=verify` | `POST` | Pubblico | Verifica OTP email |
| `/api/auth/?action=forgot` | `POST` | Pubblico | Reset password via email |

---

## Scuole e Comuni (autocomplete)

| Endpoint | Metodo | Accesso | Descrizione |
|----------|--------|---------|-------------|
| `/api/schools/?q=<nome>` | `GET` | Pubblico | Ricerca scuole medie — autocomplete |
| `/api/comuni/?q=<testo>` | `GET` | Pubblico | Ricerca comuni italiani — autocomplete indirizzo |

---

## Eventi

| Endpoint | Metodo | Accesso | Descrizione |
|----------|--------|---------|-------------|
| `/api/events/` | `GET` | Pubblico | Lista eventi con stato iscrizioni |
| `/api/events/?id=N` | `GET` | Pubblico | Dettaglio evento + turni + laboratori |
| `/api/events/` | `POST` | Segreteria | Crea evento con finestra iscrizioni |
| `/api/events/?id=N` | `PUT` | Segreteria | Modifica evento |
| `/api/events/?id=N` | `DELETE` | Segreteria | Elimina evento |

---

## Utenti e figli

| Endpoint | Metodo | Accesso | Descrizione |
|----------|--------|---------|-------------|
| `/api/users/?action=figli` | `GET` | Genitore | Lista figli con tutti i dati |
| `/api/users/?action=figli` | `POST` | Genitore | Aggiungi figlio (nome, scuola, città) |
| `/api/users/?action=list` | `GET` | Segreteria | Lista tutti gli utenti |
| `/api/users/?action=approva&id=N` | `PUT` | Segreteria | Approva/rifiuta richiesta ruolo |

---

## Iscrizioni

| Endpoint | Metodo | Accesso | Descrizione |
|----------|--------|---------|-------------|
| `/api/registrations/` | `POST` | Genitore | Crea iscrizione + invio email + QR |
| `/api/registrations/?id=N` | `DELETE` | Genitore | Annulla iscrizione |
| `/api/registrations/?action=dividi&ev=N` | `POST` | Segreteria | Esegue script Node.js bilanciamento |
| `/api/registrations/?action=export&ev=N` | `GET` | Segreteria | Export Excel .xlsx (colonne selezionabili) |

---

## QR Code e Firme

| Endpoint | Metodo | Accesso | Descrizione |
|----------|--------|---------|-------------|
| `/api/qr/?action=scan` | `POST` | Staff/Prof | Scansiona QR — registra firma 1/2/3/4 |
| `/api/qr/?action=select_lab` | `POST` | Staff/Prof | Seleziona laboratorio/aula attivo |

---

## Formato risposta standard

### Successo
```json
{
  "success": true,
  "data": { ... }
}
```

### Errore
```json
{
  "success": false,
  "error": "Descrizione errore"
}
```

---

## Codici HTTP utilizzati

| Codice | Significato |
|--------|-------------|
| `200` | OK |
| `201` | Risorsa creata |
| `400` | Bad Request — dati mancanti o non validi |
| `401` | Unauthorized — token JWT mancante o scaduto |
| `403` | Forbidden — ruolo non autorizzato |
| `404` | Not Found |
| `409` | Conflict — es. email già registrata, figlio già iscritto |
| `500` | Internal Server Error |

---

## Note per gli sviluppatori

- Il frontend non usa jQuery: solo **Vanilla JS** con `fetch()`
- Tutti gli endpoint protetti verificano il ruolo tramite **RBAC** lato PHP
- Le query usano **PDO prepared statements** — nessun rischio SQL injection
- Header **CORS** configurati per accettare solo origini autorizzate
- In caso di `401` il frontend reindirizza automaticamente alla pagina di login
