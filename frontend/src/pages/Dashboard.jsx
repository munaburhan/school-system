import { useState, useEffect } from 'react';
import api from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalStudents: 0,
        activeStudents: 0,
        totalStaff: 0,
        attendanceRate: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Fetch students count
            const studentsRes = await api.get('/students?limit=1');
            const activeStudentsRes = await api.get('/students?status=active&limit=1');

            // Fetch staff count
            const staffRes = await api.get('/staff?limit=1');

            // Fetch attendance stats for last 30 days
            const today = new Date();
            const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
            const attendanceRes = await api.get(`/attendance/stats?start_date=${thirtyDaysAgo.toISOString().split('T')[0]}`);

            const attendanceData = attendanceRes.data;
            const attendanceRate = attendanceData.total_records > 0
                ? ((attendanceData.present_count / attendanceData.total_records) * 100).toFixed(1)
                : 0;

            setStats({
                totalStudents: studentsRes.data.pagination.total,
                activeStudents: activeStudentsRes.data.pagination.total,
                totalStaff: staffRes.data.pagination.total,
                attendanceRate
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading dashboard...</div>;
    }

    return (
        <div className="dashboard">
            <h1>Dashboard</h1>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                        <h3>Total Students</h3>
                        <p className="stat-number">{stats.totalStudents}</p>
                        <span className="stat-detail">{stats.activeStudents} active</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">👨‍🏫</div>
                    <div className="stat-info">
                        <h3>Total Staff</h3>
                        <p className="stat-number">{stats.totalStaff}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-info">
                        <h3>Attendance Rate</h3>
                        <p className="stat-number">{stats.attendanceRate}%</p>
                        <span className="stat-detail">Last 30 days</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                        <h3>System Status</h3>
                        <p className="stat-number">Active</p>
                        <span className="stat-detail">All systems operational</span>
                    </div>
                </div>
            </div>

            <div className="dashboard-sections">
                <div className="card">
                    <h2>Quick Actions</h2>
                    <div className="quick-actions">
                        <a href="/students" className="action-btn">Manage Students</a>
                        <a href="/staff" className="action-btn">Manage Staff</a>
                        <a href="/attendance" className="action-btn">Mark Attendance</a>
                        <a href="/exams" className="action-btn">Manage Exams</a>
                    </div>
                </div>

                <div className="card">
                    <h2>Recent Activity</h2>
                    <p>No recent activity to display.</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
