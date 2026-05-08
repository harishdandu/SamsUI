import express from 'express';
import { applyLeave, getMyLeaves, getAllLeaves, updateLeaveStatus, getStaffLeavesByMonth } from '../controllers/leaveController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/apply', applyLeave);
router.get('/my-leaves', getMyLeaves);
router.get('/all', restrictTo('admin'), getAllLeaves);
router.get('/staff-month', restrictTo('admin'), getStaffLeavesByMonth);
router.put('/:id/status', restrictTo('admin'), updateLeaveStatus);

export default router;
