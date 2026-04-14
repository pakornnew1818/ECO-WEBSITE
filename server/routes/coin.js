const express = require('express');
// pool: Object (Express Instance) | ตัวแปรภาษา (จากโมดูล express)
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// middleware สำหรับแปลงข้อมูล body เป็น JSON
router.use(express.json());

// pool: Object (MySQL Pool) | ตัวแปรที่เราตั้งเอง (ดึงมาจากไฟล์ config)
const { pool } = require('../config/db');

/**
 * ฟังก์ชันดึงจำนวนเหรียญ
 * @param {String} username - ตัวแปรภาษา (Parameter)
 */
async function getCoin(username) {
    try {
        // sql: String | ตัวแปรที่เราตั้งเอง
        const sql = 'SELECT coin FROM login WHERE username = ?';
        // rows: Array (Destructuring) | ตัวแปรภาษา (ผลลัพธ์จาก mysql2)
        const [rows] = await pool.execute(sql, [username]);

        return rows.length > 0 ? rows[0].coin : 0;
    } catch (error) {
        console.error('Error fetching balance', error);
        throw error;
    }
}

/**
 * ฟังก์ชันอัปเดตจำนวนเหรียญ
 * @param {String} username - ตัวแปรภาษา (Parameter)
 * @param {Number} amount - ตัวแปรภาษา (Parameter)
 */
async function updateCoin(username, amount) {
    try {
        // sql: String | ตัวแปรที่เราตั้งเอง
        // ใช้ตาราง login และ column coin ตามที่ระบุ
        const sql = 'UPDATE login SET coin = coin + ? WHERE username = ?';
        // result: Object (Destructuring) | ตัวแปรภาษา (ผลลัพธ์จาก mysql2)
        const [result] = await pool.execute(sql, [amount, username]);

        return result.affectedRows > 0;
    } catch (error) {
        console.error('Error updating coin', error);
        throw error;
    }
}

// API: ดึงจำนวนเหรียญ (GET)
router.get('/get-coin/:username', async (req, res) => {
    try {
        // user_param: String | เป็นตัวแปรที่เราตั้งเอง
        const user_param = req.params.username;
        const balance = await getCoin(user_param);

        res.status(200).json({
            success: true,
            coin: balance
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

router.post('/update-coin', authenticateToken, async (req, res) => {
    // username: String, amount: Number | เป็นตัวแปรจากภาษา (Destructuring)
    const { username, amount } = req.body;

    if (!username || amount === undefined) {
        return res.status(400).json({ success: false, message: 'Missing parameters' });
    }

    try {
        // isSuccess: Boolean | เป็นตัวแปรที่เราตั้งเอง
        const isSuccess = await updateCoin(username, amount);

        if (isSuccess) {
            // currentBalance: Number | เป็นตัวแปรที่เราตั้งเอง
            const currentBalance = await getCoin(username);
            res.status(200).json({
                success: true,
                message: 'Update successfully',
                newBalance: currentBalance
            });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Database Error' });
    }
});

module.exports = router;
