# Smart Attendance System

A comprehensive MERN stack (MongoDB, Express.js, React, Node.js) web application designed to manage student attendance efficiently. This application replaces manual roll-call processes, providing real-time tracking, a beautiful interactive dashboard, and automated absent notifications to parents via SMS using Twilio.

## Features
- **Dashboard Overview**: View statistics, attendance trends, and real-time updates.
- **Attendance Management**: Mark student attendance by course/department daily.
- **Automated SMS Alerts**: Automatically send an SMS notification to the parents of absent students using the Twilio API.
- **Student Directory**: Retrieve and filter registered student data stored in MongoDB.
- **Mock Fallback**: Safe mock-logging when Twilio credentials are not provided to prevent crashes.

## Technologies Used
**Frontend:**
- React (Vite build tool)
- TailwindCSS for styling
- Recharts for data visualization

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose (database ORM)
- Twilio SDK (SMS integration)

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/en/) installed
- Make sure MongoDB is running locally on `localhost:27017` or update the `.env` MongoDB URI.

### 1. Installation Environment
Clone the repository and install the dependencies for both the frontend and backend.

**Frontend Setup:**
```bash
# In the root directory (where package.json and vite.config.js are located)
npm install
```

**Backend Setup:**
```bash
# In the backend directory
cd backend
npm install
```

### 2. Environment Variables (.env)
In your `backend` directory, create or modify the `.env` file to contain the necessary environment variables:
```plaintext
# Database
MONGODB_URI=mongodb://localhost:27017/rvs_attendance
PORT=5000

# Twilio (Replace PLACEHOLDER with your actual Twilio details for SMS to work)
TWILIO_ACCOUNT_SID=PLACEHOLDER
TWILIO_AUTH_TOKEN=PLACEHOLDER
TWILIO_PHONE_NUMBER=PLACEHOLDER
```

### 3. Database Seeding (Optional)
To test the application properly, you can pre-fill your MongoDB database with dummy student records:
```bash
cd backend
node seed.js
```
*Note: This will insert 10 placeholder student accounts into your database.*

### 4. Running the Application

You need to run two terminal windows to start the full application.

**Start the Backend Server:**
```bash
cd backend
node server.js
```
*The backend should run on `http://localhost:5000`.*

**Start the Vite Frontend Server:**
```bash
# From the project root
npm run dev
```
*Access the application interface at `http://localhost:5173/`.*

---

## Troubleshooting
- **CORS Errors**: If you encounter fetching issues in the frontend, ensure your backend's `cors` plugin is correctly enabling calls from `http://localhost:5173`.
- **Twilio Not Sending Messages**: Make sure your Twilio SID/Auth tokens are completely accurate and that you have verified phone numbers matching your mock database if using a trial Twilio account. If left as `PLACEHOLDER`, the backend will simulate sending in the terminal.
