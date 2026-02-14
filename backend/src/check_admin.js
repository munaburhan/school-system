import pool from './config/database.js';

const checkAdmin = async () => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
        if (result.rows.length === 0) {
            console.log('User admin NOT FOUND');
        } else {
            console.log('User admin FOUND:', result.rows[0]);
        }
    } catch (error) {
        console.error('Error querying database:', error);
    } finally {
        await pool.end();
    }
};

checkAdmin();
