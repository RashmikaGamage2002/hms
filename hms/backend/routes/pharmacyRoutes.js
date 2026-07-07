import express from 'express';
import {
  getMedicines,
  getMedicineById,
  addMedicine,
  updateMedicine,
  getInventory,
  addInventory,
  dispenseMedicine,
  getLowStockMedicines,
  getExpiringMedicines,
  getPharmacyStats
} from '../controllers/pharmacyController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/stats', getPharmacyStats);
router.get('/low-stock', getLowStockMedicines);
router.get('/expiring', getExpiringMedicines);
router.get('/inventory', getInventory);
router.post('/inventory', authorize('Admin', 'Pharmacist'), addInventory);
router.get('/', getMedicines);
router.post('/', authorize('Admin', 'Pharmacist'), addMedicine);
router.get('/:id', getMedicineById);
router.put('/:id', authorize('Admin', 'Pharmacist'), updateMedicine);
router.post('/dispense', authorize('Admin', 'Pharmacist'), dispenseMedicine);

export default router;
