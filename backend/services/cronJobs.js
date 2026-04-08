const cron = require('node-cron');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const { sendAlertMSG } = require('./twilioService');

const startCronJobs = () => {
  // Run every day at 17:00 (5:00 PM) Server Local Time
  cron.schedule('0 17 * * *', async () => {
    console.log('[CRON] Running daily absentee SMS job at 17:00...');
    try {
      // Get today's start and end to find attendances saved today
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const attendancesToday = await Attendance.find({
        date: { $gte: startOfDay, $lte: endOfDay }
      });

      if (attendancesToday.length === 0) {
        console.log('[CRON] No attendances recorded today.');
        return;
      }

      let alertsSent = 0;
      for (const record of attendancesToday) {
        const absentees = record.records.filter(r => r.status === 'absent');
        for (const absentee of absentees) {
          const student = await Student.findById(absentee.student);
          if (student) {
            const message = `Dear Parent, your ward ${student.name} was marked absent today (${new Date(record.date).toLocaleDateString()}). Please ensure regular attendance. - RVS Admin`;
            
            // To ensure we don't accidentally get hit with Twilio rate limits if you have many students
            // we will properly await each message
            await sendAlertMSG(student.phone, message);
            alertsSent++;
          }
        }
      }

      console.log(`[CRON] Daily job finished. Fired ${alertsSent} SMS parent notifications.`);
    } catch (err) {
      console.error('[CRON ERROR] Failed to run daily job:', err);
    }
  });

  console.log('Cron jobs initialized: Daily Absentee SMS scheduled at 17:00 (5:00 PM).');
};

module.exports = { startCronJobs };
