-- ============================================================
-- SISTEMA CARDANO DAY — ITIS "G. Cardano", Pavia
-- Migration 001 — Creazione tabelle principali
-- MySQL 8.0+
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- ------------------------------------------------------------
-- DATABASE
-- ------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS cardano_day
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE cardano_day;

-- ============================================================
-- TABELLA: utenti
-- Account del sistema: genitori, staff/professori, segreteria
-- ============================================================
CREATE TABLE IF NOT EXISTS utenti (
    id                  INT             NOT NULL AUTO_INCREMENT,
    nome                VARCHAR(100)    NOT NULL,
    cognome             VARCHAR(100)    NOT NULL,
    email               VARCHAR(255)    NOT NULL,
    password            VARCHAR(255)    NOT NULL COMMENT 'Hash bcrypt — mai in chiaro',
    indirizzo           VARCHAR(300)    NULL     COMMENT 'Via e numero civico del genitore',
    comune              VARCHAR(100)    NULL     COMMENT 'Comune di residenza del genitore',
    cap                 VARCHAR(10)     NULL     COMMENT 'CAP del genitore',
    cellulare           VARCHAR(20)     NULL     COMMENT 'Numero del genitore per urgenze',
    ruolo               ENUM(
                            'genitore',
                            'staff_professore',
                            'segreteria'
                        )               NOT NULL DEFAULT 'genitore',
    verificato          TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '0=non verificato, 1=attivo',
    codice_verifica     VARCHAR(10)     NULL     COMMENT 'OTP 6 cifre — invalidato dopo uso',
    codice_reset        VARCHAR(10)     NULL     COMMENT 'Codice reset password temporaneo',
    reset_scadenza      DATETIME        NULL     COMMENT 'Scadenza codice reset',
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_utenti_email (email),
    INDEX idx_utenti_ruolo (ruolo),
    INDEX idx_utenti_verificato (verificato)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABELLA: figli
-- Studenti registrati da un genitore
-- ============================================================
CREATE TABLE IF NOT EXISTS figli (
    id                  INT             NOT NULL AUTO_INCREMENT,
    nome                VARCHAR(100)    NOT NULL,
    cognome             VARCHAR(100)    NOT NULL,
    scuola_media        VARCHAR(255)    NOT NULL COMMENT 'Nome istituto di provenienza',
    citta_scuola        VARCHAR(100)    NOT NULL COMMENT 'Città della scuola media',
    id_genitore         INT             NOT NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_figli_genitore
        FOREIGN KEY (id_genitore) REFERENCES utenti(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_figli_genitore (id_genitore),
    INDEX idx_figli_cognome_nome (cognome, nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABELLA: eventi
-- Open Day e Cardano Day
-- ============================================================
CREATE TABLE IF NOT EXISTS eventi (
    id                      INT             NOT NULL AUTO_INCREMENT,
    tipo                    ENUM(
                                'open_day',
                                'cardano_day'
                            )               NOT NULL,
    titolo                  VARCHAR(255)    NOT NULL,
    descrizione             TEXT            NULL,
    data_evento             DATE            NOT NULL,
    posti_max               INT             NOT NULL DEFAULT 0,
    posti_disponibili       INT             NOT NULL DEFAULT 0,
    apertura_iscrizioni     DATETIME        NOT NULL COMMENT 'Sistema apre automaticamente',
    chiusura_iscrizioni     DATETIME        NOT NULL COMMENT 'Sistema chiude automaticamente',
    pubblicato              TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '0=bozza, 1=visibile',
    created_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_eventi_tipo (tipo),
    INDEX idx_eventi_data (data_evento),
    INDEX idx_eventi_pubblicato (pubblicato),
    INDEX idx_eventi_finestra (apertura_iscrizioni, chiusura_iscrizioni)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABELLA: turni
-- I 2 turni di ogni Cardano Day (configurabili dalla segreteria)
-- ============================================================
CREATE TABLE IF NOT EXISTS turni (
    id              INT         NOT NULL AUTO_INCREMENT,
    id_evento       INT         NOT NULL,
    numero          TINYINT     NOT NULL COMMENT '1=primo turno, 2=secondo turno',
    ora_inizio      TIME        NOT NULL,
    ora_fine        TIME        NOT NULL,

    PRIMARY KEY (id),
    CONSTRAINT fk_turni_evento
        FOREIGN KEY (id_evento) REFERENCES eventi(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uq_turni_evento_numero (id_evento, numero),
    INDEX idx_turni_evento (id_evento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABELLA: laboratori
-- Istanze di laboratorio per turno ed evento.
-- Ogni aula è una riga separata (istanza = numero aula).
-- ============================================================
CREATE TABLE IF NOT EXISTS laboratori (
    id                  INT             NOT NULL AUTO_INCREMENT,
    id_evento           INT             NOT NULL,
    id_turno            INT             NOT NULL,
    nome                VARCHAR(100)    NOT NULL COMMENT 'Es. Informatica, Meccanica',
    lettera             CHAR(1)         NOT NULL COMMENT 'Lettera codice: I, M, C, E, L',
    istanza             TINYINT         NOT NULL DEFAULT 1 COMMENT 'Numero aula: 1, 2, 3...',
    posti_max           INT             NOT NULL DEFAULT 25,
    posti_disponibili   INT             NOT NULL DEFAULT 25,

    PRIMARY KEY (id),
    CONSTRAINT fk_lab_evento
        FOREIGN KEY (id_evento) REFERENCES eventi(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_lab_turno
        FOREIGN KEY (id_turno) REFERENCES turni(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uq_lab_evento_turno_nome_istanza (id_evento, id_turno, nome, istanza),
    INDEX idx_lab_evento (id_evento),
    INDEX idx_lab_turno (id_turno),
    INDEX idx_lab_disponibili (posti_disponibili)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABELLA: percorsi_open_day
-- I 3 percorsi (Misto, Liceo, Tecnico) per ogni Open Day
-- ============================================================
CREATE TABLE IF NOT EXISTS percorsi_open_day (
    id                  INT             NOT NULL AUTO_INCREMENT,
    id_evento           INT             NOT NULL,
    nome                VARCHAR(100)    NOT NULL COMMENT 'Es. Percorso Misto',
    codice              CHAR(1)         NOT NULL COMMENT 'M, L, T',
    descrizione         TEXT            NULL,
    posti_max           INT             NOT NULL DEFAULT 0,
    posti_disponibili   INT             NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    CONSTRAINT fk_percorsi_evento
        FOREIGN KEY (id_evento) REFERENCES eventi(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uq_percorsi_evento_codice (id_evento, codice),
    INDEX idx_percorsi_evento (id_evento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABELLA: iscrizioni
-- Una riga per ogni figlio iscritto a un evento.
-- Le 4 firme QR sono colonne DATETIME separate.
-- ============================================================
CREATE TABLE IF NOT EXISTS iscrizioni (
    id              INT             NOT NULL AUTO_INCREMENT,
    id_figlio       INT             NOT NULL,
    id_evento       INT             NOT NULL,
    id_percorso     INT             NULL     COMMENT 'Solo Open Day — NULL per Cardano Day',
    qr_code         VARCHAR(64)     NOT NULL COMMENT 'SHA-256 hex — UNIQUE',
    stato           ENUM(
                        'confermata',
                        'annullata',
                        'in_attesa'
                    )               NOT NULL DEFAULT 'in_attesa',
    firma_entrata   DATETIME        NULL COMMENT 'Timestamp firma 1 — ingresso scuola',
    firma_lab1      DATETIME        NULL COMMENT 'Timestamp firma 2 — Lab turno 1',
    firma_lab2      DATETIME        NULL COMMENT 'Timestamp firma 3 — Lab turno 2 (NULL se 1 solo lab)',
    firma_uscita    DATETIME        NULL COMMENT 'Timestamp firma 4 — uscita scuola',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_iscrizioni_qr (qr_code),
    UNIQUE KEY uq_iscr_figlio_evento (id_figlio, id_evento),
    CONSTRAINT fk_iscr_figlio
        FOREIGN KEY (id_figlio) REFERENCES figli(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_iscr_evento
        FOREIGN KEY (id_evento) REFERENCES eventi(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_iscr_percorso
        FOREIGN KEY (id_percorso) REFERENCES percorsi_open_day(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_iscr_evento (id_evento),
    INDEX idx_iscr_figlio (id_figlio),
    INDEX idx_iscr_stato (stato),
    INDEX idx_iscr_qr (qr_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABELLA: iscrizioni_laboratori
-- Collega ogni iscrizione all'aula di laboratorio assegnata
-- ============================================================
CREATE TABLE IF NOT EXISTS iscrizioni_laboratori (
    id              INT     NOT NULL AUTO_INCREMENT,
    id_iscrizione   INT     NOT NULL,
    id_laboratorio  INT     NOT NULL COMMENT 'Istanza specifica (aula)',

    PRIMARY KEY (id),
    CONSTRAINT fk_iscr_lab_iscrizione
        FOREIGN KEY (id_iscrizione) REFERENCES iscrizioni(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_iscr_lab_laboratorio
        FOREIGN KEY (id_laboratorio) REFERENCES laboratori(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY uq_iscr_lab (id_iscrizione, id_laboratorio),
    INDEX idx_iscr_lab_iscrizione (id_iscrizione),
    INDEX idx_iscr_lab_laboratorio (id_laboratorio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABELLA: gruppi
-- Gruppi di visita.
-- Open Day: M1-M6, L1-L7, T1-T5
-- Cardano Day: I1, I2, M1, M2, C1, C2, E1, E2, L1...
-- ============================================================
CREATE TABLE IF NOT EXISTS gruppi (
    id          INT             NOT NULL AUTO_INCREMENT,
    id_evento   INT             NOT NULL,
    nome        VARCHAR(10)     NOT NULL COMMENT 'Es. M1, L3, T2, I1',
    tipo        VARCHAR(20)     NULL     COMMENT 'Es. Misto, Liceo, Tecnico',

    PRIMARY KEY (id),
    CONSTRAINT fk_gruppi_evento
        FOREIGN KEY (id_evento) REFERENCES eventi(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uq_gruppi_evento_nome (id_evento, nome),
    INDEX idx_gruppi_evento (id_evento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABELLA: iscrizioni_gruppi
-- Tabella ponte: iscrizione ↔ gruppo
-- ============================================================
CREATE TABLE IF NOT EXISTS iscrizioni_gruppi (
    id_iscrizione   INT     NOT NULL,
    id_gruppo       INT     NOT NULL,

    PRIMARY KEY (id_iscrizione, id_gruppo),
    CONSTRAINT fk_iscr_grp_iscrizione
        FOREIGN KEY (id_iscrizione) REFERENCES iscrizioni(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_iscr_grp_gruppo
        FOREIGN KEY (id_gruppo) REFERENCES gruppi(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_iscr_grp_gruppo (id_gruppo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABELLA: richieste_ruolo
-- Richieste di accesso con ruolo Staff o Professore
-- ============================================================
CREATE TABLE IF NOT EXISTS richieste_ruolo (
    id              INT     NOT NULL AUTO_INCREMENT,
    id_utente       INT     NOT NULL,
    ruolo_richiesto ENUM(
                        'staff',
                        'professore'
                    )       NOT NULL,
    stato           ENUM(
                        'in_attesa',
                        'approvata',
                        'rifiutata'
                    )       NOT NULL DEFAULT 'in_attesa',
    note_segreteria VARCHAR(500) NULL COMMENT 'Motivazione approvazione/rifiuto',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_richieste_utente
        FOREIGN KEY (id_utente) REFERENCES utenti(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_richieste_stato (stato),
    INDEX idx_richieste_utente (id_utente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABELLA: scuole
-- Tabella di riferimento permanente — NON svuotare mai.
-- Elenco scuole medie per autocomplete.
-- ============================================================
CREATE TABLE IF NOT EXISTS scuole (
    id          INT             NOT NULL AUTO_INCREMENT,
    nome        VARCHAR(255)    NOT NULL,
    comune      VARCHAR(100)    NOT NULL,
    provincia   CHAR(2)         NOT NULL,
    attiva      TINYINT(1)      NOT NULL DEFAULT 1,

    PRIMARY KEY (id),
    INDEX idx_scuole_nome (nome),
    INDEX idx_scuole_comune (comune),
    FULLTEXT INDEX ft_scuole_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABELLA: comuni
-- Tabella di riferimento permanente — NON svuotare mai.
-- Elenco comuni italiani per autocomplete indirizzo.
-- ============================================================
CREATE TABLE IF NOT EXISTS comuni (
    id              INT             NOT NULL AUTO_INCREMENT,
    nome_comune     VARCHAR(100)    NOT NULL,
    provincia       CHAR(2)         NOT NULL,
    cap             VARCHAR(100)    NOT NULL COMMENT 'CAP o lista separata da virgola',
    regione         VARCHAR(50)     NOT NULL,

    PRIMARY KEY (id),
    INDEX idx_comuni_nome (nome_comune),
    INDEX idx_comuni_provincia (provincia),
    FULLTEXT INDEX ft_comuni_nome (nome_comune)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABELLA: audit_log
-- Log di tutte le operazioni sensibili — senza dati personali
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id          INT             NOT NULL AUTO_INCREMENT,
    id_utente   INT             NULL COMMENT 'NULL se azione di sistema',
    azione      VARCHAR(100)    NOT NULL COMMENT 'Es. login, cancellazione_dati, approva_staff',
    dettagli    JSON            NULL     COMMENT 'Payload JSON senza dati personali',
    ip          VARCHAR(45)     NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_audit_utente (id_utente),
    INDEX idx_audit_azione (azione),
    INDEX idx_audit_data (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


SET FOREIGN_KEY_CHECKS = 1;
