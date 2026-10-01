const express = require('express'); // Function | ตัวแปรจาก Library (Express)
const crypto = require('crypto'); // Object | ตัวแปรจากภาษา (Node.js Built-in)
const nodemailer = require('nodemailer'); // Object | ตัวแปรจาก Library
const randomstring = require('randomstring'); // Object | ตัวแปรจาก Library
const jwt = require('jsonwebtoken'); // Object | ตัวแปรจาก Library

// ดึงการเชื่อมต่อและคอนฟิกจากไฟล์ config
const { pool, config } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
