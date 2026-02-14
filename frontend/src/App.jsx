import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Staff from './pages/Staff';
import DataEntry from './pages/DataEntry';
import './index.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/students" element={
              <ProtectedRoute>
                <Layout>
                  <Students />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/staff" element={
              <ProtectedRoute>
                <Layout>
                  <div className="card">
                    <h1>Staff Management</h1>
                    <p>Staff management page coming soon...</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/attendance" element={
              <ProtectedRoute>
                <Layout>
                  <div className="card">
                    <h1>Attendance</h1>
                    <p>Attendance page coming soon...</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/timetable" element={
              <ProtectedRoute>
                <Layout>
                  <div className="card">
                    <h1>Timetable</h1>
                    <p>Timetable page coming soon...</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/behavior" element={
              <ProtectedRoute>
                <Layout>
                  <div className="card">
                    <h1>Behavior Management</h1>
                    <p>Behavior page coming soon...</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/exams" element={
              <ProtectedRoute>
                <Layout>
                  <div className="card">
                    <h1>Exams Management</h1>
                    <p>Exams page coming soon...</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/teacher-assignments" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <div className="card">
                    <h1>Teacher Assignments</h1>
                    <p>Teacher assignments page coming soon...</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/data-entry" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <DataEntry />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary >
  );
}

export default App;
