const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

console.log('🚀 Starting Gateway...');

// Basic CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// DON'T PARSE BODY - let it pass through to services
// app.use(express.json()); // ← REMOVE THIS LINE

const USER_SERVICE_URL = 'http://localhost:3001';
console.log('🔗 User Service URL:', USER_SERVICE_URL);

// Health check (simple response, no body needed)
app.get('/health', (req, res) => {
  console.log('📍 Health check requested');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'api-gateway',
    userService: USER_SERVICE_URL
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AI Patient Simulation Gateway',
    status: 'running',
    routes: ['/health', '/api/users/*']
  });
});

// Proxy that doesn't interfere with request body
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
    console.log(`✅ Response: ${proxyRes.statusCode} for ${req.originalUrl}`);
  },
  onError: (err, req, res) => {
    console.error(`❌ Proxy error:`, err.message);
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Service unavailable',
        message: err.message
      });
    }
  }
}));

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    availableRoutes: ['GET /', 'GET /health', 'ALL /api/users/*']
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Gateway running on http://localhost:${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
  console.log(`🔗 Proxying /api/users/* to ${USER_SERVICE_URL}`);
});

module.exports = app;