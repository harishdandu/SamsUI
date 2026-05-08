import LeaveRequest from '../models/LeaveRequest.js';
import Staff from '../models/Staff.js';

export const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const staffId = req.user.staffId;

    if (!staffId) {
      return res.status(400).json({ message: 'Staff ID not found in user profile' });
    }

    const newLeave = new LeaveRequest({
      staffId,
      leaveType,
      startDate,
      endDate,
      reason
    });

    await newLeave.save();
    res.status(201).json(newLeave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ staffId: req.user.staffId }).sort({ createdAt: -1 });
    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find().populate('staffId').sort({ createdAt: -1 });
    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateLeaveStatus = async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;
    const leave = await LeaveRequest.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // If approving, check and deduct balance
    if (status === 'Approved' && leave.status !== 'Approved') {
      const staff = await Staff.findById(leave.staffId);
      if (!staff) return res.status(404).json({ message: 'Staff not found' });

      // Calculate days
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      if (leave.leaveType === 'Unpaid Leave') {
        // For unpaid leaves, we just increment the count
        staff.unpaidLeaves = (staff.unpaidLeaves || 0) + diffDays;
      } else {
        const fieldMap = {
          'Casual Leave': 'casualLeaves',
          'Sick Leave': 'sickLeaves',
          'Other Leave': 'otherLeaves'
        };

        const balanceField = fieldMap[leave.leaveType];
        
        if (staff[balanceField] < diffDays) {
          return res.status(400).json({ message: `Insufficient ${leave.leaveType} balance. Required: ${diffDays}, Available: ${staff[balanceField]}` });
        }

        staff[balanceField] -= diffDays;
      }
      
      await staff.save();
    }

    leave.status = status;
    leave.adminRemarks = adminRemarks;
    await leave.save();

    res.status(200).json(leave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStaffLeavesByMonth = async (req, res) => {
  try {
    const { staffId, month, year } = req.query;
    if (!staffId || !month || !year) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, parseInt(month) + 1, 0);

    const leaves = await LeaveRequest.find({
      staffId,
      status: 'Approved',
      $or: [
        { startDate: { $gte: startDate, $lte: endDate } },
        { endDate: { $gte: startDate, $lte: endDate } }
      ]
    });

    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
