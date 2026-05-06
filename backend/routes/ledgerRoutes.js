import express from 'express';
import { getAllLedgerEntries } from '../controllers/ledgerController.js';

const router = express.Router();

router.get('/', getAllLedgerEntries);

export default router;
