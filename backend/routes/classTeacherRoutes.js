import express from 'express';
import { 
  getAllClassTeachers, 
  assignClassTeacher, 
  unassignClassTeacher, 
  getEligibleTeachers 
} from '../controllers/classTeacherController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all class teachers (accessible by authenticated users, e.g. teachers/HR to view)
router.get('/', getAllClassTeachers);

// Management routes (restricted to Admin and Super Admin)
router.post('/', restrictTo('Super Admin', 'Admin'), assignClassTeacher);
router.delete('/:id', restrictTo('Super Admin', 'Admin'), unassignClassTeacher);
router.get('/eligible-teachers', restrictTo('Super Admin', 'Admin'), getEligibleTeachers);

export default router;
