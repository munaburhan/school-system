import express from 'express';
import {
    getAllAssignments,
    getAssignmentsByTeacher,
    createAssignment,
    deleteAssignment
} from '../controllers/teacherAssignmentController.js';
import { authMiddleware, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/', checkPermission('staff', 'read'), getAllAssignments);
router.get('/teacher/:teacherId', checkPermission('staff', 'read'), getAssignmentsByTeacher);
router.post('/', checkPermission('staff', 'write'), createAssignment);
router.delete('/:id', checkPermission('staff', 'delete'), deleteAssignment);

export default router;
