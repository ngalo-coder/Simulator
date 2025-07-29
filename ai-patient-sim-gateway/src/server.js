// ai-patient-sim-gateway/src/server.js - UPDATED WITH BETTER ERROR HANDLING
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
    'https://simuatech.netlify.app', // ✅ Fixed typo
    'https://ai-patient-sim-gateway.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Service URLs
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || (process.env.NODE_ENV === 'production' 
    ? 'https://simulator-zpen.onrender.com'
    : 'http://localhost:3001'
);

const SIMULATION_SERVICE_URL = process.env.SIMULATION_SERVICE_URL || (process.env.NODE_ENV === 'production'
    ? 'https://ai-patient-sim-simulation-service.onrender.com' // Fixed URL to match render.yaml service name
    : 'http://localhost:3002'
);

console.log('🔗 Service URLs:');
console.log('  User Service:', USER_SERVICE_URL);
console.log('  Simulation Service:', SIMULATION_SERVICE_URL);

// Logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${new Date().toISOString()} - ${req.method} ${req.url} from ${req.get('origin') || 'unknown'}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  console.log('📍 Health check requested');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'api-gateway',
    version: '1.0.0',
    services: {
      user: {
        url: USER_SERVICE_URL,
        configured: !!USER_SERVICE_URL
      },
      simulation: {
        url: SIMULATION_SERVICE_URL,
        configured: !!SIMULATION_SERVICE_URL
      }
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AI Patient Simulation Gateway',
    status: 'running',
    version: '1.0.0',
    routes: ['/health', '/api/users/*', '/api/simulations/*'],
    services: {
      userService: USER_SERVICE_URL,
      simulationService: SIMULATION_SERVICE_URL
    }
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
    console.log(`🔄 [USER] Proxying ${req.method} ${req.originalUrl} to ${USER_SERVICE_URL}${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ [USER] Response: ${proxyRes.statusCode} for ${req.originalUrl}`);
  },
  onError: (err, req, res) => {
    console.error(`❌ [USER] Proxy error for ${req.originalUrl}:`, err.message);
    if (!res.headersSent) {
      res.status(503).json({
        error: 'User service unavailable',
        message: err.message,
        service: 'user-service',
        timestamp: new Date().toISOString()
      });
    }
  }
}));

// Simulation service proxy with graceful degradation
const simulationProxy = createProxyMiddleware({
  target: SIMULATION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/simulations': '/api/simulations'
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 [SIMULATION] Proxying ${req.method} ${req.originalUrl} to ${SIMULATION_SERVICE_URL}${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ [SIMULATION] Response: ${proxyRes.statusCode} for ${req.originalUrl}`);
  },
  onError: (err, req, res) => {
    console.error(`❌ [SIMULATION] Proxy error for ${req.originalUrl}:`, err.message);
    
    if (!res.headersSent) {
      // Return helpful error responses for different endpoints
      if (req.url.includes('/health')) {
        res.status(503).json({
          status: 'unhealthy',
          service: 'simulation-service',
          error: 'Service unavailable',
          message: err.message,
          timestamp: new Date().toISOString()
        });
      } else if (req.url.includes('/cases')) {
        res.status(503).json({
          success: false,
          error: 'Simulation service unavailable',
          message: 'Cannot fetch cases at this time. Please try again later.',
          cases: [], // Empty array for graceful degradation
          timestamp: new Date().toISOString()
        });
      } else if (req.url.includes('/stats') || req.url.includes('/history')) {
        res.status(503).json({
          success: false,
          error: 'Simulation service unavailable',
          overview: {
            totalSimulations: 0,
            completedSimulations: 0,
            activeSimulations: 0,
            completionRate: 0
          },
          simulations: [],
          programBreakdown: [],
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({
          success: false,
          error: 'Simulation service unavailable',
          message: 'The simulation service is currently unavailable. Please try again later.',
          suggestion: 'Check service status or contact support if the issue persists.',
          timestamp: new Date().toISOString()
        });
      }
    }
  }
});

// Apply simulation proxy
app.use('/api/simulations', simulationProxy);

// Health check endpoints for individual services
app.get('/health/users', createProxyMiddleware({
  target: USER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/health/users': '/health' },
  onError: (err, req, res) => {
    if (!res.headersSent) {
      res.status(503).json({ status: 'unhealthy', service: 'user-service', error: err.message });
    }
  }
}));

app.get('/health/simulations', createProxyMiddleware({
  target: SIMULATION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/health/simulations': '/health' },
  onError: (err, req, res) => {
    if (!res.headersSent) {
      res.status(503).json({ status: 'unhealthy', service: 'simulation-service', error: err.message });
    }
  }
}));

// 404 handler with helpful information
app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    requestedPath: req.originalUrl,
    method: req.method,
    availableRoutes: [
      'GET /',
      'GET /health',
      'GET /health/users',
      'GET /health/simulations',
      'ALL /api/users/*',
      'ALL /api/simulations/*'
    ],
    services: {
      userService: USER_SERVICE_URL,
      simulationService: SIMULATION_SERVICE_URL
    },
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Unhandled error:', err);
  if (!res.headersSent) {
    res.status(500).json({
      error: 'Internal gateway error',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Gateway running on http://localhost:${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
  console.log(`🔗 Proxying:`);
  console.log(`   /api/users/* -> ${USER_SERVICE_URL}`);
  console.log(`   /api/simulations/* -> ${SIMULATION_SERVICE_URL}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;