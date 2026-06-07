<?php
/**
 * api/notifications.php — Invio notifiche email
 * Sistema Cardano Day · ITIS "G. Cardano", Pavia
 *
 * POST ?action=send    → Invia email a gruppo di destinatari
 * GET  ?action=list    → Storico notifiche inviate
 */

require_once __DIR__ . '/../includes/bootstrap.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$action = $_GET['action'] ?? '';
$body   = json_decode(file_get_contents('php://input'), true) ?? [];

try {
    switch ($action) {

        /* --------------------------------------------------
           INVIA NOTIFICA
           POST body: id_evento (opt), destinatari, oggetto, corpo
           -------------------------------------------------- */
        case 'send':
            requireAuth(['segreteria', 'admin']);

            $destinatari = trim($body['destinatari'] ?? '');
            $oggetto     = trim($body['oggetto']     ?? '');
            $corpo       = trim($body['corpo']       ?? '');
            $id_evento   = !empty($body['id_evento']) ? (int)$body['id_evento'] : null;

            if (!$destinatari || !$oggetto || !$corpo)
                throw new ApiException('Destinatari, oggetto e corpo sono obbligatori', 400);

            // Recupera email destinatari in base alla selezione
            $emails = recuperaDestinatari($destinatari, $id_evento);

            if (empty($emails))
                throw new ApiException('Nessun destinatario trovato', 404);

            // Invia email a tutti
            $inviati = 0;
            foreach ($emails as $email) {
                try {
                    Mailer::sendGenerico($email['email'], $oggetto, nl2br(htmlspecialchars($corpo)));
                    $inviati++;
                } catch (Throwable $e) {
                    error_log('[notifications] Errore invio a ' . $email['email'] . ': ' . $e->getMessage());
                }
            }

            // Log nel DB
            DB::insert('notifiche_email', [
                'id_evento'      => $id_evento,
                'oggetto'        => $oggetto,
                'corpo'          => $corpo,
                'destinatari'    => $destinatari,
                'num_destinatari'=> $inviati,
                'inviata_da'     => null,
                'stato'          => $inviati > 0 ? 'inviata' : 'errore',
            ]);

            jsonResponse([
                'success'       => true,
                'email_inviate' => $inviati,
                'totale'        => count($emails),
                'message'       => "Email inviate a $inviati destinatari",
            ]);
            break;

        /* --------------------------------------------------
           STORICO NOTIFICHE
           -------------------------------------------------- */
        case 'list':
            requireAuth(['segreteria', 'admin']);

            $lista = DB::fetchAll(
                "SELECT n.*, e.titolo AS evento_titolo
                 FROM notifiche_email n
                 LEFT JOIN eventi e ON e.id = n.id_evento
                 ORDER BY n.inviata_il DESC
                 LIMIT 50"
            );

            jsonResponse(['success' => true, 'data' => $lista]);
            break;

        default:
            throw new ApiException('Azione non riconosciuta', 400);
    }

} catch (ApiException $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], $e->getCode() ?: 400);
} catch (Throwable $e) {
    error_log('[notifications.php] ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'Errore interno'], 500);
}

/* ----------------------------------------------------------
   HELPER: recupera email destinatari
   ---------------------------------------------------------- */
function recuperaDestinatari(string $tipo, ?int $id_evento): array
{
    switch ($tipo) {
        case 'tutti_genitori':
            return DB::fetchAll(
                "SELECT DISTINCT u.email FROM utenti u WHERE u.ruolo = 'genitore' AND u.stato = 'attivo'"
            );

        case 'tutti_attivi':
            return DB::fetchAll(
                "SELECT email FROM utenti WHERE stato = 'attivo'"
            );

        case 'iscritti_evento':
            if (!$id_evento) return [];
            return DB::fetchAll(
                "SELECT DISTINCT u.email FROM utenti u
                 JOIN iscrizioni i ON i.id_genitore = u.id
                 WHERE i.id_evento = ? AND i.stato = 'confermata'",
                [$id_evento]
            );

        case 'percorso_misto':
        case 'percorso_liceo':
        case 'percorso_tecnico':
            $codice = strtoupper(str_replace('percorso_', '', $tipo));
            return DB::fetchAll(
                "SELECT DISTINCT u.email FROM utenti u
                 JOIN iscrizioni i ON i.id_genitore = u.id
                 JOIN percorsi_openday p ON p.id = i.id_percorso
                 WHERE p.codice = ? AND i.stato = 'confermata'" . ($id_evento ? ' AND i.id_evento = ?' : ''),
                $id_evento ? [$codice, $id_evento] : [$codice]
            );

        default:
            // Tenta come descrizione libera — ritorna tutti i genitori
            return DB::fetchAll(
                "SELECT DISTINCT u.email FROM utenti u
                 JOIN iscrizioni i ON i.id_genitore = u.id
                 WHERE i.stato = 'confermata'" . ($id_evento ? ' AND i.id_evento = ?' : ''),
                $id_evento ? [$id_evento] : []
            );
    }
}
