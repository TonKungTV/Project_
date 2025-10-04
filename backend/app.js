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
    // เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // บันทึกข้อมูลผู้ใช้ใน database
    const sql = `
      INSERT INTO users (Name, Email, Phone, Gender, BirthDate, BloodType, Password, CreatedAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    db.query(
      sql,
      [name, email, phone, gender, birthDate, bloodType, hashedPassword],
      (err, result) => {
        if (err) {
          console.error('❌ Database error:', err);
          
          // ตรวจสอบ duplicate email
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' });
          }
          
          return res.status(500).json({ error: 'ไม่สามารถสมัครสมาชิกได้' });
        }

        const newUserId = result.insertId;
        console.log('✅ User registered successfully:', newUserId);

        // ✅ สร้าง Default Meal Times สำหรับ user ใหม่
        const defaultMealTimes = [
          { MealID: 1, Time: '08:00:00', MealName: 'เช้า' },      // เช้า
          { MealID: 2, Time: '12:00:00', MealName: 'เที่ยง' },   // เที่ยง
          { MealID: 3, Time: '18:00:00', MealName: 'เย็น' },     // เย็น
          { MealID: 4, Time: '21:00:00', MealName: 'ก่อนนอน' }  // ก่อนนอน
        ];

        const mealTimePromises = defaultMealTimes.map(({ MealID, Time }) => {
          return new Promise((resolve, reject) => {
            const insertMealTimeSql = `
              INSERT INTO userdefaultmealtime (UserID, MealID, Time) 
              VALUES (?, ?, ?)
            `;
            
            db.query(insertMealTimeSql, [newUserId, MealID, Time], (err, result) => {
              if (err) {
                console.error(`❌ Failed to create meal time for MealID ${MealID}:`, err);
                reject(err);
              } else {
                console.log(`✅ Created default meal time: MealID ${MealID} at ${Time}`);
                resolve(result);
              }
            });
          });
        });

        // รอให้สร้าง meal times ทั้งหมดเสร็จ
        Promise.all(mealTimePromises)
          .then(() => {
            console.log('✅ All default meal times created successfully for user:', newUserId);
            
            res.status(201).json({
              success: true,
              message: 'สมัครสมาชิกสำเร็จ',
              userId: newUserId,
              user: {
                id: newUserId,
                name,
                email,
                phone,
                gender,
                birthDate,
                bloodType
              }
            });
          })
          .catch(mealTimeErr => {
            console.error('❌ Error creating default meal times:', mealTimeErr);
            
            // ถ้าสร้าง meal times ไม่สำเร็จ ให้ลบ user ที่สร้างไปแล้ว
            db.query('DELETE FROM users WHERE UserID = ?', [newUserId], (deleteErr) => {
              if (deleteErr) {
                console.error('❌ Failed to rollback user creation:', deleteErr);
              }
            });
            
            res.status(500).json({ 
              error: 'สมัครสมาชิกสำเร็จ แต่ไม่สามารถสร้างเวลาอาหารเริ่มต้นได้' 
            });
          });
      }
    );
  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' });
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

// /api/medications
app.post('/api/medications', (req, res) => {
  const data = req.body;
  console.log('📦 /api/medications payload:', data);

  let {
    UserID, Name, Note, GroupID, TypeID, Dosage,
    UnitID, UsageMealID, PrePostTime, Priority,
    StartDate, EndDate, Frequency,
    DefaultTime_ID_1, DefaultTime_ID_2, DefaultTime_ID_3, DefaultTime_ID_4,
    CustomValue, WeekDays, MonthDays, Cycle_Use_Days, Cycle_Rest_Days, OnDemand
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

  // parse numeric fields
  GroupID = GroupID ? parseInt(GroupID, 10) : null;
  TypeID = TypeID ? parseInt(TypeID, 10) : null;
  UnitID = UnitID ? parseInt(UnitID, 10) : null;
  Dosage = Dosage ? parseInt(Dosage, 10) : null;
  Priority = Priority ? parseInt(Priority, 10) : 1;
  UsageMealID = (UsageMealID === undefined || UsageMealID === null) ? null : parseInt(UsageMealID, 10);

  const defaultTimeIds = [DefaultTime_ID_1, DefaultTime_ID_2, DefaultTime_ID_3, DefaultTime_ID_4]
    .map(v => (v ? parseInt(v, 10) : null))
    .filter(Boolean);

  // normalize frequency detail fields for DB
  const WeekDaysJSON = Array.isArray(WeekDays) ? JSON.stringify(WeekDays) : (typeof WeekDays === 'string' ? WeekDays : null);
  const MonthDaysJSON = Array.isArray(MonthDays) ? JSON.stringify(MonthDays) : (typeof MonthDays === 'string' ? MonthDays : null);
  const CustomValueStr = (CustomValue === undefined || CustomValue === null) ? null : String(CustomValue);
  const CycleUseDaysNum = Cycle_Use_Days ? parseInt(Cycle_Use_Days, 10) : null;
  const CycleRestDaysNum = Cycle_Rest_Days ? parseInt(Cycle_Rest_Days, 10) : null;
  const OnDemandFlag = OnDemand ? 1 : 0;

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
    const timeStr = `00:${mm}:00`;

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
      (userid, name, note, groupid, typeid, dosage, unitid, usagemealid, timeid, priority, startdate, enddate, frequencyid,
       FrequencyValue, CustomValue, WeekDays, MonthDays, Cycle_Use_Days, Cycle_Rest_Days, OnDemand)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      userIdNum,
      Name,
      Note || null,
      GroupID,
      TypeID,
      Dosage,
      UnitID,
      UsageMealID,
      timeIDFinal,
      Priority,
      StartDate || null,
      EndDate || null,
      FrequencyID,
      Frequency || null,
      CustomValueStr,
      WeekDaysJSON,
      MonthDaysJSON,
      CycleUseDaysNum,
      CycleRestDaysNum,
      OnDemandFlag
    ];

    console.log('📥 Inserting medication with params:', {
      params,
      WeekDaysJSON,
      MonthDaysJSON,
      CustomValueStr,
      CycleUseDaysNum,
      CycleRestDaysNum,
      OnDemandFlag
    });

    db.query(insertMain, params, (err, result) => {
      if (err) {
        console.error('❌ INSERT medication error:', err);
        return sendDbError('INSERT medication', err);
      }

      const medId = result.insertId;
      
      // ✅ บันทึก log เริ่มต้นสำหรับยาใหม่
      const today = new Date().toISOString().split('T')[0];
      db.query(
        `INSERT INTO medicationlog 
         (MedicationID, ScheduleID, \`Count\`, TakenCount, SkippedCount, PerCount, date, Status, SideEffects)
         VALUES (?, NULL, 0, 0, 0, 0, ?, 'รอกิน', NULL)
         ON DUPLICATE KEY UPDATE \`Count\` = \`Count\``,
        [medId, today],
        (logErr) => {
          if (logErr) console.warn('⚠️ Failed to create initial log:', logErr);
        }
      );

      db.query('SELECT * FROM medication WHERE MedicationID = ?', [medId], (selErr, rows) => {
        if (selErr) {
          console.error('❌ SELECT inserted medication error:', selErr);
        } else {
          console.log('✅ Inserted medication row:', rows[0]);
        }

        if (defaultTimeIds.length === 0) {
          return res.status(201).json({ 
            id: medId, 
            medicationId: medId, // ✅ ส่ง medicationId กลับไปด้วย
            medication: rows ? rows[0] : null 
          });
        }

        const values = defaultTimeIds.map(dt => [medId, dt]);
        db.query(
          'INSERT INTO medication_defaulttime (medicationid, defaulttime_id) VALUES ?',
          [values],
          (err2) => {
            if (err2) return sendDbError('INSERT medication_defaulttime', err2);
            res.status(201).json({ 
              id: medId, 
              medicationId: medId, // ✅ ส่ง medicationId กลับไปด้วย
              medication: rows ? rows[0] : null 
            });
          }
        );
      });
    });
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
  const userId = req.query.userId;

  const sql = `
    SELECT
      m.*,
      m.IsActive,
      dg.GroupName,
      mt.TypeName,
      du.DosageType,
      um.MealName AS UsageMealName,
      p.PriorityName,
      -- อ่านรายละเอียดความถี่จากตาราง medication (per-medication)
      m.FrequencyValue AS FrequencyValue,
      m.CustomValue AS CustomValue,
      m.WeekDays AS WeekDays,
      m.MonthDays AS MonthDays,
      m.Cycle_Use_Days AS Cycle_Use_Days,
      m.Cycle_Rest_Days AS Cycle_Rest_Days,
      m.OnDemand AS OnDemand,
      f.FrequencyName
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

    // parse JSON fields stored as TEXT
    const normalized = results.map(r => {
      let weekDays = null;
      let monthDays = null;
      try {
        weekDays = r.WeekDays ? JSON.parse(r.WeekDays) : null;
      } catch (e) { weekDays = null; }
      try {
        monthDays = r.MonthDays ? JSON.parse(r.MonthDays) : null;
      } catch (e) { monthDays = null; }

      return {
        ...r,
        IsActive: r.IsActive === 1,
        WeekDays: weekDays,
        MonthDays: monthDays,
        CustomValue: r.CustomValue === null ? null : r.CustomValue,
        OnDemand: r.OnDemand === 1
      };
    });

    res.json(normalized);
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
    -- อ่านรายละเอียดความถี่จากตาราง medication
    m.FrequencyValue AS FrequencyValue,
    m.CustomValue AS CustomValue,
    m.WeekDays AS WeekDays,
    m.MonthDays AS MonthDays,
    m.Cycle_Use_Days AS Cycle_Use_Days,
    m.Cycle_Rest_Days AS Cycle_Rest_Days,
    m.OnDemand AS OnDemand
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

    const row = result[0];
    // parse stored JSON fields
    let weekDays = null, monthDays = null;
    try { weekDays = row.WeekDays ? JSON.parse(row.WeekDays) : null; } catch (e) { weekDays = null; }
    try { monthDays = row.MonthDays ? JSON.parse(row.MonthDays) : null; } catch (e) { monthDays = null; }
    row.WeekDays = weekDays;
    row.MonthDays = monthDays;
    row.OnDemand = row.OnDemand === 1;

    console.log('✅ Medication result:', row);
    res.json(row);
  });
});

// API ดึงข้อมูล GroupID (กลุ่มโรค)
app.get('/api/groups', (req, res) => {
  const userId = req.query.userId ? parseInt(req.query.userId, 10) : null;
  const sql = userId
    ? 'SELECT * FROM `diseasegroup` WHERE `UserID` IS NULL OR `UserID` = ? ORDER BY `GroupName`'
    : 'SELECT * FROM `diseasegroup` ORDER BY `GroupName`';
  const params = userId ? [userId] : [];
  db.query(sql, params, (err, rows) => {
    if (err) {
      console.error('get groups error', err);
      return res.status(500).json([]);
    }
    res.json(rows || []);
  });
});

// API ดึงข้อมูล UnitID (หน่วยยา)
app.get('/api/units', (req, res) => {
  const userId = req.query.userId ? parseInt(req.query.userId, 10) : null;
  const sql = userId
    ? 'SELECT * FROM dosageunit WHERE UserID IS NULL OR UserID = ? ORDER BY DosageType'
    : 'SELECT * FROM dosageunit ORDER BY DosageType';
  const params = userId ? [userId] : [];
  db.query(sql, params, (err, rows) => {
    if (err) {
      console.error('get units error', err);
      return res.status(500).json([]);
    }
    res.json(rows || []);
  });
});

// API ดึงข้อมูล Type (ประเภทยา)
app.get('/api/types', (req, res) => {
  const userId = req.query.userId ? parseInt(req.query.userId, 10) : null;
  const sql = userId
    ? 'SELECT * FROM medicationtype WHERE UserID IS NULL OR UserID = ? ORDER BY TypeName'
    : 'SELECT * FROM medicationtype ORDER BY TypeName';
  const params = userId ? [userId] : [];
  db.query(sql, params, (err, rows) => {
    if (err) {
      console.error('get types error', err);
      return res.status(500).json([]);
    }
    res.json(rows || []);
  });
});

app.get('/api/userdefaultmealtime/:userId', (req, res) => {
  const userId = req.params.userId;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const query = `
    SELECT 
      udt.DefaultTime_ID,
      udt.UserID,
      udt.MealID,
      udt.Time,
      ms.MealName
    FROM userdefaultmealtime udt
    JOIN mealschedule ms ON udt.MealID = ms.MealID
    WHERE udt.UserID = ?
    ORDER BY udt.MealID
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('❌ Error fetching user meal times:', err);
      return res.status(500).json({ error: 'Failed to fetch meal times' });
    }

    if (results.length === 0) {
      console.log('⚠️ No meal times found for user:', userId);
      
      // สร้างค่าเริ่มต้นถ้ายังไม่มี
      const defaultTimes = [
        { MealID: 1, Time: '08:00:00' },
        { MealID: 2, Time: '12:00:00' },
        { MealID: 3, Time: '18:00:00' },
        { MealID: 4, Time: '21:00:00' }
      ];

      const insertPromises = defaultTimes.map(({ MealID, Time }) => {
        return new Promise((resolve, reject) => {
          db.query(
            'INSERT INTO userdefaultmealtime (UserID, MealID, Time) VALUES (?, ?, ?)',
            [userId, MealID, Time],
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          );
        });
      });

      Promise.all(insertPromises)
        .then(() => {
          db.query(query, [userId], (err2, results2) => {
            if (err2) return res.status(500).json({ error: 'Failed to fetch meal times' });
            res.json(results2);
          });
        })
        .catch(err => {
          console.error('❌ Error creating default meal times:', err);
          res.status(500).json({ error: 'Failed to create default meal times' });
        });

      return;
    }

    console.log(`✅ Fetched ${results.length} meal times for user ${userId}`);
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


