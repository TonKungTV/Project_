const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 🧬 ตั้งค่าการเชื่อมต่อฐานข้อมูล
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // ถ้ามีรหัสผ่านใส่ตรงนี้
    database: 'medicationapp'
});

db.connect(err => {
    if (err) {
        console.error('❌ MySQL connection failed: ', err);
    } else {
        console.log('✅ Connected to MySQL Database!');
    }
});

// 📍 ตัวอย่าง route
app.get('/users', (req, res) => {
    db.query('SELECT * FROM Users', (err, results) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(results);
        }
    });
});

// 🚀 รัน server
app.listen(3000, () => {
    console.log('🌐 Server is running on port 3000');
});
