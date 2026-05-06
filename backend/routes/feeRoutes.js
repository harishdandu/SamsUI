import express from 'express';
import { getAllFees, collectFee, updateFeeStatus, getPendingFees, payInstallment } from '../controllers/feeController.js';

const router = express.Router();

router.get('/', getAllFees);
router.get('/pending', getPendingFees);
router.put('/installments/:id/pay', payInstallment);
router.post('/', collectFee);
router.put('/:id', updateFeeStatus);

export default router;
