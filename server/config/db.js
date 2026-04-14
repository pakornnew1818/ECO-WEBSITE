/**
 * Database Configuration for Node.js (MySQL/MariaDB)
 * ไฟล์นี้เชื่อมต่อกับฐานข้อมูล sagaz
 */

const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: 3306,

    tables: {
        login: 'login'
    },

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
};

const pool = mysql.createPool(dbConfig);

// --- ระบบตรวจสอบความพร้อมของตาราง (ช่วยหาจุด Error) ---
if (require.main === module) {
    (async () => {
        try {
            console.log('⏳ กำลังเชื่อมต่อฐานข้อมูล...');
            const connection = await pool.getConnection();
            console.log('✅ เชื่อมต่อสำเร็จ!');

            // ตรวจสอบโครงสร้างตาราง login
            const [columns] = await connection.query(`DESCRIBE ${dbConfig.tables.login}`);
            console.log(`📋 โครงสร้างตาราง "${dbConfig.tables.login}" ปัจจุบัน:`);
            console.table(columns.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null })));

            connection.release();
        } catch (err) {
            console.error('❌ เกิดข้อผิดพลาด!');
            console.error('รายละเอียด:', err.message);

            if (err.code === 'ER_BAD_DB_ERROR') {
                console.log('💡 คำแนะนำ: ไม่พบฐานข้อมูลชื่อ "sagaz" กรุณาตรวจสอบใน HeidiSQL');
            } else if (err.code === 'ECONNREFUSED') {
                console.log('💡 คำแนะนำ: MySQL ไม่ได้เปิดอยู่ (เช็คที่ Laragon)');
            }
        }
    })();
}

module.exports = {
    config: dbConfig,
    pool: pool
};
