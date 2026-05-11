# 10 — Funzionalità Segreteria

> **Tipo documento:** Guida utente + Tecnico  
> **Sezione PDF:** §10  
> **Ruolo:** Segreteria

---

## Pannello di amministrazione

La segreteria ha accesso completo al sistema tramite un **pannello admin dedicato**, non accessibile agli altri ruoli.

---

## Creazione e gestione eventi

| Campo | Descrizione |
|-------|-------------|
| Tipo evento | Open Day oppure Cardano Day |
| Titolo e descrizione | Testo visibile nella pagina pubblica |
| Data dell'evento | Giorno in cui si svolge |
| Posti massimi totali | Numero massimo di iscrizioni accettabili |
| Apertura iscrizioni | Data/ora — il sistema apre **automaticamente** |
| Chiusura iscrizioni | Data/ora — il sistema chiude **automaticamente** |
| Turni *(solo Cardano Day)* | Orario inizio/fine turno 1 e turno 2 |
| Laboratori *(solo Cardano Day)* | Nome, turno, numero aule, posti per aula |
| Pubblicato | Sì/No — se No l'evento è in bozza e non visibile |

> La finestra di iscrizione è completamente automatica: la segreteria inserisce apertura e chiusura una sola volta. Il sistema si occupa di abilitare e disabilitare le iscrizioni senza intervento manuale.

---

## Altre funzionalità segreteria

- Modificare o eliminare un evento già creato
- Pubblicare o tornare in bozza un evento
- Visualizzare l'elenco completo delle iscrizioni per ogni evento
- Cliccare **"Dividi per gruppi"** per eseguire lo script Node.js (→ §9)
- Visualizzare l'anteprima dei gruppi prima di confermare
- Spostare o scambiare studenti tra gruppi manualmente (→ §9.1b)
- Approvare o rifiutare richieste di ruolo Staff/Professore
- Assegnare o modificare manualmente il ruolo di qualsiasi utente
- Esportare iscrizioni in formato **Excel (.xlsx)** (→ §10.1)
- Inviare email o notifiche in-app a tutti gli iscritti a un evento
- Cancellare dati personali post-evento in modo sicuro (→ §16)

---

## 10.1 — Export Excel (.xlsx)

La segreteria può scaricare in qualsiasi momento un file Excel con tutti i dati degli iscritti a un evento.

### Selezione colonne personalizzata

Prima dell'export la segreteria seleziona le colonne tramite caselle di spunta:

- Selezione **indipendente** per Open Day e Cardano Day
- **Preset salvabili** con nome (es. "Stampa badge", "Report completo")
- **Anteprima** con riepilogo colonne selezionate e numero righe
- Il file contiene solo le colonne selezionate

### Struttura fogli Excel

| Foglio | Nome | Contenuto |
|--------|------|-----------|
| 1 | Open Day — Tutti i gruppi | Tutti gli iscritti Open Day, ordinati per gruppo |
| 2 | Open Day — Un foglio per gruppo | Un foglio separato per ogni gruppo (M1, M2…) |
| 3 | Cardano Day — Tutti i gruppi | Tutti gli iscritti Cardano Day con lab, turni, aule, firme |
| 4 | Cardano Day — Un foglio per gruppo | Un foglio per ogni gruppo di visita guidata |
| 5 | Open Day — Per percorso | Un foglio per ogni percorso (Misto, Liceo, Tecnico) |
| 6 | Cardano Day — Per laboratorio | Un foglio per ogni laboratorio, turno 1 e turno 2 |

> I fogli **per singolo gruppo** sono ideali per la stampa: ogni accompagnatore riceve il foglio del proprio gruppo.

---

### Colonne selezionabili — Open Day

| ✓ | Colonna | Descrizione |
|:-:|---------|-------------|
| ✅ | Gruppo | Es. M1, L3, T2 |
| ✅ | Cognome | Cognome studente |
| ✅ | Nome | Nome studente |
| ✅ | Scuola media | Istituto di provenienza |
| ✅ | Città scuola | Comune della scuola media |
| ✅ | Percorso | Misto / Liceo / Tecnico |
| ✅ | Nome genitore | Nome e cognome del genitore |
| ✅ | Email genitore | Email del genitore |
| ✅ | Cellulare genitore | Numero di cellulare |
| ✅ | Indirizzo residenza | Via, CAP, comune |
| ⬜ | QR code | Codice hex univoco — uso tecnico |
| ✅ | Stato iscrizione | Confermata / Annullata |
| ✅ | Firma entrata | Timestamp firma 1 |
| ✅ | Firma uscita | Timestamp firma 4 |

### Colonne selezionabili — Cardano Day

| ✓ | Colonna | Descrizione |
|:-:|---------|-------------|
| ✅ | Gruppo visita | Es. E1, C2 |
| ✅ | Cognome | Cognome studente |
| ✅ | Nome | Nome studente |
| ✅ | Scuola media | Istituto di provenienza |
| ✅ | Città scuola | Comune scuola media |
| ✅ | Lab turno 1 | Nome laboratorio turno 1 |
| ✅ | Codice aula T1 | Es. C1, E2 |
| ✅ | Aula turno 1 | Numero aula turno 1 |
| ✅ | Lab turno 2 | Nome laboratorio turno 2 (vuoto se 1 solo lab) |
| ✅ | Codice aula T2 | Es. C2, E2 |
| ✅ | Aula turno 2 | Numero aula turno 2 |
| ✅ | Nome genitore | Nome e cognome |
| ✅ | Email genitore | Email |
| ✅ | Cellulare genitore | Numero di cellulare |
| ✅ | Indirizzo residenza | Via, CAP, comune |
| ⬜ | QR code | Codice hex — uso tecnico |
| ✅ | Stato iscrizione | Confermata / Annullata |
| ✅ | Firma 1 — Entrata | Timestamp entrata scuola |
| ✅ | Firma 2 — Lab T1 | Timestamp ingresso lab turno 1 |
| ✅ | Firma 3 — Lab T2 | Timestamp ingresso lab turno 2 |
| ✅ | Firma 4 — Uscita | Timestamp uscita scuola |

> L'export può essere scaricato **durante l'evento**: le colonne firme si aggiornano in tempo reale.

---

## Endpoint correlati

```
POST   /api/events/                              → Crea evento
PUT    /api/events/?id=N                         → Modifica evento
DELETE /api/events/?id=N                         → Elimina evento
GET    /api/users/?action=list                   → Lista tutti gli utenti
PUT    /api/users/?action=approva&id=N           → Approva/rifiuta richiesta ruolo
GET    /api/registrations/?action=export&ev=N   → Export Excel .xlsx
POST   /api/registrations/?action=dividi&ev=N   → Avvia script Node.js
```
