# Smart Attendance System - Deployment Guide

## 📋 Pre-Deployment Checklist

### Step 1: Set Up MongoDB Atlas (Cloud Database)
Since your current MongoDB is local, you need to move to MongoDB Atlas for cloud hosting:

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new project and cluster
4. Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/rvs_attendance?retryWrites=true&w=majority`
5. Copy this URI - you'll need it later

### Step 2: Deployment Architecture

**Option A: Recommended (Separate Deployments)**
- Frontend → Vercel (Free)
- Backend → Railway.app or Render.com (Free tier available)

**Option B: Using Vercel Functions**
- Both frontend & backend on Vercel (requires more setup)

This guide uses **Option A** as it's simpler.

---

## 🚀 DEPLOYMENT STEPS

### **STEP 1: Prepare Backend for Deployment**

#### 1.1 Create Vercel-compatible API handler
Create file: `api/index.js`

```javascript
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const app = express();

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'https://your-vercel-frontend.vercel.app', // Add your Vercel URL here later
];

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
app.use(express.json({ limit: '10mb' }));

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ MongoDB Connected'))
  .catch(err => console.error('✗ MongoDB Error:', err));

// Import routes
import apiRoutes from '../backend/routes/api.js';
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Smart Attendance Backend is running.' });
});

export default app;
```

#### 1.2 Update `vercel.json` for backend
Create file: `vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.js"
    }
  ]
}
```

#### 1.3 Update Backend `.env.local` for Production
Create/Update: `backend/.env.local`

```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rvs_attendance?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_min_32_chars
JWT_EXPIRES_IN=7d
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
FRONTEND_URL=https://your-vercel-frontend.vercel.app
```

---

### **STEP 2: Prepare Frontend for Vercel**

#### 2.1 Create `.env.production` file
Create file: `.env.production`

```env
VITE_API_URL=https://your-backend-url.vercel.app/api
```

#### 2.2 Update `vite.config.js`
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
```

#### 2.3 Update `package.json` (Frontend)
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

---

### **STEP 3: Deploy Frontend to Vercel**

1. **Create GitHub Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/smart-attendance.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Set environment variables:
     - `VITE_API_URL` = `https://your-backend.vercel.app/api`
   - Click "Deploy"

3. **Get your Vercel Frontend URL** (e.g., `https://smart-attendance.vercel.app`)

---

### **STEP 4: Deploy Backend to Railway/Render**

#### Option 1: Railway.app (Recommended - Easier)
1. Go to https://railway.app
2. Login with GitHub
3. Create new project → GitHub Repo
4. Add environment variables from `.env.local`
5. Deploy

#### Option 2: Render.com
1. Go to https://render.com
2. New → Web Service → GitHub repo
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables
6. Deploy

Get your backend URL (e.g., `https://smart-attendance-api.railway.app`)

---

### **STEP 5: Update CORS in Backend**

Update `backend/server.js`:
```javascript
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:5173',
  'https://smart-attendance.vercel.app', // Your Vercel frontend URL
];
```

---

### **STEP 6: Final Configuration**

1. **Update Frontend `.env.production`:**
   ```env
   VITE_API_URL=https://your-backend-url.vercel.app/api
   ```

2. **Update Backend `.env.local`:**
   ```env
   FRONTEND_URL=https://your-vercel-frontend.vercel.app
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rvs_attendance
   ```

3. **Redeploy both** with updated environment variables

---

## ✅ Testing Deployment

1. Open your Vercel frontend URL
2. Try to login:
   - Email: `admin@rvs.edu`
   - Password: `admin123`
3. Check browser console (F12) for any errors
4. Verify API calls in Network tab

---

## 🐛 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| CORS Error | Update `allowedOrigins` in both frontend & backend |
| 404 Not Found | Check API_URL in environment variables |
| Cannot connect to DB | Verify MongoDB Atlas URI is correct |
| Vercel timeout | Increase timeout in `vercel.json` |

---

## 📝 Important Notes

- **Keep `.env` files secure** - Never commit to GitHub
- **Update JWT_SECRET** in production
- **Set strong MongoDB password** in Atlas
- **Enable HTTPS** (automatic on Vercel)
- **Monitor API usage** - Some services have free tier limits

---

## 🔒 Security Checklist Before Going Live

- [ ] Change JWT_SECRET to a strong value
- [ ] Change MongoDB password
- [ ] Remove hardcoded credentials
- [ ] Enable CORS only for your domain
- [ ] Update TWILIO credentials if needed
- [ ] Set up rate limiting
- [ ] Enable MongoDB IP whitelist

---

## 📞 Need Help?

- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com
- Railway: https://docs.railway.app
