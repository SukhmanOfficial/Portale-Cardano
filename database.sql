-- ============================================================
-- DATABASE.SQL — Schema completo Sistema Cardano Day
-- ITIS "G. Cardano" — Pavia
-- MySQL 8.0+
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+01:00';
SET foreign_key_checks = 0;

CREATE DATABASE IF NOT EXISTS cardano_day
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cardano_day;

-- ============================================================
-- 1. UTENTI
-- ============================================================

CREATE TABLE utenti (
  id              INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  nome            VARCHAR(80)      NOT NULL,
  cognome         VARCHAR(80)      NOT NULL,
  email           VARCHAR(160)     NOT NULL,
  password_hash   VARCHAR(255)     NOT NULL,
  ruolo           ENUM('genitore','staff','professore','segreteria','admin')
                                   NOT NULL DEFAULT 'genitore',
  stato           ENUM('attivo','non_verificato','sospeso','in_attesa')
                                   NOT NULL DEFAULT 'non_verificato',
  -- Solo per genitori
  via             VARCHAR(160)     NULL,
  cap             CHAR(5)          NULL,
  citta           VARCHAR(80)      NULL,
  telefono        VARCHAR(20)      NULL,
  -- Metadati
  email_verificata TINYINT(1)      NOT NULL DEFAULT 0,
  otp_code        VARCHAR(6)       NULL,
  otp_scadenza    DATETIME         NULL,
  reset_token     VARCHAR(100)     NULL,
  reset_scadenza  DATETIME         NULL,
  ultimo_accesso  DATETIME         NULL,
  creato_il       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aggiornato_il   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_email (email),
  KEY idx_ruolo  (ruolo),
  KEY idx_stato  (stato)
) ENGINE=InnoDB;

-- ============================================================
-- 2. FIGLI (studenti associati a un genitore)
-- ============================================================

