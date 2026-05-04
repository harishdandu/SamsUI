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
    }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Incorrect username or password' });
    }

    const token = signToken(user._id);
    user.password = undefined; // Hide password in response

    res.status(200).json({
      status: 'success',
      token,
      data: { 
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          staffId: user.staffId
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

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save OTP and Expiry (10 mins)
    user.passwordOTP = await bcrypt.hash(otp, 12);
    user.passwordOTPExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    // Send Email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Your Password Change OTP (Valid for 10 mins)',
        message: `Your OTP for changing your password is: ${otp}. Please do not share this with anyone.`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #4f46e5; text-align: center;">SAMS Elite Security</h2>
            <p>Hello <strong>${user.username}</strong>,</p>
            <p>You requested to change your password. Please use the following One-Time Password (OTP) to complete the process:</p>
            <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; margin: 20px 0;">
              ${otp}
            </div>
            <p>This OTP is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this email and ensure your account is secure.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #6b7280; text-align: center;">This is an automated message. Please do not reply.</p>
          </div>
        `
      });

      res.status(200).json({
        status: 'success',
        message: 'OTP sent to email!'
      });
    } catch (err) {
      user.passwordOTP = undefined;
      user.passwordOTPExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ message: 'Error sending email. Please try again later.' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const changePasswordWithOTP = async (req, res) => {
  try {
    const { otp, newPassword } = req.body;

    if (!otp || !newPassword) {
      return res.status(400).json({ message: 'Please provide OTP and new password' });
    }

    const user = await User.findById(req.user.id);
    
    // Check if OTP exists and is not expired
    if (!user.passwordOTP || !user.passwordOTPExpires || user.passwordOTPExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired or is invalid' });
    }

    // Verify OTP
    const isOTPValid = await bcrypt.compare(otp, user.passwordOTP);
    if (!isOTPValid) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Update password
    user.password = newPassword;
    user.passwordOTP = undefined;
    user.passwordOTPExpires = undefined;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully!'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Please provide your email address' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No user found with that email address' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save OTP and Expiry (10 mins)
    user.passwordOTP = await bcrypt.hash(otp, 12);
    user.passwordOTPExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    // Send Email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset OTP - SAMS Elite',
        message: `Your OTP for resetting your password is: ${otp}. Valid for 10 minutes.`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #4f46e5; text-align: center;">SAMS Elite Password Reset</h2>
            <p>Hello,</p>
            <p>We received a request to reset your password. Please use the following One-Time Password (OTP) to proceed:</p>
            <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; margin: 20px 0;">
              ${otp}
            </div>
            <p>This OTP is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #6b7280; text-align: center;">This is an automated message. Please do not reply.</p>
          </div>
        `
      });

      res.status(200).json({
        status: 'success',
        message: 'OTP sent to your email!'
      });
    } catch (err) {
      user.passwordOTP = undefined;
      user.passwordOTPExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ message: 'Error sending email. Please try again later.' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const resetPasswordWithOTP = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Please provide email, OTP, and new password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if OTP exists and is not expired
    if (!user.passwordOTP || !user.passwordOTPExpires || user.passwordOTPExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired or is invalid' });
    }

    // Verify OTP
    const isOTPValid = await bcrypt.compare(otp, user.passwordOTP);
    if (!isOTPValid) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Update password
    user.password = newPassword;
    user.passwordOTP = undefined;
    user.passwordOTPExpires = undefined;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully! You can now log in.'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
