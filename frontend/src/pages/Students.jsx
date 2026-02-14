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
                <h1>{t('students')}</h1>
                <button className="btn btn-primary" onClick={openAddModal}>
                    + {t('add_student')}
                </button>
            </div>

            <div className="filters-section">
                <form onSubmit={handleSearch} className="search-form">
                    <input
                        type="text"
                        placeholder={t('search_students')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                    />
                    <button type="submit" className="btn btn-secondary">🔍</button>
                </form>

                <div className="filters">
                    <select
                        value={gradeFilter}
                        onChange={(e) => setGradeFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">{t('all_grades')}</option>
                        <option value="Grade 10">{t('grade_10')}</option>
                        <option value="Grade 11">{t('grade_11')}</option>
                        <option value="Grade 12">{t('grade_12')}</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">All Status</option>
                        <option value="active">{t('active')}</option>
                        <option value="inactive">{t('inactive')}</option>
                        <option value="graduated">Graduated</option>
                        <option value="suspended">Suspended</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="loading">{t('loading')}</div>
            ) : (
                <>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>{t('student_id')}</th>
                                    <th>{t('english_name')}</th>
                                    <th>{t('arabic_name')}</th>
                                    <th>{t('grade')}</th>
                                    <th>{t('dob')}</th>
                                    <th>{t('status')}</th>
                                    <th>{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => (
                                    <tr key={student.id}>
                                        <td>{student.student_id}</td>
                                        <td>{student.english_name}</td>
                                        <td>{student.arabic_name}</td>
                                        <td>{student.current_grade}</td>
                                        <td>{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : '-'}</td>
                                        <td>
                                            <span className={`status-badge ${student.status}`}>
                                                {student.status === 'active' ? t('active') : t('inactive')}
                                            </span>
                                        </td>
                                        <td className="actions-cell">
                                            <button
                                                className="btn-icon edit"
                                                onClick={() => openEditModal(student)}
                                                title={t('edit_student')}
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn-icon delete"
                                                onClick={() => handleDelete(student.id)}
                                                title={t('delete_student')}
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {students.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="no-data">No students found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination">
                        <button
                            disabled={pagination.page === 1}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            className="btn btn-secondary"
                        >
                            {t('previous')}
                        </button>
                        <span className="page-info">
                            {t('page')} {pagination.page} {t('of')} {pagination.totalPages}
                        </span>
                        <button
                            disabled={pagination.page === pagination.totalPages}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            className="btn btn-secondary"
                        >
                            {t('next')}
                        </button>
                    </div>
                </>
            )}

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
