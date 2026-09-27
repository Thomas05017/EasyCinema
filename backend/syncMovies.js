require('dotenv').config();
const mysql = require('mysql2');
const { fetchNowPlaying, mapToLocalSchema } = require('./services/tmdbService');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Genera 3 showtimes di base per un film nuovo (oggi e domani), con sala vuota
const generateDefaultShowtimes = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const formatDate = (d) => d.toISOString().split('T')[0];
    const emptySeats = () => Array(5).fill(null).map(() => Array(8).fill(0));

    return [
        { date: formatDate(today), time: '17:00', seats: emptySeats() },
        { date: formatDate(today), time: '20:30', seats: emptySeats() },
        { date: formatDate(tomorrow), time: '17:00', seats: emptySeats() },
    ];
};

const upsertMovie = (movie) => {
    return new Promise((resolve, reject) => {
        // Controlla se esiste già (per tmdb_id)
        db.query('SELECT id FROM movies WHERE tmdb_id = ?', [movie.tmdb_id], (err, results) => {
            if (err) return reject(err);

            if (results.length > 0) {
                // Aggiorna i dati (potrebbero cambiare trama/poster nel tempo)
                const movieId = results[0].id;
                db.query(
                    `UPDATE movies SET title=?, genres=?, description=?, director=?, year=?, poster=? WHERE id=?`,
                    [movie.title, movie.genres, movie.description, movie.director, movie.year, movie.poster, movieId],
                    (err) => {
                        if (err) return reject(err);
                        console.log(`Aggiornato: "${movie.title}"`);
                        resolve({ id: movieId, isNew: false });
                    }
                );
            } else {
                // Inserisce nuovo film
                db.query(
                    `INSERT INTO movies (title, genres, description, director, year, poster, tmdb_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [movie.title, movie.genres, movie.description, movie.director, movie.year, movie.poster, movie.tmdb_id],
                    (err, result) => {
                        if (err) return reject(err);
                        console.log(`Inserito: "${movie.title}"`);
                        resolve({ id: result.insertId, isNew: true });
                    }
                );
            }
        });
    });
};

const insertShowtimesIfMissing = (movieId) => {
    return new Promise((resolve, reject) => {
        db.query('SELECT COUNT(*) as count FROM showtimes WHERE movie_id = ?', [movieId], async (err, results) => {
            if (err) return reject(err);
            if (results[0].count > 0) return resolve(); // già ha showtimes, non toccarli

            const showtimes = generateDefaultShowtimes();
            for (const st of showtimes) {
                const showtimeId = await new Promise((res, rej) => {
                    db.query(
                        'INSERT INTO showtimes (movie_id, date, time) VALUES (?, ?, ?)',
                        [movieId, st.date, st.time],
                        (err, result) => err ? rej(err) : res(result.insertId)
                    );
                });

                for (let r = 0; r < st.seats.length; r++) {
                    for (let c = 0; c < st.seats[r].length; c++) {
                        await new Promise((res, rej) => {
                            db.query(
                                'INSERT INTO seats (showtime_id, row_index, col_index, status) VALUES (?, ?, ?, ?)',
                                [showtimeId, r, c, 'available'],
                                (err) => err ? rej(err) : res()
                            );
                        });
                    }
                }
            }
            resolve();
        });
    });
};

const run = async () => {
    try {
        console.log('Recupero film attualmente in sala da TMDB...');
        const tmdbMovies = await fetchNowPlaying(10); // limitiamo a 10 per non esagerare con le chiamate

        for (const tmdbMovie of tmdbMovies) {
            const localMovie = await mapToLocalSchema(tmdbMovie);
            const { id, isNew } = await upsertMovie(localMovie);

            if (isNew) {
                await insertShowtimesIfMissing(id);
                console.log(`  → Showtimes generati per "${localMovie.title}"`);
            }
        }

        console.log('Sincronizzazione completata!');
    } catch (error) {
        console.error('Errore durante la sincronizzazione:', error.message);
    } finally {
        db.end();
    }
};

run();