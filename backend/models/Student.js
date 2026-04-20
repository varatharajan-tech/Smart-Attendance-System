const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  roll: { type: String, required: true, unique: true },
  dept: { type: String, required: true, index: true },
  year: { type: String, required: true, index: true },
  parent: { type: String, required: true },
  phone: { type: String, required: true },
}, { timestamps: true });

// Indexes for faster queries
studentSchema.index({ dept: 1, year: 1 });

module.exports = mongoose.model('Student', studentSchema);
