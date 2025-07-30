const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Load routes with error handling
let authRoutes, profileRoutes, transitionRoutes;

try {
  authRoutes = require('./routes/auth');
  console.log('✅ Auth routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading auth routes:', error.message);
  process.exit(1);
}

try {
  profileRoutes = require('./routes/profile');
  console.log('✅ Profile routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading profile routes:', error.message);
  process.exit(1);
}

try {
  transitionRoutes = require('./routes/transitions');
  console.log('✅ Transition routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading transition routes:', error.message);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🏥 Starting Enhanced User Service with Progression Management...');
console.log(`📍 Port: ${PORT}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : 'NOT CONFIGURED'}`);
console.log(`📊 MongoDB URI: ${process.env.MONGODB_URI ? 'Configured' : 'NOT CONFIGURED'}`);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:3002',
      'http://localhost:4000',
      'https://simuatech.netlify.app',  // ✅ Fixed typo - removed extra 'l'
      'https://ai-patient-sim-gateway.onrender.com',
      process.env.FRONTEND_URL,
      process.env.GATEWAY_URL,
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 200
  })
);

// Handle preflight requests explicitly
app.options('*', cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
});
app.use(limiter);

// Request logging
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url} from ${req.get('origin') || 'unknown'}`);
  next();
});

// Body parsing - Fixed for Express 4.x
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection
console.log('Attempting to connect to MongoDB...');
mongoose
  .connect(process.env.MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    // Removed deprecated options for newer MongoDB driver compatibility
  })
  .then(() => {
    console.log('✅ Connected to MongoDB');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('🔍 Connection string (sanitized):', process.env.MONGODB_URI?.replace(/\/\/.*@/, '//***:***@'));
    
    // Don't exit in production, allow service to start for health checks
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    } else {
      console.log('⚠️ Service starting without database connection (production mode)');
    }
  });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('MongoDB connection is open.');
});
db.on('disconnected', () => {
  console.log('MongoDB disconnected.');
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'user-service',
    version: '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Routes with error handling
try {
  app.use('/auth', authRoutes);
  console.log('✅ Auth routes registered');
} catch (error) {
  console.error('❌ Error registering auth routes:', error.message);
}

try {
  app.use('/profile', profileRoutes);
  console.log('✅ Profile routes registered');
} catch (error) {
  console.error('❌ Error registering profile routes:', error.message);
}

try {
  app.use('/transitions', transitionRoutes);
  console.log('✅ Transition routes registered');
} catch (error) {
  console.error('❌ Error registering transition routes:', error.message);
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AI Patient Simulation - User Service',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      register: 'POST /auth/register',
      login: 'POST /auth/login',
      profile: 'GET /auth/profile',
      updateProfile: 'PUT /auth/profile',
      logout: 'POST /auth/logout',
      // Extended endpoints
      extendedProfile: 'GET /profile',
      updateExtendedProfile: 'PUT /profile',
      permissions: 'GET /profile/permissions',
      progressionRequirements: 'GET /profile/progression-requirements',
      transitionHistory: 'GET /transitions/history',
      requestTransition: 'POST /transitions/request',
      checkAutoProgression: 'POST /transitions/check-auto-progression'
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('User service error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
  });
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
  });
});

// Unhandled exception handler
process.on('uncaughtException', (err) => {
  console.error('Unhandled Exception:', {
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  mongoose.connection.close(() => {
    process.exit(0);
  });
});

app.listen(PORT, () => {
  console.log(`🚀 User Service running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;