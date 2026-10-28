const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { pool, config } = require('../config/db');

// ทดสอบ Endpoint ลับเฉพาะ Admin
router.get('/test-admin', authenticateToken, isAdmin, async (req, res) => {
    res.json({ 
        success: true, 
        message: `ยินดีต้อนรับท่านแอดมิน ${req.user.username} เข้าสู่ระบบจัดการ` 
    });
});

module.exports = router;