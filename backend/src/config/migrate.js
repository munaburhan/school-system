import pool from './database.js';

const createTables = async () => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Users table
        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'principal', 'vice_principal', 'leader', 'teacher', 'student', 'parent')),
        email VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Students table
        await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id VARCHAR(50) UNIQUE NOT NULL,
        english_name VARCHAR(255) NOT NULL,
        arabic_name VARCHAR(255),
        current_grade VARCHAR(50),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        date_of_birth DATE,
        contact_info JSONB,
        parent_id UUID REFERENCES users(id),
        enrollment_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Staff table
        await client.query(`
      CREATE TABLE IF NOT EXISTS staff (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        english_name VARCHAR(255) NOT NULL,
        arabic_name VARCHAR(255),
        role VARCHAR(50) NOT NULL,
        department VARCHAR(100),
        hire_date DATE,
        contact_info JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Teacher assignments table
        await client.query(`
      CREATE TABLE IF NOT EXISTS teacher_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        teacher_id UUID REFERENCES staff(id) ON DELETE CASCADE,
        grade VARCHAR(50) NOT NULL,
        subject VARCHAR(100) NOT NULL,
        section VARCHAR(50),
        academic_year VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Attendance table
        await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
        marked_by UUID REFERENCES users(id),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, date)
      )
    `);

        // Timetable table
        await client.query(`
      CREATE TABLE IF NOT EXISTS timetable (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        grade VARCHAR(50) NOT NULL,
        section VARCHAR(50),
        day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
        period_number INTEGER NOT NULL,
        subject VARCHAR(100) NOT NULL,
        teacher_id UUID REFERENCES staff(id),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        room_number VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Behavior records table
        await client.query(`
      CREATE TABLE IF NOT EXISTS behavior_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('positive', 'negative')),
        category VARCHAR(100),
        description TEXT NOT NULL,
        recorded_by UUID REFERENCES users(id),
        action_taken TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Exams table
        await client.query(`
      CREATE TABLE IF NOT EXISTS exams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        grade VARCHAR(50) NOT NULL,
        subject VARCHAR(100) NOT NULL,
        exam_date DATE NOT NULL,
        total_marks INTEGER NOT NULL,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Exam results table
        await client.query(`
      CREATE TABLE IF NOT EXISTS exam_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        marks_obtained DECIMAL(5,2) NOT NULL,
        grade VARCHAR(5),
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(exam_id, student_id)
      )
    `);

        // Permissions table
        await client.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role VARCHAR(50) NOT NULL,
        module VARCHAR(100) NOT NULL,
        can_read BOOLEAN DEFAULT false,
        can_write BOOLEAN DEFAULT false,
        can_delete BOOLEAN DEFAULT false,
        UNIQUE(role, module)
      )
    `);

        // Create indexes for better performance
        await client.query('CREATE INDEX IF NOT EXISTS idx_students_status ON students(status)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_behavior_student ON behavior_records(student_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_exam_results_exam ON exam_results(exam_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_exam_results_student ON exam_results(student_id)');

        await client.query('COMMIT');
        console.log('✓ All tables created successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating tables:', error);
        throw error;
    } finally {
        client.release();
    }
};

// Run migration
createTables()
    .then(() => {
        console.log('Migration completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
