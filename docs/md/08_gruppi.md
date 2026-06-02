# 08 — Divisione Gruppi — Algoritmo di Bilanciamento (Node.js)

## 8.1 — Panoramica

La divisione in gruppi è eseguita da uno **script Node.js** invocato da PHP via CLI quando la segreteria clicca "Dividi per gruppi". L'algoritmo distribuisce gli studenti in modo bilanciato per scuola di provenienza.

```
Segreteria clicca "Dividi per gruppi"
           ↓
PHP invoca Node.js via shell_exec()
           ↓
Node.js legge i dati dal database
           ↓
Algoritmo di bilanciamento
           ↓
Salva assegnazioni nel database
           ↓
Genera QR code aggiornati (PNG + PDF)
           ↓
Invia email con QR ai genitori
           ↓
Restituisce risultato a PHP
```

---

## 8.2 — Open Day: Divisione per Percorso

### Processo

| Fase | Descrizione |
|------|-------------|
| **1 — Riepilogo** | La segreteria visualizza il numero di iscritti per percorso |
| **2 — Scelta gruppi** | La segreteria decide quanti gruppi creare per percorso (M, L, T) |
| **3 — Distribuzione** | L'algoritmo ordina per scuola e distribuisce circolarmente |
| **4 — Anteprima** | Mostra i gruppi formati prima della conferma |
| **5 — Conferma** | Salva le assegnazioni e invia email con QR aggiornato |

### Algoritmo di distribuzione (Open Day)

```javascript
// Pseudocodice algoritmo bilanciamento Open Day
function distribuisciGruppi(iscritti, nGruppi) {
  // 1. Ordina per scuola di provenienza
  iscritti.sort((a, b) => a.scuola.localeCompare(b.scuola));

  // 2. Distribuzione circolare round-robin
  const gruppi = Array.from({ length: nGruppi }, () => []);
  iscritti.forEach((studente, i) => {
    gruppi[i % nGruppi].push(studente);
  });

  return gruppi; // es. M1=8 studenti, M2=8, M3=8, M4=8
}
```

### Nomenclatura gruppi Open Day

| Percorso | Esempio gruppi |
|----------|---------------|
| Misto | M1, M2, M3, M4 |
| Liceo Sc. Appl. | L1, L2, L3 |
| Tecnico | T1, T2 |

---

## 8.3 — Cardano Day: Divisione Laboratori, Turni e Aule

### Processo

| Fase | Descrizione |
|------|-------------|
| **1** | Raccoglie la lista di tutti gli iscritti con i laboratori scelti (1 o 2) |
| **2** | Raggruppa per combinazione: es. tutti Chimica+Informatica, tutti solo Chimica |
| **3** | Per chi ha 2 lab: assegna il primo al turno 1 (8:30) e il secondo al turno 2 (11:00), alternando per bilanciare |
| **4** | Per chi ha 1 solo lab: assegna al turno con meno iscritti in quel laboratorio |
| **5** | Se un laboratorio ha N aule, assegna all'aula con più posti liberi |
| **6** | Salva nel database il codice aula (lettera+numero): I1, I2, C1, C2, M1... |
| **7** | Invia email con QR code (PDF) e dettagli completi a ogni genitore |
| **8** | Aggiorna le aree personali (genitore + staff) con i codici aula |

### Algoritmo assegnazione aule (Cardano Day)

```javascript
// Pseudocodice algoritmo bilanciamento Cardano Day
function assegnaAule(iscritti, configLaboratori) {
  // Raggruppa per combinazione di lab
  const gruppi = raggruppaPerCombinazione(iscritti);

  for (const studente of iscritti) {
    if (studente.lab2) {
      // 2 laboratori: lab1 → T1, lab2 → T2 (o viceversa per bilanciare)
      const turno1 = trovaTurnoMiglior(studente.lab1, "T1", configLaboratori);
      const turno2 = trovaTurnoMiglior(studente.lab2, "T2", configLaboratori);
      studente.codice_t1 = assegnaAulaMenoAffollata(turno1);
      studente.codice_t2 = assegnaAulaMenoAffollata(turno2);
    } else {
      // 1 laboratorio: assegna al turno con meno iscritti
      const turno = trovaTurnoConPiuDisponibilita(studente.lab1, configLaboratori);
      studente.codice = assegnaAulaMenoAffollata(turno);
    }
  }
}
```

