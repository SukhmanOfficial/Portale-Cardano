# 06 — Struttura e Configurazione Eventi

## 6.1 — Tipi di Evento

Il sistema gestisce due tipologie di evento distinte:

| Tipo | Descrizione | Scelta genitore | Gruppi |
|------|-------------|----------------|--------|
| **Open Day** | Giornata di orientamento generale | 1 percorso tra 3 | M1, L2, T3... |
| **Cardano Day** | Giornata con visita ai laboratori | 1 o 2 laboratori | I1, C2, M1... |

---

## 6.2 — Campi Configurabili (Segreteria)

Ogni evento viene creato e configurato dalla segreteria tramite il pannello dedicato.

| Campo | Tipo | Obbligatorio | Note |
|-------|------|:------------:|------|
| Tipo evento | Selezione | ✅ | Open Day oppure Cardano Day |
| Titolo | Testo | ✅ | Visibile nella pagina pubblica |
| Descrizione | Testo lungo | — | Visibile nella pagina pubblica |
| Data dell'evento | Data | ✅ | Giorno in cui si svolge |
| Posti massimi totali | Numero | ✅ | Capienza massima accettabile |
| Apertura iscrizioni | Data + ora | ✅ | Il sistema apre automaticamente |
| Chiusura iscrizioni | Data + ora | ✅ | Il sistema chiude automaticamente |
| Pubblicato | Sì / No | ✅ | No = bozza, non visibile al pubblico |

### Solo per Cardano Day

| Campo | Tipo | Note |
|-------|------|------|
| Inizio turno 1 | Ora | Default 8:30 |
| Fine turno 1 | Ora | Default 10:30 |
| Inizio turno 2 | Ora | Default 11:00 |
| Fine turno 2 | Ora | Default 13:00 |
| Laboratori | Lista configurabile | Per ogni lab: nome, turni, numero aule, posti per aula |

---

## 6.3 — Ciclo di Vita di un Evento

```
BOZZA
  │   (segreteria crea evento, non pubblicato)
  ▼
PUBBLICATO — ISCRIZIONI NON ANCORA APERTE
  │   (evento visibile, iscrizioni non ancora disponibili)
  ▼
PUBBLICATO — ISCRIZIONI APERTE
  │   (sistema abilita automaticamente le iscrizioni alla data impostata)
  ▼
PUBBLICATO — ISCRIZIONI CHIUSE
  │   (sistema blocca automaticamente le iscrizioni alla data impostata)
  ▼
DIVISIONE GRUPPI
  │   (segreteria esegue lo script Node.js di bilanciamento)
  ▼
EVENTO IN CORSO
  │   (staff scansiona QR e registra le 4 firme)
  ▼
EVENTO CONCLUSO
      (report e statistiche disponibili)
```

---

## 6.4 — Calendario 2026–2027

| Tipo | Data evento | Apertura iscrizioni | Chiusura iscrizioni | Posti |
|------|-------------|---------------------|---------------------|-------|
| Open Day | 18 nov 2026 | 1 nov 2026 ore 8:00 | 10 nov 2026 ore 23:59 | 120 |
| Cardano Day | 24 nov 2026 | 1 nov 2026 ore 8:00 | 16 nov 2026 ore 23:59 | 300 |
| Open Day | 18 dic 2026 | 1 dic 2026 ore 8:00 | 10 dic 2026 ore 23:59 | 120 |
| Cardano Day | 13 gen 2027 | 15 dic 2026 ore 8:00 | 5 gen 2027 ore 23:59 | 300 |

---

## 6.5 — Visibilità nella Home Page

La home page mostra gli eventi pubblicati con le seguenti informazioni:

**Visibile a tutti (inclusi Staff, Professori, Segreteria)**:
- Data e titolo dell'evento
- Tipo: Open Day oppure Cardano Day
- Numero di posti ancora disponibili
- Data e ora di apertura e chiusura iscrizioni
- Per l'Open Day: i 3 percorsi con i posti rimasti
- Per il Cardano Day: badge dei laboratori disponibili

**Visibile solo al Genitore autenticato**:
- Pulsante "Iscriviti ora" (solo se iscrizioni aperte)

**Staff, Professori e Segreteria** vedono la home in modalità sola lettura, senza possibilità di effettuare iscrizioni.

---

## 6.6 — Open Day — Percorsi

Per ogni Open Day la segreteria configura 3 percorsi con posti separati:

| Percorso | Descrizione | Posti (esempio) |
|----------|-------------|:--------------:|
| **Misto** | Visita laboratori tecnici + aule scientifiche | 60 |
| **Liceo Sc. Appl.** | Scienze applicate, matematica avanzata, fisica | 60 |
| **Tecnico** | Informatica, Elettronica, Meccanica, Chimica | 60 |

I percorsi esauriti vengono mostrati come "Esaurito" e non sono selezionabili.

Il gruppo esatto (es. M1, L2, T3) viene comunicato dal sistema **dopo la divisione in gruppi** tramite email con QR code aggiornato.

---

## 6.7 — Gestione dalla Segreteria

La segreteria può in qualsiasi momento:

| Azione | Note |
|--------|------|
| Creare un nuovo evento | Con anteprima pubblica in tempo reale |
| Modificare un evento esistente | Anche dopo la pubblicazione |
| Eliminare un evento | Solo se senza iscrizioni confermate |
| Cambiare stato pubblicazione | Bozza ↔ Pubblicato |
| Eseguire divisione gruppi | Lancia script Node.js |
| Rieseguire la divisione | Sovrascrive la precedente |
| Esportare iscrizioni | File Excel .xlsx |

---

*Sezione precedente: [05 — Genitore](../05_genitore/05_genitore.md) | Successiva: [07 — Laboratori](../07_laboratori/07_laboratori.md)*
