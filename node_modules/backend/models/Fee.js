import mongoose from 'mongoose';

const feeSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Paid', 'Pending', 'Partially Paid'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Online', 'Cheque'],
  },
  transactionDetails: {
    chequeNumber: String,
    bankName: String,
    date: Date,
    status: {
      type: String,
      enum: ['Cleared', 'Pending', 'Bounced'],
    }
  },
  receiptNumber: {
    type: String,
    unique: true
  }
}, { timestamps: true });

const Fee = mongoose.model('Fee', feeSchema);

export default Fee;
