require('dotenv').config();
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

const createTables = async () => {
    // users
    await new Promise((resolve, reject) => {
        db.query(
            `CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL
            )`,
            (err) => {
                if (err) { console.error('Error creating table users:', err); reject(err); }
                else { console.log('Table users created or already exists'); resolve(); }
            }
        );
    });

    // movies
    await new Promise((resolve, reject) => {
        db.query(
            `CREATE TABLE IF NOT EXISTS movies (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tmdb_id INT UNIQUE,
                title VARCHAR(255) NOT NULL,
                genres VARCHAR(500),
                description TEXT,
                director VARCHAR(255),
                year INT,
                poster TEXT
            )`,
            (err) => {
                if (err) { console.error('Error creating table movies:', err); reject(err); }
                else { console.log('Table movies created or already exists'); resolve(); }
            }
        );
    });

    // showtimes
    await new Promise((resolve, reject) => {
        db.query(
            `CREATE TABLE IF NOT EXISTS showtimes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                movie_id INT NOT NULL,
                date DATE,
                time TIME,
                FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
            )`,
            (err) => {
                if (err) { console.error('Error creating table showtimes:', err); reject(err); }
                else { console.log('Table showtimes created or already exists'); resolve(); }
            }
        );
    });

    // seats
    await new Promise((resolve, reject) => {
        db.query(
            `CREATE TABLE IF NOT EXISTS seats (
                id INT AUTO_INCREMENT PRIMARY KEY,
                showtime_id INT NOT NULL,
                row_index INT NOT NULL,
                col_index INT NOT NULL,
                status ENUM('available', 'pending', 'booked') NOT NULL DEFAULT 'available',
                FOREIGN KEY (showtime_id) REFERENCES showtimes(id) ON DELETE CASCADE,
                UNIQUE KEY unique_seat_per_showtime (showtime_id, row_index, col_index)
            )`,
            (err) => {
                if (err) { console.error('Error creating table seats:', err); reject(err); }
                else { console.log('Table seats created or already exists'); resolve(); }
            }
        );
    });

    // bookings
    await new Promise((resolve, reject) => {
        db.query(
            `CREATE TABLE IF NOT EXISTS bookings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                showtime_id INT NOT NULL,
                booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                payment_status ENUM('pending', 'paid', 'expired', 'failed') NOT NULL DEFAULT 'pending',
                pending_expires_at DATETIME NULL,
                stripe_session_id VARCHAR(255) NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (showtime_id) REFERENCES showtimes(id) ON DELETE CASCADE
            )`,
            (err) => {
                if (err) { console.error('Error creating table bookings:', err); reject(err); }
                else { console.log('Table bookings created or already exists'); resolve(); }
            }
        );
    });

    // booking_seats
    await new Promise((resolve, reject) => {
        db.query(
            `CREATE TABLE IF NOT EXISTS booking_seats (
                id INT AUTO_INCREMENT PRIMARY KEY,
                booking_id INT NOT NULL,
                row_index INT NOT NULL,
                col_index INT NOT NULL,
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
                UNIQUE KEY unique_booking_seat (booking_id, row_index, col_index)
            )`,
            (err) => {
                if (err) { console.error('Error creating table booking_seats:', err); reject(err); }
                else { console.log('Table booking_seats created or already exists'); resolve(); }
            }
        );
    });
};

const populateData = async () => {
    const testPassword = bcrypt.hashSync('test123', 10);

    await new Promise((resolve, reject) => {
        db.query(
            'INSERT IGNORE INTO users (username, password) VALUES (?, ?)',
            ['testuser', testPassword],
            (err) => {
                if (err) { console.error('Error inserting test user:', err); reject(err); }
                else { console.log('Test user created: username="testuser", password="test123"'); resolve(); }
            }
        );
    });

    const testPassword2 = bcrypt.hashSync('demo123', 10);
    await new Promise((resolve, reject) => {
        db.query(
            'INSERT IGNORE INTO users (username, password) VALUES (?, ?)',
            ['demo', testPassword2],
            (err) => {
                if (err) { console.error('Error inserting demo user:', err); reject(err); }
                else { console.log('Demo user created: username="demo", password="demo123"'); resolve(); }
            }
        );
    });

    console.log('Database seeding completed successfully!');
    console.log('\nCredenziali di test:');
    console.log('Username: testuser, Password: test123');
    console.log('Username: demo, Password: demo123');
    console.log('\nPer popolare il catalogo film, esegui: npm run sync:movies');
};

const initDatabase = async () => {
    try {
        await createTables();
        await populateData();
        db.end();
    } catch (error) {
        console.error('Error during database initialization:', error);
        db.end();
    }
};

initDatabase();