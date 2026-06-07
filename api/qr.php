<?php
/**
 * api/qr.php — Scanner QR e gestione 4 firme
 * Sistema Cardano Day · ITIS "G. Cardano", Pavia
 *
 * POST ?action=scan         → Scansiona QR e registra firma
 * GET  ?action=status&id=N  → Stato firme di un'iscrizione
 * GET  ?action=presenze      → Lista presenze evento (staff)
 */

require_once __DIR__ . '/../includes/bootstrap.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$action = $_GET['action'] ?? '';
$body   = json_decode(file_get_contents('php://input'), true) ?? [];

// Label delle 4 firme
const FIRME_LABEL = [
    1 => 'Entrata',
    2 => 'Lab Turno 1',
    3 => 'Lab Turno 2',
    4 => 'Uscita',
];

try {
    switch ($action) {

        /* --------------------------------------------------
           SCANSIONA QR — REGISTRA FIRMA
           POST body: qr_token, numero_firma (1-4), laboratorio (opt)
           Restituisce dati studente + stato firme aggiornato
           -------------------------------------------------- */
        case 'scan':
            $payload = requireAuth(['staff', 'professore', 'segreteria', 'admin']);

            $qr_token    = trim($body['qr_token'] ?? '');
            $num_firma   = (int)($body['numero_firma'] ?? 0);
            $laboratorio = trim($body['laboratorio'] ?? '');

            if (!$qr_token) throw new ApiException('Token QR mancante', 400);
            if ($num_firma < 1 || $num_firma > 4)
                throw new ApiException('Numero firma non valido (deve essere 1-4)', 400);

            // Recupera iscrizione
            $iscr = DB::fetchOne(
                "SELECT i.id, i.stato, i.gruppo_codice, i.aula_t1, i.aula_t2,
                   CONCAT(f.nome,' ',f.cognome) AS studente,
                   f.scuola,
                   ev.titolo AS evento, ev.tipo AS evento_tipo,
                   ev.data_evento
                 FROM iscrizioni i
                 JOIN figli f ON f.id = i.id_figlio
                 JOIN eventi ev ON ev.id = i.id_evento
                 WHERE i.qr_token = ?",
                [$qr_token]
            );

            if (!$iscr)
                throw new ApiException('QR non valido — nessuna iscrizione trovata', 404);
            if ($iscr['stato'] !== 'confermata')
                throw new ApiException('Iscrizione annullata o non valida', 400);

            // Verifica data evento (solo nel giorno dell'evento)
            // Commentato per permettere test — decommentare in produzione
            // if (date('Y-m-d') !== $iscr['data_evento'])
            //     throw new ApiException('Evento non in corso oggi', 400);

            // Verifica firma già registrata
            $firma_esiste = DB::fetchOne(
                'SELECT id, scansionato_il FROM firme_qr WHERE id_iscrizione = ? AND numero_firma = ?',
                [$iscr['id'], $num_firma]
            );

            if ($firma_esiste) {
                return jsonResponse([
                    'success'  => false,
                    'error'    => 'Firma ' . FIRME_LABEL[$num_firma] . ' già registrata alle ' .
                                  date('H:i', strtotime($firma_esiste['scansionato_il'])),
                    'studente' => $iscr['studente'],
                    'firma'    => FIRME_LABEL[$num_firma],
                    'duplicata'=> true,
                ], 409);
            }

            // Verifica ordine firme (no salti)
            $firme_fatte = DB::count('firme_qr', 'id_iscrizione = ?', [$iscr['id']]);
            if ($num_firma > $firme_fatte + 1) {
                throw new ApiException(
                    'Ordine firme non rispettato — prossima firma attesa: ' . FIRME_LABEL[$firme_fatte + 1],
                    400
                );
            }

            // Registra firma
            DB::insert('firme_qr', [
                'id_iscrizione'  => $iscr['id'],
                'numero_firma'   => $num_firma,
                'scansionato_da' => ($payload['id'] ?? $payload['sub'] ?? 0),
                'laboratorio'    => $laboratorio ?: null,
            ]);

            // Tutte le firme completate?
            $firme_totali = DB::count('firme_qr', 'id_iscrizione = ?', [$iscr['id']]);
            $completato   = $firme_totali >= 4;

            // Recupera tutte le firme aggiornate
            $firme = DB::fetchAll(
                'SELECT numero_firma, scansionato_il, laboratorio FROM firme_qr WHERE id_iscrizione = ? ORDER BY numero_firma',
                [$iscr['id']]
            );

            jsonResponse([
                'success'       => true,
                'messaggio'     => '✓ ' . FIRME_LABEL[$num_firma] . ' registrata per ' . $iscr['studente'],
                'studente'      => $iscr['studente'],
                'scuola'        => $iscr['scuola'],
                'evento'        => $iscr['evento'],
                'gruppo'        => $iscr['gruppo_codice'],
                'aula_t1'       => $iscr['aula_t1'],
                'aula_t2'       => $iscr['aula_t2'],
                'firma_appena'  => FIRME_LABEL[$num_firma],
                'prossima_firma'=> $completato ? null : FIRME_LABEL[$firme_totali + 1],
                'firme_totali'  => $firme_totali,
                'completato'    => $completato,
                'firme'         => $firme,
            ]);
            break;

        /* --------------------------------------------------
           STATO FIRME DI UN'ISCRIZIONE
           GET ?action=status&id=<id_iscrizione>
           -------------------------------------------------- */
        case 'status':
            requireAuth(['staff', 'professore', 'segreteria', 'admin']);
            $id = (int)($_GET['id'] ?? 0);
            if (!$id) throw new ApiException('ID iscrizione mancante', 400);

            $iscr = DB::fetchOne(
                "SELECT i.id, CONCAT(f.nome,' ',f.cognome) AS studente, i.gruppo_codice
                 FROM iscrizioni i JOIN figli f ON f.id = i.id_figlio WHERE i.id = ?",
                [$id]
            );
            if (!$iscr) throw new ApiException('Iscrizione non trovata', 404);

            $firme = DB::fetchAll(
                'SELECT numero_firma, scansionato_il, laboratorio FROM firme_qr WHERE id_iscrizione = ? ORDER BY numero_firma',
                [$id]
            );

            $firme_mappa = [];
            foreach ($firme as $f) {
                $firme_mappa[$f['numero_firma']] = [
                    'label'  => FIRME_LABEL[$f['numero_firma']],
                    'ora'    => date('H:i', strtotime($f['scansionato_il'])),
                    'lab'    => $f['laboratorio'],
                ];
            }

            // Aggiunge firme mancanti
            for ($i = 1; $i <= 4; $i++) {
                if (!isset($firme_mappa[$i])) {
                    $firme_mappa[$i] = [
                        'label'  => FIRME_LABEL[$i],
                        'ora'    => null,
                        'lab'    => null,
                    ];
                }
            }
            ksort($firme_mappa);

            jsonResponse([
                'success'  => true,
                'studente' => $iscr['studente'],
                'gruppo'   => $iscr['gruppo_codice'],
                'firme'    => array_values($firme_mappa),
                'completato' => count($firme) >= 4,
            ]);
            break;

        /* --------------------------------------------------
           PRESENZE EVENTO
           GET ?action=presenze&id_evento=N
           -------------------------------------------------- */
        case 'presenze':
            requireAuth(['staff', 'professore', 'segreteria', 'admin']);
            $id_evento = (int)($_GET['id_evento'] ?? 0);
            if (!$id_evento) throw new ApiException('id_evento obbligatorio', 400);

            $iscritti = DB::fetchAll(
                "SELECT i.id, CONCAT(f.nome,' ',f.cognome) AS studente,
                   f.scuola, i.gruppo_codice, i.aula_t1, i.aula_t2,
                   COALESCE(p.nome, CONCAT(l1.nome,'/',l2.nome)) AS percorso,
                   (SELECT COUNT(*) FROM firme_qr fq WHERE fq.id_iscrizione = i.id) AS firme_count,
                   (SELECT fq2.scansionato_il FROM firme_qr fq2 WHERE fq2.id_iscrizione = i.id AND fq2.numero_firma = 1) AS entrata,
                   (SELECT fq3.scansionato_il FROM firme_qr fq3 WHERE fq3.id_iscrizione = i.id AND fq3.numero_firma = 4) AS uscita
                 FROM iscrizioni i
                 JOIN figli f ON f.id = i.id_figlio
                 LEFT JOIN percorsi_openday p ON p.id = i.id_percorso
                 LEFT JOIN laboratori l1 ON l1.id = i.id_lab_t1
                 LEFT JOIN laboratori l2 ON l2.id = i.id_lab_t2
                 WHERE i.id_evento = ? AND i.stato = 'confermata'
                 ORDER BY i.gruppo_codice, f.cognome, f.nome",
                [$id_evento]
            );

            $totali = [
                'iscritti'  => count($iscritti),
                'entrati'   => count(array_filter($iscritti, function($r) { return $r['firme_count'] >= 1; })),
                'completati'=> count(array_filter($iscritti, function($r) { return $r['firme_count'] >= 4; })),
            ];

            jsonResponse([
                'success'  => true,
                'totali'   => $totali,
                'presenze' => $iscritti,
            ]);
            break;

        default:
            throw new ApiException('Azione non riconosciuta', 400);
    }

} catch (ApiException $e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], $e->getCode() ?: 400);
} catch (Throwable $e) {
    error_log('[qr.php] ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'Errore interno'], 500);
}
