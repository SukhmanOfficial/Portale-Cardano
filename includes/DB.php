<?php
/**
 * includes/DB.php — Wrapper PDO
 * Sistema Cardano Day · ITIS "G. Cardano", Pavia
 */

class DB
{
    private static ?PDO $pdo = null;

    // --------------------------------------------------------
    // CONNESSIONE
    // --------------------------------------------------------

    public static function connection(): PDO
    {
        if (self::$pdo === null) {
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
                DB_HOST, DB_PORT, DB_NAME
            );
            self::$pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        }
        return self::$pdo;
    }

    // --------------------------------------------------------
    // QUERY GENERICA
    // --------------------------------------------------------

    public static function query(string $sql, array $params = []): PDOStatement
    {
        $stmt = self::connection()->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    // --------------------------------------------------------
    // FETCH SINGOLA RIGA
    // --------------------------------------------------------

    public static function fetchOne(string $sql, array $params = []): ?array
    {
        $row = self::query($sql, $params)->fetch();
        return $row !== false ? $row : null;
    }

    // --------------------------------------------------------
    // FETCH TUTTE LE RIGHE
    // --------------------------------------------------------

    public static function fetchAll(string $sql, array $params = []): array
    {
        return self::query($sql, $params)->fetchAll();
    }

    // --------------------------------------------------------
    // INSERT — restituisce last insert id
    // --------------------------------------------------------

    public static function insert(string $table, array $data): int
    {
        $cols   = implode(', ', array_keys($data));
        $places = implode(', ', array_fill(0, count($data), '?'));
        self::query("INSERT INTO `$table` ($cols) VALUES ($places)", array_values($data));
        return (int) self::connection()->lastInsertId();
    }

    // --------------------------------------------------------
    // UPDATE — restituisce righe modificate
    // --------------------------------------------------------

    public static function update(string $table, array $data, string $where, array $whereParams = []): int
    {
        $set = implode(', ', array_map(function($k) { return "`$k` = ?"; }, array_keys($data)));
        $stmt = self::query(
            "UPDATE `$table` SET $set WHERE $where",
            [...array_values($data), ...$whereParams]
        );
        return $stmt->rowCount();
    }

    // --------------------------------------------------------
    // DELETE — restituisce righe eliminate
    // --------------------------------------------------------

    public static function delete(string $table, string $where, array $params = []): int
    {
        return self::query("DELETE FROM `$table` WHERE $where", $params)->rowCount();
    }

    // --------------------------------------------------------
    // CONTEGGIO RAPIDO
    // --------------------------------------------------------

    public static function count(string $table, string $where = '1', array $params = []): int
    {
        $row = self::fetchOne("SELECT COUNT(*) AS n FROM `$table` WHERE $where", $params);
        return (int)($row['n'] ?? 0);
    }

    // --------------------------------------------------------
    // TRANSAZIONE
    // --------------------------------------------------------

    public static function transaction(callable $fn)
    {
        $pdo = self::connection();
        $pdo->beginTransaction();
        try {
            $result = $fn();
            $pdo->commit();
            return $result;
        } catch (Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }
}
