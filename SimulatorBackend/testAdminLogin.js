import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/UserModel.js';

// Load environment variables from .env
dotenv.config();

async function testAdminLogin() {
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

    // Find the admin user
    const adminUser = await User.findOne({ email: 'admin@example.com' });

    if (!adminUser) {
      console.log('Admin user not found.');
      return;
    }

    console.log('Admin user found:');
    console.log(`- Username: ${adminUser.username}`);
    console.log(`- Email: ${adminUser.email}`);
    console.log(`- Password Hash: ${adminUser.password ? 'Set' : 'Not Set'}`);
    console.log(`- Is Active: ${adminUser.isActive}`);
    console.log(`- Email Verified: ${adminUser.emailVerified}`);

    // Test password comparison
    const testPassword = 'admin123';
    const isPasswordValid = await adminUser.comparePassword(testPassword);

    console.log(`\nPassword test for '${testPassword}': ${isPasswordValid ? 'VALID' : 'INVALID'}`);

    if (!isPasswordValid) {
      console.log('Password does not match. Attempting to reset password...');

      // Reset password to admin123
      adminUser.password = 'admin123'; // This will be hashed by the pre-save hook
      await adminUser.save();

      console.log('Password reset to admin123. Testing again...');

      // Test again
      const isPasswordValidAfterReset = await adminUser.comparePassword(testPassword);
      console.log(`Password test after reset: ${isPasswordValidAfterReset ? 'VALID' : 'INVALID'}`);
    }

    // Close connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');

  } catch (error) {
    console.error('Error testing admin login:', error.message);
    process.exit(1);
  }
}

// Run the function
testAdminLogin();