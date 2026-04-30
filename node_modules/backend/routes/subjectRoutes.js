import express from 'express';
import { getAllSubjects, createSubject, updateSubject, deleteSubject } from '../controllers/subjectController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getAllSubjects);
router.post('/', protect, createSubject);
router.put('/:id', protect, updateSubject);
router.delete('/:id', protect, deleteSubject);

export default router;
