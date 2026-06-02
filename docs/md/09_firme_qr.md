# 09 — Sistema di Firme QR — Le 4 Fasi (solo Cardano Day)

## 9.1 — Panoramica

Il QR code viene scansionato dallo staff in **4 momenti distinti** durante la giornata. Ogni scansione registra data e ora nel database e fa avanzare lo stato dell'iscrizione.

| Firma | Nome | Quando | Chi | Dove |
|-------|------|--------|-----|------|
| **F1** | Entrata | Arrivo 8:00–8:30 | Staff entrata | Ingresso principale |
| **F2** | Lab Turno 1 | Inizio turno 1 (8:30) | Staff/Prof. | Porta laboratorio |
| **F3** | Lab Turno 2 | Inizio turno 2 (11:00) | Staff/Prof. | Porta laboratorio |
| **F4** | Uscita | Fine giornata (13:00) | Staff uscita | Ingresso principale |

> ℹ️ Se lo studente ha scelto **un solo laboratorio**, la firma F3 non è richiesta e il sistema lo comunica chiaramente.

---

## 9.2 — Flusso di Scansione

```
Staff seleziona il laboratorio/aula corrente (es. Elettronica E1)
            ↓
Staff inquadra il QR code con la fotocamera
            ↓
Sistema decodifica il codice hex
            ↓
Ricerca nel database → iscrizione trovata
            ↓
Verifica della firma corrente
            ↓
┌─────────────────────────────────────────────────┐
│                  RISULTATI                      │
├─────────────────────┬───────────────────────────┤
│ ✅ QR VALIDO        │ ❌ LABORATORIO ERRATO      │
│ Firma registrata    │ Studente nel lab sbagliato │
├─────────────────────┼───────────────────────────┤
│ ⚠️ FIRMA PRECEDENTE │ ❌ QR NON VALIDO           │
│ MANCANTE            │ Codice non trovato         │
└─────────────────────┴───────────────────────────┘
```

---

## 9.3 — Dettaglio per ogni Firma

### Firma 1 — Entrata

**Chi**: Staff all'ingresso principale  
**Verifica**: QR valido + iscrizione confermata  
**Cosa mostra il sistema se OK**:
- Nome e scuola dello studente
- Laboratori assegnati (es. E1 · 8:30–10:30 e C2 · 11:00–13:00)
- Stato firme aggiornato

### Firma 2 — Lab Turno 1

**Chi**: Staff/Professore alla porta del laboratorio  
**Verifica**: Lab corretto + codice aula corrispondente (I1, C2...)  

**Messaggi possibili**:
| Situazione | Messaggio |
|-----------|-----------|
| ✅ Studente nel lab corretto | "Firma 2 registrata alle 8:34 — Studente nel laboratorio corretto" |
| ❌ Lab sbagliato | "Laboratorio errato! Deve andare in: Meccanica — Aula M1 · Turno 1: 8:30–10:30 · Non in: Elettronica E1 (questo laboratorio)" |
| ⚠️ Firma 1 mancante | "La firma 1 (entrata) non risulta registrata per questo studente. Potrebbe aver saltato il controllo all'ingresso." → opzione "Registra comunque Firma 2" |

### Firma 3 — Lab Turno 2

**Chi**: Staff/Professore alla porta del laboratorio (secondo turno)  
**Verifica**: Lab corretto + firma 2 presente  
**Nota**: Se lo studente ha scelto un solo laboratorio, F3 non è richiesta → messaggio informativo

### Firma 4 — Uscita

**Chi**: Staff all'uscita  
**Verifica**: Registra uscita + segnala anomalie  
**Nota**: Se mancano firme precedenti, il sistema le segnala ma registra comunque l'uscita

---

## 9.4 — Interfaccia Scanner Staff

### Elementi dell'interfaccia scanner

```
┌─────────────────────────────────────┐
│  SCANNER QR — Firma 2 · Lab T1      │
│  Evento: Cardano Day 24 Nov 2026     │
│  Laboratorio: Elettronica — Aula E1  │
├─────────────────────────────────────┤
│                                     │
│   ┌─────────────────────┐           │
│   │   [FOTOCAMERA]      │           │
│   │   Scanner attivo    │           │
│   └─────────────────────┘           │
│                                     │
│  Oppure inserisci manualmente:      │
│  [________________] [VERIFICA]      │
└─────────────────────────────────────┘
```

### Sidebar — Fasi correnti

```
✅ Firma 1 — Entrata    (completata 8:00–8:30)
▶  Firma 2 — Lab T1    (ATTIVA 8:30–10:30)
   Firma 3 — Lab T2    (11:00–13:00)
   Firma 4 — Uscita    (fine giornata)

Laboratorio: Elettronica — Aula E1 [dropdown]
```

---

## 9.5 — Elenco Studenti (Vista Staff)

Sotto lo scanner, lo staff vede l'elenco degli studenti del proprio laboratorio:

| Studente | Scuola | Lab T1 | Lab T2 | F1 | F2 | F3 | F4 |
|---------|--------|:------:|:------:|:--:|:--:|:--:|:--:|
| Abbiati Laura | Manzoni · Pavia | E1 | C2 | ✅ | ✅ | — | — |
| Barocelli Luca | Pascoli · Voghera | E1 | C2 | ✅ | ✅ | — | — |
| Bigi C.J. Corrado | Volta · Pavia | E1 | M2 | — | ⚠️ | — | — |
| Bosincianu Matei | Mazzini · Vigevano | E1 | I2 | ✅ | — | — | — |
| Colombo Sara | De Amicis · Pavia | E1 | — | ✅ | ✅ | — | — |

Legenda: ✅ Registrata · ⚠️ Anomalia · — Non ancora

---

## 9.6 — Gestione Anomalie

### Tipi di anomalia

| Anomalia | Descrizione | Azione staff |
|---------|-------------|-------------|
| Laboratorio errato | Studente nel lab sbagliato | "Informa lo studente" → indica dove deve andare |
| Firma precedente mancante | Firma 1 non registrata | Opzione "Registra comunque" + segnala alla segreteria |
| QR non valido | Codice non trovato nel DB | Verifica manuale con la segreteria |
| Studente assente | Nessuna firma registrata | Visibile nell'elenco studenti come assente |

### Segnalazione anomalie

Lo staff può segnalare un'anomalia alla segreteria direttamente dall'interfaccia. La segreteria vede le anomalie nel proprio pannello con timestamp e dettaglio.

---

## 9.7 — Versione Mobile (Scanner)

Lo scanner QR è ottimizzato per dispositivi mobili con interfaccia semplificata:

- Fotocamera a schermo intero con mirino orange
- Risultato scansione mostrato in overlay
- Progressione fasi visibile in alto
- Pulsante "Prossimo studente" per continuare rapidamente
- Pulsante "Segnala problema" sempre accessibile
- Tab bar: Scanner · Studenti · Riepilogo · Impostazioni

---

## 9.8 — Dati Registrati per ogni Firma

Ogni firma salva nel database:

| Campo | Tipo | Esempio |
|-------|------|---------|
| `firma_entrata` | DATETIME | 2026-11-24 08:07:32 |
| `firma_lab1` | DATETIME | 2026-11-24 08:34:15 |
| `firma_lab2` | DATETIME | NULL (non ancora) |
| `firma_uscita` | DATETIME | NULL (non ancora) |

---

*Sezione precedente: [08 — Divisione Gruppi](../08_gruppi/08_gruppi.md) | Successiva: [10 — Segreteria](../10_segreteria/10_segreteria.md)*
