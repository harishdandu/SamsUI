import Attendance from '../models/Attendance.js';

export const getAttendanceByClassAndDate = async (req, res) => {
  const { class: className, section, date } = req.query;
  try {
    const attendance = await Attendance.find({
      class: className,
      section,
      date: new Date(date)
    }).populate('studentId');
    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAttendance = async (req, res) => {
  const records = req.body; // Expecting an array of records
  try {
    const operations = records.map(record => ({
      updateOne: {
        filter: { studentId: record.studentId, date: new Date(record.date) },
        update: { ...record, date: new Date(record.date) },
        upsert: true
      }
    }));
    await Attendance.bulkWrite(operations);
    res.status(201).json({ message: 'Attendance marked successfully.' });
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};
