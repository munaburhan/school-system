import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="layout">
            <nav className="navbar">
                <div className="navbar-brand">
                    <h1>School Management System</h1>
                </div>
                <div className="navbar-user">
                    <span>Welcome, {user?.username} ({user?.role})</span>
                    <button onClick={handleLogout} className="btn btn-danger">Logout</button>
                </div>
            </nav>

            <div className="layout-content">
                <aside className="sidebar">
                    <ul className="sidebar-menu">
                        <li><Link to="/dashboard">Dashboard</Link></li>
                        <li><Link to="/students">Students</Link></li>
                        <li><Link to="/staff">Staff</Link></li>
                        <li><Link to="/attendance">Attendance</Link></li>
                        <li><Link to="/timetable">Timetable</Link></li>
                        <li><Link to="/behavior">Behavior</Link></li>
                        <li><Link to="/exams">Exams</Link></li>
                        {user?.role === 'admin' && (
                            <>
                                <li><Link to="/teacher-assignments">Teacher Assignments</Link></li>
                                <li><Link to="/permissions">Permissions</Link></li>
                                <li><Link to="/data-entry">Data Entry</Link></li>
                            </>
                        )}
                    </ul>
                </aside>

                <main className="main-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
