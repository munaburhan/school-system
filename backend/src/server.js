import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import importRoutes from './routes/importRoutes.js';

dotenv.config();

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🔧 Environment:', process.env.NODE_ENV);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Serve static assets in production FIRST (before CORS)
if (process.env.NODE_ENV === 'production') {
    const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
    console.log('📁 Serving static files from:', frontendDistPath);
    app.use(express.static(frontendDistPath));
}

// CORS Configuration - ONLY for API routes
const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.RENDER_EXTERNAL_URL, // Auto-set by Render
    'https://my-school-system-jq2z.onrender.com', // Specific URL from logs
    'http://localhost:5173',
    'http://localhost:5000'
].filter(Boolean);

console.log('🌐 Allowed CORS Origins:', allowedOrigins);

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            console.warn('⚠️  CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};

// Apply CORS only to API routes
app.use('/api', cors(corsOptions));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/import', importRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'School Management System API is running',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

// Serve React app for remaining routes in production
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
        console.log('📄 Serving index.html for:', req.path);
        res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
}

// 404 handler for API routes only
app.use('/api/*', (req, res) => {
    console.warn('⚠️  404 - API route not found:', req.path);
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('❌ Error full stack:', err.stack);
    res.status(500).json({ error: 'Internal server error', message: err.message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📍 API: http://localhost:${PORT}`);
    console.log(`🏥 Health: http://localhost:${PORT}/health\n`);
});

export default app;
