import express from 'express';
import { getAllStaff, createStaff, updateStaff, deleteStaff, getStaffById } from '../controllers/staffController.js';

const router = express.Router();

router.get('/', getAllStaff);
router.get('/:id', getStaffById);
router.post('/', createStaff);
router.put('/:id', updateStaff);
router.delete('/:id', deleteStaff);

export default router;
