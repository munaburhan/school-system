import { useState } from 'react';
import api from '../services/api';
import './DataEntry.css';

const DataEntry = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [importType, setImportType] = useState('students');
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState(null);

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
        setResults(null);
    };

    const handleImport = async () => {
        if (!selectedFile) {
            alert('Please select a file first');
            return;
        }

        setUploading(true);
        setResults(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await api.post(`/import/${importType}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setResults(response.data.results);
            setSelectedFile(null);

            // Reset file input
            document.getElementById('fileInput').value = '';

            alert(`Import completed!\nSuccessful: ${response.data.results.successful}\nFailed: ${response.data.results.failed}`);
        } catch (error) {
            console.error('Import error:', error);
            alert(error.response?.data?.error || 'Failed to import file');
        } finally {
            setUploading(false);
        }
    };

    const downloadTemplate = async () => {
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
            link.remove();
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download template');
        }
    };

    return (
        <div className="data-entry-page">
            <h1>Data Import</h1>
            <p>Import students or staff from Excel/CSV files</p>

            <div className="card import-card">
                <h2>Import Data</h2>

                <div className="form-group">
                    <label>Import Type</label>
                    <select value={importType} onChange={(e) => setImportType(e.target.value)}>
                        <option value="students">Students</option>
                        <option value="staff">Staff</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Select File (Excel or CSV)</label>
                    <input
                        id="fileInput"
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileChange}
                    />
                    {selectedFile && (
                        <p className="file-info">Selected: {selectedFile.name}</p>
                    )}
                </div>

                <div className="button-group">
                    <button
                        className="btn btn-primary"
                        onClick={handleImport}
                        disabled={!selectedFile || uploading}
                    >
                        {uploading ? 'Importing...' : 'Import Data'}
                    </button>

                    <button
                        className="btn btn-success"
                        onClick={downloadTemplate}
                    >
                        📥 Download Template
                    </button>
                </div>
            </div>

            {results && (
                <div className="card results-card">
                    <h2>Import Results</h2>

                    <div className="results-summary">
                        <div className="result-stat">
                            <span className="stat-label">Total Records:</span>
                            <span className="stat-value">{results.total}</span>
                        </div>
                        <div className="result-stat success">
                            <span className="stat-label">Successful:</span>
                            <span className="stat-value">{results.successful}</span>
                        </div>
                        <div className="result-stat failed">
                            <span className="stat-label">Failed:</span>
                            <span className="stat-value">{results.failed}</span>
                        </div>
                    </div>

                    {results.errors && results.errors.length > 0 && (
                        <div className="errors-section">
                            <h3>Errors</h3>
                            <div className="errors-list">
                                {results.errors.map((error, index) => (
                                    <div key={index} className="error-item">
                                        <strong>Row {error.row}:</strong> {error.error}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="card instructions-card">
                <h2>📋 Instructions</h2>

                <h3>How to Import Data:</h3>
                <ol>
                    <li>Click <strong>"Download Template"</strong> to get the Excel template</li>
                    <li>Open the template and fill in your data</li>
                    <li>Save the file</li>
                    <li>Select the import type (Students or Staff)</li>
                    <li>Click <strong>"Choose File"</strong> and select your Excel file</li>
                    <li>Click <strong>"Import Data"</strong></li>
                </ol>

                <h3>📊 Students Template Format:</h3>
                <table className="template-table">
                    <thead>
                        <tr>
                            <th>student_id</th>
                            <th>english_name</th>
                            <th>arabic_name</th>
                            <th>current_grade</th>
                            <th>date_of_birth</th>
                            <th>status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>S001</td>
                            <td>John Smith</td>
                            <td>جون سميث</td>
                            <td>Grade 10</td>
                            <td>2008-05-15</td>
                            <td>active</td>
                        </tr>
                    </tbody>
                </table>

                <h3>👨‍🏫 Staff Template Format:</h3>
                <table className="template-table">
                    <thead>
                        <tr>
                            <th>username</th>
                            <th>password</th>
                            <th>email</th>
                            <th>english_name</th>
                            <th>arabic_name</th>
                            <th>role</th>
                            <th>department</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>teacher1</td>
                            <td>default123</td>
                            <td>teacher@school.com</td>
                            <td>Ahmed Ali</td>
                            <td>أحمد علي</td>
                            <td>teacher</td>
                            <td>Math</td>
                        </tr>
                    </tbody>
                </table>

                <div className="notes">
                    <h4>📝 Important Notes:</h4>
                    <ul>
                        <li><strong>Required fields</strong> are marked with * in the template</li>
                        <li>If a student/staff with the same ID/username exists, it will be <strong>updated</strong></li>
                        <li>Date format should be: YYYY-MM-DD (e.g., 2008-05-15)</li>
                        <li>Status can be: active or inactive</li>
                        <li>Staff roles: teacher, leader, vice_principal, principal</li>
                        <li>The system will show you which rows failed and why</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default DataEntry;
