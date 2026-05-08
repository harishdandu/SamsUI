import mongoose from 'mongoose';

const employeePayrollSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  baseSalary: {
    type: Number,
    required: true
  },
  unpaidDays: {
    type: Number,
    required: true,
    default: 0
  },
  salaryDeduction: {
    type: Number,
    required: true,
    default: 0
  },
  netSalary: {
    type: Number,
    required: true
  },
  totalWorkingDays: {
    type: Number,
    required: true
  },
  payrollMonth: {
    type: Number, // 0-11
    required: true
  },
  payrollYear: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Generated', 'Paid'],
    default: 'Generated'
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Ensure unique record for staff per month/year
employeePayrollSchema.index({ staffId: 1, payrollMonth: 1, payrollYear: 1 }, { unique: true });

const EmployeePayroll = mongoose.model('EmployeePayroll', employeePayrollSchema);

export default EmployeePayroll;
