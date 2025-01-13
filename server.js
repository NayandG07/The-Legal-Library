const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = 5500;

// Debug middleware - logs all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
    console.log('Created uploads directory');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log('Multer destination called');
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        console.log('Multer filename called:', file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use('/uploads', express.static('uploads'));
app.use(express.static(path.join(__dirname)));

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
        console.error('Token not provided');
        return res.status(403).send('Access denied.');
    }
    jwt.verify(token, 'secret_key', (err, decoded) => {
        if (err) {
            console.error('Token verification failed:', err.message);
            return res.status(403).send('Invalid token.');
        }
        req.user = decoded;
        console.log('Authenticated user:', req.user);
        next();
    });
};

const authorizeAdmin = (req, res, next) => {
    console.log('User role:', req.user.role);
    if (req.user.role !== 'admin') {
        return res.status(403).send('Access denied. Admins only.');
    }
    next();
};

// Signup route
app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).send('All fields are required.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = 'user';

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

    console.log(`Attempting to log in with email: ${email}`);

    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err || !user) {
            console.error('Error fetching user from database:', err);
            return res.status(401).send('Invalid email or password.');
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            console.log('Invalid password attempt for email:', email);
            return res.status(401).send('Invalid email or password.');
        }

        const token = jwt.sign({ id: user.id, role: user.role }, 'secret_key', { expiresIn: '1h' });
        console.log('Login successful, sending token for user:', email);
        res.json({ token, role: user.role });
    });
});

// Check admin status
app.get('/admin', authenticateToken, authorizeAdmin, (req, res) => {
    const adminPath = path.join(__dirname, 'admin.html');
    console.log(`Serving admin page from: ${adminPath}`);
    res.sendFile(adminPath);
});

// Upload route with improved error handling
app.post('/upload', authenticateToken, authorizeAdmin, upload.single('file'), (req, res) => {
    console.log('Upload request received');
    console.log('Request body:', req.body);
    console.log('File:', req.file);

    // Check if file was uploaded
    if (!req.file) {
        console.error('No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, description, price } = req.body;
    const filePath = req.file.path;

    if (!title || !description || !price) {
        console.error('Missing required fields');
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Log the insertion attempt
    console.log('Attempting to insert book:', {
        title,
        description,
        price,
        filePath,
        userId: req.user.id
    });

    // Insert into database
    db.run(
        `INSERT INTO books (title, description, price, file_url, uploaded_by) 
         VALUES (?, ?, ?, ?, ?)`,
        [title, description, price, filePath, req.user.id],
        function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ 
                    error: 'Failed to upload book',
                    details: err.message 
                });
            }
            console.log('Book inserted successfully with ID:', this.lastID);
            res.status(201).json({
                message: 'Book uploaded successfully',
                bookId: this.lastID,
                filePath: filePath
            });
        }
    );
});

// Get all books route
app.get('/books', authenticateToken, (req, res) => {
    db.all('SELECT * FROM books', [], (err, rows) => {
        if (err) {
            console.error('Error fetching books:', err);
            return res.status(500).send('Error fetching books');
        }
        res.json(rows);
    });
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

// Test database connection
app.get('/test-db', (req, res) => {
    db.get('SELECT COUNT(*) as count FROM books', [], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: 'Database is working', bookCount: row.count });
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});