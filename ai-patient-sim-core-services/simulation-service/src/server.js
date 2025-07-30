// ai-patient-sim-core-services/simulation-service/src/server.js - UPDATED WITH TEMPLATE ROUTES
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const simulationRoutes = require('./routes/simulation');
const templateSimulationRoutes = require('./routes/templateSimulation');

const app = express();
const PORT = process.env.PORT || 3002;

console.log('🏥 Starting Enhanced Simulation Service with Template Support...');

// Security middleware
app.use(helmet());

// Rate limiting with different limits for different endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for API endpoints
  message: 'Too many API requests from this IP, please try again later.',
});

app.use('/', generalLimiter);
app.use('/api/', apiLimiter);

// CORS configuration with enhanced origins
app.use(
  cors({
    origin: [
      'http://localhost:3000', // Frontend dev
      'http://localhost:4000', // Gateway dev
      'http://localhost:5173', // Vite dev server
      'https://simuatech.netlify.app', // Frontend production
      'https://ai-patient-sim-gateway.onrender.com', // Gateway production
      process.env.FRONTEND_URL,
      process.env.GATEWAY_URL,
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    preflightContinue: false,
    optionsSuccessStatus: 200
  })
);

// Handle preflight requests explicitly
app.options('*', cors());

// Body parsing middleware with increased limits for template data
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook verification if needed
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// MongoDB connection with enhanced options
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-patient-sim';

mongoose
  .connect(MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferCommands: false, // Disable mongoose buffering
    bufferMaxEntries: 0, // Disable mongoose buffering
  })
  .then(() => {
    console.log('✅ Connected to MongoDB');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Enhanced health check endpoint
app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'simulation-service',
    version: '2.0.0-template-enabled',
    database: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      name: mongoose.connection.db?.databaseName || 'unknown'
    },
    features: {
      regularSimulations: true,
      templateSimulations: true,
      aiEnhancedDialogue: true,
      reportGeneration: true
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: PORT,
      openRouterConfigured: !!process.env.OPENROUTER_API_KEY
    },
    memory: process.memoryUsage(),
    uptime: process.uptime()
  };

  res.json(healthCheck);
});

// Enhanced root endpoint with API documentation
app.get('/', (req, res) => {
  res.json({
    message: 'AI Patient Simulation Service - Template Enhanced',
    status: 'running',
    version: '2.0.0',
    features: [
      'Regular Patient Simulations',
      'Template-Based Simulations', 
      'AI-Enhanced Dialogue',
      'Clinical Action Processing',
      'Performance Analytics',
      'Multi-language Support'
    ],
    endpoints: {
      regular_simulations: [
        'GET /api/simulations/cases - Get available cases',
        'POST /api/simulations/start - Start new simulation',
        'POST /api/simulations/:id/message - Send message',
        'POST /api/simulations/:id/action - Perform clinical action',
        'GET /api/simulations/:id - Get simulation details',
        'POST /api/simulations/:id/pause - Pause simulation',
        'POST /api/simulations/:id/resume - Resume simulation',
        'POST /api/simulations/:id/complete - Complete simulation',
        'GET /api/simulations/:id/report - Get detailed report',
        'GET /api/simulations/user/history - Get user history',
        'GET /api/simulations/stats/overview - Get statistics'
      ],
      template_simulations: [
        'GET /api/template-simulations/cases - Get template cases',
        'GET /api/template-simulations/cases/:caseId - Get case details',
        'POST /api/template-simulations/start - Start template simulation',
        'POST /api/template-simulations/:id/message - Send message',
        'POST /api/template-simulations/:id/action - Perform clinical action',
        'POST /api/template-simulations/:id/complete - Complete with evaluation',
        'POST /api/template-simulations/:id/pause - Pause simulation',
        'POST /api/template-simulations/:id/resume - Resume simulation',
        'GET /api/template-simulations/:id - Get simulation status',
        'GET /api/template-simulations/:id/results - Get detailed results'
      ],
      utility: [
        'GET /health - Service health check',
        'GET / - API documentation'
      ]
    },
    documentation: {
      template_structure: 'Uses universal template format v3.1-program-aware',
      authentication: 'JWT token required for all simulation endpoints',
      rate_limits: '100 requests per 15 minutes for general, 200 for API',
      supported_programs: ['Basic Program', 'Specialty Program'],
      supported_specialties: ['Internal Medicine', 'Pediatrics', 'Obstetrics and Gynecology', 'Emergency Medicine']
    }
  });
});

