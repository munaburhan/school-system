import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import './Timetable.css';

const DAYS = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Saturday' }
];

const PERIODS = [
    { num: 1, start: '07:30', end: '08:15' },
    { num: 2, start: '08:20', end: '09:05' },
    { num: 3, start: '09:10', end: '09:55' },
    { num: 4, start: '10:10', end: '10:55' },
    { num: 5, start: '11:00', end: '11:45' },
    { num: 6, start: '11:50', end: '12:35' },
    { num: 7, start: '12:40', end: '13:25' },
    { num: 8, start: '13:30', end: '14:15' }
];

const SUBJECTS = [
    'Mathematics', 'English', 'Science', 'Arabic', 'Islamic Studies',
    'Social Studies', 'PE', 'Art', 'Music', 'Computer Science',
    'French', 'Physics', 'Chemistry', 'Biology'
];

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

const getSubjectClass = (subject) => {
    if (!subject) return 'subject-default';
    const s = subject.toLowerCase();
    if (s.includes('math')) return 'subject-math';
    if (s.includes('english')) return 'subject-english';
    if (s.includes('science')) return 'subject-science';
    if (s.includes('arabic')) return 'subject-arabic';
    if (s.includes('islamic')) return 'subject-islamic';
    if (s.includes('social')) return 'subject-social';
    if (s.includes('pe') || s.includes('physical')) return 'subject-pe';
    if (s.includes('art')) return 'subject-art';
    if (s.includes('music')) return 'subject-music';
    if (s.includes('computer')) return 'subject-computer';
    if (s.includes('french')) return 'subject-french';
    if (s.includes('physics')) return 'subject-physics';
    if (s.includes('chemistry')) return 'subject-chemistry';
    if (s.includes('biology')) return 'subject-biology';
    return 'subject-default';
};

const formatTime = (time) => {
    if (!time) return '';
    // time might be "07:30:00" or "07:30"
    const parts = time.split(':');
    return `${parts[0]}:${parts[1]}`;
};

