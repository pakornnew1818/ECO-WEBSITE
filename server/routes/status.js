const express = require('express');
const router = express.Router();
const net = require('net');
const { pool } = require('../config/db');

// ฟังก์ชันสำหรับลองเชื่อมต่อ Port ของเซิร์ฟเวอร์เกม
function checkGameServer(host, port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(2000); // ตั้งเวลารอสูงสุด 2 วินาที (ถ้าเกินถือว่า Offline)

        // ถ้าเชื่อมต่อสำเร็จ (เกมรันอยู่)
        socket.on('connect', () => {
            socket.destroy(); // ปิดการเชื่อมต่อทันที เพราะเราแค่มาเช็ก
            resolve(true);
        });

        // ถ้าหมดเวลา (เกมปิด หรือค้าง)
        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });

        // ถ้าเกิด Error (เช่น IP ผิด, เครื่องปิด)
        socket.on('error', () => {
            resolve(false);
        });

        // เริ่มลองเชื่อมต่อ
        socket.connect(port, host);
    });
}

// สร้าง GET API ให้หน้าเว็บหลักเรียกใช้
router.get('/status', async (req, res) => {
    // ⚠️ ต้องเปลี่ยน '127.0.0.1' และ 5121 เป็น IP และ Port เกมของคุณจริงๆ
    const GAME_SERVER_IP = '127.0.0.1'; 
    const GAME_SERVER_PORT = 5121; 

    // เรียกใช้ฟังก์ชันเช็ก
    const isOnline = await checkGameServer(GAME_SERVER_IP, GAME_SERVER_PORT);

    // ส่งผลลัพธ์กลับไปให้หน้าเว็บ index.html
    res.json({
        success: true,
        online: isOnline,
        port: GAME_SERVER_PORT
    });
});


// สร้าง API สำหรับดึง Ranking ไปโชว์ที่หน้าเว็บ
router.get('/ranking', async (req, res) => {
    try {
        // สมมติว่าตารางชื่อ 'users' และมีคอลัมน์ username, level, exp
        // เรียงลำดับ Level ก่อน ถ้า Level เท่ากัน ให้เรียงตาม EXP ต่อ แล้วดึงมาแค่ 4 อันดับแรก
        const [rankings] = await pool.query(`
            SELECT \`name\`, \`lv\`, \`cexp\` 
            FROM \`char\`
            ORDER BY \`lv\` DESC, \`cexp\` DESC 
            LIMIT 4
        `);

        res.json({ success: true, data: rankings });
    } catch (error) {
        console.error("Ranking Fetch Error:", error);
        res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูล Ranking ได้' });
    }
});

module.exports = router;