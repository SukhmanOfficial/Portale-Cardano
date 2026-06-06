<?php
/**
 * includes/bootstrap.php
 * Sistema Cardano Day · ITIS "G. Cardano", Pavia
 */

/* ----------------------------------------------------------
   POLYFILL PHP 7.x
   ---------------------------------------------------------- */
if (!function_exists('str_starts_with')) {
    function str_starts_with(string $h, string $n): bool {
        return strlen($n) === 0 || strpos($h, $n) === 0;
    }
}
if (!function_exists('str_ends_with')) {
    function str_ends_with(string $h, string $n): bool {
        return strlen($n) === 0 || substr($h, -strlen($n)) === $n;
    }
}
if (!function_exists('str_contains')) {
    function str_contains(string $h, string $n): bool {
        return strlen($n) === 0 || strpos($h, $n) !== false;
    }
}

/* ----------------------------------------------------------
   CARICA .env — cerca sia nella cartella corrente che nella root
   ---------------------------------------------------------- */
$envPaths = [
    __DIR__ . '/../.env',          // htdocs/.env  (normale)
    __DIR__ . '/../../.env',       // un livello su (per sicurezza)
    dirname($_SERVER['DOCUMENT_ROOT'] ?? '') . '/.env', // fuori htdocs
];

foreach ($envPaths as $envFile) {
    if (file_exists($envFile)) {
        foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) continue;
            [$key, $val] = explode('=', $line, 2);
            $key = trim($key);
            $val = trim($val);
            if (!isset($_ENV[$key])) {
                $_ENV[$key] = $val;
                putenv("$key=$val");
            }
        }
        break; // trovato — stop
    }
}

/* ----------------------------------------------------------
   CONFIGURAZIONE — legge da ENV con fallback
   ---------------------------------------------------------- */
define('DB_HOST', $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'cardano_day');
define('DB_USER', $_ENV['DB_USER'] ?? getenv('DB_USER') ?: 'root');
define('DB_PASS', $_ENV['DB_PASS'] ?? getenv('DB_PASS') ?: '');
define('DB_PORT', (int)($_ENV['DB_PORT'] ?? getenv('DB_PORT') ?: 3306));

define('JWT_SECRET', $_ENV['JWT_SECRET'] ?? getenv('JWT_SECRET') ?: 'change_this_secret_key_32chars!!');
define('JWT_TTL',    (int)($_ENV['JWT_TTL']    ?? getenv('JWT_TTL')    ?: 86400));

define('MAIL_FROM', $_ENV['MAIL_FROM'] ?? getenv('MAIL_FROM') ?: 'noreply@example.com');
define('MAIL_NAME', $_ENV['MAIL_NAME'] ?? getenv('MAIL_NAME') ?: 'Sistema Cardano Day');
define('MAIL_HOST', $_ENV['MAIL_HOST'] ?? getenv('MAIL_HOST') ?: 'localhost');
define('MAIL_PORT', (int)($_ENV['MAIL_PORT'] ?? getenv('MAIL_PORT') ?: 587));
define('MAIL_USER', $_ENV['MAIL_USER'] ?? getenv('MAIL_USER') ?: '');
define('MAIL_PASS', $_ENV['MAIL_PASS'] ?? getenv('MAIL_PASS') ?: '');

define('APP_URL', $_ENV['APP_URL'] ?? getenv('APP_URL') ?: 'http://localhost');
define('APP_ENV', $_ENV['APP_ENV'] ?? getenv('APP_ENV') ?: 'development');

/* ----------------------------------------------------------
   AUTOLOAD
   ---------------------------------------------------------- */
require_once __DIR__ . '/DB.php';
require_once __DIR__ . '/JWT.php';
require_once __DIR__ . '/Mailer.php';

/* ----------------------------------------------------------
   HELPER GLOBALI
   ---------------------------------------------------------- */
function jsonResponse(array $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function requireAuth(?array $ruoli = null): array
{
    $payload = JWT::verifyFromHeader();
    if ($ruoli !== null && !in_array($payload['ruolo'], $ruoli, true)) {
        throw new ApiException('Accesso non autorizzato per il ruolo: ' . $payload['ruolo'], 403);
    }
    return $payload;
}

class ApiException extends RuntimeException
{
    public function __construct(string $message, int $code = 400)
    {
        parent::__construct($message, $code);
    }
}
