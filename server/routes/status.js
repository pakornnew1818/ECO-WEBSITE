const express = require('express');
const router  = express.Router();
const net     = require('net'); // built-in Node.js ไม่ต้องติดตั้งเพิ่ม

const GAME_HOST = '127.0.0.1';
const GAME_PORT = 12000; // port จาก SagaLogin.xml

// ฟังก์ชัน ping game server
function checkGameServer() {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(3000); // รอ 3 วินาที

        socket.connect(GAME_PORT, GAME_HOST, () => {
            socket.destroy();
            resolve(true); // ต่อได้ = Online
        });

        socket.on('error',   () => { socket.destroy(); resolve(false); });
        socket.on('timeout', () => { socket.destroy(); resolve(false); });
    });
}

// GET /api/status
router.get('/status', async (req, res) => {
    try {
        const isOnline = await checkGameServer();
        res.json({
            success: true,
            status:  isOnline ? 'online' : 'offline',
            online:  isOnline
        });
    } catch (err) {
        res.json({ success: false, status: 'offline', online: false });
    }
});

module.exports = router;
