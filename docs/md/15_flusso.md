# 15 — Flusso Completo — Dalla Registrazione all'Uscita

## 15.1 — Flusso Genitore

### Fase 1: Registrazione

```
Genitore visita la home page
        ↓
Clicca "Registrati"
        ↓
Compila modulo:
  - Nome, cognome
  - Email
  - Password (min. 8 caratteri)
  - Via e numero civico (manuali)
  - CAP → Città auto  oppure  Città → CAP auto
  - Cellulare
        ↓
Sistema verifica email non già registrata
        ↓
Sistema invia OTP 6 cifre via email (scadenza 15 min)
        ↓
Genitore inserisce OTP
        ↓
Account attivato — ruolo "Genitore" assegnato
        ↓
Redirect alla propria area personale
```

### Fase 2: Inserimento Figlio

```
Genitore entra nella sezione "I miei figli"
        ↓
Clicca "+ Aggiungi figlio"
        ↓
Inserisce:
  - Nome e cognome del figlio
  - Scuola media (ricerca con min. 3 caratteri → autocomplete)
  - Se scuola non trovata → inserimento manuale
        ↓
Figlio salvato — riutilizzabile per tutte le iscrizioni future
```

### Fase 3: Iscrizione Open Day

```
Sistema apre iscrizioni alla data impostata (automatico)
        ↓
Genitore visualizza evento Open Day disponibile
        ↓
Clicca "Iscriviti ora"
        ↓
Step 1 — Seleziona evento
Step 2 — Seleziona figlio + percorso (Misto / Liceo / Tecnico)
Step 3 — Riepilogo e conferma
Step 4 — QR code generato
        ↓
Sistema:
  - Genera QR code (Node.js, crypto.randomBytes)
  - Invia email con QR PDF allegato
  - Decrementa posti disponibili
        ↓
Genitore può scaricare QR dall'area personale in qualsiasi momento
```

### Fase 3 (alternativa): Iscrizione Cardano Day

```
Step 2 (diverso) — Seleziona figlio + 1 o 2 laboratori
  - Turno 1 (8:30–10:30): sceglie 1 tra I, E, M, C, L
  - Turno 2 (11:00–13:00): opzionale, sceglie 1 diverso dal T1
        ↓
Gli orari esatti e i codici aula verranno assegnati dopo la chiusura
```

---

## 15.2 — Flusso Segreteria (pre-evento)

### Fase 4: Chiusura Iscrizioni

```
Sistema chiude automaticamente le iscrizioni alla data impostata
        ↓
Segreteria visualizza riepilogo iscritti per percorso / laboratorio
```

### Fase 5: Divisione Gruppi

```
Segreteria accede al pannello → "Dividi per gruppi"
        ↓
Seleziona l'evento
        ↓
[Open Day]
  - Decide numero di gruppi per percorso
  - Clicca "Esegui divisione"
  - Algoritmo Node.js: ordina per scuola, distribuisce circolarmente
  - Output: M1 (8 stud.), M2 (8), M3 (8), M4 (8) · L1, L2, L3 · T1, T2

[Cardano Day]
  - Algoritmo Node.js:
    1. Raggruppa per combinazione lab
    2. Assegna turno (T1/T2) bilanciando le aule
    3. Assegna aula con più posti liberi
    4. Output: I1, C2, M1, E2... per ogni studente
        ↓
Segreteria visualizza anteprima gruppi
        ↓
Sposta manualmente studenti se necessario
        ↓
Clicca "Conferma e invia email"
        ↓
Sistema:
  - Salva assegnazioni nel database
  - Genera QR code aggiornati (Node.js)
  - Invia email con QR aggiornato + codici aula/gruppo a ogni genitore
  - Aggiorna aree personali genitori e staff
```

---

## 15.3 — Flusso Evento (giorno dell'evento — Cardano Day)

### Firma 1 — Entrata (8:00–8:30)

