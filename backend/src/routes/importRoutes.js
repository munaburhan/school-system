import express from 'express';
import {
    importStudents,
    importStaff,
    downloadTemplate,
    uploadMiddleware
} from '../controllers/importController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(requireRole('admin'));

// Import routes
router.post('/students', uploadMiddleware, importStudents);
router.post('/staff', uploadMiddleware, importStaff);

// Download template routes
router.get('/template/:type', downloadTemplate);

export default router;
