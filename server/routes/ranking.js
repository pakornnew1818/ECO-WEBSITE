const express = require('express'); // Function | ตัวแปรจาก Library (Express)

// ดึงการเชื่อมต่อและคอนฟิกจากไฟล์ config
const { pool, config } = require('../config/db');
// สร้าง Router แทนการสร้าง app ใหม่
const router = express.Router(); // Object (Router) | ตัวแปรที่เราตั้งเอง

router.get('/api/ranking', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT name, level, exp
            FROM characters
            ORDER BY level DESC, exp DESC
            LIMIT 5
        `);

        res.json({
            success: true,
            ranking: rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Cannot load ranking'
        });
    }
});

module.exports = router;