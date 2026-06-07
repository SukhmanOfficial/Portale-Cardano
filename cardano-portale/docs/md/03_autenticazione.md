# 03 — Autenticazione

Il sistema prevede **due percorsi di accesso distinti** che non si incrociano mai:
1. **Percorso pubblico** — per i genitori (home page)
2. **Percorso riservato** — per Staff, Professori, Segreteria e Admin (URL separato)

---

## 3.1 — Registrazione Genitore (pagina pubblica)

Accessibile dalla home page tramite il pulsante "Registrati". Tutti i campi sono obbligatori.

### Campi del modulo

| Campo | Tipo | Note |
|-------|------|------|
| Nome | Testo | Obbligatorio |
| Cognome | Testo | Obbligatorio |
| Email | Email | Univoca nel sistema — usata per login e comunicazioni |
| Password | Password | Minimo 8 caratteri, indicatore di forza, icona mostra/nascondi |
| Conferma password | Password | Deve coincidere con il campo precedente |
| Via e numero civico | Testo | Inseriti manualmente — nessun completamento automatico |
| CAP | Testo | Inserimento manuale → Città compilata automaticamente |
| Città | Testo | Inserimento manuale → CAP compilato automaticamente |
| Cellulare | Testo | Numero del genitore per comunicazioni urgenti |

### Compilazione automatica CAP ↔ Città

```
Genitore inserisce CAP  →  sistema compila Città automaticamente
Genitore inserisce Città →  sistema compila CAP automaticamente
Via e numero civico      →  sempre manuali (nessun autocomplete)
Genitore può sempre sovrascrivere manualmente i valori automatici
```

### Processo di registrazione

```
1. Genitore compila il modulo
2. Sistema verifica che l'email non sia già registrata
3. Sistema crea l'account con stato "non verificato"
4. Sistema invia codice OTP a 6 cifre via email
5. Genitore inserisce il codice OTP
6. Account attivato → ruolo "Genitore" assegnato automaticamente
```

> ⚠️ L'account **non è attivo** finché non viene inserito il codice OTP corretto. Il codice OTP scade dopo 15 minuti.

---

## 3.2 — Registrazione Staff / Professore (URL separato)

Il modulo è accessibile dall'URL riservato al personale. Richiede obbligatoriamente un'email istituzionale.

### Campi del modulo

| Campo | Tipo | Note |
|-------|------|------|
| Tipo | Selezione | Staff oppure Professore |
| Nome | Testo | Obbligatorio |
| Cognome | Testo | Obbligatorio |
| Email istituzionale | Email | **Solo** `@itiscardanopv.edu.it` — validata lato server |
| Password | Password | Minimo 8 caratteri, indicatore di forza |
| Conferma password | Password | Deve coincidere |

### Processo di approvazione

```
1. Staff/Professore compila il modulo con email @itiscardanopv.edu.it
2. Richiesta inviata alla segreteria (notifica)
3. Segreteria approva o rifiuta la richiesta
4. Se approvata: email di conferma inviata al richiedente
5. Account attivo → può accedere al sistema
```

> ⚠️ L'account **non è attivo** finché la segreteria non approva la richiesta. Non esiste auto-attivazione per Staff/Professori.

---

## 3.3 — Ruolo Segreteria

Il ruolo Segreteria **non ha una registrazione autonoma**. Viene assegnato esclusivamente dall'Admin.

```
Admin → pannello Admin → "Promuovi a Segreteria" → utente Staff/Prof. ottiene ruolo Segreteria
```

---

## 3.4 — Login

Il login è unificato per tutti i ruoli ma avviene da pagine diverse:

| Ruolo | Pagina di login |
|-------|----------------|
| Genitore | Home page pubblica (`/login`) |
| Staff / Professore | URL separato non pubblico |
| Segreteria | URL separato non pubblico |
| Admin | URL separato non pubblico |

### Processo di login

```
1. Utente inserisce email e password
2. Sistema verifica credenziali (bcrypt)
3. Se corretto: sistema emette token JWT (HS256, 7 giorni)
4. Token salvato sul client e incluso in ogni richiesta API
   Header: Authorization: Bearer <token>
```

### Opzioni pagina login

- ☑ **Ricordami per 7 giorni** — mantiene la sessione attiva
- **Password dimenticata?** — reset via email con codice temporaneo
- Messaggio di errore in caso di credenziali errate

---

## 3.5 — Token JWT

| Proprietà | Valore |
|-----------|--------|
| Algoritmo | HS256 |
| Durata | 7 giorni |
| Contenuto | ID utente, email, ruolo, nome, cognome |
| Rinnovo | L'utente deve effettuare nuovamente il login alla scadenza |
| Aggiornamento ruolo | Se il ruolo cambia, l'utente deve rilogarsi per ottenere token aggiornato |

### Payload JWT

```json
{
  "id": 7,
  "email": "mario.rossi@email.it",
  "ruolo": "genitore",
  "nome": "Mario",
  "cognome": "Rossi",
  "iat": 1699000000,
  "exp": 1699604800
}
```

> ⚠️ Il token **non contiene la password**. La password è conservata solo nel database come hash bcrypt, mai in chiaro.

---

## 3.6 — Recupero Password

```
1. Utente clicca "Password dimenticata?"
2. Inserisce l'email del proprio account
3. Sistema invia email con codice temporaneo di reset
4. Utente inserisce il codice e setta la nuova password
5. Codice invalidato dopo l'uso
```

---

## 3.7 — Separazione dei percorsi

```
HOME PAGE (pubblica)
├── /login              → Accesso genitore
├── /registrazione      → Registrazione genitore
└── ...

URL SEPARATO (non pubblico, non indicizzato)
├── Login Staff/Prof/Segreteria/Admin
├── Registrazione Staff/Professore
└── (comunicato internamente dalla scuola)
```

> ✅ I due percorsi non si incrociano mai. Un genitore non può accedere all'URL del personale e viceversa.

---

*Sezione precedente: [02 — Tecnologie](../02_tecnologie/02_tecnologie.md) | Successiva: [04 — Ruoli](../04_ruoli/04_ruoli.md)*
