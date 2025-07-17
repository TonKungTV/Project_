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

// app.get('/api/medications', (req, res) => {
//   db.query('SELECT * FROM medication', (err, results) => {
//     if (err) return res.status(500).json({ error: err });
//     res.json(results.map(row => ({
//       ...row,
//       //meals: JSON.parse(row.meals), // แปลงจาก JSON string กลับเป็น array
//     })));
//   });
// });

app.get('/api/usagemeal', (req, res) => {
  db.query('SELECT * FROM usagemeal', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results.map(row => ({
      ...row
    })));
  });
});
app.get('/api/users', (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results.map(row => ({
      ...row
    })));
  });
});

app.post('/api/medications', (req, res) => {
  const data = req.body;
  const {
    Name, Note, GroupID, TypeID, Dosage,
    UnitID, UsageMealID, DurationID, Priority, DefaultTime_IDs // <-- array
  } = data;

  const insertMain = `
    INSERT INTO medication
    (name, note, groupid, typeid, dosage, unitid, usagemealid, durationid, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(insertMain, [
    Name, Note, GroupID, TypeID, Dosage,
    UnitID, UsageMealID, DurationID, Priority
  ], (err, result) => {
    if (err) return res.status(500).json({ error: err });

    const medId = result.insertId;

    // insert multiple DefaultTime_IDs
    const insertDefaults = DefaultTime_IDs.map(dtId => [medId, dtId]);

    db.query(
      'INSERT INTO medication_defaulttime (medicationid, defaulttime_id) VALUES ?',
      [insertDefaults],
      (err2) => {
        if (err2) return res.status(500).json({ error: err2 });
        res.status(201).json({ id: medId });
      }
    );
  });
});



app.get('/api/medications', (req, res) => {
  const sql = `
    SELECT 
      m.*,
      dg.GroupName 
    FROM 
      medication m
    LEFT JOIN 
      diseasegroup dg 
    ON 
      m.GroupID = dg.GroupID
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

app.get('/api/userdefaultmealtime', (req, res) => {
  db.query('SELECT * FROM userdefaultmealtime', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});


// 🚀 รัน server
app.listen(3000, () => {
  console.log('🌐 Server is running on port 3000');
});
