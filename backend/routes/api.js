const express = require('express');
const bcryptjs = require('bcryptjs');
const router = express.Router();
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const { sendAlertMSG } = require('../services/twilioService');
const { verifyToken, generateToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// ──── AUTH ROUTES ────────────────────────────────────────────

// LOGIN TEST ROUTE - NO VALIDATION
router.post('/login-test', async (req, res, next) => {
  console.log('[LOGIN-TEST] Route hit!');
  res.json({ success: true, message: 'Login test endpoint works!' });
});

// Login endpoint
router.post('/login', validate(schemas.login), async (req, res, next) => {
  console.log('[LOGIN] Route handler called');
  try {
    const { email, password, role } = req.body;
    console.log('[LOGIN] Body:', { email, password, role });

    // In production, fetch from a Users collection/database
    // For now, using hardcoded for demo (replace with DB query)
    const validUsers = [
      { id: '1', email: 'admin@rvs.edu', password: 'admin123', role: 'Admin' },
      { id: '2', email: 'teacher@rvs.edu', password: 'teacher123', role: 'Teacher' }
    ];

    const user = validUsers.find(u => u.email === email && u.role === role);
    let isValidPassword = false;

    if (user) {
      if (typeof user.password === 'string' && user.password.startsWith('$2')) {
        isValidPassword = await bcryptjs.compare(password, user.password);
      } else {
        isValidPassword = password === user.password;
      }
    }

    if (!user || !isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    res.json({ token, user: { email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
});

// ──── PROTECTED ROUTES ────────────────────────────────────────

// Fetch students based on query (e.g. dept and year)
router.get('/students', verifyToken, async (req, res, next) => {
  try {
    const { dept, year } = req.query;
    let query = {};
    if (dept) query.dept = dept;
    if (year) query.year = year;
    const students = await Student.find(query);
    res.json(students);
  } catch (err) {
    next(err);
  }
});

// Create a new student
router.post('/students', verifyToken, validate(schemas.createStudent), async (req, res, next) => {
  try {
    const newStudent = new Student(req.body);
    await newStudent.save();
    res.status(201).json({ message: 'Student created successfully', student: newStudent });
  } catch (err) {
    next(err);
  }
});

// Update student
router.put('/students/:id', verifyToken, validate(schemas.createStudent), async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Student updated successfully', student });
  } catch (err) {
    next(err);
  }
});

// Delete student
router.delete('/students/:id', verifyToken, async (req, res, next) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// Fetch Realtime Dashboard Metrics
router.get('/dashboard', verifyToken, async (req, res, next) => {
  try {
    const totalStudents = await Student.countDocuments();
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const attendancesToday = await Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('records.student');

    let absenteesToday = 0;
    const recentAlerts = []; 
    
    attendancesToday.forEach(record => {
      const absentees = record.records.filter(r => r.status === 'absent');
      absenteesToday += absentees.length;
      
      absentees.forEach((a) => {
        if (a.student && a.student.name && recentAlerts.length < 5) {
          recentAlerts.push({
             id: recentAlerts.length + 1,
             student: a.student.name,
             dept: record.department,
             type: "Absence",
             status: "Pending",
             time: new Date(record.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          });
        }
      });
    });

    const attendanceTrend = [
      { day: "Mon", present: 82, absent: 18 }, { day: "Tue", present: 88, absent: 12 },
      { day: "Wed", present: 75, absent: 25 }, { day: "Thu", present: 91, absent: 9 },
      { day: "Fri", present: 85, absent: 15 }, { day: "Sat", present: 70, absent: 30 },
    ];
    const deptAttendance = [
      { dept: "AI&DS", rate: 87 }, { dept: "CSE", rate: 88 }, { dept: "Civil", rate: 91 },
      { dept: "Mech", rate: 76 }, { dept: "Auto", rate: 83 }, { dept: "AIML", rate: 90 },
      { dept: "CySec", rate: 85 }, { dept: "Mecha", rate: 82 }, { dept: "AgriE", rate: 79 },
    ];
    
    res.json({
      totalStudents,
      absenteesToday,
      alertsSent: 0,
      pendingCalls: absenteesToday, 
      attendanceTrend,
      deptAttendance,
      recentAlerts
    });
  } catch (err) {
    next(err);
  }
});

// Save daily attendance
router.post('/attendance', verifyToken, validate(schemas.markAttendance), async (req, res, next) => {
  try {
    const { date, department, year, records } = req.body;
    
    const newAttendance = new Attendance({ date, department, year, records });
    await newAttendance.save();
    
    const absentees = records.filter(r => r.status === 'absent');

    res.status(201).json({ 
      message: 'Attendance saved successfully', 
      absenteesCount: absentees.length,
      attendance: newAttendance 
    });
  } catch (err) {
    next(err);
  }
});

// Get attendance records
router.get('/attendance', verifyToken, async (req, res, next) => {
  try {
    const { startDate, endDate, department } = req.query;
    
    let query = {};
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (department) query.department = department;

    const attendance = await Attendance.find(query).populate('records.student').sort({ date: -1 });
    res.json(attendance);
  } catch (err) {
    next(err);
  }
});

// Manual alert triggering
router.post('/alerts', verifyToken, validate(schemas.sendAlert), async (req, res, next) => {
  try {
    const { to, message } = req.body;
    
    console.log(`[ALERT DISPATCH] To: ${to}, Message: ${message}`);
    await sendAlertMSG(to, message);

    res.json({ message: 'Alert sent successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
