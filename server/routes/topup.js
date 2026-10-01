const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { pool } = require('../config/db');

router.use(express.json());

/**
 * ฟังก์ชันแลก TrueMoney Gift Voucher
 * @param {String} voucherCode - รหัส voucher 16 หลัก
 * @returns {{ success: boolean, amount?: number, message?: string }}
 */
async function redeemTruemoneyVoucher(voucherCode) {
    // โหมด Demo: voucher ที่ขึ้นต้นด้วย "TEST" จะได้รับ 100 บาท
    if (voucherCode.toUpperCase().startsWith('TEST')) {
        return { success: true, amount: 100 };
    }

    // โหมดจริง: เรียก TrueMoney Gift Voucher API
    try {
        const apiUrl = process.env.TRUEMONEY_API_URL || 'https://gift.truemoney.com/campaign/vouchers';
        const mobile = process.env.TRUEMONEY_MOBILE;

        if (!mobile) {
            return { success: false, message: 'ยังไม่ได้ตั้งค่า TRUEMONEY_MOBILE ใน .env' };
        }

        // สร้าง SHA256 hash จาก voucher code แล้วตัดให้เหลือ 16 ตัวแรก
        // หมายเหตุ: TrueMoney API กำหนดให้ใช้ voucher_hash 16 ตัวแรกของ SHA256
        const voucherHash = crypto.createHash('sha256').update(voucherCode).digest('hex').slice(0, 16);

        const response = await fetch(`${apiUrl}/${voucherHash}/redeem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile, voucher_hash: voucherHash })
        });

        const data = await response.json();

        if (response.ok && data.status && data.status.code === 'SUCCESS') {
            return { success: true, amount: parseFloat(data.data.voucher.redeemed_amount_baht) };
        } else {
            const msg = (data.status && data.status.message) ? data.status.message : 'แลก Voucher ไม่สำเร็จ';
            return { success: false, message: msg };
        }
    } catch (error) {
        console.error('TrueMoney API Error:', error);
        return { success: false, message: 'ไม่สามารถเชื่อมต่อ TrueMoney API ได้' };
    }
}

/**
 * POST /api/topup/redeem
 * แลก TrueMoney Voucher เพื่อเติมเหรียญ
 */
router.post('/redeem', authenticateToken, async (req, res) => {
    const { voucherCode } = req.body;

    // ตรวจสอบ Input
    if (!voucherCode || typeof voucherCode !== 'string') {
        return res.status(400).json({ success: false, message: 'กรุณากรอกรหัส Voucher' });
    }

    // ลบ dash แล้วตรวจสอบว่ามี 16 หลัก
    const cleanCode = voucherCode.replace(/-/g, '').trim();
    if (cleanCode.length !== 16) {
        return res.status(400).json({ success: false, message: 'รหัส Voucher ต้องมี 16 หลัก' });
    }

    const username = req.user.username;
    const userId = req.user.userId;

    let connection;
    try {
        connection = await pool.getConnection();

        // ตรวจสอบว่า Voucher นี้เคยถูกใช้แล้วหรือไม่
        const [existing] = await connection.execute(
            'SELECT id FROM transactions WHERE voucher_code = ? LIMIT 1',
            [cleanCode]
        );
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'รหัส Voucher นี้ถูกใช้งานไปแล้ว' });
        }

        // เริ่ม Database Transaction
        await connection.beginTransaction();

        // บันทึกสถานะ pending ก่อน
        const [insertResult] = await connection.execute(
            `INSERT INTO transactions (user_id, username, voucher_code, amount, coins_received, status, transaction_type)
             VALUES (?, ?, ?, 0, 0, 'pending', 'topup')`,
            [userId, username, cleanCode]
        );
        const transactionId = insertResult.insertId;

        // แลก Voucher
        const redeemResult = await redeemTruemoneyVoucher(cleanCode);

        if (!redeemResult.success) {
            // อัปเดตสถานะเป็น failed
            await connection.execute(
                "UPDATE transactions SET status = 'failed' WHERE id = ?",
                [transactionId]
            );
            await connection.commit();
            return res.status(400).json({ success: false, message: redeemResult.message || 'แลก Voucher ไม่สำเร็จ' });
        }

        const amount = redeemResult.amount;
        const coinsReceived = Math.floor(amount); // 1 บาท = 1 Coin (ปัดทิ้งทศนิยม ตามนโยบายระบบ)

        // อัปเดตสถานะเป็น success พร้อมจำนวนเงิน
        await connection.execute(
            "UPDATE transactions SET status = 'success', amount = ?, coins_received = ? WHERE id = ?",
            [amount, coinsReceived, transactionId]
        );

        // อัปเดตยอดเหรียญในตาราง login
        await connection.execute(
            'UPDATE login SET coin = coin + ? WHERE username = ?',
            [coinsReceived, username]
        );

        // ดึงยอดเหรียญปัจจุบัน
        const [coinRows] = await connection.execute(
            'SELECT coin FROM login WHERE username = ?',
            [username]
        );
        const newBalance = coinRows.length > 0 ? coinRows[0].coin : 0;

        await connection.commit();

        return res.status(200).json({
            success: true,
            amount,
            coins: coinsReceived,
            newBalance
        });

    } catch (error) {
        if (connection) {
            try { await connection.rollback(); } catch (_) { }
        }
        console.error('Topup Error:', error);
        return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่' });
    } finally {
        if (connection) connection.release();
    }
});

/**
 * GET /api/topup/history/:username
 * ดึงประวัติการเติมเงิน 20 รายการล่าสุด
 */
router.get('/history/:username', authenticateToken, async (req, res) => {
    const { username } = req.params;

    // ตรวจสอบสิทธิ์: ดูได้เฉพาะประวัติของตัวเอง
    if (req.user.username !== username) {
        return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ดูข้อมูลนี้' });
    }

    try {
        const [rows] = await pool.execute(
            `SELECT id, voucher_code, amount, coins_received, status, transaction_type, created_at
             FROM transactions
             WHERE username = ?
             ORDER BY created_at DESC
             LIMIT 20`,
            [username]
        );

        return res.status(200).json({ success: true, history: rows });
    } catch (error) {
        console.error('History Error:', error);
        return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
    }
});

module.exports = router;
