import pool from './database.js';
import bcrypt from 'bcryptjs';

const seedDefaultUsers = async () => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Hash default password
        const defaultPassword = await bcrypt.hash('admin123', 10);

        // Insert default admin user
        await client.query(`
      INSERT INTO users (username, password_hash, role, email, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (username) DO NOTHING
    `, ['admin', defaultPassword, 'admin', 'admin@school.com', true]);

        console.log('✓ Default admin user created (username: admin, password: admin123)');

        // Insert default permissions for all roles
        const roles = ['admin', 'principal', 'vice_principal', 'leader', 'teacher', 'student'];
        const modules = ['students', 'staff', 'attendance', 'timetable', 'behavior', 'exams', 'analytics', 'permissions'];

        for (const role of roles) {
            for (const module of modules) {
                let canRead = false;
                let canWrite = false;
                let canDelete = false;

                // Admin has full access
                if (role === 'admin') {
                    canRead = true;
                    canWrite = true;
                    canDelete = true;
                }
                // Principal and Vice Principal have read-only access
                else if (role === 'principal' || role === 'vice_principal') {
                    canRead = true;
                }
                // Leader has wide read access, limited write
                else if (role === 'leader') {
                    canRead = true;
                    if (['attendance', 'behavior'].includes(module)) {
                        canWrite = true;
                    }
                }
                // Teacher has limited access
                else if (role === 'teacher') {
                    if (['students', 'attendance', 'exams', 'behavior'].includes(module)) {
                        canRead = true;
                    }
                    if (['attendance', 'exams'].includes(module)) {
                        canWrite = true;
                    }
                }
                // Student has minimal access
                else if (role === 'student') {
                    if (['attendance', 'exams', 'timetable'].includes(module)) {
                        canRead = true;
                    }
                }

                await client.query(`
          INSERT INTO permissions (role, module, can_read, can_write, can_delete)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (role, module) DO UPDATE
          SET can_read = $3, can_write = $4, can_delete = $5
        `, [role, module, canRead, canWrite, canDelete]);
            }
        }

        console.log('✓ Default permissions created for all roles');

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error seeding data:', error);
        throw error;
    } finally {
        client.release();
    }
};

// Run seed
seedDefaultUsers()
    .then(() => {
        console.log('Seeding completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Seeding failed:', error);
        process.exit(1);
    });
