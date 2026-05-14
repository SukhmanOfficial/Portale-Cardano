-- ============================================================
-- RESET — Svuota tutto e ripopola con i seed
-- ATTENZIONE: elimina TUTTI i dati esistenti
-- ============================================================

USE cardano_day;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE audit_log;
TRUNCATE TABLE iscrizioni_gruppi;
TRUNCATE TABLE iscrizioni_laboratori;
TRUNCATE TABLE iscrizioni;
TRUNCATE TABLE gruppi;
TRUNCATE TABLE percorsi_open_day;
TRUNCATE TABLE laboratori;
TRUNCATE TABLE turni;
TRUNCATE TABLE richieste_ruolo;
TRUNCATE TABLE figli;
TRUNCATE TABLE eventi;
-- TRUNCATE TABLE scuole;
-- TRUNCATE TABLE comuni;
-- TRUNCATE TABLE utenti;

SET FOREIGN_KEY_CHECKS = 1;

-- Ricarica i seed
SOURCE seeds/seed.sql;
