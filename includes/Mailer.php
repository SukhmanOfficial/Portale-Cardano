<?php
/**
 * includes/Mailer.php — Invio email
 * Sistema Cardano Day · ITIS "G. Cardano", Pavia
 *
 * In produzione: usa PHPMailer via Composer
 *   composer require phpmailer/phpmailer
 * In sviluppo: usa mail() nativa o Mailtrap
 */

class Mailer
{
    // --------------------------------------------------------
    // OTP VERIFICA EMAIL
    // --------------------------------------------------------

    public static function sendOtp(string $email, string $nome, string $otp): void
    {
        $oggetto = 'Verifica il tuo account — ITIS G. Cardano';
        $corpo   = self::templateOtp($nome, $otp);
        self::send($email, $oggetto, $corpo);
    }

    // --------------------------------------------------------
    // RESET PASSWORD
    // --------------------------------------------------------

    public static function sendResetPassword(string $email, string $nome, string $token): void
    {
        $link    = APP_URL . '/reset-password.html?token=' . $token;
        $oggetto = 'Reset password — ITIS G. Cardano';
        $corpo   = self::templateReset($nome, $link);
        self::send($email, $oggetto, $corpo);
    }

    // --------------------------------------------------------
    // QR CODE ISCRIZIONE
    // --------------------------------------------------------

    public static function sendQrIscrizione(
        string $email,
        string $nome,
        string $evento,
        string $data_evento,
        string $qr_token,
        string $gruppo = ''
    ): void {
        $oggetto = "Iscrizione confermata — $evento";
        $corpo   = self::templateQr($nome, $evento, $data_evento, $qr_token, $gruppo);
        self::send($email, $oggetto, $corpo);
    }

    // --------------------------------------------------------
    // NOTIFICA SEGRETERIA — nuova richiesta staff
    // --------------------------------------------------------

    public static function notificaSegreteriaNuovaRichiesta(
        string $email,
        string $nome,
        string $cognome,
        string $ruolo
    ): void {
        // Recupera email segreteria (dalla tabella utenti)
        try {
            $segreterie = DB::fetchAll(
                "SELECT email FROM utenti WHERE ruolo IN ('segreteria','admin') AND stato = 'attivo'"
            );
            foreach ($segreterie as $seg) {
                $oggetto = "Nuova richiesta accesso $ruolo — $nome $cognome";
                $corpo   = self::templateRichiestaStaff($nome, $cognome, $email, $ruolo);
                self::send($seg['email'], $oggetto, $corpo);
            }
        } catch (Throwable $e) {
            error_log('[Mailer] notifica segreteria fallita: ' . $e->getMessage());
        }
    }

    // --------------------------------------------------------
    // NOTIFICA GRUPPO ASSEGNATO
    // --------------------------------------------------------

    public static function sendGruppoAssegnato(
        string $email,
        string $nome,
        string $evento,
        string $gruppo,
        string $data_evento
    ): void {
        $oggetto = "Gruppo assegnato — $evento";
        $corpo   = self::templateGruppo($nome, $evento, $gruppo, $data_evento);
        self::send($email, $oggetto, $corpo);
    }

    // --------------------------------------------------------
    // INVIO GENERICO
    // --------------------------------------------------------

    public static function sendGenerico(string $email, string $oggetto, string $testo): void
    {
        self::send($email, $oggetto, self::templateGenerico($testo));
    }

    // --------------------------------------------------------
    // CORE SEND
    // --------------------------------------------------------

    private static function send(string $to, string $subject, string $html): void
    {
        // === PRODUZIONE con PHPMailer ===
        /*
        require_once __DIR__ . '/../vendor/autoload.php';
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        $mail->isSMTP();
        $mail->Host       = MAIL_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = MAIL_USER;
        $mail->Password   = MAIL_PASS;
        $mail->SMTPSecure = 'tls';
        $mail->Port       = MAIL_PORT;
        $mail->CharSet    = 'UTF-8';
        $mail->setFrom(MAIL_FROM, MAIL_NAME);
        $mail->addAddress($to);
        $mail->Subject = $subject;
        $mail->isHTML(true);
        $mail->Body    = $html;
        $mail->AltBody = strip_tags($html);
        $mail->send();
        */

        // === SVILUPPO: mail() nativa ===
        $headers  = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "From: " . MAIL_NAME . " <" . MAIL_FROM . ">\r\n";

        if (APP_ENV === 'development') {
            // In sviluppo: logga invece di inviare
            error_log("[Mailer] TO: $to | SUBJECT: $subject");
        } else {
            mail($to, $subject, $html, $headers);
        }
    }

    // --------------------------------------------------------
    // TEMPLATE HTML
    // --------------------------------------------------------

