import ExamMark from '../models/ExamMark.js';

export const createExamMark = async (req, res) => {
  try {
    const { studentId, className, testName, totalMarks, marksObtained, subjectName, examDate } = req.body;
    const schoolId = req.user.schoolId;

    if (marksObtained > totalMarks) {
      return res.status(400).json({ message: 'Marks obtained cannot exceed total marks.' });
    }

    const examMark = await ExamMark.create({
      schoolId,
      studentId,
      className,
      testName,
      totalMarks,
      marksObtained,
      subjectName,
      examDate,
      createdBy: req.user._id
    });

    res.status(201).json({
      status: 'success',
      data: examMark
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllExamMarks = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const { studentId } = req.query;

    const query = { schoolId };
    if (studentId) query.studentId = studentId;

    const marks = await ExamMark.find(query).sort({ examDate: -1 });
    res.status(200).json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
