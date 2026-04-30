import Ledger from '../models/Ledger.js';

export const getTransactions = async (req, res) => {
  try {
    const transactions = await Ledger.find().sort({ date: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addTransaction = async (req, res) => {
  const transaction = req.body;
  const newTransaction = new Ledger({
    ...transaction,
    createdBy: req.user._id
  });
  try {
    await newTransaction.save();
    res.status(201).json(newTransaction);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const getProfitLoss = async (req, res) => {
  try {
    const summary = await Ledger.aggregate([
      {
        $group: {
          _id: '$transactionType',
          total: { $sum: '$amount' }
        }
      }
    ]);

    const result = {
      Income: 0,
      Expense: 0,
      Profit: 0
    };

    summary.forEach(item => {
      result[item._id] = item.total;
    });

    result.Profit = result.Income - result.Expense;

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
