import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import mongoose from 'mongoose';
import logger from './src/config/logger.js';
import corsOptions from './src/config/corsConfig.js';
import connectDB from './src/config/db.js';
import { swaggerSpec, swaggerUi, swaggerUiOptions } from './src/config/swagger.js';

// Route imports
import authRoutes from './src/routes/authRoutes.js';
import simulationRoutes from './src/routes/simulationRoutes.js';
import queueRoutes from './src/routes/queueRoutes.js';
import clinicianProgressRoutes from './src/routes/clinicianProgressRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import adminProgramRoutes from './src/routes/adminProgramRoutes.js';
import adminContributionRoutes from './src/routes/adminContributionRoutes.js';
import contributeCaseRoutes from './src/routes/contributeCaseRoutes.js';
import caseReviewRoutes from './src/routes/caseReviewRoutes.js';
import performanceRoutes from './src/routes/performanceRoutes.js';
import performanceReviewRoutes from './src/routes/performanceReviewRoutes.js';
import privacyRoutes from './src/routes/privacyRoutes.js';
import educatorRoutes from './src/routes/educatorRoutes.js';
import studentRoutes from './src/routes/studentRoutes.js';
import caseTemplateRoutes from './src/routes/caseTemplateRoutes.js';
import caseWorkflowRoutes from './src/routes/caseWorkflowRoutes.js';
import analyticsRoutes from './src/routes/analyticsRoutes.js';
import progressAnalyticsRoutes from './src/routes/progressAnalyticsRoutes.js';
import feedbackRoutes from './src/routes/feedbackRoutes.js';
import casePublishingRoutes from './src/routes/casePublishingRoutes.js';
import interactionTrackingRoutes from './src/routes/interactionTrackingRoutes.js';
import learningGoalRoutes from './src/routes/learningGoalRoutes.js';
import learningPathRoutes from './src/routes/learningPathRoutes.js';
import competencyAssessmentRoutes from './src/routes/competencyAssessmentRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5003;

// Initialize database connection on startup (Railway-friendly)
let dbConnected = false;

const initializeDatabase = async () => {
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      // In Railway, we want to fail fast if DB connection fails
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
      throw error; // Re-throw to handle in startup
    }
  }
};

// Middleware
app.use(pinoHttp({ logger }));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - Origin: ${req.get('Origin') || 'none'}`);
  next();
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  });
});

// Health endpoints (before other routes)
app.get('/', (_, res) =>
  res.json({
    message: 'Virtual Patient Simulation API is running!',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  })
);

app.get('/health', async (req, res) => {
  try {
    // Check database connection using mongoose's readyState
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      origin: req.get('Origin') || 'none',
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Legacy redirect
app.use('/auth/login', (_, res) => res.redirect(307, '/api/auth/login'));

// Swagger API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/users', queueRoutes);
app.use('/api/progress', clinicianProgressRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminProgramRoutes);
app.use('/api/admin', adminContributionRoutes);
app.use('/api/contribute', contributeCaseRoutes);
app.use('/api/reviews', caseReviewRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/privacy', privacyRoutes);
app.use('/api/educator', educatorRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/case-templates', caseTemplateRoutes);
app.use('/api/case-workflow', caseWorkflowRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/progress-analytics', progressAnalyticsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/publishing', casePublishingRoutes);
app.use('/api/interaction-tracking', interactionTrackingRoutes);
app.use('/api/performance-review', performanceReviewRoutes);
app.use('/api/learning', learningGoalRoutes);
app.use('/api/learning-paths', learningPathRoutes);
app.use('/api/competency', competencyAssessmentRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// Start server with database connection established first
const startServer = async () => {
  try {
    // Initialize database before starting server
    await initializeDatabase();
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Export for serverless platforms
export default app;
