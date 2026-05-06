import StudentFeeInstallment from '../models/StudentFeeInstallment.js';
import Student from '../models/Student.js';
import Fee from '../models/Fee.js';
import Ledger from '../models/Ledger.js';

export const getAllFees = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const installments = await StudentFeeInstallment.find({ paymentStatus: 'Paid' })
      .populate('studentId')
      .skip(skip)
      .limit(limit)
      .sort({ updatedAt: -1 });

    const totalRecords = await StudentFeeInstallment.countDocuments({ paymentStatus: 'Paid' });

    const getFrequencyCount = (freq) => {
      switch (freq) {
        case 'Monthly': return 10;
        case 'Quarterly': return 4;
        case 'Half Yearly': return 2;
        default: return 1;
      }
    };

    const formattedData = installments.map(inst => {
      const student = inst.studentId || {};
      const frequency = student.fees?.feeFrequency || 'Quarterly';
      const totalInstallments = getFrequencyCount(frequency);

      return {
        _id: inst._id,
        studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
        classSection: `${student.class || ''}(${student.section || ''})`,
        amount: `${inst.installmentAmount} (${inst.installmentNumber}/${totalInstallments})`,
        paymentMethod: inst.paymentMethod || 'N/A',
        installmentDueDate: inst.installmentDueDate,
        paymentDate: inst.paymentDate,
        paymentStatus: inst.paymentStatus
      };
    });

    res.status(200).json({
      data: formattedData,
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPendingFees = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { search = '' } = req.query;

    const aggregationPipeline = [
      { $match: { paymentStatus: { $ne: 'Paid' } } },
      { $sort: { installmentDueDate: 1 } },
      {
        $group: {
          _id: '$studentId',
          immediateInstallment: { $first: '$$ROOT' }
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $match: {
          $or: [
            { 'student.firstName': { $regex: search, $options: 'i' } },
            { 'student.lastName': { $regex: search, $options: 'i' } }
          ]
        }
      },
      {
        $project: {
          _id: '$immediateInstallment._id',
          studentId: '$student._id',
          studentName: { $concat: ['$student.firstName', ' ', '$student.lastName'] },
          classSection: { $concat: ['$student.class', '(', '$student.section', ')'] },
          amountDue: { 
            $subtract: [
              '$immediateInstallment.installmentAmount', 
              { $ifNull: ['$immediateInstallment.paidAmount', 0] }
            ] 
          },
          installmentAmount: '$immediateInstallment.installmentAmount',
          paidAmount: { $ifNull: ['$immediateInstallment.paidAmount', 0] },
          installmentNumber: '$immediateInstallment.installmentNumber',
          dueDate: '$immediateInstallment.installmentDueDate',
          frequency: '$student.fees.feeFrequency',
          paymentStatus: '$immediateInstallment.paymentStatus'
        }
      }
    ];

    const allPending = await StudentFeeInstallment.aggregate(aggregationPipeline);
    const totalRecords = allPending.length;
    const paginatedData = allPending.slice(skip, skip + limit);

    res.status(200).json({
      data: paginatedData,
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const collectFee = async (req, res) => {
  const feeRecord = req.body;
  if (!feeRecord.receiptNumber) {
    feeRecord.receiptNumber = `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  const newFee = new Fee(feeRecord);
  try {
    await newFee.save();
    res.status(201).json(newFee);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const updateFeeStatus = async (req, res) => {
  const { id } = req.params;
  const update = req.body;
  try {
    const updatedFee = await Fee.findByIdAndUpdate(id, update, { new: true });
    res.status(200).json(updatedFee);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const payInstallment = async (req, res) => {
  const { id } = req.params;
  const { amount, paymentMethod, isFullPayment } = req.body;

  try {
    const installment = await StudentFeeInstallment.findById(id);
    if (!installment) {
      return res.status(404).json({ message: 'Installment not found' });
    }

    const payAmount = isFullPayment ? (installment.installmentAmount - installment.paidAmount) : parseFloat(amount);
    
    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    installment.paidAmount += payAmount;
    installment.paymentDate = new Date();
    installment.paymentMethod = paymentMethod;
    
    if (installment.paidAmount >= installment.installmentAmount) {
      installment.paymentStatus = 'Paid';
    } else {
      installment.paymentStatus = 'Partial';
    }
    
    await installment.save();

    // Create Ledger entry
    const ledgerEntry = new Ledger({
      studentId: installment.studentId,
      installmentId: installment._id,
      installmentNumber: installment.installmentNumber,
      amount: payAmount,
      date: new Date(),
      paymentMethod: paymentMethod,
      installmentDueDate: installment.installmentDueDate,
      transactionType: 'Income',
      category: 'Student Fee',
      description: `Payment for Installment #${installment.installmentNumber}`
    });
    await ledgerEntry.save();

    const student = await Student.findById(installment.studentId);
    if (student) {
      student.fees.paid += payAmount;
      if (student.fees.paid >= student.fees.amount) {
        student.fees.status = 'Paid';
      } else {
        student.fees.status = 'Partial';
      }
      await student.save();
    }

    res.status(200).json(installment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
