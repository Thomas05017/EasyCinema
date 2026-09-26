require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
const rateLimit = require('express-rate-limit');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));

// Webhook Stripe: PRIMA di express.json(), serve il raw body per la verifica firma
app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), (req, res) => {
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            req.headers['stripe-signature'],
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Firma webhook non valida:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const markBookingPaid = (bookingId) => {
        db.getConnection((err, connection) => {
            if (err) return console.error(err);
            connection.beginTransaction((err) => {
                if (err) { connection.release(); return console.error(err); }

                connection.query(
                    `UPDATE bookings SET payment_status = 'paid' WHERE id = ?`,
                    [bookingId],
                    (err) => {
                        if (err) return connection.rollback(() => { connection.release(); console.error(err); });

                        const sql = `
                            UPDATE seats s
                            JOIN booking_seats bs ON bs.row_index = s.row_index AND bs.col_index = s.col_index
                            JOIN bookings b ON b.id = bs.booking_id AND b.showtime_id = s.showtime_id
                            SET s.status = 'booked'
                            WHERE b.id = ?
                        `;
                        connection.query(sql, [bookingId], (err) => {
                            if (err) return connection.rollback(() => { connection.release(); console.error(err); });
                            connection.commit((err) => {
                                connection.release();
                                if (err) console.error(err);
                            });
                        });
                    }
                );
            });
        });
    };

    const releaseBooking = (bookingId, newStatus) => {
        db.getConnection((err, connection) => {
            if (err) return console.error(err);
            connection.beginTransaction((err) => {
                if (err) { connection.release(); return console.error(err); }

                const sql = `
                    UPDATE seats s
                    JOIN booking_seats bs ON bs.row_index = s.row_index AND bs.col_index = s.col_index
                    JOIN bookings b ON b.id = bs.booking_id AND b.showtime_id = s.showtime_id
                    SET s.status = 'available'
                    WHERE b.id = ?
                `;
                connection.query(sql, [bookingId], (err) => {
                    if (err) return connection.rollback(() => { connection.release(); console.error(err); });

                    connection.query(
                        `UPDATE bookings SET payment_status = ? WHERE id = ?`,
                        [newStatus, bookingId],
                        (err) => {
                            if (err) return connection.rollback(() => { connection.release(); console.error(err); });
                            connection.commit((err) => {
                                connection.release();
                                if (err) console.error(err);
                            });
                        }
                    );
                });
            });
        });
    };

    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;
            if (session.payment_status === 'paid' && session.metadata?.bookingId) {
                markBookingPaid(session.metadata.bookingId);
            }
            break;
        }
        case 'checkout.session.expired': {
            const session = event.data.object;
            if (session.metadata?.bookingId) {
                releaseBooking(session.metadata.bookingId, 'expired');
            }
            break;
        }
        default:
            break; // Altri eventi ignorati
    }

    res.json({ received: true });
});

app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const releaseExpiredHolds = () => {
    db.getConnection((err, connection) => {
        if (err) return console.error('Errore connessione per pulizia posti:', err);

        connection.beginTransaction((err) => {
            if (err) {
                connection.release();
                return console.error('Errore transazione pulizia:', err);
            }

            const releaseSeatsSql = `
                UPDATE seats s
                JOIN bookings b ON b.showtime_id = s.showtime_id
                JOIN booking_seats bs ON bs.booking_id = b.id AND bs.row_index = s.row_index AND bs.col_index = s.col_index
                SET s.status = 'available'
                WHERE b.payment_status = 'pending' AND b.pending_expires_at < NOW()
            `;

            connection.query(releaseSeatsSql, (err) => {
                if (err) {
                    return connection.rollback(() => {
                        connection.release();
                        console.error('Errore rilascio posti scaduti:', err);
                    });
                }

                connection.query(
                    `UPDATE bookings SET payment_status = 'expired' WHERE payment_status = 'pending' AND pending_expires_at < NOW()`,
                    (err) => {
                        if (err) {
                            return connection.rollback(() => {
                                connection.release();
                                console.error('Errore aggiornamento prenotazioni scadute:', err);
                            });
                        }

                        connection.commit((err) => {
                            connection.release();
                            if (err) console.error('Errore commit pulizia:', err);
                        });
                    }
                );
            });
        });
    });
};

