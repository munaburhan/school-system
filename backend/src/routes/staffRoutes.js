import express from 'express';
import {
    getAllStaff,
    getStaffById,
    createStaff,
    updateStaff,
    deleteStaff
} from '../controllers/staffController.js';
import { authMiddleware, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/', checkPermission('staff', 'read'), getAllStaff);
router.get('/:id', checkPermission('staff', 'read'), getStaffById);
router.post('/', checkPermission('staff', 'write'), createStaff);
router.put('/:id', checkPermission('staff', 'write'), updateStaff);
router.delete('/:id', checkPermission('staff', 'delete'), deleteStaff);

export default router;
