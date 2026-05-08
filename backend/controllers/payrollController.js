import EmployeePayroll from '../models/EmployeePayroll.js';

export const generatePayroll = async (req, res) => {
  try {
    const { 
      staffId, 
      baseSalary, 
      unpaidDays, 
      salaryDeduction, 
      netSalary, 
      totalWorkingDays, 
      payrollMonth, 
      payrollYear 
    } = req.body;

    // Check if payroll already exists for this month/year
    const existing = await EmployeePayroll.findOne({ staffId, payrollMonth, payrollYear });
    if (existing) {
      return res.status(400).json({ message: 'Payroll already generated for this month.' });
    }

    const newPayroll = new EmployeePayroll({
      staffId,
      baseSalary,
      unpaidDays,
      salaryDeduction,
      netSalary,
      totalWorkingDays,
      payrollMonth,
      payrollYear
    });

    await newPayroll.save();
    res.status(201).json({ message: 'Payroll generated successfully', payroll: newPayroll });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStaffPayrollHistory = async (req, res) => {
  try {
    const { staffId } = req.params;
    const history = await EmployeePayroll.find({ staffId }).sort({ payrollYear: -1, payrollMonth: -1 });
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStaffMonthPayroll = async (req, res) => {
  try {
    const { staffId, month, year } = req.query;
    const payroll = await EmployeePayroll.findOne({ staffId, payrollMonth: month, payrollYear: year });
    res.status(200).json(payroll);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
