# 13 — Database — Schema MySQL

## 13.1 — Panoramica

Il database MySQL 8+ è strutturato in tabelle normalizzate con chiavi esterne per garantire l'integrità referenziale. Tutte le query usano PDO prepared statements.

### Tabelle del database

| Tabella | Descrizione |
|---------|-------------|
| `utenti` | Account di tutti gli utenti del sistema |
| `figli` | Studenti registrati dai genitori |
| `eventi` | Open Day e Cardano Day |
| `percorsi_open_day` | Percorsi disponibili per evento Open Day |
| `turni` | Turni orari per evento Cardano Day |
| `laboratori` | Istanze di laboratorio per turno ed evento |
| `iscrizioni` | Iscrizione di un figlio a un evento |
| `iscrizioni_laboratori` | Laboratori scelti per un'iscrizione Cardano Day |
| `scuole` | Archivio scuole medie per autocomplete |

---

## 13.2 — Tabella: `utenti`

Account del sistema (tutti i ruoli).

| Campo | Tipo | Constraints | Descrizione |
|-------|------|-------------|-------------|
| `id` | INT | PK, AUTO_INCREMENT | Chiave primaria |
| `nome` | VARCHAR(100) | NOT NULL | Nome |
| `cognome` | VARCHAR(100) | NOT NULL | Cognome |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | Email — usata per login |
| `password` | VARCHAR(255) | NOT NULL | Hash bcrypt — mai in chiaro |
| `via_civico` | VARCHAR(255) | NULL | Via e numero civico (solo Genitori) |
| `cap` | VARCHAR(10) | NULL | CAP (solo Genitori) |
| `citta` | VARCHAR(100) | NULL | Città (solo Genitori) |
| `cellulare` | VARCHAR(20) | NULL | Numero cellulare (solo Genitori) |
| `ruolo` | ENUM | NOT NULL | `genitore` \| `staff_professore` \| `segreteria` \| `admin` |
| `tipo_personale` | ENUM | NULL | `staff` \| `professore` (solo staff_professore) |
| `verificato` | TINYINT(1) | DEFAULT 0 | 0 = non verificato, 1 = verificato |
| `codice_verifica` | VARCHAR(10) | NULL | OTP temporaneo per verifica email |
| `codice_reset` | VARCHAR(64) | NULL | Codice temporaneo per reset password |
| `approvato` | TINYINT(1) | DEFAULT 0 | 0 = in attesa, 1 = approvato (solo Staff/Prof) |
| `sospeso` | TINYINT(1) | DEFAULT 0 | 1 = account sospeso |
| `created_at` | DATETIME | DEFAULT NOW() | Data creazione account |
| `updated_at` | DATETIME | ON UPDATE | Data ultima modifica |