app.get('/api/reminders/today', (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ error: 'missing userId query param' });
  }

    const dateParam = req.query.date && typeof req.query.date === 'string'
    ? req.query.date
    : new Date().toISOString().split('T')[0];

  const sql = `
    SELECT
      m.MedicationID,
      m.Name AS name,
      m.IsActive,
      ms.MealName,
      udt.Time,
      udt.DefaultTime_ID,
      p.PriorityName,
      CASE WHEN p.PriorityID = 2 THEN 'สูง' ELSE 'ปกติ' END AS PriorityLabel,
      s.ScheduleID,
      s.Status,
      mt.TypeName,
      m.Dosage,
      du.DosageType,
      m.FrequencyValue AS FrequencyValue,
      m.CustomValue AS CustomValue,
      m.WeekDays AS WeekDays,
      m.MonthDays AS MonthDays,
      m.Cycle_Use_Days AS Cycle_Use_Days,
      m.Cycle_Rest_Days AS Cycle_Rest_Days,
      m.OnDemand AS OnDemand,
      m.StartDate,
      m.EndDate
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
     AND s.Date = ?
    LEFT JOIN medicationtype mt ON m.TypeID = mt.TypeID
    LEFT JOIN dosageunit du ON m.UnitID = du.UnitID
    WHERE
      m.UserID = ?
      AND m.IsActive = 1
  `;

  db.query(sql, [dateParam, userId], (err, rows) => {
    if (err) {
      console.error('❌ Error fetching today reminders:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!rows || rows.length === 0) return res.json([]);

    // Deduplicate rows by MedicationID + DefaultTime_ID (JOINs can create duplicates)
    const toInsertMap = new Map();
    rows.forEach(r => {
      if (r.ScheduleID) return; // already has schedule for today
      let weekDays = null;
      let monthDays = null;
      try { weekDays = r.WeekDays ? JSON.parse(r.WeekDays) : null; } catch (e) { weekDays = null; }
      try { monthDays = r.MonthDays ? JSON.parse(r.MonthDays) : null; } catch (e) { monthDays = null; }

      const key = `${r.MedicationID}_${r.DefaultTime_ID}`;
      if (!toInsertMap.has(key)) {
        toInsertMap.set(key, {
          MedicationID: r.MedicationID,
          DefaultTime_ID: r.DefaultTime_ID,
          Time: r.Time,
          FrequencyValue: r.FrequencyValue || null,
          CustomValue: r.CustomValue || null,
          WeekDays: weekDays,
          MonthDays: monthDays,
          Cycle_Use_Days: r.Cycle_Use_Days,
          Cycle_Rest_Days: r.Cycle_Rest_Days,
          OnDemand: r.OnDemand === 1,
          StartDate: r.StartDate,
          EndDate: r.EndDate
        });
      }
    });
    const toInsert = Array.from(toInsertMap.values());

    // helper: generate date strings (YYYY-MM-DD) for a medication based on its frequency details
    const calculateMedicationSchedule = (frequencyValue, startDateStr, endDateStr, customValue, weekDaysArr, monthDaysArr, cycleUse, cycleRest, onDemand) => {
      if (onDemand) return []; // do not pre-create schedules for on-demand
      const dates = [];

      // parse YYYY-MM-DD into local-date to avoid timezone shifts
      const toLocalDate = (str) => {
        if (!str) return null;
        const parts = String(str).split('-').map(n => parseInt(n, 10));
        if (parts.length >= 3 && parts.every(Number.isFinite)) {
          return new Date(parts[0], parts[1] - 1, parts[2]);
        }
        const d = new Date(str);
        return isNaN(d) ? null : d;
      };

      // format Date -> local YYYY-MM-DD (avoid toISOString())
      const formatLocalDate = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      const start = toLocalDate(startDateStr);
      const end = toLocalDate(endDateStr);
      if (!start || !end || isNaN(start) || isNaN(end) || start > end) return [];

      // normalize weekDays to JS getDay() values (0=Sun..6=Sat)
      let jsWeekDays = null;
      if (Array.isArray(weekDaysArr) && weekDaysArr.length > 0) {
        // Accept many possible encodings:
        // - JS getDay() values (0..6)
        // - 1=Mon..7=Sun (frontend used this previously)
        // - 1=Sun..7=Sat (other possible)
        const nums = weekDaysArr.map(d => parseInt(d, 10)).filter(Number.isFinite);
        const min = Math.min(...nums);
        const max = Math.max(...nums);

        if (min >= 0 && max <= 6) {
          // already JS getDay format
          jsWeekDays = Array.from(new Set(nums));
        } else if (min >= 1 && max <= 7) {
          // likely 1=Mon..7=Sun (frontend). Map 7->0, others keep same:
          jsWeekDays = Array.from(new Set(nums.map(n => (n % 7))));
        } else {
          // fallback: try modulo 7
          jsWeekDays = Array.from(new Set(nums.map(n => (n % 7))));
        }
      }

      // monthDaysArr expected as numbers 1..31
      let monthDaysSet = null;
      if (Array.isArray(monthDaysArr) && monthDaysArr.length > 0) {
        monthDaysSet = new Set(monthDaysArr.map(n => parseInt(n, 10)).filter(Number.isFinite));
      }

      switch (frequencyValue) {
        case 'every_day':
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) dates.push(new Date(d));
          break;

        case 'every_X_days': {
          const step = parseInt(customValue, 10);
          if (isNaN(step) || step <= 0) return [];
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + step)) dates.push(new Date(d));
          break;
        }

        case 'weekly': {
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const day = d.getDay(); // 0..6
            if (!jsWeekDays || jsWeekDays.length === 0 || jsWeekDays.includes(day)) dates.push(new Date(d));
          }
          break;
        }

        case 'monthly': {
          if (monthDaysSet && monthDaysSet.size > 0) {
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              if (monthDaysSet.has(d.getDate())) dates.push(new Date(d));
            }
          } else {
            const dayNum = parseInt(customValue, 10);
            if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) return [];
            // iterate month by month using local dates
            let cursor = new Date(start.getFullYear(), start.getMonth(), dayNum);
            if (cursor < start) cursor = new Date(start.getFullYear(), start.getMonth() + 1, dayNum);
            while (cursor <= end) {
              if (cursor.getDate() !== dayNum) {
                cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, dayNum);
                continue;
              }
              dates.push(new Date(cursor));
              cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, dayNum);
            }
          }
          break;
        }

        case 'every_X_hours':
        case 'every_X_minutes':
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) dates.push(new Date(d));
          break;

        case 'cycle': {
          const useDays = parseInt(cycleUse, 10);
          const restDays = parseInt(cycleRest, 10);
          if (isNaN(useDays) || isNaN(restDays) || useDays <= 0 || restDays < 0) return [];
          let cursor = new Date(start);
          while (cursor <= end) {
            for (let i = 0; i < useDays && cursor <= end; i++) {
              dates.push(new Date(cursor));
              cursor.setDate(cursor.getDate() + 1);
            }
            cursor.setDate(cursor.getDate() + restDays);
          }
          break;
        }

        case 'on_demand':
        default:
          break;
      }

      // format as local YYYY-MM-DD to avoid timezone/UTC shift
      return dates.map(d => formatLocalDate(d));
    };

    // insert schedules for each med/defaultTime entry (deduplicated) using idempotent insert
    const insertTasks = [];
    toInsert.forEach(entry => {
      const dates = calculateMedicationSchedule(
        entry.FrequencyValue,
        entry.StartDate,
        entry.EndDate,
        entry.CustomValue,
        entry.WeekDays,
        entry.MonthDays,
        entry.Cycle_Use_Days,
        entry.Cycle_Rest_Days,
        entry.OnDemand
      );

      if (!dates || dates.length === 0) return;

      dates.forEach(dateStr => {
      // use backticks for identifiers to avoid reserved-word issues
        const insertSql = `
          INSERT INTO \`medicationschedule\` (\`MedicationID\`, \`DefaultTime_ID\`, \`Date\`, \`Time\`, \`Status\`)
          VALUES (?, ?, ?, ?, 'รอกิน')
          ON DUPLICATE KEY UPDATE \`Time\` = VALUES(\`Time\`)
        `;
        const params = [entry.MedicationID, entry.DefaultTime_ID, dateStr, entry.Time];

        insertTasks.push(new Promise((resolve) => {
          db.query(insertSql, params, (err3, result3) => {
            const dbName = (db && db.config && db.config.database) ? db.config.database : 'unknown_db';
            if (err3) {
              console.error('❌ Error inserting schedule (db=%s):', dbName, err3);
              return resolve();
            }
            console.log('Insert result (db=%s):', dbName, { affectedRows: result3.affectedRows, insertId: result3.insertId, warningCount: result3.warningCount });

            // verify immediately by selecting the inserted row (use backticks)
            const verifySql = 'SELECT `ScheduleID`, `MedicationID`, `DefaultTime_ID`, `Date`, `Time`, `Status` FROM `medicationschedule` WHERE `MedicationID` = ? AND `DefaultTime_ID` = ? AND `Date` = ?';
            db.query(verifySql, [entry.MedicationID, entry.DefaultTime_ID, dateStr], (verErr, verRows) => {
              if (verErr) {
                console.error('❌ Verification SELECT error (db=%s):', dbName, verErr);
              } else if (!verRows || verRows.length === 0) {
                console.error('❌ Verification failed — row not found after insert (db=%s)', dbName, { MedicationID: entry.MedicationID, DefaultTime_ID: entry.DefaultTime_ID, Date: dateStr, insertResult: result3 });
              } else {
                console.log('✅ Verification row found (db=%s):', dbName, verRows[0]);
              }
              return resolve();
            });
          });
        }));
      });
    });

    Promise.all(insertTasks).then(() => {
      // re-query and return today's reminders (fresh)
      db.query(sql, [dateParam, userId], (err2, refreshed) => {
        if (err2) {
          console.error('❌ Error refetching reminders:', err2);
          return res.status(500).json({ error: 'Database error' });
        }
        // ส่งเฉพาะแถวที่มี medicationschedule สำหรับวันนี้
        const filtered = (refreshed || []).filter(r => r.ScheduleID);
        res.json(filtered);
      });
    }).catch(errPromise => {
      console.error('❌ Error processing schedule inserts:', errPromise);
      res.status(500).json({ error: 'Failed to create schedules' });
    });
  });
});

