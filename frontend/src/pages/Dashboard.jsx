import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalStudents: 0,
        activeStudents: 0,
        totalStaff: 0,
        attendanceRate: 0
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [studentsRes, activeStudentsRes, staffRes] = await Promise.all([
                api.get('/students?limit=1'),
                api.get('/students?status=active&limit=1'),
                api.get('/staff?limit=1')
            ]);

            // Mock attendance data for now since we haven't implemented full tracking yet
            // In a real scenario, we would fetch this from the backend
            const today = new Date();
            const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
            let attendanceRate = 0;

            try {
                const attendanceRes = await api.get(`/attendance/stats?start_date=${thirtyDaysAgo.toISOString().split('T')[0]}`);
                const attendanceData = attendanceRes.data;
                attendanceRate = attendanceData.total_records > 0
                    ? ((attendanceData.present_count / attendanceData.total_records) * 100).toFixed(1)
                    : 0;
            } catch (error) {
                // Ignore attendance error for now if table is empty
                console.log('No attendance data yet');
            }

            setStats({
                totalStudents: studentsRes.data?.pagination?.total || 0,
                activeStudents: activeStudentsRes.data?.pagination?.total || 0,
                totalStaff: staffRes.data?.pagination?.total || 0,
                attendanceRate
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
            // Keep default stats on error
            setStats({
                totalStudents: 0,
                activeStudents: 0,
                totalStaff: 0,
                attendanceRate: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: t('total_students'),
            value: stats.totalStudents,
            subtext: `${stats.activeStudents} ${t('active')}`,
            icon: '👥',
            trend: 'increase',
            bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        },
        {
            title: t('total_staff'),
            value: stats.totalStaff,
            subtext: 'Across all departments',
            icon: '👨‍🏫',
            trend: 'neutral',
            bg: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
        },
        {
            title: t('attendance_rate'),
            value: `${stats.attendanceRate}%`,
            subtext: 'Last 30 days',
            icon: '📊',
            trend: parseFloat(stats.attendanceRate) > 90 ? 'increase' : 'neutral',
            bg: 'linear-gradient(135deg, #3a7bd5 0%, #3a6073 100%)'
        },
        {
            title: t('system_status'),
            value: t('active'),
            subtext: 'All systems operational',
            icon: '✅',
            trend: 'increase',
            bg: 'linear-gradient(135deg, #02aab0 0%, #00cdac 100%)'
        }
    ];

    const quickActions = [
        { title: t('manage_students'), path: '/students', icon: '👨‍🎓' },
        { title: t('manage_staff'), path: '/staff', icon: '👨‍🏫' },
        { title: t('mark_attendance'), path: '/attendance', icon: '📅' },
        { title: t('manage_exams'), path: '/exams', icon: '📝' },
        { title: t('timetable'), path: '/timetable', icon: '🕒' },
        { title: t('behavior'), path: '/behavior', icon: '⭐' }
    ];

    if (loading) {
        return <div className="loading">Loading dashboard...</div>;
    }

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div>
                    <h1>{t('dashboard')}</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Welcome back, Admin
                    </p>
                </div>
                <div className="date-display">
                    {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </header>

            <div className="stats-grid">
                {statCards.map((stat, index) => (
                    <div key={index} className="stat-card">
                        <div className="stat-icon-wrapper" style={{ background: stat.bg, color: 'white' }}>
                            {stat.icon}
                        </div>
                        <div className="stat-info">
                            <div className="stat-title">{stat.title}</div>
                            <div className="stat-value">{stat.value}</div>
                            <div className={`stat-subtext ${stat.trend}`}>
                                {stat.subtext}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-sections">
                <div className="section-card quick-actions">
                    <div className="section-header">
                        <h2>{t('quick_actions')}</h2>
                    </div>
                    <div className="quick-actions-grid">
                        {quickActions.map((action, index) => (
                            <button
                                key={index}
                                className="action-btn"
                                onClick={() => navigate(action.path)}
                            >
                                <span className="action-icon">{action.icon}</span>
                                <span className="action-label">{action.title}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="section-card recent-activity">
                    <div className="section-header">
                        <h2>{t('recent_activity')}</h2>
                    </div>
                    <div className="activity-list">
                        <p className="no-activity" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            {t('no_activity')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
