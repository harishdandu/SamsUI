import express from 'express';
import { 
  login, 
  register, 
  requestPasswordOTP, 
  changePasswordWithOTP,
  forgotPassword,
  resetPasswordWithOTP
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPasswordWithOTP);

// Protected routes
router.post('/request-otp', protect, requestPasswordOTP);
router.post('/change-password-otp', protect, changePasswordWithOTP);

export default router;
