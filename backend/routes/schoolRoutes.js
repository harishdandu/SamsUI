import express from 'express';
import { registerSchool, verifySchoolOTP, updateSchoolProfile, getSchoolProfile } from '../controllers/schoolController.js';

const router = express.Router();

router.post('/register', registerSchool);
router.post('/verify-otp', verifySchoolOTP);
router.put('/profile/:schoolId', updateSchoolProfile);
router.get('/profile/:schoolId', getSchoolProfile);

export default router;
