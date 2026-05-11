# 16 — Cancellazione Sicura dei Dati dopo l'Evento

> **Tipo documento:** Guida utente + Tecnico  
> **Sezione PDF:** §16  
> **Ruolo:** Segreteria  
> **Disponibile:** Solo dopo la data di fine evento

---

## Panoramica

Al termine di ogni evento, la segreteria può eliminare definitivamente dal database tutti i dati personali degli iscritti. La funzione garantisce la conformità alla normativa sulla privacy (**GDPR**) e prevede un sistema di conferma a più livelli per evitare cancellazioni accidentali.

> ⚠️ **L'eliminazione è irreversibile.** I dati non possono essere recuperati dopo la conferma finale.

---

## 16.1 — Accesso alla funzione

- Disponibile **esclusivamente** nel pannello segreteria
- Visibile nella sezione **dettaglio evento**
- Accessibile **solo dopo la data di fine evento**
- **Non accessibile** da Staff, Professori o Genitori

---

## 16.2 — Dati eliminati

| Dato eliminato | Descrizione |
|----------------|-------------|
| **Dati personali genitori** | Nome, cognome, email, indirizzo, cellulare degli account genitore iscritti |
| **Dati figli** | Nome, cognome, scuola media e città degli studenti iscritti |
| **Iscrizioni e QR code** | Record di iscrizione, codice QR, firme registrate, laboratori assegnati |
| **Assegnazioni gruppi** | Gruppi di visita, percorsi Open Day, turni e aule Cardano Day |
| **Log e firme QR** | Timestamp firma 1/2/3/4 relativi all'evento |

### Cosa NON viene eliminato

> La **configurazione dell'evento** (titolo, date, turni, laboratori, posti) rimane nel database come storico per consultazioni future.

---

## 16.3 — Procedura di conferma

La cancellazione richiede una sequenza obbligatoria di conferme:

| Fase | Descrizione |
|------|-------------|
| **1 — Pulsante** | La segreteria clicca **"Elimina dati personali evento"** nel pannello dettaglio evento |
| **2 — Avviso popup** | Il sistema mostra un popup con il riepilogo dei dati che verranno eliminati (numero iscrizioni, genitori, figli) e il messaggio: *"Questa operazione è irreversibile. I dati personali di tutti gli iscritti a questo evento verranno eliminati definitivamente dal database. Vuoi procedere?"* |
| **3 — Doppia conferma** | La segreteria deve digitare manualmente il **nome dell'evento** nel campo di testo. Solo dopo l'inserimento corretto il pulsante di conferma diventa attivo |
| **4 — Eliminazione sicura** | Il sistema esegue l'eliminazione in una **transazione MySQL**: se un'operazione fallisce, viene eseguito il **rollback completo** e nessun dato viene modificato |
| **5 — Log operazione** | Viene registrato nel log di sistema: data/ora, email segreteria, numero record eliminati — il log **non contiene dati personali** |
| **6 — Conferma finale** | Il sistema mostra il riepilogo dell'operazione e invia una **notifica email** all'account segreteria come ricevuta |

---

## ⚠️ Avviso importante

> **ATTENZIONE — Operazione irreversibile**  
> L'eliminazione dei dati è permanente e non può essere annullata. Prima di procedere la segreteria deve assicurarsi di aver esportato il file Excel (.xlsx) con tutti i dati necessari (→ §10.1). Una volta confermata, l'operazione non può essere interrotta né ripristinata.

---

## ✅ Raccomandazione

Prima di avviare la cancellazione, eseguire l'**export Excel completo** (→ §10.1) per conservare uno storico delle presenze e dei dati dell'evento.

---

## Note tecniche

### Transazione MySQL

```sql
START TRANSACTION;

-- 1. Elimina firme e iscrizioni_laboratori
DELETE il FROM iscrizioni_laboratori il
  JOIN iscrizioni i ON il.id_iscrizione = i.id
  WHERE i.id_evento = ?;

-- 2. Elimina assegnazioni gruppi
DELETE ig FROM iscrizioni_gruppi ig
  JOIN iscrizioni i ON ig.id_iscrizione = i.id
  WHERE i.id_evento = ?;

-- 3. Elimina iscrizioni
DELETE FROM iscrizioni WHERE id_evento = ?;

-- 4. Elimina figli (solo se senza altre iscrizioni attive)
-- [logica condizionale]

-- 5. Anonimizza o elimina dati genitore
-- [logica condizionale — solo se il genitore non ha altri figli/iscrizioni attive]

COMMIT;
-- In caso di errore → ROLLBACK automatico
```

### Accesso endpoint

```
DELETE /api/events/?id=N&action=delete_personal_data
```

Richiede:
- Token JWT con ruolo `segreteria`
- Body: `{ "confirm_name": "Nome esatto dell'evento" }`
- Risposta: `{ "success": true, "deleted": { "iscrizioni": N, "figli": N, "utenti": N } }`

---

## Conformità GDPR

Questa funzione supporta il **diritto alla cancellazione** (Art. 17 GDPR) permettendo alla scuola di eliminare i dati personali degli interessati al termine del trattamento per cui erano stati raccolti (gestione evento).