CREATE TABLE figli (
  id              INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  id_genitore     INT UNSIGNED     NOT NULL,
  nome            VARCHAR(80)      NOT NULL,
  cognome         VARCHAR(80)      NOT NULL,
  scuola          VARCHAR(160)     NULL,
  id_scuola       INT UNSIGNED     NULL,   -- FK → scuole_medie
  citta_scuola    VARCHAR(80)      NULL,
  creato_il       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_genitore (id_genitore),
  CONSTRAINT fk_figli_genitore
    FOREIGN KEY (id_genitore) REFERENCES utenti(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 3. SCUOLE MEDIE
-- ============================================================

CREATE TABLE scuole_medie (
  id              INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  nome            VARCHAR(200)     NOT NULL,
  citta           VARCHAR(80)      NOT NULL,
  provincia       CHAR(2)          NOT NULL DEFAULT 'PV',
  indirizzo       VARCHAR(200)     NULL,
  creato_il       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_citta (citta)
) ENGINE=InnoDB;

-- Aggiunge FK figli → scuole_medie
ALTER TABLE figli
  ADD CONSTRAINT fk_figli_scuola
    FOREIGN KEY (id_scuola) REFERENCES scuole_medie(id)
    ON DELETE SET NULL;

-- ============================================================
-- 4. EVENTI
-- ============================================================

CREATE TABLE eventi (
  id                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  tipo                ENUM('open_day','cardano_day') NOT NULL,
  titolo              VARCHAR(200)  NOT NULL,
  descrizione         TEXT          NULL,
  data_evento         DATE          NOT NULL,
  posti_max           SMALLINT UNSIGNED NOT NULL DEFAULT 300,
  pubblicato          TINYINT(1)    NOT NULL DEFAULT 0,
  -- Periodo iscrizioni
  apertura_iscrizioni DATETIME      NOT NULL,
  chiusura_iscrizioni DATETIME      NOT NULL,
  -- Turni (solo Cardano Day)
  inizio_turno1       TIME          NULL,
  fine_turno1         TIME          NULL,
  inizio_turno2       TIME          NULL,
  fine_turno2         TIME          NULL,
  -- Gruppi
  gruppi_eseguiti     TINYINT(1)    NOT NULL DEFAULT 0,
  gruppi_confermati   TINYINT(1)    NOT NULL DEFAULT 0,
  -- Metadati
  creato_da           INT UNSIGNED  NULL,
  creato_il           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aggiornato_il       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_data        (data_evento),
  KEY idx_tipo        (tipo),
  KEY idx_pubblicato  (pubblicato),
  CONSTRAINT fk_eventi_creatore
    FOREIGN KEY (creato_da) REFERENCES utenti(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 5. PERCORSI OPEN DAY
--    (Misto, Liceo Sc. Appl., Tecnico — con posti per percorso)
-- ============================================================

CREATE TABLE percorsi_openday (
  id              INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  id_evento       INT UNSIGNED     NOT NULL,
  codice          ENUM('MISTO','LICEO','TECNICO') NOT NULL,
  nome            VARCHAR(80)      NOT NULL,
  descrizione     TEXT             NULL,
  posti_max       SMALLINT UNSIGNED NOT NULL DEFAULT 100,
  PRIMARY KEY (id),
  UNIQUE KEY uk_evento_codice (id_evento, codice),
  CONSTRAINT fk_percorsi_evento
    FOREIGN KEY (id_evento) REFERENCES eventi(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 6. LABORATORI CARDANO DAY
-- ============================================================

CREATE TABLE laboratori (
  id              INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  id_evento       INT UNSIGNED     NOT NULL,
  codice          CHAR(1)          NOT NULL COMMENT 'I=Informatica E=Elettronica M=Meccanica C=Chimica L=Liceo',
  nome            VARCHAR(100)     NOT NULL,
  -- Turno 1
  aule_t1         TINYINT UNSIGNED NOT NULL DEFAULT 1,
  posti_aula_t1   TINYINT UNSIGNED NOT NULL DEFAULT 25,
  -- Turno 2
  aule_t2         TINYINT UNSIGNED NOT NULL DEFAULT 1,
  posti_aula_t2   TINYINT UNSIGNED NOT NULL DEFAULT 25,
  PRIMARY KEY (id),
  UNIQUE KEY uk_evento_codice (id_evento, codice),
  CONSTRAINT fk_lab_evento
    FOREIGN KEY (id_evento) REFERENCES eventi(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 7. ISCRIZIONI
-- ============================================================

CREATE TABLE iscrizioni (
  id              INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  id_figlio       INT UNSIGNED     NOT NULL,
  id_evento       INT UNSIGNED     NOT NULL,
  id_genitore     INT UNSIGNED     NOT NULL,
  -- Open Day
  id_percorso     INT UNSIGNED     NULL,  -- FK → percorsi_openday
  -- Cardano Day
  id_lab_t1       INT UNSIGNED     NULL,  -- FK → laboratori
  id_lab_t2       INT UNSIGNED     NULL,  -- FK → laboratori (opzionale)
  -- Gruppo assegnato dalla segreteria
  gruppo_codice   VARCHAR(10)      NULL COMMENT 'es. M1, L2, T1, I1, E2',
  aula_t1         VARCHAR(10)      NULL COMMENT 'es. I1, E2, C1',
  aula_t2         VARCHAR(10)      NULL,
  -- Stato
  stato           ENUM('confermata','annullata','in_attesa')
                                   NOT NULL DEFAULT 'confermata',
  qr_token        VARCHAR(100)     NOT NULL UNIQUE,
  qr_generato_il  DATETIME         NULL,
  -- Metadati
  creato_il       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aggiornato_il   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_figlio_evento (id_figlio, id_evento),
  KEY idx_evento    (id_evento),
  KEY idx_genitore  (id_genitore),
  KEY idx_stato     (stato),
  KEY idx_qr        (qr_token),
  CONSTRAINT fk_iscr_figlio
    FOREIGN KEY (id_figlio) REFERENCES figli(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_iscr_evento
    FOREIGN KEY (id_evento) REFERENCES eventi(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_iscr_genitore
    FOREIGN KEY (id_genitore) REFERENCES utenti(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_iscr_percorso
    FOREIGN KEY (id_percorso) REFERENCES percorsi_openday(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_iscr_lab_t1
    FOREIGN KEY (id_lab_t1) REFERENCES laboratori(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_iscr_lab_t2
    FOREIGN KEY (id_lab_t2) REFERENCES laboratori(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 8. FIRME QR (4 scansioni per iscrizione Cardano Day)
-- ============================================================

CREATE TABLE firme_qr (
  id              INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  id_iscrizione   INT UNSIGNED     NOT NULL,
  numero_firma    TINYINT UNSIGNED NOT NULL COMMENT '1=Entrata 2=LabT1 3=LabT2 4=Uscita',
  scansionato_da  INT UNSIGNED     NULL,   -- FK → utenti (staff)
  scansionato_il  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  laboratorio     VARCHAR(10)      NULL COMMENT 'Aula scansionata es. E1',
  note            VARCHAR(255)     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_iscrizione_firma (id_iscrizione, numero_firma),
  KEY idx_iscrizione (id_iscrizione),
  CONSTRAINT fk_firme_iscrizione
    FOREIGN KEY (id_iscrizione) REFERENCES iscrizioni(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_firme_staff
    FOREIGN KEY (scansionato_da) REFERENCES utenti(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 9. GRUPPI (risultato divisione — Open Day)
-- ============================================================

CREATE TABLE gruppi (
  id              INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  id_evento       INT UNSIGNED     NOT NULL,
  codice          VARCHAR(10)      NOT NULL COMMENT 'es. M1 L2 T1',
  percorso        ENUM('MISTO','LICEO','TECNICO') NULL,
  num_studenti    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  creato_il       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_evento_codice (id_evento, codice),
  CONSTRAINT fk_gruppi_evento
    FOREIGN KEY (id_evento) REFERENCES eventi(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 10. NOTIFICHE EMAIL (log invii)
-- ============================================================

CREATE TABLE notifiche_email (
  id              INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  id_evento       INT UNSIGNED     NULL,
  oggetto         VARCHAR(255)     NOT NULL,
  corpo           TEXT             NOT NULL,
  destinatari     VARCHAR(255)     NOT NULL COMMENT 'descrizione gruppo destinatari',
  num_destinatari SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  inviata_da      INT UNSIGNED     NULL,
  inviata_il      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  stato           ENUM('inviata','bozza','errore') NOT NULL DEFAULT 'inviata',
  PRIMARY KEY (id),
  KEY idx_evento (id_evento),
  CONSTRAINT fk_notifiche_evento
    FOREIGN KEY (id_evento) REFERENCES eventi(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_notifiche_utente
    FOREIGN KEY (inviata_da) REFERENCES utenti(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- DATI INIZIALI
-- ============================================================

-- Scuole medie provincia di Pavia
INSERT INTO scuole_medie (nome, citta, provincia) VALUES
  ('SC. Media G. Manzoni',   'Pavia',    'PV'),
  ('SC. Media G. Pascoli',   'Pavia',    'PV'),
  ('SC. Media G. Volta',     'Pavia',    'PV'),
  ('SC. Media De Amicis',    'Pavia',    'PV'),
  ('SC. Media Don Bosco',    'Voghera',  'PV'),
  ('SC. Media Mazzini',      'Vigevano', 'PV'),
  ('SC. Media Carducci',     'Mortara',  'PV'),
  ('SC. Media I. Calvino',   'Pavia',    'PV'),
  ('SC. Media A. Frank',     'Vigevano', 'PV');

-- ============================================================

-- ============================================================
-- TABELLA IMPOSTAZIONI (usata da admin per anno scolastico)
-- ============================================================
CREATE TABLE IF NOT EXISTS `impostazioni` (
  `id`      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `chiave`  VARCHAR(100)    NOT NULL UNIQUE,
  `valore`  VARCHAR(255)    NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- UTENTI DI TEST (solo per sviluppo — rimuovere in produzione)
-- ============================================================

-- ADMIN
-- Email: admin@itiscardanopv.edu.it
-- Password: Admin@2026
INSERT INTO utenti (nome, cognome, email, password_hash, ruolo, stato, email_verificata)
VALUES (
  'Giuseppe', 'Dirigente',
  'admin@itiscardanopv.edu.it',
  '$2y$10$.CscAabE4x.ojfYlVASH.uEOHVktzyvIqtIt4N21mA/NdC8C5B9ym',
  'admin', 'attivo', 1
);

-- SEGRETERIA
-- Email: g.ferrari@itiscardanopv.edu.it
-- Password: Segreteria@2026
INSERT INTO utenti (nome, cognome, email, password_hash, ruolo, stato, email_verificata)
VALUES (
  'Giulia', 'Ferrari',
  'g.ferrari@itiscardanopv.edu.it',
  '$2y$10$0RxDwYdaDB4wcv/p5E.IUuvxWW.XPYmc1l1uBPiv4woEFh/VObiiO',
  'segreteria', 'attivo', 1
);

-- STAFF
-- Email: l.conti@itiscardanopv.edu.it
-- Password: Staff@2026
INSERT INTO utenti (nome, cognome, email, password_hash, ruolo, stato, email_verificata)
VALUES (
  'Luca', 'Conti',
  'l.conti@itiscardanopv.edu.it',
  '$2y$10$B2jlOiKffOs1yybkexlqI.9aGkoseM2cb.8RjWRI1f1Xwr2GRacUq',
  'staff', 'attivo', 1
);

-- PROFESSORE
-- Email: s.verdi@itiscardanopv.edu.it
-- Password: Prof@2026
INSERT INTO utenti (nome, cognome, email, password_hash, ruolo, stato, email_verificata)
VALUES (
  'Sara', 'Verdi',
  's.verdi@itiscardanopv.edu.it',
  '$2y$10$dVPHW.XEKV5qmtjRma4GW.oDn1Zeuazf8icCZBp/Eqn42hikR7PmS',
  'professore', 'attivo', 1
);

-- GENITORE
-- Email: mario.rossi@email.it
-- Password: Genitore@2026
INSERT INTO utenti (nome, cognome, email, password_hash, via, cap, citta, telefono, ruolo, stato, email_verificata)
VALUES (
  'Mario', 'Rossi',
  'mario.rossi@email.it',
  '$2y$10$vIZU4eAMIBFv3xNAnQPQd.fNyiraVI.MVIzUPHAmmXDo/mIpGkRh.',
  'Via Roma 14', '27100', 'Pavia', '+39 345 678 9012',
  'genitore', 'attivo', 1
);

-- FIGLIO del genitore Mario Rossi
INSERT INTO figli (id_genitore, nome, cognome, scuola, citta_scuola)
VALUES (
  (SELECT id FROM utenti WHERE email = 'mario.rossi@email.it'),
  'Laura', 'Rossi',
  'SC. Media G. Manzoni', 'Pavia'
);

-- ============================================================
-- EVENTO DI TEST — Open Day
-- ============================================================
INSERT INTO eventi (tipo, titolo, descrizione, data_evento, posti_max, pubblicato,
  apertura_iscrizioni, chiusura_iscrizioni)
VALUES (
  'open_day',
  'Open Day — Test 2026',
  'Evento di test per verificare il sistema.',
  DATE_ADD(CURDATE(), INTERVAL 30 DAY),
  120, 1,
  DATE_SUB(NOW(), INTERVAL 1 DAY),
  DATE_ADD(NOW(), INTERVAL 29 DAY)
);

-- PERCORSI per l'Open Day di test
INSERT INTO percorsi_openday (id_evento, codice, nome, descrizione, posti_max)
VALUES
  ((SELECT id FROM eventi WHERE titolo = 'Open Day — Test 2026'), 'MISTO',   'Percorso Misto',    'Percorso misto tecnico-scientifico', 40),
  ((SELECT id FROM eventi WHERE titolo = 'Open Day — Test 2026'), 'LICEO',   'Liceo Sc. Appl.',   'Liceo scientifico applicato',         40),
  ((SELECT id FROM eventi WHERE titolo = 'Open Day — Test 2026'), 'TECNICO', 'Percorso Tecnico',  'Percorso tecnico industriale',        40);

-- ============================================================
-- EVENTO DI TEST — Cardano Day
-- ============================================================
INSERT INTO eventi (tipo, titolo, descrizione, data_evento, posti_max, pubblicato,
  apertura_iscrizioni, chiusura_iscrizioni,
  inizio_turno1, fine_turno1, inizio_turno2, fine_turno2)
VALUES (
  'cardano_day',
  'Cardano Day — Test 2026',
  'Evento Cardano Day di test con laboratori.',
  DATE_ADD(CURDATE(), INTERVAL 45 DAY),
  300, 1,
  DATE_SUB(NOW(), INTERVAL 1 DAY),
  DATE_ADD(NOW(), INTERVAL 44 DAY),
  '08:30:00', '10:30:00', '11:00:00', '13:00:00'
);

-- LABORATORI per il Cardano Day di test
INSERT INTO laboratori (id_evento, codice, nome, aule_t1, posti_aula_t1, aule_t2, posti_aula_t2)
VALUES
  ((SELECT id FROM eventi WHERE titolo = 'Cardano Day — Test 2026'), 'I', 'Informatica',    2, 25, 1, 25),
  ((SELECT id FROM eventi WHERE titolo = 'Cardano Day — Test 2026'), 'E', 'Elettronica',    1, 25, 1, 25),
  ((SELECT id FROM eventi WHERE titolo = 'Cardano Day — Test 2026'), 'M', 'Meccanica',      1, 25, 2, 25),
  ((SELECT id FROM eventi WHERE titolo = 'Cardano Day — Test 2026'), 'C', 'Chimica',        1, 25, 1, 25),
  ((SELECT id FROM eventi WHERE titolo = 'Cardano Day — Test 2026'), 'L', 'Liceo Sc.Appl.', 1, 25, 1, 25);

-- ============================================================
-- TABELLA IMPOSTAZIONI (anno scolastico e altre config)
-- ============================================================
CREATE TABLE IF NOT EXISTS impostazioni (
  id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  chiave  VARCHAR(80)  NOT NULL UNIQUE,
  valore  VARCHAR(255) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET foreign_key_checks = 1;
