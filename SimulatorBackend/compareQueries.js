import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

// Import after dotenv config
import { CaseService } from './src/services/caseService.js';
import connectDB from './src/config/db.js';

(async () => {
  const MONGO_URI = process.env.MONGODB_URI;
  const DB_NAME = process.env.DB_NAME;
  
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log("Connected to MongoDB successfully.");
    
    const db = client.db(DB_NAME);
    
    // Test 1: Direct MongoDB distinct query
    const directSpecialties = await db.collection('cases').distinct('case_metadata.specialty');
    console.log('Direct MongoDB distinct specialties:', directSpecialties.sort());
    
    // Test 2: Mongoose distinct query
    await connectDB();
    const mongooseSpecialties = await CaseService.getCaseCategories();
    console.log('Mongoose getCaseCategories specialties:', mongooseSpecialties.specialties.sort());
    
    // Test 3: Check if there are any filters or conditions in the mongoose model
    const cases = await db.collection('cases').find({}).toArray();
    const allSpecialties = [...new Set(cases.map(c => c.case_metadata?.specialty))].filter(Boolean).sort();
    console.log('All specialties from raw cases:', allSpecialties);
    
    // Check if there are any null/undefined values that might be filtered out
    const specialtiesWithNull = cases.map(c => c.case_metadata?.specialty);
    console.log('Specialties including null/undefined:', specialtiesWithNull);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
})();