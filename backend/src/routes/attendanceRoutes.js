import express from 'express';
import {
    markAttendance,
    getAttendance,
    getAttendanceStats
} from '../controllers/attendanceController.js';
import { authMiddleware, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.post('/', checkPermission('attendance', 'write'), markAttendance);
router.get('/', checkPermission('attendance', 'read'), getAttendance);
router.get('/stats', checkPermission('attendance', 'read'), getAttendanceStats);

export default router;
