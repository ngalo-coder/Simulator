// ai-patient-sim-gateway/src/server.js - FIXED VERSION
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

console.log('🚀 Starting Gateway...');

// Fixed CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001', 
    'https://simulatech.netlify.app', // ✅ Fixed typo
    'https://ai-patient-sim-gateway.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Service URLs
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || (process.env.NODE_ENV === 'production' 
    ? 'https://simulator-zpen.onrender.com'
    : 'http://localhost:3001'
);

// ✅ Added simulation service URL
const SIMULATION_SERVICE_URL = process.env.SIMULATION_SERVICE_URL || (process.env.NODE_ENV === 'production'
    ? 'https://ai-patient-sim-simulation.onrender.com' // Update with actual URL when deployed
    : 'http://localhost:3002'
);

console.log('🔗 Service URLs:');
console.log('  User Service:', USER_SERVICE_URL);
console.log('  Simulation Service:', SIMULATION_SERVICE_URL);

// Health check
app.get('/health', (req, res) => {
  console.log('📍 Health check requested');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'api-gateway',
    services: {
      user: USER_SERVICE_URL,
      simulation: SIMULATION_SERVICE_URL
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AI Patient Simulation Gateway',
    status: 'running',
    routes: ['/health', '/api/users/*', '/api/simulations/*']
  });
});

// User service proxy (existing)
app.use('/api/users', createProxyMiddleware({
  target: USER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': ''
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Proxying ${req.method} ${req.originalUrl} to ${USER_SERVICE_URL}${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ User Service Response: ${proxyRes.statusCode} for ${req.originalUrl}`);
  },
  onError: (err, req, res) => {
    console.error(`❌ User Service Proxy error:`, err.message);
    if (!res.headersSent) {
      res.status(503).json({
        error: 'User service unavailable',
        message: err.message
      });
    }
  }
}));

// ✅ NEW: Simulation service proxy
app.use('/api/simulations', createProxyMiddleware({
  target: SIMULATION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/simulations': '/api/simulations' // Keep the path as-is
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Proxying ${req.method} ${req.originalUrl} to ${SIMULATION_SERVICE_URL}${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ Simulation Service Response: ${proxyRes.statusCode} for ${req.originalUrl}`);
  },
  onError: (err, req, res) => {
    console.error(`❌ Simulation Service Proxy error:`, err.message);
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Simulation service unavailable', 
        message: err.message,
        suggestion: 'The simulation service may not be deployed yet. Please check service status.'
      });
    }
  }
}));

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    availableRoutes: ['GET /', 'GET /health', 'ALL /api/users/*', 'ALL /api/simulations/*']
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Gateway running on http://localhost:${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
  console.log(`🔗 Proxying:`);
  console.log(`   /api/users/* -> ${USER_SERVICE_URL}`);
  console.log(`   /api/simulations/* -> ${SIMULATION_SERVICE_URL}`);
});

module.exports = app;