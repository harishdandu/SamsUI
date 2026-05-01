import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

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

app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ROBUST CONNECTION LOGIC
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error("❌ ERROR: MONGODB_URI is not defined in environment variables!");
    return;
  }

  console.log("⏳ Attempting to connect to MongoDB...");
  
  try {
    // Force a 10s timeout for the connection itself
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, 
    });
    console.log("✅ SUCCESS: Connected to MongoDB");
  } catch (error) {
    console.error("❌ MONGODB CONNECTION ERROR:", error.message);
  }
};

// Initial connection
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

export default app;