const Timetable = () => {
    const { t } = useTranslation();
    const [entries, setEntries] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('teacher'); // 'teacher', 'grid', or 'summary'
    const [showAddForm, setShowAddForm] = useState(false);

    // Filter states
    const [filterGrade, setFilterGrade] = useState('');
    const [filterSection, setFilterSection] = useState('');
    const [filterTeacher, setFilterTeacher] = useState('');

    const [formData, setFormData] = useState({
        grade: '',
        section: '',
        day_of_week: '',
        period_number: '',
        subject: '',
        teacher_id: '',
        start_time: '',
        end_time: '',
        room_number: ''
    });

    useEffect(() => {
        fetchEntries();
        fetchTeachers();
    }, []);

    const fetchEntries = async () => {
        try {
            setLoading(true);
            const response = await api.get('/timetable/by-teacher');
            setEntries(response.data.data || []);
        } catch (error) {
            console.error('Error fetching timetable:', error);
            setEntries([]);
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
        const { name, value } = e.target;
        const updates = { [name]: value };

        // Auto-fill start_time and end_time when period is selected
        if (name === 'period_number' && value) {
            const period = PERIODS.find(p => p.num === parseInt(value));
            if (period) {
                updates.start_time = period.start;
                updates.end_time = period.end;
            }
        }

        setFormData(prev => ({ ...prev, ...updates }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.grade || formData.day_of_week === '' || !formData.period_number || !formData.subject || !formData.start_time || !formData.end_time) {
            alert('Please fill in Grade, Day, Period, Subject, Start Time, and End Time.');
            return;
        }

        try {
            await api.post('/timetable', {
                ...formData,
                day_of_week: parseInt(formData.day_of_week),
                period_number: parseInt(formData.period_number)
            });
            setShowAddForm(false);
            setFormData({
                grade: '', section: '', day_of_week: '', period_number: '',
                subject: '', teacher_id: '', start_time: '', end_time: '', room_number: ''
            });
            fetchEntries();
        } catch (error) {
            console.error('Error creating timetable entry:', error);
            alert(error.response?.data?.error || 'Failed to create timetable entry');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this timetable entry?')) {
            try {
                await api.delete(`/timetable/${id}`);
                fetchEntries();
            } catch (error) {
                console.error('Error deleting entry:', error);
                alert(error.response?.data?.error || 'Failed to delete entry');
            }
        }
    };

    // Group entries by teacher for teacher view
    const groupedByTeacher = entries.reduce((acc, entry) => {
        const key = entry.teacher_id || 'unassigned';
        if (!acc[key]) {
            acc[key] = {
                teacher_name: entry.teacher_name || 'Unassigned',
                teacher_arabic_name: entry.teacher_arabic_name,
                teacher_staff_id: entry.teacher_staff_id,
                entries: []
            };
        }
        acc[key].entries.push(entry);
        return acc;
    }, {});

    // Apply filters
    const filteredTeachers = Object.entries(groupedByTeacher).filter(([, group]) => {
        if (filterTeacher && group.teacher_name !== filterTeacher) return false;
        return true;
    }).map(([key, group]) => {
        let filteredEntries = group.entries;
        if (filterGrade) {
            filteredEntries = filteredEntries.filter(e => String(e.grade) === filterGrade);
        }
        if (filterSection) {
            filteredEntries = filteredEntries.filter(e => e.section === filterSection);
        }
        return [key, { ...group, entries: filteredEntries }];
    }).filter(([, group]) => group.entries.length > 0);

    // Get unique days a teacher has
    const getTeacherDays = (teacherEntries) => {
        const daySet = new Set(teacherEntries.map(e => e.day_of_week));
        return DAYS.filter(d => daySet.has(d.value));
    };

    // Get entries for a specific teacher on a specific day
    const getEntriesForDay = (teacherEntries, dayValue) => {
        return teacherEntries
            .filter(e => e.day_of_week === dayValue)
            .sort((a, b) => a.period_number - b.period_number);
    };

    // Unique teacher names for filter
    const uniqueTeacherNames = [...new Set(entries.map(e => e.teacher_name).filter(Boolean))].sort();

    return (
        <div className="timetable-page">
            <div className="page-header">
                <div>
                    <h1>🕒 {t('timetable')}</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Weekly schedule — every teacher with their classes
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div className="view-toggle">
                        <button
                            className={`view-toggle-btn ${view === 'teacher' ? 'active' : ''}`}
                            onClick={() => setView('teacher')}
                        >
                            👨‍🏫 By Teacher
                        </button>
                        <button
                            className={`view-toggle-btn ${view === 'grid' ? 'active' : ''}`}
                            onClick={() => setView('grid')}
                        >
                            📋 Grid View
                        </button>
                        <button
                            className={`view-toggle-btn ${view === 'summary' ? 'active' : ''}`}
                            onClick={() => setView('summary')}
                        >
                            📊 Summary
                        </button>
                    </div>
                    <button
                        className="btn btn-primary btn-add"
                        onClick={() => setShowAddForm(!showAddForm)}
                    >
                        <span>+</span> {showAddForm ? t('cancel') : 'Add Period'}
                    </button>
                </div>
            </div>

            {/* Add Form */}
            {showAddForm && (
                <div className="timetable-form-card">
                    <h2>📅 New Timetable Entry</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid-3">
                            <div className="form-group">
                                <label>Teacher</label>
                                <select name="teacher_id" value={formData.teacher_id} onChange={handleInputChange}>
                                    <option value="">Select Teacher</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.english_name} ({t.staff_id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Subject *</label>
                                <select name="subject" value={formData.subject} onChange={handleInputChange}>
                                    <option value="">Select Subject</option>
                                    {SUBJECTS.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Day *</label>
                                <select name="day_of_week" value={formData.day_of_week} onChange={handleInputChange}>
                                    <option value="">Select Day</option>
                                    {DAYS.map(d => (
                                        <option key={d.value} value={d.value}>{d.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-grid-4">
                            <div className="form-group">
                                <label>Grade *</label>
                                <select name="grade" value={formData.grade} onChange={handleInputChange}>
                                    <option value="">Select Grade</option>
                                    {GRADES.map(g => (
                                        <option key={g} value={g}>Grade {g}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Section</label>
                                <select name="section" value={formData.section} onChange={handleInputChange}>
                                    <option value="">All Sections</option>
                                    {SECTIONS.map(s => (
                                        <option key={s} value={s}>Section {s}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Period *</label>
                                <select name="period_number" value={formData.period_number} onChange={handleInputChange}>
                                    <option value="">Select Period</option>
                                    {PERIODS.map(p => (
                                        <option key={p.num} value={p.num}>
                                            Period {p.num} ({p.start} - {p.end})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Room</label>
                                <input
                                    type="text"
                                    name="room_number"
                                    value={formData.room_number}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Room 201"
                                />
                            </div>
                        </div>

                        <div className="form-grid-3" style={{ marginBottom: '1.5rem' }}>
                            <div className="form-group">
                                <label>Start Time *</label>
                                <input
                                    type="time"
                                    name="start_time"
                                    value={formData.start_time}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>End Time *</label>
                                <input
                                    type="time"
                                    name="end_time"
                                    value={formData.end_time}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div></div>
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)} style={{ padding: '0.65rem 1.25rem' }}>
                                {t('cancel')}
                            </button>
                            <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
                                Add to Timetable
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="timetable-filters">
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>🔍 Filter:</span>
                <select
                    className="filter-select"
                    value={filterTeacher}
                    onChange={(e) => setFilterTeacher(e.target.value)}
                >
                    <option value="">All Teachers</option>
                    {uniqueTeacherNames.map(name => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                </select>
                <select
                    className="filter-select"
                    value={filterGrade}
                    onChange={(e) => setFilterGrade(e.target.value)}
                >
                    <option value="">All Grades</option>
                    {GRADES.map(g => (
                        <option key={g} value={String(g)}>Grade {g}</option>
                    ))}
                </select>
                <select
                    className="filter-select"
                    value={filterSection}
                    onChange={(e) => setFilterSection(e.target.value)}
                >
                    <option value="">All Sections</option>
                    {SECTIONS.map(s => (
                        <option key={s} value={s}>Section {s}</option>
                    ))}
                </select>
            </div>

            {/* Content */}
            {loading ? (
                <div className="timetable-loading">Loading timetable...</div>
            ) : entries.length === 0 ? (
                <div className="timetable-empty">
                    <div className="timetable-empty-icon">🕒</div>
                    <h3>No Timetable Entries Yet</h3>
                    <p>Click "Add Period" to start building the weekly schedule for your school.</p>
                </div>
            ) : view === 'teacher' ? (
                /* ============= TEACHER VIEW ============= */
                <div className="teacher-timetable-list">
                    {filteredTeachers.length === 0 ? (
                        <div className="timetable-empty">
                            <div className="timetable-empty-icon">🔍</div>
                            <h3>No Matching Results</h3>
                            <p>Try adjusting your filters to see timetable entries.</p>
                        </div>
                    ) : (
                        filteredTeachers.map(([teacherId, group]) => {
                            const activeDays = getTeacherDays(group.entries);
                            const uniqueSubjects = [...new Set(group.entries.map(e => e.subject))];
                            const uniqueGrades = [...new Set(group.entries.map(e => e.grade))];

                            return (
                                <div key={teacherId} className="teacher-timetable-card">
                                    <div className="teacher-card-header">
                                        <div className="teacher-card-info">
                                            <div className="teacher-card-avatar">
                                                {group.teacher_name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <div className="teacher-card-name">{group.teacher_name}</div>
                                                {group.teacher_arabic_name && (
                                                    <div className="teacher-card-arabic">{group.teacher_arabic_name}</div>
                                                )}
                                                {group.teacher_staff_id && (
                                                    <div className="teacher-card-id">ID: {group.teacher_staff_id}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="teacher-card-stats">
                                            <div className="teacher-stat">
                                                <div className="teacher-stat-value">{group.entries.length}</div>
                                                <div className="teacher-stat-label">Periods</div>
                                            </div>
                                            <div className="teacher-stat">
                                                <div className="teacher-stat-value">{uniqueSubjects.length}</div>
                                                <div className="teacher-stat-label">Subjects</div>
                                            </div>
                                            <div className="teacher-stat">
                                                <div className="teacher-stat-value">{uniqueGrades.length}</div>
                                                <div className="teacher-stat-label">Grades</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="teacher-week-grid">
                                        {DAYS.map(day => {
                                            const dayEntries = getEntriesForDay(group.entries, day.value);
                                            return (
                                                <div key={day.value} className="day-column">
                                                    <div className="day-column-header">{day.label.substring(0, 3)}</div>
                                                    <div className="day-column-body">
                                                        {dayEntries.length === 0 ? (
                                                            <div className="day-column-empty">—</div>
                                                        ) : (
                                                            dayEntries.map(entry => (
                                                                <div key={entry.id} className="period-chip-wrapper">
                                                                    <div className={`period-chip ${getSubjectClass(entry.subject)}`}>
                                                                        <span className="chip-period-num">P{entry.period_number}</span>
                                                                        <span className="chip-subject">{entry.subject}</span>
                                                                        <span className="chip-grade">
                                                                            Grade {entry.grade}{entry.section ? ` - ${entry.section}` : ''}
                                                                        </span>
                                                                        <span className="chip-time">
                                                                            {formatTime(entry.start_time)} – {formatTime(entry.end_time)}
                                                                        </span>
                                                                        {entry.room_number && (
                                                                            <span className="chip-room">📍 {entry.room_number}</span>
                                                                        )}
                                                                    </div>
                                                                    <button
                                                                        className="period-chip-delete"
                                                                        onClick={() => handleDelete(entry.id)}
                                                                        title="Delete this entry"
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            ) : view === 'grid' ? (
                /* ============= GRID VIEW ============= */
                <div className="grid-view-container">
                    <table className="timetable-grid">
                        <thead>
                            <tr>
                                <th>Period</th>
                                {DAYS.map(day => (
                                    <th key={day.value}>{day.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {PERIODS.map(period => (
                                <tr key={period.num}>
                                    <td>
                                        P{period.num}
                                        <span className="period-label">{period.start} – {period.end}</span>
                                    </td>
                                    {DAYS.map(day => {
                                        let dayPeriodEntries = entries.filter(
                                            e => e.day_of_week === day.value && e.period_number === period.num
                                        );  
                                        // Apply filters
                                        if (filterGrade) {
                                             dayPeriodEntries = dayPeriodEntries.filter(e => String(e.grade) === filterGrade);
                                         }
                                        if (filterSection) {
                                            dayPeriodEntries = dayPeriodEntries.filter(e => e.section === filterSection);
                                        }
                                        if (filterTeacher) {
                                            dayPeriodEntries = dayPeriodEntries.filter(e => e.teacher_name === filterTeacher);
                                        }

                                        return (
                                            <td key={day.value}>
                                                {dayPeriodEntries.length === 0 ? (
                                                    <div className="grid-cell-empty">—</div>
                                                ) : (
                                                    dayPeriodEntries.map(entry => (
                                                        <div key={entry.id} className="period-chip-wrapper">
                                                            <div className={`grid-cell-chip ${getSubjectClass(entry.subject)}`}>
                                                                <span className="cell-subject">{entry.subject}</span>
                                                                <span className="cell-teacher">
                                                                    {entry.teacher_name} • G{entry.grade}{entry.section ? `-${entry.section}` : ''}
                                                                </span>
                                                                {entry.room_number && (
                                                                    <span className="cell-room">📍 {entry.room_number}</span>
                                                                )}
                                                            </div>
                                                            <button
                                                                className="period-chip-delete"
                                                                onClick={() => handleDelete(entry.id)}
                                                                title="Delete"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* ============= SUMMARY TABLE VIEW ============= */
                (() => {
                    const summaryMap = {};
                    entries.forEach(entry => {
                        const key = entry.teacher_id || 'unassigned';
                        if (!summaryMap[key]) {
                            summaryMap[key] = {
                                name: entry.teacher_name || 'Unassigned',
                                arabic_name: entry.teacher_arabic_name || '',
                                staff_id: entry.teacher_staff_id || '—',
                                subjects: new Set(),
                                grades: new Set(),
                                days: new Set(),
                                total: 0,
                                byDay: {}
                            };
                            DAYS.forEach(d => { summaryMap[key].byDay[d.value] = []; });
                        }
                        const row = summaryMap[key];
                        row.subjects.add(entry.subject);
                        row.grades.add(String(entry.grade));
                        row.days.add(entry.day_of_week);
                        row.byDay[entry.day_of_week].push(entry);
                        row.total++;
                    });

                    const rows = Object.values(summaryMap).sort((a, b) => a.name.localeCompare(b.name));

                    return (
                        <div className="summary-view-container">
                            <table className="summary-table">
                                <thead>
                                    <tr>
                                        <th className="summary-th-teacher">Teacher</th>
                                        <th>Staff ID</th>
                                        <th>Subjects</th>
                                        <th>Grades</th>
                                        <th>Days Active</th>
                                        <th>Total Periods</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, idx) => (
                                        <>
                                            <tr key={`row-${idx}`} className="summary-teacher-row">
                                                <td>
                                                    <div className="summary-teacher-name">{row.name}</div>
                                                    {row.arabic_name && <div className="summary-teacher-arabic">{row.arabic_name}</div>}
                                                </td>
                                                <td>
                                                    <span className="summary-staff-id">{row.staff_id}</span>
                                                </td>
                                                <td>
                                                    <div className="summary-tags">
                                                        {[...row.subjects].map(s => (
                                                            <span key={s} className={`summary-tag ${getSubjectClass(s)}`}>{s}</span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="summary-tags">
                                                        {[...row.grades].sort((a, b) => Number(a) - Number(b)).map(g => (
                                                            <span key={g} className="summary-tag summary-tag-grade">G{g}</span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="summary-days">
                                                        {DAYS.map(d => (
                                                            <span key={d.value} className={`summary-day-dot ${row.days.has(d.value) ? 'active' : ''}`} title={d.label}>
                                                                {d.label.substring(0, 2)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="summary-total">{row.total}</span>
                                                </td>
                                            </tr>
                                            <tr key={`detail-${idx}`} className="summary-detail-row">
                                                <td colSpan={6}>
                                                    <div className="summary-day-breakdown">
                                                        {DAYS.filter(d => row.byDay[d.value]?.length > 0).map(d => (
                                                            <div key={d.value} className="summary-day-group">
                                                                <div className="summary-day-label">{d.label}</div>
                                                                <div className="summary-day-entries">
                                                                    {row.byDay[d.value].sort((a, b) => a.period_number - b.period_number).map(e => (
                                                                        <div key={e.id} className={`summary-entry-chip ${getSubjectClass(e.subject)}`}>
                                                                            <strong>P{e.period_number}</strong> {e.subject} — G{e.grade}{e.section ? `-${e.section}` : ''}
                                                                            {e.room_number && <span> · {e.room_number}</span>}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                })()
            )}
        </div>
    );
};

export default Timetable;
