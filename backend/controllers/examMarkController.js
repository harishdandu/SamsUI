import ExamMark from '../models/ExamMark.js';
import ClassTeacher from '../models/ClassTeacher.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';

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

export const updateExamMark = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      testName,
      totalMarks,
      marksObtained,
      subjectName,
      examDate
    } = req.body;

    const schoolId = req.user.schoolId;
    const examMark = await ExamMark.findOne({ _id: id, schoolId });
    if (!examMark) {
      return res.status(404).json({ message: 'Exam mark not found.' });
    }

    if (req.user.role === 'Teacher') {
      const student = await Student.findOne({ _id: examMark.studentId, schoolId });
      if (!student) {
        return res.status(404).json({ message: 'Associated student not found.' });
      }

      const classDoc = await Class.findOne({ name: student.class, schoolId });
      const teacherId = req.user.staffId || req.user._id;
      const isClassTeacher = classDoc
        ? await ClassTeacher.exists({
            schoolId,
            classId: classDoc._id,
            section: student.section,
            teacherId
          })
        : false;

      if (!isClassTeacher) {
        return res.status(403).json({ message: 'Only the class teacher for this student may edit exam marks.' });
      }
    }

    const updates = {};
    if (req.user.role !== 'Teacher') {
      if (testName) updates.testName = testName;
      if (subjectName) updates.subjectName = subjectName;
      if (typeof totalMarks !== 'undefined') updates.totalMarks = Number(totalMarks);
      if (examDate) updates.examDate = examDate;
    }
    if (typeof marksObtained !== 'undefined') updates.marksObtained = Number(marksObtained);

    const effectiveTotalMarks = typeof updates.totalMarks !== 'undefined' ? updates.totalMarks : examMark.totalMarks;
    const effectiveMarksObtained = typeof updates.marksObtained !== 'undefined' ? updates.marksObtained : examMark.marksObtained;

    if (effectiveMarksObtained > effectiveTotalMarks) {
      return res.status(400).json({ message: 'Marks obtained cannot exceed total marks.' });
    }

    const updatedExamMark = await ExamMark.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      data: updatedExamMark
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
