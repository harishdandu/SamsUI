import mongoose from 'mongoose';

const examMarkSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SchoolProfile',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  className: {
    type: String,
    required: true
  },
  testName: {
    type: String,
    enum: [
      'Slip Test1', 
      'Slip Test2', 
      'Slip Test3', 
      'Unit Test1', 
      'Unit Test2', 
      'Unit Test3', 
      'Quarterly', 
      'Half Yearly', 
      'Annual'
    ],
    required: true
  },
  totalMarks: {
    type: Number,
    required: true
  },
  marksObtained: {
    type: Number,
    required: true
  },
  subjectName: {
    type: String,
    required: true
  },
  examDate: {
    type: Date,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

const ExamMark = mongoose.model('ExamMark', examMarkSchema);

export default ExamMark;
