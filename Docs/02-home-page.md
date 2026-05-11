# 02 — Home Page — Pagina Pubblica

> **Tipo documento:** Tecnico + Guida utente  
> **Sezione PDF:** §2  
> **Accesso:** Pubblico (nessuna autenticazione richiesta)

---

## Descrizione

La pagina principale è accessibile a tutti senza autenticazione. Mostra l'elenco degli eventi pubblicati con tutte le informazioni necessarie per l'iscrizione.

> Gli eventi vengono mostrati **solo nel periodo di apertura iscrizioni** definito dalla segreteria.

---

## Informazioni mostrate per ogni evento

- Data e titolo dell'evento
- Tipo: **Open Day** oppure **Cardano Day**
- Numero di **posti ancora disponibili**
- Data e ora di **apertura iscrizioni** (prima di questa data il pulsante non è attivo)
- Data e ora di **chiusura iscrizioni**
- Per l'**Open Day**: i 3 percorsi disponibili con i posti rimasti per ciascuno
- Pulsante **"Iscriviti"** → porta al login se non autenticato

---

## Esempi eventi pubblicati

| Tipo | Data evento | Apertura iscrizioni | Chiusura iscrizioni |
|------|-------------|---------------------|---------------------|
| Open Day | 18 nov 2026 | 1 nov 2026 ore 8:00 | 10 nov 2026 ore 23:59 |
| Cardano Day | 24 nov 2026 | 1 nov 2026 ore 8:00 | 16 nov 2026 ore 23:59 |
| Open Day | 18 dic 2026 | 1 dic 2026 ore 8:00 | 10 dic 2026 ore 23:59 |
| Cardano Day | 13 gen 2027 | 15 dic 2026 ore 8:00 | 5 gen 2027 ore 23:59 |

---

## Comportamento del pulsante "Iscriviti"

| Stato | Comportamento |
|-------|--------------|
| Iscrizioni non ancora aperte | Pulsante disabilitato — mostra data di apertura |
| Iscrizioni aperte | Pulsante attivo → reindirizza al login (se non autenticato) |
| Iscrizioni chiuse | Pulsante disabilitato — mostra "Iscrizioni chiuse" |
| Posti esauriti | Pulsante disabilitato — mostra "Posti esauriti" |

---

## Endpoint correlato

```
GET /api/events/
```

Restituisce la lista degli eventi pubblicati con stato iscrizioni, posti disponibili e percorsi (Open Day).

---

## Note per gli sviluppatori

- La pagina **non richiede token JWT**.
- Il campo `pubblicato = 1` nella tabella `eventi` determina la visibilità.
- I posti disponibili vengono aggiornati in tempo reale ad ogni iscrizione confermata.
- La finestra di iscrizione è gestita automaticamente dal backend confrontando `apertura_iscrizioni` e `chiusura_iscrizioni` con il timestamp corrente.
