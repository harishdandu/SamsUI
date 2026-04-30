import StaffAttendance from '../models/StaffAttendance.js';
import Staff from '../models/Staff.js';

export const markBulkStaffAttendance = async (req, res) => {
  const { records } = req.body;
  
  try {
    const operations = records.map(record => ({
      updateOne: {
        filter: { staffId: record.staffId, date: new Date(record.date) },
        update: { status: record.status, remark: record.remark },
        upsert: true
      }
    }));

    await StaffAttendance.bulkWrite(operations);
    res.status(200).json({ message: 'Staff attendance updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStaffAttendance = async (req, res) => {
  const { date, staffId, startDate, endDate } = req.query;
  
  try {
    let query = {};
    
    if (date) {
      query.date = new Date(date);
    } else if (startDate && endDate) {
      query.date = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }

    if (staffId) {
      query.staffId = staffId;
    }

    const attendance = await StaffAttendance.find(query).populate('staffId', 'firstName lastName employeeId role');
    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
