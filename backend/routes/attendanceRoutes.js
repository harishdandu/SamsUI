import express from 'express';
import { getAttendanceByClassAndDate, markAttendance } from '../controllers/attendanceController.js';

const router = express.Router();

router.get('/', getAttendanceByClassAndDate);
router.post('/bulk', markAttendance);

export default router;
