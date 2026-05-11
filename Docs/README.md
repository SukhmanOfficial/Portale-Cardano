# Sistema Cardano Day — Documentazione v1.0

> **ITIS G. Cardano — Pavia**  
> Tecnologie: PHP · MySQL · HTML · CSS · JavaScript · Node.js  
> Architettura: REST API + Frontend responsive (PC, Tablet, Smartphone)

---

## Indice

| # | File | Contenuto |
|---|------|-----------|
| 01 | [01-tecnologie.md](./01-tecnologie.md) | Stack tecnologico utilizzato |
| 02 | [02-home-page.md](./02-home-page.md) | Pagina pubblica e lista eventi |
| 03 | [03-registrazione.md](./03-registrazione.md) | Registrazione Genitore e Staff/Professore |
| 04 | [04-login-sessione.md](./04-login-sessione.md) | Login, JWT e recupero password |
| 05 | [05-ruoli.md](./05-ruoli.md) | Ruoli del sistema e permessi |
| 06 | [06-dati-figlio.md](./06-dati-figlio.md) | Inserimento dati figlio e autocomplete |
| 07 | [07-funzionalita-genitore.md](./07-funzionalita-genitore.md) | Iscrizione eventi, email, QR code |
| 08 | [08-cardano-day-laboratori.md](./08-cardano-day-laboratori.md) | Laboratori, turni e assegnazione automatica |
| 09 | [09-divisione-gruppi.md](./09-divisione-gruppi.md) | Algoritmo bilanciamento gruppi (Node.js) |
| 10 | [10-funzionalita-segreteria.md](./10-funzionalita-segreteria.md) | Pannello segreteria ed export Excel |
| 11 | [11-firme-qr.md](./11-firme-qr.md) | Sistema 4 firme QR — Cardano Day |
| 12 | [12-database.md](./12-database.md) | Struttura tabelle MySQL |
| 13 | [13-api.md](./13-api.md) | Endpoint REST API |
| 14 | [14-sicurezza.md](./14-sicurezza.md) | Sicurezza e protezione dati |
| 15 | [15-flusso-completo.md](./15-flusso-completo.md) | Flusso end-to-end dalla registrazione all'uscita |
| 16 | [16-cancellazione-dati.md](./16-cancellazione-dati.md) | Cancellazione sicura dati post-evento |

---

## Note rapide

- I **minorenni non possono iscriversi autonomamente**: l'iscrizione deve essere effettuata da un genitore registrato.
- **Staff e Professore** hanno esattamente gli stessi permessi — l'etichetta è solo descrittiva.
- La **sessione JWT** dura 7 giorni; se il ruolo viene modificato dalla segreteria, l'utente deve rieffettuare il login.
- Le **4 firme QR** (Entrata → Lab 1 → Lab 2 → Uscita) sono disponibili solo per il Cardano Day.
