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
      maxPoolSize: 5, // Reduced for serverless environments
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      waitQueueTimeoutMS: 5000,
      bufferCommands: false,
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

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // In Railway, we want to exit on connection failure
    if (process.env.NODE_ENV === 'production') {
      console.error('Failed to connect to database in production, exiting...');
      process.exit(1);
    }
    throw error;
  }
};

export default connectDB;
