
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET environment variable is not set. Please configure it in your .env file.');
    process.exit(1);
}

const path = require('path');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { pool, config } = require('./config/db');

// 1. Import Routes
const coinRoutes = require('./routes/coin');
const { router: authRoutes } = require('./routes/auth');
const topupRoutes = require('./routes/topup');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiter for authentication routes (prevents brute force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, '..', 'client')));

// 2. user routes
const coinLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', coinLimiter, coinRoutes);
app.use('/api/topup', coinLimiter, topupRoutes);
app.use('/auth', authLimiter, authRoutes);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
