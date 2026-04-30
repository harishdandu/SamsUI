import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true
  },
  class: {
    type: String,
    required: true
  },
  topic: String,
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  type: {
    type: String,
    enum: ['MCQ', 'Short Answer', 'Long Answer'],
    required: true
  },
  question: {
    type: String,
    required: true
  },
  options: [String], // For MCQs
  answer: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

const QuestionBank = mongoose.model('QuestionBank', questionSchema);

export default QuestionBank;
