import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Teacher', 'Admin', 'Accountant', 'HR', 'Super Admin'],
    required: true
  },
  designation: String,
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: String,
  joinDate: {
    type: Date,
    default: Date.now
  },
  salary: {
    base: Number,
    allowances: Number,
  },
  status: {
    type: String,
    enum: ['Active', 'On Leave', 'Resigned'],
    default: 'Active'
  },
  teachingSubjects: [{
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },
    classes: [String]
  }]
}, { timestamps: true });

staffSchema.pre('save', async function(next) {
  if (!this.isNew) return next();

  try {
    // Sort by employeeId descending to get the highest one
    const lastStaff = await mongoose.model('Staff').findOne(
      { employeeId: /^EMP/ }, 
      {}, 
      { sort: { 'employeeId' : -1 } }
    );
    
    let nextIdNum = 1;
    
    if (lastStaff && lastStaff.employeeId) {
      const lastIdMatch = lastStaff.employeeId.match(/\d+/);
      if (lastIdMatch) {
        nextIdNum = parseInt(lastIdMatch[0]) + 1;
      }
    }
    
    this.employeeId = `EMP${nextIdNum.toString().padStart(3, '0')}`;
    next();
  } catch (error) {
    next(error);
  }
});

const Staff = mongoose.model('Staff', staffSchema);

export default Staff;
