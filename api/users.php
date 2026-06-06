<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/../includes/bootstrap.php';

$action = $_GET['action'] ?? '';

try {
    switch ($action) {

        case 'list':
            requireAuth(['segreteria', 'admin']);
            $search = trim($_GET['search'] ?? '');
            $ruolo  = trim($_GET['ruolo']  ?? '');
            $stato  = trim($_GET['stato']  ?? '');

            $sql    = "SELECT u.id, u.nome, u.cognome, u.email, u.ruolo, u.stato, u.creato_il,
                              COUNT(i.id) AS iscrizioni_attive
                       FROM utenti u
                       LEFT JOIN iscrizioni i ON i.id_genitore = u.id AND i.stato = 'confermata'
                       WHERE 1=1";
            $params = [];

            if ($search) { $sql .= " AND (u.nome LIKE ? OR u.cognome LIKE ? OR u.email LIKE ?)"; $s = "%$search%"; $params = array_merge($params, [$s,$s,$s]); }
            if ($ruolo)  { $sql .= " AND u.ruolo = ?";  $params[] = $ruolo; }
            if ($stato)  { $sql .= " AND u.stato = ?";  $params[] = $stato; }

            $sql .= " GROUP BY u.id ORDER BY u.creato_il DESC";

            $data = DB::fetchAll($sql, $params);
            echo json_encode(['success' => true, 'data' => $data]);
            break;

        case 'approvazioni':
            requireAuth(['segreteria', 'admin']);
            $data = DB::fetchAll("SELECT id, nome, cognome, email, ruolo, creato_il FROM utenti WHERE stato = 'in_attesa' ORDER BY creato_il ASC");
            echo json_encode(['success' => true, 'data' => $data]);
            break;

        case 'approva':
            requireAuth(['segreteria', 'admin']);
            $id = (int)($_GET['id'] ?? 0);
            DB::update('utenti', ['stato' => 'attivo'], 'id = ?', [$id]);
            echo json_encode(['success' => true]);
            break;

        case 'rifiuta':
            requireAuth(['segreteria', 'admin']);
            $body = json_decode(file_get_contents('php://input'), true) ?? [];
            $id   = (int)($_GET['id'] ?? 0);
            DB::delete('utenti', 'id = ?', [$id]);
            echo json_encode(['success' => true]);
            break;

        case 'elimina':
            requireAuth(['segreteria', 'admin']);
            $id = (int)($_GET['id'] ?? 0);
            if (!$id) throw new ApiException('ID mancante');
            DB::delete('utenti', 'id = ? AND ruolo != ?', [$id, 'admin']);
            echo json_encode(['success' => true]);
            break;

        case 'elimina_tutti':
            requireAuth(['segreteria', 'admin']);
            $body = json_decode(file_get_contents('php://input'), true) ?? [];
            $tipo = trim($body['tipo'] ?? 'tutti_genitori');

            if ($tipo === 'per_evento') {
                $id_evento = (int)($body['id_evento'] ?? 0);
                if (!$id_evento) throw new ApiException('id_evento obbligatorio');
                $genitori = DB::fetchAll("SELECT DISTINCT id_genitore FROM iscrizioni WHERE id_evento = ?", [$id_evento]);
                $ids = array_column($genitori, 'id_genitore');
                if (empty($ids)) { echo json_encode(['success' => true, 'eliminati' => 0]); break; }
                $ph = implode(',', array_fill(0, count($ids), '?'));
                $n  = DB::count('utenti', "id IN ($ph) AND ruolo = 'genitore'", $ids);
                DB::query("DELETE FROM utenti WHERE id IN ($ph) AND ruolo = 'genitore'", $ids);
                echo json_encode(['success' => true, 'eliminati' => $n]);
            } elseif ($tipo === 'staff') {
                $ruoli_raw = trim($body['ruoli'] ?? 'staff');
                $ruoli = array_filter(array_map('trim', explode(',', $ruoli_raw)), function($r){ return in_array($r, ['staff','professore']); });
                if (empty($ruoli)) throw new ApiException('Ruoli non validi');
                $ph = implode(',', array_fill(0, count($ruoli), '?'));
                $n  = DB::count('utenti', "ruolo IN ($ph)", array_values($ruoli));
                DB::query("DELETE FROM utenti WHERE ruolo IN ($ph)", array_values($ruoli));
                echo json_encode(['success' => true, 'eliminati' => $n]);
            } else {
                $n = DB::count('utenti', "ruolo = 'genitore'");
                DB::query("DELETE FROM utenti WHERE ruolo = 'genitore'");
                echo json_encode(['success' => true, 'eliminati' => $n]);
            }
            break;

        case 'set_ruolo':
            requireAuth(['segreteria', 'admin']);
            $body        = json_decode(file_get_contents('php://input'), true) ?? [];
            $id_utente   = (int)($body['id_utente'] ?? 0);
            $nuovo_ruolo = trim($body['nuovo_ruolo'] ?? '');
            $ruoli_ok    = ['staff','professore','segreteria','genitore'];
            if (!in_array($nuovo_ruolo, $ruoli_ok)) throw new ApiException('Ruolo non valido');
            DB::update('utenti', ['ruolo' => $nuovo_ruolo], 'id = ?', [$id_utente]);
            echo json_encode(['success' => true]);
            break;

        case 'figli':
            requireAuth(['genitore','segreteria','admin']);
            $me   = JWT::verifyFromHeader();
            $data = DB::fetchAll(
                "SELECT f.id, f.nome, f.cognome, f.scuola, f.citta_scuola, s.nome AS nome_scuola_media
                 FROM figli f LEFT JOIN scuole_medie s ON s.id = f.id_scuola
                 WHERE f.id_genitore = ?",
                [$me['id']]
            );
            echo json_encode(['success' => true, 'data' => $data]);
            break;

        case 'add_figlio':
            requireAuth(['genitore']);
            $me   = JWT::verifyFromHeader();
            $body = json_decode(file_get_contents('php://input'), true) ?? [];
            $nome    = trim($body['nome']    ?? '');
            $cognome = trim($body['cognome'] ?? '');
            $scuola  = trim($body['scuola']  ?? '');
            if (!$nome || !$cognome) throw new ApiException('Nome e cognome obbligatori');
            $id = DB::insert('figli', ['id_genitore'=>$me['id'],'nome'=>$nome,'cognome'=>$cognome,'scuola'=>$scuola]);
            echo json_encode(['success' => true, 'id' => $id]);
            break;

        case 'del_figlio':
            requireAuth(['genitore']);
            $me = JWT::verifyFromHeader();
            $id = (int)($_GET['id'] ?? 0);
            DB::delete('figli', 'id = ? AND id_genitore = ?', [$id, $me['id']]);
            echo json_encode(['success' => true]);
            break;

        case 'get':
            requireAuth(['segreteria','admin']);
            $id   = (int)($_GET['id'] ?? 0);
            $data = DB::fetchOne("SELECT id,nome,cognome,email,ruolo,stato,creato_il FROM utenti WHERE id = ?", [$id]);
            echo json_encode(['success' => true, 'data' => $data]);
            break;

        case 'sospendi':
            requireAuth(['segreteria','admin']);
            $id = (int)($_GET['id'] ?? 0);
            DB::update('utenti', ['stato' => 'sospeso'], 'id = ?', [$id]);
            echo json_encode(['success' => true]);
            break;

        default:
            throw new ApiException('Azione non riconosciuta: ' . $action, 400);
    }

} catch (ApiException $e) {
    http_response_code($e->getCode() ?: 400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage(), 'line' => $e->getLine(), 'file' => basename($e->getFile())]);
}
