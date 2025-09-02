import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

const testMongoConnection = async () => {
  console.log('🔍 Testing MongoDB connection...');
  console.log(`📍 Connection URI: ${process.env.MONGODB_URI ? 'Found' : 'Missing'}`);
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    console.log('🔌 Attempting to connect...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    console.log('✅ MongoDB Connected Successfully!');
    console.log(`📡 Host: ${conn.connection.host}`);
    console.log(`🗄️  Database: ${conn.connection.name}`);
    console.log(`🔗 Connection State: ${conn.connection.readyState === 1 ? 'Connected' : 'Not Connected'}`);

    // Test a simple operation
    console.log('🧪 Testing database operations...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📚 Found ${collections.length} collections:`);
    collections.forEach(col => console.log(`  - ${col.name}`));

    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Connection closed successfully');
    console.log('🎉 MongoDB connection test completed!');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.name === 'MongoServerSelectionError') {
      console.error('   This usually means:');
      console.error('   - Network connectivity issues');
      console.error('   - Incorrect connection string');
      console.error('   - Database server is down');
      console.error('   - IP whitelist restrictions');
    }
    
    process.exit(1);
  }
};

// Run the test
testMongoConnection();