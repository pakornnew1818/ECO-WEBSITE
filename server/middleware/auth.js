const jwt = require('jsonwebtoken');

/**
 * Middleware ตรวจสอบ JWT Token จาก httpOnly Cookie
 */
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Forbidden' });
        req.user = user;
        next();
    });
};

module.exports = { authenticateToken };
