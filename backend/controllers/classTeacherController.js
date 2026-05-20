import ClassTeacher from '../models/ClassTeacher.js';
import Class from '../models/Class.js';
import Staff from '../models/Staff.js';
import Student from '../models/Student.js';

/**
 * Get all class teacher configurations for the school
 */
export const getAllClassTeachers = async (req, res) => {
  try {
    const schoolId = req.query.schoolId || req.user.schoolId;
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required.' });
    }

    const classTeachers = await ClassTeacher.find({ schoolId })
      .populate({
        path: 'classId',
        select: 'name sections'
      })
      .populate({
        path: 'teacherId',
        select: 'firstName lastName employeeId email'
      });

    res.status(200).json(classTeachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Assign or update a class teacher for a specific class and section
 */
export const assignClassTeacher = async (req, res) => {
  try {
    const { classId, section, teacherId } = req.body;
    const schoolId = req.user.schoolId;

    if (!classId || !section || !teacherId) {
      return res.status(400).json({ message: 'Class, Section, and Teacher are all required.' });
    }

    // 1. Verify class exists and section is valid
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found.' });
    }
    if (!classObj.sections.includes(section)) {
      return res.status(400).json({ message: `Section ${section} does not exist in Class ${classObj.name}.` });
    }

    // 2. Verify teacher exists and is in the same school
    const teacher = await Staff.findOne({ _id: teacherId, schoolId });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found.' });
    }
    if (teacher.role !== 'Teacher') {
      return res.status(400).json({ message: 'Assigned staff member must be a Teacher.' });
    }

    // 3. Verify teacher is assigned to the class (teachingSubjects.classes contains class.name)
    const isAssignedToClass = teacher.teachingSubjects?.some(ts => 
      ts.classes && ts.classes.includes(classObj.name)
    );
    if (!isAssignedToClass) {
      return res.status(400).json({ 
        message: `Teacher ${teacher.firstName} ${teacher.lastName} is not assigned to teach Class ${classObj.name}.` 
      });
    }

    // 4. Verify teacher is not already a class teacher for another section/class
    const existingAssignment = await ClassTeacher.findOne({ 
      teacherId, 
      schoolId,
      $or: [
        { classId: { $ne: classId } },
        { section: { $ne: section } }
      ]
    }).populate('classId');

    if (existingAssignment) {
      return res.status(400).json({ 
        message: `Teacher ${teacher.firstName} ${teacher.lastName} is already assigned as a class teacher for Class ${existingAssignment.classId.name} Section ${existingAssignment.section}.` 
      });
    }

    // 5. Upsert assignment (find by classId & section, update with teacherId)
    const updatedAssignment = await ClassTeacher.findOneAndUpdate(
      { classId, section, schoolId },
      { teacherId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    .populate({
      path: 'classId',
      select: 'name sections'
    })
    .populate({
      path: 'teacherId',
      select: 'firstName lastName employeeId email'
    });

    res.status(200).json(updatedAssignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Remove/delete a class teacher assignment
 */
export const unassignClassTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const schoolId = req.user.schoolId;

    const deleted = await ClassTeacher.findOneAndDelete({ _id: id, schoolId });
    if (!deleted) {
      return res.status(404).json({ message: 'Class teacher configuration not found.' });
    }

    res.status(200).json({ message: 'Class teacher unassigned successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all teachers eligible to be class teacher for a specific class.
 * Lists all teachers assigned to teach this class, and indicates if they are already assigned elsewhere.
 */
export const getEligibleTeachers = async (req, res) => {
  try {
    const { classId } = req.query;
    const schoolId = req.user.schoolId;

    if (!classId) {
      return res.status(400).json({ message: 'Class ID is required.' });
    }

    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    // Find all teachers in the same school who have this class name in their teachingSubjects
    const teachers = await Staff.find({
      schoolId,
      role: 'Teacher',
      'teachingSubjects.classes': classObj.name
    });

    // Find all ClassTeacher configurations for this school to see who is already assigned
    const allAssignments = await ClassTeacher.find({ schoolId }).populate('classId');

    // Build the eligibility list
    const eligibleTeachers = teachers.map(teacher => {
      const assignment = allAssignments.find(a => a.teacherId.toString() === teacher._id.toString());
      return {
        _id: teacher._id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        employeeId: teacher.employeeId,
        email: teacher.email,
        isAlreadyClassTeacher: !!assignment,
        assignedClass: assignment ? assignment.classId?.name : null,
        assignedSection: assignment ? assignment.section : null
      };
    });

    res.status(200).json(eligibleTeachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyClassTeacherForStudent = async (req, res) => {
  try {
    const { studentId } = req.query;
    if (!studentId) {
      return res.status(400).json({ message: 'studentId is required.' });
    }

    const schoolId = req.user.schoolId;
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required.' });
    }

    if (req.user.role !== 'Teacher') {
      return res.status(200).json({ isClassTeacher: false });
    }

    const student = await Student.findOne({ _id: studentId, schoolId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const classDoc = await Class.findOne({ name: student.class, schoolId });
    if (!classDoc) {
      return res.status(200).json({ isClassTeacher: false });
    }

    const teacherId = req.user.staffId || req.user._id;
    const isClassTeacher = await ClassTeacher.exists({
      schoolId,
      classId: classDoc._id,
      section: student.section,
      teacherId
    });

    res.status(200).json({ isClassTeacher: !!isClassTeacher });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
