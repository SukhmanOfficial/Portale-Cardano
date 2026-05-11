# 09 — Divisione Gruppi — Algoritmo di Bilanciamento (Node.js)

> **Tipo documento:** Tecnico  
> **Sezione PDF:** §9  
> **Ruolo:** Segreteria

---

## Panoramica

La divisione dei gruppi viene eseguita dalla segreteria tramite uno **script Node.js** avviato dal backend PHP. L'algoritmo distribuisce gli studenti in modo bilanciato e misto tra i gruppi.

---

## 9.1 — Open Day: divisione per percorso

### Fase 1 — Riepilogo iscritti (prima della divisione)

La segreteria visualizza il riepilogo per percorso prima di avviare la divisione:

| Percorso | Iscritti (esempio) |
|----------|--------------------|
| Percorso Misto (M) | 90 persone |
| Percorso Liceo (L) | 100 persone |
| Percorso Tecnico (T) | 120 persone |
| **Totale evento** | **310 persone** |

### Fase 2 — La segreteria decide il numero di gruppi

| Percorso | Iscritti | Gruppi (esempio) | Media/gruppo |
|----------|----------|------------------|:---:|
| Misto (M) | 90 | 6 | ~15 studenti |
| Liceo (L) | 100 | 5 | ~20 studenti |
| Tecnico (T) | 120 | 8 | ~15 studenti |

> I numeri di gruppi sono scelti dalla segreteria in base ai numeri reali — quelli sopra sono solo esempi.

### Fase 3 — Algoritmo di distribuzione

| Passo | Descrizione |
|-------|-------------|
| 1 | La segreteria inserisce il numero di gruppi per percorso e clicca **"Dividi per gruppi"** |
| 2 | Il sistema filtra gli iscritti per percorso scelto |
| 3 | Ordina gli studenti in modo **misto per scuola di provenienza e città** (distribuzione geografica) |
| 4 | Distribuisce in modo **circolare** tra i gruppi: M1 → M2 → … → M1 → … |
| 5 | Verifica che nessun gruppo abbia troppi studenti (ribilancia automaticamente) |
| 6 | Mostra **anteprima** dei gruppi prima della conferma |
| 7 | Salva le assegnazioni nel database |
| 8 | Invia email con **QR code PDF** a ogni genitore (generato da Node.js) |
| 9 | Aggiorna il sito con il gruppo visibile nell'area personale del genitore |

### Cosa riceve il genitore dopo la divisione Open Day

| Canale | Contenuto |
|--------|-----------|
| **Email** | Nome studente, percorso, gruppo assegnato (es. M3), QR code PDF allegato |
| **Sito web** | Area personale aggiornata con percorso, gruppo e QR scaricabile |

---

## 9.1b — Spostamento Manuale Studenti (Open Day)

Dopo la divisione automatica la segreteria può modificare manualmente le assegnazioni:

| Azione | Descrizione |
|--------|-------------|
| Cerca studente | Cerca per nome nell'elenco del percorso |
| Seleziona | Clicca sullo studente → vede il gruppo attuale |
| Sceglie destinazione | Seleziona il gruppo di destinazione |
| Scambio (opzionale) | Se il gruppo è pieno, può scambiare due studenti tra gruppi diversi |
| Conferma | Il sistema aggiorna il DB e invia nuova email con QR aggiornato |

> Lo spostamento manuale è disponibile anche per il **Cardano Day** (gruppi di visita guidata E1, C2…).

---

## 9.2 — Cardano Day: divisione laboratori e turni

### Laboratori disponibili (esempio)
Informatica · Meccanica · Chimica · Liceo Sc.Appl. · Elettrotecnica

### Algoritmo Cardano Day

| Passo | Descrizione |
|-------|-------------|
| 1 | Raccoglie tutti gli iscritti con i laboratori scelti (1 o 2) |
| 2 | Raggruppa per combinazione (es. tutti Chimica+Elettrotecnica) |
| 3 | Per chi ha **2 lab**: primo → turno 1 (8:30), secondo → turno 2 (11:00), alternando per bilanciare |
| 4 | Per chi ha **1 lab**: assegna al turno con meno iscritti |
| 5 | Se un laboratorio ha più aule: assegna all'**aula con più posti liberi** |
| 6 | Salva nel database |
| 7 | Invia email con QR code e dettagli completi |
| 8 | Aggiorna area personale del genitore |

### Esempio assegnazioni reali

| Cognome | Nome | Lab 1 | Lab 2 | Cod. T1 | Orario T1 | Cod. T2 | Orario T2 |
|---------|------|-------|-------|---------|-----------|---------|-----------|
| Abbiati | Laura | Elettrotecnica | Chimica | E1 | 8:30 | C2 | 11:00 |
| Albanese | Riccardo | Meccanica | Elettrotecnica | M1 | 8:30 | E2 | 11:00 |
| Badino | Riccardo | Liceo Sc.Appl. | — | L1 | 8:30 | — | — |
| Badino | Federico | Liceo Sc.Appl. | — | — | — | L2 | 11:00 |
| Belluscio | Denis | Informatica | — | — | — | I2 | 11:00 |

> **Lettura codice:** `C2` = Chimica, aula 2, turno 2 (11:00)

### Cosa riceve il genitore dopo la divisione Cardano Day

| Canale | Contenuto |
|--------|-----------|
| **Email** | Nome genitore e studente, gruppo, Lab T1 con orario, Lab T2 con orario, QR PDF allegato |
| **Sito web** | Area personale con tutti i dettagli e QR scaricabile |
| **Firma 2/3** | Lo staff vede il laboratorio e l'aula corretti alla scansione QR |

---

## Endpoint correlato

```
POST /api/registrations/?action=dividi&ev=N   → Esegue script Node.js di bilanciamento
```

---

## Regola anti-riscrittura

Un figlio che ha già **partecipato** (firma entrata registrata) a un Open Day non può iscriversi a un successivo Open Day. Stessa regola per il Cardano Day.

- Il blocco scatta solo dopo la partecipazione **effettiva**
- Se l'iscrizione viene **annullata prima dell'evento**, il figlio può reiscriversi