```sql
CREATE TABLE utenti (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  cognome VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  via_civico VARCHAR(255) DEFAULT NULL,
  cap VARCHAR(10) DEFAULT NULL,
  citta VARCHAR(100) DEFAULT NULL,
  cellulare VARCHAR(20) DEFAULT NULL,
  ruolo ENUM('genitore','staff_professore','segreteria','admin') NOT NULL,
  tipo_personale ENUM('staff','professore') DEFAULT NULL,
  verificato TINYINT(1) NOT NULL DEFAULT 0,
  codice_verifica VARCHAR(10) DEFAULT NULL,
  codice_reset VARCHAR(64) DEFAULT NULL,
  approvato TINYINT(1) NOT NULL DEFAULT 0,
  sospeso TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 13.3 — Tabella: `figli`

Studenti registrati da un genitore.

| Campo | Tipo | Constraints | Descrizione |
|-------|------|-------------|-------------|
| `id` | INT | PK, AUTO_INCREMENT | Chiave primaria |
| `id_genitore` | INT | NOT NULL, FK → utenti.id | Genitore proprietario |
| `nome` | VARCHAR(100) | NOT NULL | Nome studente |
| `cognome` | VARCHAR(100) | NOT NULL | Cognome studente |
| `id_scuola` | INT | NULL, FK → scuole.id | Scuola media (se selezionata da lista) |
| `scuola_media` | VARCHAR(255) | NOT NULL | Nome scuola (testo — anche se inserito manualmente) |
| `citta_scuola` | VARCHAR(100) | NOT NULL | Città della scuola media |
| `created_at` | DATETIME | DEFAULT NOW() | Data inserimento |

```sql
CREATE TABLE figli (
  id INT PRIMARY KEY AUTO_INCREMENT,
  id_genitore INT NOT NULL,
  nome VARCHAR(100) NOT NULL,
  cognome VARCHAR(100) NOT NULL,
  id_scuola INT DEFAULT NULL,
  scuola_media VARCHAR(255) NOT NULL,
  citta_scuola VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_genitore) REFERENCES utenti(id) ON DELETE CASCADE,
  FOREIGN KEY (id_scuola) REFERENCES scuole(id) ON SET NULL
);
```

---

## 13.4 — Tabella: `eventi`

Open Day e Cardano Day.

| Campo | Tipo | Constraints | Descrizione |
|-------|------|-------------|-------------|
| `id` | INT | PK, AUTO_INCREMENT | Chiave primaria |
| `tipo` | ENUM | NOT NULL | `open_day` \| `cardano_day` |
| `titolo` | VARCHAR(255) | NOT NULL | Titolo evento |
| `descrizione` | TEXT | NULL | Descrizione pubblica |
| `data_evento` | DATE | NOT NULL | Giorno dell'evento |
| `posti_max` | INT | NOT NULL | Capienza massima |
| `posti_disponibili` | INT | NOT NULL | Decrementato ad ogni iscrizione |
| `apertura_iscrizioni` | DATETIME | NOT NULL | Apertura automatica |
| `chiusura_iscrizioni` | DATETIME | NOT NULL | Chiusura automatica |
| `pubblicato` | TINYINT(1) | DEFAULT 0 | 0 = bozza, 1 = visibile |
| `gruppi_eseguiti` | TINYINT(1) | DEFAULT 0 | 1 = divisione gruppi completata |
| `created_at` | DATETIME | DEFAULT NOW() | Data creazione |

```sql
CREATE TABLE eventi (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tipo ENUM('open_day','cardano_day') NOT NULL,
  titolo VARCHAR(255) NOT NULL,
  descrizione TEXT DEFAULT NULL,
  data_evento DATE NOT NULL,
  posti_max INT NOT NULL,
  posti_disponibili INT NOT NULL,
  apertura_iscrizioni DATETIME NOT NULL,
  chiusura_iscrizioni DATETIME NOT NULL,
  pubblicato TINYINT(1) NOT NULL DEFAULT 0,
  gruppi_eseguiti TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 13.5 — Tabella: `percorsi_open_day`

Percorsi disponibili per ogni evento Open Day.

| Campo | Tipo | Constraints | Descrizione |
|-------|------|-------------|-------------|
| `id` | INT | PK, AUTO_INCREMENT | Chiave primaria |
| `id_evento` | INT | NOT NULL, FK → eventi.id | Evento di riferimento |
| `nome` | VARCHAR(50) | NOT NULL | Es. "Misto", "Liceo Sc. Appl.", "Tecnico" |
| `codice` | CHAR(1) | NOT NULL | M, L, T |
| `posti_max` | INT | NOT NULL | Posti per questo percorso |
| `posti_disponibili` | INT | NOT NULL | Decrementato ad ogni iscrizione |

---

## 13.6 — Tabella: `turni`

Turni orari per ogni evento Cardano Day.

| Campo | Tipo | Constraints | Descrizione |
|-------|------|-------------|-------------|
| `id` | INT | PK, AUTO_INCREMENT | Chiave primaria |
| `id_evento` | INT | NOT NULL, FK → eventi.id | Evento di riferimento |
| `numero` | TINYINT | NOT NULL | 1 oppure 2 |
| `ora_inizio` | TIME | NOT NULL | Es. 08:30:00 |
| `ora_fine` | TIME | NOT NULL | Es. 10:30:00 |

---

## 13.7 — Tabella: `laboratori`

Istanze di laboratorio (aule) per turno ed evento.

| Campo | Tipo | Constraints | Descrizione |
|-------|------|-------------|-------------|
| `id` | INT | PK, AUTO_INCREMENT | Chiave primaria |
| `id_evento` | INT | NOT NULL, FK → eventi.id | Evento di riferimento |
| `id_turno` | INT | NOT NULL, FK → turni.id | Turno di riferimento |
| `nome` | VARCHAR(100) | NOT NULL | Es. "Informatica" |
| `codice_lettera` | CHAR(1) | NOT NULL | I, E, M, C, L |
| `istanza` | TINYINT | NOT NULL | Numero aula: 1, 2, 3... |
| `codice_aula` | VARCHAR(5) | NOT NULL | Es. "I1", "C2", "M2" |
| `posti_max` | INT | NOT NULL | Posti per questa aula |
| `posti_disponibili` | INT | NOT NULL | Decrementato ad ogni assegnazione |

```sql
CREATE TABLE laboratori (
  id INT PRIMARY KEY AUTO_INCREMENT,
  id_evento INT NOT NULL,
  id_turno INT NOT NULL,
  nome VARCHAR(100) NOT NULL,
  codice_lettera CHAR(1) NOT NULL,
  istanza TINYINT NOT NULL DEFAULT 1,
  codice_aula VARCHAR(5) NOT NULL,
  posti_max INT NOT NULL,
  posti_disponibili INT NOT NULL,
  FOREIGN KEY (id_evento) REFERENCES eventi(id) ON DELETE CASCADE,
  FOREIGN KEY (id_turno) REFERENCES turni(id) ON DELETE CASCADE
);
```

---

## 13.8 — Tabella: `iscrizioni`

Una riga per ogni figlio iscritto a un evento.

| Campo | Tipo | Constraints | Descrizione |
|-------|------|-------------|-------------|
| `id` | INT | PK, AUTO_INCREMENT | Chiave primaria |
| `id_figlio` | INT | NOT NULL, FK → figli.id | Figlio iscritto |
| `id_evento` | INT | NOT NULL, FK → eventi.id | Evento di riferimento |
| `id_percorso` | INT | NULL, FK → percorsi_open_day.id | NULL per Cardano Day |
| `id_gruppo` | INT | NULL | Numero gruppo assegnato (dopo divisione) |
| `codice_gruppo` | VARCHAR(5) | NULL | Es. "M1", "T2", "L3" |
| `qr_code` | VARCHAR(64) | NOT NULL, UNIQUE | Codice hex 32 char — generato da Node.js |
| `stato` | ENUM | NOT NULL | `confermata` \| `annullata` |
| `firma_entrata` | DATETIME | NULL | Timestamp firma 1 |
| `firma_lab1` | DATETIME | NULL | Timestamp firma 2 |
| `firma_lab2` | DATETIME | NULL | Timestamp firma 3 (NULL se 1 solo lab) |
| `firma_uscita` | DATETIME | NULL | Timestamp firma 4 |
| `created_at` | DATETIME | DEFAULT NOW() | Data iscrizione |

```sql
CREATE TABLE iscrizioni (
  id INT PRIMARY KEY AUTO_INCREMENT,
  id_figlio INT NOT NULL,
  id_evento INT NOT NULL,
  id_percorso INT DEFAULT NULL,
  id_gruppo INT DEFAULT NULL,
  codice_gruppo VARCHAR(5) DEFAULT NULL,
  qr_code VARCHAR(64) NOT NULL UNIQUE,
  stato ENUM('confermata','annullata') NOT NULL DEFAULT 'confermata',
  firma_entrata DATETIME DEFAULT NULL,
  firma_lab1 DATETIME DEFAULT NULL,
  firma_lab2 DATETIME DEFAULT NULL,
  firma_uscita DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_figlio) REFERENCES figli(id),
  FOREIGN KEY (id_evento) REFERENCES eventi(id),
  FOREIGN KEY (id_percorso) REFERENCES percorsi_open_day(id),
  UNIQUE KEY unique_figlio_evento (id_figlio, id_evento)
);
```

---

## 13.9 — Tabella: `iscrizioni_laboratori`

Laboratori scelti per ogni iscrizione Cardano Day (1 o 2 righe per iscrizione).

| Campo | Tipo | Constraints | Descrizione |
|-------|------|-------------|-------------|
| `id` | INT | PK, AUTO_INCREMENT | Chiave primaria |
| `id_iscrizione` | INT | NOT NULL, FK → iscrizioni.id | Iscrizione di riferimento |
| `id_laboratorio` | INT | NULL, FK → laboratori.id | Laboratorio assegnato (dopo divisione) |
| `codice_lettera` | CHAR(1) | NOT NULL | Lab scelto: I, E, M, C, L |
| `turno` | TINYINT | NULL | 1 o 2 (assegnato dall'algoritmo) |
| `codice_aula` | VARCHAR(5) | NULL | Es. "E1", "C2" (assegnato dall'algoritmo) |

---

## 13.10 — Tabella: `scuole`

Archivio scuole medie per l'autocomplete.

| Campo | Tipo | Constraints | Descrizione |
|-------|------|-------------|-------------|
| `id` | INT | PK, AUTO_INCREMENT | Chiave primaria |
| `nome` | VARCHAR(255) | NOT NULL | Nome istituto |
| `comune` | VARCHAR(100) | NOT NULL | Comune |
| `provincia` | CHAR(2) | NOT NULL | Sigla provincia (es. "PV") |
| `indirizzo` | VARCHAR(255) | NULL | Indirizzo completo |

---

*Sezione precedente: [12 — API REST](../12_api/12_api.md) | Successiva: [14 — Sicurezza](../14_sicurezza/14_sicurezza.md)*
