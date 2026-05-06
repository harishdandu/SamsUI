import mongoose from 'mongoose';

const ledgerSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  transactionType: {
    type: String,
    enum: ['Income', 'Expense'],
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  installmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentFeeInstallment'
  },
  installmentNumber: Number,
  installmentDueDate: Date,
  category: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: String,
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Cheque', 'UPI', 'CASH', 'CARD'],
    default: 'Cash'
  },
  referenceId: String, // e.g., Fee Receipt ID or Salary ID
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

const Ledger = mongoose.model('Ledger', ledgerSchema);

export default Ledger;
