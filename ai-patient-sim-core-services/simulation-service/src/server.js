// ai-patient-sim-core-services/simulation-service/src/server.js - UPDATED WITH HEALTH CHECK
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const simulationRoutes = require('./routes/simulation');

const app = express();
const PORT = process.env.PORT || 3002;

console.log('🏥 Starting Simulation Service...');

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// CORS configuration
app.use(
  cors({
    origin: [
      'http://localhost:3000', // Frontend dev
      'http://localhost:4000', // Gateway dev
      'https://simuatech.netlify.app', // Frontend production - fixed typo
      'https://ai-patient-sim-gateway.onrender.com', // Gateway production
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

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-patient-sim';

mongoose
  .connect(MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'simulation-service',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    port: PORT,
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AI Patient Simulation Service',
    status: 'running',
    version: '1.0.0',
    endpoints: [
      'GET /health',
      'GET /api/simulations/cases',
      'POST /api/simulations/start',
      'POST /api/simulations/:id/message',
      'POST /api/simulations/:id/action',
      'GET /api/simulations/:id',
      'POST /api/simulations/:id/pause',
      'POST /api/simulations/:id/resume',
      'POST /api/simulations/:id/complete',
      'GET /api/simulations/user/history',
      'GET /api/simulations/stats/overview',
    ],
  });
});

// API routes
app.use('/api/simulations', simulationRoutes);

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    service: 'simulation-service',
    requestedPath: req.originalUrl,
    availableRoutes: ['GET /', 'GET /health', 'ALL /api/simulations/*'],
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    service: 'simulation-service'
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  try {
    await mongoose.connection.close();
    console.log('📦 MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  try {
    await mongoose.connection.close();
    console.log('📦 MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
    process.exit(1);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🏥 Simulation Service running on http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API endpoints: http://localhost:${PORT}/api/simulations`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;