import express from 'express';
import { getAllClasses, upsertClass, deleteClass, bulkUpsertClasses } from '../controllers/classController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getAllClasses);
router.post('/', restrictTo('Super Admin', 'Admin'), upsertClass);
router.post('/bulk', restrictTo('Super Admin', 'Admin'), bulkUpsertClasses);
router.delete('/:id', restrictTo('Super Admin', 'Admin'), deleteClass);

export default router;
