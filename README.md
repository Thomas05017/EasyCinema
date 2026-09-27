# 🎬 EasyCinema

Applicazione web full-stack per la prenotazione di posti al cinema, con catalogo film sincronizzato da TMDB, selezione posti in tempo reale e pagamenti reali tramite Stripe.

Stack: **React 19 + Vite + Tailwind CSS** (frontend) · **Express + MySQL** (backend) · **Stripe Checkout** (pagamenti) · **TMDB API** (catalogo film) · **Docker** (ambiente dev e deploy).

## 📋 Indice

- [Caratteristiche](#-caratteristiche)
- [Architettura e stack tecnico](#-architettura-e-stack-tecnico)
- [Struttura del progetto](#-struttura-del-progetto)
- [Prerequisiti](#-prerequisiti)
- [Variabili d'ambiente](#-variabili-dambiente)
- [Avvio in sviluppo](#-avvio-in-sviluppo)
- [Popolare il database](#-popolare-il-database)
- [Pagamenti con Stripe](#-pagamenti-con-stripe)
- [API Endpoints](#-api-endpoints)
- [Modello dati](#-modello-dati)
- [Deploy / produzione](#-deploy--produzione)
- [Credenziali di test](#-credenziali-di-test)
- [Sicurezza](#-sicurezza)
- [Roadmap / possibili miglioramenti](#-roadmap--possibili-miglioramenti)

## ✨ Caratteristiche

- 🔐 **Autenticazione JWT** — registrazione, login, rotte protette lato frontend e backend
- 🎞️ **Catalogo film reale** — sincronizzato da TMDB (titolo, trama, poster, regista, genere, anno), non dati finti
- 📅 **Gestione spettacoli** — selezione orari e date disponibili per film
- 💺 **Selezione posti in tempo reale** — mappa interattiva della sala con tre stati (disponibile / in attesa di pagamento / occupato), protetta da race condition tramite locking a livello di riga (`SELECT ... FOR UPDATE`)
- 💳 **Pagamenti reali con Stripe Checkout** — flusso completo con sessione di pagamento hostata, conferma asincrona via webhook, e rilascio automatico dei posti se il pagamento non va a buon fine o scade
- 🎫 **Le mie prenotazioni** — storico prenotazioni confermate per l'utente loggato
- 📱 **Design responsivo** — ottimizzato per desktop, tablet e mobile
- 🛡️ **Rate limiting** su login/registrazione, CORS ristretto, secrets esternalizzati
- 🐳 **Ambiente Docker separato per sviluppo e produzione**, con hot-reload in dev

## 🏗 Architettura e stack tecnico

### Frontend
- **React 19** — libreria UI
- **React Router 7** — routing client-side
- **Tailwind CSS** — styling
- **Vite** — build tool e dev server

### Backend
- **Node.js + Express 5** — API REST
- **MySQL 8** (via `mysql2`, connection pool) — persistenza
- **JWT** (`jsonwebtoken`) — autenticazione stateless
- **bcryptjs** — hashing password
- **Stripe** — elaborazione pagamenti
- **express-rate-limit** — protezione da brute force su login/registrazione

### Integrazioni esterne
- **TMDB (The Movie Database)** — catalogo film "ora in sala", sincronizzato via script dedicato
- **Stripe Checkout** — pagina di pagamento hostata + webhook per conferma asincrona

### DevOps
- **Docker + Docker Compose** — un file per lo sviluppo (hot-reload, codice montato da volume) e uno per un ambiente più simile a produzione (immagini buildate, nginx per servire il frontend)
- **nginx** — serve i file statici del frontend in build di produzione

## 📁 Struttura del progetto

```
easycinema/
├── docker-compose.yml          # Stack "production-like" (build immagini, nginx)
├── docker-compose.dev.yml      # Stack di sviluppo (hot-reload, volumi montati)
├── .env                        # Variabili per Docker Compose (root)
├── .env.example
│
├── backend/
│   ├── services/
│   │   └── tmdbService.js      # Client per le chiamate a TMDB
│   ├── index.js                # Server Express principale (routes, auth, Stripe, webhook)
│   ├── seed.js                 # Crea le tabelle + utenti di test
│   ├── syncMovies.js           # Sincronizza il catalogo film da TMDB
│   ├── Dockerfile
│   ├── .env                    # Usato da script eseguiti sull'host (seed, sync) e da npm run dev fuori Docker
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── MovieCard.jsx
    │   │   ├── MovieList.jsx
    │   │   ├── SeatSelection.jsx     # Selezione posti + avvio pagamento
    │   │   ├── ProtectedRoute.jsx    # Guard per rotte autenticate
    │   │   └── ErrorBoundary.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx       # Stato autenticazione globale
    │   ├── pages/
    │   │   ├── HomePage.jsx
    │   │   ├── MovieDetailPage.jsx
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── MyBookingsPage.jsx
    │   │   ├── PaymentSuccessPage.jsx
    │   │   └── PaymentCancelPage.jsx
    │   ├── App.jsx
    │   └── main.jsx
    ├── nginx.conf               # Config nginx per servire la SPA in build
    ├── Dockerfile
    ├── .env                     # Fallback per npm run dev fuori Docker
    └── package.json
```

## 📦 Prerequisiti

- [Docker](https://www.docker.com/) e Docker Compose
- [Node.js](https://nodejs.org/) v20+ (solo se vuoi lanciare gli script/`npm run dev` fuori da Docker)
- Un account [Stripe](https://stripe.com/) (gratuito, modalità test) e la [Stripe CLI](https://stripe.com/docs/stripe-cli) per testare i webhook in locale
- Un account [TMDB](https://www.themoviedb.org/) (gratuito) per ottenere un access token API

## 🔑 Variabili d'ambiente

Il progetto usa **tre file `.env` distinti**, ognuno per un contesto diverso — non sono ridondanti, contengono anche valori diversi per le stesse chiavi (es. `DB_HOST`) a seconda del contesto di rete:

| File | Quando viene letto |
|---|---|
| **`.env`** (root) | Da Docker Compose (sia `docker-compose.yml` che `docker-compose.dev.yml`) |
| **`backend/.env`** | Da `seed.js` e `syncMovies.js` (eseguiti sull'host) e da `npm run dev` se lanci il backend fuori da Docker |
| **`frontend/.env`** | Da `npm run dev` se lanci il frontend fuori da Docker (fallback, ignorato dal container) |

Ogni file ha un corrispondente `_env` da usare come riferimento — copialo e compila i valori mancanti:

```bash
cp _env .env
cp backend/_env backend/.env
cp frontend/_env frontend/.env
```

Variabili principali da configurare:

```env
# Database
DB_USER=user
DB_PASSWORD=password
DB_NAME=cinema_db
MYSQL_ROOT_PASSWORD=

# Auth
JWT_SECRET=              # genera con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# CORS / URL
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:5000

# Stripe (modalità test)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # ottenuto da `stripe listen`

# TMDB
TMDB_ACCESS_TOKEN=               # Read Access Token v4 da themoviedb.org
TMDB_LANGUAGE=it-IT
TMDB_REGION=IT
```

## 🚀 Avvio in sviluppo

Il modo più semplice: **un solo comando** avvia database, phpMyAdmin, backend (con hot-reload via `nodemon`) e frontend (Vite dev server) tutti insieme.

```bash
docker-compose -f docker-compose.dev.yml up
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- phpMyAdmin: `http://localhost:8080`

Per fermare tutto:
```bash
docker-compose -f docker-compose.dev.yml down
```

Per fermare e cancellare anche i dati del database:
```bash
docker-compose -f docker-compose.dev.yml down -v
```

### Alternativa: sviluppo senza Docker per l'app

Se preferisci lanciare backend e frontend direttamente sull'host (serve comunque il DB in Docker):

```bash
# Solo database + phpMyAdmin
docker-compose -f docker-compose.dev.yml up -d db phpmyadmin

# In un terminale
cd backend && npm install && npm run dev

# In un altro terminale
cd frontend && npm install && npm run dev
```

## 🌱 Popolare il database

**1. Crea le tabelle e gli utenti di test** (prima volta, o dopo un reset del volume):
```bash
cd backend
node seed.js
```

**2. Sincronizza il catalogo film da TMDB:**
```bash
cd backend
npm run sync:movies
```

Questo script recupera i film attualmente in sala da TMDB, li inserisce/aggiorna nella tabella `movies`, e genera automaticamente 3 spettacoli di base (oggi/domani) con sala vuota per ogni film nuovo. Rilanciarlo in seguito aggiorna trama/poster senza toccare gli spettacoli o le prenotazioni già esistenti.

## 💳 Pagamenti con Stripe

Il flusso di prenotazione è integrato con **Stripe Checkout**:

1. L'utente seleziona i posti → il backend li blocca come `pending` con scadenza a 10 minuti e crea una sessione Stripe Checkout
2. L'utente viene reindirizzato alla pagina di pagamento hostata da Stripe
3. Al pagamento completato, Stripe invia un evento webhook (`checkout.session.completed`) che conferma la prenotazione e marca i posti come `booked`
4. Se il pagamento scade o l'utente abbandona, un job periodico (ogni minuto) rilascia i posti rimasti `pending` oltre la scadenza

### Testare in locale

In un terminale dedicato, inoltra gli eventi webhook al backend locale:
```bash
cd backend
npm run stripe:listen
```
Copia il `whsec_...` stampato in output dentro `backend/.env` (`STRIPE_WEBHOOK_SECRET`) e riavvia il backend.

Per pagare, usa la carta di test Stripe:
```
Numero: 4242 4242 4242 4242
Data:   qualsiasi data futura
CVC:    qualsiasi 3 cifre
```

## 🔌 API Endpoints

### Autenticazione
- **POST** `/api/register` — registrazione nuovo utente *(rate-limited)*
- **POST** `/api/login` — login, restituisce un JWT *(rate-limited)*

### Film
- **GET** `/api/movies` — lista di tutti i film
- **GET** `/api/movies/:id` — dettaglio film con spettacoli e stato posti

### Prenotazioni e pagamenti
- **POST** `/api/checkout-session` *(autenticato)* — blocca i posti selezionati e crea una sessione di pagamento Stripe
  ```json
  { "showtimeId": "number", "selectedSeats": ["0-2", "0-3"] }
  ```
- **GET** `/api/my-bookings` *(autenticato)* — prenotazioni confermate (pagate) dell'utente
- **POST** `/api/webhook/stripe` — riceve gli eventi Stripe (`checkout.session.completed`, `checkout.session.expired`); non va chiamato manualmente

## 🗄 Modello dati

| Tabella | Scopo |
|---|---|
| `users` | Utenti registrati (password hashate con bcrypt) |
| `movies` | Catalogo film (sincronizzato da TMDB, `tmdb_id` come chiave di deduplicazione) |
| `showtimes` | Spettacoli (film + data + ora) |
| `seats` | Posti per spettacolo, stato: `available` / `pending` / `booked` |
| `bookings` | Prenotazioni, stato pagamento: `pending` / `paid` / `expired` / `failed`, con scadenza hold e riferimento alla sessione Stripe |
| `booking_seats` | Relazione tra prenotazioni e posti specifici |

I posti sono protetti da **race condition** tramite `SELECT ... FOR UPDATE` all'interno di una transazione: due utenti non possono mai prenotare lo stesso posto contemporaneamente, anche in caso di richieste simultanee.

## 🏭 Deploy / produzione

Per un ambiente più vicino a produzione (immagini buildate, frontend servito da nginx, nessun hot-reload):

```bash
docker-compose up -d --build
```

Rispetto al compose di sviluppo:
- il frontend viene **buildato** (`vite build`) e servito come static file da **nginx**, con `VITE_API_URL` passato come build arg
- il backend gira dall'immagine buildata, non da codice montato
- `DB_HOST` punta al nome del servizio Docker (`db`), non a `127.0.0.1`

## 🔑 Credenziali di test

Dopo `node seed.js`:

| Username | Password |
|---|---|
| `testuser` | `test123` |
| `demo` | `demo123` |

## 🔒 Sicurezza

- Password hashate con bcrypt
- Autenticazione JWT, token con scadenza 1 ora
- Rate limiting su login/registrazione
- CORS ristretto all'origine del frontend
- Secrets (DB, JWT, Stripe, TMDB) esternalizzati in `.env`, mai committati
- Transazioni database con locking di riga per le operazioni su posti/prenotazioni
- Verifica della firma webhook Stripe (`stripe.webhooks.constructEvent`) per evitare richieste contraffatte

## 🛣 Roadmap / possibili miglioramenti

- Test automatici (backend e frontend)
- Refresh/validazione lato client della scadenza JWT (oggi rilevata solo al primo 401/403 da una chiamata autenticata)
- Pannello di cancellazione prenotazione lato utente
- CI/CD per build e deploy automatico delle immagini Docker

---

<div align="center">
  <h2><strong>EasyCinema</strong></h2>
</div>
