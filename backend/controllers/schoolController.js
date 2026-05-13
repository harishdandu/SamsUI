import SchoolProfile from '../models/SchoolProfile.js';
import User from '../models/User.js';
import Staff from '../models/Staff.js';
import sendEmail from '../utils/email.js';
import bcrypt from 'bcryptjs';

export const registerSchool = async (req, res) => {
  try {
    const { email, schoolName, registrationNumber, password } = req.body;

    // Check if school already exists and is verified
    const existingSchool = await SchoolProfile.findOne({
      $or: [{ email }, { registrationNumber }]
    });

    if (existingSchool && existingSchool.isVerified) {
      return res.status(400).json({ message: 'School with this email or registration number already exists.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`🔑 DEBUG: Generated OTP for ${email}: ${otp}`);
    const otpHash = await bcrypt.hash(otp, 12);
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins

    if (existingSchool) {
      // Update existing unverified record
      existingSchool.schoolName = schoolName;
      existingSchool.password = password;
      existingSchool.otp = otpHash;
      existingSchool.otpExpires = otpExpires;
      await existingSchool.save();
    } else {
      // Create new unverified record
      await SchoolProfile.create({
        email,
        schoolName,
        registrationNumber,
        password,
        otp: otpHash,
        otpExpires
      });
    }

    // Send Email
    try {
      await sendEmail({
        email,
        subject: 'School Registration OTP - SAMS Elite',
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
            <h2 style="color: #4f46e5;">School Registration</h2>
            <p>Your verification OTP is: <strong style="font-size: 1.5rem; color: #1e293b;">${otp}</strong></p>
            <p style="color: #64748b; font-size: 0.875rem;">This OTP is valid for 10 minutes.</p>
          </div>
        `
      });
      res.status(200).json({ status: 'success', message: 'OTP sent to your email!' });
    } catch (err) {
      console.error('Email error:', err);
      return res.status(500).json({ message: 'Error sending email. Please try again.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSchoolProfile = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const school = await SchoolProfile.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School profile not found.' });
    }
    res.status(200).json({ status: 'success', data: school });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifySchoolOTP = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    const school = await SchoolProfile.findOne({ email }).select('+password');
    if (!school || !school.otp || school.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP invalid or expired.' });
    }

    const isValid = await bcrypt.compare(otp, school.otp);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    // Mark school as verified
    school.isVerified = true;
    school.otp = undefined;
    school.otpExpires = undefined;
    await school.save();

    // 1. Create the Staff record for the Super Admin
    const staffMember = await Staff.create({
      firstName: 'School',
      lastName: 'Admin',
      email: email,
      role: 'Super Admin',
      schoolId: school._id,
      status: 'Active'
    });

    // 2. Create the Admin user for this school
    const username = email.split('@')[0] + '_' + Math.floor(1000 + Math.random() * 9000);
    
    await User.create({
      username,
      email,
      password: password || school.password,
      role: 'Super Admin',
      schoolId: school._id,
      staffId: staffMember._id // Link to the staff record
    });

    res.status(200).json({ 
      status: 'success', 
      message: 'School registered, Super Admin user and Staff profile created successfully!' 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSchoolProfile = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const updateData = req.body;

    const school = await SchoolProfile.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School profile not found.' });
    }

    // Update fields
    const allowedFields = ['schoolName', 'phone', 'plotNo', 'streetName', 'mandal', 'district', 'state', 'logo'];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        school[field] = updateData[field];
      }
    });

    school.isProfileCompleted = true;
    await school.save();

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully!',
      data: school
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
