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
    StartDate, EndDate, Frequency,
    DefaultTime_ID_1, DefaultTime_ID_2, DefaultTime_ID_3, DefaultTime_ID_4
  } = data;

  const userIdNum = parseInt(UserID, 10);
  if (!userIdNum) return res.status(400).json({ error: { message: 'UserID is required' } });

  // กำหนดค่า FrequencyID จาก frequencyOptions
  const frequencyOptions = [
    { label: 'ทุกวัน', value: 'every_day', id: 1 },
    { label: 'ทุก X วัน', value: 'every_X_days', id: 2 },
    { label: 'ทุก X ชั่วโมง', value: 'every_X_hours', id: 3 },
    { label: 'ทุกๆ X นาที', value: 'every_X_minutes', id: 4 },
    { label: 'วันที่เจาะจงของสัปดาห์', value: 'weekly', id: 5 },
    { label: 'วันที่เจาะจงของเดือน', value: 'monthly', id: 6 },
    { label: 'X วันใช้ X วันหยุดพัก', value: 'cycle', id: 7 },
    { label: 'กินเมื่อมีอาการ', value: 'on_demand', id: 8 }
  ];

  const selectedFrequency = frequencyOptions.find(option => option.value === Frequency);
  const FrequencyID = selectedFrequency ? selectedFrequency.id : null;

  if (!FrequencyID) {
    console.error('❌ FrequencyID is not defined');
    return res.status(400).json({ error: { message: 'Frequency is invalid' } });
  }

  // กำหนดค่าอื่นๆ เช่น GroupID, TypeID, UnitID, Dosage และ Priority
  GroupID = parseInt(GroupID, 10);
  TypeID = parseInt(TypeID, 10);
  UnitID = UnitID ? parseInt(UnitID, 10) : null;
  Dosage = Dosage ? parseInt(Dosage, 10) : null;
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
      (userid, name, note, groupid, typeid, dosage, unitid, usagemealid, timeid, priority, startdate, enddate, frequencyid)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(
      insertMain,
      [userIdNum, Name, Note || null, GroupID, TypeID, Dosage, UnitID, UsageMealID, timeIDFinal, Priority, StartDate, EndDate, FrequencyID],
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
    proceedInsert(null);
  }
});



// Assuming you have express app and MySQL setup already
app.delete('/api/medications/:id', (req, res) => {
  const medicationId = req.params.id;

  // ลบข้อมูลในตาราง medicationschedule ที่อ้างอิงถึง medicationid
  const deleteScheduleQuery = 'DELETE FROM medicationschedule WHERE MedicationID = ?';
  db.query(deleteScheduleQuery, [medicationId], (err) => {
    if (err) {
      console.error('Error deleting medication schedule:', err);
      return res.status(500).json({ error: 'Failed to delete medication schedule' });
    }

    // ลบข้อมูลในตาราง medication หลังจากลบข้อมูลที่อ้างอิงใน medicationschedule แล้ว
    const deleteMedicationQuery = 'DELETE FROM medication WHERE MedicationID = ?';
    db.query(deleteMedicationQuery, [medicationId], (err) => {
      if (err) {
        console.error('Error deleting medication:', err);
        return res.status(500).json({ error: 'Failed to delete medication' });
      }
      res.status(200).json({ message: 'Medication deleted successfully' });
    });
  });
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
      p.PriorityName,
      f.FrequencyName,
      f.FrequencyValue,
  f.CustomValue,
  f.WeekDays,
  f.MonthDays,
  f.Cycle_Use_Days,
  f.Cycle_Rest_Days,
  f.on_demand
    FROM
      medication m
    LEFT JOIN diseasegroup dg ON m.GroupID = dg.GroupID
    LEFT JOIN medicationtype mt ON m.TypeID = mt.TypeID
    LEFT JOIN dosageunit du ON m.UnitID = du.UnitID
    LEFT JOIN usagemeal um ON m.UsageMealID = um.UsageMealID
    LEFT JOIN priority p ON m.Priority = p.PriorityID
    LEFT JOIN frequency f ON m.FrequencyID = f.FrequencyID
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
    m.EndDate,
    f.FrequencyName,
    f.FrequencyValue,
  f.CustomValue,
  f.WeekDays,
  f.MonthDays,
  f.Cycle_Use_Days,
  f.Cycle_Rest_Days,
  f.on_demand
  FROM medication m
  LEFT JOIN diseasegroup dg ON m.GroupID = dg.GroupID
  LEFT JOIN medicationtype mt ON m.TypeID = mt.TypeID
  LEFT JOIN dosageunit du ON m.UnitID = du.UnitID
  LEFT JOIN usagemeal um ON m.UsageMealID = um.UsageMealID
  LEFT JOIN usagemealtime ut ON m.TimeID = ut.TimeID
  LEFT JOIN priority p ON m.Priority = p.PriorityID
  LEFT JOIN frequency f ON m.FrequencyID = f.FrequencyID
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

// API ดึงข้อมูล GroupID (กลุ่มโรค)
app.get('/api/groups', (req, res) => {
  const sql = 'SELECT * FROM diseasegroup';  // ดึงข้อมูลจากตาราง diseasegroup
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching groups:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);  // ส่งข้อมูลกลับไปที่ Frontend
  });
});

