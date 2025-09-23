const mysql = require('mysql2');

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
        showtime_id INT NOT NULL UNIQUE,
        row_index INT NOT NULL UNIQUE,
        col_index INT NOT NULL UNIQUE,
        is_booked BOOLEAN NOT NULL DEFAULT FALSE,
        FOREIGN KEY (showtime_id) REFERENCES showtimes(id) ON DELETE CASCADE
    )`,
    (err) => {
        if (err) {
            console.error('Error creating table note:', err);
            db.end();
            return;
        }

        console.log('Table ready.');
        db.end();
    }
);