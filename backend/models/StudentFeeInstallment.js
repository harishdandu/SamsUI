import mongoose from 'mongoose';

const studentFeeInstallmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  installmentNumber: {
    type: Number,
    required: true
  },
  installmentAmount: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  installmentDueDate: {
    type: Date,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending', 'Partial'],
    default: 'Pending'
  },
  paymentDate: {
    type: Date,
    default: null
  },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'CASH', 'CARD', null],
    default: null
  }
}, { timestamps: true });

const StudentFeeInstallment = mongoose.model('StudentFeeInstallment', studentFeeInstallmentSchema);

export default StudentFeeInstallment;
