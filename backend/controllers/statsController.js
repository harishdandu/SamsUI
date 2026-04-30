import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import Fee from '../models/Fee.js';
import Staff from '../models/Staff.js';

export const getDashboardStats = async (req, res) => {
  try {
    const studentCount = await Student.countDocuments();
    const staffCount = await Staff.countDocuments();
    
    // Calculate attendance for today
    const today = new Date().toISOString().split('T')[0];
    const attendanceToday = await Attendance.find({ date: new Date(today) });
    const attendancePercentage = attendanceToday.length > 0 
      ? (attendanceToday.filter(a => a.status === 'Present').length / attendanceToday.length) * 100 
      : 0;

    // Calculate total fees
    const fees = await Fee.find({ status: 'Paid' });
    const totalFees = fees.reduce((sum, f) => sum + f.amount, 0);

    res.status(200).json({
      studentCount,
      staffCount,
      attendancePercentage: attendancePercentage.toFixed(1),
      totalFees
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
