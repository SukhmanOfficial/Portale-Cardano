# 14 — Sicurezza

## 14.1 — Panoramica

Il sistema implementa le best practice di sicurezza web a tutti i livelli: autenticazione, autorizzazione, protezione dati, sicurezza degli endpoint e generazione sicura dei codici.

---

## 14.2 — Gestione Password

| Misura | Dettaglio |
|--------|-----------|
| **Hashing** | `password_hash()` PHP con algoritmo **bcrypt** (cost factor 12) |
| **Verifica** | `password_verify()` — confronto sicuro contro timing attack |
| **Storage** | Mai salvate in chiaro nel database |
| **Trasmissione** | Solo via HTTPS — mai in query string |
| **Requisiti** | Minimo 8 caratteri |
| **Indicatore forza** | Feedback visivo in tempo reale durante la registrazione |

```php
// Salvataggio password
$hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

// Verifica al login
if (password_verify($input_password, $hash_dal_db)) {
    // Login valido
}
```

---

## 14.3 — Token JWT

| Proprietà | Valore |
|-----------|--------|
| Algoritmo | **HS256** (HMAC-SHA256) |
| Chiave | Stringa segreta conservata in variabile d'ambiente (non nel codice) |
| Durata | 7 giorni |
| Contenuto | ID, email, ruolo, nome, cognome — **mai la password** |
| Rinnovo | Al nuovo login |
| Revoca | In caso di cambio ruolo, l'utente deve rilogarsi |

```php
// Generazione token JWT
$payload = [
    'id'      => $user['id'],
    'email'   => $user['email'],
    'ruolo'   => $user['ruolo'],
    'nome'    => $user['nome'],
    'cognome' => $user['cognome'],
    'iat'     => time(),
    'exp'     => time() + (7 * 24 * 3600)
];
$token = JWT::encode($payload, $_ENV['JWT_SECRET'], 'HS256');
```

---

## 14.4 — Protezione SQL Injection

Tutte le query utilizzano **PDO Prepared Statements**. Nessuna concatenazione di stringhe con input utente.

```php
// ✅ Corretto — Prepared Statement
$stmt = $pdo->prepare("SELECT * FROM utenti WHERE email = ? AND verificato = 1");
$stmt->execute([$email]);
$user = $stmt->fetch();

// ❌ Mai — Query concatenata
$query = "SELECT * FROM utenti WHERE email = '$email'"; // vulnerabile!
```

---

## 14.5 — Controllo Ruoli (RBAC)

Ogni endpoint API verifica il ruolo dell'utente tramite il token JWT prima di qualsiasi operazione.

```php
// Middleware di autenticazione e autorizzazione
function requireRole(array $ruoliConsentiti): array {
    $token = getBearerToken();
    
    if (!$token) {
        http_response_code(401);
        die(json_encode(['error' => 'Token mancante']));
    }
    
    try {
        $payload = JWT::decode($token, new Key($_ENV['JWT_SECRET'], 'HS256'));
    } catch (Exception $e) {
        http_response_code(401);
        die(json_encode(['error' => 'Token non valido o scaduto']));
    }
    
    if (!in_array($payload->ruolo, $ruoliConsentiti)) {
        http_response_code(403);
        die(json_encode(['error' => 'Accesso non autorizzato']));
    }
    
    return (array) $payload;
}

// Utilizzo negli endpoint
$user = requireRole(['segreteria']); // Solo Segreteria
$user = requireRole(['staff_professore', 'segreteria']); // Staff o Segreteria
```

---

## 14.6 — Verifica Email (OTP)

| Proprietà | Valore |
|-----------|--------|
| Tipo codice | 6 cifre numeriche |
| Generazione | `random_int(100000, 999999)` — crittograficamente sicuro |
| Scadenza | 15 minuti |
| Invalidazione | Cancellato dal DB dopo l'uso corretto |
| Tentativi falliti | Codice non invalidato (l'utente può riprovare fino alla scadenza) |

```php
$otp = random_int(100000, 999999);
$scadenza = date('Y-m-d H:i:s', strtotime('+15 minutes'));
```

---

## 14.7 — Generazione QR Code

I QR code vengono generati con Node.js usando `crypto.randomBytes()`:

```javascript
const crypto = require('crypto');

// 32 caratteri hex crittograficamente sicuri
const codice = crypto.randomBytes(16).toString('hex');
// Esempio: "a3f8c2d1e6b4927f3c8e5a1b9d7f4e2c"
```

| Proprietà | Valore |
|-----------|--------|
| Lunghezza | 32 caratteri hex (128 bit di entropia) |
| Unicità | Garantita da UNIQUE constraint nel DB |
| Generazione | `crypto.randomBytes()` — CSPRNG |
| Contenuto QR | Solo il codice hex — nessun dato personale incorporato |

---

## 14.8 — URL Personale Non Pubblico

L'URL di accesso per Staff, Professori, Segreteria e Admin è protetto da:

- **Non indicizzato**: tag `<meta name="robots" content="noindex, nofollow">` e `robots.txt`
- **Non collegato**: nessun link dal menu pubblico o dalla home page
- **Comunicato internamente**: distribuito solo via canali interni scolastici
- **Non predittibile**: l'URL non segue pattern ovvi

```
# robots.txt
User-agent: *
Disallow: /accesso-personale/
```

---

## 14.9 — CORS

Gli header CORS sono configurati per accettare solo origini autorizzate:

```php
header("Access-Control-Allow-Origin: https://cardanoday.itiscardanopv.edu.it");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
```

---

## 14.10 — Riepilogo Misure di Sicurezza

| Misura | Implementazione |
|--------|----------------|
| Password hashing | bcrypt cost 12 |
| Autenticazione stateless | JWT HS256, 7 giorni |
| Protezione SQL injection | PDO Prepared Statements |
| Autorizzazione per ruolo | RBAC su ogni endpoint |
| Verifica email | OTP 6 cifre, scadenza 15 min |
| QR code sicuri | crypto.randomBytes() 128 bit |
| URL personale nascosto | Non indicizzato, non collegato |
| CORS | Solo origini autorizzate |
| HTTPS | Trasmissione cifrata di tutti i dati |

---

*Sezione precedente: [13 — Database](../13_database/13_database.md) | Successiva: [15 — Flusso Completo](../15_flusso/15_flusso.md)*
