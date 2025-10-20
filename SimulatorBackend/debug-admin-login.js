import mongoose from 'mongoose';
import User from './src/models/UserModel.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

async function debugAdminLogin() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check for admin@example.com user
    console.log('\n🔍 Searching for admin@example.com...');
    const adminUser = await User.findOne({ email: 'admin@example.com' });

    if (!adminUser) {
      console.log('❌ Admin user not found');
      
      // Check all users to see what exists
      const allUsers = await User.find({});
      console.log(`\n📊 Total users in database: ${allUsers.length}`);
      
      if (allUsers.length > 0) {
        console.log('\n👥 First few users:');
        allUsers.slice(0, 3).forEach((user, index) => {
          console.log(`${index + 1}. Email: ${user.email}, Username: ${user.username}`);
        });
      }
      
      await mongoose.connection.close();
      return;
    }

    console.log('✅ Admin user found!');
    console.log('\n📝 User Details:');
    console.log(`- ID: ${adminUser._id}`);
    console.log(`- Username: ${adminUser.username}`);
    console.log(`- Email: ${adminUser.email}`);
    console.log(`- Primary Role: ${adminUser.primaryRole}`);
    console.log(`- Discipline: ${adminUser.discipline}`);
    console.log(`- Is Active: ${adminUser.isActive}`);
    console.log(`- Email Verified: ${adminUser.emailVerified}`);
    console.log(`- Created At: ${adminUser.createdAt}`);
    console.log(`- Last Login: ${adminUser.lastLogin}`);

    // Check profile completeness
    console.log('\n📋 Profile Information:');
    if (adminUser.profile) {
      console.log(`- First Name: ${adminUser.profile.firstName || 'MISSING'}`);
      console.log(`- Last Name: ${adminUser.profile.lastName || 'MISSING'}`);
      console.log(`- Institution: ${adminUser.profile.institution || 'MISSING'}`);
      console.log(`- Specialization: ${adminUser.profile.specialization || 'Not set'}`);
      console.log(`- Year of Study: ${adminUser.profile.yearOfStudy || 'Not set'}`);
      console.log(`- Competency Level: ${adminUser.profile.competencyLevel || 'Not set'}`);
    } else {
      console.log('❌ No profile object found');
    }

    // Check for validation errors
    console.log('\n🔍 Validation Check:');
    try {
      await adminUser.validate();
      console.log('✅ User passes current validation');
    } catch (validationError) {
      console.log('❌ User fails validation:');
      console.log(validationError.message);
      
      if (validationError.errors) {
        Object.keys(validationError.errors).forEach(field => {
          console.log(`  - ${field}: ${validationError.errors[field].message}`);
        });
      }
    }

    // Test password comparison
    console.log('\n🔐 Password Test:');
    try {
      const testPassword = 'admin123';
      const isPasswordValid = await adminUser.comparePassword(testPassword);
      console.log(`Password '${testPassword}' is valid: ${isPasswordValid}`);
      
      // Also test with bcrypt directly
      const directCompare = await bcrypt.compare(testPassword, adminUser.password);
      console.log(`Direct bcrypt comparison: ${directCompare}`);
    } catch (passwordError) {
      console.log('❌ Password comparison error:', passwordError.message);
    }

    // Check required fields
    console.log('\n📋 Required Field Check:');
    const passwordValue = adminUser.password ? '[SET]' : 'MISSING';
    const requiredFields = [
      { path: 'username', value: adminUser.username },
      { path: 'email', value: adminUser.email },
      { path: 'password', value: passwordValue },
      { path: 'primaryRole', value: adminUser.primaryRole },
      { path: 'discipline', value: adminUser.discipline },
      { path: 'profile.firstName', value: adminUser.profile?.firstName },
      { path: 'profile.lastName', value: adminUser.profile?.lastName },
      { path: 'profile.institution', value: adminUser.profile?.institution },
    ];

    requiredFields.forEach(field => {
      const status = field.value ? '✅' : '❌';
      console.log(`${status} ${field.path}: ${field.value || 'MISSING'}`);
    });

    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

debugAdminLogin();