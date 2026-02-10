import { useState } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import './DataEntry.css';

const DataEntry = () => {
    const { t } = useTranslation();
    const [selectedFile, setSelectedFile] = useState(null);
    const [importType, setImportType] = useState('students');
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState(null);

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
        setResults(null);
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await api.get(`/import/template/${importType}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${importType}_template.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error('Error downloading template:', error);
            alert('Failed to download template');
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile);

        setUploading(true);
        setResults(null);

        try {
            const response = await api.post(`/import/${importType}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setResults(response.data.results);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert(error.response?.data?.error || 'Failed to import data');
        } finally {
            setUploading(false);
        }
    };

    const studentColumns = [
        'student_id (Required)', 'english_name (Required)', 'arabic_name',
        'current_grade', 'date_of_birth (YYYY-MM-DD)', 'status'
    ];

    const staffColumns = [
        'username (Required)', 'password', 'email', 'english_name (Required)',
        'arabic_name', 'role', 'department'
    ];

    return (
        <div className="data-entry-page">
            <h1>{t('data_entry')}</h1>

            <div className="import-section card">
                <div className="import-type-selector">
                    <h2>{t('select_import_type')}</h2>
                    <div className="radio-group">
                        <label className={`radio-card ${importType === 'students' ? 'active' : ''}`}>
                            <input
                                type="radio"
                                value="students"
                                checked={importType === 'students'}
                                onChange={(e) => setImportType(e.target.value)}
                            />
                            <span className="icon">👨‍🎓</span>
                            <span>{t('students_import')}</span>
                        </label>
                        <label className={`radio-card ${importType === 'staff' ? 'active' : ''}`}>
                            <input
                                type="radio"
                                value="staff"
                                checked={importType === 'staff'}
                                onChange={(e) => setImportType(e.target.value)}
                            />
                            <span className="icon">👨‍🏫</span>
                            <span>{t('staff_import')}</span>
                        </label>
                    </div>
                </div>

                <div className="action-buttons">
                    <button onClick={handleDownloadTemplate} className="btn btn-secondary">
                        📥 {t('download_template')}
                    </button>
                </div>

                <div className="upload-area">
                    <h3>{t('upload_file')}</h3>
                    <div className="file-drop-zone">
                        <input
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            onChange={handleFileChange}
                            id="file-upload"
                        />
                        <label htmlFor="file-upload">
                            {selectedFile ? (
                                <span className="file-name">📄 {selectedFile.name}</span>
                            ) : (
                                <span>{t('drag_drop')}</span>
                            )}
                            <br />
                            <small>{t('supported_formats')}</small>
                        </label>
                    </div>

                    <button
                        onClick={handleUpload}
                        className="btn btn-primary"
                        disabled={!selectedFile || uploading}
                    >
                        {uploading ? t('uploading') : t('import_data')}
                    </button>
                </div>
            </div>

            {results && (
                <div className="results-section card">
                    <h2>{t('import_results')}</h2>
                    <div className="stats-row">
                        <div className="stat-box total">
                            <span className="label">{t('total_records')}</span>
                            <span className="value">{results.total}</span>
                        </div>
                        <div className="stat-box success">
                            <span className="label">{t('successful')}</span>
                            <span className="value">{results.successful}</span>
                        </div>
                        <div className="stat-box failed">
                            <span className="label">{t('failed')}</span>
                            <span className="value">{results.failed}</span>
                        </div>
                    </div>

                    {results.errors.length > 0 && (
                        <div className="error-details">
                            <h3>{t('error_details')}</h3>
                            <table className="error-table">
                                <thead>
                                    <tr>
                                        <th>{t('row')}</th>
                                        <th>{t('error')}</th>
                                        <th>{t('data')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.errors.map((err, index) => (
                                        <tr key={index}>
                                            <td>{err.row}</td>
                                            <td className="error-msg">{err.error}</td>
                                            <td className="error-data">
                                                <pre>{JSON.stringify(err.data, null, 2)}</pre>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <div className="instructions-section card">
                <h2>{t('instructions')}</h2>
                <ol>
                    <li>{t('instruction_1')}</li>
                    <li>{t('instruction_2')}</li>
                    <li>{t('instruction_3')}</li>
                    <li>{t('instruction_4')}</li>
                </ol>

                <div className="columns-info">
                    <h3>{t('template_columns')}:</h3>
                    <div className="tags">
                        {importType === 'students' ? (
                            studentColumns.map(col => <span key={col} className="tag">{col}</span>)
                        ) : (
                            staffColumns.map(col => <span key={col} className="tag">{col}</span>)
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataEntry;
