import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './SimulatorBackend/.env' });

async function checkTestDatabase() {
  let client;
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    // Connect to the test database specifically
    const testDbUri = MONGODB_URI.replace(/\/[^/?]*(\?|$)/, '/test$1');
    client = new MongoClient(testDbUri);
    await client.connect();
    
    console.log('Connected to test database successfully.');
    
    const db = client.db();
    
    // Count users in test database
    const userCount = await db.collection('users').countDocuments();
    console.log(`\nTotal Users in test database: ${userCount}`);
    
    // Get user details
    const users = await db.collection('users')
      .find({}, { projection: { username: 1, email: 1, 'profile.firstName': 1, 'profile.lastName': 1, primaryRole: 1, discipline: 1, isActive: 1, emailVerified: 1 } })
      .limit(20)
      .toArray();
    
    console.log('\n=== FIRST 20 USERS IN TEST DATABASE ===');
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
    
    // Count cases in test database
    const caseCount = await db.collection('cases').countDocuments();
    console.log(`\nTotal Cases in test database: ${caseCount}`);
    
    // Count other important collections
    const collectionsToCheck = ['specialties', 'programareas', 'contributedcases', 'learningmodules'];
    for (const collection of collectionsToCheck) {
      const count = await db.collection(collection).countDocuments();
      console.log(`Total ${collection} in test database: ${count}`);
    }
    
  } catch (error) {
    console.error('Error checking test database:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('\nDatabase connection closed.');
    }
  }
}

// Run the function
checkTestDatabase();