const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'user',
    password: 'password',
    database: 'cinema_db'
});

db.connect(err => {
    if (err) {
        console.error('Errore durante la connessione a MySQL:', err);
        return;
    }
    console.log('Connesso al database MySQL.');
});

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token di accesso richiesto.' });
    }

    jwt.verify(token, '123abcxyz987', (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token non valido.' });
        }
        req.user = user;
        next();
    });
};

app.get('/api/movies', (req, res) => {
    const sql = `SELECT * FROM movies`;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Errore nel recupero dei film:', err);
            return res.status(500).json({ message: 'Errore interno del server.' });
        }
        res.json(results);
    });
});

app.get('/api/movies/:id', (req, res) => {
    const movieId = req.params.id;

    const sql = `
        SELECT 
            m.*, 
            s.id as showtime_id, s.date as showtime_date, s.time as showtime_time,
            se.row_index, se.col_index, se.is_booked
        FROM movies m
        LEFT JOIN showtimes s ON m.id = s.movie_id
        LEFT JOIN seats se ON s.id = se.showtime_id
        WHERE m.id = ?
        ORDER BY s.date, s.time, se.row_index, se.col_index
    `;

    db.query(sql, [movieId], (err, results) => {
        if (err) {
            console.error('Errore nel recupero dei dettagli del film:', err);
            return res.status(500).json({ message: 'Errore interno del server.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Film non trovato.' });
        }

        const movie = {
            id: results[0].id,
            title: results[0].title,
            description: results[0].description,
            director: results[0].director,
            year: results[0].year,
            poster: results[0].poster,
            showtimes: {}
        };

        results.forEach(row => {
            if (row.showtime_id) {
                if (!movie.showtimes[row.showtime_id]) {
                    movie.showtimes[row.showtime_id] = {
                        id: row.showtime_id,
                        date: row.showtime_date,
                        time: row.showtime_time,
                        seats: []
                    };
                }
                if (row.row_index !== null) {
                    movie.showtimes[row.showtime_id].seats.push({
                        row: row.row_index,
                        col: row.col_index,
                        isBooked: row.is_booked
                    });
                }
            }
        });

        movie.showtimes = Object.values(movie.showtimes);

        movie.showtimes.forEach(showtime => {
            const seatMatrix = Array(5).fill(null).map(() => Array(8).fill(0));
            showtime.seats.forEach(seat => {
                seatMatrix[seat.row][seat.col] = seat.isBooked ? 1 : 0;
            });
            showtime.seats = seatMatrix;
        });

        res.json(movie);
    });
});

