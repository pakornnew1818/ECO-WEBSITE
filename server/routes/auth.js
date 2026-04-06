const express = require('express'); // Function | ตัวแปรจาก Library (Express)
const crypto = require('crypto'); // Object | ตัวแปรจากภาษา (Node.js Built-in)
const nodemailer = require('nodemailer'); // Object | ตัวแปรจาก Library
const randomstring = require('randomstring'); // Object | ตัวแปรจาก Library
const jwt = require('jsonwebtoken'); // Object | ตัวแปรจาก Library

// ดึงการเชื่อมต่อและคอนฟิกจากไฟล์ config
const { pool, config } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// สร้าง Router แทนการสร้าง app ใหม่
const router = express.Router(); // Object (Router) | ตัวแปรที่เราตั้งเอง
const otpStore = new Map(); // Object (Map) | ตัวแปรที่เราตั้งเอง

/**
 * ฟังก์ชันสร้าง MD5
 */
function md5(text) {
    return crypto.createHash('md5').update(text).digest('hex');
}

// --- Mailer Configuration ---
const mailSender = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

// ขอรหัส OTP
router.post('/request-otp', async (req, res) => {
    const { email, username } = req.body;
    const mail = (email || '').trim();
    const user = (username || '').trim();

    if (!mail || !user) return res.status(400).json({ success: false, message: "กรุณากรอก Email และ Username" });

    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute(`SELECT 1 FROM ${config.tables.login} WHERE username = ? LIMIT 1`, [user]);
        if (rows.length > 0) return res.status(409).json({ success: false, message: "ชื่อผู้ใช้งานนี้ถูกใช้ไปแล้ว" });

        const otp = randomstring.generate({ length: 6, charset: 'numeric' });
        const expiry = Date.now() + (5 * 60 * 1000);
        otpStore.set(mail, { otp, expiry });

        await mailSender.sendMail({
            from: '"ECO CLASSIC" <ecoclassic019@gmail.com>',
            to: mail,
            subject: 'รหัส OTP สำหรับสมัครสมาชิก',
            html: `<h2>รหัส OTP ของคุณคือ: ${otp}</h2>`
        });
        res.json({ success: true, message: "ส่ง OTP สำเร็จ!" });
    } catch (error) {
        res.status(500).json({ success: false, message: `Error: ${error.message}` });
    } finally {
        if (connection) connection.release();
    }
});

// สมัครสมาชิก
router.post('/register', async (req, res) => {
    let { username, password, email, otp } = req.body;
    const user = (username || '').trim();
    const pass = (password || '').trim();
    const mail = (email || '').trim();
    const userOtp = (otp || '').trim();

    const savedOtpData = otpStore.get(mail);
    if (!savedOtpData || savedOtpData.otp !== userOtp || Date.now() > savedOtpData.expiry) {
        return res.status(400).json({ success: false, message: "OTP ไม่ถูกต้องหรือหมดอายุ" });
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "0.0.0.0";
    const md5Pass = md5(pass);
    const token = crypto.randomBytes(16).toString('hex');

    let connection;
    try {
        connection = await pool.getConnection();
        const insertSql = `INSERT INTO ${config.tables.login} (username, password, deletepass, email, lastip, token) VALUES (?, ?, ?, ?, ?, ?)`;
        await connection.execute(insertSql, [user, md5Pass, md5Pass, mail, ip, token]);
        otpStore.delete(mail);
        res.json({ success: true, message: "สมัครสำเร็จ!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "DB Error" });
    } finally {
        if (connection) connection.release();
    }
});

// ล็อกอิน
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = (username || '').trim();
    const pass = (password || '').trim();

    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute(`SELECT * FROM ${config.tables.login} WHERE username = ? LIMIT 1`, [user]);

        if (rows.length === 0 || md5(pass) !== rows[0].password) {
            return res.status(401).json({ success: false, message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
        }

        const token = jwt.sign(
            { userId: rows[0].id, username: rows[0].username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });
        res.json({ success: true, user: { username: rows[0].username } });
    } catch (error) {
        res.status(500).json({ success: false, message: "DB Error" });
    } finally {
        if (connection) connection.release();
    }
});

// ดึงข้อมูล User ปัจจุบันจาก JWT Token
router.get('/me', authenticateToken, (req, res) => {
    res.json({ success: true, user: { username: req.user.username } });
});

// ออกจากระบบ
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
});

// ส่งออก router และ authenticateToken เพื่อให้ไฟล์อื่นนำไปใช้
module.exports = { router, authenticateToken };
