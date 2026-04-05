import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import './Students.css';

const STAFF_CATEGORIES = [
    { value: 'Teacher', label: 'Teacher' },
    { value: 'Admin (Data Manager)', label: 'Admin (Data Manager)' },
    { value: 'Admin (HR)', label: 'Admin (HR)' },
    { value: 'Admin (IT)', label: 'Admin (IT)' },
    { value: 'Admin (Registrar)', label: 'Admin (Registrar)' },
    { value: 'Admin (Attendance Officer)', label: 'Admin (Attendance Officer)' },
    { value: 'Principal', label: 'Principal' },
    { value: 'Vice Principal', label: 'Vice Principal' },
    { value: 'IT', label: 'IT' },
    { value: 'HOD', label: 'HOD (Head of Department)' },
    { value: 'HOS', label: 'HOS (Head of Section)' },
];

const Staff = () => {
    const { t } = useTranslation();
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [search, setSearch] = useState('');
    const [formData, setFormData] = useState({
        staff_id: '',
        english_name: '',
        arabic_name: '',
        staff_category: 'Teacher',
        joining_date: '',
        email: ''
    });

    useEffect(() => {
        fetchStaff();
    }, [categoryFilter, search]);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            let query = '/staff?limit=100';
            if (categoryFilter) query += `&category=${encodeURIComponent(categoryFilter)}`;
            if (search) query += `&search=${encodeURIComponent(search)}`;

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
                staff_id: '',
                english_name: '',
                arabic_name: '',
                staff_category: 'Teacher',
                joining_date: '',
                email: ''
            });
            fetchStaff();
        } catch (error) {
            console.error('Error adding staff:', error);
            alert(error.response?.data?.error || 'Failed to add staff member');
        }
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete ${name}? This will also remove their user account and any teacher assignments.`)) {
            try {
                await api.delete(`/staff/${id}`);
                fetchStaff();
            } catch (error) {
                console.error('Error deleting staff:', error);
                alert(error.response?.data?.error || 'Failed to delete staff member');
            }
        }
    };

    const getCategoryBadgeColor = (category) => {
        if (!category) return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
        const cat = category.toLowerCase();
        if (cat === 'teacher') return { bg: '#ecfdf5', color: '#047857', border: '#d1fae5' };
        if (cat === 'principal') return { bg: '#eff6ff', color: '#1d4ed8', border: '#dbeafe' };
        if (cat === 'vice principal') return { bg: '#eef2ff', color: '#4338ca', border: '#e0e7ff' };
        if (cat.startsWith('admin')) return { bg: '#fef3c7', color: '#92400e', border: '#fde68a' };
        if (cat === 'hod' || cat === 'hos') return { bg: '#fce7f3', color: '#be185d', border: '#fbcfe8' };
        if (cat === 'it') return { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
        return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
    };

    return (
        <div className="students-page">
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
                <div className="card form-card" style={{ padding: '2rem', marginBottom: '1.5rem', background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-color)' }}>
                    <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)', fontSize: '1.25rem' }}>{t('add_new_staff')}</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem' }}>Staff ID *</label>
                                <input
                                    type="text"
                                    name="staff_id"
                                    value={formData.staff_id}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g. T001"
                                    className="search-input"
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem' }}>Staff Category *</label>
                                <select
                                    name="staff_category"
                                    value={formData.staff_category}
                                    onChange={handleInputChange}
                                    required
                                    className="filter-select"
                                    style={{ width: '100%' }}
                                >
                                    {STAFF_CATEGORIES.map(cat => (
                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{t('english_name')} *</label>
                                <input
                                    type="text"
                                    name="english_name"
                                    value={formData.english_name}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Full name in English"
                                    className="search-input"
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{t('arabic_name')}</label>
                                <input
                                    type="text"
                                    name="arabic_name"
                                    value={formData.arabic_name}
                                    onChange={handleInputChange}
                                    dir="rtl"
                                    placeholder="الاسم بالعربي"
                                    className="search-input"
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>
                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem' }}>Joining Date</label>
                                <input
                                    type="date"
                                    name="joining_date"
                                    value={formData.joining_date}
                                    onChange={handleInputChange}
                                    className="search-input"
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{t('email')}</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="email@school.com"
                                    className="search-input"
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)} style={{ padding: '0.65rem 1.25rem' }}>
                                {t('cancel')}
                            </button>
                            <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
                                {t('save')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="filters-card">
                <div className="filters">
                    <input
                        type="text"
                        placeholder="Search by name or staff ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                    />
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">All Categories</option>
                        {STAFF_CATEGORIES.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Staff ID</th>
                            <th>{t('name')}</th>
                            <th>Category</th>
                            <th>{t('email')}</th>
                            <th>Joining Date</th>
                            <th>{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr className="loading-row">
                                <td colSpan="6">{t('loading')}</td>
                            </tr>
                        ) : staff.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="no-data">No staff members found. Click "Add New Staff" to get started.</td>
                            </tr>
                        ) : (
                            staff.map((member) => {
                                const badgeColor = getCategoryBadgeColor(member.staff_category);
                                return (
                                    <tr key={member.id}>
                                        <td>
                                            <span style={{
                                                background: '#f1f5f9',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.85rem',
                                                fontWeight: '600',
                                                fontFamily: 'monospace'
                                            }}>
                                                {member.staff_id || '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: '500' }}>{member.english_name}</div>
                                            {member.arabic_name && (
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', direction: 'rtl' }}>
                                                    {member.arabic_name}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span style={{
                                                background: badgeColor.bg,
                                                color: badgeColor.color,
                                                border: `1px solid ${badgeColor.border}`,
                                                padding: '0.3rem 0.65rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.8rem',
                                                fontWeight: '600',
                                                display: 'inline-block'
                                            }}>
                                                {member.staff_category || member.role || '-'}
                                            </span>
                                        </td>
                                        <td style={{ color: member.email ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                                            {member.email || '-'}
                                        </td>
                                        <td>
                                            {member.joining_date
                                                ? new Date(member.joining_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                                : '-'}
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button
                                                    className="btn-icon delete"
                                                    title={t('delete')}
                                                    onClick={() => handleDelete(member.id, member.english_name)}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Staff;
