import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import './Students.css'; // Reusing table styles for consistency

const Staff = () => {
    const { t } = useTranslation();
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [roleFilter, setRoleFilter] = useState('');
    const [search, setSearch] = useState('');
    const [formData, setFormData] = useState({
        english_name: '',
        arabic_name: '',
        role: 'teacher',
        email: '',
        department: ''
    });

    useEffect(() => {
        fetchStaff();
    }, [roleFilter, search]);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            let query = '/staff?limit=100'; // Fetch more for now
            if (roleFilter) query += `&role=${roleFilter}`;
            if (search) query += `&search=${search}`;

            const response = await api.get(query);
            setStaff(response.data.data || []);
        } catch (error) {
            console.error('Error fetching staff:', error);
            setStaff([]);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/staff', formData);
            setShowAddForm(false);
            setFormData({
                english_name: '',
                arabic_name: '',
                role: 'teacher',
                email: '',
                department: ''
            });
            fetchStaff();
        } catch (error) {
            console.error('Error adding staff:', error);
            alert('Failed to add staff member');
        }
    };

    const roles = ['teacher', 'admin', 'principal', 'vice_principal', 'leader'];

    return (
        <div className="students-page"> {/* Reusing layout class */}
            <div className="page-header">
                <div>
                    <h1>{t('staff_management')}</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Manage teachers and administrative staff
                    </p>
                </div>
                <button className="btn btn-primary btn-add" onClick={() => setShowAddForm(!showAddForm)}>
                    <span>+</span> {showAddForm ? t('cancel') : t('add_new_staff')}
                </button>
            </div>

            {showAddForm && (
                <div className="card form-card">
                    <h2>{t('add_new_staff')}</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('english_name')}</label>
                                <input
                                    type="text"
                                    name="english_name"
                                    value={formData.english_name}
                                    onChange={handleInputChange}
                                    required
                                    className="search-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>{t('email')}</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    className="search-input"
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('role')}</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    required
                                    className="search-input"
                                >
                                    {roles.map(role => (
                                        <option key={role} value={role}>{t(role)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>{t('department')}</label>
                                <input
                                    type="text"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    className="search-input"
                                />
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary">{t('save')}</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="filters-card">
                <div className="filters">
                    <input
                        type="text"
                        placeholder={t('search_placeholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                    />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">{t('all_roles')}</option>
                        {roles.map(role => (
                            <option key={role} value={role}>{t(role)}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>{t('name')}</th>
                            <th>{t('role')}</th>
                            <th>{t('email')}</th>
                            <th>{t('department')}</th>
                            <th>{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr className="loading-row">
                                <td colSpan="5">{t('loading')}</td>
                            </tr>
                        ) : staff.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="no-data">{t('no_staff_found')}</td>
                            </tr>
                        ) : (
                            staff.map((member) => (
                                <tr key={member.id}>
                                    <td>
                                        <div style={{ fontWeight: '500' }}>{member.english_name}</div>
                                        {member.arabic_name && (
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                {member.arabic_name}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <span className="status-badge active" style={{ textTransform: 'capitalize' }}>
                                            {t(member.role)}
                                        </span>
                                    </td>
                                    <td>{member.email}</td>
                                    <td>{member.department || '-'}</td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="btn-icon" title={t('edit')}>
                                                ✏️
                                            </button>
                                            <button className="btn-icon delete" title={t('delete')}>
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Staff;
