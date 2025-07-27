const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy setting for Render
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:4000',
    'https://simuatech.netlify.app',
    'https://ai-patient-sim-gateway.onrender.com',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`📨 ${new Date().toISOString()} - ${req.method} ${req.url} from ${req.ip}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📦 Body:`, JSON.stringify(req.body, null, 2));
  }
  next();
});

// Service URLs configuration
const services = {
  users: process.env.USER_SERVICE_URL || 'https://ai-patient-sim-user-service.onrender.com',
  simulation: process.env.SIMULATION_SERVICE_URL || null,
  clinical: process.env.CLINICAL_SERVICE_URL || null,
  cases: process.env.CASE_SERVICE_URL || null,
  analytics: process.env.ANALYTICS_SERVICE_URL || null
};

// Log service configuration on startup
console.log('🔧 Service Configuration:');
Object.entries(services).forEach(([name, url]) => {
  console.log(`  ${name}: ${url || 'NOT CONFIGURED'}`);
});

// Enhanced proxy creation function
const createProxy = (target, pathRewrite) => {
  console.log(`🔗 Creating proxy for target: ${target}`);
  
  // If service is not deployed yet, return service unavailable
  if (!target || target === 'null' || target === 'undefined') {
    return (req, res, next) => {
      console.log(`⚠️ Service not available: ${req.originalUrl}`);
      res.status(503).json({
        error: 'Service temporarily unavailable',
        message: 'Service is being deployed or configured',
        retry: true,
        service: req.originalUrl.split('/')[2] // Extract service name from URL
      });
    };
  }

  // Validate URL format
  try {
    new URL(target);
  } catch (error) {
    console.error(`❌ Invalid target URL: ${target}`);
    return (req, res, next) => {
      res.status(503).json({
        error: 'Service configuration error',
        message: 'Invalid service URL configuration',
        retry: false
      });
    };
  }

  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    timeout: 30000,
    logLevel: 'debug',
    onProxyReq: (proxyReq, req, res) => {
      console.log(`🔄 Proxying ${req.method} ${req.originalUrl} to ${target}`);
      console.log(`📍 Target path: ${target}${req.url}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`✅ Proxy response: ${proxyRes.statusCode} for ${req.originalUrl}`);
      
      // Add CORS headers if missing
      if (!proxyRes.headers['access-control-allow-origin']) {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
    },
    onError: (err, req, res) => {
      console.error(`❌ Proxy error for ${target}:`, {
        message: err.message,
        code: err.code,
        url: req.originalUrl,
        method: req.method
      });
      
      if (!res.headersSent) {
        // Determine error type and provide appropriate response
        let errorResponse;
        
        if (err.code === 'ECONNREFUSED') {
          errorResponse = {
            error: 'Service connection refused',
            message: 'Target service is not responding',
            code: 'CONNECTION_REFUSED',
            retry: true
          };
        } else if (err.code === 'ETIMEDOUT') {
          errorResponse = {
            error: 'Service timeout',
            message: 'Target service took too long to respond',
            code: 'TIMEOUT',
            retry: true
          };
        } else if (err.code === 'ENOTFOUND') {
          errorResponse = {
            error: 'Service not found',
            message: 'Target service domain not found',
            code: 'NOT_FOUND',
            retry: false
          };
        } else {
          errorResponse = {
            error: 'Service temporarily unavailable',
            message: err.message,
            code: err.code || 'UNKNOWN',
            retry: true
          };
        }
        
        res.status(503).json(errorResponse);
      }
    }
  });
};

// Health check endpoint
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'api-gateway',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      configured: Object.entries(services).filter(([_, url]) => url).length,
      total: Object.keys(services).length,
      urls: services
    }
  };
  
  console.log('🏥 Health check requested:', healthStatus);
  res.json(healthStatus);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AI Patient Simulation Platform API Gateway',
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      users: '/api/users/*',
      simulation: '/api/simulation/*',
      clinical: '/api/clinical/*',
      cases: '/api/cases/*',
      analytics: '/api/analytics/*'
    },
    services: {
      configured: Object.entries(services).reduce((acc, [key, url]) => {
        acc[key] = { 
          url: url || 'not-configured',
          status: url ? 'configured' : 'pending'
        };
        return acc;
      }, {})
    }
  });
});

// Service route configurations
app.use('/api/users', createProxy(services.users, { '^/api/users': '' }));
app.use('/api/simulation', createProxy(services.simulation, { '^/api/simulation': '' }));
app.use('/api/clinical', createProxy(services.clinical, { '^/api/clinical': '' }));
app.use('/api/cases', createProxy(services.cases, { '^/api/cases': '' }));
app.use('/api/analytics', createProxy(services.analytics, { '^/api/analytics': '' }));

// Test endpoint for debugging
app.get('/debug/services', (req, res) => {
  res.json({
    message: 'Service Debug Information',
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT
    },
    services: services,
    environmentVariables: {
      USER_SERVICE_URL: process.env.USER_SERVICE_URL,
      SIMULATION_SERVICE_URL: process.env.SIMULATION_SERVICE_URL,
      CLINICAL_SERVICE_URL: process.env.CLINICAL_SERVICE_URL,
      CASE_SERVICE_URL: process.env.CASE_SERVICE_URL,
      ANALYTICS_SERVICE_URL: process.env.ANALYTICS_SERVICE_URL,
      FRONTEND_URL: process.env.FRONTEND_URL
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    method: req.method,
    availableRoutes: [
      'GET /',
      'GET /health', 
      'GET /debug/services',
      'POST /api/users/auth/login',
      'POST /api/users/auth/register',
      'GET /api/users/auth/profile',
      '/api/simulation/*',
      '/api/clinical/*',
      '/api/cases/*',
      '/api/analytics/*'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🚨 Gateway error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handlers
const gracefulShutdown = (signal) => {
  console.log(`${signal} received, shutting down gracefully`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🐛 Debug endpoint: http://localhost:${PORT}/debug/services`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Log configured services
  const configuredServices = Object.entries(services).filter(([_, url]) => url);
  console.log(`📡 Configured services (${configuredServices.length}/${Object.keys(services).length}):`);
  configuredServices.forEach(([name, url]) => {
    console.log(`  ✓ ${name}: ${url}`);
  });
  
  const pendingServices = Object.entries(services).filter(([_, url]) => !url);
  if (pendingServices.length > 0) {
    console.log(`⏳ Pending services (${pendingServices.length}):`);
    pendingServices.forEach(([name]) => {
      console.log(`  ⚠️ ${name}: not configured`);
    });
  }
});

module.exports = app;