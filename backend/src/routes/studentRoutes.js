import express from 'express';
import {
    getAllStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent
} from '../controllers/studentController.js';
import { authMiddleware, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/', checkPermission('students', 'read'), getAllStudents);
router.get('/:id', checkPermission('students', 'read'), getStudentById);
router.post('/', checkPermission('students', 'write'), createStudent);
router.put('/:id', checkPermission('students', 'write'), updateStudent);
router.delete('/:id', checkPermission('students', 'delete'), deleteStudent);

export default router;
