import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/UserModel.js';

// Load environment variables from .env
dotenv.config();

async function fixUserProfiles() {
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

    // Find users with missing discipline or profile
    const usersToFix = await User.find({
      $or: [
        { discipline: { $exists: false } },
        { discipline: null },
        { discipline: '' },
        { profile: { $exists: false } },
        { profile: null }
      ]
    });

    console.log(`Found ${usersToFix.length} users that need fixing.`);

    for (const user of usersToFix) {
      console.log(`\nFixing user: ${user.email}`);

      // Set default discipline if missing
      if (!user.discipline || user.discipline === '') {
        user.discipline = 'medicine';
        console.log(`- Set discipline to: medicine`);
      }

      // Set default profile if missing
      if (!user.profile) {
        user.profile = {
          firstName: 'Unknown',
          lastName: 'User',
          institution: 'Unknown Institution'
        };
        console.log(`- Set default profile`);
      } else {
        // Fix missing profile fields
        if (!user.profile.firstName) {
          user.profile.firstName = 'Unknown';
          console.log(`- Set firstName to: Unknown`);
        }
        if (!user.profile.lastName) {
          user.profile.lastName = 'User';
          console.log(`- Set lastName to: User`);
        }
        if (!user.profile.institution) {
          user.profile.institution = 'Unknown Institution';
          console.log(`- Set institution to: Unknown Institution`);
        }
      }

      // Save the user
      await user.save();
      console.log(`- User ${user.email} saved successfully`);
    }

    console.log('\n=== VERIFICATION ===');
    // Verify the fixes
    const stillBroken = await User.find({
      $or: [
        { discipline: { $exists: false } },
        { discipline: null },
        { discipline: '' },
        { profile: { $exists: false } },
        { profile: null },
        { 'profile.firstName': { $exists: false } },
        { 'profile.firstName': null },
        { 'profile.firstName': '' },
        { 'profile.lastName': { $exists: false } },
        { 'profile.lastName': null },
        { 'profile.lastName': '' },
        { 'profile.institution': { $exists: false } },
        { 'profile.institution': null },
        { 'profile.institution': '' }
      ]
    });

    console.log(`Users still with issues: ${stillBroken.length}`);

    // Close connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');

  } catch (error) {
    console.error('Error fixing user profiles:', error.message);
    process.exit(1);
  }
}

// Run the function
fixUserProfiles();