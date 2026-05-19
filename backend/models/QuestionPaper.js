import mongoose from 'mongoose';

const questionPaperSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true
  },
  class: {
    type: String,
    required: true
  },
  chapters: [{
    type: String
  }],
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  totalMarks: {
    type: Number,
    required: true
  },
  formatPrompt: String,
  pdfBase64: String,
  questions: [{
    type: {
      type: String,
      enum: ['MCQ', 'Blank', 'Short', 'Long'],
      required: true
    },
    section: String,
    sectionInstruction: String,
    marks: {
      type: Number,
      required: true
    },
    question: {
      type: String,
      required: true
    },
    options: [String],
    answer: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SchoolProfile',
    required: true
  }
}, { timestamps: true });

const QuestionPaper = mongoose.model('QuestionPaper', questionPaperSchema);

export default QuestionPaper;
