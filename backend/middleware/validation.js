const Joi = require('joi');

// Schemas for validation
const schemas = {
  // Login validation
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('Admin', 'Teacher').required()
  }),

  // Create student
  createStudent: Joi.object({
    name: Joi.string().required(),
    roll: Joi.string().required(),
    dept: Joi.string().required(),
    year: Joi.string().valid('1st Year', '2nd Year', '3rd Year', '4th Year').required(),
    parent: Joi.string().required(),
    phone: Joi.string().pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/).required()
  }),

  // Mark attendance
  markAttendance: Joi.object({
    date: Joi.date().required(),
    department: Joi.string().required(),
    year: Joi.string().required(),
    records: Joi.array().items(
      Joi.object({
        student: Joi.string().required(),
        status: Joi.string().valid('present', 'absent').required()
      })
    ).required()
  }),

  // Send alert
  sendAlert: Joi.object({
    to: Joi.string().pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/).required(),
    message: Joi.string().min(5).max(500).required()
  })
};

// Validation middleware factory
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const messages = error.details.map(d => d.message);
    return res.status(400).json({ error: 'Validation Error', details: messages });
  }
  
  req.body = value;
  next();
};

module.exports = { validate, schemas };
