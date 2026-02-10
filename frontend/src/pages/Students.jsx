import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Students.css';

const Students = () => {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [formData, setFormData] = useState({
        student_id: '',
        english_name: '',
        arabic_name: '',
        current_grade: '',
        date_of_birth: '',
        status: 'active'
    });

    const canWrite = user?.role === 'admin';

    useEffect(() => {
        fetchStudents();
    }, [search, statusFilter]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (statusFilter) params.append('status', statusFilter);

            const response = await api.get(`/students?${params}`);
            setStudents(response.data.students);
        } catch (error) {
            console.error('Error fetching students:', error);
            alert('Failed to fetch students');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingStudent) {
                await api.put(`/students/${editingStudent.id}`, formData);
                alert('Student updated successfully');
            } else {
                await api.post('/students', formData);
                alert('Student created successfully');
            }

            setShowForm(false);
            setEditingStudent(null);
            resetForm();
            fetchStudents();
        } catch (error) {
            console.error('Error saving student:', error);
            alert(error.response?.data?.error || 'Failed to save student');
        }
    };

    const handleEdit = (student) => {
        setEditingStudent(student);
        setFormData({
            student_id: student.student_id,
            english_name: student.english_name,
            arabic_name: student.arabic_name || '',
            current_grade: student.current_grade || '',
            date_of_birth: student.date_of_birth || '',
            status: student.status
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this student?')) {
            return;
        }

        try {
            await api.delete(`/students/${id}`);
            alert('Student deleted successfully');
            fetchStudents();
        } catch (error) {
            console.error('Error deleting student:', error);
            alert('Failed to delete student');
        }
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

    const handleCancel = () => {
        setShowForm(false);
        setEditingStudent(null);
        resetForm();
    };

    return (
        <div className="students-page">
            <div className="page-header">
                <h1>Students Management</h1>
                {canWrite && (
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowForm(true)}
                    >
                        + Add Student
                    </button>
                )}
            </div>

            {showForm && (
                <div className="card form-card">
                    <h2>{editingStudent ? 'Edit Student' : 'Add New Student'}</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Student ID *</label>
                                <input
                                    type="text"
                                    value={formData.student_id}
                                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>English Name *</label>
                                <input
                                    type="text"
                                    value={formData.english_name}
                                    onChange={(e) => setFormData({ ...formData, english_name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Arabic Name</label>
                                <input
                                    type="text"
                                    value={formData.arabic_name}
                                    onChange={(e) => setFormData({ ...formData, arabic_name: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Current Grade</label>
                                <input
                                    type="text"
                                    value={formData.current_grade}
                                    onChange={(e) => setFormData({ ...formData, current_grade: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Date of Birth</label>
                                <input
                                    type="date"
                                    value={formData.date_of_birth}
                                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn btn-success">
                                {editingStudent ? 'Update' : 'Create'}
                            </button>
                            <button type="button" className="btn" onClick={handleCancel}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card">
                <div className="filters">
                    <input
                        type="text"
                        placeholder="Search by name or ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                    />

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                {loading ? (
                    <div className="loading">Loading students...</div>
                ) : students.length === 0 ? (
                    <p>No students found.</p>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>English Name</th>
                                <th>Arabic Name</th>
                                <th>Grade</th>
                                <th>Status</th>
                                {canWrite && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student) => (
                                <tr key={student.id}>
                                    <td>{student.student_id}</td>
                                    <td>{student.english_name}</td>
                                    <td>{student.arabic_name || '-'}</td>
                                    <td>{student.current_grade || '-'}</td>
                                    <td>
                                        <span className={`status-badge ${student.status}`}>
                                            {student.status}
                                        </span>
                                    </td>
                                    {canWrite && (
                                        <td>
                                            <button
                                                className="btn-small btn-primary"
                                                onClick={() => handleEdit(student)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="btn-small btn-danger"
                                                onClick={() => handleDelete(student.id)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Students;
