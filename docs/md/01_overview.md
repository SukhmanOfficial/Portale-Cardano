# 01 — Overview del Sistema

## Descrizione

Il **Sistema Cardano Day** è una piattaforma web sviluppata per l'**ITIS G. Cardano di Pavia** con lo scopo di gestire le iscrizioni agli eventi di orientamento scolastico:

- **Open Day** — Giornata di orientamento per famiglie e studenti delle scuole medie
- **Cardano Day** — Giornata con visita ai laboratori dell'istituto

Il sistema gestisce l'intero ciclo di vita di un evento: dalla pubblicazione alle iscrizioni, dalla divisione in gruppi alla tracciabilità delle presenze tramite QR code.

---

## Obiettivi

- Permettere ai genitori di iscrivere i propri figli agli eventi in modo semplice e sicuro
- Automatizzare la divisione degli studenti in gruppi e aule bilanciate
- Tracciare le presenze durante la giornata tramite 4 scansioni QR
- Fornire alla segreteria strumenti completi di gestione e reportistica

---

## Tipologie di eventi

### Open Day
Giornata di orientamento generale. Lo studente sceglie uno dei 3 percorsi:

| Percorso | Descrizione |
|----------|-------------|
| **Misto** | Visita sia laboratori tecnici che aule scientifiche |
| **Liceo Sc. Appl.** | Focalizzato su scienze applicate e matematica |
| **Tecnico** | Indirizzo tecnico-industriale (Informatica, Elettronica, Meccanica, Chimica) |

Il gruppo esatto (es. M1, L2, T3) viene assegnato dalla segreteria dopo la chiusura delle iscrizioni.

### Cardano Day
Giornata con visita ai laboratori. Lo studente sceglie **1 o 2 laboratori** (massimo 1 per turno).

| Laboratorio | Codice |
|-------------|--------|
| Informatica | I |
| Elettronica | E |
| Meccanica | M |
| Chimica | C |
| Liceo Sc. Appl. | L |

Gli orari e le aule vengono assegnati automaticamente dall'algoritmo. Il sistema registra 4 firme QR durante la giornata.

---

## Calendario eventi 2026–2027

| Tipo | Data evento | Apertura iscrizioni | Chiusura iscrizioni |
|------|-------------|---------------------|---------------------|
| Open Day | 18 nov 2026 | 1 nov 2026 ore 8:00 | 10 nov 2026 ore 23:59 |
| Cardano Day | 24 nov 2026 | 1 nov 2026 ore 8:00 | 16 nov 2026 ore 23:59 |
| Open Day | 18 dic 2026 | 1 dic 2026 ore 8:00 | 10 dic 2026 ore 23:59 |
| Cardano Day | 13 gen 2027 | 15 dic 2026 ore 8:00 | 5 gen 2027 ore 23:59 |

---

## Attori del sistema

| Ruolo | Chi è | Come accede |
|-------|-------|-------------|
| **Genitore** | Famiglie degli studenti delle scuole medie | Home page pubblica |
| **Staff / Professore** | Personale dell'istituto | URL separato (non pubblico) |
| **Segreteria** | Amministrazione scolastica | URL separato (non pubblico) |
| **Admin** | Dirigente scolastico | URL separato (non pubblico) |

> ⚠️ I minorenni non possono iscriversi autonomamente. Solo un genitore registrato può effettuare iscrizioni per i propri figli.

---

## Note architetturali

- Il sistema è **mobile-first** e completamente responsive (PC, Tablet, Smartphone)
- L'area pubblica (home + login genitori) è **completamente separata** dall'area del personale
- I due percorsi di accesso **non si incrociano mai**
- L'URL del personale **non è indicizzato** e non è raggiungibile dalla home page

---

*Sezione successiva: [02 — Tecnologie](../02_tecnologie/02_tecnologie.md)*
