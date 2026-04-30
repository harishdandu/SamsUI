import express from 'express';
import { markBulkStaffAttendance, getStaffAttendance } from '../controllers/staffAttendanceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getStaffAttendance);
router.post('/bulk', protect, markBulkStaffAttendance);

export default router;
