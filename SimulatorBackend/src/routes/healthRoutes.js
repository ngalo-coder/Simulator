import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     description: Returns basic application health status including uptime, environment, and version
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uptime:
 *                   type: number
 *                   description: Process uptime in seconds
 *                 message:
 *                   type: string
 *                   description: Health status message
 *                 timestamp:
 *                   type: integer
 *                   format: int64
 *                   description: Current timestamp in milliseconds
 *                 environment:
 *                   type: string
 *                   description: Current environment (development, production, etc.)
 *                 version:
 *                   type: string
 *                   description: Application version
 *       500:
 *         description: Application is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 */
router.get('/health', (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  };
  
  res.status(200).json(healthCheck);
});

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     summary: Detailed health check with dependencies
 *     description: Returns comprehensive health status including database connection, memory usage, and service status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: All services are healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uptime:
 *                   type: number
 *                   description: Process uptime in seconds
 *                 timestamp:
 *                   type: integer
 *                   format: int64
 *                   description: Current timestamp in milliseconds
 *                 environment:
 *                   type: string
 *                   description: Current environment
 *                 version:
 *                   type: string
 *                   description: Application version
 *                 services:
 *                   type: object
 *                   properties:
 *                     mongodb:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [healthy, unhealthy]
 *                         state:
 *                           type: integer
 *                         message:
 *                           type: string
 *                     memory:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [healthy, warning]
 *                         heapUsed:
 *                           type: string
 *                         heapTotal:
 *                           type: string
 *                         external:
 *                           type: string
 *                 status:
 *                   type: string
 *                   enum: [healthy, unhealthy]
 *       503:
 *         description: One or more services are unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uptime:
 *                   type: number
 *                 timestamp:
 *                   type: integer
 *                   format: int64
 *                 environment:
 *                   type: string
 *                 version:
 *                   type: string
 *                 services:
 *                   type: object
 *                 status:
 *                   type: string
 *                   enum: [unhealthy]
 */
router.get('/health/detailed', async (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    services: {}
  };
  
  // Check MongoDB connection
  try {
    const dbState = mongoose.connection.readyState;
    healthCheck.services.mongodb = {
      status: dbState === 1 ? 'healthy' : 'unhealthy',
      state: dbState,
      message: dbState === 1 ? 'Connected' : 'Disconnected'
    };
  } catch (error) {
    healthCheck.services.mongodb = {
      status: 'unhealthy',
      message: error.message
    };
  }
  
  // Check memory usage
  const memUsage = process.memoryUsage();
  healthCheck.services.memory = {
    status: memUsage.heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning', // 500MB threshold
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
  };
  
  // Overall health status
  const allHealthy = Object.values(healthCheck.services).every(
    service => service.status === 'healthy'
  );
  
  const statusCode = allHealthy ? 200 : 503;
  healthCheck.status = allHealthy ? 'healthy' : 'unhealthy';
  
  res.status(statusCode).json(healthCheck);
});

/**
 * @swagger
 * /ready:
 *   get:
 *     summary: Readiness check
 *     description: Checks if the application is ready to handle requests (e.g., database connected)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [ready]
 *       503:
 *         description: Application is not ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [not ready]
 *                 reason:
 *                   type: string
 *                   description: Reason for not being ready
 *                 error:
 *                   type: string
 *                   description: Error message if available
 */
router.get('/ready', async (req, res) => {
  try {
    // Check if MongoDB is ready
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ status: 'not ready', reason: 'database not connected' });
    }
    
    // Add other readiness checks here (Redis, external APIs, etc.)
    
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});

export default router;