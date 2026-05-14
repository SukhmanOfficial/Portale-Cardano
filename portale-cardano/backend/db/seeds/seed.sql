-- ============================================================
-- SEED — Dati di test completi
-- Sistema Cardano Day — ITIS G. Cardano, Pavia
--
-- Eseguire DOPO le migration 001, 002, 003
-- NOTA: scuole e comuni NON vengono mai svuotate (dati permanenti)
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
TRUNCATE TABLE utenti;
-- scuole e comuni NON vengono svuotate: sono dati di riferimento permanenti

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- UTENTI
-- Password per tutti: "Password1!" → hash bcrypt rounds=10
-- ============================================================
INSERT INTO utenti (id, nome, cognome, email, password, indirizzo, comune, cap, cellulare, ruolo, verificato) VALUES

-- Segreteria
(1, 'Segreteria', 'ITIS Cardano', 'segreteria@itiscardanopv.edu.it',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 NULL, NULL, NULL, NULL, 'segreteria', 1),

-- Staff / Professori
(2, 'Anna', 'Ferrari', 'a.ferrari@itiscardanopv.edu.it',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 NULL, NULL, NULL, NULL, 'staff_professore', 1),

(3, 'Marco', 'Bianchi', 'm.bianchi@itiscardanopv.edu.it',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 NULL, NULL, NULL, NULL, 'staff_professore', 1),

(4, 'Laura', 'Conti', 'l.conti@itiscardanopv.edu.it',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 NULL, NULL, NULL, NULL, 'staff_professore', 0),

-- Genitori verificati
(5, 'Mario', 'Rossi', 'mario.rossi@email.it',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'Via Roma 15', 'Pavia', '27100', '+39 333 1234567', 'genitore', 1),

(6, 'Giulia', 'Verdi', 'giulia.verdi@email.it',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'Via Mazzini 8', 'Voghera', '27058', '+39 347 9876543', 'genitore', 1),

(7, 'Roberto', 'Colombo', 'roberto.colombo@email.it',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'Corso Cavour 22', 'Pavia', '27100', '+39 339 5551234', 'genitore', 1),

(8, 'Francesca', 'Bruno', 'f.bruno@email.it',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'Via Garibaldi 5', 'Lodi', '26900', '+39 335 7771111', 'genitore', 1),

(9, 'Antonio', 'Russo', 'a.russo@email.it',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'Viale Po 3', 'Pavia', '27100', '+39 320 4443333', 'genitore', 1),

(10, 'Chiara', 'Galli', 'c.galli@email.it',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'Via Cavour 11', 'Vigevano', '27029', '+39 348 2221100', 'genitore', 1);


-- ============================================================
-- FIGLI
-- ============================================================
INSERT INTO figli (id, nome, cognome, scuola_media, citta_scuola, id_genitore) VALUES
(1,  'Luca',     'Rossi',    'SMS G. Mazzini',   'Pavia',    5),
(2,  'Sofia',    'Verdi',    'SMS A. Volta',      'Voghera',  6),
(3,  'Matteo',   'Colombo',  'SMS C. Darwin',     'Pavia',    7),
(4,  'Emma',     'Bruno',    'SMS L. Da Vinci',   'Lodi',     8),
(5,  'Giorgio',  'Russo',    'SMS G. Mazzini',    'Pavia',    9),
(6,  'Alice',    'Galli',    'SMS Cavour',        'Vigevano', 10),
(7,  'Lorenzo',  'Rossi',    'SMS G. Mazzini',    'Pavia',    5),
(8,  'Martina',  'Colombo',  'SMS C. Darwin',     'Pavia',    7);


-- ============================================================
-- RICHIESTE RUOLO (staff in attesa di approvazione)
-- ============================================================
INSERT INTO richieste_ruolo (id_utente, ruolo_richiesto, stato) VALUES
(4, 'professore', 'in_attesa');


-- ============================================================
-- EVENTI
-- ============================================================
INSERT INTO eventi (id, tipo, titolo, descrizione, data_evento, posti_max, posti_disponibili,
                    apertura_iscrizioni, chiusura_iscrizioni, pubblicato) VALUES

