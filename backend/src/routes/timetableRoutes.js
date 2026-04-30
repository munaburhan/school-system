import express from 'express';
import {
    getAllTimetableEntries,
    createTimetableEntry,
    deleteTimetableEntry,
    getTimetableByTeacher
} from '../controllers/timetableController.js';
import { authMiddleware, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/', checkPermission('staff', 'read'), getAllTimetableEntries);
router.get('/by-teacher', checkPermission('staff', 'read'), getTimetableByTeacher);
router.post('/', checkPermission('staff', 'write'), createTimetableEntry);
router.delete('/:id', checkPermission('staff', 'delete'), deleteTimetableEntry);

export default router;