    private static function wrap(string $contenuto): string
    {
        return <<<HTML
<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#1A1A1A;padding:24px 32px;display:flex;align-items:center;gap:16px;">
      <div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">
        ITIS <span style="color:#E8500A;">"G. Cardano"</span>
      </div>
      <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-left:auto;">Pavia</div>
    </div>
    <div style="padding:32px;">
      $contenuto
    </div>
    <div style="padding:20px 32px;background:#F5F5F5;font-size:12px;color:#888;text-align:center;">
      ITIS "G. Cardano" · Via Verdi 19 · 27100 Pavia<br>
      <a href="mailto:info@itiscardanopv.edu.it" style="color:#E8500A;">info@itiscardanopv.edu.it</a>
    </div>
  </div>
</body>
</html>
HTML;
    }

    private static function templateOtp(string $nome, string $otp): string
    {
        return self::wrap(<<<HTML
<h2 style="margin:0 0 8px;color:#1A1A1A;font-size:24px;">Ciao, {$nome}!</h2>
<p style="color:#555;line-height:1.7;">Per completare la registrazione inserisci il codice qui sotto:</p>
<div style="text-align:center;margin:32px 0;">
  <div style="display:inline-block;background:#F5F5F5;border:2px solid #E0E0E0;border-radius:12px;padding:20px 40px;letter-spacing:12px;font-size:36px;font-weight:900;color:#E8500A;">{$otp}</div>
</div>
<p style="color:#888;font-size:13px;">Il codice scade tra <strong>15 minuti</strong>. Non condividerlo con nessuno.</p>
HTML);
    }

    private static function templateReset(string $nome, string $link): string
    {
        return self::wrap(<<<HTML
<h2 style="margin:0 0 8px;color:#1A1A1A;font-size:24px;">Reset password</h2>
<p style="color:#555;line-height:1.7;">Ciao <strong>{$nome}</strong>, hai richiesto il reset della password. Clicca il pulsante:</p>
<div style="text-align:center;margin:32px 0;">
  <a href="{$link}" style="background:#E8500A;color:#fff;padding:14px 32px;border-radius:8px;font-weight:700;font-size:16px;text-decoration:none;display:inline-block;">Reimposta password</a>
</div>
<p style="color:#888;font-size:13px;">Il link scade tra <strong>1 ora</strong>. Se non hai richiesto il reset, ignora questa email.</p>
HTML);
    }

    private static function templateQr(string $nome, string $evento, string $data, string $token, string $gruppo): string
    {
        $gruppoHtml = $gruppo ? "<p style='color:#555;'>Gruppo assegnato: <strong style='color:#E8500A;font-size:20px;'>$gruppo</strong></p>" : "<p style='color:#888;font-size:13px;'>Il gruppo verrà comunicato dalla segreteria dopo la chiusura delle iscrizioni.</p>";
        return self::wrap(<<<HTML
<h2 style="margin:0 0 8px;color:#1A1A1A;font-size:24px;">✅ Iscrizione confermata!</h2>
<p style="color:#555;line-height:1.7;">Ciao <strong>{$nome}</strong>, la tua iscrizione a <strong>{$evento}</strong> del <strong>{$data}</strong> è confermata.</p>
{$gruppoHtml}
<p style="color:#555;">Il tuo codice QR: <code style="background:#F5F5F5;padding:4px 8px;border-radius:4px;font-size:13px;">{$token}</code></p>
<p style="color:#888;font-size:13px;">Il giorno dell'evento il QR verrà scansionato in 4 momenti: Entrata · Lab T1 · Lab T2 · Uscita.</p>
HTML);
    }

    private static function templateRichiestaStaff(string $nome, string $cognome, string $email, string $ruolo): string
    {
        return self::wrap(<<<HTML
<h2 style="margin:0 0 8px;color:#1A1A1A;">Nuova richiesta di accesso</h2>
<p style="color:#555;line-height:1.7;"><strong>{$nome} {$cognome}</strong> ha richiesto accesso come <strong>{$ruolo}</strong>.</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
  <tr><td style="padding:8px;color:#888;font-size:13px;">Email:</td><td style="padding:8px;font-weight:600;">{$email}</td></tr>
  <tr><td style="padding:8px;color:#888;font-size:13px;">Ruolo:</td><td style="padding:8px;font-weight:600;">{$ruolo}</td></tr>
</table>
<p style="color:#555;">Accedi al pannello segreteria per approvare o rifiutare.</p>
HTML);
    }

    private static function templateGruppo(string $nome, string $evento, string $gruppo, string $data): string
    {
        return self::wrap(<<<HTML
<h2 style="margin:0 0 8px;color:#1A1A1A;">Gruppo assegnato — {$evento}</h2>
<p style="color:#555;line-height:1.7;">Ciao <strong>{$nome}</strong>, è stato assegnato il gruppo per <strong>{$evento}</strong> del <strong>{$data}</strong>.</p>
<div style="text-align:center;margin:24px 0;">
  <div style="display:inline-block;background:#E8500A;color:#fff;border-radius:12px;padding:16px 40px;font-size:40px;font-weight:900;letter-spacing:4px;">{$gruppo}</div>
</div>
<p style="color:#888;font-size:13px;">Accedi all'area personale per vedere i dettagli completi.</p>
HTML);
    }

    private static function templateGenerico(string $testo): string
    {
        return self::wrap("<p style='color:#555;line-height:1.8;'>$testo</p>");
    }
}
