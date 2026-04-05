import pool from '../config/database.js';

export const getAllAssignments = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT ta.*, s.english_name as teacher_name, s.arabic_name as teacher_arabic_name, s.staff_id as teacher_staff_id
       FROM teacher_assignments ta
       JOIN staff s ON ta.teacher_id = s.id
       ORDER BY s.english_name ASC, ta.grade ASC, ta.section ASC`
        );

        res.json({ data: result.rows });
    } catch (error) {
        console.error('Get assignments error:', error);
        res.status(500).json({ error: 'Failed to fetch teacher assignments' });
    }
};

export const getAssignmentsByTeacher = async (req, res) => {
    try {
        const { teacherId } = req.params;

        const result = await pool.query(
            `SELECT ta.*, s.english_name as teacher_name, s.staff_id as teacher_staff_id
       FROM teacher_assignments ta
       JOIN staff s ON ta.teacher_id = s.id
       WHERE ta.teacher_id = $1
       ORDER BY ta.grade ASC, ta.section ASC`,
            [teacherId]
        );

        res.json({ data: result.rows });
    } catch (error) {
        console.error('Get assignments by teacher error:', error);
        res.status(500).json({ error: 'Failed to fetch teacher assignments' });
    }
};

export const createAssignment = async (req, res) => {
    try {
        const { teacher_id, subject, grade, section, academic_year } = req.body;

        if (!teacher_id || !subject || !grade) {
            return res.status(400).json({ error: 'Teacher, subject, and grade are required' });
        }

        // Check for duplicate assignment
        const existing = await pool.query(
            `SELECT id FROM teacher_assignments 
       WHERE teacher_id = $1 AND subject = $2 AND grade = $3 AND COALESCE(section, '') = COALESCE($4, '')`,
            [teacher_id, subject, grade, section || null]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'This teacher is already assigned to this subject/grade/section' });
        }

        const result = await pool.query(
            `INSERT INTO teacher_assignments (teacher_id, subject, grade, section, academic_year)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [teacher_id, subject, grade, section || null, academic_year || null]
        );

        // Fetch the full record with teacher name
        const fullResult = await pool.query(
            `SELECT ta.*, s.english_name as teacher_name, s.arabic_name as teacher_arabic_name, s.staff_id as teacher_staff_id
       FROM teacher_assignments ta
       JOIN staff s ON ta.teacher_id = s.id
       WHERE ta.id = $1`,
            [result.rows[0].id]
        );

        res.status(201).json(fullResult.rows[0]);
    } catch (error) {
        console.error('Create assignment error:', error);
        res.status(500).json({ error: 'Failed to create teacher assignment' });
    }
};

export const deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM teacher_assignments WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        res.json({ message: 'Assignment deleted successfully' });
    } catch (error) {
        console.error('Delete assignment error:', error);
        res.status(500).json({ error: 'Failed to delete assignment' });
    }
};
