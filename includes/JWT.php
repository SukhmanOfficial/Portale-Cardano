<?php
/**
 * includes/JWT.php — Gestione JWT (HS256)
 * Sistema Cardano Day · ITIS "G. Cardano", Pavia
 * Compatibile con InfinityFree — legge token da header E query string
 */

class JWT
{
    /* ----------------------------------------------------------
       GENERA TOKEN
       ---------------------------------------------------------- */
    public static function generate(array $payload, int $ttl = 0): string
    {
        $ttl = $ttl ?: JWT_TTL;

        $header = self::b64encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));

        $claims = array_merge($payload, [
            'iat' => time(),
            'exp' => time() + $ttl,
        ]);
        $body = self::b64encode(json_encode($claims));

        $sig = self::b64encode(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));

        return "$header.$body.$sig";
    }

    /* ----------------------------------------------------------
       VERIFICA TOKEN
       ---------------------------------------------------------- */
    public static function verify(string $token): array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new ApiException('Token non valido', 401);
        }

        [$header, $body, $sig] = $parts;

        $expected = self::b64encode(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));
        if (!hash_equals($expected, $sig)) {
            throw new ApiException('Firma JWT non valida', 401);
        }

        $payload = json_decode(self::b64decode($body), true);
        if (!$payload || !isset($payload['exp'])) {
            throw new ApiException('Payload JWT non valido', 401);
        }

        if (time() > $payload['exp']) {
            throw new ApiException('Token scaduto — effettua di nuovo il login', 401);
        }

        return $payload;
    }

    /* ----------------------------------------------------------
       LEGGE TOKEN DA HEADER O QUERY STRING
       Compatibile con Apache, Nginx, LiteSpeed, InfinityFree
       ---------------------------------------------------------- */
    public static function verifyFromHeader(): array
    {
        $token = '';

        /* 1. Query string ?_token=... (priorità su InfinityFree) */
        if (!empty($_GET['_token'])) {
            $token = trim($_GET['_token']);
        }

        /* 2. Header Authorization: Bearer ... */
        if (!$token) {
            $header = '';

            if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
                $header = $_SERVER['HTTP_AUTHORIZATION'];
            } elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
                $header = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
            } elseif (function_exists('apache_request_headers')) {
                $headers = apache_request_headers();
                $header  = $headers['Authorization'] ?? $headers['authorization'] ?? '';
            } elseif (function_exists('getallheaders')) {
                $headers = getallheaders();
                $header  = $headers['Authorization'] ?? $headers['authorization'] ?? '';
            }

            if (strpos($header, 'Bearer ') === 0) {
                $token = trim(substr($header, 7));
            }
        }

        if (!$token) {
            throw new ApiException('Token di autenticazione mancante', 401);
        }

        return self::verify($token);
    }

    /* ----------------------------------------------------------
       HELPERS
       ---------------------------------------------------------- */
    private static function b64encode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function b64decode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', (4 - strlen($data) % 4) % 4));
    }
}
