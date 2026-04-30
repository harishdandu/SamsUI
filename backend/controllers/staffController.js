import Staff from '../models/Staff.js';

export const getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.find();
    res.status(200).json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createStaff = async (req, res) => {
  const staffData = req.body;
  if (!staffData.employeeId) {
    staffData.employeeId = `EMP-${Date.now()}`;
  }
  const newStaff = new Staff(staffData);
  try {
    await newStaff.save();
    res.status(201).json(newStaff);
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
