# 05 — Funzionalità Genitore

## 5.1 — Gestione Figli

Prima di poter effettuare qualsiasi iscrizione, il genitore deve inserire i dati di ogni figlio. I dati vengono salvati una volta sola e riutilizzati per tutte le iscrizioni future.

### Campi richiesti per ogni figlio

| Campo | Obbligatorio | Note |
|-------|:------------:|------|
| Nome | ✅ | |
| Cognome | ✅ | |
| Scuola media di provenienza | ✅ | Ricerca tramite API interna (min. 3 caratteri) |
| Città / Comune della scuola | ✅ | Compilato automaticamente se selezionata da lista |

### Ricerca scuola media

```
1. Genitore digita almeno 3 caratteri del nome della scuola
2. Frontend chiama /api/schools/?q=<testo>
3. Dropdown mostra risultati: nome istituto, comune, provincia
4. Genitore seleziona la scuola → nome e città compilati automaticamente
5. Se la scuola non è presente → "Inserisci manualmente" (campo libero)
```

La segreteria gestisce l'elenco scuole dal pannello: aggiunta singola oppure import da file CSV (nome, comune, provincia).

### Regole modifica dati figlio

- I dati **possono essere modificati** finché il figlio non ha iscrizioni attive
- Con iscrizioni attive: modifica **limitata** (solo alcuni campi)
- Il genitore può aggiungere più figli con dati diversi
- Il genitore può eliminare un figlio solo se non ha iscrizioni attive

---

## 5.2 — Iscrizione a un Evento

### Flusso iscrizione Open Day

```
Step 1 — Evento
   └── Seleziona Open Day disponibile

Step 2 — Figlio e percorso
   ├── Seleziona il figlio da iscrivere
   └── Scegli 1 percorso tra:
       ├── Percorso Misto
       ├── Liceo Sc. Appl.
       └── Percorso Tecnico (se disponibile)

Step 3 — Riepilogo
   └── Conferma i dati inseriti

Step 4 — QR Code
   └── QR generato e inviato via email
```

### Flusso iscrizione Cardano Day

```
Step 1 — Evento
   └── Seleziona Cardano Day disponibile

Step 2 — Figlio e laboratori
   ├── Seleziona il figlio da iscrivere
   └── Scegli 1 o 2 laboratori (max 1 per turno):
       ├── Turno 1 (8:30–10:30): Informatica / Elettronica / Meccanica / Chimica / Liceo Sc.Appl.
       └── Turno 2 (11:00–13:00): idem, uno diverso dal T1 (opzionale)

Step 3 — Riepilogo
   └── Conferma i dati inseriti

Step 4 — QR Code
   └── QR generato e inviato via email
```

> ℹ️ Gli orari esatti e i codici aula (es. I1, C2) vengono assegnati automaticamente dalla segreteria **dopo la chiusura delle iscrizioni**. Il genitore riceverà una email con il QR code aggiornato.

---

## 5.3 — Blocchi automatici del sistema

Il sistema impedisce automaticamente le seguenti situazioni:

| Situazione | Blocco |
|-----------|--------|
| Iscrizione prima dell'apertura | ❌ Bloccata |
| Iscrizione dopo la chiusura | ❌ Bloccata |
| Posti totali esauriti | ❌ Bloccata |
| Stesso figlio iscritto due volte allo stesso evento | ❌ Bloccata |
| Percorso Open Day con posti esauriti | ❌ Bloccata |
| Laboratorio Cardano Day con tutte le aule piene | ❌ Bloccata |
| Figlio già partecipato a evento dello stesso tipo | ❌ Bloccata |

---

## 5.4 — Area Personale Genitore

### Dashboard

| Elemento | Descrizione |
|---------|-------------|
| Figli registrati | Numero totale di figli nel profilo |
| Iscrizioni attive | Iscrizioni confermate non ancora svolte |
| Eventi disponibili | Numero eventi con iscrizioni aperte |
| QR pronti | Numero QR code scaricabili |
| Banner evento prossimo | Evidenziazione del prossimo evento aperto con CTA iscrizione |

### Sezione "I miei figli"

Per ogni figlio registrato:
- Avatar con iniziali
- Nome e scuola di provenienza
- Numero iscrizioni attive
- Pulsante "Iscrivilo" (se evento disponibile)
- Pulsante "Modifica"
- Stato modificabilità (se ha iscrizioni attive, modifica limitata)

### Sezione "Iscrizioni attive"

Per ogni iscrizione:

**Cardano Day:**
| Informazione | Esempio |
|-------------|---------|
| Tipo evento e data | Cardano Day — 24 Novembre 2026 |
| Figlio iscritto | Laura Rossi |
| Data conferma | Iscrizione confermata il 3 nov 2026 |
| Laboratori scelti | Elettronica + Chimica |
| Codice aula T1 | E1 · 8:30–10:30 |
| Codice aula T2 | C2 · 11:00–13:00 |
| Stato firme | Icone visive: ✅ Entrata · ✅ Lab T1 · — Lab T2 · — Uscita |
| QR code | Miniatura con pulsante "Scarica QR" |
| Azione | Pulsante "Annulla iscrizione" |

**Open Day:**
| Informazione | Esempio |
|-------------|---------|
| Tipo evento e data | Open Day — 18 Novembre 2026 |
| Figlio iscritto | Andrea Rossi |
| Percorso scelto | Tecnico |
| Gruppo assegnato | T2 (dopo divisione) |
| Stato firme | Icone visive per le 4 fasi |
| QR code | Miniatura con pulsante "Scarica QR" |

---

## 5.5 — Sezione QR Code

Il genitore può accedere in qualsiasi momento alla pagina "I miei QR Code".

### Per ogni QR code

- **Miniatura** del QR code visiva
- **Codice hex** a 32 caratteri (es. `a3f8c2d1e6b4...`)
- Evento, figlio, data
- Laboratori/percorso e gruppo assegnati
- Stato firme (icone in tempo reale)
- Azioni: **Scarica PNG** · **Scarica PDF** · **Invia email** · **Stampa**

### Banner informativo

> ✅ **QR Code inviati via email!** — I QR code sono stati inviati a mario.rossi@email.it dopo la conferma dell'iscrizione. Puoi anche scaricarli da qui in qualsiasi momento.

### Come usare il QR code il giorno dell'evento

| Firma | Quando | Dove |
|-------|--------|------|
| Firma 1 — Entrata | Arrivo 8:00–8:30 | Ingresso principale |
| Firma 2 — Lab Turno 1 | Inizio turno 1 | Porta del laboratorio assegnato |
| Firma 3 — Lab Turno 2 | Inizio turno 2 | Porta del laboratorio assegnato |
| Firma 4 — Uscita | Fine giornata | Ingresso principale |

---

## 5.6 — Storico

Il genitore può consultare lo storico di tutte le iscrizioni passate (eventi già svolti), con i dati completi di presenze e firme registrate.

---

*Sezione precedente: [04 — Ruoli](../04_ruoli/04_ruoli.md) | Successiva: [06 — Eventi](../06_eventi/06_eventi.md)*
