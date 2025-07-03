const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// เชื่อมต่อ MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // เปลี่ยนตาม XAMPP ของคุณ
  database: 'medicationapp',
});

db.connect(err => {
  if (err) throw err;
  console.log('MySQL Connected!');
});

app.get('/api/medications', (req, res) => {
    db.query('SELECT * FROM medications', (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results.map(row => ({
        ...row,
        meals: JSON.parse(row.meals), // แปลงจาก JSON string กลับเป็น array
      })));
    });
  });

  app.post('/api/medications', (req, res) => {
    const data = req.body;
    const sql = `
      INSERT INTO medications
      (name, groupid, note, typeid, dosage, unitid, usagemealid, usagemealtimeid, defaulttime_id, start_date, end_date, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
  
    db.query(sql, [
      data.Name,
      data.GroupID,
      data.Note,
      data.TypeID,
      data.Dosage,
      data.UnitID,
      data.UsageMealID,
      JSON.stringify(data.DefaultTime_ID),
      data.DurationID,
      data.Priority,
    ], (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.status(201).json({ id: result.insertId, ...data });
    });
  });
  
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
