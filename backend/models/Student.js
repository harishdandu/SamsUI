import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  rollNumber: {
    type: Number,
    required: true
  },
  fees: {
    amount: { type: Number, default: 0 },
    paid: { type: Number, default: 0 },
    status: { type: String, enum: ['Pending', 'Partial', 'Paid'], default: 'Pending' },
    firstInstallmentAmount: { type: Number, default: 0 },
    feeFrequency: { type: String, enum: ['Monthly', 'Quarterly', 'Half Yearly'], default: 'Monthly' },
    tuitionStartDate: { type: Date },
    tuitionEndDate: { type: Date }
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  class: {
    type: String,
    required: true
  },
  section: {
    type: String,
    required: true
  },
  parentName: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Alumni'],
    default: 'Active'
  },
  documents: [{
    name: String,
    url: String
  }]
}, { timestamps: true });

// Compound index to ensure roll numbers are unique WITHIN a class and section
studentSchema.index({ class: 1, section: 1, rollNumber: 1 }, { unique: true });

studentSchema.pre('validate', async function(next) {
  if (!this.isNew || this.rollNumber) return next();

  try {
    // Find the student with the highest roll number in this class and section
    const lastStudent = await mongoose.model('Student').findOne(
      { class: this.class, section: this.section },
      {},
      { sort: { rollNumber: -1 } }
    );

    this.rollNumber = (lastStudent?.rollNumber || 0) + 1;
    next();
  } catch (error) {
    next(error);
  }
});


const Student = mongoose.model('Student', studentSchema);

export default Student;
