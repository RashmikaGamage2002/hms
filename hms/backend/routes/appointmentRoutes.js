import express from 'express';
import {
  bookAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
  getTodaysAppointments,
  getAppointmentStats
} from '../controllers/appointmentController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/stats', getAppointmentStats);
router.get('/today', getTodaysAppointments);
router.post('/', authorize('Admin', 'Receptionist', 'Doctor'), bookAppointment);
router.get('/', getAppointments);
router.get('/:id', getAppointmentById);
router.patch('/:id/status', authorize('Admin', 'Doctor', 'Receptionist'), updateAppointmentStatus);
router.post('/:id/cancel', authorize('Admin', 'Receptionist'), cancelAppointment);

export default router;
