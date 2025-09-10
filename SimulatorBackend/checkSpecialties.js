import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
  const MONGO_URI = process.env.MONGODB_URI;
  const DB_NAME = process.env.DB_NAME;
  
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log("Connected to MongoDB successfully.");
    
    const db = client.db(DB_NAME);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Check cases collection for specialties using direct MongoDB query
    const cases = await db.collection('cases').find({}).toArray();
    const specialtiesFromCases = [...new Set(cases.map(c => c.case_metadata?.specialty))];
    console.log('Specialties from cases (direct query):', specialtiesFromCases.sort());
    console.log('Total cases:', cases.length);
    
    // Check specialties collection
    const specialties = await db.collection('specialties').find({}).toArray();
    console.log('Specialties in specialties collection:', specialties.length);
    specialties.forEach(s => console.log(`- ${s.name} (${s.programArea || s.program_area})`));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
})();