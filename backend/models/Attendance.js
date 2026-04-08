const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  department: { type: String, required: true },
  year: { type: String, required: true },
  records: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    status: { type: String, enum: ['present', 'absent'], default: 'present' }
  }]
});

module.exports = mongoose.model('Attendance', attendanceSchema);
