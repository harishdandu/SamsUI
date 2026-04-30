import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
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
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
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

// Database connection
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('CRITICAL: MONGODB_URI environment variable is not defined!');
    return;
  }

  // Log a masked version of the URI for debugging
  const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
  console.error(`DEBUG: Attempting to connect to MongoDB: ${maskedUri}`);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.error('DEBUG: Successfully connected to MongoDB');
  } catch (error) {
    console.error('DEBUG: MongoDB Connection Error Details:', {
      message: error.message,
      code: error.code,
      name: error.name
    });
  }
};

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  try {
    console.error('DEBUG: Request hitting DB middleware');
    await connectDB();
    next();
  } catch (err) {
    console.error('DEBUG: Middleware caught error:', err.message);
    res.status(500).json({ message: "Database connection failed", error: err.message });
  }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
