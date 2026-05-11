# 05 — Ruoli del Sistema

> **Tipo documento:** Tecnico + Guida utente  
> **Sezione PDF:** §5

---

## Panoramica ruoli

Il sistema prevede **tre ruoli distinti**. Staff e Professore sono un unico ruolo con permessi identici.

| Ruolo | Come si ottiene | Permessi principali |
|-------|-----------------|---------------------|
| **Genitore** | Registrazione autonoma (pagina pubblica) | Iscrivere figli, gestire iscrizioni, scaricare QR |
| **Staff = Professore** | Pagina nascosta + approvazione segreteria | Scansionare QR, selezionare lab, registrare le 4 firme |
| **Segreteria** | Assegnazione manuale dall'amministratore | Accesso completo: eventi, utenti, statistiche, divisione gruppi |

---

## Genitore

### Cosa può fare
- Registrarsi autonomamente dalla pagina pubblica
- Aggiungere e gestire i propri figli
- Iscrivere i figli agli eventi disponibili
- Scegliere percorso (Open Day) o laboratori (Cardano Day)
- Scaricare/visualizzare il QR code dell'iscrizione
- Annullare un'iscrizione entro la chiusura
- Consultare lo storico iscrizioni

### Cosa NON può fare
- Accedere al pannello segreteria
- Scansionare QR per registrare presenze
- Vedere i dati degli altri utenti

---

## Staff / Professore

> **Staff e Professore hanno ESATTAMENTE gli stessi permessi.** L'etichetta è solo descrittiva — non esiste nessuna differenza funzionale.

### Cosa può fare
- Selezionare il laboratorio/aula attivo dall'app
- Scansionare QR code degli studenti
- Registrare le 4 firme di presenza (Entrata, Lab T1, Lab T2, Uscita)
- Visualizzare i dati dello studente alla scansione (nome, gruppo, laboratorio assegnato)

### Cosa NON può fare
- Accedere al pannello segreteria
- Creare o modificare eventi
- Vedere l'elenco completo degli iscritti
- Eseguire la divisione gruppi

---

## Segreteria

### Cosa può fare
- Creare, modificare ed eliminare eventi
- Configurare turni, laboratori, posti e finestre di iscrizione
- Visualizzare tutte le iscrizioni
- Eseguire la divisione automatica dei gruppi (script Node.js)
- Spostare manualmente studenti tra gruppi
- Approvare o rifiutare richieste ruolo Staff/Professore
- Assegnare o modificare manualmente il ruolo di qualsiasi utente
- Esportare dati in Excel (.xlsx)
- Inviare email/notifiche agli iscritti
- Cancellare i dati personali post-evento (§16)

### Cosa NON può fare
- Scansionare QR (funzione riservata a Staff/Professore tramite app dedicata)

---

## Valore ENUM nel database

```sql
ruolo ENUM('genitore', 'staff_professore', 'segreteria')
```

Il valore `staff_professore` è unico per entrambe le etichette Staff e Professore.

---

## Schema permessi per endpoint

| Endpoint | Genitore | Staff/Prof | Segreteria |
|----------|----------|------------|------------|
| `GET /api/events/` | ✅ | ✅ | ✅ |
| `POST /api/registrations/` | ✅ | ❌ | ❌ |
| `POST /api/qr/?action=scan` | ❌ | ✅ | ❌ |
| `POST /api/registrations/?action=dividi` | ❌ | ❌ | ✅ |
| `GET /api/users/?action=list` | ❌ | ❌ | ✅ |
| `GET /api/registrations/?action=export` | ❌ | ❌ | ✅ |