// Esegue la pulizia ogni minuto
setInterval(releaseExpiredHolds, 60 * 1000);

// Verifica che la connessione al pool funzioni
db.query('SELECT 1', (err) => {
    if (err) {
        console.error('Errore durante la connessione a MySQL:', err);
        return;
    }
    console.log('Connesso al database MySQL (pool).');
});

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token di accesso richiesto.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token non valido.' });
        }
        req.user = user;
        next();
    });
};

const authLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 10, // massimo 10 tentativi per IP in 1 minuto
    message: { message: 'Troppi tentativi. Riprova più tardi.' },
    standardHeaders: true,
    legacyHeaders: false,
});

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
            se.row_index, se.col_index, se.status as seat_status
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
                        status: row.seat_status
                    });
                }
            }
        });

        movie.showtimes = Object.values(movie.showtimes);

        movie.showtimes.forEach(showtime => {
            const seatMatrix = Array(5).fill(null).map(() => Array(8).fill(0));
            showtime.seats.forEach(seat => {
                const value = seat.status === 'booked' ? 1 : seat.status === 'pending' ? 2 : 0;
                seatMatrix[seat.row][seat.col] = value;
            });
            showtime.seats = seatMatrix;
        });

        res.json(movie);
    });
});

app.post('/api/checkout-session', verifyToken, (req, res) => {
    const { showtimeId, selectedSeats } = req.body;
    const username = req.user.username;
    const PRICE_PER_SEAT_CENTS = 850; // €8.50 — fonte di verità lato server, mai fidarsi del client

    if (!showtimeId || !selectedSeats || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
        return res.status(400).json({ message: 'Dati prenotazione non validi.' });
    }

    db.getConnection((err, connection) => {
        if (err) {
            console.error('Errore connessione:', err);
            return res.status(500).json({ message: 'Errore interno del server.' });
        }

        const release = () => connection.release();

        connection.beginTransaction(async (err) => {
            if (err) {
                release();
                return res.status(500).json({ message: 'Errore interno del server.' });
            }

            let bookingId;

            try {
                // 1. Blocca e verifica ogni posto
                for (const seat of selectedSeats) {
                    const [row, col] = seat.split('-').map(Number);

                    const seatRow = await new Promise((resolve, reject) => {
                        connection.query(
                            `SELECT status FROM seats WHERE showtime_id = ? AND row_index = ? AND col_index = ? FOR UPDATE`,
                            [showtimeId, row, col],
                            (err, results) => {
                                if (err) return reject(err);
                                if (results.length === 0) return reject(new Error(`Posto ${row + 1}-${col + 1} non trovato.`));
                                resolve(results[0]);
                            }
                        );
                    });

                    if (seatRow.status !== 'available') {
                        throw new Error('Posto non più disponibile. Riprova con un\'altra selezione.');
                    }
                }

                // 2. Recupera dati utente, film e orario per la sessione Stripe
                const userResult = await new Promise((resolve, reject) => {
                    connection.query('SELECT id FROM users WHERE username = ?', [username], (err, results) => {
                        if (err) reject(err);
                        else if (results.length === 0) reject(new Error('Utente non trovato.'));
                        else resolve(results[0]);
                    });
                });

                const showtimeInfo = await new Promise((resolve, reject) => {
                    connection.query(
                        `SELECT m.title, s.date, s.time FROM showtimes s JOIN movies m ON m.id = s.movie_id WHERE s.id = ?`,
                        [showtimeId],
                        (err, results) => {
                            if (err) reject(err);
                            else if (results.length === 0) reject(new Error('Spettacolo non trovato.'));
                            else resolve(results[0]);
                        }
                    );
                });

                // 3. Crea la prenotazione "in attesa" con scadenza a 10 minuti
                const bookingResult = await new Promise((resolve, reject) => {
                    connection.query(
                        `INSERT INTO bookings (user_id, showtime_id, booking_date, payment_status, pending_expires_at)
                         VALUES (?, ?, NOW(), 'pending', DATE_ADD(NOW(), INTERVAL 10 MINUTE))`,
                        [userResult.id, showtimeId],
                        (err, result) => {
                            if (err) reject(err);
                            else resolve(result);
                        }
                    );
                });

                bookingId = bookingResult.insertId;

                // 4. Registra i posti come "in attesa"
                for (const seat of selectedSeats) {
                    const [row, col] = seat.split('-').map(Number);

                    await new Promise((resolve, reject) => {
                        connection.query(
                            `UPDATE seats SET status = 'pending' WHERE showtime_id = ? AND row_index = ? AND col_index = ?`,
                            [showtimeId, row, col],
                            (err) => {
                                if (err) return reject(err);
                                connection.query(
                                    `INSERT INTO booking_seats (booking_id, row_index, col_index) VALUES (?, ?, ?)`,
                                    [bookingId, row, col],
                                    (err) => err ? reject(err) : resolve()
                                );
                            }
                        );
                    });
                }

                // 5. Commit della prenotazione "in attesa"
                await new Promise((resolve, reject) => {
                    connection.commit((err) => err ? reject(err) : resolve());
                });
                release();

                // 6. Crea la sessione Stripe Checkout (fuori dalla transazione DB)
                const formattedTime = String(showtimeInfo.time).slice(0, 5);
                const session = await stripe.checkout.sessions.create({
                    mode: 'payment',
                    payment_method_types: ['card'],
                    line_items: [{
                        price_data: {
                            currency: 'eur',
                            product_data: {
                                name: `${showtimeInfo.title} — ${formattedTime}`,
                                description: `${selectedSeats.length} ${selectedSeats.length === 1 ? 'posto' : 'posti'}`
                            },
                            unit_amount: PRICE_PER_SEAT_CENTS
                        },
                        quantity: selectedSeats.length
                    }],
                    success_url: `${process.env.FRONTEND_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${process.env.FRONTEND_URL}/booking/cancel`,
                    metadata: { bookingId: String(bookingId) },
                    expires_at: Math.floor(Date.now() / 1000) + 30 * 60 // minimo consentito da Stripe: 30 minuti
                });

                // 7. Salva l'id sessione sulla prenotazione
                db.query(`UPDATE bookings SET stripe_session_id = ? WHERE id = ?`, [session.id, bookingId]);

                res.json({ url: session.url });

            } catch (error) {
                console.error('Errore durante la creazione della sessione di pagamento:', error.message);

                if (bookingId) {
                    // La prenotazione era già stata committata: rilasciamo posti e stato a parte
                    db.query(
                        `UPDATE seats s JOIN booking_seats bs ON bs.row_index = s.row_index AND bs.col_index = s.col_index
                         SET s.status = 'available' WHERE bs.booking_id = ?`,
                        [bookingId]
                    );
                    db.query(`UPDATE bookings SET payment_status = 'failed' WHERE id = ?`, [bookingId]);
                    return res.status(500).json({ message: 'Errore durante l\'avvio del pagamento.' });
                }

                connection.rollback(() => {
                    release();
                    res.status(409).json({ message: error.message || 'Errore durante la prenotazione.' });
                });
            }
        });
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
        WHERE u.username = ? AND b.payment_status = 'paid'
        ORDER BY b.booking_date DESC, bs.row_index, bs.col_index
    `;

    db.query(sql, [username], (err, results) => {
        if (err) {
            console.error('Errore nel recupero delle prenotazioni:', err);
            return res.status(500).json({ message: 'Errore interno del server.' });
        }

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

app.post('/api/register', authLimiter, async (req, res) => {

    if (!username || !password)
        return res.status(400).json({ message: 'Username e password sono richiesti.' });

    if (username.trim().length < 3)
        return res.status(400).json({ message: 'Lo username deve avere almeno 3 caratteri.' });

    if (password.length < 6)
        return res.status(400).json({ message: 'La password deve avere almeno 6 caratteri.' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
        db.query(sql, [username.trim(), hashedPassword], (err, result) => {
            if (err) {
                if (err.code == 'ER_DUP_ENTRY')
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

app.post('/api/login', authLimiter, async (req, res) => {
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

        const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ message: 'Login avvenuto con successo!', token });
    });
});

const PORT = process.env.PORT || 5000;
// 404 - route non trovata
app.use((req, res) => {
    res.status(404).json({ message: 'Risorsa non trovata.' });
});

// Error handler centralizzato - cattura errori non gestiti nei middleware/route
app.use((err, req, res, next) => {
    console.error('Errore non gestito:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Errore interno del server.'
    });
});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});