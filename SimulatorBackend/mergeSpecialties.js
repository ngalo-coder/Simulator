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
    
    // Get all existing specialties from the database
    const existingSpecialties = await db.collection('specialties').find({}).toArray();
    console.log('Existing specialties:', existingSpecialties.map(s => s.name));
    
    // Define the complete list of specialties with their program areas
    const completeSpecialtyList = [
      { name: 'Internal Medicine', programArea: 'Basic Program' },
      { name: 'Surgery', programArea: 'Specialty Program' },
      { name: 'Pediatrics', programArea: 'Basic Program' },
      { name: 'Ophthalmology', programArea: 'Specialty Program' },
      { name: 'ENT', programArea: 'Specialty Program' },
      { name: 'Cardiology', programArea: 'Specialty Program' },
      { name: 'Neurology', programArea: 'Specialty Program' },
      { name: 'Psychiatry', programArea: 'Basic Program' },
      { name: 'Emergency Medicine', programArea: 'Basic Program' },
      { name: 'Family Medicine', programArea: 'Basic Program' },
      { name: 'Obstetrics & Gynecology', programArea: 'Specialty Program' },
      { name: 'Dermatology', programArea: 'Specialty Program' },
      { name: 'Orthopedics', programArea: 'Specialty Program' },
      { name: 'Radiology', programArea: 'Specialty Program' },
      { name: 'Pathology', programArea: 'Specialty Program' },
      { name: 'Anesthesiology', programArea: 'Specialty Program' },
      { name: 'Nursing', programArea: 'Basic Program' },
      { name: 'Pharmacy', programArea: 'Basic Program' },
      { name: 'Laboratory', programArea: 'Basic Program' },
      { name: 'Gastroenterology', programArea: 'Specialty Program' },
      { name: 'Oncology', programArea: 'Specialty Program' },
      { name: 'Reproductive Health', programArea: 'Specialty Program' }
    ];
    
    // Get names of existing specialties
    const existingSpecialtyNames = existingSpecialties.map(s => s.name);
    
    // Find specialties that need to be added
    const specialtiesToAdd = completeSpecialtyList.filter(specialty => 
      !existingSpecialtyNames.includes(specialty.name)
    );
    
    console.log('Specialties to add:', specialtiesToAdd.map(s => s.name));
    
    if (specialtiesToAdd.length > 0) {
      // Prepare specialties for insertion
      const specialtiesForInsertion = specialtiesToAdd.map(specialty => ({
        ...specialty,
        description: `${specialty.name} specialty for medical training`,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      // Insert the missing specialties
      const result = await db.collection('specialties').insertMany(specialtiesForInsertion);
      console.log(`Successfully added ${result.insertedCount} new specialties.`);
    } else {
      console.log('All specialties already exist. No new specialties to add.');
    }
    
    // Display final list of specialties
    const finalSpecialties = await db.collection('specialties').find({}).toArray();
    console.log('\nFinal list of specialties:');
    finalSpecialties.forEach(s => console.log(`- ${s.name} (${s.programArea})`));
    console.log(`Total specialties: ${finalSpecialties.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
})();