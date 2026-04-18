import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import './Students.css';
import './TeacherAssignments.css';

const SUBJECTS = [
    'Mathematics', 'English', 'Science', 'Arabic', 'Islamic Studies',
    'Social Studies', 'PE', 'Art', 'Music', 'Computer Science',
    'French', 'Physics', 'Chemistry', 'Biology'
];

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

const TeacherAssignments = () => {
    const { t } = useTranslation();
    const [assignments, setAssignments] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        teacher_id: '',
        subject: '',
        grade: '',
        section: '',
        academic_year: '2025-2026'
    });

    useEffect(() => {
        fetchAssignments();
        fetchTeachers();
    }, []);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const response = await api.get('/teacher-assignments');
            setAssignments(response.data.data || []);
        } catch (error) {
            console.error('Error fetching assignments:', error);
            setAssignments([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeachers = async () => {
        try {
            const response = await api.get('/staff/teachers');
            setTeachers(response.data.data || []);
        } catch (error) {
            console.error('Error fetching teachers:', error);
            setTeachers([]);
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
        
        if (!formData.teacher_id || !formData.subject || !formData.grade) {
            alert("Please fill in Teacher, Subject, and Grade.");
            return;
        }
        
        try {
            await api.post('/teacher-assignments', formData);
            setShowAddForm(false);
            setFormData({
                teacher_id: '',
                subject: '',
                grade: '',
                section: '',
                academic_year: '2025-2026'
            });
            fetchAssignments();
        } catch (error) {
            console.error('Error creating assignment:', error);
            alert(error.response?.data?.error || 'Failed to create assignment');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to remove this assignment?')) {
            try {
                await api.delete(`/teacher-assignments/${id}`);
                fetchAssignments();
            } catch (error) {
                console.error('Error deleting assignment:', error);
                alert(error.response?.data?.error || 'Failed to delete assignment');
            }
        }
    };

    // Group assignments by teacher for a nicer display
    const groupedAssignments = assignments.reduce((acc, assignment) => {
        const key = assignment.teacher_id;
        if (!acc[key]) {
            acc[key] = {
                teacher_name: assignment.teacher_name,
                teacher_arabic_name: assignment.teacher_arabic_name,
                teacher_staff_id: assignment.teacher_staff_id,
                assignments: []
            };
        }
        acc[key].assignments.push(assignment);
        return acc;
    }, {});

    return (
        <div className="students-page">
            <div className="page-header">
                <div>
                    <h1>Teacher Assignments</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Assign teachers to subjects, grades, and sections
                    </p>
                </div>
                <button className="btn btn-primary btn-add" onClick={() => setShowAddForm(!showAddForm)}>
                    <span>+</span> {showAddForm ? t('cancel') : 'Add Assignment'}
                </button>
            </div>

            {showAddForm && (
                <div className="card form-card" style={{ padding: '2rem', marginBottom: '1.5rem', background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-color)' }}>
                    <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)', fontSize: '1.25rem' }}>New Teacher Assignment</h2>

                    {teachers.length === 0 ? (
                        <div className="no-teachers-notice">
                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                                ⚠️ No teachers found. Please add staff members with the "Teacher" category in the Staff Management page first.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem' }}>Teacher *</label>
                                    <select
                                        name="teacher_id"
                                        value={formData.teacher_id}
                                        onChange={handleInputChange}
                                        className="filter-select"
                                        style={{ width: '100%' }}
                                    >
                                        <option value="">Select Teacher</option>
                                        {teachers.map(teacher => (
                                            <option key={teacher.id} value={teacher.id}>
                                                {teacher.english_name} ({teacher.staff_id})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem' }}>Subject *</label>
                                    <select
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleInputChange}
                                        className="filter-select"
                                        style={{ width: '100%' }}
                                    >
                                        <option value="">Select Subject</option>
                                        {SUBJECTS.map(subject => (
                                            <option key={subject} value={subject}>{subject}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem' }}>Grade *</label>
                                    <select
                                        name="grade"
                                        value={formData.grade}
                                        onChange={handleInputChange}
                                        className="filter-select"
                                        style={{ width: '100%' }}
                                    >
                                        <option value="">Select Grade</option>
                                        {GRADES.map(g => (
                                            <option key={g} value={g}>Grade {g}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem' }}>Section</label>
                                    <select
                                        name="section"
                                        value={formData.section}
                                        onChange={handleInputChange}
                                        className="filter-select"
                                        style={{ width: '100%' }}
                                    >
                                        <option value="">All Sections</option>
                                        {SECTIONS.map(s => (
                                            <option key={s} value={s}>Section {s}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem' }}>Academic Year</label>
                                    <input
                                        type="text"
                                        name="academic_year"
                                        value={formData.academic_year}
                                        onChange={handleInputChange}
                                        placeholder="2025-2026"
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
                                    Assign
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {/* Grouped view by teacher */}
            {loading ? (
                <div className="table-container">
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        {t('loading')}
                    </div>
                </div>
            ) : Object.keys(groupedAssignments).length === 0 ? (
                <div className="table-container">
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                        No teacher assignments found. Click "Add Assignment" to get started.
                    </div>
                </div>
            ) : (
                Object.entries(groupedAssignments).map(([teacherId, group]) => (
                    <div key={teacherId} className="teacher-assignment-group">
                        <div className="teacher-group-header">
                            <div className="teacher-group-info">
                                <div className="teacher-avatar">
                                    {group.teacher_name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div>
                                    <div className="teacher-group-name">{group.teacher_name}</div>
                                    {group.teacher_arabic_name && (
                                        <div className="teacher-group-arabic">{group.teacher_arabic_name}</div>
                                    )}
                                    <div className="teacher-group-id">ID: {group.teacher_staff_id}</div>
                                </div>
                            </div>
                            <div className="teacher-group-count">
                                {group.assignments.length} assignment{group.assignments.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                        <div className="assignment-chips">
                            {group.assignments.map(assignment => (
                                <div key={assignment.id} className="assignment-chip">
                                    <div className="chip-content">
                                        <span className="chip-subject">{assignment.subject}</span>
                                        <span className="chip-details">
                                            Grade {assignment.grade}
                                            {assignment.section && ` • Section ${assignment.section}`}
                                        </span>
                                        {assignment.academic_year && (
                                            <span className="chip-year">{assignment.academic_year}</span>
                                        )}
                                    </div>
                                    <button
                                        className="chip-delete"
                                        onClick={() => handleDelete(assignment.id)}
                                        title="Remove assignment"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default TeacherAssignments;
