# Sistema Cardano Day — ITIS G. Cardano, Pavia

> Documentazione tecnica completa del sistema di gestione iscrizioni Open Day e Cardano Day.

---

## Indice della documentazione

| # | File | Descrizione |
|---|------|-------------|
| 01 | [Overview](./01_overview/01_overview.md) | Presentazione generale del sistema |
| 02 | [Tecnologie](./02_tecnologie/02_tecnologie.md) | Stack tecnologico e architettura |
| 03 | [Autenticazione](./03_autenticazione/03_autenticazione.md) | Registrazione, login, OTP, JWT |
| 04 | [Ruoli](./04_ruoli/04_ruoli.md) | Permessi e accessi per ruolo |
| 05 | [Genitore](./05_genitore/05_genitore.md) | Funzionalità area genitore |
| 06 | [Eventi](./06_eventi/06_eventi.md) | Struttura e configurazione eventi |
| 07 | [Laboratori](./07_laboratori/07_laboratori.md) | Laboratori, turni e aule (Cardano Day) |
| 08 | [Divisione Gruppi](./08_gruppi/08_gruppi.md) | Algoritmo bilanciamento Node.js |
| 09 | [Firme QR](./09_firme_qr/09_firme_qr.md) | Sistema 4 firme e scansione |
| 10 | [Segreteria](./10_segreteria/10_segreteria.md) | Pannello segreteria e funzionalità |
| 11 | [Admin](./11_admin/11_admin.md) | Pannello amministratore |
| 12 | [API REST](./12_api/12_api.md) | Endpoint, metodi, accessi |
| 13 | [Database](./13_database/13_database.md) | Schema tabelle MySQL |
| 14 | [Sicurezza](./14_sicurezza/14_sicurezza.md) | Misure di sicurezza implementate |
| 15 | [Flusso Completo](./15_flusso/15_flusso.md) | Flusso end-to-end dalla registrazione all'uscita |
| UML | [Diagrammi UML](./uml/uml_diagrammi.md) | Use Case, Sequenza, Attività, Componenti |
| ER | [Diagramma ER](./er/er_database.md) | Entità-Relazione e schema relazionale |

---

## Riepilogo tecnico

| Campo | Valore |
|-------|--------|
| **Istituto** | ITIS G. Cardano — Pavia |
| **Tecnologie** | PHP 8+ · MySQL 8+ · HTML5 · CSS3 · JavaScript · Node.js |
| **Architettura** | REST API + Frontend responsive (PC, Tablet, Smartphone) |
| **Autenticazione** | JWT — durata 7 giorni |
| **Firme evento** | 4 fasi: Entrata → Lab T1 → Lab T2 → Uscita (solo Cardano Day) |
| **Ruoli** | Admin · Segreteria · Staff/Professore · Genitore |

> ⚠️ I minorenni non possono iscriversi autonomamente. L'iscrizione deve essere effettuata da un genitore registrato.

---

## Struttura cartelle

```
docs/
├── README.md                    ← questo file
├── 01_overview/
│   └── 01_overview.md
├── 02_tecnologie/
│   └── 02_tecnologie.md
├── 03_autenticazione/
│   └── 03_autenticazione.md
├── 04_ruoli/
│   └── 04_ruoli.md
├── 05_genitore/
│   └── 05_genitore.md
├── 06_eventi/
│   └── 06_eventi.md
├── 07_laboratori/
│   └── 07_laboratori.md
├── 08_gruppi/
│   └── 08_gruppi.md
├── 09_firme_qr/
│   └── 09_firme_qr.md
├── 10_segreteria/
│   └── 10_segreteria.md
├── 11_admin/
│   └── 11_admin.md
├── 12_api/
│   └── 12_api.md
├── 13_database/
│   └── 13_database.md
├── 14_sicurezza/
│   └── 14_sicurezza.md
├── 15_flusso/
│   └── 15_flusso.md
├── uml/
│   └── uml_diagrammi.md
└── er/
    └── er_database.md
```
