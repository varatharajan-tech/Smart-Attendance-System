const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const apiRoutes = require('./routes/api');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ──── CORS Configuration ────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5179',
  'http://127.0.0.1:5179',
  // Production URLs (add your Vercel frontend URL here)
  'https://smart-attendance.vercel.app',
  // Fallback for any Vercel deployment
  process.env.NODE_ENV === 'production' ? '*.vercel.app' : null
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS policy does not allow access from origin ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// ──── Rate Limiting ────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests, please try again later'
});
app.use(limiter);

// ──── Body Parser Middleware ────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ──── Database Connection ────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ MongoDB Connected successfully!'))
  .catch((err) => console.error('✗ MongoDB connection error:', err));

// ──── Initialize Background Tasks ────
const { startCronJobs } = require('./services/cronJobs');
startCronJobs();

// ──── Routes ────
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Smart Attendance Backend is running.' });
});

// 404 handler - must come after all other routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ──── Error Handling Middleware ────
app.use(errorHandler);

// ──── Start Server ────
app.listen(PORT, () => {
  console.log(`✓ Server is running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});
