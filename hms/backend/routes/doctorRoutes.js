import express from 'express';
import {
  getDoctors,
  getDoctorById,
  getDoctorSchedule,
  setDoctorSchedule,
  getDepartmentHeads,
  getDoctorStats
} from '../controllers/doctorController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/department-heads', getDepartmentHeads);
router.get('/', getDoctors);
router.get('/:id', getDoctorById);
router.get('/:id/schedule', getDoctorSchedule);
router.put('/:id/schedule', authorize('Admin', 'Doctor'), setDoctorSchedule);
router.get('/:id/stats', getDoctorStats);

export default router;
