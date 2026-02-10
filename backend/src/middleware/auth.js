import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

export const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const result = await pool.query(
            'SELECT id, username, role, email, is_active FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        if (!user.is_active) {
            return res.status(401).json({ error: 'User account is inactive' });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(500).json({ error: 'Authentication failed' });
    }
};

export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

export const checkPermission = (module, action) => {
    return async (req, res, next) => {
        try {
            const result = await pool.query(
                `SELECT can_read, can_write, can_delete 
         FROM permissions 
         WHERE role = $1 AND module = $2`,
                [req.user.role, module]
            );

            if (result.rows.length === 0) {
                return res.status(403).json({ error: 'No permissions found for this module' });
            }

            const permissions = result.rows[0];
            let hasPermission = false;

            switch (action) {
                case 'read':
                    hasPermission = permissions.can_read;
                    break;
                case 'write':
                    hasPermission = permissions.can_write;
                    break;
                case 'delete':
                    hasPermission = permissions.can_delete;
                    break;
                default:
                    hasPermission = false;
            }

            if (!hasPermission) {
                return res.status(403).json({ error: `You don't have permission to ${action} ${module}` });
            }

            next();
        } catch (error) {
            return res.status(500).json({ error: 'Permission check failed' });
        }
    };
};
