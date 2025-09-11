// Vercel serverless function entry point
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

// Get current file directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

// Database connection cache for serverless
let cachedConnection = null;

// Optimized database connection for serverless
const connectDB = async () => {
  // Reuse existing connection if available
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('Reusing existing database connection');
    return cachedConnection;
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    console.log('Establishing new database connection...');
    
    // Optimized connection options for Vercel serverless
    const options = {
      maxPoolSize: 3, // Reduced for serverless
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0,
      // Additional serverless optimizations
      maxIdleTimeMS: 30000,
      keepAlive: true,
      keepAliveInitialDelay: 0
    };

    const connection = await mongoose.connect(mongoUri, options);
    cachedConnection = connection;
    
    console.log('Database connected successfully');
    return connection;
  } catch (error) {
    console.error('Database connection error:', error);
    cachedConnection = null;
    throw error;
  }
};

// CORS configuration inline to avoid import issues
const allowedOrigins = [
  'https://kuiga.online',
  'https://simuatech.netlify.app',
  'https://simulatorbackend.onrender.com',
  'https://simulator-l9qx.onrender.com',
  'https://simulator-gamma-six.vercel.app',
  // Local development
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:5003',
  // Vercel patterns
  /^https:\/\/.*\.vercel\.app$/,
  // Railway patterns
  /^https:\/\/.*\.up\.railway\.app$/,
  // Render patterns
  /^https:\/\/.*\.onrender\.com$/
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Check if origin matches any allowed origins
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS policy violation for origin: ${origin}`);
      callback(new Error('CORS policy violation'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  optionsSuccessStatus: 200
};

// Initialize Express app
const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check routes
app.get('/', (req, res) => {
  res.json({
    message: 'Virtual Patient Simulation API is running on Vercel!',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.0'
  });
});

app.get('/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      environment: process.env.NODE_ENV || 'production'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Import routes dynamically to handle potential import issues
let routesLoaded = false;

const loadRoutes = async () => {
  if (routesLoaded) return;
  
  try {
    // Dynamic imports to handle ES module issues in serverless
    const authRoutes = await import('../src/routes/authRoutes.js');
    const simulationRoutes = await import('../src/routes/simulationRoutes.js');
    const userRoutes = await import('../src/routes/userRoutes.js');
    const clinicianProgressRoutes = await import('../src/routes/clinicianProgressRoutes.js');
    const adminRoutes = await import('../src/routes/adminRoutes.js');
    const educatorRoutes = await import('../src/routes/educatorRoutes.js');
    const studentRoutes = await import('../src/routes/studentRoutes.js');
    const performanceRoutes = await import('../src/routes/performanceRoutes.js');
    const analyticsRoutes = await import('../src/routes/analyticsRoutes.js');

    // Register routes
    app.use('/api/auth', authRoutes.default);
    app.use('/api/simulation', simulationRoutes.default);
    app.use('/api/users', userRoutes.default);
    app.use('/api/progress', clinicianProgressRoutes.default);
    app.use('/api/admin', adminRoutes.default);
    app.use('/api/educator', educatorRoutes.default);
    app.use('/api/student', studentRoutes.default);
    app.use('/api/performance', performanceRoutes.default);
    app.use('/api/analytics', analyticsRoutes.default);
    
    routesLoaded = true;
    console.log('All routes loaded successfully');
  } catch (error) {
    console.error('Error loading routes:', error);
    throw error;
  }
};

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// Main serverless handler
export default async function handler(req, res) {
  try {
    console.log(`Processing ${req.method} ${req.url}`);
    
    // Connect to database
    await connectDB();
    
    // Load routes if not already loaded
    await loadRoutes();
    
    // Handle the request
    return app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    
    // Ensure response is sent
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Function initialization failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}