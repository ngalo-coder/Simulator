const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'https://your-frontend.netlify.app', // Update this later
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'api-gateway',
    version: '1.0.0'
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
    }
  });
});

// Service URLs from environment variables
const services = {
  users: process.env.USER_SERVICE_URL,
  simulation: process.env.SIMULATION_SERVICE_URL,
  clinical: process.env.CLINICAL_SERVICE_URL,
  cases: process.env.CASE_SERVICE_URL,
  analytics: process.env.ANALYTICS_SERVICE_URL
};

// Proxy configuration with fallback
const createProxy = (target, pathRewrite) => {
  if (!target) {
    // Return a fallback middleware if service URL is not set
    return (req, res, next) => {
      res.status(503).json({
        error: 'Service temporarily unavailable',
        message: 'Service is being deployed or configured',
        retry: true
      });
    };
  }

  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    timeout: 30000,
    onError: (err, req, res) => {
      console.error(`Proxy error for ${target}:`, err.message);
      res.status(503).json({
        error: 'Service temporarily unavailable',
        message: 'The requested service is currently down',
        retry: true
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`Proxying ${req.method} ${req.url} to ${target}`);
    }
  });
};

// Route proxying (add these as services become available)
app.use('/api/users', createProxy(services.users, { '^/api/users': '' }));
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
  console.log('📡 Configured services:', Object.keys(services).filter(key => services[key]));
});

module.exports = app;