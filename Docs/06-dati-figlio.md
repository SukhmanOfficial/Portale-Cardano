# 06 — Inserimento Dati del Figlio

> **Tipo documento:** Tecnico + Guida utente  
> **Sezione PDF:** §6  
> **Ruolo:** Genitore

---

## Panoramica

Prima di poter effettuare qualsiasi iscrizione, il genitore deve inserire i dati di ogni figlio. I dati vengono salvati **una sola volta** e riutilizzati per tutte le iscrizioni successive.

> I dati di contatto del genitore (indirizzo e cellulare) sono già stati raccolti durante la registrazione account (§3.1) e **non vengono richiesti di nuovo** in questa fase.

---

## Campi richiesti

| Campo | Descrizione | Obbligatorio |
|-------|-------------|:---:|
| Nome e Cognome | Dati anagrafici dello studente | ✅ |
| Scuola media frequentata | Nome dell'istituto di provenienza | ✅ |
| Città / Comune scuola | Compilato automaticamente se la scuola è selezionata dalla lista | ✅ |

---

## Regole

- Il genitore può aggiungere **più figli** con dati diversi
- I dati del figlio possono essere **modificati** finché non ha iscrizioni attive
- I dati sono visibili alla segreteria nei report e nelle statistiche

---

## 6.1 — Selezione Scuola Media tramite API Interna

Quando il genitore digita il nome della scuola media, il sistema interroga un'**API interna** con l'elenco delle scuole gestito dall'istituto.

### Flusso autocomplete

| Fase | Descrizione |
|------|-------------|
| 1 — Digitazione | Il genitore inizia a scrivere (minimo **3 caratteri**) |
| 2 — Ricerca | Il frontend chiama `GET /api/schools/?q=testo` |
| 3 — Dropdown | Appare la lista con: nome istituto, comune, provincia |
| 4 — Selezione | Il genitore clicca: nome e città vengono compilati automaticamente |
| 5 — Fallback manuale | Se la scuola non è presente, il genitore può scrivere liberamente |

### Endpoint
```
GET /api/schools/?q=<testo>
```

### Gestione elenco scuole (segreteria)
- Aggiunta singola scuola dal pannello admin
- Import massivo tramite file **CSV** (nome, comune, provincia)

---

## 6.2 — Autocompletamento Indirizzo di Residenza

Durante la **registrazione del genitore** (non in questa fase), il campo indirizzo è assistito da un'API interna con l'elenco dei comuni italiani.

### Flusso autocomplete indirizzo

| Fase | Descrizione |
|------|-------------|
| 1 — Digitazione | Il genitore inizia a digitare il comune (minimo **3 caratteri**) |
| 2 — Ricerca | Il frontend chiama `GET /api/comuni/?q=testo` |
| 3 — Dropdown | Appare la lista con: comune e provincia |
| 4 — Selezione | Il genitore seleziona: il campo **CAP viene compilato automaticamente** |
| 5 — Via manuale | Il campo via/numero civico viene sempre inserito manualmente |
| 6 — Fallback | Se il comune non è trovato, tutti i campi si inseriscono manualmente |

### Struttura tabella comuni (DB)

```sql
nome_comune  VARCHAR   -- es. Pavia
provincia    VARCHAR   -- sigla es. PV
cap          VARCHAR   -- CAP o lista separata da virgola
regione      VARCHAR   -- es. Lombardia
```

---

## Tabella figli (DB)

```sql
figli
├── id              INT PK
├── nome            VARCHAR
├── cognome         VARCHAR
├── scuola_media    VARCHAR
├── citta_scuola    VARCHAR
└── id_genitore     INT FK → utenti
```

---

## Endpoint correlati

```
GET  /api/users/?action=figli   → Lista figli del genitore autenticato
POST /api/users/?action=figli   → Aggiungi figlio (nome, scuola, città)
GET  /api/schools/?q=<testo>    → Autocomplete scuole medie
GET  /api/comuni/?q=<testo>     → Autocomplete comuni italiani
```
