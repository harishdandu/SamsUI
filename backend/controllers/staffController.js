import Staff from '../models/Staff.js';
import User from '../models/User.js';
import sendEmail from '../utils/email.js';
import crypto from 'crypto';

export const getAllStaff = async (req, res) => {
  try {
    const schoolId = req.query.schoolId || req.user.schoolId;
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required to fetch staff.' });
    }
    const staff = await Staff.find({ schoolId });
    res.status(200).json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ message: 'Staff member not found' });
    res.status(200).json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createStaff = async (req, res) => {
  const staffData = req.body;
  const schoolId = staffData.schoolId || req.user.schoolId;

  if (!schoolId) {
    return res.status(400).json({ message: 'School affiliation is required.' });
  }

  try {
    // 0. Check for existing email (global uniqueness)
    const existingStaff = await Staff.findOne({ email: staffData.email });
    const existingUser = await User.findOne({ email: staffData.email });
    if (existingStaff || existingUser) {
      return res.status(400).json({ message: 'Email is already in use by another staff member or user.' });
    }

    const newStaff = new Staff({ ...staffData, schoolId });
    
    // 1. Initialize total leave fields from initial balances
    newStaff.totalCasualLeaves = newStaff.casualLeaves || 0;
    newStaff.totalSickLeaves = newStaff.sickLeaves || 0;
    newStaff.totalOtherLeaves = newStaff.otherLeaves || 0;
    newStaff.totalUnpaidLeaves = newStaff.unpaidLeaves || 0;

    // 2. Save the Staff record
    await newStaff.save();

    // 3. Generate a random temporary password
    const tempPassword = crypto.randomBytes(4).toString('hex'); 

    // 4. Create the User record
    await User.create({
      username: newStaff.email,
      email: newStaff.email,
      password: tempPassword,
      role: newStaff.role,
      staffId: newStaff._id,
      schoolId: schoolId
    });

    // 5. Send email to the staff member
    try {
      await sendEmail({
        email: newStaff.email,
        subject: 'Welcome to SAMS Elite - Your Login Credentials',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #6366f1;">Welcome to the Team, ${newStaff.firstName}!</h2>
            <p>Your staff account has been created successfully. You can now log in to the SAMS Elite portal using the credentials below:</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Username:</strong> ${newStaff.email}</p>
              <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
            </div>
            <p>Please change your password after your first login for security reasons.</p>
            <p>Best Regards,<br/>SAMS Administration</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
    }

    res.status(201).json({
      staff: newStaff,
      userCreated: true,
      message: 'Staff and User account created successfully. Welcome email sent.'
    });
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const updateStaff = async (req, res) => {
  const { id } = req.params;
  const staffData = req.body;
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