// ✅ ฟังก์ชันอัปเดต medicationlog จาก medicationschedule
const updateMedicationLog = async (medicationId, date) => {
  try {
    // นับจำนวน schedule ทั้งหมดในวันนั้น
    const [countResult] = await db.promise().query(
      `SELECT COUNT(*) as total FROM medicationschedule 
       WHERE MedicationID = ? AND Date = ?`,
      [medicationId, date]
    );
    const totalCount = countResult[0]?.total || 0;

    // นับตามสถานะละเอียด
    const [statusResult] = await db.promise().query(
      `SELECT 
         SUM(CASE WHEN Status = 'กินแล้ว' AND (IsLate = 0 OR LateMinutes = 0) THEN 1 ELSE 0 END) as onTime,
         SUM(CASE WHEN Status = 'กินแล้ว' AND IsLate = 1 AND LateMinutes > 0 THEN 1 ELSE 0 END) as late,
         SUM(CASE WHEN Status = 'กินแล้ว' THEN 1 ELSE 0 END) as taken,
         SUM(CASE WHEN Status = 'ข้าม' THEN 1 ELSE 0 END) as skipped,
         SUM(CASE WHEN Status = 'ไม่ระบุ' THEN 1 ELSE 0 END) as unknown,
         AVG(CASE WHEN Status = 'กินแล้ว' AND LateMinutes > 0 THEN LateMinutes ELSE NULL END) as avgLateMinutes
       FROM medicationschedule 
       WHERE MedicationID = ? AND Date = ?`,
      [medicationId, date]
    );

    const onTimeCount = parseInt(statusResult[0]?.onTime) || 0;
    const lateCount = parseInt(statusResult[0]?.late) || 0;
    const takenCount = parseInt(statusResult[0]?.taken) || 0;
    const skippedCount = parseInt(statusResult[0]?.skipped) || 0;
    const unknownCount = parseInt(statusResult[0]?.unknown) || 0;
    const avgLateMinutes = parseFloat(statusResult[0]?.avgLateMinutes || 0).toFixed(2);

    // คำนวณ %
    const perCount = totalCount > 0 
      ? parseFloat(((takenCount / totalCount) * 100).toFixed(2)) 
      : 0;

    // ดึง ScheduleID ล่าสุดที่มีการเปลี่ยนแปลง
    const [latestSchedule] = await db.promise().query(
      `SELECT ScheduleID, Status, SideEffects FROM medicationschedule 
       WHERE MedicationID = ? AND Date = ? 
       ORDER BY RecordedAt DESC, ScheduleID DESC LIMIT 1`,
      [medicationId, date]
    );

    const scheduleId = latestSchedule[0]?.ScheduleID || null;
    const currentStatus = latestSchedule[0]?.Status || 'รอกิน';
    const sideEffects = latestSchedule[0]?.SideEffects || null;

    // บันทึก/อัปเดต log
    await db.promise().query(
      `INSERT INTO medicationlog 
       (MedicationID, ScheduleID, \`Count\`, OnTimeCount, LateCount, TakenCount, SkippedCount, UnknownCount,
        PerCount, AvgLateMinutes, date, Status, SideEffects, UpdatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         ScheduleID = VALUES(ScheduleID),
         \`Count\` = VALUES(\`Count\`),
         OnTimeCount = VALUES(OnTimeCount),
         LateCount = VALUES(LateCount),
         TakenCount = VALUES(TakenCount),
         SkippedCount = VALUES(SkippedCount),
         UnknownCount = VALUES(UnknownCount),
         PerCount = VALUES(PerCount),
         AvgLateMinutes = VALUES(AvgLateMinutes),
         Status = VALUES(Status),
         SideEffects = VALUES(SideEffects),
         UpdatedAt = NOW()`,
      [
        medicationId, 
        scheduleId, 
        totalCount, 
        onTimeCount, 
        lateCount, 
        takenCount, 
        skippedCount, 
        unknownCount,
        perCount, 
        avgLateMinutes, 
        date, 
        currentStatus, 
        sideEffects
      ]
    );

    console.log('✅ Updated medicationlog:', {
      medicationId,
      date,
      totalCount,
      onTimeCount,
      lateCount,
      takenCount,
      skippedCount,
      unknownCount,
      perCount,
      avgLateMinutes
    });

    return {
      success: true,
      perCount,
      totalCount,
      onTimeCount,
      lateCount,
      takenCount,
      skippedCount,
      unknownCount,
      avgLateMinutes
    };
  } catch (error) {
    console.error('❌ Error updating medication log:', error);
    throw error;
  }
};