```
Studente arriva all'ingresso principale
        ↓
Mostra QR code allo staff (schermo o stampa)
        ↓
Staff scansiona con fotocamera o inserisce codice manualmente
        ↓
Sistema verifica:
  ✅ QR valido + iscrizione confermata
        ↓
Mostra: Nome studente, scuola, lab assegnati (E1 · C2)
        ↓
Registra firma_entrata = NOW() nel database
        ↓
Studente entra nell'edificio
```

### Firma 2 — Lab Turno 1 (8:30)

```
Studente si dirige al laboratorio assegnato (es. Elettronica E1)
        ↓
Staff/Prof. alla porta scansiona QR
        ↓
Sistema verifica:
  ✅ Lab corretto (Elettronica E1) → "Firma 2 registrata"
  ❌ Lab sbagliato → "Deve andare in: Meccanica M1"
  ⚠️ Firma 1 mancante → "Potrebbe aver saltato l'ingresso" → opzione registra comunque
        ↓
Registra firma_lab1 = NOW()
        ↓
Attività in laboratorio (8:30–10:30)
```

### Firma 3 — Lab Turno 2 (11:00)

```
Studente si sposta al secondo laboratorio (es. Chimica C2)
        ↓
Staff/Prof. alla porta scansiona QR
        ↓
Sistema verifica: lab corretto + firma 2 presente
        ↓
Registra firma_lab2 = NOW()
        ↓
Attività in laboratorio (11:00–13:00)
[Se 1 solo lab: firma 3 non richiesta — sistema lo comunica]
```

### Firma 4 — Uscita (13:00)

```
Fine giornata — studente si dirige all'uscita
        ↓
Staff all'uscita scansiona QR
        ↓
Sistema segnala eventuali anomalie (firme mancanti)
        ↓
Registra firma_uscita = NOW()
        ↓
Studente esce dall'edificio
```

---

## 15.4 — Flusso Segreteria (post-evento)

```
Segreteria accede alla dashboard
        ↓
Visualizza statistiche presenze:
  - N studenti entrati (firma 1 registrata)
  - N studenti ai laboratori (firma 2 e 3)
  - N studenti usciti (firma 4)
  - N anomalie rilevate
        ↓
Scarica report Excel .xlsx:
  - Foglio per gruppo (M1, L2, E1, C2...)
  - Foglio per laboratorio
  - Foglio riepilogo generale con firme
```

---

## 15.5 — Tabella Riepilogativa

| # | Fase | Chi | Cosa |
|---|------|-----|------|
| 1 | Registrazione genitore | Genitore | Compila form + verifica OTP |
| 2 | Login | Genitore | JWT 7 giorni |
| 3 | Inserimento figlio | Genitore | Nome, scuola, città |
| 4 | Apertura iscrizioni | Sistema | Automatica alla data impostata |
| 5 | Scelta evento | Genitore | Open Day o Cardano Day |
| 6 | Scelta percorso/lab | Genitore | Percorso (OD) o 1–2 lab (CD) |
| 7 | Conferma iscrizione | Sistema | QR generato + email inviata |
| 8 | Chiusura iscrizioni | Sistema | Automatica alla data impostata |
| 9 | Divisione gruppi | Segreteria | Script Node.js + anteprima + conferma |
| 9b | Aggiornamento aree | Sistema | Codici aula visibili a genitori e staff |
| 10 | Firma 1 — Entrata | Staff | QR scansionato → ingresso registrato |
| 11 | Firma 2 — Lab T1 | Staff/Prof. | Lab e aula verificati |
| 12 | Firma 3 — Lab T2 | Staff/Prof. | Lab e aula verificati |
| 13 | Firma 4 — Uscita | Staff | Uscita registrata |
| 14 | Report | Segreteria | Statistiche + Excel |

---

*Sezione precedente: [14 — Sicurezza](../14_sicurezza/14_sicurezza.md) | Sezione successiva: [UML Diagrammi](../uml/uml_diagrammi.md)*
