import express from 'express';
import { login, register, getProfile, changePassword, logout, refreshToken } from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/refresh-token', refreshToken);

// Admin only - register new users
router.post('/register', authenticate, authorize('Admin'), register);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/change-password', authenticate, changePassword);
router.post('/logout', authenticate, logout);

export default router;