app.post('/api/bookings', verifyToken, (req, res) => {
    const { showtimeId, selectedSeats } = req.body;
    const username = req.user.username;

    if (!showtimeId || !selectedSeats || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
        return res.status(400).json({ message: 'Dati prenotazione non validi.' });
    }

    db.beginTransaction(async (err) => {
        if (err) {
            console.error('Errore nell\'avvio della transazione:', err);
            return res.status(500).json({ message: 'Errore interno del server.' });
        }

        try {
            // Verifica che i posti siano disponibili
            const seatChecks = selectedSeats.map(seat => {
                const [row, col] = seat.split('-').map(Number);
                return new Promise((resolve, reject) => {
                    const sql = 'SELECT is_booked FROM seats WHERE showtime_id = ? AND row_index = ? AND col_index = ?';
                    db.query(sql, [showtimeId, row, col], (err, results) => {
                        if (err) {
                            reject(err);
                        } else if (results.length === 0) {
                            reject(new Error(`Posto ${row + 1}-${col + 1} non trovato.`));
                        } else if (results[0].is_booked) {
                            reject(new Error(`Posto ${row + 1}-${col + 1} è già occupato.`));
                        } else {
                            resolve();
                        }
                    });
                });
            });

            await Promise.all(seatChecks);

            // Ottiene l'ID dell'utente
            const userResult = await new Promise((resolve, reject) => {
                db.query('SELECT id FROM users WHERE username = ?', [username], (err, results) => {
                    if (err) reject(err);
                    else if (results.length === 0) reject(new Error('Utente non trovato.'));
                    else resolve(results[0]);
                });
            });

            const userId = userResult.id;

            // Crea una nuova prenotazione
            const bookingResult = await new Promise((resolve, reject) => {
                const insertBookingSql = 'INSERT INTO bookings (user_id, showtime_id, booking_date) VALUES (?, ?, NOW())';
                db.query(insertBookingSql, [userId, showtimeId], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            const bookingId = bookingResult.insertId;

            // Aggiorna lo stato dei posti
            const updateSeats = selectedSeats.map(seat => {
                const [row, col] = seat.split('-').map(Number);
                return new Promise((resolve, reject) => {
                    // Aggiorna lo stato del posto
                    const sql = 'UPDATE seats SET is_booked = TRUE WHERE showtime_id = ? AND row_index = ? AND col_index = ?';
                    db.query(sql, [showtimeId, row, col], (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            const sql = 'INSERT INTO booking_seats (booking_id, row_index, col_index) VALUES (?, ?, ?)';
                            db.query(sql, [bookingId, row, col], (err) => {
                                if (err) reject(err);
                                else resolve();
                            });
                        }
                    });
                });
            });

            await Promise.all(updateSeats);

            db.commit((err) => {
                if (err) {
                    console.error('Errore nel commit della transazione:', err);
                    return db.rollback(() => {
                        res.status(500).json({ message: 'Errore durante la prenotazione.' });
                    });
                }

                res.status(201).json({
                    message: 'Prenotazione effettuata con successo!',
                    bookingId: bookingId,
                    seatsBooked: selectedSeats.length
                });
            });

        } catch (error) {
            console.error('Errore durante la prenotazione:', error);
            db.rollback(() => {
                res.status(400).json({ message: 'Errore durante la prenotazione.' });
            });
        }
    });
});

// API per ottenere le prenotazioni dell'utente
app.get('/api/my-bookings', verifyToken, (req, res) => {
    const username = req.user.username;

    const sql = `
        SELECT 
            b.id as booking_id, b.booking_date,
            m.title as movie_title, m.poster,
            s.date as showtime_date, s.time as showtime_time,
            bs.row_index, bs.col_index
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN showtimes s ON b.showtime_id = s.id
        JOIN movies m ON s.movie_id = m.id
        JOIN booking_seats bs ON b.id = bs.booking_id
        WHERE u.username = ?
        ORDER BY b.booking_date DESC, bs.row_index, bs.col_index
    `;

    db.query(sql, [username], (err, results) => {
        if (err) {
            console.error('Errore nel recupero delle prenotazioni:', err);
            return res.status(500).json({ message: 'Errore interno del server.' });
        }

        // Raggruppa i risultati per prenotazione
        const bookings = {};
        results.forEach(row => {
            if (!bookings[row.booking_id]) {
                bookings[row.booking_id] = {
                    id: row.booking_id,
                    bookingDate: row.booking_date,
                    movie: {
                        title: row.movie_title,
                        poster: row.poster
                    },
                    showtime: {
                        date: row.showtime_date,
                        time: row.showtime_time
                    },
                    seats: []
                };
            }
            if (row.row_index !== null) {
                bookings[row.booking_id].seats.push({
                    row: row.row_index + 1,
                    col: row.col_index + 1
                });
            }
        });

        res.json(Object.values(bookings));
    });
});

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password)
        return res.status(400).json({ message: 'Username e password sono richiesti.' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
        db.query(sql, [username, hashedPassword], (err, result) => {
            if (err) {
                if (err.code == 'ER_DUP_ENTRY')     // Codice errore MySQL per chiave duplicata
                    return res.status(409).json({ message: 'Username già in uso.'});
                
                console.error('Errore di registrazione:', err);
                return res.status(500).json({message: 'Errore interno del server.'});
            }
            res.status(201).json({ message: 'Registrazione avvenuto con successo!'});
        });
    } catch (error) {
        res.status(500).json({ message: 'Errore interno del server'});
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password)
        return res.status(400).json({ message: 'Username e password sono richiesti.' });

    const sql = 'SELECT * FROM users WHERE username = ?';
    db.query(sql, [username], async (err, results) => {
        if (err) {
            console.error('Errore durante il login: ', err);
            return res.status(500).json({ message: 'Errore interno del server.'});
        }
        if (results.length === 0)
            return res.status(401).json({ message: 'Credenziali non valide.'});

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenziali non valide.' });
        }

        const token = jwt.sign({ username: user.username }, '123abcxyz987', { expiresIn: '1h' });

        res.json({ message: 'Login avvenuto con successo!', token });
    });
});

app.listen(5000, () => {
    console.log(`Server is running on http://localhost:${5000}`);
});