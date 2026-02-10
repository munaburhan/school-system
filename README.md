# School Management System

A comprehensive full-stack school management system with role-based access control.

## Features

- **Admin Dashboard**: Complete control over all system modules
- **Student Management**: Add, edit, delete students with bilingual support
- **Staff Management**: Manage teachers, leaders, principals with role-based access
- **Teacher Assignments**: Assign teachers to grades and subjects
- **Timetable Management**: Create and manage school timetables
- **Attendance Tracking**: Mark and monitor student attendance
- **Behavior Management**: Track student behavior incidents
- **Exams & Results**: Manage exams and enter results
- **Analytics**: Comprehensive dashboard with insights
- **Multi-Portal**: Separate portals for Admin, Teachers, and Students

## Tech Stack

- **Frontend**: React with Vite
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Authentication**: JWT with bcrypt

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd school-system
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

4. Set up environment variables
```bash
# Copy .env.example to .env in backend folder
cp backend/.env.example backend/.env
# Edit .env with your database credentials
```

5. Run database migrations
```bash
cd backend
npm run migrate
```

6. Start the development servers

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

## User Roles

- **Admin**: Full read/write access to all modules
- **Principal**: Full read-only access
- **Vice Principal**: Full read-only access
- **Leader**: Wide read access, limited write access
- **Teacher**: Access to assigned classes only
- **Student**: Access to personal data only

## Security

- No public signup - all users pre-registered by admin
- JWT-based authentication
- Role-based access control at API level
- Password hashing with bcrypt

## License

Proprietary - For school deployment only
