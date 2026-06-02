# 11 — Pannello Admin

## 11.1 — Descrizione

Il pannello Admin è accessibile **esclusivamente** tramite l'URL separato del personale. L'Admin ha **visibilità completa** su tutto il sistema ma può **modificare solo il ruolo Segreteria** degli utenti.

> ⚠️ L'Admin NON può assegnare il ruolo Admin ad altri utenti. Solo la configurazione iniziale del sistema può creare un nuovo Admin.

---

## 11.2 — Cosa PUÒ fare l'Admin

| Funzionalità | Tipo di accesso |
|-------------|:---------------:|
| Visualizzare tutti gli utenti | 🔒 Sola lettura |
| Visualizzare tutti gli eventi | 🔒 Sola lettura |
| Visualizzare tutte le iscrizioni | 🔒 Sola lettura |
| Visualizzare statistiche e dashboard | 🔒 Sola lettura |
| **Assegnare ruolo Segreteria** | ✏️ Azione disponibile |
| **Revocare ruolo Segreteria** | ✏️ Azione disponibile |

---

## 11.3 — Cosa NON PUÒ fare l'Admin

| Azione vietata | Riservato a |
|---------------|-------------|
| Creare / modificare / eliminare eventi | Segreteria |
| Approvare richieste Staff/Professore | Segreteria |
| Eliminare utenti | Segreteria |
| Eseguire divisione gruppi | Segreteria |
| Esportare file Excel | Segreteria |
| Assegnare ruolo Admin | Nessuno (solo configurazione iniziale) |

---

## 11.4 — Dashboard Admin

La dashboard mostra le stesse KPI della segreteria ma **tutte in sola lettura**:

| KPI | Tipo |
|-----|------|
| Iscrizioni totali | 🔒 Sola lettura |
| Utenti attivi | 🔒 Sola lettura |
| Eventi in programma | 🔒 Sola lettura |
| Segreterie attive | 🔒 Gestibile da Admin |

### Banner informativo

```
🔒 Pannello Admin — Accesso limitato

L'Admin ha visibilità completa in sola lettura.
L'unica azione disponibile è assegnare o revocare il ruolo Segreteria.
Nessuna modifica a eventi, iscrizioni o utenti è permessa.
```

---

## 11.5 — Gestione Ruolo Segreteria

L'unica azione operativa disponibile per l'Admin è la gestione del ruolo Segreteria.

### Regole

- Solo utenti con ruolo **Staff/Professore** possono essere promossi a Segreteria
- I **Genitori** non possono essere promossi (pulsante "Non applicabile")
- L'**Admin** non può essere assegnato da qui
- Un utente Segreteria può avere il ruolo **revocato** (torna a Staff/Professore)

### Tabella gestione ruolo Segreteria

| Utente | Ruolo attuale | Stato | Azione Admin |
|--------|--------------|-------|-------------|
| Giulia Ferrari | Segreteria | ● Attiva | [Revoca Segreteria] |
| Marco Bianchi | Segreteria | ● Attivo | [Revoca Segreteria] |
| Sara Verdi | Staff/Prof. | ● Attiva | [Promuovi a Segreteria] |
| Luca Conti | Staff/Prof. | ● Attivo | [Promuovi a Segreteria] |
| Mario Rossi | Genitore | ● Attivo | Non applicabile |

---

## 11.6 — Visualizzazione Utenti (Sola Lettura)

L'Admin può vedere la lista completa di tutti gli utenti del sistema:

| Colonna | Descrizione |
|---------|-------------|
| Nome | Nome e cognome |
| Email | Indirizzo email |
| Ruolo | Badge colorato |
| Stato account | ● Attivo · ○ Non verificato |
| Iscrizioni | Numero iscrizioni (solo Genitori) |

> Nessun pulsante di modifica o eliminazione è disponibile per l'Admin nella lista utenti. Solo "Solo lettura".

---

## 11.7 — Visualizzazione Eventi (Sola Lettura)

L'Admin vede l'elenco degli eventi con:

| Colonna | Descrizione |
|---------|-------------|
| Tipo | Open Day / Cardano Day |
| Data | Data dell'evento |
| Iscrizioni | N/N iscritti / posti |
| Stato | Attivo · In attesa · Bozza |
| 🔒 | Icona lucchetto (nessuna azione disponibile) |

---

*Sezione precedente: [10 — Segreteria](../10_segreteria/10_segreteria.md) | Successiva: [12 — API REST](../12_api/12_api.md)*
