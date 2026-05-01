import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper for ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import studentRoutes from './routes/studentRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import feeRoutes from './routes/feeRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import authRoutes from './routes/authRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import accountingRoutes from './routes/accountingRoutes.js';
import staffAttendanceRoutes from './routes/staffAttendanceRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/staff-attendance', staffAttendanceRoutes);
app.use('/api/subjects', subjectRoutes);

// --- FRONTEND SERVING ---
// 1. Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// 2. Catch-all route: for any request that isn't an API call, serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Database connection logic
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) return;
  try {
    await mongoose.connect(uri);
  } catch (error) {
    console.error('DB Connection Error:', error.message);
  }
};

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

export default app;
