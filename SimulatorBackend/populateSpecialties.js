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
    
    // Get specialties from cases
    const cases = await db.collection('cases').find({}).toArray();
    const specialtiesFromCases = [...new Set(cases.map(c => c.case_metadata?.specialty))].filter(Boolean);
    console.log('Specialties from cases:', specialtiesFromCases.sort());
    
    // Define program area mapping
    const specialtyToProgramArea = {
      'Internal Medicine': 'Basic Program',
      'Surgery': 'Specialty Program',
      'Pediatrics': 'Basic Program',
      'Ophthalmology': 'Specialty Program',
      'ENT': 'Specialty Program',
      'Cardiology': 'Specialty Program',
      'Neurology': 'Specialty Program',
      'Psychiatry': 'Basic Program',
      'Emergency Medicine': 'Basic Program',
      'Family Medicine': 'Basic Program',
      'Obstetrics & Gynecology': 'Specialty Program',
      'Dermatology': 'Specialty Program',
      'Orthopedics': 'Specialty Program',
      'Radiology': 'Specialty Program',
      'Pathology': 'Specialty Program',
      'Anesthesiology': 'Specialty Program',
      'Nursing': 'Basic Program',
      'Pharmacy': 'Basic Program',
      'Laboratory': 'Basic Program',
      'Gastroenterology': 'Specialty Program',
      'Oncology': 'Specialty Program',
      'Reproductive Health': 'Specialty Program'
    };
    
    // Create specialties documents
    const specialtiesToCreate = specialtiesFromCases.map(specialty => ({
      name: specialty,
      programArea: specialtyToProgramArea[specialty] || 'Basic Program',
      description: `${specialty} specialty for medical training`,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    // Insert into specialties collection
    const specialtiesCollection = db.collection('specialties');
    await specialtiesCollection.deleteMany({}); // Clear existing
    const result = await specialtiesCollection.insertMany(specialtiesToCreate);
    
    console.log(`Successfully inserted ${result.insertedCount} specialties into MongoDB.`);
    console.log('Specialties created:');
    specialtiesToCreate.forEach(s => console.log(`- ${s.name} (${s.programArea})`));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
})();