// ✅ PATCH /api/schedule/:id/status - อัปเดตสถานะการกินยา
app.patch('/api/schedule/:id/status', async (req, res) => {
  const scheduleId = req.params.id;
  const { status, sideEffects, actualTime, recordedAt } = req.body;
  
  console.log('🔄 Update schedule status:', { scheduleId, status, actualTime });
  
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  
  const validStatuses = ['รอกิน', 'กินแล้ว', 'ข้าม', 'ไม่ระบุ'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }
  
  try {
    // ดึงข้อมูล scheduled time และ MedicationID
    const [rows] = await db.promise().query(
      'SELECT MedicationID, Date, Time FROM medicationschedule WHERE ScheduleID = ?', 
      [scheduleId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    const { MedicationID, Date: scheduleDate, Time: scheduledTime } = rows[0];
    
    let lateMinutes = null;
    let isLate = 0;
    
    // คำนวณ Late เฉพาะเมื่อสถานะเป็น "กินแล้ว"
    if (status === 'กินแล้ว' && actualTime && scheduledTime) {
      lateMinutes = calculateLateMinutes(scheduledTime, actualTime);
      isLate = lateMinutes > 0 ? 1 : 0;
    }
    
    // อัปเดต schedule
    await db.promise().query(
      `UPDATE medicationschedule 
       SET Status = ?, 
           SideEffects = ?, 
           ActualTime = ?,
           RecordedAt = ?,
           LateMinutes = ?,
           IsLate = ?
       WHERE ScheduleID = ?`,
      [status, sideEffects || null, actualTime || null, recordedAt || new Date().toISOString(), 
       lateMinutes, isLate, scheduleId]
    );
    
    // ✅ อัปเดต medicationlog
    const logResult = await updateMedicationLog(MedicationID, scheduleDate);
    
    console.log('✅ Schedule and log updated:', { 
      scheduleId, 
      status, 
      lateMinutes, 
      isLate,
      logResult 
    });
    
    res.json({ 
      success: true, 
      message: 'Status updated successfully',
      scheduleId,
      status,
      lateMinutes,
      isLate,
      log: logResult
    });
  } catch (error) {
    console.error('❌ Update schedule status error:', error);
    res.status(500).json({ error: 'Database error', details: error.message });
  }
});

// ✅ ฟังก์ชัน Batch Update Log สำหรับทุกยาในวันที่กำหนด
const batchUpdateLogs = async (date) => {
  try {
    console.log(`🔄 Batch updating logs for date: ${date}`);
    
    // ดึงรายการยาทั้งหมดที่มี schedule ในวันนั้น
    const [medications] = await db.promise().query(
      `SELECT DISTINCT MedicationID 
       FROM medicationschedule 
       WHERE Date = ?`,
      [date]
    );
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const { MedicationID } of medications) {
      try {
        await updateMedicationLog(MedicationID, date);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to update log for MedicationID ${MedicationID}:`, error);
        errorCount++;
      }
    }
    
    console.log(`✅ Batch update completed: ${successCount} success, ${errorCount} errors`);
  } catch (error) {
    console.error('❌ Batch update error:', error);
  }
};

// ✅ เรียก batch update ทุกเที่ยงคืน (00:00)
const scheduleBatchUpdate = () => {
  const now = new Date();
  const tonight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  const msUntilMidnight = tonight - now;
  
  setTimeout(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    batchUpdateLogs(dateStr);
    
    // ตั้งเวลาสำหรับวันถัดไป
    setInterval(() => {
      const today = new Date();
      today.setDate(today.getDate() - 1);
      const todayStr = today.toISOString().split('T')[0];
      batchUpdateLogs(todayStr);
    }, 24 * 60 * 60 * 1000); // ทุก 24 ชม.
  }, msUntilMidnight);
  
  console.log(`⏰ Scheduled batch update at midnight (in ${Math.round(msUntilMidnight / 1000 / 60)} minutes)`);
};

// เรียกตอน start server
scheduleBatchUpdate();


// PATCH /api/schedule/:id/status  { status: 'กินแล้ว' | 'ยังไม่กิน' }
app.patch('/api/medications/:id/toggle-active', (req, res) => {
  const medicationId = req.params.id;
  const { isActive } = req.body; // true = active, false = inactive
  
  console.log('🔄 Toggle active:', { medicationId, isActive });
  
  const sql = 'UPDATE medication SET IsActive = ? WHERE MedicationID = ?';
  db.query(sql, [isActive ? 1 : 0, medicationId], (err, result) => {
    if (err) {
      console.error('❌ Toggle active error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Medication not found' });
    }
    
    res.json({ 
      success: true, 
      isActive: isActive, 
      message: isActive ? 'เปิดการแจ้งเตือนแล้ว' : 'ปิดการแจ้งเตือนแล้ว' 
    });
  });
});

// ✅ GET /api/schedule/:id - ดึงข้อมูล schedule เดียว (สำหรับ verify)
app.get('/api/schedule/:id', (req, res) => {
  const scheduleId = req.params.id;
  
  const sql = `
    SELECT 
      s.*,
      m.Name as MedicationName,
      m.Dosage,
      du.DosageType,
      mt.TypeName
    FROM medicationschedule s
    JOIN medication m ON s.MedicationID = m.MedicationID
    LEFT JOIN dosageunit du ON m.UnitID = du.UnitID
    LEFT JOIN medicationtype mt ON m.TypeID = mt.TypeID
    WHERE s.ScheduleID = ?
  `;
  
  db.query(sql, [scheduleId], (err, result) => {
    if (err) {
      console.error('❌ Get schedule error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    res.json(result[0]);
  });
});

// ✅ DELETE /api/schedule/:id - ลบ schedule (ถ้าต้องการ)
app.delete('/api/schedule/:id', (req, res) => {
  const scheduleId = req.params.id;
  
  const sql = 'DELETE FROM medicationschedule WHERE ScheduleID = ?';
  
  db.query(sql, [scheduleId], (err, result) => {
    if (err) {
      console.error('❌ Delete schedule error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    res.json({ success: true, message: 'Schedule deleted successfully' });
  });
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

// ✅ GET /api/meal-times/:userId - ดึงเวลาอาหารของ user
app.get('/api/meal-times/:userId', (req, res) => {
  const userId = req.params.userId;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const query = `
    SELECT 
      udt.MealID,
      ms.MealName,
      udt.Time,
      udt.DefaultTime_ID
    FROM userdefaultmealtime udt
    JOIN mealschedule ms ON udt.MealID = ms.MealID
    WHERE udt.UserID = ?
    ORDER BY udt.MealID
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('❌ Database query error:', err);
      return res.status(500).json({ error: 'Failed to fetch meal times' });
    }

    if (results.length === 0) {
      console.log('⚠️ No meal times found for user:', userId);
      
      // สร้างค่าเริ่มต้นถ้าไม่มีข้อมูล
      const defaultTimes = [
        { MealID: 1, Time: '08:00:00' }, // เช้า
        { MealID: 2, Time: '12:00:00' }, // เที่ยง
        { MealID: 3, Time: '18:00:00' }, // เย็น
        { MealID: 4, Time: '21:00:00' }  // ก่อนนอน
      ];

      const insertPromises = defaultTimes.map(({ MealID, Time }) => {
        return new Promise((resolve, reject) => {
          db.query(
            'INSERT INTO userdefaultmealtime (UserID, MealID, Time) VALUES (?, ?, ?)',
            [userId, MealID, Time],
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          );
        });
      });

      Promise.all(insertPromises)
        .then(() => {
          // ดึงข้อมูลใหม่หลังสร้างเสร็จ
          db.query(query, [userId], (err2, results2) => {
            if (err2) return res.status(500).json({ error: 'Failed to fetch meal times' });
            
            const mealTimes = results2.reduce((acc, curr) => {
              const mealKey = {
                1: 'breakfast',
                2: 'lunch',
                3: 'dinner',
                4: 'snack'
              }[curr.MealID];
              
              if (mealKey) {
                acc[mealKey] = curr.Time.substring(0, 5); // HH:MM
              }
              return acc;
            }, {});
            
            res.json(mealTimes);
          });
        })
        .catch(err => {
          console.error('❌ Error creating default meal times:', err);
          res.status(500).json({ error: 'Failed to create default meal times' });
        });

      return;
    }

    // แปลงข้อมูลเป็น format ที่ frontend ต้องการ
    const mealTimes = results.reduce((acc, curr) => {
      const mealKey = {
        1: 'breakfast',
        2: 'lunch',
        3: 'dinner',
        4: 'snack'
      }[curr.MealID];
      
      if (mealKey) {
        acc[mealKey] = curr.Time.substring(0, 5); // แปลง HH:MM:SS เป็น HH:MM
      }
      return acc;
    }, {});

    console.log('✅ Meal times fetched:', mealTimes);
    res.json(mealTimes);
  });
});

