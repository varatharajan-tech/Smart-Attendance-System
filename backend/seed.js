const mongoose = require('mongoose');
const Student = require('./models/Student');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Dummy data from frontend
const STUDENTS = [
  { name: "Arjun Sharma", roll: "CS001", dept: "B.E Computer Science", year: "3rd Year", parent: "Raj Sharma", phone: "+919876543210" },
  { name: "Priya Nair", roll: "CS002", dept: "B.E Computer Science", year: "3rd Year", parent: "Suresh Nair", phone: "+918765432109" },
  { name: "Mohammed Ali", roll: "CS003", dept: "B.E Computer Science", year: "3rd Year", parent: "Ahmed Ali", phone: "+917654321098" },
  { name: "Kavya Reddy", roll: "CS004", dept: "B.E Computer Science", year: "3rd Year", parent: "Ravi Reddy", phone: "+916543210987" },
  { name: "Vikram Singh", roll: "CS005", dept: "B.E Computer Science", year: "3rd Year", parent: "Harpal Singh", phone: "+915432109876" },
  { name: "Sneha Patel", roll: "CS006", dept: "B.E Computer Science", year: "3rd Year", parent: "Nilesh Patel", phone: "+914321098765" },
  { name: "Rahul Kumar", roll: "CS007", dept: "B.E Computer Science", year: "3rd Year", parent: "Sunil Kumar", phone: "+913210987654" },
  { name: "Ananya Iyer", roll: "CS008", dept: "B.E Computer Science", year: "3rd Year", parent: "Venkat Iyer", phone: "+912109876543" },
  { name: "Karthik Raj", roll: "CS009", dept: "B.E Computer Science", year: "3rd Year", parent: "Murugan Raj", phone: "+911098765432" },
  { name: "Deepika Menon", roll: "CS010", dept: "B.E Computer Science", year: "3rd Year", parent: "Krishnan Menon", phone: "+919087654321" },
];

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rvs_attendance')
  .then(async () => {
    console.log('Connected to MongoDB');
    await Student.deleteMany({});
    console.log('Cleared existing students');
    await Student.insertMany(STUDENTS);
    console.log('Inserted mock students successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
