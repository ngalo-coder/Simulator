import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/UserModel.js';
import connectDB from '../src/config/db.js';
import logger from '../src/config/logger.js';

dotenv.config();

// Admin user details
const adminUser = {
  username: 'admin',
  email: 'admin@example.com',
  password: 'admin123', // This should be changed after first login
  primaryRole: 'admin',
  discipline: 'medicine',
  profile: {
    firstName: 'System',
    lastName: 'Administrator',
    institution: 'Simuatech Medical University'
  }
};

async function createAdminUser() {
  try {
    // Connect to MongoDB and wait for connection
    await connectDB();

    // Check if admin user already exists
    const existingUser = await User.findOne({
      $or: [
        { username: adminUser.username },
        { email: adminUser.email }
      ]
    });

    if (existingUser) {
      logger.info(`Admin user already exists with username: ${existingUser.username} and email: ${existingUser.email}`);
      
      // Update role to admin if not already and add missing required fields
      if (existingUser.primaryRole !== 'admin') {
        existingUser.primaryRole = 'admin';
      }
      
      // Ensure required fields are present
      if (!existingUser.discipline) {
        existingUser.discipline = 'medicine';
      }
      if (!existingUser.profile) {
        existingUser.profile = {
          firstName: 'System',
          lastName: 'Administrator',
          institution: 'Simuatech Medical University'
        };
      }
      
      await existingUser.save();
      logger.info(`Updated user ${existingUser.username} to admin role with required fields`);
    } else {
      // Create new admin user
      const newAdmin = new User(adminUser);
      await newAdmin.save();
      logger.info(`Created new admin user with username: ${newAdmin.username} and email: ${newAdmin.email}`);
    }

    logger.info('Admin user setup complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error creating admin user:', error);
    console.error('Detailed error:', error);
    process.exit(1);
  }
}

// Run the function
createAdminUser();