import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import './Layout.css';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { t, i18n } = useTranslation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lng;
    };

    // Set initial direction based on current language
    useEffect(() => {
        document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = i18n.language;
    }, [i18n.language]);

    const menuItems = [
        { path: '/dashboard', label: t('dashboard'), icon: '📊' },
        { path: '/students', label: t('students'), icon: '👨‍🎓' },
        { path: '/staff', label: t('staff'), icon: '👨‍🏫' },
        { path: '/attendance', label: t('attendance'), icon: '📅' },
        { path: '/timetable', label: t('timetable'), icon: '🕒' },
        { path: '/behavior', label: t('behavior'), icon: '⭐' },
        { path: '/exams', label: t('exams'), icon: '📝' },
    ];

    const adminItems = [
        { path: '/teacher-assignments', label: t('teacher_assignments'), icon: '📋' },
        { path: '/permissions', label: t('permissions'), icon: '🔒' },
        { path: '/data-entry', label: t('data_entry'), icon: '📥' },
    ];

    return (
        <div className="layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h2>{t('school_system')}</h2>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            <span className="icon">{item.icon}</span>
                            <span className="label">{item.label}</span>
                        </Link>
                    ))}

                    {user?.role === 'admin' && adminItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            <span className="icon">{item.icon}</span>
                            <span className="label">{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </aside>

            <main className="main-content">
                <header className="top-bar">
                    <div className="language-switcher">
                        <button
                            className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
                            onClick={() => changeLanguage('en')}
                        >
                            🇺🇸 English
                        </button>
                        <button
                            className={`lang-btn ${i18n.language === 'ar' ? 'active' : ''}`}
                            onClick={() => changeLanguage('ar')}
                        >
                            🇸🇦 العربية
                        </button>
                    </div>
                    <div className="user-menu">
                        <span>{t('welcome')}, {user?.username} ({user?.role})</span>
                        <button onClick={handleLogout} className="btn-logout">{t('logout')}</button>
                    </div>
                </header>

                <div className="content-area">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