-- Open Day Novembre 2026
(1, 'open_day', 'Open Day Novembre 2026',
 'Scopri i corsi e gli indirizzi disponibili all''ITIS Cardano. Tre percorsi: Misto, Liceo e Tecnico.',
 '2026-11-18', 200, 48,
 '2026-11-01 08:00:00', '2026-11-10 23:59:00', 1),

-- Cardano Day Novembre 2026 (Giorno 1)
(2, 'cardano_day', 'Cardano Lab — Giorno 1',
 'Visita i laboratori: Informatica, Chimica, Meccanica, Elettrotecnica e Liceo Sc.Appl.',
 '2026-11-24', 175, 15,
 '2026-11-01 08:00:00', '2026-11-16 23:59:00', 1),

-- Open Day Dicembre 2026 (bozza)
(3, 'open_day', 'Open Day Dicembre 2026',
 'Secondo appuntamento per scoprire l''offerta formativa.',
 '2026-12-18', 200, 200,
 '2026-12-01 08:00:00', '2026-12-10 23:59:00', 0),

-- Cardano Day Gennaio 2027 (bozza)
(4, 'cardano_day', 'Cardano Lab — Giorno 2',
 'Secondo giorno di laboratori pratici con i professori.',
 '2027-01-13', 175, 175,
 '2026-12-15 08:00:00', '2027-01-05 23:59:00', 0);


-- ============================================================
-- TURNI (solo Cardano Day)
-- ============================================================
INSERT INTO turni (id, id_evento, numero, ora_inizio, ora_fine) VALUES
-- Evento 2 (Cardano Day Nov 2026)
(1, 2, 1, '08:30:00', '10:30:00'),
(2, 2, 2, '11:00:00', '13:00:00'),
-- Evento 4 (Cardano Day Gen 2027)
(3, 4, 1, '08:30:00', '10:30:00'),
(4, 4, 2, '11:00:00', '13:00:00');


-- ============================================================
-- LABORATORI (Cardano Day Nov 2026 — evento id=2)
-- lettera: I=Informatica, E=Elettrotecnica, M=Meccanica, C=Chimica, L=Liceo
-- ============================================================
INSERT INTO laboratori (id, id_evento, id_turno, nome, lettera, istanza, posti_max, posti_disponibili) VALUES
-- Turno 1 (id_turno=1): 8:30-10:30
(1,  2, 1, 'Informatica',      'I', 1, 25, 7),
(2,  2, 1, 'Informatica',      'I', 2, 25, 8),
(3,  2, 1, 'Elettrotecnica',   'E', 1, 25, 3),
(4,  2, 1, 'Meccanica',        'M', 1, 25, 4),
(5,  2, 1, 'Chimica',          'C', 1, 25, 5),
(6,  2, 1, 'Liceo Sc.Appl.',   'L', 1, 25, 6),

-- Turno 2 (id_turno=2): 11:00-13:00
(7,  2, 2, 'Informatica',      'I', 1, 25, 5),
(8,  2, 2, 'Elettrotecnica',   'E', 1, 25, 9),
(9,  2, 2, 'Elettrotecnica',   'E', 2, 25, 10),
(10, 2, 2, 'Meccanica',        'M', 1, 25, 6),
(11, 2, 2, 'Meccanica',        'M', 2, 25, 7),
(12, 2, 2, 'Chimica',          'C', 1, 25, 8),
(13, 2, 2, 'Liceo Sc.Appl.',   'L', 1, 25, 18);


-- ============================================================
-- PERCORSI OPEN DAY (evento id=1)
-- ============================================================
INSERT INTO percorsi_open_day (id, id_evento, nome, codice, descrizione, posti_max, posti_disponibili) VALUES
(1, 1, 'Percorso Misto',   'M', 'Visita combinata ai laboratori tecnici e scientifici.', 70, 16),
(2, 1, 'Percorso Liceo',   'L', 'Visita agli indirizzi liceali con focus sulle scienze applicate.', 60, 18),
(3, 1, 'Percorso Tecnico', 'T', 'Visita agli indirizzi tecnici industriali.', 70, 14);


-- ============================================================
-- ISCRIZIONI
-- ============================================================
INSERT INTO iscrizioni (id, id_figlio, id_evento, id_percorso, qr_code, stato,
                         firma_entrata, firma_lab1, firma_lab2, firma_uscita) VALUES
