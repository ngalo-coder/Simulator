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
    
    // Get all specialties from the database
    const specialties = await db.collection('specialties').find({}).toArray();
    console.log('All available specialties:');
    specialties.forEach(s => console.log(`- ${s.name} (${s.programArea})`));
    console.log(`Total specialties: ${specialties.length}\n`);
    
    // Test API endpoint for each program area
    console.log('Testing case categories API...');
    
    // Test Basic Program
  const basicProgramResponse = await fetch('http://localhost:5001/api/simulation/case-categories?program_area=Basic+Program');
    const basicProgramData = await basicProgramResponse.json();
    console.log('Basic Program specialties (with cases):', basicProgramData.specialties);
    
    // Test Specialty Program
  const specialtyProgramResponse = await fetch('http://localhost:5001/api/simulation/case-categories?program_area=Specialty+Program');
    const specialtyProgramData = await specialtyProgramResponse.json();
    console.log('Specialty Program specialties (with cases):', specialtyProgramData.specialties);
    
    console.log('\nNote: The API only shows specialties that have actual cases in the database.');
    console.log('All 22 specialties are available in the database for user registration and future case creation.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
})();