import Student from '../models/Student.js';
import StudentFeeInstallment from '../models/StudentFeeInstallment.js';
import Ledger from '../models/Ledger.js';

export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createStudent = async (req, res) => {
  const { installments, ...studentData } = req.body;
  
  try {
    const newStudent = new Student(studentData);
    await newStudent.save();

    if (installments && installments.length > 0) {
      // Use pre-calculated installments from frontend
      const installmentRecords = installments.map(inst => ({
        ...inst,
        studentId: newStudent._id
      }));
      const savedInstallments = await StudentFeeInstallment.insertMany(installmentRecords);

      // Create Ledger entries for initial payments
      const ledgerEntries = savedInstallments
        .filter(inst => inst.paidAmount > 0)
        .map(inst => ({
          studentId: newStudent._id,
          installmentId: inst._id,
          installmentNumber: inst.installmentNumber,
          amount: inst.paidAmount,
          date: new Date(),
          paymentMethod: inst.paymentMethod || 'CASH',
          installmentDueDate: inst.installmentDueDate,
          transactionType: 'Income',
          category: 'Student Fee',
          description: `Initial Payment - Installment #${inst.installmentNumber}`
        }));
      
      if (ledgerEntries.length > 0) {
        console.log('Saving Ledger Entries:', ledgerEntries);
        await Ledger.insertMany(ledgerEntries);
      }
    } else {
      // Fallback: Logic for generating installments if not provided by frontend
      const totalFees = studentData.fees?.amount || 0;
      const frequency = studentData.fees?.feeFrequency || 'Quarterly';
      const startDate = new Date(studentData.fees?.tuitionStartDate || new Date());
      
      let installmentCount = 0;
      let intervalMonths = 0;

      switch (frequency) {
        case 'Monthly': installmentCount = 10; intervalMonths = 1; break;
        case 'Quarterly': installmentCount = 4; intervalMonths = 3; break;
        case 'Half Yearly': installmentCount = 2; intervalMonths = 6; break;
        default: installmentCount = 1; intervalMonths = 0;
      }

      const installmentAmount = totalFees / installmentCount;
      const firstPaidAmount = studentData.fees?.firstInstallmentAmount || 0;
      const generatedInstallments = [];

      for (let i = 0; i < installmentCount; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(startDate.getMonth() + (i * intervalMonths));

        const isFirst = i === 0;
        const paid = isFirst ? firstPaidAmount : 0;
        
        let status = 'Pending';
        if (isFirst) {
          status = firstPaidAmount >= installmentAmount ? 'Paid' : 'Partial';
        }

        generatedInstallments.push({
          studentId: newStudent._id,
          installmentNumber: i + 1,
          installmentAmount: installmentAmount,
          paidAmount: paid,
          installmentDueDate: dueDate,
          paymentStatus: status,
          paymentDate: isFirst ? new Date() : null,
          paymentMethod: isFirst ? 'CASH' : null
        });
      }
      const savedInstallments = await StudentFeeInstallment.insertMany(generatedInstallments);

      // Create Ledger entries for initial payments
      const ledgerEntries = savedInstallments
        .filter(inst => inst.paidAmount > 0)
        .map(inst => ({
          studentId: newStudent._id,
          installmentId: inst._id,
          installmentNumber: inst.installmentNumber,
          amount: inst.paidAmount,
          date: new Date(),
          paymentMethod: inst.paymentMethod || 'CASH',
          installmentDueDate: inst.installmentDueDate,
          transactionType: 'Income',
          category: 'Student Fee',
          description: `Initial Payment - Installment #${inst.installmentNumber}`
        }));
      
      if (ledgerEntries.length > 0) {
        console.log('Saving Fallback Ledger Entries:', ledgerEntries);
        await Ledger.insertMany(ledgerEntries);
      }
    }

    res.status(201).json(newStudent);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const updateStudent = async (req, res) => {
  const { id } = req.params;
  const student = req.body;
  try {
    const updatedStudent = await Student.findByIdAndUpdate(id, student, { new: true });
    res.status(200).json(updatedStudent);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const deleteStudent = async (req, res) => {
  const { id } = req.params;
  try {
    await Student.findByIdAndDelete(id);
    res.status(200).json({ message: 'Student deleted successfully.' });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
