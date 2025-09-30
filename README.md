# 🎬 EasyCinema

Un'applicazione web moderna per la prenotazione di posti al cinema, costruita con React, Express e MySQL.

## 📋 Indice

- [Caratteristiche](#-caratteristiche)
- [Tecnologie Utilizzate](#-tecnologie-utilizzate)
- [Prerequisiti](#-prerequisiti)
- [Installazione](#-installazione)
- [Configurazione](#-configurazione)
- [Avvio dell'Applicazione](#-avvio-dellapplicazione)
- [Struttura del Progetto](#-struttura-del-progetto)
- [API Endpoints](#-api-endpoints)
- [Credenziali di Test](#-credenziali-di-test)
- [Database](#-database)
- [Sicurezza](#-sicurezza)

## ✨ Caratteristiche

- 📱 Design Responsivo: Ottimizzato per desktop, tablet e mobile
- 🔐 Autenticazione JWT: Sistema di login sicuro con token
- 🎞️ Catalogo Film: Visualizzazione completa dei film in programmazione
- 📅 Gestione Spettacoli: Selezione orari e date disponibili
- 💺 Selezione Posti: Mappa interattiva della sala con disponibilità in tempo reale
- 🎫 Prenotazione Istantanea: Conferma immediata della prenotazione
- 🔍 Ricerca Avanzata: Filtra film per titolo o regista

## 🛠 Tecnologie Utilizzate

### Frontend
- **React 19.1.1** - Libreria UI
- **Tailwind CSS** - Framework CSS
- **Vite** - Build tool e dev server

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **MySQL** - Database relazionale
- **JWT** - Autenticazione basata su token
- **bcryptjs** - Hashing delle password

### DevOps
- **Docker** - Containerizzazione del database
- **Docker Compose** - Orchestrazione dei container

## 📦 Prerequisiti

Prima di iniziare, assicurati di avere installato:

- [Node.js](https://nodejs.org/) (v14 o superiore)
- [Docker](https://www.docker.com/)
- npm

## 🚀 Installazione

### 1. Clona il repository

```bash
git clone https://github.com/Thomas05017/EasyCinema.git
cd EasyCinema
```

### 2. Installa le dipendenze del Backend

```bash
cd backend
npm install
```

### 3. Installa le dipendenze del Frontend

```bash
cd ../frontend
npm install
```

## ⚙️ Configurazione

### Database MySQL con Docker

1. Avvia i container Docker:

```bash
cd backend
docker-compose up -d
```

Questo avvierà:
- MySQL su `localhost:3306`
- phpMyAdmin su `localhost:8080`

2. Inizializza il database:

```bash
node seed.js
```

Questo script creerà:
- Le tabelle necessarie (users, movies, showtimes, seats, bookings, booking_seats)
- I dati di esempio per i film
- Due utenti di test

### Variabili d'Ambiente

Il backend utilizza le seguenti configurazioni (già impostate nel codice):

```javascript
// Database
host: '127.0.0.1'
user: 'user'
password: 'password'
database: 'cinema_db'

// JWT Secret
secret: '123abcxyz987'

// Server Port
port: 5000
```

## 🎯 Avvio dell'Applicazione

### Avvia il Backend

```bash
cd backend
npm run dev
```

Il server sarà disponibile su `http://localhost:5000`

### Avvia il Frontend

In un nuovo terminale:

```bash
cd frontend
npm run dev
```

L'applicazione sarà disponibile su `http://localhost:5173`

## 📁 Struttura del Progetto

```
easycinema/
├── backend/
│   ├── data/
│   │   └── movies.js          # Dati dei film
│   ├── docker-compose.yml     # Configurazione Docker
│   ├── index.js               # Server Express principale
│   ├── seed.js                # Script di inizializzazione DB
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── MovieCard.jsx         # Card film
    │   │   ├── MovieList.jsx         # Lista film
    │   │   └── SeatSelection.jsx     # Selezione posti
    │   ├── context/
    │   │   └── AuthContext.jsx       # Context autenticazione
    │   ├── pages/
    │   │   ├── HomePage.jsx          # Pagina principale
    │   │   ├── MovieDetailPage.jsx   # Dettaglio film
    │   │   └── LoginPage.jsx         # Pagina login
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

## 🔌 API Endpoints

### Autenticazione

- **POST** `/api/register` - Registrazione nuovo utente
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```

- **POST** `/api/login` - Login utente
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```

### Film

- **GET** `/api/movies` - Ottieni lista di tutti i film
- **GET** `/api/movies/:id` - Ottieni dettagli di un film specifico

### Prenotazioni

- **POST** `/api/bookings` - Crea una nuova prenotazione (richiede autenticazione)
  ```json
  {
    "showtimeId": "number",
    "selectedSeats": ["0-2", "0-3"]
  }
  ```

- **GET** `/api/my-bookings` - Ottieni prenotazioni dell'utente (richiede autenticazione)

## 🔑 Credenziali di Test

Dopo aver eseguito lo script `seed.js`, puoi utilizzare questi account:

**Utente 1:**
- Username: `testuser`
- Password: `test123`

**Utente 2:**
- Username: `demo`
- Password: `demo123`

## 🗄️ Database

### Tabelle Principali

- **users** - Utenti dell'applicazione
- **movies** - Catalogo film
- **showtimes** - Orari degli spettacoli
- **seats** - Posti disponibili per ogni spettacolo
- **bookings** - Prenotazioni effettuate
- **booking_seats** - Relazione tra prenotazioni e posti

## 🔒 Sicurezza

- Password hashate con bcrypt
- Autenticazione basata su JWT
- Token con scadenza di 1 ora
- Validazione lato server per tutte le operazioni
- Transazioni database per prenotazioni atomiche

---

<div align="center">
  <h2><strong>EasyCinema</strong></h2>
</div>
