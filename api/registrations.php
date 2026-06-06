<?php
/**
 * api/registrations.php — Iscrizioni e QR
 * Sistema Cardano Day · ITIS "G. Cardano", Pavia
 *
 * POST ?action=create      → Nuova iscrizione (genitore)
 * POST ?action=cancel&id=N → Annulla iscrizione
 * GET  ?action=list        → Lista iscrizioni (segreteria/genitore)
 * GET  ?action=mie         → Iscrizioni del genitore loggato
 * GET  ?action=export      → Export CSV/Excel (segreteria)
 * POST ?action=dividi      → Esegui divisione gruppi (segreteria)
 * POST ?action=sposta      → Sposta studente tra gruppi
 * POST ?action=conferma_gruppi → Conferma e invia email QR aggiornati
 * GET  ?action=qr&token=X  → Dati iscrizione da QR token
 */

require_once __DIR__ . '/../includes/bootstrap.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$action = $_GET['action'] ?? '';
$id     = (int)($_GET['id'] ?? 0);
$body   = json_decode(file_get_contents('php://input'), true) ?? [];

try {
    switch ($action) {

        /* --------------------------------------------------
           NUOVA ISCRIZIONE
           POST body: id_figlio, id_evento,
                      id_percorso (Open Day)
                      id_lab_t1, id_lab_t2 (Cardano Day)
           -------------------------------------------------- */
        case 'create':
            $payload = requireAuth(['genitore']);

            $required = ['id_figlio', 'id_evento'];
            foreach ($required as $f)
                if (empty($body[$f])) throw new ApiException("Campo obbligatorio: $f", 400);

            $id_figlio = (int)$body['id_figlio'];
            $id_evento = (int)$body['id_evento'];

            // Verifica che il figlio appartenga al genitore loggato
            $figlio = DB::fetchOne('SELECT id FROM figli WHERE id = ? AND id_genitore = ?',
                [$id_figlio, $payload['sub']]);
            if (!$figlio) throw new ApiException('Figlio non trovato', 404);

            // Verifica evento e iscrizioni aperte
            $evento = DB::fetchOne('SELECT * FROM eventi WHERE id = ? AND pubblicato = 1', [$id_evento]);
            if (!$evento) throw new ApiException('Evento non trovato', 404);
            if (strtotime($evento['apertura_iscrizioni']) > time())
                throw new ApiException('Le iscrizioni non sono ancora aperte', 400);
            if (strtotime($evento['chiusura_iscrizioni']) < time())
                throw new ApiException('Le iscrizioni sono chiuse', 400);

            // Verifica iscrizione duplicata
            $duplicata = DB::fetchOne(
                "SELECT id FROM iscrizioni WHERE id_figlio = ? AND id_evento = ? AND stato != 'annullata'",
                [$id_figlio, $id_evento]
            );
            if ($duplicata) throw new ApiException('Questo figlio è già iscritto all\'evento', 409);

            // Verifica posti disponibili
            $iscritti = DB::count('iscrizioni', "id_evento = ? AND stato = 'confermata'", [$id_evento]);
            if ($iscritti >= $evento['posti_max'])
                throw new ApiException('Nessun posto disponibile', 409);

            // Validazioni specifiche per tipo evento
            $id_percorso = null;
            $id_lab_t1   = null;
            $id_lab_t2   = null;

            if ($evento['tipo'] === 'open_day') {
                if (empty($body['id_percorso']))
                    throw new ApiException('Scegli un percorso', 400);
                $percorso = DB::fetchOne(
                    'SELECT id, posti_max FROM percorsi_openday WHERE id = ? AND id_evento = ?',
                    [(int)$body['id_percorso'], $id_evento]
                );
                if (!$percorso) throw new ApiException('Percorso non valido', 400);

                // Posti percorso
                $posti_percorso = DB::count('iscrizioni',
                    "id_percorso = ? AND stato = 'confermata'", [(int)$body['id_percorso']]);
                if ($posti_percorso >= $percorso['posti_max'])
                    throw new ApiException('Nessun posto disponibile per questo percorso', 409);

                $id_percorso = (int)$body['id_percorso'];

            } else {
                // Cardano Day — almeno T1 obbligatorio
                if (empty($body['id_lab_t1']))
                    throw new ApiException('Scegli almeno un laboratorio per il Turno 1', 400);
                $id_lab_t1 = (int)$body['id_lab_t1'];
                $id_lab_t2 = !empty($body['id_lab_t2']) ? (int)$body['id_lab_t2'] : null;
                if ($id_lab_t1 === $id_lab_t2)
                    throw new ApiException('I laboratori dei due turni devono essere diversi', 400);
            }

            // Genera QR token univoco
            $qr_token = bin2hex(random_bytes(32));

            $id_iscrizione = DB::insert('iscrizioni', [
                'id_figlio'    => $id_figlio,
                'id_evento'    => $id_evento,
                'id_genitore'  => $payload['sub'],
                'id_percorso'  => $id_percorso,
                'id_lab_t1'    => $id_lab_t1,
                'id_lab_t2'    => $id_lab_t2,
                'stato'        => 'confermata',
                'qr_token'     => $qr_token,
                'qr_generato_il' => date('Y-m-d H:i:s'),
            ]);

            // Invia email con QR
            $genitore = DB::fetchOne('SELECT email, nome FROM utenti WHERE id = ?', [$payload['sub']]);
            Mailer::sendQrIscrizione(
                $genitore['email'], $genitore['nome'],
                $evento['titolo'],
                date('d/m/Y', strtotime($evento['data_evento'])),
                $qr_token
            );

            jsonResponse([
                'success'      => true,
                'id'           => $id_iscrizione,
                'qr_token'     => $qr_token,
                'message'      => 'Iscrizione confermata. QR inviato via email.',
            ], 201);
            break;

        /* --------------------------------------------------
           ANNULLA ISCRIZIONE
           -------------------------------------------------- */
        case 'cancel':
            $payload = requireAuth(['genitore', 'segreteria', 'admin']);
            if (!$id) throw new ApiException('ID iscrizione mancante', 400);

            $iscr = DB::fetchOne('SELECT * FROM iscrizioni WHERE id = ?', [$id]);
            if (!$iscr) throw new ApiException('Iscrizione non trovata', 404);

            // Genitore può cancellare solo le sue
            if ($payload['ruolo'] === 'genitore' && $iscr['id_genitore'] !== $payload['sub'])
                throw new ApiException('Non autorizzato', 403);

            // Verifica chiusura iscrizioni per genitori
            if ($payload['ruolo'] === 'genitore') {
                $ev = DB::fetchOne('SELECT chiusura_iscrizioni FROM eventi WHERE id = ?', [$iscr['id_evento']]);
                if ($ev && strtotime($ev['chiusura_iscrizioni']) < time())
                    throw new ApiException('Le iscrizioni sono chiuse — annullamento non più possibile', 400);
            }

            DB::update('iscrizioni', ['stato' => 'annullata'], 'id = ?', [$id]);
            jsonResponse(['success' => true, 'message' => 'Iscrizione annullata']);
            break;

        /* --------------------------------------------------
           LISTA ISCRIZIONI (segreteria)
           GET params: id_evento, stato, percorso, search
           -------------------------------------------------- */
        case 'list':
            requireAuth(['segreteria', 'admin', 'staff', 'professore']);

            $sql = "SELECT i.*,
                      CONCAT(f.nome,' ',f.cognome) AS studente,
                      f.scuola,
                      CONCAT(u.nome,' ',u.cognome) AS genitore,
                      u.email AS genitore_email,
                      ev.titolo AS evento,
                      ev.data_evento,
                      ev.tipo AS evento_tipo,
                      p.nome AS percorso_nome,
                      l1.nome AS lab_t1_nome,
                      l2.nome AS lab_t2_nome
                    FROM iscrizioni i
                    JOIN figli f ON f.id = i.id_figlio
                    JOIN utenti u ON u.id = i.id_genitore
                    JOIN eventi ev ON ev.id = i.id_evento
                    LEFT JOIN percorsi_openday p ON p.id = i.id_percorso
                    LEFT JOIN laboratori l1 ON l1.id = i.id_lab_t1
                    LEFT JOIN laboratori l2 ON l2.id = i.id_lab_t2
                    WHERE 1=1";
            $params = [];

            if (!empty($_GET['id_evento'])) {
                $sql .= ' AND i.id_evento = ?'; $params[] = (int)$_GET['id_evento'];
            }
            if (!empty($_GET['stato'])) {
                $sql .= ' AND i.stato = ?'; $params[] = $_GET['stato'];
            }
            if (!empty($_GET['search'])) {
                $s = '%' . $_GET['search'] . '%';
                $sql .= ' AND (f.nome LIKE ? OR f.cognome LIKE ? OR u.email LIKE ?)';
                $params = [...$params, $s, $s, $s];
            }
            $sql .= ' ORDER BY i.creato_il DESC';

            $data = DB::fetchAll($sql, $params);
            jsonResponse(['success' => true, 'data' => $data, 'total' => count($data)]);
            break;

        /* --------------------------------------------------
           ISCRIZIONI DEL GENITORE LOGGATO
           -------------------------------------------------- */
        case 'mie':
            $payload = requireAuth(['genitore']);
            $data = DB::fetchAll(
                "SELECT i.*, CONCAT(f.nome,' ',f.cognome) AS studente,
                   ev.titolo AS evento, ev.data_evento, ev.tipo AS evento_tipo,
                   p.nome AS percorso_nome, l1.nome AS lab_t1, l2.nome AS lab_t2,
                   i.qr_token, i.gruppo_codice,
                   (SELECT COUNT(*) FROM firme_qr fq WHERE fq.id_iscrizione = i.id) AS firme_count
                 FROM iscrizioni i
                 JOIN figli f ON f.id = i.id_figlio
                 JOIN eventi ev ON ev.id = i.id_evento
                 LEFT JOIN percorsi_openday p ON p.id = i.id_percorso
                 LEFT JOIN laboratori l1 ON l1.id = i.id_lab_t1
                 LEFT JOIN laboratori l2 ON l2.id = i.id_lab_t2
                 WHERE i.id_genitore = ?
                 ORDER BY ev.data_evento DESC",
                [$payload['sub']]
            );
            jsonResponse(['success' => true, 'data' => $data]);
            break;

        /* --------------------------------------------------
           EXPORT CSV (segreteria)
           -------------------------------------------------- */
        case 'export':
            requireAuth(['segreteria', 'admin']);

            $id_evento = (int)($_GET['id_evento'] ?? 0);
            $sql = "SELECT CONCAT(f.nome,' ',f.cognome) AS Studente,
                      f.scuola AS Scuola,
                      CONCAT(u.nome,' ',u.cognome) AS Genitore,
                      u.email AS Email_Genitore,
                      ev.titolo AS Evento,
                      ev.data_evento AS Data_Evento,
                      COALESCE(p.nome, CONCAT(l1.nome,'/',l2.nome)) AS Percorso,
                      i.gruppo_codice AS Gruppo,
                      i.aula_t1, i.aula_t2,
                      i.stato AS Stato,
                      DATE_FORMAT(i.creato_il,'%d/%m/%Y %H:%i') AS Iscritto_il
                    FROM iscrizioni i
                    JOIN figli f ON f.id = i.id_figlio
                    JOIN utenti u ON u.id = i.id_genitore
                    JOIN eventi ev ON ev.id = i.id_evento
                    LEFT JOIN percorsi_openday p ON p.id = i.id_percorso
                    LEFT JOIN laboratori l1 ON l1.id = i.id_lab_t1
                    LEFT JOIN laboratori l2 ON l2.id = i.id_lab_t2";
            $params = [];
            if ($id_evento) { $sql .= ' WHERE i.id_evento = ?'; $params[] = $id_evento; }
            $sql .= ' ORDER BY ev.data_evento, i.gruppo_codice, f.cognome';

            $rows = DB::fetchAll($sql, $params);

            // Output CSV
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="iscrizioni_' . date('Ymd') . '.csv"');
            $out = fopen('php://output', 'w');
            fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF)); // BOM UTF-8
            if (!empty($rows)) fputcsv($out, array_keys($rows[0]));
            foreach ($rows as $row) fputcsv($out, $row);
            fclose($out);
            exit;

        /* --------------------------------------------------
           DIVIDI GRUPPI (segreteria — Open Day)
           POST body: id_evento, percorsi: {MISTO:4, LICEO:3, TECNICO:2}
           -------------------------------------------------- */
        case 'dividi':
            requireAuth(['segreteria', 'admin']);

            $id_evento = (int)($body['id_evento'] ?? 0);
            if (!$id_evento) throw new ApiException('id_evento obbligatorio', 400);

            $evento = DB::fetchOne('SELECT tipo, chiusura_iscrizioni FROM eventi WHERE id = ?', [$id_evento]);
            if (!$evento) throw new ApiException('Evento non trovato', 404);

            // Cardano Day → assegna aule
            if ($evento['tipo'] === 'cardano_day') {
                dividiCardanoDay($id_evento);
            } else {
                // Open Day → divide per percorso
                $num_gruppi = $body['percorsi'] ?? ['MISTO'=>4,'LICEO'=>3,'TECNICO'=>2];
                dividiOpenDay($id_evento, $num_gruppi);
            }

            DB::update('eventi', ['gruppi_eseguiti' => 1], 'id = ?', [$id_evento]);
            jsonResponse(['success' => true, 'message' => 'Divisione completata']);
            break;

        /* --------------------------------------------------
           SPOSTA STUDENTE TRA GRUPPI (segreteria)
           POST body: id_iscrizione, nuovo_gruppo
           -------------------------------------------------- */
        case 'sposta':
            requireAuth(['segreteria', 'admin']);
            $id_iscr = (int)($body['id_iscrizione'] ?? 0);
            $gruppo  = trim($body['nuovo_gruppo'] ?? '');
            if (!$id_iscr || !$gruppo) throw new ApiException('Parametri mancanti', 400);
            DB::update('iscrizioni', ['gruppo_codice' => $gruppo], 'id = ?', [$id_iscr]);
            jsonResponse(['success' => true]);
            break;

        /* --------------------------------------------------
           CONFERMA GRUPPI E INVIA EMAIL (segreteria)
           POST body: id_evento
           -------------------------------------------------- */
        case 'conferma_gruppi':
            requireAuth(['segreteria', 'admin']);
            $id_evento = (int)($body['id_evento'] ?? 0);
            if (!$id_evento) throw new ApiException('id_evento obbligatorio', 400);

            $evento = DB::fetchOne('SELECT titolo, data_evento FROM eventi WHERE id = ?', [$id_evento]);
            $iscrizioni = DB::fetchAll(
                "SELECT i.id, i.gruppo_codice, u.email, u.nome, ev.titolo, ev.data_evento
                 FROM iscrizioni i
                 JOIN utenti u ON u.id = i.id_genitore
                 JOIN eventi ev ON ev.id = i.id_evento
                 WHERE i.id_evento = ? AND i.stato = 'confermata' AND i.gruppo_codice IS NOT NULL",
                [$id_evento]
            );

            foreach ($iscrizioni as $iscr) {
                Mailer::sendGruppoAssegnato(
                    $iscr['email'], $iscr['nome'],
                    $evento['titolo'],
                    $iscr['gruppo_codice'],
                    date('d/m/Y', strtotime($evento['data_evento']))
                );
            }

            DB::update('eventi', ['gruppi_confermati' => 1], 'id = ?', [$id_evento]);
            jsonResponse(['success' => true, 'email_inviate' => count($iscrizioni)]);
            break;

        /* --------------------------------------------------
           DATI DA QR TOKEN (scanner staff)
           -------------------------------------------------- */
        case 'qr':
            requireAuth(['staff', 'professore', 'segreteria', 'admin']);
            $token = trim($_GET['token'] ?? '');
            if (!$token) throw new ApiException('Token QR mancante', 400);

            $iscr = DB::fetchOne(
                "SELECT i.*,
                   CONCAT(f.nome,' ',f.cognome) AS studente,
                   f.scuola,
                   ev.titolo AS evento, ev.tipo AS evento_tipo,
                   ev.data_evento, ev.inizio_turno1, ev.inizio_turno2,
                   COALESCE(p.nome, CONCAT(l1.nome,'/',l2.nome)) AS percorso,
                   i.aula_t1, i.aula_t2, i.gruppo_codice
                 FROM iscrizioni i
                 JOIN figli f ON f.id = i.id_figlio
                 JOIN eventi ev ON ev.id = i.id_evento
                 LEFT JOIN percorsi_openday p ON p.id = i.id_percorso
                 LEFT JOIN laboratori l1 ON l1.id = i.id_lab_t1
                 LEFT JOIN laboratori l2 ON l2.id = i.id_lab_t2
                 WHERE i.qr_token = ? AND i.stato = 'confermata'",
                [$token]
            );
            if (!$iscr) throw new ApiException('QR non valido o iscrizione annullata', 404);

            // Firme già eseguite
            $iscr['firme'] = DB::fetchAll(
                'SELECT numero_firma, scansionato_il FROM firme_qr WHERE id_iscrizione = ? ORDER BY numero_firma',
                [$iscr['id']]
            );
            $iscr['prossima_firma'] = count($iscr['firme']) + 1;

            jsonResponse(['success' => true, 'data' => $iscr]);
            break;

        default:
            throw new ApiException('Azione non riconosciuta', 400);
    }

} catch (ApiException $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], $e->getCode() ?: 400);
} catch (Throwable $e) {
    error_log('[registrations.php] ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'Errore interno'], 500);
}

// ============================================================
// ALGORITMO DIVISIONE GRUPPI — OPEN DAY
// ============================================================

function dividiOpenDay(int $id_evento, array $num_gruppi): void
{
    $percorsi = ['MISTO', 'LICEO', 'TECNICO'];
    $prefissi = ['MISTO' => 'M', 'LICEO' => 'L', 'TECNICO' => 'T'];

    foreach ($percorsi as $cod) {
        $n = max(1, (int)($num_gruppi[$cod] ?? $num_gruppi[strtolower($cod)] ?? 1));

        // Studenti iscritti al percorso — ordina per scuola per bilanciare
        $iscritti = DB::fetchAll(
            "SELECT i.id, f.scuola FROM iscrizioni i
             JOIN percorsi_openday p ON p.id = i.id_percorso
             JOIN figli f ON f.id = i.id_figlio
             WHERE i.id_evento = ? AND p.codice = ? AND i.stato = 'confermata'
             ORDER BY f.scuola, i.id",
            [$id_evento, $cod]
        );

        if (empty($iscritti)) continue;

        // Algoritmo round-robin per bilanciare scuole nei gruppi
        $gruppi_assegnati = array_fill(0, $n, []);
        foreach ($iscritti as $idx => $iscr) {
            $gruppi_assegnati[$idx % $n][] = $iscr['id'];
        }

        // Salva nel DB
        for ($i = 0; $i < $n; $i++) {
            $codice = $prefissi[$cod] . ($i + 1);

            // Upsert gruppo
            $esistente = DB::fetchOne('SELECT id FROM gruppi WHERE id_evento = ? AND codice = ?', [$id_evento, $codice]);
            if (!$esistente) {
                DB::insert('gruppi', [
                    'id_evento'    => $id_evento,
                    'codice'       => $codice,
                    'percorso'     => $cod,
                    'num_studenti' => count($gruppi_assegnati[$i]),
                ]);
            } else {
                DB::update('gruppi', ['num_studenti' => count($gruppi_assegnati[$i])], 'id = ?', [$esistente['id']]);
            }

            // Aggiorna iscrizioni
            foreach ($gruppi_assegnati[$i] as $id_iscr) {
                DB::update('iscrizioni', ['gruppo_codice' => $codice], 'id = ?', [$id_iscr]);
            }
        }
    }
}

// ============================================================
// ALGORITMO DIVISIONE GRUPPI — CARDANO DAY
// ============================================================

function dividiCardanoDay(int $id_evento): void
{
    $laboratori = DB::fetchAll('SELECT * FROM laboratori WHERE id_evento = ?', [$id_evento]);

    foreach ($laboratori as $lab) {
        // Assegna aule turno 1
        $iscritti_t1 = DB::fetchAll(
            "SELECT i.id FROM iscrizioni i WHERE i.id_evento = ? AND i.id_lab_t1 = ? AND i.stato = 'confermata' ORDER BY i.id",
            [$id_evento, $lab['id']]
        );

        $ppa_t1 = $lab['posti_aula_t1'];
        foreach ($iscritti_t1 as $idx => $iscr) {
            $num_aula = (int)floor($idx / $ppa_t1) + 1;
            $aula = $lab['codice'] . $num_aula;
            DB::update('iscrizioni', ['aula_t1' => $aula, 'gruppo_codice' => $aula], 'id = ?', [$iscr['id']]);
        }

        // Assegna aule turno 2
        $iscritti_t2 = DB::fetchAll(
            "SELECT i.id FROM iscrizioni i WHERE i.id_evento = ? AND i.id_lab_t2 = ? AND i.stato = 'confermata' ORDER BY i.id",
            [$id_evento, $lab['id']]
        );

        $ppa_t2 = $lab['posti_aula_t2'];
        foreach ($iscritti_t2 as $idx => $iscr) {
            $num_aula = (int)floor($idx / $ppa_t2) + 1;
            $aula = $lab['codice'] . $num_aula;
            DB::update('iscrizioni', ['aula_t2' => $aula], 'id = ?', [$iscr['id']]);
        }
    }
}
