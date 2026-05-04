import Student from '../models/Student.js';

export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createStudent = async (req, res) => {
  const student = req.body;
  const newStudent = new Student(student);
  try {
    await newStudent.save();
    res.status(201).json(newStudent);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const updateStudent = async (req, res) => {
  const { id } = req.params;
  const student = req.body;
  try {
    const updatedStudent = await Student.findByIdAndUpdate(id, student, { new: true });
    res.status(200).json(updatedStudent);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const deleteStudent = async (req, res) => {
  const { id } = req.params;
  try {
    await Student.findByIdAndDelete(id);
    res.status(200).json({ message: 'Student deleted successfully.' });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
