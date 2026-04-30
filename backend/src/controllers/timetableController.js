import pool from '../config/database.js';

export const getAllTimetableEntries = async (req, res) => {
    try {
        const { grade, section, day_of_week, teacher_id } = req.query;

        let query = `
            SELECT t.*, s.english_name as teacher_name, s.arabic_name as teacher_arabic_name, s.staff_id as teacher_staff_id
            FROM timetable t
            LEFT JOIN staff s ON t.teacher_id = s.id
            WHERE 1=1
        `;
        const params = [];

        if (grade) {
            params.push(grade);
            query += ` AND t.grade = $${params.length}`;
        }
        if (section) {
            params.push(section);
            query += ` AND t.section = $${params.length}`;
        }
        if (day_of_week !== undefined && day_of_week !== '') {
            params.push(day_of_week);
            query += ` AND t.day_of_week = $${params.length}`;
        }
        if (teacher_id) {
            params.push(teacher_id);
            query += ` AND t.teacher_id = $${params.length}`;
        }

        query += ` ORDER BY t.day_of_week ASC, t.period_number ASC, t.grade ASC`;

        const result = await pool.query(query, params);
        res.json({ data: result.rows });
    } catch (error) {
        console.error('Get timetable error:', error);
        res.status(500).json({ error: 'Failed to fetch timetable entries' });
    }
};

export const createTimetableEntry = async (req, res) => {
    try {
        const { grade, section, day_of_week, period_number, subject, teacher_id, start_time, end_time, room_number } = req.body;

        if (!grade || day_of_week === undefined || !period_number || !subject || !start_time || !end_time) {
            return res.status(400).json({ error: 'Grade, day, period, subject, start time, and end time are required' });
        }

        // Check for conflict: same grade/section/day/period
        const conflict = await pool.query(
            `SELECT id FROM timetable 
             WHERE grade = $1 AND COALESCE(section, '') = COALESCE($2, '') 
             AND day_of_week = $3 AND period_number = $4`,
            [grade, section || null, day_of_week, period_number]
        );

        if (conflict.rows.length > 0) {
            return res.status(400).json({ error: 'A class is already scheduled for this grade/section at this day and period' });
        }

        // Check teacher conflict: same teacher, same day, same period
        if (teacher_id) {
            const teacherConflict = await pool.query(
                `SELECT id FROM timetable 
                 WHERE teacher_id = $1 AND day_of_week = $2 AND period_number = $3`,
                [teacher_id, day_of_week, period_number]
            );

            if (teacherConflict.rows.length > 0) {
                return res.status(400).json({ error: 'This teacher is already scheduled for another class at this day and period' });
            }
        }

        const result = await pool.query(
            `INSERT INTO timetable (grade, section, day_of_week, period_number, subject, teacher_id, start_time, end_time, room_number)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [grade, section || null, day_of_week, period_number, subject, teacher_id || null, start_time, end_time, room_number || null]
        );

        // Fetch with teacher info
        const fullResult = await pool.query(
            `SELECT t.*, s.english_name as teacher_name, s.arabic_name as teacher_arabic_name, s.staff_id as teacher_staff_id
             FROM timetable t
             LEFT JOIN staff s ON t.teacher_id = s.id
             WHERE t.id = $1`,
            [result.rows[0].id]
        );

        res.status(201).json(fullResult.rows[0]);
    } catch (error) {
        console.error('Create timetable entry error:', error);
        res.status(500).json({ error: 'Failed to create timetable entry' });
    }
};

export const deleteTimetableEntry = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM timetable WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Timetable entry not found' });
        }

        res.json({ message: 'Timetable entry deleted successfully' });
    } catch (error) {
        console.error('Delete timetable entry error:', error);
        res.status(500).json({ error: 'Failed to delete timetable entry' });
    }
};

// Get timetable grouped by teacher (for the teacher-centric view)
// Uses LEFT JOIN so entries without a teacher are still included
export const getTimetableByTeacher = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT t.*, s.english_name as teacher_name, s.arabic_name as teacher_arabic_name, s.staff_id as teacher_staff_id
             FROM timetable t
             LEFT JOIN staff s ON t.teacher_id = s.id
             ORDER BY s.english_name ASC NULLS LAST, t.day_of_week ASC, t.period_number ASC`
        );

        res.json({ data: result.rows });
    } catch (error) {
        console.error('Get timetable by teacher error:', error);
        res.status(500).json({ error: 'Failed to fetch timetable by teacher' });
    }
};

// Ensure the timetable table exists (safe to call on every startup)
export const initTimetableTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS timetable (
                id SERIAL PRIMARY KEY,
                grade VARCHAR(10) NOT NULL,
                section VARCHAR(5),
                day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
                period_number INTEGER NOT NULL,
                subject VARCHAR(100) NOT NULL,
                teacher_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                room_number VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Timetable table ready');
    } catch (error) {
        console.error('❌ Failed to init timetable table:', error.message);
    }
};
