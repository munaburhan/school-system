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
        { title: t('total_students'), value: stats.totalStudents, subtext: `${stats.activeStudents} ${t('active')}`, icon: '👥', color: '#6c5ce7' },
        { title: t('total_staff'), value: stats.totalStaff, subtext: '', icon: '👨‍🏫', color: '#00b894' },
        { title: t('attendance_rate'), value: `${stats.attendanceRate}%`, subtext: 'Last 30 days', icon: '📊', color: '#0984e3' },
        { title: t('system_status'), value: t('active'), subtext: 'All systems operational', icon: '✅', color: '#00cec9' }
    ];

    const quickActions = [
        { title: t('manage_students'), path: '/students', color: '#0984e3' },
        { title: t('manage_staff'), path: '/staff', color: '#0984e3' },
        { title: t('mark_attendance'), path: '/attendance', color: '#0984e3' },
        { title: t('manage_exams'), path: '/exams', color: '#0984e3' }
    ];

    if (loading) {
        return <div className="loading">Loading dashboard...</div>;
    }

    return (
        <div className="dashboard">
            <h1>{t('dashboard')}</h1>

            <div className="stats-grid">
                {statCards.map((stat, index) => (
                    <div key={index} className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                            {stat.icon}
                        </div>
                        <div className="stat-info">
                            <h3>{stat.title}</h3>
                            <div className="stat-value">{stat.value}</div>
                            <div className="stat-subtext">{stat.subtext}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-content-grid">
                <div className="card quick-actions">
                    <h2>{t('quick_actions')}</h2>
                    <div className="actions-grid">
                        {quickActions.map((action, index) => (
                            <button
                                key={index}
                                className="action-btn"
                                onClick={() => navigate(action.path)}
                            >
                                {action.title}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="card recent-activity">
                    <h2>{t('recent_activity')}</h2>
                    <div className="activity-list">
                        <p className="no-activity">{t('no_activity')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
