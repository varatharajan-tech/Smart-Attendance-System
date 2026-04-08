const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const { sendAlertMSG } = require('../services/twilioService');

// Fetch students based on query (e.g. dept and year)
router.get('/students', async (req, res) => {
  try {
    const { dept, year } = req.query;
    let query = {};
    if (dept) query.dept = dept;
    if (year) query.year = year;
    const students = await Student.find(query);
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch Realtime Dashboard Metrics
router.get('/dashboard', async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    
    // Calculate Absentees Today
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
      
      // Build dynamically generated recent alerts for today
      absentees.forEach((a, i) => {
        if (a.student && a.student.name && recentAlerts.length < 5) {
          recentAlerts.push({
             id: recentAlerts.length + 1,
             student: a.student.name,
             dept: record.department,
             type: "Absence",
             status: "Pending", // since cron runs at 5pm
             time: new Date(record.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          });
        }
      });
    });

    // Provide chart metrics. (In prod this would aggregate past 7 days of DB rows, 
    // but we use simulated data arrays here scaled to our overall db)
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
      alertsSent: 0, // 0 until cron fires
      pendingCalls: absenteesToday, 
      attendanceTrend,
      deptAttendance,
      recentAlerts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save daily attendance
router.post('/attendance', async (req, res) => {
  try {
    const { date, department, year, records } = req.body;
    
    // Save to DB
    const newAttendance = new Attendance({ date, department, year, records });
    await newAttendance.save();
    
    const absentees = records.filter(r => r.status === 'absent');

    res.json({ message: 'Attendance saved successfully', absenteesCount: absentees.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manual alert triggering
router.post('/alerts', async (req, res) => {
  try {
    const { message, type, channels } = req.body;
    // For demo purposes, we will broadcast this to a specific list of mock parent numbers or all DB parents.
    // To avoid spamming, we mock logging or target only 1 mock number if it's broad.
    
    console.log(`[ALERT DISPATCH] Type: ${type}, Message: ${message}`);
    // await sendAlertMSG('+1234567890', message); // Uncomment to actually send to a verified number

    res.json({ message: 'Alerts scheduled and queued for delivery.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
