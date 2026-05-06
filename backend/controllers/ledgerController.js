import Ledger from '../models/Ledger.js';
import Student from '../models/Student.js';

export const getAllLedgerEntries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { search = '' } = req.query;

    let query = {};

    if (search) {
      // Find students matching the search term
      const students = await Student.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      const studentIds = students.map(s => s._id);
      query.studentId = { $in: studentIds };
    }

    const entries = await Ledger.find(query)
      .populate('studentId', 'firstName lastName class section')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const totalRecords = await Ledger.countDocuments(query);

    res.status(200).json({
      data: entries,
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
