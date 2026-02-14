import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import './Students.css';

const Students = () => {
    const { t } = useTranslation();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        totalPages: 1
    });

    // Filters
    const [search, setSearch] = useState('');
    const [gradeFilter, setGradeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [currentStudent, setCurrentStudent] = useState(null);
    const [formData, setFormData] = useState({
        student_id: '',
        english_name: '',
        arabic_name: '',
        current_grade: '',
        date_of_birth: '',
        status: 'active'
    });

    useEffect(() => {
        fetchStudents();
    }, [pagination.page, gradeFilter, statusFilter]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            let query = `/students?page=${pagination.page}&limit=10`;

            if (search) query += `&search=${search}`;
            if (gradeFilter) query += `&grade=${gradeFilter}`;
            if (statusFilter) query += `&status=${statusFilter}`;

            const response = await api.get(query);
            setStudents(response.data.data || []); // Ensure it's always an array
            setPagination(response.data.pagination || { total: 0, page: 1, totalPages: 1 });
        } catch (error) {
            console.error('Error fetching students:', error);
            setStudents([]); // Set empty array on error
            setPagination({ total: 0, page: 1, totalPages: 1 });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchStudents();
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentStudent) {
                await api.put(`/students/${currentStudent.id}`, formData);
            } else {
                await api.post('/students', formData);
            }
            setShowModal(false);
            fetchStudents();
            resetForm();
        } catch (error) {
            console.error('Error saving student:', error);
            alert(error.response?.data?.error || 'Failed to save student');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('delete_confirm'))) {
            try {
                await api.delete(`/students/${id}`);
                fetchStudents();
            } catch (error) {
                console.error('Error deleting student:', error);
            }
        }
    };

    const openAddModal = () => {
        resetForm();
        setCurrentStudent(null);
        setShowModal(true);
    };

    const openEditModal = (student) => {
        setCurrentStudent(student);
        setFormData({
            student_id: student.student_id,
            english_name: student.english_name,
            arabic_name: student.arabic_name || '',
            current_grade: student.current_grade,
            date_of_birth: student.date_of_birth ? student.date_of_birth.split('T')[0] : '',
            status: student.status
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            student_id: '',
            english_name: '',
            arabic_name: '',
            current_grade: '',
            date_of_birth: '',
            status: 'active'
        });
    };

    return (
        <div className="students-page">
            <div className="page-header">
                <div>
                    <h1>{t('students')}</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Manage student records and enrollments
                    </p>
                </div>
                <button className="btn btn-primary btn-add" onClick={() => setShowAddForm(!showAddForm)}>
                    <span>+</span> {showAddForm ? t('cancel') : t('add_student')}
                </button>
            </div>

            {showAddForm && (
                <div className="card form-card">
                    <h2>{t('add_new_student')}</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('student_id')}</label>
                                <input
                                    type="text"
                                    name="student_id"
                                    value={formData.student_id}
                                    onChange={handleInputChange}
                                    required
                                    className="search-input"
                                />
                            </div>
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
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('arabic_name')}</label>
                                <input
                                    type="text"
                                    name="arabic_name"
                                    value={formData.arabic_name}
                                    onChange={handleInputChange}
                                    className="search-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>{t('grade')}</label>
                                <select
                                    name="current_grade"
                                    value={formData.current_grade}
                                    onChange={handleInputChange}
                                    required
                                    className="search-input"
                                >
                                    <option value="">{t('select_grade')}</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(g => (
                                        <option key={g} value={g}>{t('grade')} {g}</option>
                                    ))}
                                </select>
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
                        value={gradeFilter}
                        onChange={(e) => setGradeFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">{t('all_grades')}</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(g => (
                            <option key={g} value={g}>{t('grade')} {g}</option>
                        ))}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">{t('all_statuses')}</option>
                        <option value="active">{t('active')}</option>
                        <option value="inactive">{t('inactive')}</option>
                    </select>
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>{t('student_id')}</th>
                            <th>{t('name')}</th>
                            <th>{t('grade')}</th>
                            <th>{t('status')}</th>
                            <th>{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr className="loading-row">
                                <td colSpan="5">{t('loading')}</td>
                            </tr>
                        ) : students.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="no-data">{t('no_students_found')}</td>
                            </tr>
                        ) : (
                            students.map((student) => (
                                <tr key={student.id}>
                                    <td>{student.student_id}</td>
                                    <td>
                                        <div style={{ fontWeight: '500' }}>{student.english_name}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{student.arabic_name}</div>
                                    </td>
                                    <td>
                                        <span style={{
                                            background: '#f1f5f9',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.85rem',
                                            fontWeight: '500'
                                        }}>
                                            {t('grade')} {student.current_grade}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${student.status}`}>
                                            {t(student.status)}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="btn-icon" title={t('edit')}>
                                                ✏️
                                            </button>
                                            <button
                                                className="btn-icon delete"
                                                title={t('delete')}
                                                onClick={() => {
                                                    if (window.confirm(t('confirm_delete'))) {
                                                        // Handle delete
                                                    }
                                                }}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {pagination.totalPages > 1 && (
                    <div className="pagination">
                        <div className="pagination-info">
                            Showing page {pagination.page} of {pagination.totalPages}
                        </div>
                        <div className="pagination-controls">
                            <button
                                className="pagination-btn"
                                disabled={pagination.page === 1}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            >
                                ← {t('previous')}
                            </button>
                            {[...Array(pagination.totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    className={`pagination-btn ${pagination.page === i + 1 ? 'active' : ''}`}
                                    onClick={() => setPagination(prev => ({ ...prev, page: i + 1 }))}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                className="pagination-btn"
                                disabled={pagination.page === pagination.totalPages}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            >
                                {t('next')} →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>{currentStudent ? t('edit_student') : t('add_student')}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>{t('student_id')} *</label>
                                <input
                                    type="text"
                                    name="student_id"
                                    value={formData.student_id}
                                    onChange={handleInputChange}
                                    required
                                    disabled={!!currentStudent}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>{t('english_name')} *</label>
                                    <input
                                        type="text"
                                        name="english_name"
                                        value={formData.english_name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t('arabic_name')}</label>
                                    <input
                                        type="text"
                                        name="arabic_name"
                                        value={formData.arabic_name}
                                        onChange={handleInputChange}
                                        dir="rtl"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>{t('grade')} *</label>
                                    <select
                                        name="current_grade"
                                        value={formData.current_grade}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select Grade</option>
                                        <option value="Grade 10">Grade 10</option>
                                        <option value="Grade 11">Grade 11</option>
                                        <option value="Grade 12">Grade 12</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>{t('dob')}</label>
                                    <input
                                        type="date"
                                        name="date_of_birth"
                                        value={formData.date_of_birth}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>{t('status')}</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                >
                                    <option value="active">{t('active')}</option>
                                    <option value="inactive">{t('inactive')}</option>
                                    <option value="graduated">Graduated</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowModal(false)}
                                >
                                    {t('cancel')}
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {t('save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Students;
