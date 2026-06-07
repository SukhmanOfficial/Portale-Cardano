<?php
/**
 * api/schools.php — Scuole medie
 * Sistema Cardano Day · ITIS "G. Cardano", Pavia
 *
 * GET  ?action=list          → Lista tutte le scuole
 * GET  ?action=search&q=X   → Ricerca per nome/città
 * POST ?action=create        → Aggiungi scuola (segreteria)
 * POST ?action=update&id=N  → Modifica scuola (segreteria)
 * POST ?action=delete&id=N  → Elimina scuola (segreteria)
 */

require_once __DIR__ . '/../includes/bootstrap.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$action = $_GET['action'] ?? 'list';
$id     = (int)($_GET['id'] ?? 0);
$body   = json_decode(file_get_contents('php://input'), true) ?? [];

try {
    switch ($action) {

        case 'list':
            $scuole = DB::fetchAll(
                "SELECT sm.*,
                   COUNT(DISTINCT f.id) AS studenti_registrati
                 FROM scuole_medie sm
                 LEFT JOIN figli f ON f.id_scuola = sm.id
                 GROUP BY sm.id
                 ORDER BY sm.citta, sm.nome"
            );
            jsonResponse(['success' => true, 'data' => $scuole]);
            break;

        case 'search':
            $q = '%' . trim($_GET['q'] ?? '') . '%';
            $scuole = DB::fetchAll(
                'SELECT id, nome, citta, provincia FROM scuole_medie WHERE nome LIKE ? OR citta LIKE ? ORDER BY citta, nome LIMIT 20',
                [$q, $q]
            );
            jsonResponse(['success' => true, 'data' => $scuole]);
            break;

        case 'create':
            requireAuth(['segreteria', 'admin']);
            if (empty($body['nome']) || empty($body['citta']))
                throw new ApiException('Nome e città obbligatori', 400);
            $id = DB::insert('scuole_medie', [
                'nome'      => trim($body['nome']),
                'citta'     => trim($body['citta']),
                'provincia' => strtoupper(trim($body['provincia'] ?? 'PV')),
                'indirizzo' => trim($body['indirizzo'] ?? ''),
            ]);
            jsonResponse(['success' => true, 'id' => $id], 201);
            break;

        case 'update':
            requireAuth(['segreteria', 'admin']);
            if (!$id) throw new ApiException('ID scuola mancante', 400);
            DB::update('scuole_medie', [
                'nome'      => trim($body['nome'] ?? ''),
                'citta'     => trim($body['citta'] ?? ''),
                'provincia' => strtoupper(trim($body['provincia'] ?? 'PV')),
                'indirizzo' => trim($body['indirizzo'] ?? ''),
            ], 'id = ?', [$id]);
            jsonResponse(['success' => true, 'message' => 'Scuola aggiornata']);
            break;

        case 'delete':
            requireAuth(['segreteria', 'admin']);
            if (!$id) throw new ApiException('ID scuola mancante', 400);
            $studenti = DB::count('figli', 'id_scuola = ?', [$id]);
            if ($studenti > 0)
                throw new ApiException("Impossibile eliminare: $studenti studenti associati", 409);
            DB::delete('scuole_medie', 'id = ?', [$id]);
            jsonResponse(['success' => true, 'message' => 'Scuola eliminata']);
            break;

        default:
            throw new ApiException('Azione non riconosciuta', 400);
    }

} catch (ApiException $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], $e->getCode() ?: 400);
} catch (Throwable $e) {
    error_log('[schools.php] ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'Errore interno'], 500);
}