// API routes
app.use('/api/simulations', simulationRoutes);
app.use('/api/template-simulations', templateSimulationRoutes);

// Serve static files for case templates (if any)
app.use('/static', express.static(path.join(__dirname, 'public')));

// API versioning support
app.use('/api/v1/simulations', simulationRoutes);
app.use('/api/v1/template-simulations', templateSimulationRoutes);

// Generic API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'AI Patient Simulation API',
    version: '2.0.0',
    available_versions: ['v1'],
    endpoints: {
      current: '/api/',
      v1: '/api/v1/',
      health: '/health'
    },
    features: {
      regular_simulations: 'Traditional patient case simulations',
      template_simulations: 'Universal template-based patient cases',
      ai_dialogue: 'Enhanced natural language patient responses',
      clinical_actions: 'Comprehensive clinical action processing',
      performance_analytics: 'Detailed learning analytics and reports'
    }
  });
});

// Enhanced 404 handler with helpful suggestions
app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl} from ${req.ip}`);
  
  const suggestions = [];
  const path = req.originalUrl.toLowerCase();
  
  if (path.includes('simulation')) {
    suggestions.push('/api/simulations/ - Regular simulations');
    suggestions.push('/api/template-simulations/ - Template-based simulations');
  }
  
  if (path.includes('case')) {
    suggestions.push('/api/simulations/cases - Get available cases');
    suggestions.push('/api/template-simulations/cases - Get template cases');
  }
  
  if (path.includes('health')) {
    suggestions.push('/health - Service health check');
  }

  res.status(404).json({
    error: 'Route not found',
    service: 'simulation-service',
    version: '2.0.0',
    requestedPath: req.originalUrl,
    method: req.method,
    suggestions: suggestions.length > 0 ? suggestions : [
      'GET / - API documentation',
      'GET /health - Health check',
      'GET /api/ - API information',
      'GET /api/simulations/cases - Available cases',
      'GET /api/template-simulations/cases - Template cases'
    ],
    timestamp: new Date().toISOString()
  });
});

// Enhanced error handling middleware
app.use((error, req, res, next) => {
  const timestamp = new Date().toISOString();
  const errorId = require('crypto').randomUUID();
  
  console.error(`❌ ${timestamp} [${errorId}] Unhandled error on ${req.method} ${req.path}:`, error);
  
  // Different error responses based on error type
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      message: error.message,
      service: 'simulation-service',
      errorId,
      timestamp
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid data format',
      message: 'Invalid ID or data format provided',
      service: 'simulation-service',
      errorId,
      timestamp
    });
  }
  
  if (error.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate data',
      message: 'Resource already exists',
      service: 'simulation-service',
      errorId,
      timestamp
    });
  }

  // Generic error response
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    service: 'simulation-service',
    errorId,
    timestamp,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

// Graceful shutdown handlers
const gracefulShutdown = async (signal) => {
  console.log(`🛑 ${signal} received, shutting down gracefully`);
  
  try {
    // Close database connection
    await mongoose.connection.close();
    console.log('📦 MongoDB connection closed');
    
    // Here you could add cleanup for active simulations, Redis connections, etc.
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🏥 Enhanced Simulation Service running on http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Regular simulations: http://localhost:${PORT}/api/simulations`);
  console.log(`📋 Template simulations: http://localhost:${PORT}/api/template-simulations`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🤖 OpenRouter: ${process.env.OPENROUTER_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`📊 MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting...'}`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
});

module.exports = app;