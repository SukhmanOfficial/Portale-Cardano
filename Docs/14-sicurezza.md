# 14 — Sicurezza

> **Tipo documento:** Tecnico (sviluppatori)  
> **Sezione PDF:** §14

---

## Panoramica misure di sicurezza

| Area | Misura |
|------|--------|
| Password | Hash bcrypt — mai in chiaro |
| Sessione | JWT firmato HS256, durata 7 giorni |
| Database | PDO prepared statements |
| Autorizzazione | RBAC su ogni endpoint |
| Registrazione staff | Pagina nascosta, non indicizzata |
| Verifica email | OTP a 6 cifre, invalidato dopo l'uso |
| QR code | `crypto.randomBytes()` di Node.js |
| CORS | Solo origini autorizzate |

---

## Password

- Memorizzate con **hash bcrypt** tramite `password_hash()` di PHP
- La verifica avviene con `password_verify()` — **mai** confronto in chiaro
- Il campo `password` nel database contiene solo l'hash
- Indicatore di forza password nel form di registrazione

---

## Token JWT

```
Algoritmo:  HS256
Durata:     7 giorni
Header:     Authorization: Bearer <token>
Payload:    { id, email, ruolo, nome, cognome }
```

- Il token **non contiene la password**
- Se il ruolo viene modificato, l'utente deve riloggare per aggiornare il token
- Il token è firmato con una chiave segreta lato server

---

## Protezione SQL Injection

Tutte le query al database usano **PDO prepared statements**:

```php
$stmt = $pdo->prepare("SELECT * FROM utenti WHERE email = ?");
$stmt->execute([$email]);
```

Nessuna concatenazione diretta di input utente nelle query.

---

## RBAC — Role-Based Access Control

Ogni endpoint PHP verifica il ruolo dell'utente prima di eseguire la logica:

```
Richiesta → Verifica JWT → Estrai ruolo → Controlla permessi → Esegui / 403 Forbidden
```

| Ruolo | Valore ENUM |
|-------|-------------|
| Genitore | `genitore` |
| Staff/Professore | `staff_professore` |
| Segreteria | `segreteria` |

---

## Verifica Email (OTP)

- Alla registrazione viene inviato un **codice OTP a 6 cifre** via email
- Il codice è memorizzato in `utenti.codice_verifica`
- L'account rimane inattivo (`verificato = 0`) fino alla verifica
- Il codice viene **invalidato e rimosso** dopo l'uso

---

## QR Code — Generazione sicura

```javascript
// Node.js
const crypto = require('crypto');
const qrCode = crypto.randomBytes(32).toString('hex'); // 64 char hex
```

- Ogni QR code è **univoco e imprevedibile**
- Generato da Node.js con il CSPRNG del sistema operativo
- Memorizzato nella colonna `iscrizioni.qr_code`

---

## Pagina registrazione Staff/Professore

- URL **non collegato** dal menu principale
- URL **non indicizzato** dai motori di ricerca (`robots.txt` o `noindex`)
- Comunicato solo internamente dalla scuola
- Richiede email con dominio `@itiscardanopv.edu.it`
- L'account rimane inattivo fino all'approvazione della segreteria

---

## CORS

```php
header("Access-Control-Allow-Origin: https://cardanoday.itiscardanopv.edu.it");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Authorization, Content-Type");
```

Solo l'origine del frontend autorizzato può effettuare richieste API.

---

## Recupero password

- Il codice di reset è **temporaneo** e ha scadenza
- Viene invalidato dopo l'utilizzo
- Non rivela se l'email esiste nel sistema (prevenzione user enumeration)

---

## Checklist sicurezza sviluppatore

- [ ] Tutte le query usano PDO prepared statements
- [ ] Ogni endpoint protetto verifica il JWT
- [ ] Il ruolo viene controllato su ogni endpoint con logica privilegiata
- [ ] Nessuna password in chiaro nel DB o nei log
- [ ] OTP invalidato dopo l'uso
- [ ] CORS configurato solo per origini autorizzate
- [ ] QR code generati con `crypto.randomBytes()`
- [ ] URL registrazione staff non indicizzato