// ✅ PATCH /api/meal-times/:userId - อัปเดตเวลาอาหาร
app.patch('/api/meal-times/:userId', async (req, res) => {
  const userId = req.params.userId;
  const { breakfast, lunch, dinner, snack } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const updates = [
    { MealID: 1, Time: breakfast },
    { MealID: 2, Time: lunch },
    { MealID: 3, Time: dinner },
    { MealID: 4, Time: snack }
  ];

  try {
    const updatePromises = updates.map(({ MealID, Time }) => {
      return new Promise((resolve, reject) => {
        // แปลง HH:MM เป็น HH:MM:00 สำหรับ database
        const fullTime = Time.length === 5 ? `${Time}:00` : Time;
        
        const query = `
          UPDATE userdefaultmealtime 
          SET Time = ? 
          WHERE UserID = ? AND MealID = ?
        `;
        
        db.query(query, [fullTime, userId, MealID], (err, result) => {
          if (err) {
            console.error(`❌ Failed to update MealID ${MealID}:`, err);
            reject(err);
          } else {
            console.log(`✅ Updated MealID ${MealID} to ${fullTime}`);
            resolve(result);
          }
        });
      });
    });

    await Promise.all(updatePromises);
    
    res.status(200).json({ 
      success: true, 
      message: 'Meal times updated successfully' 
    });
  } catch (error) {
    console.error('❌ Error updating meal times:', error);
    res.status(500).json({ 
      error: 'Failed to update meal times',
      details: error.message 
    });
  }
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


// เพิ่ม endpoint สร้างกลุ่มโรค (groups)
app.post('/api/groups', (req, res) => {
  const { GroupName, UserID } = req.body;
  if (!GroupName) return res.status(400).json({ error: 'GroupName required' });
  const sql = 'INSERT INTO diseasegroup (GroupName, UserID, CreatedAt) VALUES (?, ?, NOW())';
  db.query(sql, [GroupName, UserID || null], (err, result) => {
    if (err) {
      console.error('create group error', err);
      return res.status(500).json({ error: 'DB error' });
    }
    res.json({ success: true, id: result.insertId });
  });
});

// สร้างประเภทยา (medicationtype)
app.post('/api/types', (req, res) => {
  const { TypeName, UserID } = req.body;
  if (!TypeName) return res.status(400).json({ error: 'TypeName required' });
  const sql = 'INSERT INTO medicationtype (TypeName, UserID, CreatedAt) VALUES (?, ?, NOW())';
  db.query(sql, [TypeName, UserID || null], (err, result) => {
    if (err) {
      console.error('create type error', err);
      return res.status(500).json({ error: 'DB error' });
    }
    res.json({ success: true, id: result.insertId });
  });
});

// สร้างหน่วยยา (dosageunit)
app.post('/api/units', (req, res) => {
  const { DosageType, UserID } = req.body;
  if (!DosageType) return res.status(400).json({ error: 'DosageType required' });
  const sql = 'INSERT INTO dosageunit (DosageType, UserID, CreatedAt) VALUES (?, ?, NOW())';
  db.query(sql, [DosageType, UserID || null], (err, result) => {
    if (err) {
      console.error('create unit error', err);
      return res.status(500).json({ error: 'DB error' });
    }
    res.json({ success: true, id: result.insertId });
  });
});


app.get('/api/history', (req, res) => {
  const userId = req.query.userId ? parseInt(req.query.userId, 10) : null;
  const from = req.query.from; // expected YYYY-MM-DD
  const to = req.query.to;

  console.log('[GET] /api/history', { userId, from, to });

  if (!userId) return res.status(400).json({ error: 'missing userId' });
  if (!from || !to) return res.status(400).json({ error: 'missing from/to date' });

  const sqlRows = `
    SELECT 
      s.ScheduleID, 
      s.Date, 
      s.Time, 
      s.Status, 
      s.ActualTime, 
      s.SideEffects,
      s.LateMinutes,
      s.IsLate,
      m.MedicationID, 
      m.Name, 
      m.Dosage, 
      du.DosageType, 
      mt.TypeName
    FROM medicationschedule s
    JOIN medication m ON s.MedicationID = m.MedicationID
    LEFT JOIN dosageunit du ON m.UnitID = du.UnitID
    LEFT JOIN medicationtype mt ON m.TypeID = mt.TypeID
    WHERE m.UserID = ? AND s.Date BETWEEN ? AND ?
    ORDER BY s.Date DESC, s.Time ASC
  `;

  const sqlSummary = `
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN s.Status = 'กินแล้ว' THEN 1 ELSE 0 END) AS taken,
      SUM(CASE WHEN s.Status = 'ข้าม' THEN 1 ELSE 0 END) AS skipped
    FROM medicationschedule s
    JOIN medication m ON s.MedicationID = m.MedicationID
    WHERE m.UserID = ? AND s.Date BETWEEN ? AND ?
  `;

  db.query(sqlRows, [userId, from, to], (err, rows) => {
    if (err) {
      console.error('history rows error', err);
      return res.status(500).json({ error: 'DB error (rows)', details: err.message });
    }
    db.query(sqlSummary, [userId, from, to], (err2, summaryRows) => {
      if (err2) {
        console.error('history summary error', err2);
        return res.status(500).json({ error: 'DB error (summary)', details: err2.message });
      }
      const summary = (summaryRows && summaryRows[0]) ? summaryRows[0] : { total: 0, taken: 0, skipped: 0 };
      res.json({ rows: rows || [], summary });
    });
  });
});

// เพิ่มใน app.js หลัง API อื่นๆ

// ✅ API สำหรับบันทึก/อัปเดต log เมื่อมีการเปลี่ยนสถานะ
app.post('/api/medicationlog', async (req, res) => {
  const { medicationId, scheduleId, date, status, sideEffects } = req.body;
  
  console.log('📝 Received log request:', { medicationId, scheduleId, date, status });
  
  try {
    if (!scheduleId || !medicationId || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // ดึงข้อมูลจำนวนรายการยาในวันนั้น
    const [countResult] = await db.promise().query(
      `SELECT COUNT(*) as total FROM medicationschedule 
       WHERE MedicationID = ? AND Date = ?`,
      [medicationId, date]
    );
    const totalCount = countResult[0]?.total || 0;
    
    // ✅ นับตามสถานะละเอียด
    const [statusResult] = await db.promise().query(
      `SELECT 
         SUM(CASE WHEN Status = 'กินแล้ว' AND IsLate = 0 THEN 1 ELSE 0 END) as onTime,
         SUM(CASE WHEN Status = 'กินแล้ว' AND IsLate = 1 THEN 1 ELSE 0 END) as late,
         SUM(CASE WHEN Status = 'กินแล้ว' THEN 1 ELSE 0 END) as taken,
         SUM(CASE WHEN Status = 'ข้าม' THEN 1 ELSE 0 END) as skipped,
         SUM(CASE WHEN Status = 'ไม่ระบุ' THEN 1 ELSE 0 END) as unknown,
         AVG(CASE WHEN Status = 'กินแล้ว' AND LateMinutes > 0 THEN LateMinutes ELSE NULL END) as avgLateMinutes
       FROM medicationschedule 
       WHERE MedicationID = ? AND Date = ?`,
      [medicationId, date]
    );
    
    const onTimeCount = statusResult[0]?.onTime || 0;
    const lateCount = statusResult[0]?.late || 0;
    const takenCount = statusResult[0]?.taken || 0;
    const skippedCount = statusResult[0]?.skipped || 0;
    const unknownCount = statusResult[0]?.unknown || 0;
    const avgLateMinutes = parseFloat(statusResult[0]?.avgLateMinutes || 0).toFixed(2);
    
    const perCount = totalCount > 0 ? ((takenCount / totalCount) * 100).toFixed(2) : 0;
    
    console.log('📊 Stats:', { 
      totalCount, onTimeCount, lateCount, takenCount, skippedCount, unknownCount, 
      perCount, avgLateMinutes 
    });
    
    // ✅ บันทึก log พร้อมข้อมูลละเอียด
    await db.promise().query(
      `INSERT INTO medicationlog 
       (MedicationID, ScheduleID, \`Count\`, OnTimeCount, LateCount, TakenCount, SkippedCount, UnknownCount, 
        PerCount, AvgLateMinutes, date, Status, SideEffects)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         ScheduleID = VALUES(ScheduleID),
         \`Count\` = VALUES(\`Count\`),
         OnTimeCount = VALUES(OnTimeCount),
         LateCount = VALUES(LateCount),
         TakenCount = VALUES(TakenCount),
         SkippedCount = VALUES(SkippedCount),
         UnknownCount = VALUES(UnknownCount),
         PerCount = VALUES(PerCount),
         AvgLateMinutes = VALUES(AvgLateMinutes),
         Status = VALUES(Status),
         SideEffects = VALUES(SideEffects)`,
      [medicationId, scheduleId, totalCount, onTimeCount, lateCount, takenCount, skippedCount, unknownCount,
       perCount, avgLateMinutes, date, status, sideEffects || null]
    );
    
    res.json({ 
      success: true, 
      perCount, 
      takenCount, 
      onTimeCount, 
      lateCount, 
      unknownCount,
      totalCount,
      avgLateMinutes
    });
  } catch (error) {
    console.error('❌ Error updating medication log:', error);
    res.status(500).json({ error: 'Failed to update log', details: error.message });
  }
});

// ✅ API สำหรับดึง % ของยาแต่ละตัว
app.get('/api/medicationlog/stats', async (req, res) => {
  const { userId, from, to } = req.query;
  
  if (!userId || !from || !to) {
    return res.status(400).json({ 
      error: 'Missing required parameters',
      required: ['userId', 'from', 'to']
    });
  }
  
  try {
    const [rows] = await db.promise().query(
      `SELECT 
         m.MedicationID,
         m.name as MedicationName,
         COUNT(DISTINCT s.ScheduleID) as TotalScheduled,
         SUM(CASE 
           WHEN s.Status = 'กินแล้ว' AND (s.IsLate = 0 OR s.LateMinutes = 0 OR s.LateMinutes IS NULL) 
           THEN 1 ELSE 0 
         END) as TotalOnTime,
         SUM(CASE 
           WHEN s.Status = 'กินแล้ว' AND s.IsLate = 1 AND s.LateMinutes > 0 
           THEN 1 ELSE 0 
         END) as TotalLate,
         SUM(CASE WHEN s.Status = 'กินแล้ว' THEN 1 ELSE 0 END) as TotalTaken,
         SUM(CASE WHEN s.Status = 'ข้าม' THEN 1 ELSE 0 END) as TotalSkipped,
         SUM(CASE 
           WHEN s.Status = 'ไม่ระบุ' OR s.Status IS NULL OR s.Status = 'รอกิน' 
           THEN 1 ELSE 0 
         END) as TotalUnknown,
         ROUND(
           (SUM(CASE WHEN s.Status = 'กินแล้ว' THEN 1 ELSE 0 END) * 100.0 / 
           NULLIF(COUNT(DISTINCT s.ScheduleID), 0)), 2
         ) as AvgPerCount,
         ROUND(AVG(CASE 
           WHEN s.Status = 'กินแล้ว' AND s.LateMinutes > 0 
           THEN s.LateMinutes 
           ELSE NULL 
         END), 2) as AvgLateMinutes
       FROM medication m
       LEFT JOIN medicationschedule s 
         ON m.MedicationID = s.MedicationID 
         AND s.Date BETWEEN ? AND ?
       WHERE m.UserID = ?
         AND m.IsActive = 1
       GROUP BY m.MedicationID, m.name
       HAVING TotalScheduled > 0
       ORDER BY AvgPerCount DESC, m.name ASC`,
      [from, to, userId]
    );
    
    // แปลง null เป็น 0 สำหรับทุก field
    const processedRows = rows.map(row => ({
      ...row,
      TotalScheduled: parseInt(row.TotalScheduled) || 0,
      TotalOnTime: parseInt(row.TotalOnTime) || 0,
      TotalLate: parseInt(row.TotalLate) || 0,
      TotalTaken: parseInt(row.TotalTaken) || 0,
      TotalSkipped: parseInt(row.TotalSkipped) || 0,
      TotalUnknown: parseInt(row.TotalUnknown) || 0,
      AvgPerCount: parseFloat(row.AvgPerCount) || 0,
      AvgLateMinutes: parseFloat(row.AvgLateMinutes) || 0
    }));
    
    console.log(`✅ Fetched stats for ${processedRows.length} medications`);
    
    res.json(processedRows);
  } catch (error) {
    console.error('❌ Error fetching medication stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stats',
      details: error.message 
    });
  }
});


// API สำหรับดึงข้อมูล summary แบบละเอียด
app.get('/api/history/summary', async (req, res) => {
  const { userId, from, to, lateThresholdHours = 1 } = req.query;
  
  const lateThresholdMinutes = parseFloat(lateThresholdHours) * 60;
  
  try {
    const [result] = await db.promise().query(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE 
           WHEN s.Status = 'กินแล้ว' AND (s.IsLate = 0 OR s.LateMinutes = 0 OR s.LateMinutes IS NULL) 
           THEN 1 ELSE 0 
         END) AS onTime,
         SUM(CASE 
           WHEN s.Status = 'กินแล้ว' AND s.IsLate = 1 AND s.LateMinutes >= ? 
           THEN 1 ELSE 0 
         END) AS late,
         SUM(CASE 
           WHEN s.Status = 'กินแล้ว' AND s.IsLate = 1 AND s.LateMinutes > 0 AND s.LateMinutes < ? 
           THEN 1 ELSE 0 
         END) AS slightlyLate,
         SUM(CASE WHEN s.Status = 'กินแล้ว' THEN 1 ELSE 0 END) AS taken,
         SUM(CASE WHEN s.Status = 'ข้าม' THEN 1 ELSE 0 END) AS skipped,
         SUM(CASE WHEN s.Status = 'ไม่ระบุ' OR s.Status IS NULL THEN 1 ELSE 0 END) AS unknown,
         ROUND(AVG(CASE 
           WHEN s.Status = 'กินแล้ว' AND s.LateMinutes > 0 
           THEN s.LateMinutes 
           ELSE NULL 
         END), 2) AS avgLateMinutes
       FROM medicationschedule s
       JOIN medication m ON s.MedicationID = m.MedicationID
       WHERE m.UserID = ? AND s.Date BETWEEN ? AND ?`,
      [lateThresholdMinutes, lateThresholdMinutes, userId, from, to]
    );
    
    const summary = result[0] || {
      total: 0,
      onTime: 0,
      late: 0,
      slightlyLate: 0,
      taken: 0,
      skipped: 0,
      unknown: 0,
      avgLateMinutes: 0
    };
    
    // แปลงค่า null เป็น 0
    Object.keys(summary).forEach(key => {
      if (summary[key] === null) summary[key] = 0;
    });
    
    summary.avgLateMinutes = parseFloat(summary.avgLateMinutes || 0).toFixed(2);
    summary.avgLateHours = (summary.avgLateMinutes / 60).toFixed(2);
    
    console.log('✅ Summary result:', summary);
    
    res.json(summary);
  } catch (error) {
    console.error('❌ Error fetching summary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch summary',
      details: error.message 
    });
  }
});

// ============================================
// 🔧 API แก้ไข/ลบ กลุ่มโรค (Groups)
// ============================================

// PUT /api/groups/:id - แก้ไขกลุ่มโรค
app.put('/api/groups/:id', (req, res) => {
  const groupId = req.params.id;
  const { GroupName, UserID } = req.body;
  
  if (!GroupName) {
    return res.status(400).json({ error: 'GroupName is required' });
  }
  
  const sql = 'UPDATE diseasegroup SET GroupName = ?, UserID = ? WHERE GroupID = ?';
  db.query(sql, [GroupName, UserID || null, groupId], (err, result) => {
    if (err) {
      console.error('❌ Update group error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    res.json({ success: true, message: 'Group updated successfully' });
  });
});

// DELETE /api/groups/:id - ลบกลุ่มโรค
app.delete('/api/groups/:id', (req, res) => {
  const groupId = req.params.id;
  
  // ตรวจสอบว่ามียาที่ใช้กลุ่มนี้อยู่หรือไม่
  const checkSql = 'SELECT COUNT(*) as count FROM medication WHERE GroupID = ?';
  db.query(checkSql, [groupId], (err, result) => {
    if (err) {
      console.error('❌ Check group usage error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    const count = result[0]?.count || 0;
    if (count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete group', 
        message: `มียา ${count} รายการที่ใช้กลุ่มนี้อยู่` 
      });
    }
    
    // ลบกลุ่ม
    const deleteSql = 'DELETE FROM diseasegroup WHERE GroupID = ?';
    db.query(deleteSql, [groupId], (err2, result2) => {
      if (err2) {
        console.error('❌ Delete group error:', err2);
        return res.status(500).json({ error: 'Database error', details: err2.message });
      }
      
      if (result2.affectedRows === 0) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      res.json({ success: true, message: 'Group deleted successfully' });
    });
  });
});

// ============================================
// 🔧 API แก้ไข/ลบ ประเภทยา (Types)
// ============================================

// PUT /api/types/:id - แก้ไขประเภทยา
app.put('/api/types/:id', (req, res) => {
  const typeId = req.params.id;
  const { TypeName, UserID } = req.body;
  
  if (!TypeName) {
    return res.status(400).json({ error: 'TypeName is required' });
  }
  
  const sql = 'UPDATE medicationtype SET TypeName = ?, UserID = ? WHERE TypeID = ?';
  db.query(sql, [TypeName, UserID || null, typeId], (err, result) => {
    if (err) {
      console.error('❌ Update type error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Type not found' });
    }
    
    res.json({ success: true, message: 'Type updated successfully' });
  });
});

// DELETE /api/types/:id - ลบประเภทยา
app.delete('/api/types/:id', (req, res) => {
  const typeId = req.params.id;
  
  // ตรวจสอบว่ามียาที่ใช้ประเภทนี้อยู่หรือไม่
  const checkSql = 'SELECT COUNT(*) as count FROM medication WHERE TypeID = ?';
  db.query(checkSql, [typeId], (err, result) => {
    if (err) {
      console.error('❌ Check type usage error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    const count = result[0]?.count || 0;
    if (count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete type', 
        message: `มียา ${count} รายการที่ใช้ประเภทนี้อยู่` 
      });
    }
    
    // ลบประเภท
    const deleteSql = 'DELETE FROM medicationtype WHERE TypeID = ?';
    db.query(deleteSql, [typeId], (err2, result2) => {
      if (err2) {
        console.error('❌ Delete type error:', err2);
        return res.status(500).json({ error: 'Database error', details: err2.message });
      }
      
      if (result2.affectedRows === 0) {
        return res.status(404).json({ error: 'Type not found' });
      }
      
      res.json({ success: true, message: 'Type deleted successfully' });
    });
  });
});

// ============================================
// 🔧 API แก้ไข/ลบ หน่วยยา (Units)
// ============================================

// PUT /api/units/:id - แก้ไขหน่วยยา
app.put('/api/units/:id', (req, res) => {
  const unitId = req.params.id;
  const { DosageType, UserID } = req.body;
  
  if (!DosageType) {
    return res.status(400).json({ error: 'DosageType is required' });
  }
  
  const sql = 'UPDATE dosageunit SET DosageType = ?, UserID = ? WHERE UnitID = ?';
  db.query(sql, [DosageType, UserID || null, unitId], (err, result) => {
    if (err) {
      console.error('❌ Update unit error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Unit not found' });
    }
    
    res.json({ success: true, message: 'Unit updated successfully' });
  });
});

// DELETE /api/units/:id - ลบหน่วยยา
app.delete('/api/units/:id', (req, res) => {
  const unitId = req.params.id;
  
  // ตรวจสอบว่ามียาที่ใช้หน่วยนี้อยู่หรือไม่
  const checkSql = 'SELECT COUNT(*) as count FROM medication WHERE UnitID = ?';
  db.query(checkSql, [unitId], (err, result) => {
    if (err) {
      console.error('❌ Check unit usage error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    const count = result[0]?.count || 0;
    if (count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete unit', 
        message: `มียา ${count} รายการที่ใช้หน่วยนี้อยู่` 
      });
    }
    
    // ลบหน่วย
    const deleteSql = 'DELETE FROM dosageunit WHERE UnitID = ?';
    db.query(deleteSql, [unitId], (err2, result2) => {
      if (err2) {
        console.error('❌ Delete unit error:', err2);
        return res.status(500).json({ error: 'Database error', details: err2.message });
      }
      
      if (result2.affectedRows === 0) {
        return res.status(404).json({ error: 'Unit not found' });
      }
      
      res.json({ success: true, message: 'Unit deleted successfully' });
    });
  });
});

// ✅ ฟังก์ชันคำนวณเวลาที่กินช้า
const calculateLateMinutes = (scheduledTime, actualTime) => {
  if (!scheduledTime || !actualTime) return null;
  
  const scheduled = new Date(`1970-01-01T${scheduledTime}`);
  const actual = new Date(`1970-01-01T${actualTime}`);
  
  if (isNaN(scheduled) || isNaN(actual)) return null;
  
  const diffMs = actual - scheduled;
  const diffMinutes = Math.floor(diffMs / 60000);
  
  return diffMinutes > 0 ? diffMinutes : 0; // คืนค่า 0 ถ้ากินก่อนเวลา
};

//  ฟังก์ชัน Auto-update Status เป็น "ไม่ระบุ" สำหรับยาที่เลยเวลา
const autoUpdateExpiredSchedules = () => {
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  
  const sql = `
    UPDATE medicationschedule 
    SET Status = 'ไม่ระบุ' 
    WHERE Status = 'รอกิน' 
      AND Date < ? 
  `;

  db.query(sql, [currentDate], (err, result) => {
    if (err) {
      console.error('❌ Auto-update expired schedules error:', err);
    } else if (result.affectedRows > 0) {
      console.log(`✅ Auto-updated ${result.affectedRows} expired schedules to "ไม่ระบุ"`);
    }
  });
};

//  เรียก auto-update ทุก 5 นาที
setInterval(autoUpdateExpiredSchedules, 5 * 60 * 1000);
autoUpdateExpiredSchedules(); // เรียกทันทีตอน start server


//  รัน server
app.listen(3000, () => {
  console.log('🌐 Server is running on port 3000');
});
