import express from 'express';
import { login, register, requestPasswordOTP, changePasswordWithOTP } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);

// Protected routes
router.post('/request-otp', protect, requestPasswordOTP);
router.post('/change-password-otp', protect, changePasswordWithOTP);

export default router;
