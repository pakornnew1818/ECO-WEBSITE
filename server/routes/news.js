const express = require('express');
const router = express.Router();
// Import db.js

const { pool } = require('../config/db');

//GET ดึงข่าว
router.get('/', async (req, res) => {
    try {
        const [news] = await pool.query('SELECT * FROM news ORDER by created_at DESC');

        res.json({success: true, data: news});
    } catch (error) {
        console.error("Error fetching news:", news);
        res.status(500).json({success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลข่าวสาร'});
    }
})

router.post('/', async (req, res) => {

    const {title, type, content_html, cover_image} = req.body;

    try {
        await pool.query(
            'INTER INTO news (title, type, content_html, cover_image) VALUES (?, ?, ?, ?)',
            [title, type || 'Notice', content_html, cover_image]
        );
        res.json({ success: true, message: 'สร้างข่าวสารสำเร็จ'});
    } catch (error) {
        console.error("Error creating news:", error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดในการสร้างข่าวสาร'});
    }
});

module.exports = router;