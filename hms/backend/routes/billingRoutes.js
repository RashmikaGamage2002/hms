import express from 'express';
import {
  generateInvoice,
  getBills,
  getBillById,
  makePayment,
  getBillingStats,
  getRevenueReport
} from '../controllers/billingController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/stats', getBillingStats);
router.get('/revenue-report', authorize('Admin'), getRevenueReport);
router.post('/invoice', authorize('Admin', 'Receptionist'), generateInvoice);
router.get('/', getBills);
router.get('/:id', getBillById);
router.post('/payment', authorize('Admin', 'Receptionist'), makePayment);

export default router;
