<?php
/**
 * api/admin.php — Pannello Admin
 * Sistema Cardano Day · ITIS "G. Cardano", Pavia
 *
 * GET  ?action=stats              → KPI sistema (sola lettura)
 * POST ?action=set_segreteria     → Promuovi/revoca ruolo segreteria
 * GET  ?action=log                → Log accessi e attività
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
    // Tutte le azioni admin richiedono ruolo admin
    $payload = requireAuth(['admin']);

    switch ($action) {

        /* --------------------------------------------------
           STATISTICHE SISTEMA (sola lettura)
           -------------------------------------------------- */
        case 'stats':
            $stats = [
                'utenti' => [
                    'totale'       => DB::count('utenti'),
                    'genitori'     => DB::count('utenti', "ruolo = 'genitore'"),
                    'staff'        => DB::count('utenti', "ruolo IN ('staff','professore')"),
                    'segreteria'   => DB::count('utenti', "ruolo = 'segreteria'"),
                    'in_attesa'    => DB::count('utenti', "stato = 'in_attesa'"),
                ],
                'iscrizioni' => [
                    'totale'       => DB::count('iscrizioni'),
                    'confermate'   => DB::count('iscrizioni', "stato = 'confermata'"),
                    'annullate'    => DB::count('iscrizioni', "stato = 'annullata'"),
                ],
                'eventi' => [
                    'totale'       => DB::count('eventi'),
                    'pubblicati'   => DB::count('eventi', 'pubblicato = 1'),
                    'open_day'     => DB::count('eventi', "tipo = 'open_day'"),
                    'cardano_day'  => DB::count('eventi', "tipo = 'cardano_day'"),
                ],
                'scuole' => DB::count('scuole_medie'),
            ];

            // Ultimi eventi
            $stats['ultimi_eventi'] = DB::fetchAll(
                "SELECT id, tipo, titolo, data_evento, pubblicato,
                   (SELECT COUNT(*) FROM iscrizioni i WHERE i.id_evento = e.id AND i.stato='confermata') AS iscritti,
                   posti_max,
                   (pubblicato = 1 AND apertura_iscrizioni <= NOW() AND chiusura_iscrizioni >= NOW()) AS iscrizioni_aperte
                 FROM eventi e ORDER BY data_evento DESC LIMIT 5"
            );

            jsonResponse(['success' => true, 'data' => $stats]);
            break;

        /* --------------------------------------------------
           PROMUOVI / REVOCA SEGRETERIA
           POST body: id_utente, azione ('promuovi'|'revoca')
           -------------------------------------------------- */
        case 'set_segreteria':
            $id_utente = (int)($body['id_utente'] ?? 0);
            $azione    = trim($body['azione'] ?? '');

            if (!$id_utente) throw new ApiException('id_utente obbligatorio', 400);
            if (!in_array($azione, ['promuovi', 'revoca'], true))
                throw new ApiException("Azione non valida. Usa 'promuovi' o 'revoca'", 400);

            $utente = DB::fetchOne('SELECT id, nome, cognome, ruolo FROM utenti WHERE id = ?', [$id_utente]);
            if (!$utente) throw new ApiException('Utente non trovato', 404);
            if ($utente['ruolo'] === 'admin')
                throw new ApiException('Non puoi modificare un account Admin', 403);

            if ($azione === 'promuovi') {
                if (!in_array($utente['ruolo'], ['staff','professore'], true))
                    throw new ApiException('Solo Staff o Professori possono essere promossi a Segreteria', 400);
                DB::update('utenti', ['ruolo' => 'segreteria'], 'id = ?', [$id_utente]);
                $msg = "{$utente['nome']} {$utente['cognome']} promosso a Segreteria";
            } else {
                if ($utente['ruolo'] !== 'segreteria')
                    throw new ApiException('L\'utente non è Segreteria', 400);

                // Almeno 1 segreteria deve restare attiva
                $altre = DB::count('utenti', "ruolo = 'segreteria' AND id != ? AND stato = 'attivo'", [$id_utente]);
                if ($altre === 0)
                    throw new ApiException('Non puoi revocare l\'unica segreteria attiva', 400);

                DB::update('utenti', ['ruolo' => 'staff'], 'id = ?', [$id_utente]);
                $msg = "Ruolo Segreteria revocato a {$utente['nome']} {$utente['cognome']}";
            }

            jsonResponse(['success' => true, 'message' => $msg]);
            break;

        /* --------------------------------------------------
           LOG ACCESSI
           -------------------------------------------------- */
        case 'log':
            $accessi = DB::fetchAll(
                "SELECT id, CONCAT(nome,' ',cognome) AS utente, email, ruolo, ultimo_accesso
                 FROM utenti WHERE ultimo_accesso IS NOT NULL
                 ORDER BY ultimo_accesso DESC LIMIT 50"
            );
            jsonResponse(['success' => true, 'data' => $accessi]);
            break;

        case 'get_anno':
            // Pubblico — nessuna auth richiesta
            $row = DB::fetchOne("SELECT valore FROM impostazioni WHERE chiave = 'anno_scolastico'");
            if ($row) {
                jsonResponse(['success' => true, 'anno' => $row['valore']]);
            } else {
                jsonResponse(['success' => false, 'anno' => null]);
            }
            break;

        case 'set_anno':
            requireAuth(['admin']);
            $anno = trim($body['anno'] ?? '');
            if ($anno) {
                // Salva o aggiorna
                $exists = DB::fetchOne("SELECT id FROM impostazioni WHERE chiave = 'anno_scolastico'");
                if ($exists) {
                    DB::update('impostazioni', ['valore' => $anno], 'chiave = ?', ['anno_scolastico']);
                } else {
                    DB::insert('impostazioni', ['chiave' => 'anno_scolastico', 'valore' => $anno]);
                }
                jsonResponse(['success' => true, 'anno' => $anno]);
            } else {
                // Elimina override — torna automatico
                DB::query("DELETE FROM impostazioni WHERE chiave = 'anno_scolastico'");
                jsonResponse(['success' => true, 'anno' => null]);
            }
            break;

        default:
            throw new ApiException('Azione non riconosciuta', 400);
    }

} catch (ApiException $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], $e->getCode() ?: 400);
} catch (Throwable $e) {
    error_log('[admin.php] ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'Errore interno'], 500);
}
