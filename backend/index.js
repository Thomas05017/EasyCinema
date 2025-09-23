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