import Student from '../models/Student.js';
import StudentFeeInstallment from '../models/StudentFeeInstallment.js';
import Ledger from '../models/Ledger.js';
import Staff from '../models/Staff.js';
import Attendance from '../models/Attendance.js';

export const getAllStudents = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      return res.status(400).json({ message: 'User is not affiliated with any school.' });
    }

    let query = { schoolId };
    
    // Search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { parentName: searchRegex },
        { phoneNumber: searchRegex }
      ];
    }

    // Class and Section Filters
    if (req.query.class) {
      query.class = req.query.class;
    }
    if (req.query.section) {
      query.section = req.query.section;
    }

    // Role-based filtering for teachers (only show students in their assigned classes)
    if (req.user.role === 'Teacher' && req.user.staffId) {
      const staffMember = await Staff.findById(req.user.staffId);
      if (staffMember && staffMember.teachingSubjects) {
        const assignedClasses = [...new Set(
          staffMember.teachingSubjects.flatMap(sub => sub.classes)
        )];
        
        if (assignedClasses.length > 0) {
          if (req.query.class) {
            if (assignedClasses.includes(req.query.class)) {
              query.class = req.query.class;
            } else {
              return res.status(200).json({ students: [], total: 0, page: 1, totalPages: 0 });
            }
          } else {
            query.class = { $in: assignedClasses };
          }
        } else {
          return res.status(200).json({ students: [], total: 0, page: 1, totalPages: 0 });
        }
      }
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      students,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentsForAttendance = async (req, res) => {
  const { class: className, section, date } = req.query;
  
  if (!className || !section || !date) {
    return res.status(400).json({ message: 'Class, section and date are required.' });
  }

  try {
    const schoolId = req.user.schoolId;
    
    // 1. Get all students for the class and section (excluding sensitive fee data)
    const students = await Student.find(
      { schoolId, class: className, section: section }, 
      { fees: 0 }
    ).sort({ rollNumber: 1 });
    
    if (students.length === 0) {
      return res.status(200).json([]);
    }

    // 2. Get attendance records for these students on the specific date
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const attendanceRecords = await Attendance.find({
      class: className,
      section: section,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    // 3. Merge attendance status into student objects
    const studentsWithAttendance = students.map(student => {
      const attendance = attendanceRecords.find(rec => rec.studentId.toString() === student._id.toString());
      return {
        ...student.toObject(),
        attendanceStatus: attendance ? attendance.status : null
      };
    });

    res.status(200).json(studentsWithAttendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createStudent = async (req, res) => {
  const { installments, ...studentData } = req.body;
  
  try {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      return res.status(400).json({ message: 'User is not affiliated with any school.' });
    }

    const newStudent = new Student({ ...studentData, schoolId });
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

export const bulkRegister = async (req, res) => {
  const studentsData = req.body; // Array of student objects
  
  if (!Array.isArray(studentsData)) {
    return res.status(400).json({ message: 'Data must be an array of students.' });
  }

  try {
    const schoolId = req.user.schoolId;
    const results = [];

    for (const studentData of studentsData) {
      const newStudent = new Student({ ...studentData, schoolId });
      await newStudent.save();

      // Generate installments (Logic from createStudent fallback)
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
          paymentMethod: isFirst ? (studentData.paymentMethod || 'CASH') : null
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
          description: `Bulk Registration Initial Payment - Installment #${inst.installmentNumber}`
        }));
      
      if (ledgerEntries.length > 0) {
        await Ledger.insertMany(ledgerEntries);
      }

      results.push(newStudent);
    }

    res.status(201).json({ 
      message: `${results.length} students registered successfully.`,
      students: results 
    });
  } catch (error) {
    console.error('Bulk registration error:', error);
    res.status(500).json({ message: error.message });
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
