import express from 'express';
import { generateTestPaper } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/generate', protect, generateTestPaper);

export default router;
