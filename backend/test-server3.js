const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const apiRoutes = require('./routes/api');

const app = express();
const PORT = 5003;

// CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests, please try again later'
});
app.use(limiter);

app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

console.log('Importing routes...');
console.log('apiRoutes type:', typeof apiRoutes);
console.log('apiRoutes stack length:', apiRoutes.stack ? apiRoutes.stack.length : 0);

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Test server 3' });
});

app.listen(PORT, () => {
  console.log('Test server 3 on port', PORT);
});
