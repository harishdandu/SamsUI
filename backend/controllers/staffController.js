import Staff from '../models/Staff.js';
import User from '../models/User.js';
import sendEmail from '../utils/email.js';

const generatePassword = (length = 8) => {
  // Removed ambiguous characters like l, 1, I, O, 0 to prevent confusion
  const charset = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let retVal = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
};

export const getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.find();
    res.status(200).json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createStaff = async (req, res) => {
  const { status, joinDate, ...staffData } = req.body;
  
  // Clear teaching subjects for non-teacher roles to prevent validation errors
  if (staffData.role !== 'Teacher') {
    staffData.teachingSubjects = [];
  }

  if (!staffData.employeeId) {
    staffData.employeeId = `EMP-${Date.now()}`;
  }

  const newStaff = new Staff(staffData);
  
    try {
      const savedStaff = await newStaff.save();
      
      // Generate random 8-character password
      const generatedPassword = generatePassword(8);
      
      // Create corresponding User account
      const userRole = staffData.role === 'Admin' ? 'School Admin' : staffData.role;
      
      await User.create({
        username: staffData.email, // Use full email as username for login
        email: staffData.email,
        password: generatedPassword,
        role: userRole,
        staffId: savedStaff._id
      });

      // Send Welcome Email
    const portalUrl = 'https://sams-portal-0xoy.onrender.com';
    const message = `Welcome to SAMS Elite!\n\nYour account has been created. You can log in using the following credentials:\n\nPortal: ${portalUrl}\nUsername: ${staffData.email}\nPassword: ${generatedPassword}\n\nPlease change your password after your first login.`;
    
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4f46e5;">Welcome to SAMS Elite!</h2>
        <p>Hello ${staffData.firstName},</p>
        <p>Your staff account has been successfully created. You can now access the school management portal.</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Portal URL:</strong> <a href="${portalUrl}">${portalUrl}</a></p>
          <p style="margin: 5px 0;"><strong>Username:</strong> ${staffData.email}</p>
          <p style="margin: 5px 0;"><strong>Password:</strong> <span style="color: #ef4444; font-family: monospace; font-size: 1.1rem;">${generatedPassword}</span></p>
        </div>
        <p>Please log in and change your password as soon as possible.</p>
        <p>Best Regards,<br>SAMS Administration Team</p>
      </div>
    `;

    try {
      await sendEmail({
        email: staffData.email,
        subject: 'Welcome to SAMS Elite - Your Account Credentials',
        message,
        html
      });
      console.log(`✅ Welcome email sent to ${staffData.email}`);
    } catch (emailError) {
      console.error(`❌ Failed to send welcome email: ${emailError.message}`);
      // We don't fail the whole request if email fails, but we log it
    }

    res.status(201).json({
      message: 'Staff created and welcome email sent',
      staff: savedStaff
    });
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const updateStaff = async (req, res) => {
  const { id } = req.params;
  const staffData = req.body;

  // Clear teaching subjects for non-teacher roles
  if (staffData.role && staffData.role !== 'Teacher') {
    staffData.teachingSubjects = [];
  }

  try {
    const updatedStaff = await Staff.findByIdAndUpdate(id, staffData, { new: true });
    res.status(200).json(updatedStaff);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const deleteStaff = async (req, res) => {
  const { id } = req.params;
  try {
    await Staff.findByIdAndDelete(id);
    res.status(200).json({ message: 'Staff deleted successfully.' });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
