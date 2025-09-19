const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());
app.use(cors());

const users = [];

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username e password sono richiesti.' });
    }

    if (users.find(u => u.username === username)) {
        return res.status(409).json({ message: 'Username già in uso.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    users.push({ username, password: hashedPassword });
    console.log(users);

    res.status(201).json({ message: 'Registrazione avvenuta con successo!' });
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username e password sono richiesti.' });
    }

    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(401).json({ message: 'Credenziali non valide.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: 'Credenziali non valide.' });
    }

    const token = jwt.sign({ username: user.username }, 'la_tua_chiave_segreta', { expiresIn: '1h' });

    res.json({ message: 'Login avvenuto con successo!', token });
});

app.listen(5000, () => {
    console.log(`Server is running on http://localhost:${5000}`);
});