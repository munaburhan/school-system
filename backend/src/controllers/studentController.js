import pool from '../config/database.js';

export const getAllStudents = async (req, res) => {
    try {
        const { status, grade, search, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM students WHERE 1=1';
        const params = [];
        let paramCount = 0;

        if (status) {
            paramCount++;
            query += ` AND status = $${paramCount}`;
            params.push(status);
        }

        if (grade) {
            paramCount++;
            query += ` AND current_grade = $${paramCount}`;
            params.push(grade);
        }

        if (search) {
            paramCount++;
            query += ` AND (english_name ILIKE $${paramCount} OR arabic_name ILIKE $${paramCount} OR student_id ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        query += ' ORDER BY created_at DESC';

        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(limit);

        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(offset);

        const result = await pool.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM students WHERE 1=1';
        const countParams = [];
        let countParamCount = 0;

        if (status) {
            countParamCount++;
            countQuery += ` AND status = $${countParamCount}`;
            countParams.push(status);
        }

        if (grade) {
            countParamCount++;
            countQuery += ` AND current_grade = $${countParamCount}`;
            countParams.push(grade);
        }

        if (search) {
            countParamCount++;
            countQuery += ` AND (english_name ILIKE $${countParamCount} OR arabic_name ILIKE $${countParamCount} OR student_id ILIKE $${countParamCount})`;
            countParams.push(`%${search}%`);
        }

        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            students: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
};

export const getStudentById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query('SELECT * FROM students WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get student error:', error);
        res.status(500).json({ error: 'Failed to fetch student' });
    }
};

export const createStudent = async (req, res) => {
    try {
        const {
            student_id,
            english_name,
            arabic_name,
            current_grade,
            date_of_birth,
            status, // Add status
            contact_info,
            enrollment_date
        } = req.body;

        if (!student_id || !english_name) {
            return res.status(400).json({ error: 'Student ID and English name are required' });
        }

        const result = await pool.query(
            `INSERT INTO students (
                student_id, 
                english_name, 
                arabic_name, 
                current_grade, 
                date_of_birth, 
                status, 
                contact_info, 
                enrollment_date
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [
                student_id,
                english_name,
                arabic_name,
                current_grade,
                date_of_birth,
                status || 'active', // Default to active if missing
                contact_info,
                enrollment_date
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Student ID already exists' });
        }
        console.error('Create student error:', error);
        res.status(500).json({ error: 'Failed to create student' });
    }
};

export const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            student_id,
            english_name,
            arabic_name,
            current_grade,
            status,
            date_of_birth,
            contact_info,
            enrollment_date
        } = req.body;

        const result = await pool.query(
            `UPDATE students 
       SET student_id = COALESCE($1, student_id),
           english_name = COALESCE($2, english_name),
           arabic_name = COALESCE($3, arabic_name),
           current_grade = COALESCE($4, current_grade),
           status = COALESCE($5, status),
           date_of_birth = COALESCE($6, date_of_birth),
           contact_info = COALESCE($7, contact_info),
           enrollment_date = COALESCE($8, enrollment_date),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
            [student_id, english_name, arabic_name, current_grade, status, date_of_birth, contact_info, enrollment_date, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Student ID already exists' });
        }
        console.error('Update student error:', error);
        res.status(500).json({ error: 'Failed to update student' });
    }
};

export const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query('DELETE FROM students WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({ error: 'Failed to delete student' });
    }
};