-- Luca Rossi → Cardano Day (iscrizione confermata, con firme)
(1, 1, 2, NULL,
 'a3f8c2d1e4b5f67890abcdef1234567890abcdef1234567890abcdef12345678',
 'confermata',
 '2026-11-24 08:12:00', '2026-11-24 08:35:00', '2026-11-24 11:05:00', '2026-11-24 13:15:00'),

-- Luca Rossi → Open Day (iscrizione confermata)
(2, 1, 1, 3,
 'b4e9d3c2f5a6e78901bcdef2345678901bcdef2345678901bcdef234567890ab',
 'confermata',
 NULL, NULL, NULL, NULL),

-- Sofia Verdi → Cardano Day
(3, 2, 2, NULL,
 'c5fa4d3e6b7f89012cdef3456789012cdef3456789012cdef3456789012cdef3',
 'confermata',
 NULL, NULL, NULL, NULL),

-- Matteo Colombo → Open Day
(4, 3, 1, 1,
 'd6ab5e4f7c8e90123def4567890123def4567890123def4567890123def45678',
 'confermata',
 NULL, NULL, NULL, NULL),

-- Emma Bruno → Cardano Day
(5, 4, 2, NULL,
 'e7bc6f5a8d9f01234ef5678901234ef5678901234ef5678901234ef56789012',
 'confermata',
 NULL, NULL, NULL, NULL),

-- Giorgio Russo → Open Day percorso Misto
(6, 5, 1, 1,
 'f8cd7a6b9e0a12345fa6789012345fa6789012345fa6789012345fa678901234',
 'confermata',
 NULL, NULL, NULL, NULL),

-- Alice Galli → Cardano Day (annullata)
(7, 6, 2, NULL,
 'a9de8b7c0f1b23456ab7890123456ab7890123456ab7890123456ab78901234',
 'annullata',
 NULL, NULL, NULL, NULL);


-- ============================================================
-- ISCRIZIONI LABORATORI
-- (Luca Rossi: I1 turno1 + M1 turno2)
-- (Sofia Verdi: E1 turno1 + C1 turno2)
-- (Emma Bruno: L1 turno1)
-- ============================================================
INSERT INTO iscrizioni_laboratori (id_iscrizione, id_laboratorio) VALUES
(1, 1),   -- Luca → Informatica aula 1 turno 1
(1, 10),  -- Luca → Meccanica aula 1 turno 2
(3, 3),   -- Sofia → Elettrotecnica aula 1 turno 1
(3, 12),  -- Sofia → Chimica aula 1 turno 2
(5, 6),   -- Emma → Liceo Sc.Appl. aula 1 turno 1
(7, 7);   -- Alice (annullata) → Informatica aula 1 turno 2


-- ============================================================
-- GRUPPI (già generati per il Cardano Day Nov 2026)
-- ============================================================
INSERT INTO gruppi (id, id_evento, nome, tipo) VALUES
-- Cardano Day gruppi
(1, 2, 'I1', 'Informatica'),
(2, 2, 'I2', 'Informatica'),
(3, 2, 'M1', 'Meccanica'),
(4, 2, 'M2', 'Meccanica'),
(5, 2, 'C1', 'Chimica'),
(6, 2, 'C2', 'Chimica'),
(7, 2, 'E1', 'Elettrotecnica'),
(8, 2, 'E2', 'Elettrotecnica'),
(9, 2, 'L1', 'Liceo Sc.Appl.'),
-- Open Day gruppi
(10, 1, 'M1', 'Misto'),
(11, 1, 'M2', 'Misto'),
(12, 1, 'M3', 'Misto'),
(13, 1, 'L1', 'Liceo'),
(14, 1, 'L2', 'Liceo'),
(15, 1, 'T1', 'Tecnico'),
(16, 1, 'T2', 'Tecnico'),
(17, 1, 'T3', 'Tecnico');


