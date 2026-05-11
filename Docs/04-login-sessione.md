# 04 — Login e Sessione

> **Tipo documento:** Tecnico + Guida utente  
> **Sezione PDF:** §4

---

## Flusso di login

1. L'utente inserisce **email e password** nella pagina di login
2. Il backend verifica le credenziali confrontando la password con l'**hash bcrypt**
3. Se corrette, viene rilasciato un **token JWT** firmato (HS256)
4. Il token viene salvato lato client e incluso in ogni richiesta API

---

## Token JWT

| Proprietà | Valore |
|-----------|--------|
| Algoritmo | HS256 |
| Durata | **7 giorni** |
| Rinnovo | Automatico ad ogni login |
| Trasmissione | Header HTTP: `Authorization: Bearer <token>` |

### Payload del token

Il token JWT contiene:

```json
{
  "id": 42,
  "email": "mario.rossi@email.it",
  "ruolo": "genitore",
  "nome": "Mario",
  "cognome": "Rossi"
}
```

> **Non contiene la password**, né altri dati sensibili.

---

## Sicurezza password

- Le password sono memorizzate con **hash bcrypt** — mai salvate in chiaro nel database
- Il campo `password` nella tabella `utenti` contiene solo l'hash
- La verifica avviene tramite `password_verify()` di PHP

---

## Aggiornamento del ruolo

Se la segreteria modifica il ruolo di un utente, il token JWT esistente **rimane valido** con il vecchio ruolo fino alla scadenza. L'utente deve **effettuare nuovamente il login** per ottenere un token aggiornato con il nuovo ruolo.

---

## Recupero password

1. L'utente clicca **"Password dimenticata"**
2. Inserisce la propria email
3. Il sistema invia un **codice temporaneo** via email
4. L'utente inserisce il codice e sceglie una nuova password
5. Il codice viene invalidato dopo l'uso

---

## Endpoint correlati

```
POST /api/auth/?action=login    → Login → risposta con token JWT
POST /api/auth/?action=forgot   → Reset password via email
```

---

## Note per gli sviluppatori

- Il token deve essere incluso nell'header di **ogni richiesta protetta**
- Gli endpoint pubblici (lista eventi, registrazione) non richiedono token
- In caso di token scaduto o non valido, il backend risponde con `401 Unauthorized`
- Il frontend deve gestire il 401 reindirizzando alla pagina di login
