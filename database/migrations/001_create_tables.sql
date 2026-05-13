-- ============================================================
-- Sistema Cardano Day — ITIS G. Cardano, Pavia
-- Migration 001 — Creazione tabelle principali
-- ============================================================
-- Ordine di creazione rispetta le dipendenze (FK)
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

-- ------------------------------------------------------------
-- TABELLA: utenti
-- Account del sistema: genitori, staff/professori, segreteria
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS utenti (
    id              INT             NOT NULL AUTO_INCREMENT,
    nome            VARCHAR(100)    NOT NULL,
    cognome         VARCHAR(100)    NOT NULL,
    email           VARCHAR(255)    NOT NULL,
    password        VARCHAR(255)    NOT NULL COMMENT 'Hash bcrypt — mai in chiaro',
    indirizzo       VARCHAR(500)    DEFAULT NULL COMMENT 'Via, civico, CAP, città (solo genitori)',
    cellulare       VARCHAR(20)     DEFAULT NULL COMMENT 'Numero genitore per comunicazioni urgenti',
    ruolo           ENUM('genitore','staff_professore','segreteria') NOT NULL DEFAULT 'genitore',
    verificato      TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '0=non verificato, 1=attivo',
    codice_verifica VARCHAR(10)     DEFAULT NULL COMMENT 'OTP temporaneo 6 cifre, invalidato dopo uso',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_utenti_email (email),
    KEY idx_utenti_ruolo (ruolo),
    KEY idx_utenti_verificato (verificato)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Account del sistema: genitori, staff/professori, segreteria';

-- ------------------------------------------------------------
-- TABELLA: figli
-- Studenti registrati da un genitore
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS figli (
    id              INT             NOT NULL AUTO_INCREMENT,
    nome            VARCHAR(100)    NOT NULL,
    cognome         VARCHAR(100)    NOT NULL,
    scuola_media    VARCHAR(255)    NOT NULL COMMENT 'Nome istituto di provenienza',
    citta_scuola    VARCHAR(100)    NOT NULL COMMENT 'Città della scuola media',
    id_genitore     INT             NOT NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_figli_genitore (id_genitore),
    KEY idx_figli_cognome_nome (cognome, nome),

    CONSTRAINT fk_figli_genitore
        FOREIGN KEY (id_genitore) REFERENCES utenti(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Studenti registrati da un genitore';

-- ------------------------------------------------------------
-- TABELLA: eventi
-- Open Day e Cardano Day
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eventi (
    id                  INT             NOT NULL AUTO_INCREMENT,
    tipo                ENUM('open_day','cardano_day') NOT NULL,
    titolo              VARCHAR(255)    NOT NULL,
    descrizione         TEXT            DEFAULT NULL,
    data_evento         DATE            NOT NULL,
    posti_max           INT             NOT NULL COMMENT 'Capienza totale',
    posti_disponibili   INT             NOT NULL COMMENT 'Decrementato ad ogni iscrizione confermata',
    apertura_iscrizioni DATETIME        NOT NULL COMMENT 'Sistema apre automaticamente',
    chiusura_iscrizioni DATETIME        NOT NULL COMMENT 'Sistema chiude automaticamente',
    pubblicato          TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '0=bozza, 1=visibile al pubblico',
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_eventi_tipo (tipo),
    KEY idx_eventi_data (data_evento),
    KEY idx_eventi_pubblicato (pubblicato),
    KEY idx_eventi_finestra (apertura_iscrizioni, chiusura_iscrizioni),

    CONSTRAINT chk_eventi_posti
        CHECK (posti_disponibili >= 0 AND posti_disponibili <= posti_max),
    CONSTRAINT chk_eventi_date
        CHECK (chiusura_iscrizioni > apertura_iscrizioni),
    CONSTRAINT chk_eventi_data_evento
        CHECK (data_evento >= DATE(apertura_iscrizioni))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Open Day e Cardano Day';

-- ------------------------------------------------------------
-- TABELLA: turni
-- I 2 turni giornalieri del Cardano Day (configurabili)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS turni (
    id          INT         NOT NULL AUTO_INCREMENT,
    id_evento   INT         NOT NULL,
    numero      TINYINT     NOT NULL COMMENT '1=primo turno, 2=secondo turno',
    ora_inizio  TIME        NOT NULL,
    ora_fine    TIME        NOT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_turni_evento_numero (id_evento, numero),
    KEY idx_turni_evento (id_evento),

    CONSTRAINT fk_turni_evento
        FOREIGN KEY (id_evento) REFERENCES eventi(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_turni_numero
        CHECK (numero IN (1, 2)),
    CONSTRAINT chk_turni_orari
        CHECK (ora_fine > ora_inizio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Turni giornalieri Cardano Day (configurabili dalla segreteria)';

-- ------------------------------------------------------------
-- TABELLA: laboratori
-- Istanze aula per turno ed evento (ogni aula = 1 riga)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS laboratori (
    id                  INT             NOT NULL AUTO_INCREMENT,
    id_evento           INT             NOT NULL,
    id_turno            INT             NOT NULL,
    nome                VARCHAR(100)    NOT NULL COMMENT 'es. Informatica, Meccanica, Chimica...',
    istanza             TINYINT         NOT NULL DEFAULT 1 COMMENT 'Numero aula: 1, 2, 3...',
    posti_max           INT             NOT NULL,
    posti_disponibili   INT             NOT NULL COMMENT 'Decrementato ad ogni assegnazione',

    PRIMARY KEY (id),
    UNIQUE KEY uq_lab_evento_turno_nome_istanza (id_evento, id_turno, nome, istanza),
    KEY idx_lab_evento (id_evento),
    KEY idx_lab_turno (id_turno),
    KEY idx_lab_nome (nome),
    KEY idx_lab_disponibili (posti_disponibili),

    CONSTRAINT fk_lab_evento
        FOREIGN KEY (id_evento) REFERENCES eventi(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_lab_turno
        FOREIGN KEY (id_turno) REFERENCES turni(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_lab_posti
        CHECK (posti_disponibili >= 0 AND posti_disponibili <= posti_max),
    CONSTRAINT chk_lab_istanza
        CHECK (istanza >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Istanze laboratorio/aula per turno ed evento';

-- ------------------------------------------------------------
-- TABELLA: percorsi_open_day
-- I 3 percorsi per ogni Open Day (Misto, Liceo, Tecnico)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS percorsi_open_day (
    id                  INT             NOT NULL AUTO_INCREMENT,
    id_evento           INT             NOT NULL,
    nome                VARCHAR(100)    NOT NULL COMMENT 'es. Percorso Misto, Percorso Liceo, Percorso Tecnico',
    descrizione         TEXT            DEFAULT NULL COMMENT 'Testo visibile al genitore',
    posti_max           INT             NOT NULL,
    posti_disponibili   INT             NOT NULL COMMENT 'Decrementato ad ogni iscrizione',

    PRIMARY KEY (id),
    UNIQUE KEY uq_percorsi_evento_nome (id_evento, nome),
    KEY idx_percorsi_evento (id_evento),

    CONSTRAINT fk_percorsi_evento
        FOREIGN KEY (id_evento) REFERENCES eventi(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_percorsi_posti
        CHECK (posti_disponibili >= 0 AND posti_disponibili <= posti_max)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Percorsi Open Day: Misto, Liceo, Tecnico';

-- ------------------------------------------------------------
-- TABELLA: iscrizioni
-- Una riga per ogni figlio iscritto a un evento
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS iscrizioni (
    id              INT             NOT NULL AUTO_INCREMENT,
    id_figlio       INT             NOT NULL,
    id_evento       INT             NOT NULL,
    id_percorso     INT             DEFAULT NULL COMMENT 'Solo Open Day; NULL per Cardano Day',
    qr_code         VARCHAR(64)     NOT NULL COMMENT 'Codice hex 32 byte generato da Node.js crypto.randomBytes()',
    stato           ENUM('confermata','annullata') NOT NULL DEFAULT 'confermata',
    -- Le 4 firme QR (solo Cardano Day; NULL = non ancora registrata)
    firma_entrata   DATETIME        DEFAULT NULL COMMENT 'Firma 1 — entrata scuola',
    firma_lab1      DATETIME        DEFAULT NULL COMMENT 'Firma 2 — ingresso laboratorio turno 1',
    firma_lab2      DATETIME        DEFAULT NULL COMMENT 'Firma 3 — ingresso laboratorio turno 2 (NULL se 1 solo lab)',
    firma_uscita    DATETIME        DEFAULT NULL COMMENT 'Firma 4 — uscita scuola',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_iscrizioni_qr (qr_code),
    UNIQUE KEY uq_iscrizioni_figlio_evento (id_figlio, id_evento) COMMENT 'Stesso figlio non può iscriversi 2 volte allo stesso evento',
    KEY idx_iscrizioni_evento (id_evento),
    KEY idx_iscrizioni_figlio (id_figlio),
    KEY idx_iscrizioni_stato (stato),
    KEY idx_iscrizioni_percorso (id_percorso),

    CONSTRAINT fk_iscrizioni_figlio
        FOREIGN KEY (id_figlio) REFERENCES figli(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_iscrizioni_evento
        FOREIGN KEY (id_evento) REFERENCES eventi(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_iscrizioni_percorso
        FOREIGN KEY (id_percorso) REFERENCES percorsi_open_day(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Una riga per ogni figlio iscritto a un evento';

-- ------------------------------------------------------------
-- TABELLA: iscrizioni_laboratori
-- Collega ogni iscrizione all'aula di laboratorio assegnata
-- (può avere 1 o 2 righe per iscrizione Cardano Day)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS iscrizioni_laboratori (
    id              INT     NOT NULL AUTO_INCREMENT,
    id_iscrizione   INT     NOT NULL,
    id_laboratorio  INT     NOT NULL COMMENT 'Istanza specifica (aula)',

    PRIMARY KEY (id),
    UNIQUE KEY uq_iscr_lab (id_iscrizione, id_laboratorio),
    KEY idx_iscr_lab_iscrizione (id_iscrizione),
    KEY idx_iscr_lab_laboratorio (id_laboratorio),

    CONSTRAINT fk_iscr_lab_iscrizione
        FOREIGN KEY (id_iscrizione) REFERENCES iscrizioni(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_iscr_lab_laboratorio
        FOREIGN KEY (id_laboratorio) REFERENCES laboratori(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Assegnazione aula laboratorio per iscrizione Cardano Day';

-- ------------------------------------------------------------
-- TABELLA: gruppi
-- Gruppi di visita per Open Day (M1-M6, L1-L7, T1-T5)
-- e Cardano Day (T1-T5)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gruppi (
    id          INT         NOT NULL AUTO_INCREMENT,
    nome        VARCHAR(10) NOT NULL COMMENT 'es. M1, L3, T2 (Open Day) oppure T1, T2... (Cardano Day)',
    id_evento   INT         NOT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_gruppi_nome_evento (nome, id_evento),
    KEY idx_gruppi_evento (id_evento),

    CONSTRAINT fk_gruppi_evento
        FOREIGN KEY (id_evento) REFERENCES eventi(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Gruppi di visita per Open Day e Cardano Day';

-- ------------------------------------------------------------
-- TABELLA: iscrizioni_gruppi
-- Tabella ponte iscrizione ↔ gruppo
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS iscrizioni_gruppi (
    id_iscrizione   INT     NOT NULL,
    id_gruppo       INT     NOT NULL,

    PRIMARY KEY (id_iscrizione, id_gruppo),
    KEY idx_iscr_gruppi_gruppo (id_gruppo),

    CONSTRAINT fk_iscr_gruppi_iscrizione
        FOREIGN KEY (id_iscrizione) REFERENCES iscrizioni(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_iscr_gruppi_gruppo
        FOREIGN KEY (id_gruppo) REFERENCES gruppi(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tabella ponte: iscrizione ↔ gruppo di visita';

-- ------------------------------------------------------------
-- TABELLA: richieste_ruolo
-- Richieste di accesso con ruolo Staff o Professore
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS richieste_ruolo (
    id              INT     NOT NULL AUTO_INCREMENT,
    id_utente       INT     NOT NULL,
    ruolo_richiesto ENUM('staff','professore') NOT NULL,
    stato           ENUM('in_attesa','approvata','rifiutata') NOT NULL DEFAULT 'in_attesa',
    note_segreteria VARCHAR(500) DEFAULT NULL COMMENT 'Note opzionali della segreteria',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_richieste_utente (id_utente),
    KEY idx_richieste_stato (stato),

    CONSTRAINT fk_richieste_utente
        FOREIGN KEY (id_utente) REFERENCES utenti(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Richieste ruolo Staff/Professore in attesa di approvazione segreteria';

-- ------------------------------------------------------------
-- TABELLA: scuole
-- Elenco scuole medie per autocomplete (gestito dalla segreteria)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scuole (
    id          INT             NOT NULL AUTO_INCREMENT,
    nome        VARCHAR(255)    NOT NULL,
    comune      VARCHAR(100)    NOT NULL,
    provincia   VARCHAR(5)      NOT NULL COMMENT 'Sigla es. PV, MI, LO',

    PRIMARY KEY (id),
    KEY idx_scuole_nome (nome),
    KEY idx_scuole_comune (comune),
    FULLTEXT KEY ft_scuole_ricerca (nome, comune)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Elenco scuole medie per autocomplete — gestito dalla segreteria';

-- ------------------------------------------------------------
-- TABELLA: comuni
-- Elenco comuni italiani per autocomplete indirizzo genitore
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comuni (
    id          INT             NOT NULL AUTO_INCREMENT,
    nome_comune VARCHAR(100)    NOT NULL,
    provincia   VARCHAR(5)      NOT NULL COMMENT 'Sigla es. PV',
    cap         VARCHAR(255)    NOT NULL COMMENT 'CAP o lista separata da virgola se multipli',
    regione     VARCHAR(100)    NOT NULL,

    PRIMARY KEY (id),
    KEY idx_comuni_nome (nome_comune),
    KEY idx_comuni_provincia (provincia),
    FULLTEXT KEY ft_comuni_ricerca (nome_comune)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Comuni italiani per autocomplete indirizzo — API interna';

-- ------------------------------------------------------------
-- TABELLA: audit_log
-- Log operazioni sensibili (cancellazione dati, approvazioni)
-- Non contiene dati personali
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
    id              INT             NOT NULL AUTO_INCREMENT,
    azione          VARCHAR(100)    NOT NULL COMMENT 'es. delete_personal_data, approva_ruolo',
    id_utente       INT             DEFAULT NULL COMMENT 'Chi ha eseguito (segreteria)',
    id_evento       INT             DEFAULT NULL COMMENT 'Evento coinvolto se applicabile',
    dettagli        JSON            DEFAULT NULL COMMENT 'Conteggi record eliminati/modificati — NO dati personali',
    ip_address      VARCHAR(45)     DEFAULT NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_audit_azione (azione),
    KEY idx_audit_utente (id_utente),
    KEY idx_audit_evento (id_evento),
    KEY idx_audit_data (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Log operazioni sensibili — non contiene dati personali';

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Fine migration 001_create_tables.sql
-- ============================================================