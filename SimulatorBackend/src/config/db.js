import mongoose from 'mongoose';
import dotenv from 'dotenv';

const connectDB = async () => {
  try {
    // Check if already connected
    if (mongoose.connections[0].readyState === 1) {
      console.log('Using existing MongoDB connection');
      return;
    }

    // Validate MongoDB URI
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    // Railway-optimized connection options
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
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
