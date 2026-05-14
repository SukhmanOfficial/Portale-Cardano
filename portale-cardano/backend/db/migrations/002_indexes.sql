-- ============================================================
-- Migration 002 — Indici aggiuntivi e ottimizzazioni
-- Da eseguire dopo 001_create_tables.sql
-- ============================================================

USE cardano_day;

-- Indice composito per controllo anti-riscrittura
-- (figlio già partecipato a evento dello stesso tipo)
CREATE INDEX idx_iscr_figlio_stato
    ON iscrizioni (id_figlio, stato, firma_entrata);

-- Indice per ricerca QR scan veloce
CREATE INDEX idx_iscr_qr_stato
    ON iscrizioni (qr_code, stato);

-- Indice per export Excel (ordinamento per cognome)
CREATE INDEX idx_figli_cognome
    ON figli (cognome, nome);

-- Indice per statistiche eventi
CREATE INDEX idx_eventi_tipo_data
    ON eventi (tipo, data_evento, pubblicato);

-- Indice per ricerca scuole (autocomplete)
CREATE INDEX idx_scuole_nome_comune
    ON scuole (nome, comune, provincia);
