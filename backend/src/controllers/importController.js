import multer from 'multer';
import xlsx from 'xlsx';
import pool from '../config/database.js';
import path from 'path';
import fs from 'fs';

// Helper function to parse dates in multiple formats
const parseDate = (dateValue) => {
    if (!dateValue) return null;

    // If it's already a Date object from Excel
    if (dateValue instanceof Date) {
        return dateValue.toISOString().split('T')[0];
    }

    // If it's a number (Excel serial date)
    if (typeof dateValue === 'number') {
        const date = new Date((dateValue - 25569) * 86400 * 1000);
        return date.toISOString().split('T')[0];
    }

    // If it's a string, try to parse it
    if (typeof dateValue === 'string') {
        // Try YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
            return dateValue;
        }

        // Try DD/MM/YYYY format
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) {
            const [day, month, year] = dateValue.split('/');
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }

        // Try MM/DD/YYYY format
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateValue)) {
            const parts = dateValue.split('/');
            if (parts[0] > 12) {
                // Likely DD/MM/YYYY
                const [day, month, year] = parts;
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            } else {
                // Likely MM/DD/YYYY
                const [month, day, year] = parts;
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
        }

        // Try to parse as a general date
        const parsed = new Date(dateValue);
        if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split('T')[0];
        }
    }

    return null;
};

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.xlsx', '.xls', '.csv'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel and CSV files are allowed'));
        }
    }
});

export const uploadMiddleware = upload.single('file');

export const importStudents = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Read the Excel file
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return res.status(400).json({ error: 'Excel file is empty' });
        }

        const results = {
            total: data.length,
            successful: 0,
            failed: 0,
            errors: []
        };

        // Import each student
        for (let i = 0; i < data.length; i++) {
            const row = data[i];

            try {
                // Map Excel columns to database fields
                // Expected columns: student_id, english_name, arabic_name, current_grade, date_of_birth, status
                const studentData = {
                    student_id: row.student_id || row['Student ID'] || row['ID'],
                    english_name: row.english_name || row['English Name'] || row['Name'],
                    arabic_name: row.arabic_name || row['Arabic Name'] || '',
                    current_grade: row.current_grade || row['Grade'] || row['Current Grade'],
                    date_of_birth: parseDate(row.date_of_birth || row['Date of Birth'] || row['DOB']),
                    status: row.status || row['Status'] || 'active'
                };

                // Validate required fields
                if (!studentData.student_id || !studentData.english_name) {
                    results.failed++;
                    results.errors.push({
                        row: i + 2, // +2 because Excel rows start at 1 and we have a header
                        error: 'Missing required fields (student_id or english_name)',
                        data: row
                    });
                    continue;
                }

                // Insert into database
                await pool.query(
                    `INSERT INTO students (student_id, english_name, arabic_name, current_grade, date_of_birth, status)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (student_id) DO UPDATE
           SET english_name = $2, arabic_name = $3, current_grade = $4, date_of_birth = $5, status = $6`,
                    [
                        studentData.student_id,
                        studentData.english_name,
                        studentData.arabic_name,
                        studentData.current_grade,
                        studentData.date_of_birth,
                        studentData.status
                    ]
                );

                results.successful++;
            } catch (error) {
                results.failed++;
                results.errors.push({
                    row: i + 2,
                    error: error.message,
                    data: row
                });
            }
        }

        // Delete the uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
            message: 'Import completed',
            results
        });
    } catch (error) {
        console.error('Import error:', error);

        // Clean up file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ error: 'Failed to import students: ' + error.message });
    }
};

// Helper to map staff_category to permission role
const categoryToRole = (category) => {
    if (!category) return 'teacher';
    const cat = category.toLowerCase();
    if (cat === 'teacher') return 'teacher';
    if (cat === 'principal') return 'principal';
    if (cat === 'vice principal') return 'vice_principal';
    if (cat === 'hod' || cat === 'hos') return 'leader';
    return 'admin';
};

