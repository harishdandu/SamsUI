import Fee from '../models/Fee.js';

export const getAllFees = async (req, res) => {
  try {
    const fees = await Fee.find().populate('studentId');
    res.status(200).json(fees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const collectFee = async (req, res) => {
  const feeRecord = req.body;
  // Generate a simple receipt number if not provided
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
