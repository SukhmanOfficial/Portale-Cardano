-- ============================================================
-- Migration 003 — Vincoli aggiuntivi e check
-- ============================================================

USE cardano_day;

-- Verifica che posti_disponibili non superi posti_max
ALTER TABLE eventi
    ADD CONSTRAINT chk_eventi_posti
        CHECK (posti_disponibili >= 0 AND posti_disponibili <= posti_max);

ALTER TABLE laboratori
    ADD CONSTRAINT chk_lab_posti
        CHECK (posti_disponibili >= 0 AND posti_disponibili <= posti_max);

ALTER TABLE percorsi_open_day
    ADD CONSTRAINT chk_percorsi_posti
        CHECK (posti_disponibili >= 0 AND posti_disponibili <= posti_max);

-- Verifica ora_fine > ora_inizio per i turni
ALTER TABLE turni
    ADD CONSTRAINT chk_turni_ore
        CHECK (ora_fine > ora_inizio);

-- Verifica chiusura > apertura iscrizioni
ALTER TABLE eventi
    ADD CONSTRAINT chk_eventi_finestra
        CHECK (chiusura_iscrizioni > apertura_iscrizioni);
