import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

export const getAllStaff = async (req, res) => {
    try {
        const { role, search, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
      SELECT s.*, u.username, u.email, u.is_active 
      FROM staff s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
        const params = [];
        let paramCount = 0;

        if (role) {
            paramCount++;
            query += ` AND s.role = $${paramCount}`;
            params.push(role);
        }

        if (search) {
            paramCount++;
            query += ` AND (s.english_name ILIKE $${paramCount} OR s.arabic_name ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        query += ' ORDER BY s.created_at DESC';

        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(limit);

        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(offset);

        const result = await pool.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM staff s WHERE 1=1';
        const countParams = [];
        let countParamCount = 0;

        if (role) {
            countParamCount++;
            countQuery += ` AND s.role = $${countParamCount}`;
            countParams.push(role);
        }

        if (search) {
            countParamCount++;
            countQuery += ` AND (s.english_name ILIKE $${countParamCount} OR s.arabic_name ILIKE $${countParamCount})`;
            countParams.push(`%${search}%`);
        }

        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            staff: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get staff error:', error);
        res.status(500).json({ error: 'Failed to fetch staff' });
    }
};

export const getStaffById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT s.*, u.username, u.email, u.is_active 
       FROM staff s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Staff member not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get staff error:', error);
        res.status(500).json({ error: 'Failed to fetch staff member' });
    }
};

export const createStaff = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const {
            username,
            password,
            email,
            english_name,
            arabic_name,
            role,
            department,
            hire_date,
            contact_info
        } = req.body;

        if (!username || !password || !english_name || !role) {
            return res.status(400).json({ error: 'Username, password, English name, and role are required' });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Create user account
        const userResult = await client.query(
            `INSERT INTO users (username, password_hash, role, email)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
            [username, password_hash, role, email]
        );

        const userId = userResult.rows[0].id;

        // Create staff record
        const staffResult = await client.query(
            `INSERT INTO staff (user_id, english_name, arabic_name, role, department, hire_date, contact_info)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [userId, english_name, arabic_name, role, department, hire_date, contact_info]
        );

        await client.query('COMMIT');

        res.status(201).json(staffResult.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Username already exists' });
        }
        console.error('Create staff error:', error);
        res.status(500).json({ error: 'Failed to create staff member' });
    } finally {
        client.release();
    }
};

export const updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            english_name,
            arabic_name,
            role,
            department,
            hire_date,
            contact_info
        } = req.body;

        const result = await pool.query(
            `UPDATE staff 
       SET english_name = COALESCE($1, english_name),
           arabic_name = COALESCE($2, arabic_name),
           role = COALESCE($3, role),
           department = COALESCE($4, department),
           hire_date = COALESCE($5, hire_date),
           contact_info = COALESCE($6, contact_info),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
            [english_name, arabic_name, role, department, hire_date, contact_info, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Staff member not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update staff error:', error);
        res.status(500).json({ error: 'Failed to update staff member' });
    }
};

export const deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query('DELETE FROM staff WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Staff member not found' });
        }

        res.json({ message: 'Staff member deleted successfully' });
    } catch (error) {
        console.error('Delete staff error:', error);
        res.status(500).json({ error: 'Failed to delete staff member' });
    }
};
