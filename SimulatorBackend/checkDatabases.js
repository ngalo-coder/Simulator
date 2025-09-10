import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './SimulatorBackend/.env' });

async function checkDatabases() {
  let client;
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    console.log('Connected to MongoDB successfully.');
    
    // Get the admin database
    const adminDb = client.db('admin');
    
    // List all databases
    const databases = await adminDb.admin().listDatabases();
    console.log('\n=== ALL DATABASES ===');
    
    for (const dbInfo of databases.databases) {
      console.log(`Database: ${dbInfo.name} (Size: ${dbInfo.sizeOnDisk} bytes)`);
      
      try {
        // Connect to each database to list collections
        const db = client.db(dbInfo.name);
        const collections = await db.listCollections().toArray();
        
        console.log(`  Collections in ${dbInfo.name}:`);
        if (collections.length === 0) {
          console.log('    No collections found');
        } else {
          collections.forEach(collection => {
            console.log(`    - ${collection.name}`);
          });
        }
      } catch (error) {
        console.log(`  Could not access collections: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error checking databases:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('\nDatabase connection closed.');
    }
  }
}

// Run the function
checkDatabases();