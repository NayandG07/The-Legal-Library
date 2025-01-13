const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors'); // Added CORS middleware
const path = require('path'); // Added path module
const app = express();
const PORT = 5500;

// Middleware
app.use(bodyParser.json());

// Enable CORS for all routes
app.use(cors()); // Added to enable Cross-Origin Resource Sharing (CORS)

// Database setup
const db = new sqlite3.Database('./ebook_platform.db', (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// Create tables
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user'
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            price REAL,
            file_url TEXT NOT NULL,
            uploaded_by INTEGER,
            FOREIGN KEY (uploaded_by) REFERENCES users (id)
        )
    `);
});

// Helper functions
const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        console.error('Token not provided'); // Debugging: Log missing token
        return res.status(403).send('Access denied.');
    }
    jwt.verify(token, 'secret_key', (err, decoded) => {
        if (err) {
            console.error('Token verification failed:', err.message); // Debugging: Log token error
            return res.status(403).send('Invalid token.');
        }
        req.user = decoded;
        console.log('Authenticated user:', req.user); // Debugging: Log authenticated user
        next();
    });
};

const authorizeAdmin = (req, res, next) => {
    console.log('User role:', req.user.role); // Debugging: Log user role
    if (req.user.role !== 'admin') {
        return res.status(403).send('Access denied. Admins only.');
    }
    next();
};

// Routes

// Signup route
app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).send('All fields are required.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = 'user'; // Force role to 'user'

    db.run(
        `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`,
        [username, email, hashedPassword, role],
        (err) => {
            if (err) {
                console.error('Error creating user:', err.message);
                return res.status(500).send('User already exists or another error occurred.');
            }
            res.status(201).send('Signup successful.');
        }
    );
});

// Login route
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    console.log(`Attempting to log in with email: ${email}`); // Debugging log

    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err || !user) {
            console.error('Error fetching user from database:', err); // Log database errors
            return res.status(401).send('Invalid email or password.');
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            console.log('Invalid password attempt for email:', email); // Log invalid login attempts
            return res.status(401).send('Invalid email or password.');
        }

        const token = jwt.sign({ id: user.id, role: user.role }, 'secret_key', { expiresIn: '1h' });
        console.log('Login successful, sending token for user:', email); // Log successful login
        // res.json({ token });
        res.json({ token, role: user.role }); // Send user role with token
    });
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Check admin status
app.get('/admin', authenticateToken, authorizeAdmin, (req, res) => {
    const adminPath = path.join(__dirname, 'admin.html'); // Update path if needed
    console.log(`Serving admin page from: ${adminPath}`);
    res.sendFile(adminPath);
});

// Book upload route
app.post('/upload', authenticateToken, authorizeAdmin, (req, res) => {
    const { title, description, price } = req.body;
    const filePath = req.file?.path || '/uploads/default.pdf'; // Update with file upload logic if needed

    db.run(
        `INSERT INTO books (title, description, price, file_url, uploaded_by) VALUES (?, ?, ?, ?, ?)`,
        [title, description, price, filePath, req.user.id],
        (err) => {
            if (err) return res.status(500).send('Failed to upload book.');
            res.status(201).send('Book uploaded successfully.');
        }
    );
});

// Default admin account
const defaultAdmin = {
    username: 'Admin',
    email: 'nayandg8@gmail.com',
    password: 'admin123',
    role: 'admin',
};

db.serialize(() => {
    db.get('SELECT * FROM users WHERE role = "admin"', (err, admin) => {
        if (!admin) {
            bcrypt.hash(defaultAdmin.password, 10, (err, hashedPassword) => {
                if (err) console.error('Error hashing admin password:', err.message);
                db.run(
                    'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
                    [defaultAdmin.username, defaultAdmin.email, hashedPassword, defaultAdmin.role],
                    (err) => {
                        if (err) {
                            console.error('Error creating default admin:', err.message);
                        } else {
                            console.log('Default admin account created.');
                        }
                    }
                );
            });
        } else {
            console.log('Admin account already exists.');
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
