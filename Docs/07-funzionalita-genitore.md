# 07 — Funzionalità Genitore

> **Tipo documento:** Guida utente + Tecnico  
> **Sezione PDF:** §7  
> **Ruolo:** Genitore

---

## Area personale

Dopo il login il genitore accede alla propria **area personale** da cui gestisce figli, iscrizioni e QR code.

---

## Iscrizione a un evento

### Flusso

1. Scegliere un evento tra quelli disponibili nel periodo di iscrizione aperto
2. Selezionare il figlio da iscrivere tra quelli inseriti
3. Scegliere il tipo di evento:
   - **Open Day** → scegliere 1 dei 3 percorsi (Misto, Liceo, Tecnico)
   - **Cardano Day** → scegliere 1 o 2 laboratori (massimo 1 per turno)
4. Ricevere conferma immediata con riepilogo iscrizione e percorso/gruppo assegnato

> Gli orari dei laboratori (Cardano Day) vengono **assegnati automaticamente** dal sistema per bilanciare i gruppi. Il genitore **non sceglie l'orario**.

---

## Email di conferma iscrizione

Dopo l'iscrizione il genitore riceve automaticamente un'email contenente:

| Contenuto | Dettaglio |
|-----------|-----------|
| Riepilogo iscrizione | Nome studente e genitore, evento, data, orari |
| Assegnazione gruppo | Percorso/gruppo assegnato |
| Laboratori (Cardano Day) | Laboratori assegnati con orari e numero di aula |
| **QR code PDF** | Allegato PDF pronto da stampare o mostrare da smartphone |
| Istruzioni | Come presentarsi il giorno dell'evento |

---

## Operazioni disponibili dopo l'iscrizione

- ✅ Visualizzare lo **stato dell'iscrizione**
- ✅ **Annullare** l'iscrizione entro la data di chiusura
- ✅ **Scaricare nuovamente** il QR code in qualsiasi momento
- ✅ Consultare lo **storico** di tutte le iscrizioni passate

---

## Blocchi automatici del sistema

Il sistema impedisce automaticamente le seguenti operazioni:

| Blocco | Motivo |
|--------|--------|
| Iscrizione prima dell'apertura | Finestra non ancora aperta |
| Iscrizione dopo la chiusura | Finestra scaduta |
| Iscrizione con posti esauriti | Capienza massima raggiunta |
| Stesso figlio due volte allo stesso evento | Duplicato |
| Percorso Open Day con posti esauriti | Capienza percorso raggiunta |
| Laboratorio Cardano Day con aule piene | Capienza laboratorio raggiunta |
| Figlio già partecipante allo stesso tipo di evento | Regola anti-riscrittura (§9.2) |

> **Regola anti-riscrittura:** Un figlio che ha già **partecipato** a un Open Day (firma entrata registrata) NON può iscriversi a un successivo Open Day. Stessa regola per il Cardano Day. Il blocco scatta solo dopo la partecipazione effettiva. Se l'iscrizione viene annullata prima dell'evento, il figlio può reiscriversi.

---

## Endpoint correlati

```
GET    /api/users/?action=figli      → Lista figli
POST   /api/registrations/           → Crea iscrizione
DELETE /api/registrations/?id=N      → Annulla iscrizione
```

---

## Tabella iscrizioni (DB) — campi rilevanti

```sql
iscrizioni
├── id              INT PK
├── id_figlio       INT FK → figli
├── id_evento       INT FK → eventi
├── id_percorso     INT FK → percorsi_open_day (NULL per Cardano Day)
├── qr_code         VARCHAR(32) -- hex, generato da Node.js
└── stato           ENUM('confermata', 'annullata')
```
