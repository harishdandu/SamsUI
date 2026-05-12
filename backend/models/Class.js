import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  }, // e.g. "1", "2", "10"
  sections: [{ 
    type: String, 
    default: ['A'] 
  }], // e.g. ["A", "B", "C"]
  subjects: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Subject' 
  }],
  schoolId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'SchoolProfile', 
    required: true 
  }
}, { timestamps: true });

// Ensure class name is unique per school
classSchema.index({ name: 1, schoolId: 1 }, { unique: true });

const Class = mongoose.model('Class', classSchema);

export default Class;
