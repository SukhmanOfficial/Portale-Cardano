<?php
require_once "/var/www/html/includes/bootstrap.php";
try {
    $r = DB::fetchOne("SELECT email FROM utenti WHERE email = ?", ["mario.rossi@email.it"]);
    echo $r ? "UTENTE TROVATO: ".$r["email"] : "UTENTE NON TROVATO";
} catch(Exception $e) {
    echo "ERRORE: ".$e->getMessage();
}