export const importStaff = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return res.status(400).json({ error: 'Excel file is empty' });
        }

        const results = {
            total: data.length,
            successful: 0,
            failed: 0,
            errors: []
        };

        const client = await pool.connect();

        for (let i = 0; i < data.length; i++) {
            const row = data[i];

            try {
                await client.query('BEGIN');

                const staffData = {
                    staff_id: String(row.staff_id || row['Staff ID'] || '').trim(),
                    english_name: String(row.english_name || row['English Name'] || row['Name'] || '').trim(),
                    arabic_name: String(row.arabic_name || row['Arabic Name'] || '').trim(),
                    staff_category: String(row.staff_category || row['Staff Category'] || row['Category'] || 'Teacher').trim(),
                    joining_date: parseDate(row.joining_date || row['Joining Date']),
                    email: String(row.email || row['Email'] || '').trim() || null
                };

                if (!staffData.staff_id || !staffData.english_name) {
                    results.failed++;
                    results.errors.push({
                        row: i + 2,
                        error: 'Missing required fields (staff_id or english_name)',
                        data: row
                    });
                    await client.query('ROLLBACK');
                    continue;
                }

                // Auto-generate username and default password (same as staffController)
                const username = `staff_${staffData.staff_id}`;
                const defaultPassword = 'staff123';
                const bcrypt = await import('bcryptjs');
                const password_hash = await bcrypt.default.hash(defaultPassword, 10);
                const role = categoryToRole(staffData.staff_category);

                // Upsert user account
                const userResult = await client.query(
                    `INSERT INTO users (username, password_hash, role, email)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (username) DO UPDATE
           SET role = EXCLUDED.role, email = EXCLUDED.email
           RETURNING id`,
                    [username, password_hash, role, staffData.email]
                );

                const userId = userResult.rows[0].id;

                // Upsert staff record using current schema
                await client.query(
                    `INSERT INTO staff (user_id, staff_id, english_name, arabic_name, role, staff_category, joining_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (staff_id) DO UPDATE
           SET english_name = EXCLUDED.english_name,
               arabic_name  = EXCLUDED.arabic_name,
               role         = EXCLUDED.role,
               staff_category = EXCLUDED.staff_category,
               joining_date = EXCLUDED.joining_date,
               updated_at   = CURRENT_TIMESTAMP`,
                    [userId, staffData.staff_id, staffData.english_name, staffData.arabic_name, role, staffData.staff_category, staffData.joining_date]
                );

                await client.query('COMMIT');
                results.successful++;
            } catch (error) {
                await client.query('ROLLBACK');
                results.failed++;
                results.errors.push({
                    row: i + 2,
                    error: error.message,
                    data: row
                });
            }
        }

        client.release();
        fs.unlinkSync(req.file.path);

        res.json({
            message: 'Import completed',
            results
        });
    } catch (error) {
        console.error('Import error:', error);

        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ error: 'Failed to import staff: ' + error.message });
    }
};

export const downloadTemplate = (req, res) => {
    const { type } = req.params;

    let template;

    if (type === 'students') {
        template = [
            {
                student_id: 'S001',
                english_name: 'John Smith',
                arabic_name: 'جون سميث',
                current_grade: 'Grade 10',
                date_of_birth: '2008-05-15',
                status: 'active'
            },
            {
                student_id: 'S002',
                english_name: 'Sarah Ahmed',
                arabic_name: 'سارة أحمد',
                current_grade: 'Grade 9',
                date_of_birth: '2009-03-20',
                status: 'active'
            }
        ];
    } else if (type === 'staff') {
        template = [
            {
                staff_id: 'T001',
                english_name: 'Ahmed Ali',
                arabic_name: 'أحمد علي',
                staff_category: 'Teacher',
                joining_date: '2023-09-01',
                email: 'ahmed.ali@school.com'
            },
            {
                staff_id: 'P001',
                english_name: 'Fatima Hassan',
                arabic_name: 'فاطمة حسن',
                staff_category: 'Principal',
                joining_date: '2020-01-15',
                email: 'principal@school.com'
            }
        ];
    } else {
        return res.status(400).json({ error: 'Invalid template type' });
    }

    const worksheet = xlsx.utils.json_to_sheet(template);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, type);

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename=${type}_template.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
};
