# 08 — Cardano Day — Laboratori, Turni e Assegnazione Automatica

> **Tipo documento:** Tecnico + Guida utente  
> **Sezione PDF:** §8

---

## Struttura della giornata

Il Cardano Day si svolge su **due giorni distinti e indipendenti**. Ogni giornata è divisa in **due turni fissi** configurabili dalla segreteria.

| Turno | Orario | Durata |
|-------|--------|--------|
| Primo turno | 8:30 – 10:30 | 2 ore |
| Secondo turno | 11:00 – 13:00 | 2 ore |

---

## Laboratori disponibili

- Informatica
- Elettronica
- Meccanica
- Chimica
- Liceo

> I laboratori disponibili variano per ogni evento e sono configurati dalla segreteria.

---

## Assegnazione automatica dell'orario

Il genitore **sceglie quali laboratori visitare** ma **NON sceglie il turno**. Il sistema assegna automaticamente l'orario in base alla disponibilità e al bilanciamento dei gruppi.

| Scelta genitore | Assegnazione sistema |
|-----------------|----------------------|
| 2 laboratori | Uno al turno 1, uno al turno 2 |
| 1 laboratorio | Assegnato al turno con più disponibilità |

---

## Istanze multiple — Aule parallele

Ogni laboratorio può avere più aule attive nello stesso turno. Esempio per il 24 novembre 2026:

| Laboratorio | Turno 1 (8:30–10:30) | Turno 2 (11:00–13:00) | Totale posti |
|-------------|----------------------|------------------------|:---:|
| Informatica | 2 aule × 25 = 50 posti | 1 aula × 25 = 25 posti | **75** |
| Elettronica | 1 aula × 25 = 25 posti | 1 aula × 25 = 25 posti | **50** |
| Meccanica | 1 aula × 25 = 25 posti | 2 aule × 25 = 50 posti | **75** |
| Chimica | 1 aula × 25 = 25 posti | 1 aula × 25 = 25 posti | **50** |
| Liceo | 1 aula × 25 = 25 posti | 1 aula × 25 = 25 posti | **50** |

> Ogni evento ha la propria configurazione — i numeri sopra sono un esempio.

---

## Tabella laboratori (DB)

```sql
laboratori
├── id                  INT PK
├── id_evento           INT FK → eventi
├── id_turno            INT FK → turni
├── nome                VARCHAR   -- es. Informatica
├── istanza             TINYINT   -- numero aula: 1, 2, 3...
├── posti_max           INT
└── posti_disponibili   INT       -- decrementato ad ogni assegnazione
```

## Tabella turni (DB)

```sql
turni
├── id          INT PK
├── id_evento   INT FK → eventi
├── numero      TINYINT   -- 1=primo, 2=secondo
├── ora_inizio  TIME
└── ora_fine    TIME
```

---

## Codici aula

Il sistema genera automaticamente un codice aula nel formato:

```
<Lettera laboratorio><numero aula><turno>
```

| Codice | Significato |
|--------|-------------|
| `C1` | Chimica, aula 1, turno 1 (8:30) |
| `E2` | Elettronica, aula 2, turno 2 (11:00) |
| `M1` | Meccanica, aula 1, turno 1 (8:30) |
| `I2` | Informatica, aula 2, turno 2 (11:00) |
| `L1` | Liceo, aula 1, turno 1 (8:30) |

---

## Configurazione dalla segreteria

La segreteria configura per ogni Cardano Day:
- Nome laboratorio
- Turno (1 o 2)
- Numero di aule parallele
- Posti per aula
- Orario inizio/fine di ogni turno
