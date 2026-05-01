import Staff from '../models/Staff.js';
import User from '../models/User.js';

const generatePassword = (length = 8) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
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

    console.log(`-----------------------------------------`);
    console.log(`STAFF ACCOUNT CREATED`);
    console.log(`Email: ${staffData.email}`);
    console.log(`Password: ${generatedPassword}`);
    console.log(`-----------------------------------------`);

    // In a real app, you would use a mailer here:
    // await sendWelcomeEmail(staffData.email, generatedPassword);

    res.status(201).json({
      message: 'Staff created and account activated',
      staff: savedStaff,
      tempPassword: generatedPassword // For testing/demo purposes
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
