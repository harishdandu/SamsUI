import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import sendEmail from '../utils/email.js';
import bcrypt from 'bcryptjs';

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '90d'
  });
};

export const register = async (req, res) => {
  try {
    const newUser = await User.create(req.body);
    const token = signToken(newUser._id);
    
    res.status(201).json({
      status: 'success',
      token,
      data: { user: newUser }
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  let { username, password } = req.body;
  
  if (username) username = username.trim();
  if (password) password = password.trim();

  if (!username || !password) {
    return res.status(400).json({ message: 'Please provide username and password' });
  }

  try {
    const user = await User.findOne({
      $or: [
        { username: username },
        { email: username }
      ]
    }).select('+password').populate('staffId').populate('schoolId');
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Incorrect username or password' });
    }

    const token = signToken(user._id);
    
    // Extract assigned classes if the user is a teacher
    let assignedClasses = [];
    if (user.role === 'Teacher' && user.staffId) {
      assignedClasses = [...new Set(
        user.staffId.teachingSubjects.flatMap(sub => sub.classes)
      )];
    }

    res.status(200).json({
      status: 'success',
      token,
      data: { 
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          staffId: user.staffId?._id || user.staffId,
          schoolId: user.schoolId?._id || user.schoolId,
          schoolName: user.schoolId?.schoolName,
          schoolRegistrationNumber: user.schoolId?.registrationNumber,
          isProfileCompleted: user.schoolId?.isProfileCompleted,
          assignedClasses, // Include assigned classes for frontend filtering
          leaveBalance: user.staffId ? {
            casual: user.staffId.casualLeaves,
            totalCasual: user.staffId.totalCasualLeaves,
            sick: user.staffId.sickLeaves,
            totalSick: user.staffId.totalSickLeaves,
            other: user.staffId.otherLeaves,
            totalOther: user.staffId.totalOtherLeaves,
            unpaid: user.staffId.unpaidLeaves,
            totalUnpaid: user.staffId.totalUnpaidLeaves
          } : null
        }
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const requestPasswordOTP = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.passwordOTP = await bcrypt.hash(otp, 12);
    user.passwordOTPExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    try {
      await sendEmail({
        email: user.email,
        subject: 'Your Password Change OTP (Valid for 10 mins)',
        message: `Your OTP for changing your password is: ${otp}.`,
        html: `<div style="font-family: sans-serif; padding: 20px;"><h2>SAMS Elite Security</h2><p>Your OTP is: <strong>${otp}</strong></p></div>`
      });
      res.status(200).json({ status: 'success', message: 'OTP sent to email!' });
    } catch (err) {
      user.passwordOTP = undefined;
      user.passwordOTPExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ message: 'Error sending email.' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const changePasswordWithOTP = async (req, res) => {
  try {
    const { otp, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user.passwordOTP || !user.passwordOTPExpires || user.passwordOTPExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP expired or invalid' });
    }
    if (!(await bcrypt.compare(otp, user.passwordOTP))) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    user.password = newPassword;
    user.passwordOTP = undefined;
    user.passwordOTPExpires = undefined;
    await user.save();
    res.status(200).json({ status: 'success', message: 'Password changed successfully!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No user found with that email' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.passwordOTP = await bcrypt.hash(otp, 12);
    user.passwordOTPExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset OTP - SAMS Elite',
        html: `<div style="font-family: sans-serif; padding: 20px;"><h2>Password Reset</h2><p>Your OTP is: <strong>${otp}</strong></p></div>`
      });
      res.status(200).json({ status: 'success', message: 'OTP sent!' });
    } catch (err) {
      user.passwordOTP = undefined;
      user.passwordOTPExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ message: 'Error sending email.' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const resetPasswordWithOTP = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.passwordOTP || user.passwordOTPExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP invalid or expired' });
    }
    if (!(await bcrypt.compare(otp, user.passwordOTP))) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    user.password = newPassword;
    user.passwordOTP = undefined;
    user.passwordOTPExpires = undefined;
    await user.save();
    res.status(200).json({ status: 'success', message: 'Password reset successful!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
