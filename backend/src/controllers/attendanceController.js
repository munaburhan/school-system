import pool from '../config/database.js';

export const markAttendance = async (req, res) => {
    try {
        const { student_id, date, status, notes } = req.body;

        if (!student_id || !date || !status) {
            return res.status(400).json({ error: 'Student ID, date, and status are required' });
        }

        const result = await pool.query(
            `INSERT INTO attendance (student_id, date, status, marked_by, notes)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (student_id, date) 
       DO UPDATE SET status = $3, marked_by = $4, notes = $5, created_at = CURRENT_TIMESTAMP
       RETURNING *`,
            [student_id, date, status, req.user.id, notes]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Mark attendance error:', error);
        res.status(500).json({ error: 'Failed to mark attendance' });
    }
};

export const getAttendance = async (req, res) => {
    try {
        const { student_id, date, status, start_date, end_date, page = 1, limit = 100 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
      SELECT a.*, s.english_name, s.arabic_name, s.student_id as student_number, s.current_grade,
             u.username as marked_by_username
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      LEFT JOIN users u ON a.marked_by = u.id
      WHERE 1=1
    `;
        const params = [];
        let paramCount = 0;

        if (student_id) {
            paramCount++;
            query += ` AND a.student_id = $${paramCount}`;
            params.push(student_id);
        }

        if (date) {
            paramCount++;
            query += ` AND a.date = $${paramCount}`;
            params.push(date);
        }

        if (status) {
            paramCount++;
            query += ` AND a.status = $${paramCount}`;
            params.push(status);
        }

        if (start_date) {
            paramCount++;
            query += ` AND a.date >= $${paramCount}`;
            params.push(start_date);
        }

        if (end_date) {
            paramCount++;
            query += ` AND a.date <= $${paramCount}`;
            params.push(end_date);
        }

        query += ' ORDER BY a.date DESC, s.english_name ASC';

        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(limit);

        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(offset);

        const result = await pool.query(query, params);

        res.json({ attendance: result.rows });
    } catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
};

export const getAttendanceStats = async (req, res) => {
    try {
        const { start_date, end_date, grade } = req.query;
        const params = [];
        const conditions = ['1=1'];
        let paramCount = 0;

        if (start_date) {
            paramCount++;
            conditions.push(`a.date >= $${paramCount}`);
            params.push(start_date);
        }

        if (end_date) {
            paramCount++;
            conditions.push(`a.date <= $${paramCount}`);
            params.push(end_date);
        }

        if (grade) {
            paramCount++;
            conditions.push(`s.current_grade = $${paramCount}`);
            params.push(grade);
        }

        const query = `
            SELECT 
                COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
                COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
                COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
                COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as excused_count,
                COUNT(*) as total_records
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            WHERE ${conditions.join(' AND ')}
        `;

        const result = await pool.query(query, params);

        res.json(result.rows[0] || {
            present_count: 0,
            absent_count: 0,
            late_count: 0,
            excused_count: 0,
            total_records: 0
        });
    } catch (error) {
        console.error('Get attendance stats error:', error);
        // Keep detailed error logging enabled for now
        console.error('Stack:', error.stack);
        res.status(500).json({ error: 'Failed to fetch attendance statistics', details: error.message });
    }
};
