const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// FIX: Add trust proxy setting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'https://your-frontend.netlify.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));

// FIX: Updated rate limiting configuration
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
app.use((req, res, next) => {
    console.log(`📨 Request: ${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log(`📦 Body:`, req.body);
    }
    next();
  });

// FIX: Service URLs with fallbacks
const services = {
  users: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  simulation: process.env.SIMULATION_SERVICE_URL || 'http://localhost:3002',
  clinical: process.env.CLINICAL_SERVICE_URL || 'http://localhost:3003',
  cases: process.env.CASE_SERVICE_URL || 'http://localhost:3004',
  analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3005'
};

// DEBUG: Log service configuration
console.log('🔧 DEBUG: Service URLs:');
Object.entries(services).forEach(([name, url]) => {
  console.log(`  ${name}: ${url}`);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'api-gateway',
    version: '1.0.0',
    services: services
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AI Patient Simulation Platform API Gateway',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      users: '/api/users/*',
      simulation: '/api/simulation/*',
      clinical: '/api/clinical/*',
      cases: '/api/cases/*',
      analytics: '/api/analytics/*'
    },
    services: services
  });
});

// Replace the createProxy function (around line 80):
const createProxy = (target, pathRewrite) => {
    console.log(`🔗 Creating proxy for target: ${target}`);
    
    if (!target || target.includes('localhost:3002') || target.includes('localhost:3003') || target.includes('localhost:3004') || target.includes('localhost:3005')) {
      return (req, res, next) => {
        res.status(503).json({
          error: 'Service temporarily unavailable',
          message: 'Service is being deployed or configured',
          retry: true
        });
      };
    }
  
    // ✅ SIMPLE PROXY - No custom body handling
    return createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite,
      timeout: 30000,
      onError: (err, req, res) => {
        console.error(`❌ Proxy error for ${target}:`, err.message);
        if (!res.headersSent) {
          res.status(503).json({
            error: 'Service temporarily unavailable',
            message: err.message
          });
        }
      }
    });
  };

  app.use(cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://simuatech.netlify.app',  // ← Add your actual Netlify URL
      'https://ai-patient-sim-gateway.onrender.com',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // ← Add this
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']  // ← Add this
  }));

// Route proxying
app.use('/api/users', createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
    pathRewrite: {
      '^/api/users': ''
    },
    timeout: 30000,
    onProxyReq: (proxyReq, req, res) => {
      console.log(`🔄 Proxying ${req.method} ${req.url} to http://localhost:3001${req.url.replace('/api/users', '')}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`✅ Response: ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
      console.error(`❌ Proxy error:`, err.message);
      if (!res.headersSent) {
        res.status(503).json({ error: 'Service unavailable' });
      }
    }
  }));
app.use('/api/simulation', createProxy(services.simulation, { '^/api/simulation': '' }));
app.use('/api/clinical', createProxy(services.clinical, { '^/api/clinical': '' }));
app.use('/api/cases', createProxy(services.cases, { '^/api/cases': '' }));
app.use('/api/analytics', createProxy(services.analytics, { '^/api/analytics': '' }));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: ['/health', '/api/users/*', '/api/simulation/*', '/api/clinical/*', '/api/cases/*', '/api/analytics/*']
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Gateway error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('📡 Configured services:', Object.keys(services).filter(key => services[key] && !services[key].includes('localhost:300')));
});

module.exports = app;