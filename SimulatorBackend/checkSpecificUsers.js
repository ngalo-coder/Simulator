import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/UserModel.js';

// Load environment variables from .env
dotenv.config();

async function checkSpecificUsers() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI;
    const DB_NAME = process.env.DB_NAME;

    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    if (!DB_NAME) {
      throw new Error('DB_NAME environment variable is not set');
    }

    await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME
    });

    console.log('Connected to MongoDB successfully.');

    // Emails to check
    const emailsToCheck = ['otienodominic@gmail.com', 'admin@example.com'];

    for (const email of emailsToCheck) {
      console.log(`\n=== CHECKING USER: ${email} ===`);

      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        console.log(`User with email ${email} not found.`);
        continue;
      }

      console.log('User found:');
      console.log(`- Username: ${user.username}`);
      console.log(`- Email: ${user.email}`);
      console.log(`- Password Hash: ${user.password ? 'Set' : 'Not Set'}`);
      console.log(`- Primary Role: ${user.primaryRole}`);
      console.log(`- Discipline: ${user.discipline}`);
      console.log(`- Is Active: ${user.isActive}`);
      console.log(`- Email Verified: ${user.emailVerified}`);
      console.log(`- Profile:`, user.profile ? {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        institution: user.profile.institution
      } : 'Missing');

      // Check for missing required fields
      const missingFields = [];
      if (!user.username) missingFields.push('username');
      if (!user.email) missingFields.push('email');
      if (!user.password) missingFields.push('password');
      if (!user.primaryRole) missingFields.push('primaryRole');
      if (!user.discipline) missingFields.push('discipline');
      if (!user.profile) missingFields.push('profile');
      else {
        if (!user.profile.firstName) missingFields.push('profile.firstName');
        if (!user.profile.lastName) missingFields.push('profile.lastName');
        if (!user.profile.institution) missingFields.push('profile.institution');
      }

      if (missingFields.length > 0) {
        console.log(`- Missing Required Fields: ${missingFields.join(', ')}`);
      } else {
        console.log('- All required fields present');
      }
    }

    // Close connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');

  } catch (error) {
    console.error('Error checking users:', error.message);
    process.exit(1);
  }
}

// Run the function
checkSpecificUsers();