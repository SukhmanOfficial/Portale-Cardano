# 10 — Pannello Segreteria

## 10.1 — Dashboard Segreteria

La dashboard mostra una panoramica completa del sistema in tempo reale.

### KPI principali

| Metrica | Descrizione |
|---------|-------------|
| Iscrizioni totali | Tutte le iscrizioni per tutti gli eventi |
| Iscrizioni confermate | Numero e percentuale sul totale |
| Presenze registrate | Studenti con almeno Firma 1 (QR scansionato) |
| Utenti attivi | Genitori + Staff totali nel sistema |
| Approvazioni in attesa | Richieste Staff/Professore non ancora processate |

### Sezioni dashboard

- **Gestione eventi** — tabella eventi con stato, iscrizioni, divisione gruppi
- **Approvazioni in attesa** — richieste Staff/Professori da approvare/rifiutare
- **Dividi gruppi** — widget rapido per eseguire la divisione sull'evento selezionato
- **Statistiche laboratori** — occupazione per laboratorio e turno

---

## 10.2 — Gestione Utenti

### Funzionalità disponibili

| Azione | Applicabile a |
|--------|--------------|
| Visualizzare tutti gli utenti | Tutti i ruoli |
| Approvare richiesta di accesso | Staff / Professore in attesa |
| Rifiutare richiesta di accesso | Staff / Professore in attesa |
| Modificare il ruolo | Genitore, Staff, Professore (non Admin) |
| Eliminare un utente | Genitore, Staff, Professore |
| Visualizzare dettaglio utente | Tutti |
| Esportare lista utenti | Tutti |

### Tabella utenti

| Colonna | Descrizione |
|---------|-------------|
| Avatar + Nome | Iniziali colorate + nome completo |
| Email | Indirizzo email |
| Ruolo | Badge colorato (Segreteria / Staff-Prof / Genitore) |
| Stato account | ● Attivo · ● Non verificato · ● Sospeso |
| Iscrizioni | Numero iscrizioni o "—" per Staff/Segreteria |
| Registrato il | Data registrazione |
| Azioni | Modifica ruolo / Dettaglio / Elimina |

### Approvazioni in attesa

Le richieste di accesso Staff/Professore appaiono in evidenza con:
- Nome, ruolo richiesto, email istituzionale
- Data e ora della richiesta
- Pulsanti **✅ Approva** e **✗ Rifiuta**

---

## 10.3 — Gestione Eventi

### Creazione evento

La segreteria crea eventi tramite un form con anteprima pubblica in tempo reale (come apparirà nella home page).

**Campi obbligatori**:

```
Tipo evento:         [Open Day] [Cardano Day]
Titolo:              Cardano Day — Novembre 2026
Data evento:         24/11/2026
Descrizione:         Testo libero...
Posti massimi:       300
Evento pubblicato:   ✓ Sì — visibile al pubblico

Periodo iscrizioni:
  Apertura:          01/11/2026 08:00
  Chiusura:          16/11/2026 23:59

Solo Cardano Day:
  Turno 1:           08:30 → 10:30
  Turno 2:           11:00 → 13:00

Laboratori:
  [Informatica I]    T1: 2 aule × 25 | T2: 1 aula × 25
  [Elettronica E]    T1: 1 aula × 25 | T2: 1 aula × 25
  [Meccanica M]      T1: 1 aula × 25 | T2: 2 aule × 25
  ...
  [+ Aggiungi laboratorio]
```

---

## 10.4 — Divisione Gruppi

Dalla dashboard o dalla pagina eventi, la segreteria può:

1. Selezionare l'evento
2. Verificare il riepilogo iscritti (per percorso o per laboratorio)
3. Decidere il numero di gruppi (Open Day)
4. Cliccare **"Esegui divisione gruppi"** → lancia script Node.js
5. Visualizzare l'anteprima con distribuzione studenti
6. Spostare manualmente studenti se necessario
7. Cliccare **"Conferma e invia email"** → finalizza + invia QR aggiornati

---

## 10.5 — Export Excel (.xlsx)

La segreteria può esportare i dati in qualsiasi momento. Il file contiene fogli distinti:

| # | Foglio | Contenuto |
|---|--------|-----------|
| 1 | Open Day — Tutti i gruppi | Tutti gli iscritti ordinati per gruppo |
| 2 | Open Day — Per singolo gruppo | Un foglio separato per ogni gruppo (M1, L2, T3...) |
| 3 | Cardano Day — Tutti i gruppi | Iscritti con lab, turni, codici aula e firme QR |
| 4 | Cardano Day — Per codice aula | Un foglio per ogni aula (I1, C2, M1...) |
| 5 | Open Day — Per percorso | Un foglio per percorso (Misto, Liceo, Tecnico) |
| 6 | Cardano Day — Per laboratorio | Un foglio per laboratorio con T1 e T2 |

> ℹ️ I fogli per singolo gruppo sono ideali per la **stampa**: ogni accompagnatore riceve il foglio del proprio gruppo.

---

## 10.6 — Invio Email / Notifiche

La segreteria può inviare email o notifiche in-app a gruppi di destinatari:

| Destinatari | Esempio |
|-------------|---------|
| Tutti gli iscritti a un evento | Tutti gli iscritti Open Day 18 Nov |
| Iscritti a un percorso specifico | Solo Percorso Misto |
| Iscritti a un laboratorio specifico | Solo Informatica |
| Utenti con anomalie | Studenti con firme mancanti |

Il form di invio include:
- Selezione destinatari (dropdown)
- Oggetto email
- Corpo messaggio (testo libero)
- Pulsante **"Invia a N destinatari"** o **"Salva bozza"**

---

## 10.7 — Gestione Scuole Medie

La segreteria gestisce l'archivio delle scuole medie usato dall'autocomplete nella registrazione figli:

| Funzione | Descrizione |
|---------|-------------|
| Aggiunta singola | Nome, comune, provincia |
| Import CSV | File con colonne: nome, comune, provincia |
| Ricerca e modifica | Trova e correggi dati scuole esistenti |
| Eliminazione | Rimuove scuole non più attive |

---

## 10.8 — Statistiche Laboratori (Cardano Day)

Per ogni evento Cardano Day, la segreteria vede il riempimento di ogni aula:

```
Statistiche laboratori — Cardano Day 24 Nov

TURNO 1 — 8:30/10:30              TURNO 2 — 11:00/13:00
Informatica (I1, I2)   46/50  ████  Informatica (I2)      22/25  ████
Meccanica (M1)         22/25  ███   Meccanica (M1, M2)    44/50  ████
Elettronica (E1)       18/25  ██    Elettronica (E2)      19/25  ███
Chimica (C1)           20/25  ███   Chimica (C2)          24/25  ████
Liceo Sc. Appl. (L1)   23/25  ███   Liceo Sc. Appl. (L2) 21/25  ███
```

---

*Sezione precedente: [09 — Firme QR](../09_firme_qr/09_firme_qr.md) | Successiva: [11 — Admin](../11_admin/11_admin.md)*
