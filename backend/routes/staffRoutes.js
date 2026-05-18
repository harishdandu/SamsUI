import express from 'express';
import { getAllStaff, createStaff, updateStaff, deleteStaff, getStaffById, bulkRegisterStaff } from '../controllers/staffController.js';

import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getAllStaff);
router.get('/:id', getStaffById);
router.post('/', restrictTo('Super Admin', 'Admin', 'HR'), createStaff);
router.post('/bulk', restrictTo('Super Admin', 'Admin', 'HR'), bulkRegisterStaff);
router.put('/:id', restrictTo('Super Admin', 'Admin', 'HR'), updateStaff);
router.delete('/:id', restrictTo('Super Admin', 'Admin', 'HR'), deleteStaff);

export default router;
