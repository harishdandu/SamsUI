import express from 'express';
import { getAllStudents, createStudent, updateStudent, deleteStudent, getStudentsForAttendance } from '../controllers/studentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getAllStudents);
router.get('/attendance-list', getStudentsForAttendance);
router.post('/', createStudent);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);

export default router;
