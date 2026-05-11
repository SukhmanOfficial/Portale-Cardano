# 15 — Flusso Completo — Dalla Registrazione all'Uscita

> **Tipo documento:** Guida utente + Tecnico  
> **Sezione PDF:** §15

---

## Panoramica

Questo documento descrive il flusso end-to-end del sistema, dalla registrazione del genitore alla registrazione dell'uscita il giorno dell'evento.

---

## Flusso completo

| # | Fase | Chi | Descrizione |
|---|------|-----|-------------|
| 1 | **Registrazione** | Genitore | Si registra con nome, email, password, indirizzo e cellulare → verifica email con OTP |
| 2 | **Login** | Genitore | Accede con email/password → riceve JWT (7 giorni) |
| 3 | **Inserimento figlio** | Genitore | Aggiunge nome, scuola e città scuola del figlio |
| 4 | **Apertura iscrizioni** | Sistema | Abilita automaticamente le iscrizioni alla data impostata |
| 5 | **Scelta evento** | Genitore | Seleziona Open Day o Cardano Day dalla home |
| 6 | **Scelta laboratori** | Genitore | Sceglie 1 o 2 laboratori (Cardano Day) — gli orari li assegna il sistema |
| 7 | **Iscrizione** | Sistema | Registra, genera QR code (Node.js), invia email con PDF allegato |
| 8 | **Chiusura iscrizioni** | Sistema | Blocca automaticamente le iscrizioni alla data impostata |
| 9 | **Dividi per gruppi** | Segreteria | Avvia script Node.js: assegna turni, aule, gruppi bilanciati |
| 10 | **Giorno evento** | — | — |
| 11 | **Firma 1 — Entrata** | Staff/Prof | Scansiona QR all'ingresso → verifica e registra entrata |
| 12 | **Firma 2 — Lab T1** | Staff/Prof | Seleziona lab → scansiona → verifica assegnazione corretta |
| 13 | **Firma 3 — Lab T2** | Staff/Prof | Seleziona lab → scansiona → verifica assegnazione corretta |
| 14 | **Firma 4 — Uscita** | Staff/Prof | Scansiona QR all'uscita → registra uscita |
| 15 | **Report** | Segreteria | Visualizza statistiche presenze e scarica Excel con colonne selezionate |

---

## Diagramma flusso per ruolo

### Genitore
```
Registrazione → Verifica OTP → Login → Aggiungi figlio
    → Scegli evento → Scegli laboratori → Conferma iscrizione
    → Ricevi email con QR PDF
    → [Giorno evento] → Mostra QR allo staff
```

### Sistema (automatico)
```
Apertura iscrizioni (data impostata) → Accetta iscrizioni
    → Genera QR code → Invia email
    → Chiusura iscrizioni (data impostata) → Blocca nuove iscrizioni
```

### Segreteria
```
Configura evento → Imposta finestra iscrizioni
    → Visualizza iscritti → Dividi per gruppi
    → [Opzionale] Sposta studenti manualmente
    → [Giorno evento] Monitora presenze in tempo reale
    → Scarica report Excel
    → [Post evento] Cancella dati personali (§16)
```

### Staff / Professore
```
Login → [Giorno evento]
    → Firma 1: scansiona QR entrata
    → Seleziona laboratorio/aula → Firma 2: scansiona QR Lab T1
    → Seleziona laboratorio/aula → Firma 3: scansiona QR Lab T2
    → Firma 4: scansiona QR uscita
```

---

## Automazioni del sistema

| Automazione | Trigger | Azione |
|-------------|---------|--------|
| Apertura iscrizioni | Data/ora `apertura_iscrizioni` | Abilita pulsante "Iscriviti" |
| Chiusura iscrizioni | Data/ora `chiusura_iscrizioni` | Disabilita iscrizioni |
| Email conferma | Iscrizione confermata | Invia email con QR PDF allegato |
| Email divisione | Segreteria conferma divisione gruppi | Invia email aggiornata con gruppo/turni |
| Email spostamento | Segreteria sposta studente | Invia nuova email con QR aggiornato |
| Blocco anti-riscrittura | Firma 1 registrata | Impedisce iscrizione a evento stesso tipo futuro |

---

## Punti chiave del sistema

> **Finestra di iscrizione automatica** — La segreteria imposta le date una sola volta. Il sistema apre e chiude le iscrizioni senza intervento manuale.

> **QR code crittograficamente sicuro** — Generato da Node.js con `crypto.randomBytes()`. Il genitore riceve il PDF allegato nell'email di conferma.

> **Bilanciamento automatico** — Lo script Node.js distribuisce gli studenti nelle aule in modo ottimale, tenendo conto della scuola di provenienza per la distribuzione geografica.

> **Tracciabilità completa** — Le 4 firme QR garantiscono il monitoraggio di entrata, laboratori e uscita. In caso di studente nel laboratorio sbagliato, il sistema indica immediatamente dove deve andare.

> **Export flessibile** — La selezione colonne nell'export Excel permette di ottenere esattamente i dati necessari, dalla stampa dei badge al monitoraggio completo delle presenze.
