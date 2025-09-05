import mongoose from 'mongoose';
import User from './src/models/UserModel.js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

async function checkUser() {
  try {
    // Use the MONGODB_URI from environment variables
    const MONGODB_URI = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB with URI:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const userId = '687261ce21acb847816e9513';
    console.log('Searching for user with ID:', userId);
    
    const user = await User.findById(userId);

    if (user) {
      console.log('User found:', user);
    } else {
      console.log('User not found with ID:', userId);
      // Also check if any users exist in the database
      const allUsers = await User.find({});
      console.log('Total users in database:', allUsers.length);
      if (allUsers.length > 0) {
        console.log('First user:', allUsers[0]);
      }
    }

    await mongoose.connection.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUser();