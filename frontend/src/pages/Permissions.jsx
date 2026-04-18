import { useTranslation } from 'react-i18next';
import './Students.css';

const Permissions = () => {
    const { t } = useTranslation();

    return (
        <div className="students-page">
            <div className="page-header">
                <div>
                    <h1>{t('permissions')}</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Manage roles and system permissions
                    </p>
                </div>
            </div>

            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                <h2>Permissions Management</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    This module is currently under development. Permissions are managed automatically through user roles (Admin, Principal, Teacher, etc.) and the staff category assigned during staff creation.
                </p>
            </div>
        </div>
    );
};

export default Permissions;