// API ดึงข้อมูล UnitID (หน่วยยา)
app.get('/api/units', (req, res) => {
  const sql = 'SELECT * FROM dosageunit';  // ดึงข้อมูลจากตาราง dosageunit
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching units:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);  // ส่งข้อมูลกลับไปที่ Frontend
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
      du.DosageType,
      f.FrequencyName,  -- เพิ่มความถี่จาก medication
      m.StartDate,
      m.EndDate,
      m.FrequencyID
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
    LEFT JOIN frequency f ON m.FrequencyID = f.FrequencyID
    WHERE
      m.UserID = ?
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.error('❌ Error fetching today reminders:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!rows || rows.length === 0) return res.json([]);

    const toInsert = rows
      .filter(r => !r.ScheduleID)
      .map(r => ({
        MedicationID: r.MedicationID,
        MealName: r.MealName,
        Time: r.Time,
        Frequency: r.FrequencyName,
        StartDate: r.StartDate,
        EndDate: r.EndDate,
        customFrequencyTime: r.FrequencyName === 'every_X_days' ? 7 : null,  // ตัวอย่างการใช้งาน customFrequencyTime
      }));

    const finish = () => {
      db.query(sql, [userId], (err2, refreshed) => {
        if (err2) {
          console.error('❌ Error refetching reminders:', err2);
          return res.status(500).json({ error: 'Database error' });
        }
        res.json(refreshed);
      });
    };

    // ฟังก์ชันคำนวณตารางยา
const calculateMedicationSchedule = (frequency, startDate, endDate, customFrequencyTime) => {
  let dates = [];
  let currentDate = new Date(startDate);
  let endDateObj = new Date(endDate);

  switch (frequency) {
    case 'every_day':
      while (currentDate <= endDateObj) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      break;
    case 'every_X_days':
      const everyXDays = parseInt(customFrequencyTime, 10);
      if (isNaN(everyXDays)) return []; // ป้องกันการกรอกข้อมูลที่ไม่ใช่ตัวเลข
      while (currentDate <= endDateObj) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + everyXDays);
      }
      break;
    case 'weekly':
      const weekDays = selectedWeekDays.length > 0 ? selectedWeekDays : [1, 2, 3, 4, 5, 6, 7]; // ใช้วันที่เลือกในสัปดาห์
      while (currentDate <= endDateObj) {
        if (weekDays.includes(currentDate.getDay())) {
          dates.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      break;
    case 'monthly':
      const dayOfMonth = parseInt(customFrequencyTime, 10);
      if (isNaN(dayOfMonth)) return []; // ป้องกันการกรอกข้อมูลที่ไม่ใช่ตัวเลข
      while (currentDate <= endDateObj) {
        if (currentDate.getDate() === dayOfMonth) {
          dates.push(new Date(currentDate));
        }
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      break;
    case 'cycle':
      const cycleDays = parseInt(customFrequencyTime.split('/')[0], 10); // วันใช้ยา
      const offDays = parseInt(customFrequencyTime.split('/')[1], 10); // วันหยุดพัก
      let isResting = false;
      while (currentDate <= endDateObj) {
        if (!isResting) {
          dates.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + cycleDays);
          isResting = true;
        } else {
          currentDate.setDate(currentDate.getDate() + offDays);
          isResting = false;
        }
      }
      break;
    case 'on_demand':
      break;
    default:
      break;
  }
  return dates;
};

    // เรียกฟังก์ชันการคำนวณวันที่ทานยาและเพิ่มลงใน medicationschedule
    toInsert.forEach((medication) => {
      const { Frequency, StartDate, EndDate, customFrequencyTime } = medication;
      const medicationSchedule = calculateMedicationSchedule(Frequency, StartDate, EndDate, customFrequencyTime);

      console.log('Calculated Medication Schedule:', medicationSchedule); // Log the schedule
      console.log('MedicationID', medication);
      medicationSchedule.forEach(date => {
        const insertSql = `
      INSERT INTO medicationschedule (MedicationID, DefaultTime_ID, Date, Time, Status)
      SELECT
        ?, udt.DefaultTime_ID, ?, udt.Time, 'ยังไม่กิน'
      FROM userdefaultmealtime udt
      WHERE udt.DefaultTime_ID IN (?)
      AND NOT EXISTS (
        SELECT 1
        FROM medicationschedule s
        WHERE s.MedicationID = ?
          AND s.DefaultTime_ID = udt.DefaultTime_ID
          AND s.Date = ?
      )
    `;

        db.query(insertSql, [medication.MedicationID, date.toISOString().split('T')[0], medication.selectedTimeIds, medication.MedicationID, date.toISOString().split('T')[0]], (err3) => {
          if (err3) {
            console.error('❌ Error inserting schedule:', err3);
          } else {
            console.log(`Schedule inserted: MedicationID ${medication.MedicationID}, Date ${date}`);
          }
        });
      });
    });


    finish();
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

app.get('/api/user/:id', (req, res) => {
  const userId = req.params.id;

  db.query(
    'SELECT UserID, Name, Email, Phone, Gender, BirthDate, BloodType FROM users WHERE UserID = ?',
    [userId],
    (err, result) => {
      if (err) {
        console.error('❌ Error retrieving profile:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (result.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(result[0]);
    }
  );
});

app.patch('/api/user/:id', (req, res) => {
  const userId = req.params.id;
  const { name, email, phone, gender, birthdate, bloodType } = req.body;

  if (!name || !email || !phone || !gender || !birthdate || !bloodType) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  db.query(
    'UPDATE users SET Name = ?, Email = ?, Phone = ?, Gender = ?, BirthDate = ?, BloodType = ? WHERE UserID = ?',
    [name, email, phone, gender, birthdate, bloodType, userId],
    (err, result) => {
      if (err) {
        console.error(' Error updating profile:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ ok: true });
    }
  );
});

// Get meal times
app.get('/api/meal-times/:id', (req, res) => {
  // ตรวจสอบว่า req.user.id มีค่าหรือไม่
  const userId = req.params.id;
  
  if (!userId) {
    return res.status(400).json({ error: 'User not authenticated or missing user ID' });
  }

  const query = 'SELECT * FROM userdefaultmealtime WHERE UserID = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Database query error:', err);  // Log ข้อผิดพลาดจากฐานข้อมูล
      return res.status(500).json({ error: 'Failed to fetch meal times' });
    }
    
    // ตรวจสอบว่าได้รับข้อมูลจากฐานข้อมูลหรือไม่
    if (results.length === 0) {
      return res.status(404).json({ error: 'No meal times found for this user' });
    }

    // แปลงข้อมูลจากฐานข้อมูลให้เป็นแบบที่ frontend ต้องการ
    const mealTimes = results.reduce((acc, curr) => {
      acc[curr.MealID] = curr.Time;
      return acc;
    }, {});
    
    // ส่งข้อมูลกลับไปยัง frontend
    res.json(mealTimes);
  });
});

// Update meal times
app.patch('/api/meal-times', (req, res) => {
  const { breakfast, lunch, dinner, snack } = req.body;
  const userId = req.params.id;  // ตรวจสอบ user ID

  if (!userId) {
    return res.status(400).json({ error: 'User not authenticated or missing user ID' });
  }

  const updates = [
    { MealID: 1, Time: breakfast },
    { MealID: 2, Time: lunch },
    { MealID: 3, Time: dinner },
    { MealID: 4, Time: snack }
  ];

  updates.forEach(({ MealID, Time }) => {
    const query = 'UPDATE userdefaultmealtime SET Time = ? WHERE UserID = ? AND MealID = ?';
    db.query(query, [Time, userId, MealID], (err) => {
      if (err) {
        console.error(`Failed to update meal time for MealID ${MealID}:`, err);  // Log ข้อผิดพลาดในการอัพเดท
        return res.status(500).json({ error: `Failed to update meal time for meal ${MealID}` });
      }
    });
  });

  res.status(200).json({ message: 'Meal times updated successfully' });
});

// 🚀 รัน server
app.listen(3000, () => {
  console.log('🌐 Server is running on port 3000');
});