### Esempio output assegnazione

| Studente | Lab 1 | Lab 2 | Cod. T1 | Ora T1 | Cod. T2 | Ora T2 |
|---------|-------|-------|:-------:|--------|:-------:|--------|
| Abbiati Laura | Elettronica | Chimica | E1 | 8:30 | C2 | 11:00 |
| Albanese Riccardo | Meccanica | Elettronica | M1 | 8:30 | E2 | 11:00 |
| Badino Riccardo | Liceo Sc.Appl. | — | L1 | 8:30 | — | — |
| Belluscio Denis | Informatica | — | — | — | I2 | 11:00 |

---

## 8.4 — Spostamento Manuale Studenti

Dopo la divisione automatica, la segreteria può **spostare manualmente** uno studente tra gruppi.

### Open Day — Spostamento

| Passo | Azione |
|-------|--------|
| 1 | Segreteria cerca lo studente per nome |
| 2 | Seleziona lo studente → vede il gruppo attuale |
| 3 | Seleziona il gruppo di destinazione (stesso percorso) |
| 4 | Se il gruppo di destinazione è pieno → scambia con uno studente |
| 5 | Conferma → database aggiornato + email con QR aggiornato inviata al genitore |

### Cardano Day — Spostamento

Analogamente, la segreteria può modificare l'assegnazione di turno o aula per singoli studenti con conseguente aggiornamento del QR e notifica al genitore.

---

## 8.5 — Anteprima Gruppi

Prima di confermare la divisione, la segreteria vede una schermata di anteprima con:

- Riepilogo: numero totale studenti, percorsi/laboratori, gruppi creati
- Elenco per gruppo con studenti e scuole di provenienza
- Pannello laterale "Sposta studente" per aggiustamenti manuali
- Pulsante "Riesegui" per rigenerare la distribuzione
- Pulsante "Conferma e invia email" per finalizzare

### Visualizzazione anteprima Open Day

```
Percorso Misto — 32 studenti · 4 gruppi
┌──────────────┬──────────────┬──────────────┬──────────────┐
│      M1      │      M2      │      M3      │      M4      │
│  8 studenti  │  8 studenti  │  8 studenti  │  8 studenti  │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ Abbiati Laura│ Ferrari G.   │ Martini P.   │ Pavan Rosa   │
│ Bianchi Marco│ Gatti L.     │ Negri Fabio  │ Rossi Chiara │
│ Colombo Sara │ Lodi V.      │ +6 altri...  │ +6 altri...  │
│ De Luca A.   │ +5 altri...  │              │              │
└──────────────┴──────────────┴──────────────┴──────────────┘

Liceo Sc. Appl. — 28 studenti · 3 gruppi
Percorso Tecnico — 27 studenti · 2 gruppi
```

---

## 8.6 — Generazione QR Code

I QR code vengono generati da Node.js usando `crypto.randomBytes()`:

```javascript
const crypto = require('crypto');

function generaQRCode(idIscrizione) {
  // Codice univoco crittograficamente sicuro (32 char hex)
  const codice = crypto.randomBytes(16).toString('hex');
  // es. "a3f8c2d1e6b4927f3c8e5a1b9d7f4e2c"

  // Generazione immagine QR (libreria qrcode)
  const qr = QRCode.create(codice, { errorCorrectionLevel: 'H' });

  // Export PNG + PDF
  return { codice, png: qr.toPNG(), pdf: qr.toPDF() };
}
```

### Contenuto QR code

Il QR code contiene solo il **codice hex univoco a 32 caratteri**. Quando viene scansionato, il sistema cerca nel database l'iscrizione corrispondente e recupera tutti i dati in tempo reale.

---

*Sezione precedente: [07 — Laboratori](../07_laboratori/07_laboratori.md) | Successiva: [09 — Firme QR](../09_firme_qr/09_firme_qr.md)*
