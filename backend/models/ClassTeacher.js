import mongoose from 'mongoose';

const classTeacherSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  section: {
    type: String,
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SchoolProfile',
    required: true
  }
}, { timestamps: true });

// A teacher can be a class teacher for only one section
classTeacherSchema.index({ teacherId: 1 }, { unique: true });

// A class and section can have only one class teacher
classTeacherSchema.index({ classId: 1, section: 1 }, { unique: true });

const ClassTeacher = mongoose.model('ClassTeacher', classTeacherSchema);

export default ClassTeacher;
