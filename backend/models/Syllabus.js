import mongoose from 'mongoose';

const syllabusSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SchoolProfile',
    required: true
  },
  chapters: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    subtopics: [{
      name: { type: String, required: true },
      description: String
    }]
  }],
  pdfUrl: String,
  fileBase64: String,
  fileType: String,
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  subjectName: String,
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

syllabusSchema.index({ classId: 1, subjectId: 1, schoolId: 1 }, { unique: true });

const Syllabus = mongoose.model('Syllabus', syllabusSchema);

// Programmatically drop legacy index that prevented multiple subjects in the same class
Syllabus.collection.dropIndex('classId_1_schoolId_1')
  .then(() => console.log('Successfully dropped legacy unique syllabus index classId_1_schoolId_1'))
  .catch(err => {
    // If the index doesn't exist, Mongo will return error code 27 (IndexNotFound). This is expected and safe to ignore.
    if (err.code !== 27 && err.codeName !== 'IndexNotFound') {
      console.warn('Warning: Could not drop legacy syllabus index:', err.message);
    }
  });

export default Syllabus;
