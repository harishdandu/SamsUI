import Subject from '../models/Subject.js';
import Class from '../models/Class.js';

export const getAllSubjects = async (req, res) => {
  try {
    const schoolId = req.query.schoolId || req.user.schoolId;
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required' });
    }
    
    const subjects = await Subject.find({ schoolId }).sort({ name: 1 });
    const classes = await Class.find({ schoolId });

    const subjectsWithClasses = subjects.map(subject => {
      // Find all classes that have this subject name in their subjects array
      const assignedClasses = classes
        .filter(cls => cls.subjects && cls.subjects.includes(subject.name))
        .map(cls => cls.name);
      
      return {
        ...subject.toObject(),
        classes: assignedClasses
      };
    });

    res.status(200).json(subjectsWithClasses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createSubject = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const newSubject = await Subject.create({ ...req.body, schoolId });
    res.status(201).json(newSubject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const updatedSubject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedSubject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
