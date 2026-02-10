import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import './Login.css';

const Login = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(formData.username, formData.password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lng;
    };

    return (
        <div className="login-container">
            <div className="language-toggle">
                <button
                    className={i18n.language === 'en' ? 'active' : ''}
                    onClick={() => changeLanguage('en')}
                >
                    🇺🇸 English
                </button>
                <button
                    className={i18n.language === 'ar' ? 'active' : ''}
                    onClick={() => changeLanguage('ar')}
                >
                    🇸🇦 العربية
                </button>
            </div>
            <div className="login-card">
                <div className="login-header">
                    <h1>{t('school_system')}</h1>
                    <p>{t('login_title')}</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label>{t('username')}</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('password')}</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-login" disabled={loading}>
                        {loading ? t('logging_in') : t('login_button')}
                    </button>
                </form>

                <div className="login-footer">
                    <p>Default Admin: admin / admin123</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
