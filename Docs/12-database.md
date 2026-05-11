# 12 — Database — Struttura delle Tabelle

> **Tipo documento:** Tecnico (sviluppatori)  
> **Sezione PDF:** §12

---

## Panoramica

Database **MySQL 8+** con tabelle normalizzate e chiavi esterne per garantire l'integrità dei dati. Le 4 firme sono memorizzate come timestamp separati nella tabella `iscrizioni`.

---

## Schema completo

```
utenti ──────────────── figli ──────────────────── iscrizioni
  │                       │                              │
  │                       └──── id_genitore              ├── id_figlio
  │                                                      ├── id_evento ──── eventi
  └── (segreteria, staff, genitore)                      ├── id_percorso ── percorsi_open_day
                                                         │
                                             iscrizioni_laboratori
                                                         │
                                                    laboratori
                                                         │
                                                      turni ──── eventi
```

---

## Tabella: `utenti`

Account del sistema — genitori, staff, professori, segreteria.

```sql
id              INT             PK, AUTO_INCREMENT
nome            VARCHAR(100)
cognome         VARCHAR(100)
email           VARCHAR(255)    UNIQUE — usato per login
password        VARCHAR(255)    hash bcrypt, mai in chiaro
indirizzo       VARCHAR(500)    via, numero civico, CAP, città del genitore
cellulare       VARCHAR(20)     numero del genitore
ruolo           ENUM('genitore', 'staff_professore', 'segreteria')
verificato      TINYINT(1)      0 fino alla verifica OTP, poi 1
codice_verifica VARCHAR(10)     OTP temporaneo (invalidato dopo l'uso)
```

---

## Tabella: `figli`

Studenti registrati da un genitore.

```sql
id              INT             PK, AUTO_INCREMENT
nome            VARCHAR(100)
cognome         VARCHAR(100)
scuola_media    VARCHAR(255)    nome scuola di provenienza
citta_scuola    VARCHAR(100)    città della scuola media
id_genitore     INT             FK → utenti(id)
```

---

## Tabella: `eventi`

Open Day e Cardano Day.

```sql
id                  INT         PK, AUTO_INCREMENT
tipo                ENUM('open_day', 'cardano_day')
titolo              VARCHAR(255)
descrizione         TEXT
data_evento         DATE
posti_max           INT         capienza totale
posti_disponibili   INT         decrementato ad ogni iscrizione
apertura_iscrizioni DATETIME    il sistema apre automaticamente
chiusura_iscrizioni DATETIME    il sistema chiude automaticamente
pubblicato          TINYINT(1)  0=bozza, 1=visibile al pubblico
```

---

## Tabella: `turni`

I 2 turni di ogni Cardano Day.

```sql
id          INT         PK, AUTO_INCREMENT
id_evento   INT         FK → eventi(id)
numero      TINYINT     1=primo turno, 2=secondo turno
ora_inizio  TIME        configurabile dalla segreteria
ora_fine    TIME        configurabile dalla segreteria
```

---

## Tabella: `laboratori`

Istanze di laboratorio per turno ed evento (ogni aula è una riga separata).

```sql
id                  INT         PK, AUTO_INCREMENT
id_evento           INT         FK → eventi(id)
id_turno            INT         FK → turni(id)
nome                VARCHAR(100)  es. Informatica
istanza             TINYINT     numero aula: 1, 2, 3...
posti_max           INT
posti_disponibili   INT         decrementato ad ogni assegnazione
```

---

## Tabella: `percorsi_open_day`

I 3 percorsi disponibili per ogni Open Day.

```sql
id                  INT         PK, AUTO_INCREMENT
id_evento           INT         FK → eventi(id)
nome                VARCHAR(100)  es. Percorso Misto, Percorso Liceo, Percorso Tecnico
descrizione         TEXT        testo visibile al genitore
posti_max           INT
posti_disponibili   INT         decrementato ad ogni iscrizione
```

---

## Tabella: `iscrizioni`

Una riga per ogni figlio iscritto a un evento.

```sql
id              INT         PK, AUTO_INCREMENT
id_figlio       INT         FK → figli(id)
id_evento       INT         FK → eventi(id)
id_percorso     INT         FK → percorsi_open_day(id) — NULL per Cardano Day
qr_code         VARCHAR(64) codice univoco 32 char hex, generato da Node.js
stato           ENUM('confermata', 'annullata')
firma_entrata   DATETIME    timestamp firma 1 — NULL se non registrata
firma_lab1      DATETIME    timestamp firma 2 — NULL se non registrata
firma_lab2      DATETIME    timestamp firma 3 — NULL se 1 solo lab o non registrata
firma_uscita    DATETIME    timestamp firma 4 — NULL se non registrata
```

---

## Tabella: `iscrizioni_laboratori`

Collega ogni iscrizione all'aula di laboratorio assegnata.

```sql
id_iscrizione   INT     FK → iscrizioni(id)
id_laboratorio  INT     FK → laboratori(id)  -- istanza specifica (aula)
```

---

## Tabelle: `gruppi` e `iscrizioni_gruppi`

Gruppi di visita per Open Day (M1–M6, L1–L7, T1–T5) e Cardano Day (T1–T5).

```sql
-- gruppi
id          INT         PK
nome        VARCHAR(10) es. M1, L3, T2 (Open Day) oppure T1, T2... (Cardano Day)
id_evento   INT         FK → eventi(id)

-- iscrizioni_gruppi (tabella ponte)
id_iscrizione   INT     FK → iscrizioni(id)
id_gruppo       INT     FK → gruppi(id)
```

---

## Tabella: `richieste_ruolo`

Richieste di accesso con ruolo Staff o Professore.

```sql
id              INT     PK, AUTO_INCREMENT
id_utente       INT     FK → utenti(id)
ruolo_richiesto ENUM('staff', 'professore')
stato           ENUM('in_attesa', 'approvata', 'rifiutata')
```

---

## Note tecniche

- Tutte le query usano **PDO prepared statements** (protezione SQL injection)
- Le eliminazioni di dati personali (§16) avvengono in una **transazione MySQL** con rollback automatico in caso di errore
- Il campo `posti_disponibili` negli eventi e nei laboratori viene decrementato in modo atomico per evitare race condition
