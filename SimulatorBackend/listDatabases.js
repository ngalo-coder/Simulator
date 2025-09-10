import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './SimulatorBackend/.env' });

async function listDatabases() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    // Connect to MongoDB without specifying a database
    // Remove the database name from the connection string
    const baseUri = MONGODB_URI.replace(/\/[^/?]*(\?|$)/, '/admin$1');
    const connection = await mongoose.createConnection(baseUri);
    
    console.log('Connected to MongoDB successfully.');
    
    // Get the admin database
    const adminDb = connection.db.admin();
    
    // List all databases
    const result = await adminDb.listDatabases();
    console.log('\n=== ALL DATABASES ===');
    
    for (const dbInfo of result.databases) {
      console.log(`Database: ${dbInfo.name} (Size: ${dbInfo.sizeOnDisk} bytes)`);
      
      try {
        // Connect to each database to list collections
        const dbUri = MONGODB_URI.replace(/\/[^/?]*(\?|$)/, `/${dbInfo.name}$1`);
        const dbConnection = await mongoose.createConnection(dbUri);
        const collections = await dbConnection.db.listCollections().toArray();
        
        console.log(`  Collections in ${dbInfo.name}:`);
        if (collections.length === 0) {
          console.log('    No collections found');
        } else {
          collections.forEach(collection => {
            console.log(`    - ${collection.name}`);
          });
        }
        
        await dbConnection.close();
      } catch (error) {
        console.log(`  Could not access collections: ${error.message}`);
      }
    }
    
    // Close connection
    await connection.close();
    console.log('\nDatabase connection closed.');
    
  } catch (error) {
    console.error('Error listing databases:', error.message);
    process.exit(1);
  }
}

// Run the function
listDatabases();