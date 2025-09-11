import mongoose from 'mongoose';
import dotenv from 'dotenv';

const connectDB = async () => {
  try {
    // Check if already connected
    // Serverless-optimized connection check
    if (mongoose.connection?.readyState === 1) {
      console.log('Reusing existing MongoDB connection');
      return mongoose.connection;
    }

    // Validate MongoDB URI
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    // Serverless-optimized connection options
    const options = {
      maxPoolSize: 3, // Reduced for serverless environments
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      waitQueueTimeoutMS: 5000,
      bufferCommands: false,
      bufferMaxEntries: 0,
      // Additional serverless optimizations
      maxIdleTimeMS: 30000,
      keepAlive: true,
      keepAliveInitialDelay: 0
    };

    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Don't add process listeners in serverless environments
    if (process.env.NODE_ENV !== 'production') {
      // Graceful shutdown - only for local development
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
      });
    }
    
    return conn.connection;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // In production serverless, don't exit process
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
      console.error('Failed to connect to database in production, exiting...');
      process.exit(1);
    }
    throw error;
  }
};

export default connectDB;
