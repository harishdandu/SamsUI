import express from 'express';
import { generateTestPaper, saveQuestionPaper, getQuestionPapers } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/generate', protect, generateTestPaper);
router.post('/save-paper', protect, saveQuestionPaper);
router.get('/papers', protect, getQuestionPapers);

export default router;
