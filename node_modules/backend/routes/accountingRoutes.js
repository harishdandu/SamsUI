import express from 'express';
import { getTransactions, addTransaction, getProfitLoss } from '../controllers/accountingController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.get('/transactions', protect, restrictTo('Super Admin', 'Accountant'), getTransactions);
router.post('/transactions', protect, restrictTo('Super Admin', 'Accountant'), addTransaction);
router.get('/profit-loss', protect, restrictTo('Super Admin', 'Accountant'), getProfitLoss);

export default router;
