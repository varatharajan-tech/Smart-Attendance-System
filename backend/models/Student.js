const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  roll: { type: String, required: true, unique: true },
  dept: { type: String, required: true },
  year: { type: String, required: true },
  parent: { type: String, required: true },
  phone: { type: String, required: true }, // Parent's contact
});

module.exports = mongoose.model('Student', studentSchema);
