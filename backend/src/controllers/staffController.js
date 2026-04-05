import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

// Map staff_category to the permission role used in the system
const categoryToRole = (category) => {
    if (!category) return 'teacher';
    const cat = category.toLowerCase();
    if (cat === 'teacher') return 'teacher';
    if (cat === 'principal') return 'principal';
    if (cat === 'vice principal') return 'vice_principal';
    if (cat === 'hod' || cat === 'hos') return 'leader';
    // All admin variants and IT
    return 'admin';
};

export const getAllStaff = async (req, res) => {
    try {
        const { role, category, search, page = 1, limit = 50 } = req.query;
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

        if (category) {
            paramCount++;
            query += ` AND s.staff_category = $${paramCount}`;
            params.push(category);
        }

        if (search) {
            paramCount++;
            query += ` AND (s.english_name ILIKE $${paramCount} OR s.arabic_name ILIKE $${paramCount} OR s.staff_id ILIKE $${paramCount})`;
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

        if (category) {
            countParamCount++;
            countQuery += ` AND s.staff_category = $${countParamCount}`;
            countParams.push(category);
        }

        if (search) {
            countParamCount++;
            countQuery += ` AND (s.english_name ILIKE $${countParamCount} OR s.arabic_name ILIKE $${countParamCount} OR s.staff_id ILIKE $${countParamCount})`;
            countParams.push(`%${search}%`);
        }

        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            data: result.rows,
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

// Get only teachers (for teacher assignment dropdown)
export const getTeachers = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT s.id, s.staff_id, s.english_name, s.arabic_name, s.staff_category
       FROM staff s
       WHERE LOWER(s.staff_category) = 'teacher'
       ORDER BY s.english_name ASC`
        );

        res.json({ data: result.rows });
    } catch (error) {
        console.error('Get teachers error:', error);
        res.status(500).json({ error: 'Failed to fetch teachers' });
    }
};

export const createStaff = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const {
            staff_id,
            english_name,
            arabic_name,
            staff_category,
            joining_date,
            email
        } = req.body;

        if (!staff_id || !english_name || !staff_category) {
            return res.status(400).json({ error: 'Staff ID, English name, and staff category are required' });
        }

        // Determine the permission role from the category
        const role = categoryToRole(staff_category);

        // Auto-generate username and default password
        const username = `staff_${staff_id}`;
        const defaultPassword = 'staff123';
        const password_hash = await bcrypt.hash(defaultPassword, 10);

        // Create user account
        const userResult = await client.query(
            `INSERT INTO users (username, password_hash, role, email)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
            [username, password_hash, role, email || null]
        );

        const userId = userResult.rows[0].id;

        // Create staff record
        const staffResult = await client.query(
            `INSERT INTO staff (user_id, staff_id, english_name, arabic_name, role, staff_category, joining_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [userId, staff_id, english_name, arabic_name || null, role, staff_category, joining_date || null]
        );

        await client.query('COMMIT');

        // Return the staff record with email
        const staffRecord = staffResult.rows[0];
        staffRecord.email = email || null;
        staffRecord.username = username;

        res.status(201).json(staffRecord);
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') {
            if (error.constraint?.includes('staff_id')) {
                return res.status(400).json({ error: 'Staff ID already exists' });
            }
            return res.status(400).json({ error: 'Username or Staff ID already exists' });
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
            staff_category,
            joining_date,
            email
        } = req.body;

        // Update staff record
        const role = staff_category ? categoryToRole(staff_category) : null;

        const result = await pool.query(
            `UPDATE staff 
       SET english_name = COALESCE($1, english_name),
           arabic_name = COALESCE($2, arabic_name),
           role = COALESCE($3, role),
           staff_category = COALESCE($4, staff_category),
           joining_date = COALESCE($5, joining_date),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
            [english_name, arabic_name, role, staff_category, joining_date, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Staff member not found' });
        }

        // Also update user email if provided
        if (email && result.rows[0].user_id) {
            await pool.query(
                'UPDATE users SET email = $1 WHERE id = $2',
                [email, result.rows[0].user_id]
            );
        }

        // Also update user role if category changed
        if (role && result.rows[0].user_id) {
            await pool.query(
                'UPDATE users SET role = $1 WHERE id = $2',
                [role, result.rows[0].user_id]
            );
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

        // Get the user_id before deleting so we can clean up the user account too
        const staffResult = await pool.query('SELECT user_id FROM staff WHERE id = $1', [id]);

        if (staffResult.rows.length === 0) {
            return res.status(404).json({ error: 'Staff member not found' });
        }

        const userId = staffResult.rows[0].user_id;

        // Delete staff record (teacher_assignments will cascade)
        await pool.query('DELETE FROM staff WHERE id = $1', [id]);

        // Delete user account if exists
        if (userId) {
            await pool.query('DELETE FROM users WHERE id = $1', [userId]);
        }

        res.json({ message: 'Staff member deleted successfully' });
    } catch (error) {
        console.error('Delete staff error:', error);
        res.status(500).json({ error: 'Failed to delete staff member' });
    }
};
