const path = require('path');
const fs = require('fs');

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

dotenv.config();

// Connect to Database
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { initCronJobs } = require('./jobs/attendanceCron');

const mongoose = require('mongoose');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const adminRoutes = require('./routes/adminRoutes');
const officeRoutes = require('./routes/officeRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Database Connection
connectDB();

// Security & Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Prevent issues with inline scripts/styles in production frontend
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
  : null;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, same-origin, curl)
      if (!origin) {
        return callback(null, true);
      }

      // If no custom whitelist is specified or wildcard is present, allow all origins
      if (!allowedOrigins || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Automatically allow standard cloud deployment domains
      if (
        origin.includes('.onrender.com') ||
        origin.includes('.vercel.app') ||
        origin.includes('.netlify.app') ||
        origin.includes('localhost')
      ) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  })
);

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// Health Check Endpoint (Both /api/v1/health and /health)
const handleHealthCheck = (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: 'UP',
    database: isDbConnected ? 'connected' : 'disconnected',
    message: isDbConnected
      ? 'Attendance System API Server is Healthy & Operational'
      : 'Attendance System API Server is Running. Note: Database is disconnected (configure MONGO_URI in backend/.env).',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
  });
};
app.get('/api/v1/health', handleHealthCheck);
app.get('/health', handleHealthCheck);

// Middleware to guard database operations when disconnected (covers /api/v1 and all route aliases)
const guardedPrefixes = ['/api/v1', '/auth', '/admin', '/attendance', '/leaves', '/office', '/notifications'];
app.use(guardedPrefixes, (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database is not connected. Please start MongoDB or provide a valid MONGO_URI in backend/.env',
    });
  }
  next();
});

// API Routes Mounting (support both /api/v1/* and direct /* aliases)
app.use('/api/v1/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/v1/admin', adminRoutes);
app.use('/admin', adminRoutes);

app.use('/api/v1/attendance', attendanceRoutes);
app.use('/attendance', attendanceRoutes);

app.use('/api/v1/leaves', leaveRoutes);
app.use('/leaves', leaveRoutes);

app.use('/api/v1/office', officeRoutes);
app.use('/office', officeRoutes);

app.use('/api/v1/notifications', notificationRoutes);
app.use('/notifications', notificationRoutes);

// Root Route (Displays API Status when frontend is hosted separately on Vercel)
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    name: 'SANEKT Attendance Management System API',
    status: 'ONLINE',
    healthCheck: '/api/v1/health',
    timestamp: new Date().toISOString(),
  });
});

// Static file serving for Frontend (Single-server Deployment fallback)
const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  // 404 Handler for undefined API routes
  app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: 'API Route Not Found' });
  });
}

// Central Error Handler
app.use(errorHandler);

// Initialize Automated Background Jobs
initCronJobs();

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Attendance Backend Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`📡 Health Check URL: http://localhost:${PORT}/api/v1/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`);
  // Keep server running in development mode
});

module.exports = app;
