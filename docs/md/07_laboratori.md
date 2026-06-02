# 07 — Laboratori, Turni e Aule (Cardano Day)

## 7.1 — Laboratori Disponibili

Il Cardano Day prevede 5 laboratori visitabili:

| Laboratorio | Codice lettera | Icona |
|-------------|:--------------:|-------|
| Informatica | **I** | 💻 |
| Elettronica | **E** | ⚡ |
| Meccanica | **M** | ⚙️ |
| Chimica | **C** | 🧪 |
| Liceo Sc. Appl. | **L** | 🔬 |

---

## 7.2 — Struttura dei Turni

Ogni giornata Cardano Day è divisa in **2 turni fissi** (configurabili dalla segreteria):

| Turno | Orario | Durata |
|-------|--------|--------|
| **Turno 1** | 8:30 – 10:30 | 2 ore |
| **Turno 2** | 11:00 – 13:00 | 2 ore |

Lo studente può visitare:
- **1 laboratorio** → assegnato a Turno 1 oppure Turno 2 (quello con più disponibilità)
- **2 laboratori** → uno per turno (uno diverso dall'altro)

> ⚠️ Il genitore **non sceglie** l'orario. Sceglie solo i laboratori. L'algoritmo assegna il turno automaticamente.

---

## 7.3 — Configurazione Aule

La segreteria configura il numero di aule per ogni laboratorio in ogni turno, evento per evento. L'algoritmo bilancia gli studenti tra tutte le aule disponibili.

### Esempio configurazione — Cardano Day 24 Nov 2026

| Laboratorio | Turno 1 (8:30–10:30) | Turno 2 (11:00–13:00) | Totale posti |
|-------------|----------------------|-----------------------|:------------:|
| Informatica | 2 aule × 25 posti = **50** | 1 aula × 25 posti = **25** | 75 |
| Elettronica | 1 aula × 25 posti = **25** | 1 aula × 25 posti = **25** | 50 |
| Meccanica | 1 aula × 25 posti = **25** | 2 aule × 25 posti = **50** | 75 |
| Chimica | 1 aula × 25 posti = **25** | 1 aula × 25 posti = **25** | 50 |
| Liceo Sc. Appl. | 1 aula × 25 posti = **25** | 1 aula × 25 posti = **25** | 50 |
| **TOTALE** | | | **300** |

---

## 7.4 — Codici Aula

Il codice aula è composto da: **lettera del laboratorio + numero aula**

| Codice | Significato |
|--------|-------------|
| `I1` | Informatica — Aula 1 |
| `I2` | Informatica — Aula 2 |
| `E1` | Elettronica — Aula 1 |
| `M1` | Meccanica — Aula 1 |
| `M2` | Meccanica — Aula 2 |
| `C1` | Chimica — Aula 1 |
| `C2` | Chimica — Aula 2 |
| `L1` | Liceo Sc. Appl. — Aula 1 |

Il numero di aule disponibili dipende dalla configurazione impostata dalla segreteria per ogni evento.

---

## 7.5 — Esempio Assegnazioni Reali

Dopo l'esecuzione dell'algoritmo di bilanciamento:

| Studente | Lab scelto 1 | Lab scelto 2 | Cod. T1 | Ora T1 | Cod. T2 | Ora T2 |
|---------|-------------|-------------|:-------:|--------|:-------:|--------|
| Abbiati Laura | Elettronica | Chimica | **E1** | 8:30 | **C2** | 11:00 |
| Albanese Riccardo | Meccanica | Elettronica | **M1** | 8:30 | **E2** | 11:00 |
| Badino Riccardo | Liceo Sc.Appl. | — | **L1** | 8:30 | — | — |
| Badino Federico | Liceo Sc.Appl. | — | — | — | **L2** | 11:00 |
| Barbieri Andrea | Informatica | Meccanica | **I1** | 8:30 | **M2** | 11:00 |
| Barocelli Luca | Chimica | Elettronica | **E1** | 8:30 | **C2** | 11:00 |
| Belluscio Denis | Informatica | — | — | — | **I2** | 11:00 |
| Bigi C.J. Corrado | Chimica | Meccanica | **M1** | 8:30 | **C2** | 11:00 |
| Bosincianu Matei | Elettronica | Informatica | **I1** | 8:30 | **E2** | 11:00 |

> **Nota**: Gli studenti con 1 solo laboratorio vengono assegnati al turno con più disponibilità in quel momento.

---

## 7.6 — Visualizzazione per il Genitore

Dopo la divisione in gruppi, il genitore vede nell'area personale:

| Informazione | Esempio |
|-------------|---------|
| Codice aula Turno 1 | **E1** |
| Nome laboratorio T1 | Elettronica — Aula 1 |
| Orario Turno 1 | 8:30 – 10:30 |
| Codice aula Turno 2 | **C2** |
| Nome laboratorio T2 | Chimica — Aula 2 |
| Orario Turno 2 | 11:00 – 13:00 |

> Prima della divisione in gruppi, l'area mostra solo i laboratori scelti, senza codici aula.

---

## 7.7 — Visualizzazione per Staff / Professori

Lo Staff vede l'elenco completo degli studenti del proprio laboratorio con:

| Colonna | Esempio |
|---------|---------|
| Nome e Cognome | Abbiati Laura |
| Scuola di provenienza | SC. Media Manzoni |
| Città | Pavia |
| Laboratorio T1 | **E1** |
| Orario T1 | 8:30 |
| Laboratorio T2 | **C2** |
| Orario T2 | 11:00 |
| Firma 1 (Entrata) | ✅ |
| Firma 2 (Lab T1) | ✅ |
| Firma 3 (Lab T2) | — |
| Firma 4 (Uscita) | — |

Filtri disponibili per Staff: per laboratorio, per codice aula (I1, C2...), per nome studente.

---

*Sezione precedente: [06 — Eventi](../06_eventi/06_eventi.md) | Successiva: [08 — Divisione Gruppi](../08_gruppi/08_gruppi.md)*
