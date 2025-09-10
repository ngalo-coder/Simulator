import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/UserModel.js';

// Load environment variables from SimulatorBackend/.env
dotenv.config({ path: './SimulatorBackend/.env' });

async function countUsers() {
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
    
    // Get all users with their details
    const users = await User.find()
      .select('username email profile.firstName profile.lastName primaryRole discipline isActive emailVerified')
      .lean();
    
    // Count statistics
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.isActive).length;
    const verifiedUsers = users.filter(user => user.emailVerified).length;
    
    // Count users by role
    const usersByRole = {};
    users.forEach(user => {
      const role = user.primaryRole;
      usersByRole[role] = (usersByRole[role] || 0) + 1;
    });
    
    // Count users by discipline
    const usersByDiscipline = {};
    users.forEach(user => {
      const discipline = user.discipline;
      usersByDiscipline[discipline] = (usersByDiscipline[discipline] || 0) + 1;
    });
    
    console.log('\n=== USER COUNT STATISTICS ===');
    console.log(`Total Users: ${totalUsers}`);
    console.log(`Active Users: ${activeUsers}`);
    console.log(`Inactive Users: ${totalUsers - activeUsers}`);
    console.log(`Verified Users: ${verifiedUsers}`);
    console.log(`Unverified Users: ${totalUsers - verifiedUsers}`);
    
    console.log('\n=== USERS BY ROLE ===');
    Object.entries(usersByRole).forEach(([role, count]) => {
      console.log(`${role}: ${count}`);
    });
    
    console.log('\n=== USERS BY DISCIPLINE ===');
    Object.entries(usersByDiscipline).forEach(([discipline, count]) => {
      console.log(`${discipline}: ${count}`);
    });
    
    console.log('\n=== USER DETAILS ===');
    users.forEach((user, index) => {
      const fullName = user.profile ? `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim() : 'No name';
      console.log(`${index + 1}. ${fullName} (${user.username})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.primaryRole}`);
      console.log(`   Discipline: ${user.discipline}`);
      console.log(`   Status: ${user.isActive ? 'Active' : 'Inactive'}`);
      console.log(`   Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    // Close connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
    
  } catch (error) {
    console.error('Error counting users:', error.message);
    process.exit(1);
  }
}

// Run the function
countUsers();