import express from 'express';
import {
  getWards,
  getWardById,
  addWard,
  addBed,
  assignBed,
  releaseBed,
  getBedAssignments,
  getWardStats
} from '../controllers/wardController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/stats', getWardStats);
router.get('/', getWards);
router.post('/', authorize('Admin'), addWard);
router.post('/bed', authorize('Admin', 'Receptionist'), addBed);
router.get('/:id', getWardById);
router.get('/assignments/list', getBedAssignments);
router.post('/assign', authorize('Admin', 'Receptionist', 'Doctor'), assignBed);
router.post('/release/:assignmentId', authorize('Admin', 'Doctor', 'Receptionist'), releaseBed);

export default router;