-- ============================================================
-- ISCRIZIONI GRUPPI
-- ============================================================
INSERT INTO iscrizioni_gruppi (id_iscrizione, id_gruppo) VALUES
(1, 1),   -- Luca → gruppo I1 (Cardano Day)
(2, 17),  -- Luca → gruppo T3 (Open Day)
(3, 7),   -- Sofia → gruppo E1 (Cardano Day)
(4, 10),  -- Matteo → gruppo M1 (Open Day)
(5, 9),   -- Emma → gruppo L1 (Cardano Day)
(6, 10);  -- Giorgio → gruppo M1 (Open Day)


-- ============================================================
-- SCUOLE MEDIE (dati permanenti — INSERT IGNORE per sicurezza)
-- ============================================================
INSERT IGNORE INTO scuole (nome, comune, provincia) VALUES
('SMS G. Mazzini',                  'Pavia',             'PV'),
('SMS A. Volta',                    'Voghera',           'PV'),
('SMS C. Darwin',                   'Pavia',             'PV'),
('SMS L. Da Vinci',                 'Lodi',              'LO'),
('SMS Cavour',                      'Vigevano',          'PV'),
('SMS G. Pascoli',                  'Mortara',           'PV'),
('SMS E. Fermi',                    'Pavia',             'PV'),
('SMS A. Manzoni',                  'Abbiategrasso',     'MI'),
('SMS Don Milani',                  'Voghera',           'PV'),
('SMS Giusti',                      'Vigevano',          'PV'),
('IC Comprensivo Bereguardo',       'Bereguardo',        'PV'),
('SMS Foscolo',                     'Lodi',              'LO'),
('SMS Galilei',                     'Pavia',             'PV'),
('SMS Battisti',                    'Certosa di Pavia',  'PV'),
('SMS Pavese',                      'Pavia',             'PV');


-- ============================================================
-- COMUNI (dati permanenti — INSERT IGNORE per sicurezza)
-- ============================================================
INSERT IGNORE INTO comuni (nome_comune, provincia, cap, regione) VALUES
('Pavia',               'PV', '27100',           'Lombardia'),
('Voghera',             'PV', '27058',           'Lombardia'),
('Vigevano',            'PV', '27029',           'Lombardia'),
('Lodi',                'LO', '26900',           'Lombardia'),
('Mortara',             'PV', '27036',           'Lombardia'),
('Abbiategrasso',       'MI', '20081',           'Lombardia'),
('Certosa di Pavia',    'PV', '27012',           'Lombardia'),
('Bereguardo',          'PV', '27021',           'Lombardia'),
('Milano',              'MI', '20100,20121,20122,20123,20124,20125,20126,20127,20128,20129,20131,20132,20133,20134,20135,20136,20137,20138,20139,20141,20142,20143,20144,20145,20146,20147,20148,20149,20151,20152,20153,20154,20155,20156,20157,20158,20159,20161,20162', 'Lombardia'),
('Brescia',             'BS', '25100',           'Lombardia'),
('Cremona',             'CR', '26100',           'Lombardia'),
('Varese',              'VA', '21100',           'Lombardia'),
('Como',                'CO', '22100',           'Lombardia'),
('Monza',               'MB', '20900',           'Lombardia'),
('Bergamo',             'BG', '24100',           'Lombardia'),
('Pavia Ovest',         'PV', '27100',           'Lombardia'),
('Stradella',           'PV', '27049',           'Lombardia'),
('Broni',               'PV', '27043',           'Lombardia'),
('Casteggio',           'PV', '27045',           'Lombardia'),
('Belgioioso',          'PV', '27011',           'Lombardia');


-- ============================================================
-- AUDIT LOG (campione)
-- ============================================================
INSERT INTO audit_log (id_utente, azione, dettagli, ip) VALUES
(5, 'registrazione',        '{"ruolo": "genitore"}',                        '192.168.1.10'),
(5, 'login',                '{"success": true}',                            '192.168.1.10'),
(5, 'iscrizione_creata',    '{"id_iscrizione": 1, "id_evento": 2}',         '192.168.1.10'),
(1, 'divisione_gruppi',     '{"id_evento": 2, "n_iscrizioni": 160}',        '10.0.0.1'),
(2, 'firma_registrata',     '{"id_iscrizione": 1, "fase": 1}',              '10.0.0.2'),
(2, 'firma_registrata',     '{"id_iscrizione": 1, "fase": 2}',              '10.0.0.2');
