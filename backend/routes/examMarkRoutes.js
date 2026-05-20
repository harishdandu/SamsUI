import express from 'express';
import { createExamMark, getAllExamMarks, updateExamMark } from '../controllers/examMarkController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createExamMark);
router.get('/', getAllExamMarks);
router.put('/:id', updateExamMark);

export default router;
