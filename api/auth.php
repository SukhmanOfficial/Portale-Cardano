<?php
/**
 * api/auth.php — Autenticazione e gestione account
 * Sistema Cardano Day · ITIS "G. Cardano", Pavia
 *
 * Azioni disponibili (parametro GET ?action=):
 *   register          → Registrazione genitore
 *   register_personale → Registrazione staff/professore
 *   login             → Login (tutti i ruoli)
 *   verifica_otp      → Verifica codice OTP email
 *   resend_otp        → Reinvia OTP
 *   reset_request     → Richiesta reset password
 *   reset_password    → Imposta nuova password con token
 *   logout            → Invalida sessione (lato client)
 *   me                → Dati utente corrente (richiede JWT)
 */

require_once __DIR__ . '/../includes/bootstrap.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$action = $_GET['action'] ?? '';
$body   = json_decode(file_get_contents('php://input'), true) ?? [];

try {
    switch ($action) {

        /* --------------------------------------------------
           REGISTRAZIONE GENITORE
           POST body: nome, cognome, email, password,
                      via, cap, citta, telefono
           -------------------------------------------------- */
        case 'register':
            $required = ['nome','cognome','email','password','via','cap','citta','telefono'];
            foreach ($required as $f) {
                if (empty($body[$f])) throw new ApiException("Campo obbligatorio: $f", 400);
            }

            $email = strtolower(trim($body['email']));
            if (!filter_var($email, FILTER_VALIDATE_EMAIL))
                throw new ApiException('Email non valida', 400);

            if (strlen($body['password']) < 8)
                throw new ApiException('Password troppo corta (min. 8 caratteri)', 400);

            // Controlla duplicato email
            $esiste = DB::fetchOne('SELECT id FROM utenti WHERE email = ?', [$email]);
            if ($esiste) throw new ApiException('Email già registrata', 409);

            $hash = password_hash($body['password'], PASSWORD_BCRYPT, ['cost' => 12]);
            $otp  = sprintf('%06d', random_int(0, 999999));
            $otp_scadenza = date('Y-m-d H:i:s', strtotime('+15 minutes'));

            $id = DB::insert('utenti', [
                'nome'          => trim($body['nome']),
                'cognome'       => trim($body['cognome']),
                'email'         => $email,
                'password_hash' => $hash,
                'ruolo'         => 'genitore',
                'stato'         => 'non_verificato',
                'via'           => trim($body['via']),
                'cap'           => trim($body['cap']),
                'citta'         => trim($body['citta']),
                'telefono'      => trim($body['telefono']),
                'otp_code'      => $otp,
                'otp_scadenza'  => $otp_scadenza,
            ]);

            // Invia OTP via email
            Mailer::sendOtp($email, $body['nome'], $otp);

            jsonResponse(['success' => true, 'id' => $id, 'message' => 'OTP inviato via email']);
            break;

        /* --------------------------------------------------
           REGISTRAZIONE PERSONALE (staff / professore)
           POST body: tipo, nome, cognome, email, password
           Crea account in stato "in_attesa" → segreteria approva
           -------------------------------------------------- */
        case 'register_personale':
            $required = ['tipo','nome','cognome','email','password'];
            foreach ($required as $f) {
                if (empty($body[$f])) throw new ApiException("Campo obbligatorio: $f", 400);
            }

            $tipo = $body['tipo'] === 'professore' ? 'professore' : 'staff';
            $email = strtolower(trim($body['email']));

            // Deve essere email istituzionale
            if (!str_ends_with($email, '@itiscardanopv.edu.it'))
                throw new ApiException('Email deve essere @itiscardanopv.edu.it', 400);

            $esiste = DB::fetchOne('SELECT id FROM utenti WHERE email = ?', [$email]);
            if ($esiste) throw new ApiException('Email già registrata', 409);

            if (strlen($body['password']) < 8)
                throw new ApiException('Password troppo corta (min. 8 caratteri)', 400);

            $hash = password_hash($body['password'], PASSWORD_BCRYPT, ['cost' => 12]);

            $id = DB::insert('utenti', [
                'nome'          => trim($body['nome']),
                'cognome'       => trim($body['cognome']),
                'email'         => $email,
                'password_hash' => $hash,
                'ruolo'         => $tipo,
                'stato'         => 'in_attesa',  // → segreteria approva
                'email_verificata' => 1,
            ]);

            // Notifica segreteria
            Mailer::notificaSegreteriaNuovaRichiesta($email, $body['nome'], $body['cognome'], $tipo);

            jsonResponse(['success' => true, 'id' => $id,
                'message' => 'Richiesta inviata. La segreteria esaminerà la tua domanda.']);
            break;

        /* --------------------------------------------------
           LOGIN (tutti i ruoli)
           POST body: email, password
           -------------------------------------------------- */
        case 'login':
            if (empty($body['email']) || empty($body['password']))
                throw new ApiException('Email e password obbligatorie', 400);

            $email = strtolower(trim($body['email']));
            $utente = DB::fetchOne(
                'SELECT id, nome, cognome, email, password_hash, ruolo, stato, email_verificata
                 FROM utenti WHERE email = ?',
                [$email]
            );

            if (!$utente || !password_verify($body['password'], $utente['password_hash']))
                throw new ApiException('Credenziali non valide', 401);

            if ($utente['stato'] === 'in_attesa')
                throw new ApiException('Account in attesa di approvazione dalla segreteria', 403);

            if ($utente['stato'] === 'sospeso')
                throw new ApiException('Account sospeso. Contatta la segreteria.', 403);

            if (!$utente['email_verificata'] && $utente['ruolo'] === 'genitore')
                throw new ApiException('Email non ancora verificata. Controlla la tua casella.', 403);

            // Aggiorna ultimo accesso
            DB::query('UPDATE utenti SET ultimo_accesso = NOW() WHERE id = ?', [$utente['id']]);

            // Genera JWT
            $token = JWT::generate([
                'sub'    => $utente['id'],
                'nome'   => $utente['nome'],
                'cognome'=> $utente['cognome'],
                'email'  => $utente['email'],
                'ruolo'  => $utente['ruolo'],
            ]);

            jsonResponse([
                'success' => true,
                'token'   => $token,
                'user'    => [
                    'id'      => $utente['id'],
                    'nome'    => $utente['nome'],
                    'cognome' => $utente['cognome'],
                    'email'   => $utente['email'],
                    'ruolo'   => $utente['ruolo'],
                ],
            ]);
            break;

        /* --------------------------------------------------
           VERIFICA OTP
           POST body: email, otp
           -------------------------------------------------- */
        case 'verifica_otp':
            if (empty($body['email']) || empty($body['otp']))
                throw new ApiException('Email e OTP obbligatori', 400);

            $email  = strtolower(trim($body['email']));
            $utente = DB::fetchOne(
                'SELECT id, otp_code, otp_scadenza FROM utenti WHERE email = ?',
                [$email]
            );

            if (!$utente) throw new ApiException('Utente non trovato', 404);
            if ($utente['otp_code'] !== $body['otp'])
                throw new ApiException('Codice OTP non valido', 400);
            if (strtotime($utente['otp_scadenza']) < time())
                throw new ApiException('OTP scaduto. Richiedi un nuovo codice.', 400);

            DB::query(
                'UPDATE utenti SET stato = ?, email_verificata = 1, otp_code = NULL, otp_scadenza = NULL WHERE id = ?',
                ['attivo', $utente['id']]
            );

            // Genera JWT per login automatico
            $dati = DB::fetchOne('SELECT id, nome, cognome, email, ruolo FROM utenti WHERE id = ?', [$utente['id']]);
            $token = JWT::generate(['sub'=>$dati['id'],'nome'=>$dati['nome'],'cognome'=>$dati['cognome'],'email'=>$dati['email'],'ruolo'=>$dati['ruolo']]);

            jsonResponse(['success' => true, 'token' => $token, 'user' => $dati]);
            break;

        /* --------------------------------------------------
           REINVIA OTP
           POST body: email
           -------------------------------------------------- */
        case 'resend_otp':
            if (empty($body['email'])) throw new ApiException('Email obbligatoria', 400);
            $email = strtolower(trim($body['email']));

            $utente = DB::fetchOne('SELECT id, nome FROM utenti WHERE email = ? AND email_verificata = 0', [$email]);
            if (!$utente) throw new ApiException('Utente non trovato o già verificato', 404);

            $otp = sprintf('%06d', random_int(0, 999999));
            DB::query('UPDATE utenti SET otp_code = ?, otp_scadenza = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id = ?',
                [$otp, $utente['id']]);

            Mailer::sendOtp($email, $utente['nome'], $otp);
            jsonResponse(['success' => true, 'message' => 'Nuovo OTP inviato']);
            break;

        /* --------------------------------------------------
           RICHIESTA RESET PASSWORD
           POST body: email
           -------------------------------------------------- */
        case 'reset_request':
            if (empty($body['email'])) throw new ApiException('Email obbligatoria', 400);
            $email = strtolower(trim($body['email']));

            $utente = DB::fetchOne('SELECT id, nome FROM utenti WHERE email = ?', [$email]);
            // Non rivela se l'utente esiste (sicurezza)
            if ($utente) {
                $token    = bin2hex(random_bytes(32));
                $scadenza = date('Y-m-d H:i:s', strtotime('+1 hour'));
                DB::query('UPDATE utenti SET reset_token = ?, reset_scadenza = ? WHERE id = ?',
                    [$token, $scadenza, $utente['id']]);
                Mailer::sendResetPassword($email, $utente['nome'], $token);
            }

            jsonResponse(['success' => true, 'message' => 'Se l\'email esiste, riceverai le istruzioni.']);
            break;

        /* --------------------------------------------------
           RESET PASSWORD
           POST body: token, nuova_password
           -------------------------------------------------- */
        case 'reset_verify':
            // Verifica OTP reset e restituisce token temporaneo
            $email = trim($body['email'] ?? '');
            $otp   = trim($body['otp']   ?? '');
            if (!$email || !$otp) throw new ApiException('Email e OTP obbligatori');

            $utente = DB::fetchOne(
                "SELECT id FROM utenti WHERE email = ? AND otp_code = ? AND otp_scadenza > NOW()",
                [$email, $otp]
            );
            if (!$utente) throw new ApiException('Codice non valido o scaduto', 400);

            // Genera token temporaneo per il reset
            $reset_token = bin2hex(random_bytes(16));
            DB::update('utenti', [
                'otp_code'     => null,
                'reset_token'  => $reset_token,
            ], 'id = ?', [$utente['id']]);

            jsonResponse(['success' => true, 'reset_token' => $reset_token]);
            break;

        case 'reset_password':
            if (empty($body['token']) || empty($body['nuova_password']))
                throw new ApiException('Token e nuova password obbligatori', 400);

            if (strlen($body['nuova_password']) < 8)
                throw new ApiException('Password troppo corta', 400);

            $utente = DB::fetchOne(
                'SELECT id FROM utenti WHERE reset_token = ? AND reset_scadenza > NOW()',
                [$body['token']]
            );
            if (!$utente) throw new ApiException('Token non valido o scaduto', 400);

            $hash = password_hash($body['nuova_password'], PASSWORD_BCRYPT, ['cost' => 12]);
            DB::query('UPDATE utenti SET password_hash = ?, reset_token = NULL, reset_scadenza = NULL WHERE id = ?',
                [$hash, $utente['id']]);

            jsonResponse(['success' => true, 'message' => 'Password aggiornata con successo']);
            break;

        /* --------------------------------------------------
           DATI UTENTE CORRENTE (richiede JWT)
           GET — Authorization: Bearer <token>
           -------------------------------------------------- */
        case 'me':
            $payload = JWT::verifyFromHeader();
            $utente  = DB::fetchOne(
                'SELECT id, nome, cognome, email, ruolo, stato, via, cap, citta, telefono, creato_il
                 FROM utenti WHERE id = ?',
                [$payload['sub']]
            );
            if (!$utente) throw new ApiException('Utente non trovato', 404);
            jsonResponse(['success' => true, 'user' => $utente]);
            break;

        default:
            throw new ApiException('Azione non riconosciuta', 400);
    }

} catch (ApiException $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], $e->getCode() ?: 400);
} catch (Throwable $e) {
    error_log('[auth.php] ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'Errore interno del server'], 500);
}
