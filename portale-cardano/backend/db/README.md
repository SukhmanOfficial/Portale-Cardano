# Database — Cardano Day

## Struttura cartelle

```
database/
├── migrations/
│   ├── 001_create_tables.sql    ← Tutte le tabelle
│   ├── 002_indexes.sql          ← Indici aggiuntivi
│   └── 003_constraints.sql      ← Check e vincoli
├── seeds/
│   ├── seed.sql                 ← Dati di test completi
│   └── reset.sql                ← Svuota e ripopola
└── install_db.sh                ← Script installazione
```

## Installazione rapida

```bash
# Solo struttura
bash install_db.sh

# Struttura + dati di test
bash install_db.sh --with-seed

# Reset completo con dati di test
bash install_db.sh --reset
```

## Installazione manuale

```bash
mysql -u root -p < migrations/001_create_tables.sql
mysql -u root -p cardano_day < migrations/002_indexes.sql
mysql -u root -p cardano_day < migrations/003_constraints.sql
mysql -u root -p cardano_day < seeds/seed.sql
```

## Tabelle

| Tabella | Descrizione |
|---------|-------------|
| `utenti` | Account (genitori, staff, segreteria) |
| `figli` | Studenti registrati dai genitori |
| `eventi` | Open Day e Cardano Day |
| `turni` | 2 turni per ogni Cardano Day |
| `laboratori` | Istanze aula per turno ed evento |
| `percorsi_open_day` | 3 percorsi (Misto, Liceo, Tecnico) |
| `iscrizioni` | Una riga per figlio iscritto, con le 4 firme QR |
| `iscrizioni_laboratori` | Collegamento iscrizione ↔ aula |
| `gruppi` | Gruppi di visita (M1, L2, T3, I1...) |
| `iscrizioni_gruppi` | Collegamento iscrizione ↔ gruppo |
| `richieste_ruolo` | Richieste staff/professore in attesa |
| `scuole` | Elenco scuole medie per autocomplete |
| `comuni` | Elenco comuni italiani per autocomplete |
| `audit_log` | Log operazioni sensibili (senza dati personali) |

## Utenti di test (seed)

| Email | Password | Ruolo |
|-------|----------|-------|
| `segreteria@itiscardanopv.edu.it` | `Password1!` | Segreteria |
| `a.ferrari@itiscardanopv.edu.it` | `Password1!` | Staff/Professore |
| `m.bianchi@itiscardanopv.edu.it` | `Password1!` | Staff/Professore |
| `mario.rossi@email.it` | `Password1!` | Genitore |
| `giulia.verdi@email.it` | `Password1!` | Genitore |

## Note tecniche

- **Charset:** utf8mb4 / utf8mb4_unicode_ci (supporto emoji e caratteri speciali)
- **Engine:** InnoDB (supporto FK e transazioni)
- **posti_disponibili** viene decrementato atomicamente ad ogni iscrizione
- **qr_code** è UNIQUE — garantisce unicità a livello DB
- **Le 4 firme** sono colonne DATETIME separate in `iscrizioni` (NULL = non ancora registrata)
- **audit_log** non contiene dati personali — solo ID e metadati
