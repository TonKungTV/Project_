const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3000;
const JWT_SECRET = 'your_jwt_secret_key_here';
const plainPassword = 'mypassword123';
const saltRounds = 10;

bcrypt.hash(plainPassword, saltRounds, (err, hash) => {
  if (err) throw err;
  console.log('Hashed password:', hash);
});

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

// POST /api/register
app.post('/api/register', async (req, res) => {
  const {
    name,
    email,
    phone,
    gender,
    birthDate,
    bloodType,
    password
  } = req.body;

  // ตรวจสอบข้อมูล
  if (!name || !email || !phone || !gender || !birthDate || !bloodType || !password) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  try {
    // เช็คว่า email ซ้ำมั้ย
    const checkSql = 'SELECT * FROM users WHERE Email = ?';
    db.query(checkSql, [email], async (err, results) => {
      if (err) return res.status(500).json({ error: err });

      if (results.length > 0) {
        return res.status(400).json({ error: 'อีเมลนี้ถูกใช้แล้ว' });
      }

      // เข้ารหัสรหัสผ่าน
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // บันทึกผู้ใช้
      const insertSql = `
        INSERT INTO users (Name, Email, Phone, Gender, BirthDate, BloodType, Password)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      db.query(insertSql, [name, email, phone, gender, birthDate, bloodType, hashedPassword], (err2, result) => {
        if (err2) return res.status(500).json({ error: err2 });

        res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ', userId: result.insertId });
      });
    });
  } catch (err) {
    console.error('❌ Register error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ✅ LOGIN
app.post('/api/login', (req, res) => {
  const { Email, Password } = req.body;

  if (!Email || !Password) {
    return res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' });
  }

  const sql = 'SELECT * FROM users WHERE Email = ?';
  db.query(sql, [Email], async (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length === 0) {
      return res.status(401).json({ error: 'ไม่พบบัญชีผู้ใช้' });
    }

    const user = results[0];

    const isMatch = await bcrypt.compare(Password, user.Password);
    if (!isMatch) {
      return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
    }

    // 3. สร้าง token
    const token = jwt.sign({ userId: user.UserID }, JWT_SECRET, { expiresIn: '1h' });

    res.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: {
        id: user.UserID,
        name: user.Name,
        email: user.Email
      }
    });
  });
});

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
  console.log('📦 /api/medications payload:', data);

  let {
    UserID, Name, Note, GroupID, TypeID, Dosage,
    UnitID, UsageMealID, PrePostTime, Priority,
    StartDate, EndDate,
    DefaultTime_ID_1, DefaultTime_ID_2, DefaultTime_ID_3, DefaultTime_ID_4
  } = data;

  const userIdNum = parseInt(UserID, 10);
  if (!userIdNum) return res.status(400).json({ error: { message: 'UserID is required' } });

  GroupID  = parseInt(GroupID, 10);
  TypeID   = parseInt(TypeID, 10);
  UnitID   = UnitID ? parseInt(UnitID, 10) : null;
  Dosage   = Dosage ? parseInt(Dosage, 10) : null;
  Priority = Priority ? parseInt(Priority, 10) : 1;
  UsageMealID = (UsageMealID === undefined || UsageMealID === null) ? null : parseInt(UsageMealID, 10);

  const defaultTimeIds = [DefaultTime_ID_1, DefaultTime_ID_2, DefaultTime_ID_3, DefaultTime_ID_4]
    .map(v => (v ? parseInt(v, 10) : null))
    .filter(Boolean);

  const sendDbError = (label, err) => {
    console.error(`❌ ${label}:`, err);
    return res.status(500).json({
      error: {
        code: err?.code,
        errno: err?.errno,
        sqlState: err?.sqlState,
        sqlMessage: err?.sqlMessage || String(err),
        where: label
      }
    });
  };

  // helper: หา/สร้าง TimeID จากจำนวนนาที
  const getOrCreateTimeID = (minutes, cb) => {
    if (minutes === null || minutes === undefined) return cb(null, null);
    const mm = String(parseInt(minutes, 10)).padStart(2, '0');
    const timeStr = `00:${mm}:00`; // '00:15:00'

    db.query('SELECT TimeID FROM usagemealtime WHERE Time = ?', [timeStr], (err, rows) => {
      if (err) return cb(err);
      if (rows.length > 0) return cb(null, rows[0].TimeID);
      db.query('INSERT INTO usagemealtime (Time) VALUES (?)', [timeStr], (err2, result2) => {
        if (err2) return cb(err2);
        cb(null, result2.insertId);
      });
    });
  };

  const proceedInsert = (timeIDFinal) => {
    const insertMain = `
      INSERT INTO medication
      (userid, name, note, groupid, typeid, dosage, unitid, usagemealid, timeid, priority, startdate, enddate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(
      insertMain,
      [userIdNum, Name, Note || null, GroupID, TypeID, Dosage, UnitID, UsageMealID, timeIDFinal, Priority, StartDate, EndDate],
      (err, result) => {
        if (err) return sendDbError('INSERT medication', err);

        const medId = result.insertId;
        if (defaultTimeIds.length === 0) return res.status(201).json({ id: medId });

        const values = defaultTimeIds.map(dt => [medId, dt]);
        db.query(
          'INSERT INTO medication_defaulttime (medicationid, defaulttime_id) VALUES ?',
          [values],
          (err2) => {
            if (err2) return sendDbError('INSERT medication_defaulttime', err2);
            res.status(201).json({ id: medId });
          }
        );
      }
    );
  };

  // ถ้าเป็นก่อน/หลังอาหารและมีนาที → หา/สร้าง TimeID
  if ((UsageMealID === 2 || UsageMealID === 3) && PrePostTime != null) {
    const mins = parseInt(PrePostTime, 10);
    if (Number.isNaN(mins)) {
      return res.status(400).json({ error: { message: 'PrePostTime must be number of minutes' } });
    }
    getOrCreateTimeID(mins, (err, timeId) => {
      if (err) return sendDbError('getOrCreateTimeID', err);
      proceedInsert(timeId);
    });
  } else {
    // พร้อมอาหาร (1) หรือไม่ระบุนาที → timeid = NULL
    proceedInsert(null);
  }
});






app.get('/api/medications', (req, res) => {
  const userId = req.query.userId; // หรือจะใช้ req.params หรือ req.body ก็ได้ตาม context

  const sql = `
    SELECT
      m.*,
      dg.GroupName,
      mt.TypeName,
      du.DosageType,
      um.MealName AS UsageMealName,
      p.PriorityName
    FROM
      medication m
    LEFT JOIN diseasegroup dg ON m.GroupID = dg.GroupID
    LEFT JOIN medicationtype mt ON m.TypeID = mt.TypeID
    LEFT JOIN dosageunit du ON m.UnitID = du.UnitID
    LEFT JOIN usagemeal um ON m.UsageMealID = um.UsageMealID
    LEFT JOIN priority p ON m.Priority = p.PriorityID
    WHERE m.UserID = ?
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});


app.get('/api/medications/:id/times', (req, res) => {
  const medicationId = req.params.id;

  const sql = `
    SELECT
      udt.DefaultTime_ID,
      ms.MealName,
      udt.Time
    FROM
      medication_defaulttime mdt
    JOIN userdefaultmealtime udt ON mdt.defaulttime_id = udt.DefaultTime_ID
    JOIN mealschedule ms ON udt.MealID = ms.MealID
    WHERE
      mdt.medicationid = ?
    ORDER BY udt.Time
  `;

  db.query(sql, [medicationId], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results); // ✅ [{ MealName: 'เช้า', Time: '09:00:00' }, ...]
  });
});


app.get('/api/medications/:id', (req, res) => {
  const id = req.params.id;
  console.log('📥 MedicationID received:', id);

  const sql = `
  SELECT 
    m.*,
    dg.GroupName,
    mt.TypeName,
    du.DosageType,
    um.MealName AS UsageMealName,
    ut.time AS UsageMealTimeOffset,
    p.PriorityName,
    m.StartDate,
    m.EndDate
  FROM medication m
  LEFT JOIN diseasegroup dg ON m.GroupID = dg.GroupID
  LEFT JOIN medicationtype mt ON m.TypeID = mt.TypeID
  LEFT JOIN dosageunit du ON m.UnitID = du.UnitID
  LEFT JOIN usagemeal um ON m.UsageMealID = um.UsageMealID
  LEFT JOIN usagemealtime ut ON m.TimeID = ut.TimeID
  LEFT JOIN priority p ON m.Priority = p.PriorityID
  WHERE m.MedicationID = ?
`;



  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('❌ Error fetching medication:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    console.log('✅ Medication result:', result[0]);
    res.json(result[0]); // ส่งข้อมูลแค่ตัวเดียว
  });
});



app.get('/api/userdefaultmealtime', (req, res) => {
  db.query('SELECT * FROM userdefaultmealtime', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// ดึงรายการก่อน/หลัง/พร้อมอาหาร
app.get('/api/meals', (req, res) => {
  db.query('SELECT DISTINCT MealName FROM usagemeal', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// ดึงช่วงเวลา เช่น 15 นาที, 30 นาที
app.get('/api/mealtimes', (req, res) => {
  db.query('SELECT * FROM usagemealtime', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

function getOrCreateUsageMealID(MealName, TimeID, callback) {
  const checkSql = 'SELECT UsageMealID FROM usagemeal WHERE MealName = ? AND TimeID = ?';
  db.query(checkSql, [MealName, TimeID], (err, results) => {
    if (err) return callback(err);

    if (results.length > 0) {
      return callback(null, results[0].UsageMealID); // ใช้ตัวที่เจอ
    } else {
      const insertSql = 'INSERT INTO usagemeal (MealName, TimeID) VALUES (?, ?)';
      db.query(insertSql, [MealName, TimeID], (err2, result2) => {
        if (err2) return callback(err2);
        return callback(null, result2.insertId); // ใช้ตัวใหม่
      });
    }
  });
}


// GET /api/reminders/today?userId=1
app.get('/api/reminders/today', (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ error: 'missing userId query param' });
  }

  const sql = `
    SELECT
      m.MedicationID,
      m.Name AS name,
      ms.MealName,
      udt.Time,
      p.PriorityName,
      CASE WHEN p.PriorityID = 2 THEN 'สูง' ELSE 'ปกติ' END AS PriorityLabel,
      s.ScheduleID,
      s.Status,
      mt.TypeName,
      m.Dosage,
      du.DosageType
    FROM medication m
    JOIN medication_defaulttime mdt
      ON m.MedicationID = mdt.medicationid
    JOIN userdefaultmealtime udt
      ON mdt.defaulttime_id = udt.DefaultTime_ID
    JOIN mealschedule ms
      ON udt.MealID = ms.MealID
    LEFT JOIN priority p
      ON m.Priority = p.PriorityID
    LEFT JOIN medicationschedule s
      ON s.MedicationID = m.MedicationID
     AND s.DefaultTime_ID = udt.DefaultTime_ID
     AND s.Date = CURDATE()
    LEFT JOIN medicationtype mt ON m.TypeID = mt.TypeID
    LEFT JOIN dosageunit du ON m.UnitID = du.UnitID
    WHERE
      m.UserID = ?
      AND CURDATE() BETWEEN m.StartDate AND m.EndDate
    ORDER BY udt.Time
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.error('❌ Error fetching today reminders:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!rows || rows.length === 0) return res.json([]);

    const toInsert = rows
      .filter(r => !r.ScheduleID)
      .map(r => [r.MedicationID, r.MealName, r.Time]);

    const finish = () => {
      db.query(sql, [userId], (err2, refreshed) => {
        if (err2) {
          console.error('❌ Error refetching reminders:', err2);
          return res.status(500).json({ error: 'Database error' });
        }
        res.json(refreshed);
      });
    };

    if (toInsert.length === 0) return finish();

    const insertSql = `
      INSERT INTO medicationschedule (MedicationID, DefaultTime_ID, Date, Time, Status)
      SELECT
        t.MedicationID,
        udt.DefaultTime_ID,
        CURDATE(),
        udt.Time,
        'ยังไม่กิน'
      FROM (
        SELECT ? AS MedicationID, ? AS MealName, ? AS Time
      ) AS t
      JOIN mealschedule ms ON ms.MealName = t.MealName
      JOIN userdefaultmealtime udt ON udt.MealID = ms.MealID AND udt.Time = t.Time
      WHERE NOT EXISTS (
        SELECT 1
        FROM medicationschedule s
        WHERE s.MedicationID = t.MedicationID
          AND s.DefaultTime_ID = udt.DefaultTime_ID
          AND s.Date = CURDATE()
      )
    `;

    let i = 0;
    const runNext = () => {
      if (i >= toInsert.length) return finish();
      db.query(insertSql, toInsert[i], (err3) => {
        if (err3) console.error('❌ Error inserting schedule:', err3);
        i += 1;
        runNext();
      });
    };
    runNext();
  });
});



// PATCH /api/schedule/:id/status  { status: 'กินแล้ว' | 'ยังไม่กิน' }
app.patch('/api/schedule/:id/status', (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'missing status' });

  db.query(
    'UPDATE medicationschedule SET Status = ? WHERE ScheduleID = ?',
    [status, id],
    (err, result) => {
      if (err) {
        console.error('❌ Error updating status:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ ok: true });
    }
  );
});



// 🚀 รัน server
app.listen(3000, () => {
  console.log('🌐 Server is running on port 3000');
});
