# ECO — Experience Classic Online 🎮

> เว็บไซต์สำหรับเกม ECO Classic พร้อมระบบสมัครสมาชิก, เข้าสู่ระบบ และเติมเงินผ่าน TrueMoney Wallet

---

## 🔗 Live Demo
> _Coming soon — จะ deploy บน Railway + Vercel_

---

## ✨ Features

- ✅ ระบบสมัครสมาชิกพร้อมยืนยัน OTP ผ่านอีเมล
- ✅ ระบบ Login / Logout ด้วย JWT (httpOnly Cookie)
- ✅ ระบบเติมเงินผ่าน TrueMoney Gift Voucher
- ✅ ตรวจสอบ Voucher ซ้ำ ป้องกันการใช้ซ้ำ
- ✅ ประวัติการเติมเงิน (Transaction History)
- ✅ Dark Mode / Light Mode
- ✅ Responsive Design (Mobile Friendly)
- ✅ Rate Limiting ป้องกัน Brute Force

---

## ⚙️ Tech Stack

**Frontend**
- HTML5, CSS3, Vanilla JavaScript
- Tailwind CSS
- SweetAlert2

**Backend**
- Node.js + Express.js v5
- JWT Authentication (httpOnly Cookie)
- Nodemailer (OTP via Gmail)
- bcrypt (Password Hashing)

**Database**
- MySQL + mysql2
- Connection Pooling
- Database Transaction

**Security**
- express-rate-limit — Brute Force Protection
- CORS, Cookie-Parser
- Environment Variables (.env)

---

## 🚀 Getting Started

### Requirements
- Node.js v18+
- MySQL (Laragon / XAMPP)

### Installation

```bash
# 1. Clone repository
git clone https://github.com/pakornnew1818/ECO-WEBSITE.git
cd ECO-WEBSITE

# 2. ติดตั้ง dependencies
npm install

# 3. สร้างไฟล์ .env จาก template
cp .env.example .env
```

### ตั้งค่า .env

```env
JWT_SECRET=your-super-secret-key
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3000

DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=
DB_NAME=sagaz

MAIL_USER=your-email@gmail.com
MAIL_PASS=your-gmail-app-password

TRUEMONEY_API_URL=https://gift.truemoney.com/campaign/vouchers
TRUEMONEY_MOBILE=your-phone-number
```

### Run

```bash
npm start
# Server จะรันที่ http://localhost:3000
```

---

## 📁 Project Structure

```
ECO-WEBSITE/
├── client/                  # Frontend
│   ├── index.html           # หน้าหลัก
│   ├── css/style.css
│   ├── js/
│   │   ├── coinscript.js    # แสดงยอดเหรียญ
│   │   ├── register.js      # ระบบสมัครสมาชิก
│   │   └── topup.js         # ระบบเติมเงิน
│   └── pages/
│       ├── login.html
│       ├── register.html
│       └── topup.html
└── server/                  # Backend
    ├── app.js               # Entry Point
    ├── config/db.js         # Database Config
    ├── middleware/auth.js   # JWT Middleware
    └── routes/
        ├── auth.js          # Register, Login, OTP
        ├── coin.js          # Get/Update Coins
        └── topup.js         # TrueMoney Voucher
```

---

## 🔐 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/request-otp` | ขอรหัส OTP | ❌ |
| POST | `/auth/register` | สมัครสมาชิก | ❌ |
| POST | `/auth/login` | เข้าสู่ระบบ | ❌ |
| GET | `/auth/me` | ดูข้อมูลตัวเอง | ✅ |
| POST | `/auth/logout` | ออกจากระบบ | ❌ |
| GET | `/api/get-coin/:username` | ดูยอดเหรียญ | ❌ |
| POST | `/api/update-coin` | อัปเดตเหรียญ | ✅ |
| POST | `/api/topup/redeem` | แลก Voucher | ✅ |
| GET | `/api/topup/history/:username` | ประวัติเติมเงิน | ✅ |

---

## 🧪 ทดสอบระบบเติมเงิน (Development Mode)

ใช้ Voucher ที่ขึ้นต้นด้วย `TEST` เช่น `TEST123456789012` จะได้รับ **100 Coins** ทันที โดยไม่ต้องเชื่อมต่อ TrueMoney API จริง

---

## 👨‍💻 Author

**Pakornnew** — [@pakornnew1818](https://github.com/pakornnew1818)

---

## 📄 License

MIT License
