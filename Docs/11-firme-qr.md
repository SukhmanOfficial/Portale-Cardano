# 11 — Sistema di Firme QR — Le 4 Fasi (solo Cardano Day)

> **Tipo documento:** Guida utente + Tecnico  
> **Sezione PDF:** §11  
> **Ruolo:** Staff / Professore

---

## Panoramica

Il QR code allegato nell'email viene scansionato dallo staff in **quattro momenti distinti** durante la giornata. Ogni scansione registra data e ora nel database e fa avanzare lo stato dell'iscrizione alla fase successiva.

> I QR code sono generati da Node.js con `crypto.randomBytes()` — crittograficamente sicuri.

---

## Le 4 fasi

```
1. ENTRATA        2. LAB TURNO 1     3. LAB TURNO 2     4. USCITA
   Ingresso scuola    8:30 — primo lab    11:00 — secondo lab  Uscita scuola
```

---

## Firma 1 — Entrata a scuola

**Chi:** Staff all'ingresso principale  
**Quando:** Arrivo 8:00–8:30  
**Dove:** Ingresso principale

### Verifica del sistema
- Controlla che il QR sia valido
- Verifica che l'iscrizione sia in stato `confermata`
- Registra il **timestamp di entrata**

### Dati mostrati a schermo
- Nome e cognome studente
- Nome e cognome genitore
- Evento e gruppo assegnato
- Laboratori con orari e numero di aula

---

## Firma 2 — Ingresso laboratorio Turno 1 (8:30)

**Chi:** Staff/Professore del laboratorio  
**Quando:** Inizio turno 1  
**Dove:** Porta del laboratorio

### Procedura
1. Lo staff seleziona il proprio **laboratorio e aula** nell'app
2. Scansiona i QR uno per uno

### Esiti possibili

| Esito | Messaggio |
|-------|-----------|
| ✅ Studente corretto | Ingresso turno 1 registrato correttamente |
| ❌ Studente sbagliato | *"Questo studente NON appartiene a questo laboratorio. Deve andare in: Meccanica — Aula 1"* |

---

## Firma 3 — Ingresso laboratorio Turno 2 (11:00)

**Chi:** Staff/Professore del laboratorio  
**Quando:** Inizio turno 2  
**Dove:** Porta del laboratorio

Identica alla firma 2 ma per il secondo turno.

### Esiti possibili

| Esito | Messaggio |
|-------|-----------|
| ✅ Studente corretto | Ingresso turno 2 registrato |
| ❌ Studente sbagliato | *"Deve andare in: Chimica — Aula 1"* |
| ⚠️ Firma 1 mancante | *"Attenzione: questo studente non ha ancora registrato l'entrata"* |

> Se lo studente ha scelto **un solo laboratorio**, la firma 3 non è richiesta e il sistema lo comunica chiaramente.

---

## Firma 4 — Uscita dalla scuola

**Chi:** Staff all'uscita  
**Quando:** Fine giornata  
**Dove:** Ingresso principale

### Verifica del sistema
- Verifica che le firme precedenti siano presenti
- Registra il **timestamp di uscita**
- Segna l'iscrizione come **completata**

> Se mancano firme precedenti, il sistema le **segnala ma registra comunque l'uscita**, lasciando traccia dell'anomalia.

---

## Riepilogo firme

| Firma | Momento | Chi | Dove | Verifica |
|-------|---------|-----|------|----------|
| 1 — Entrata | 8:00–8:30 | Staff entrata | Ingresso principale | QR valido + iscrizione confermata |
| 2 — Lab T1 | Inizio turno 1 | Staff/Prof. | Porta laboratorio | Lab corretto + aula corretta |
| 3 — Lab T2 | Inizio turno 2 | Staff/Prof. | Porta laboratorio | Lab corretto + firma 2 presente |
| 4 — Uscita | Fine giornata | Staff uscita | Ingresso principale | Registra uscita + segnala anomalie |

---

## Campi firme nel database

```sql
iscrizioni
├── firma_entrata   DATETIME   -- timestamp firma 1
├── firma_lab1      DATETIME   -- timestamp firma 2
├── firma_lab2      DATETIME   -- timestamp firma 3 (NULL se 1 solo lab)
└── firma_uscita    DATETIME   -- timestamp firma 4
```

---

## Endpoint correlati

```
POST /api/qr/?action=scan        → Scansiona QR — firma 1/2/3/4
POST /api/qr/?action=select_lab  → Seleziona laboratorio attivo
```
