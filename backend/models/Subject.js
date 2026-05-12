import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  classes: [{
    type: String,
    required: true
  }],
  code: String,
  description: String,
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SchoolProfile',
    required: true
  }
}, { timestamps: true });

subjectSchema.index({ name: 1, schoolId: 1 }, { unique: true });

const Subject = mongoose.model('Subject', subjectSchema);

export default Subject;
