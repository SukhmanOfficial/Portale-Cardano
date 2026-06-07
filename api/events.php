<?php
/**
 * api/events.php — Gestione eventi
 * Sistema Cardano Day · ITIS "G. Cardano", Pavia
 *
 * GET  ?action=list              → Lista eventi pubblici
 * GET  ?action=get&id=N         → Dettaglio evento
 * POST ?action=create            → Crea evento (segreteria)
 * POST ?action=update&id=N      → Modifica evento (segreteria)
 * POST ?action=delete&id=N      → Elimina evento (segreteria)
 * POST ?action=toggle_pub&id=N  → Pubblica/nascondi evento
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

        /* --------------------------------------------------
           LISTA EVENTI PUBBLICI
           GET (nessuna autenticazione richiesta)
           -------------------------------------------------- */
        case 'list':
            $soloPublicati = !isset($_GET['tutti']);
            $sql = "SELECT e.*,
                      (SELECT COUNT(*) FROM iscrizioni i WHERE i.id_evento = e.id AND i.stato = 'confermata') AS iscritti
                    FROM eventi e
                    WHERE 1=1";
            $params = [];
            if ($soloPublicati) { $sql .= ' AND e.pubblicato = 1'; }
            $sql .= ' ORDER BY e.data_evento ASC';

            $eventi = DB::fetchAll($sql, $params);

            // Aggiunge percorsi / laboratori
            foreach ($eventi as &$ev) {
                if ($ev['tipo'] === 'open_day') {
                    $ev['percorsi'] = DB::fetchAll(
                        'SELECT * FROM percorsi_openday WHERE id_evento = ? ORDER BY FIELD(codice,"MISTO","LICEO","TECNICO")',
                        [$ev['id']]
                    );
                } else {
                    $ev['laboratori'] = DB::fetchAll(
                        'SELECT * FROM laboratori WHERE id_evento = ? ORDER BY codice',
                        [$ev['id']]
                    );
                }
                $ev['iscrizioni_aperte'] = isIscrizioniAperte($ev);
            }
            unset($ev);

            jsonResponse(['success' => true, 'data' => $eventi]);
            break;

        /* --------------------------------------------------
           DETTAGLIO SINGOLO EVENTO
           -------------------------------------------------- */
        case 'get':
            if (!$id) throw new ApiException('ID evento mancante', 400);

            $ev = DB::fetchOne('SELECT * FROM eventi WHERE id = ?', [$id]);
            if (!$ev) throw new ApiException('Evento non trovato', 404);

            if ($ev['tipo'] === 'open_day') {
                $ev['percorsi'] = DB::fetchAll('SELECT * FROM percorsi_openday WHERE id_evento = ?', [$id]);
            } else {
                $ev['laboratori'] = DB::fetchAll('SELECT * FROM laboratori WHERE id_evento = ?', [$id]);
            }
            $ev['iscrizioni_aperte'] = isIscrizioniAperte($ev);
            $ev['iscritti_totali']   = DB::count('iscrizioni', "id_evento = ? AND stato = 'confermata'", [$id]);

            jsonResponse(['success' => true, 'data' => $ev]);
            break;

        /* --------------------------------------------------
           CREA EVENTO (segreteria / admin)
           POST body: tipo, titolo, descrizione, data_evento,
                      posti_max, pubblicato, apertura_iscrizioni,
                      chiusura_iscrizioni, [turni], [percorsi/laboratori]
           -------------------------------------------------- */
        case 'create':
            $payload = requireAuth(['segreteria', 'admin']);
            validaEvento($body);

            $id_evento = DB::transaction(function () use ($body, $payload) {
                $id = DB::insert('eventi', [
                    'tipo'                => $body['tipo'],
                    'titolo'              => trim($body['titolo']),
                    'descrizione'         => trim($body['descrizione'] ?? ''),
                    'data_evento'         => $body['data_evento'],
                    'posti_max'           => (int)$body['posti_max'],
                    'pubblicato'          => (int)($body['pubblicato'] ?? 0),
                    'apertura_iscrizioni' => $body['apertura_iscrizioni'],
                    'chiusura_iscrizioni' => $body['chiusura_iscrizioni'],
                    'inizio_turno1'       => $body['inizio_t1'] ?? null,
                    'fine_turno1'         => $body['fine_t1'] ?? null,
                    'inizio_turno2'       => $body['inizio_t2'] ?? null,
                    'fine_turno2'         => $body['fine_t2'] ?? null,
                    'creato_da'           => ($payload['id'] ?? $payload['sub'] ?? 0),
                ]);

                // Percorsi Open Day
                if ($body['tipo'] === 'open_day' && !empty($body['percorsi'])) {
                    foreach ($body['percorsi'] as $p) {
                        DB::insert('percorsi_openday', [
                            'id_evento'  => $id,
                            'codice'     => strtoupper($p['codice']),
                            'nome'       => $p['nome'],
                            'descrizione'=> $p['descrizione'] ?? '',
                            'posti_max'  => (int)($p['posti_max'] ?? 100),
                        ]);
                    }
                }

                // Laboratori Cardano Day
                if ($body['tipo'] === 'cardano_day' && !empty($body['laboratori'])) {
                    foreach ($body['laboratori'] as $lab) {
                        DB::insert('laboratori', [
                            'id_evento'    => $id,
                            'codice'       => strtoupper($lab['codice']),
                            'nome'         => $lab['nome'],
                            'aule_t1'      => (int)($lab['aule_t1'] ?? 1),
                            'posti_aula_t1'=> (int)($lab['posti_t1'] ?? 25),
                            'aule_t2'      => (int)($lab['aule_t2'] ?? 1),
                            'posti_aula_t2'=> (int)($lab['posti_t2'] ?? 25),
                        ]);
                    }
                }

                return $id;
            });

            jsonResponse(['success' => true, 'id' => $id_evento, 'message' => 'Evento creato'], 201);
            break;

        /* --------------------------------------------------
           MODIFICA EVENTO
           -------------------------------------------------- */
        case 'update':
            requireAuth(['segreteria', 'admin']);
            if (!$id) throw new ApiException('ID evento mancante', 400);
            validaEvento($body);

            DB::update('eventi', [
                'titolo'              => trim($body['titolo']),
                'descrizione'         => trim($body['descrizione'] ?? ''),
                'data_evento'         => $body['data_evento'],
                'posti_max'           => (int)$body['posti_max'],
                'pubblicato'          => (int)($body['pubblicato'] ?? 0),
                'apertura_iscrizioni' => $body['apertura_iscrizioni'],
                'chiusura_iscrizioni' => $body['chiusura_iscrizioni'],
                'inizio_turno1'       => $body['inizio_t1'] ?? null,
                'fine_turno1'         => $body['fine_t1'] ?? null,
                'inizio_turno2'       => $body['inizio_t2'] ?? null,
                'fine_turno2'         => $body['fine_t2'] ?? null,
            ], 'id = ?', [$id]);

            jsonResponse(['success' => true, 'message' => 'Evento aggiornato']);
            break;

        /* --------------------------------------------------
           ELIMINA EVENTO
           -------------------------------------------------- */
        case 'delete':
            requireAuth(['segreteria', 'admin']);
            if (!$id) throw new ApiException('ID evento mancante', 400);

            $iscritti = DB::count('iscrizioni', "id_evento = ? AND stato = 'confermata'", [$id]);
            if ($iscritti > 0)
                throw new ApiException("Impossibile eliminare: $iscritti iscrizioni attive", 409);

            DB::delete('eventi', 'id = ?', [$id]);
            jsonResponse(['success' => true, 'message' => 'Evento eliminato']);
            break;

        /* --------------------------------------------------
           PUBBLICA / NASCONDI EVENTO
           -------------------------------------------------- */
        case 'toggle_pub':
            requireAuth(['segreteria', 'admin']);
            if (!$id) throw new ApiException('ID evento mancante', 400);
            $ev = DB::fetchOne('SELECT id, pubblicato FROM eventi WHERE id = ?', [$id]);
            if (!$ev) throw new ApiException('Evento non trovato', 404);
            $nuovo = $ev['pubblicato'] ? 0 : 1;
            DB::update('eventi', ['pubblicato' => $nuovo], 'id = ?', [$id]);
            jsonResponse(['success' => true, 'pubblicato' => (bool)$nuovo]);
            break;

        default:
            throw new ApiException('Azione non riconosciuta', 400);
    }

} catch (ApiException $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], $e->getCode() ?: 400);
} catch (Throwable $e) {
    error_log('[events.php] ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'Errore interno'], 500);
}

// ============================================================
// HELPER
// ============================================================

function isIscrizioniAperte(array $ev): bool
{
    $now = time();
    return strtotime($ev['apertura_iscrizioni']) <= $now
        && strtotime($ev['chiusura_iscrizioni']) >= $now
        && $ev['pubblicato'];
}

function validaEvento(array $body): void
{
    $required = ['tipo','titolo','data_evento','posti_max','apertura_iscrizioni','chiusura_iscrizioni'];
    foreach ($required as $f) {
        if (empty($body[$f])) throw new ApiException("Campo obbligatorio: $f", 400);
    }
    if (!in_array($body['tipo'], ['open_day','cardano_day'], true))
        throw new ApiException('Tipo evento non valido', 400);
    if ((int)$body['posti_max'] < 1)
        throw new ApiException('Posti massimi non validi', 400);
}
