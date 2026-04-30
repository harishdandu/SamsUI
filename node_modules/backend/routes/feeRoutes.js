import express from 'express';
import { getAllFees, collectFee, updateFeeStatus } from '../controllers/feeController.js';

const router = express.Router();

router.get('/', getAllFees);
router.post('/', collectFee);
router.put('/:id', updateFeeStatus);

export default router;
