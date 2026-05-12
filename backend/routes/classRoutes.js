import express from 'express';
import { getAllClasses, upsertClass, deleteClass, bulkUpsertClasses } from '../controllers/classController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getAllClasses);
router.post('/', restrictTo('Admin'), upsertClass);
router.post('/bulk', restrictTo('Admin'), bulkUpsertClasses);
router.delete('/:id', restrictTo('Admin'), deleteClass);

export default router;
