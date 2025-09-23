const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const movies = require('./data/movies');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'user',
    password: 'password',
    database: 'cinema_db',
});

db.query(
    `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
    )`,
    (err) => {
        if (err) {
            console.error('Error creating table users:', err);
            db.end();
            return;
        }
    }
);

db.query(
    `CREATE TABLE IF NOT EXISTS movies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        director VARCHAR(255),
        year INT,
        poster TEXT
    )`,
    (err) => {
        if (err) {
            console.error('Error creating table movies:', err);
            db.end();
            return;
        }
    }
);

db.query(
    `CREATE TABLE IF NOT EXISTS showtimes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        movie_id INT NOT NULL,
        date DATE,
        time TIME,
        FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
    )`,
    (err) => {
        if (err) {
            console.error('Error creating table showtimes:', err);
            db.end();
            return;
        }
    }
);

db.query(
    `CREATE TABLE IF NOT EXISTS seats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        showtime_id INT NOT NULL,
        row_index INT NOT NULL,
        col_index INT NOT NULL,
        is_booked BOOLEAN NOT NULL DEFAULT FALSE,
        FOREIGN KEY (showtime_id) REFERENCES showtimes(id) ON DELETE CASCADE,
        UNIQUE KEY unique_seat_per_showtime (showtime_id, row_index, col_index)
    )`,
    (err) => {
        if (err) {
            console.error('Error creating table note:', err);
            db.end();
            return;
        }
    }
);

const populateData = async () => {
    const testPassword = bcrypt.hashSync('test123', 10);

    await new Promise((resolve, reject) => {
        db.query(
            'INSERT IGNORE INTO users (username, password) VALUES (?, ?)',
            ['testuser', testPassword],
            (err) => {
                if (err) {
                    console.error('Error inserting test user:', err);
                    reject(err);
                } else {
                    console.log('Test user created: username="testuser", password="test123"');
                    resolve();
                }
            }
        );
    });

    for (const movie of movies) {
        await new Promise((resolve, reject) => {
            db.query(
                'INSERT IGNORE INTO movies (id, title, genres, description, director, year, poster) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [movie.id, movie.title, movie.genres, movie.description, movie.director, movie.year, movie.poster],
                (err, result) => {
                    if (err) {
                        console.error(`Error inserting movie ${movie.title}:`, err);
                        reject(err);
                    } else {
                        console.log(`Movie "${movie.title}" inserted successfully`);
                        resolve();
                    }
                }
            );
        });

        for (const showtime of movie.showtimes) {
            const showtimeId = await new Promise((resolve, reject) => {
                db.query(
                    'INSERT IGNORE INTO showtimes (movie_id, date, time) VALUES (?, ?, ?)',
                    [movie.id, showtime.date, showtime.time],
                    (err, result) => {
                        if (err) {
                            console.error(`Error inserting showtime for movie ${movie.title}:`, err);
                            reject(err);
                        } else {
                            console.log(`Showtime for "${movie.title}" at ${showtime.time} on ${showtime.date} inserted successfully`);
                            resolve(result.insertId);
                        }
                    }
                );
            });

            if (showtimeId) {
                for (let rowIndex = 0; rowIndex < showtime.seats.length; rowIndex++) {
                    for (let colIndex = 0; colIndex < showtime.seats[rowIndex].length; colIndex++) {
                        const isBooked = showtime.seats[rowIndex][colIndex] === 1;
                        
                        await new Promise((resolve, reject) => {
                            db.query(
                                'INSERT IGNORE INTO seats (showtime_id, row_index, col_index, is_booked) VALUES (?, ?, ?, ?)',
                                [showtimeId, rowIndex, colIndex, isBooked],
                                (err) => {
                                    if (err) {
                                        console.error(`Error inserting seat ${rowIndex}-${colIndex}:`, err);
                                        reject(err);
                                    } else {
                                        resolve();
                                    }
                                }
                            );
                        });
                    }
                }
                console.log(`All seats for showtime ${showtimeId} inserted successfully`);
            }
        }
    }
};

populateData();