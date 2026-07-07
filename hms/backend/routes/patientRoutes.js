import express from 'express';
import {
  registerPatient,
  getPatients,
  getPatientById,
  updatePatient,
  addMedicalHistory,
  addAllergy,
  getPatientStats
} from '../controllers/patientController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/stats', getPatientStats);
router.post('/', authorize('Admin', 'Receptionist', 'Doctor'), registerPatient);
router.get('/', getPatients);
router.get('/:id', getPatientById);
router.put('/:id', authorize('Admin', 'Doctor', 'Receptionist'), updatePatient);
router.post('/:id/medical-history', authorize('Admin', 'Doctor'), addMedicalHistory);
router.post('/:id/allergy', authorize('Admin', 'Doctor'), addAllergy);

export default router;
