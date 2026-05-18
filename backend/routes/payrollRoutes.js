import express from 'express';
import { generatePayroll, getStaffPayrollHistory, getStaffMonthPayroll } from '../controllers/payrollController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('Super Admin', 'Admin'));

router.post('/generate', generatePayroll);
router.get('/month', getStaffMonthPayroll);
router.get('/history/:staffId', getStaffPayrollHistory);

export default router;
