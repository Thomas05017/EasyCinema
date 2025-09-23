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
            res.json(201).json({ message: 'Registrazione avvenuto con successo!'});
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
    })

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: 'Credenziali non valide.' });
    }

    const token = jwt.sign({ username: user.username }, '123abcxyz987', { expiresIn: '1h' });

    res.json({ message: 'Login avvenuto con successo!', token });
});

app.listen(5000, () => {
    console.log(`Server is running on http://localhost:${5000}`);
});