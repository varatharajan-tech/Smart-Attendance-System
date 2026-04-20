const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true, index: true },
  department: { type: String, required: true, index: true },
  year: { type: String, required: true },
  records: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    status: { type: String, enum: ['present', 'absent'], default: 'present' }
  }]
}, { timestamps: true });

// Indexes for faster queries
attendanceSchema.index({ date: 1, department: 1 });
attendanceSchema.index({ date: -1 }); // Latest first

module.exports = mongoose.model('Attendance', attendanceSchema);
