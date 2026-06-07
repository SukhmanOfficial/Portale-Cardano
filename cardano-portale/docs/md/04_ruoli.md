# 04 — Ruoli del Sistema

Il sistema prevede **4 ruoli distinti**. Staff e Professore hanno esattamente gli stessi permessi e sono trattati come un unico ruolo a livello di sistema.

---

## Panoramica ruoli

| Ruolo | Come si ottiene | URL di accesso |
|-------|----------------|----------------|
| **Genitore** | Registrazione autonoma dalla home page | Home page pubblica |
| **Staff = Professore** | Registrazione da URL separato + approvazione segreteria | URL separato |
| **Segreteria** | Assegnazione manuale dall'Admin | URL separato |
| **Admin** | Configurazione iniziale del sistema | URL separato |

---

## Matrice dei permessi

| Funzionalità | Genitore | Staff/Prof | Segreteria | Admin |
|-------------|:--------:|:----------:|:----------:|:-----:|
| Vedere home page pubblica | ✅ | ✅ | ✅ | ✅ |
| Registrarsi autonomamente | ✅ | — | — | — |
| Effettuare iscrizioni | ✅ | ❌ | ❌ | ❌ |
| Gestire i propri figli | ✅ | — | — | — |
| Scaricare QR code | ✅ | — | — | — |
| Annullare iscrizioni | ✅ | — | — | — |
| Scansionare QR code | ❌ | ✅ | — | — |
| Registrare firme (4 fasi) | ❌ | ✅ | — | — |
| Visualizzare elenco studenti | ❌ | ✅ (sola lettura) | ✅ | ✅ (sola lettura) |
| Creare/modificare eventi | ❌ | ❌ | ✅ | ❌ |
| Approvare Staff/Professori | ❌ | ❌ | ✅ | ❌ |
| Eliminare utenti | ❌ | ❌ | ✅ | ❌ |
| Eseguire divisione gruppi | ❌ | ❌ | ✅ | ❌ |
| Esportare Excel | ❌ | ❌ | ✅ | ❌ |
| Inviare email/notifiche | ❌ | ❌ | ✅ | ❌ |
| Visualizzare statistiche | ❌ | ❌ | ✅ | ✅ (sola lettura) |
| Assegnare ruolo Segreteria | ❌ | ❌ | ❌ | ✅ |
| Revocare ruolo Segreteria | ❌ | ❌ | ❌ | ✅ |
| Assegnare ruolo Admin | ❌ | ❌ | ❌ | ❌ |

---

## 4.1 — Genitore

**Come si registra**: Dalla home page pubblica, tramite il pulsante "Registrati". Ruolo assegnato automaticamente dopo verifica OTP.

**Cosa può fare**:
- Inserire e gestire i profili dei propri figli
- Iscrivere i figli agli eventi disponibili nel periodo aperto
- Scegliere il percorso (Open Day) o i laboratori (Cardano Day)
- Scaricare e stampare i QR code
- Annullare un'iscrizione entro la data di chiusura
- Visualizzare l'elenco delle iscrizioni attive e lo storico
- Vedere i codici aula assegnati (dopo divisione gruppi)

**Cosa NON può fare**:
- Iscriversi autonomamente (deve farlo come genitore per il figlio)
- Effettuare iscrizioni per figli di altri genitori
- Iscrivere un figlio due volte allo stesso evento
- Iscriversi dopo la chiusura delle iscrizioni
- Accedere all'area del personale

---

## 4.2 — Staff / Professore

**Come si registra**: Dall'URL separato con email `@itiscardanopv.edu.it`. Richiede approvazione della segreteria.

> Staff e Professore hanno **esattamente gli stessi permessi**. La distinzione è solo nominale.

**Cosa può fare**:
- Accedere al pannello Staff tramite URL riservato
- Scansionare i QR code degli studenti (fotocamera o inserimento manuale)
- Registrare le 4 firme durante la giornata evento
- Selezionare il laboratorio/aula corrente prima della scansione
- Visualizzare l'elenco studenti con aule assegnate (sola lettura)
- Filtrare studenti per laboratorio, codice aula, percorso, gruppo

**Cosa NON può fare**:
- Effettuare iscrizioni
- Modificare assegnazioni di gruppi o aule
- Accedere al pannello segreteria o admin
- Approvare nuovi utenti

---

## 4.3 — Segreteria

**Come si ottiene**: Assegnato dall'Admin promuovendo un utente Staff/Professore esistente.

**Cosa può fare** — gestione completa del sistema:
- Creare, modificare ed eliminare eventi
- Configurare laboratori, turni e numero di aule per ogni evento
- Approvare o rifiutare richieste di registrazione Staff/Professori
- Modificare il ruolo di qualsiasi utente (eccetto Admin)
- Eliminare utenti Genitore, Staff, Professori
- Eseguire la divisione automatica in gruppi (script Node.js)
- Visualizzare anteprima gruppi e spostare studenti manualmente
- Esportare iscrizioni in formato Excel (.xlsx)
- Inviare email o notifiche agli iscritti
- Visualizzare tutte le statistiche e presenze
- Gestire l'elenco delle scuole medie (aggiunta singola o import CSV)

**Cosa NON può fare**:
- Assegnare o revocare il ruolo Admin
- Effettuare iscrizioni come genitore

---

## 4.4 — Admin

**Come si ottiene**: Configurazione iniziale del sistema. Non esiste una procedura di auto-registrazione per il ruolo Admin. L'Admin **non può assegnare il ruolo Admin ad altri**.

**Cosa può fare**:
- Visualizzare tutti gli utenti (sola lettura)
- Visualizzare tutti gli eventi (sola lettura)
- Visualizzare tutte le iscrizioni (sola lettura)
- Visualizzare le statistiche della dashboard
- **Assegnare** il ruolo Segreteria a utenti Staff/Professore esistenti
- **Revocare** il ruolo Segreteria (l'utente torna a Staff/Professore)

**Cosa NON può fare** (tutto il resto è riservato alla Segreteria):
- Creare/modificare/eliminare eventi
- Approvare richieste Staff/Professore
- Eliminare utenti
- Eseguire divisione gruppi
- Esportare file Excel
- Effettuare iscrizioni

---

## 4.5 — Controllo ruolo su ogni endpoint

Ogni endpoint API verifica il ruolo dell'utente tramite il token JWT prima di eseguire qualsiasi operazione.

```
Richiesta API ricevuta
        ↓
Estrazione token JWT dall'header Authorization
        ↓
Verifica firma e scadenza token
        ↓
Lettura ruolo dal payload JWT
        ↓
Confronto ruolo con permessi richiesti dall'endpoint
        ↓
Se autorizzato → esegue l'operazione
Se non autorizzato → 403 Forbidden
```

---

*Sezione precedente: [03 — Autenticazione](../03_autenticazione/03_autenticazione.md) | Successiva: [05 — Genitore](../05_genitore/05_genitore.md)*
