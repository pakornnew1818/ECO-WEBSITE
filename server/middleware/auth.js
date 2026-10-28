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

function isAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json {
            sucess: false,
            message: 'การเข้าถึงถูกปฏิเสธ : คุณต้องเป็นผู้ดูแลระบบเท่านั้น!'
        }
    }
    next();
}

module.exports = { authenticateToken, isAdmin };
