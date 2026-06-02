# UML — Diagrammi del Sistema Cardano Day

Tutti i diagrammi sono scritti in sintassi **Mermaid** e possono essere visualizzati su [mermaid.live](https://mermaid.live) oppure in qualsiasi editor che supporti Mermaid (GitHub, GitLab, Notion, Obsidian, ecc.).

---

## UML 1 — Diagramma Use Case

Mostra gli attori e le funzionalità accessibili a ciascun ruolo.

```mermaid
graph TD
    subgraph Attori
        G([👤 Genitore])
        S([🏫 Staff / Professore])
        SEG([📋 Segreteria])
        ADM([👑 Admin])
    end

    subgraph Sistema Cardano Day
        UC1[Registrarsi]
        UC2[Login]
        UC3[Inserire figlio]
        UC4[Iscrivere figlio a evento]
        UC5[Scegliere percorso Open Day]
        UC6[Scegliere laboratori Cardano Day]
        UC7[Scaricare QR code]
        UC8[Annullare iscrizione]

        UC9[Scansionare QR code]
        UC10[Registrare firma 1 - Entrata]
        UC11[Registrare firma 2 - Lab T1]
        UC12[Registrare firma 3 - Lab T2]
        UC13[Registrare firma 4 - Uscita]
        UC14[Visualizzare elenco studenti]

        UC15[Creare evento]
        UC16[Configurare laboratori e turni]
        UC17[Approvare Staff/Professori]
        UC18[Eseguire divisione gruppi]
        UC19[Spostare studenti tra gruppi]
        UC20[Esportare Excel]
        UC21[Inviare email/notifiche]
        UC22[Gestire utenti]

        UC23[Visualizzare dashboard sola lettura]
        UC24[Assegnare ruolo Segreteria]
        UC25[Revocare ruolo Segreteria]
    end

    G --> UC1
    G --> UC2
    G --> UC3
    G --> UC4
    UC4 --> UC5
    UC4 --> UC6
    G --> UC7
    G --> UC8

    S --> UC2
    S --> UC9
    UC9 --> UC10
    UC9 --> UC11
    UC9 --> UC12
    UC9 --> UC13
    S --> UC14

    SEG --> UC2
    SEG --> UC15
    SEG --> UC16
    SEG --> UC17
    SEG --> UC18
    UC18 --> UC19
    SEG --> UC20
    SEG --> UC21
    SEG --> UC22
    SEG --> UC14

    ADM --> UC2
    ADM --> UC23
    ADM --> UC24
    ADM --> UC25
```

---

## UML 2 — Diagramma di Sequenza: Registrazione Genitore

```mermaid
sequenceDiagram
    actor G as Genitore
    participant FE as Frontend
    participant API as PHP API
    participant DB as MySQL
    participant MAIL as Server Email

    G->>FE: Clicca "Registrati"
    FE->>G: Mostra form registrazione

    G->>FE: Compila e invia form
    FE->>API: POST /api/auth/?action=register
    API->>DB: SELECT email (verifica unicità)
    DB-->>API: Email non trovata

    API->>DB: INSERT utenti (verificato=0)
    API->>MAIL: Invia OTP 6 cifre
    API-->>FE: 201 Created — OTP inviato

    FE->>G: Mostra schermata inserimento OTP
    G->>FE: Inserisce codice OTP
    FE->>API: POST /api/auth/?action=verify
    API->>DB: Verifica OTP + scadenza
    DB-->>API: OTP valido
    API->>DB: UPDATE verificato=1, codice_verifica=NULL
    API-->>FE: 200 OK — Account attivato
    FE->>G: Redirect area personale
```

---

## UML 3 — Diagramma di Sequenza: Iscrizione Cardano Day

```mermaid
sequenceDiagram
    actor G as Genitore
    participant FE as Frontend
    participant API as PHP API
    participant DB as MySQL
    participant NODE as Node.js
    participant MAIL as Server Email

    G->>FE: Clicca "Iscriviti ora" (Cardano Day)
    FE->>API: GET /api/events/?id=2
    API->>DB: SELECT evento + laboratori disponibili
    DB-->>API: Dati evento
    API-->>FE: Dettagli evento + posti
    FE->>G: Mostra form iscrizione

    G->>FE: Seleziona figlio + laboratori (es. E + C)
    FE->>API: POST /api/registrations/
    API->>DB: Verifica posti disponibili
    API->>DB: Verifica figlio non già iscritto
    DB-->>API: OK

    API->>DB: INSERT iscrizione (stato=confermata)
    API->>DB: INSERT iscrizioni_laboratori (E, C)
    API->>DB: UPDATE posti_disponibili -1

    API->>NODE: Genera QR code (randomBytes)
    NODE-->>API: { codice: "a3f8c2...", png, pdf }

    API->>DB: UPDATE iscrizioni SET qr_code
    API->>MAIL: Invia email con QR PDF allegato
    API-->>FE: 201 Created — iscrizione confermata
    FE->>G: Mostra riepilogo + QR code
```

---

## UML 4 — Diagramma di Sequenza: Scansione QR (Firma 2)

```mermaid
sequenceDiagram
    actor ST as Staff
    participant APP as App Scanner
    participant API as PHP API
    participant DB as MySQL

    ST->>APP: Seleziona laboratorio (E1)
    ST->>APP: Inquadra QR code studente
    APP->>API: POST /api/qr/?action=scan
    Note right of APP: { qr_codice, firma: 2, lab: "E", aula: "E1" }

    API->>DB: SELECT iscrizione WHERE qr_code = ?
    DB-->>API: Iscrizione trovata

    API->>DB: Verifica firma 1 presente
    DB-->>API: firma_entrata != NULL ✅

    API->>DB: Verifica lab assegnato per T1
    DB-->>API: lab_t1 = "E1"

    alt Lab corretto
        API->>DB: UPDATE firma_lab1 = NOW()
        API-->>APP: { success: true, lab_corretto: true, studente: {...} }
        APP->>ST: ✅ "Firma 2 registrata — Studente nel lab corretto"
    else Lab sbagliato
        API-->>APP: { success: false, errore: "laboratorio_errato", lab_corretto: "M1" }
        APP->>ST: ❌ "Deve andare in: Meccanica — Aula M1"
    else Firma 1 mancante
        API-->>APP: { success: false, errore: "firma_precedente_mancante" }
        APP->>ST: ⚠️ "Firma 1 mancante — Registra comunque?"
    end
```

---

## UML 5 — Diagramma di Sequenza: Divisione Gruppi

```mermaid
sequenceDiagram
    actor SEG as Segreteria
    participant FE as Frontend
    participant API as PHP API
    participant NODE as Node.js
    participant DB as MySQL
    participant MAIL as Server Email

    SEG->>FE: Clicca "Esegui divisione gruppi"
    FE->>API: POST /api/registrations/?action=dividi&ev=1

    API->>DB: SELECT iscritti con lab scelti
    DB-->>API: Lista 87 iscritti

    API->>NODE: Esegui script dividi_gruppi.js
    Note right of API: shell_exec("node dividi_gruppi.js --evento=1")

    NODE->>NODE: Raggruppa per combinazione lab
    NODE->>NODE: Assegna turni e aule (bilanciamento)
    NODE->>DB: UPDATE iscrizioni SET codice_aula
    NODE->>NODE: Genera QR aggiornati per ogni studente
    NODE-->>API: { success: true, gruppi: [...] }

    API-->>FE: Anteprima gruppi formati
    FE->>SEG: Mostra anteprima (M1, M2, L1, T1...)

    SEG->>FE: Aggiusta manualmente (opzionale)
    SEG->>FE: Clicca "Conferma e invia email"

    FE->>API: POST /api/registrations/?action=conferma&ev=1
    API->>MAIL: Invia QR aggiornato a ogni genitore (87 email)
    API->>DB: SET gruppi_eseguiti = 1
    API-->>FE: { success: true }
    FE->>SEG: "Gruppi confermati — 87 email inviate"
```

---

## UML 6 — Diagramma di Attività: Flusso Iscrizione

```mermaid
flowchart TD
    A([Inizio]) --> B{Genitore ha account?}
    B -- No --> C[Registrazione + OTP]
    C --> D[Login]
    B -- Si --> D

    D --> E{Figlio inserito?}
    E -- No --> F[Inserisci figlio]
    F --> G
    E -- Si --> G

    G{Evento disponibile?} -- No --> H([Fine — nessun evento])
    G -- Si --> I[Seleziona evento]

    I --> J{Tipo evento?}
    J -- Open Day --> K[Scegli percorso\nMisto / Liceo / Tecnico]
    J -- Cardano Day --> L[Scegli 1 o 2 laboratori\nmax 1 per turno]

    K --> M{Posti disponibili?}
    L --> M

    M -- No --> N[❌ Selezione bloccata]
    M -- Si --> O[Riepilogo iscrizione]

    O --> P[Conferma iscrizione]
    P --> Q[Genera QR code]
    Q --> R[Invia email con QR PDF]
    R --> S([Fine — Iscrizione completata])
```

---

## UML 7 — Diagramma dei Componenti

```mermaid
graph TB
    subgraph Client
        FE_PUB[Frontend Pubblico\nHTML/CSS/JS]
        FE_STAFF[Frontend Staff\nHTML/CSS/JS]
        FE_SEG[Frontend Segreteria\nHTML/CSS/JS]
        FE_ADM[Frontend Admin\nHTML/CSS/JS]
        SCANNER[Scanner QR\nCamera API]
    end

    subgraph Backend PHP
        API_AUTH[/api/auth/\nAutenticazione]
        API_EV[/api/events/\nEventi]
        API_REG[/api/registrations/\nIscrizioni]
        API_QR[/api/qr/\nScanner Firme]
        API_USR[/api/users/\nUtenti]
        API_ADM[/api/admin/\nAdmin]
        JWT_MW[JWT Middleware\nAuthn/Authz]
    end

    subgraph Processi
        NODE_QR[Node.js\nGenerazione QR]
        NODE_GRP[Node.js\nDivisione Gruppi]
        NODE_STAT[Node.js\nStatistiche]
        SMTP[SMTP\nInvio Email]
    end

    subgraph Persistenza
        DB[(MySQL 8+\nDatabase)]
        FILES[File System\nQR PNG/PDF]
    end

    FE_PUB --> API_AUTH
    FE_PUB --> API_EV
    FE_PUB --> API_REG
    FE_STAFF --> API_QR
    FE_STAFF --> API_USR
    FE_SEG --> API_EV
    FE_SEG --> API_REG
    FE_SEG --> API_USR
    FE_ADM --> API_ADM
    SCANNER --> API_QR

    API_AUTH --> JWT_MW
    API_EV --> JWT_MW
    API_REG --> JWT_MW
    API_QR --> JWT_MW
    API_USR --> JWT_MW
    API_ADM --> JWT_MW

    JWT_MW --> DB
    API_REG --> NODE_QR
    API_REG --> NODE_GRP
    API_ADM --> NODE_STAT
    NODE_QR --> FILES
    NODE_QR --> SMTP
    NODE_GRP --> DB
    NODE_GRP --> SMTP
```

---

## UML 8 — Macchina a Stati: Iscrizione

```mermaid
stateDiagram-v2
    [*] --> Confermata : Iscrizione effettuata

    Confermata --> Annullata : Genitore annulla\n(entro chiusura)
    Annullata --> [*]

    Confermata --> GruppiAssegnati : Segreteria esegue\ndivisione gruppi

    GruppiAssegnati --> F1_Entrata : Staff scansiona QR\n(Firma 1)
    F1_Entrata --> F2_Lab1 : Staff scansiona QR\n(Firma 2)
    F2_Lab1 --> F3_Lab2 : Staff scansiona QR\n(Firma 3 — se 2 lab)
    F2_Lab1 --> F4_Uscita : Firma 3 non richiesta\n(1 solo lab)
    F3_Lab2 --> F4_Uscita : Staff scansiona QR\n(Firma 4)
    F4_Uscita --> [*] : Giornata completata
```

---

*Sezione precedente: [15 — Flusso Completo](../15_flusso/15_flusso.md) | Sezione successiva: [ER Database](../er/er_database.md)*
