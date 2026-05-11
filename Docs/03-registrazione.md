# 03 — Registrazione Utente

> **Tipo documento:** Tecnico + Guida utente  
> **Sezione PDF:** §3  

---

## Panoramica

Esistono due percorsi di registrazione distinti:

| Percorso | URL | Chi può accedere |
|----------|-----|-----------------|
| Registrazione Genitore | `/registrazione` (pubblica) | Chiunque |
| Registrazione Staff/Professore | `/registrazione-personale` (nascosta) | Solo personale scolastico |

---

## 3.1 — Registrazione Genitore (pagina pubblica)

Accessibile dalla home page tramite il pulsante **"Registrati"**. Tutti i campi sono obbligatori.

### Campi del modulo

| Campo | Descrizione |
|-------|-------------|
| Nome e Cognome | Dati anagrafici del genitore |
| Indirizzo email | Usato per login e comunicazioni |
| Password | Minimo 8 caratteri, con indicatore di forza |
| Conferma password | Deve coincidere con il campo precedente |
| Indirizzo di residenza | Via, numero civico, CAP, città (con autocompletamento — vedi §6.2) |
| Numero di cellulare | Contatto urgente del genitore |

### Flusso di registrazione

1. Il genitore compila il modulo
2. Il sistema verifica che l'email non sia già registrata
3. Viene inviato un **codice OTP a 6 cifre** via email
4. Il genitore inserisce il codice OTP per attivare l'account
5. L'account è attivo e il ruolo assegnato è automaticamente **Genitore**

### Funzionalità UX

- **Icona occhio** per mostrare/nascondere la password
- **Indicatore di forza password** in tempo reale
- **Autocompletamento indirizzo** via API interna (→ vedi §6.2)
- L'account **non è attivo** finché l'OTP non viene verificato

> **Nota:** Indirizzo e cellulare vengono raccolti durante la registrazione del genitore, **non** in fase di inserimento figlio. Questo centralizza i dati di contatto nel profilo genitore.

---

## 3.2 — Registrazione Staff / Professore (pagina nascosta)

La pagina **non è collegata dal menu** e non è indicizzata. L'URL è comunicato internamente dalla scuola.

### URL
```
/registrazione-personale
```

### Requisiti

- Email con dominio obbligatorio: `@itiscardanopv.edu.it`
- Tutti i campi del modulo sono obbligatori

### Flusso di approvazione

1. Il richiedente compila il modulo con email istituzionale
2. La richiesta viene inviata alla **segreteria per approvazione**
3. Il richiedente riceve una **email di conferma della ricezione**
4. La segreteria approva o rifiuta dal pannello admin
5. Solo dopo l'approvazione l'account diventa attivo con ruolo Staff/Professore

> **Importante:** Senza l'approvazione della segreteria non è possibile accedere al sistema con ruolo Staff o Professore, anche se la compilazione del modulo è completata.

---

## Endpoint correlati

```
POST /api/auth/?action=register         → Registrazione genitore
POST /api/auth/?action=register-staff   → Richiesta ruolo staff/professore
POST /api/auth/?action=verify           → Verifica OTP email
```

---

## Tabella richieste_ruolo (DB)

```sql
richieste_ruolo
├── id              INT PK
├── id_utente       INT FK → utenti
├── ruolo_richiesto ENUM('staff', 'professore')
└── stato           ENUM('in_attesa', 'approvata', 'rifiutata')
```
