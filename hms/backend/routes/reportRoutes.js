import express from 'express';
import {
  getPatientLoadReport,
  getRevenueReport,
  getMonthlyRevenue,
  getInventoryReport,
  getAppointmentReport,
  getPatientDemographicsReport,
  getDashboardSummary
} from '../controllers/reportController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/dashboard', getDashboardSummary);
router.get('/patient-load', authorize('Admin'), getPatientLoadReport);
router.get('/revenue', authorize('Admin'), getRevenueReport);
router.get('/monthly-revenue', authorize('Admin'), getMonthlyRevenue);
router.get('/inventory', authorize('Admin', 'Pharmacist'), getInventoryReport);
router.get('/appointments', authorize('Admin'), getAppointmentReport);
router.get('/demographics', authorize('Admin'), getPatientDemographicsReport);

export default router;
