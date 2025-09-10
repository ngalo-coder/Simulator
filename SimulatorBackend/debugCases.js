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
    
    // Get all cases with their specialties
    const cases = await db.collection('cases').find({}).toArray();
    
    console.log(`Total cases: ${cases.length}`);
    
    // Group cases by specialty
    const casesBySpecialty = {};
    cases.forEach(caseData => {
      const specialty = caseData.case_metadata?.specialty || 'Unknown';
      if (!casesBySpecialty[specialty]) {
        casesBySpecialty[specialty] = [];
      }
      casesBySpecialty[specialty].push({
        case_id: caseData.case_metadata?.case_id,
        title: caseData.case_metadata?.title,
        program_area: caseData.case_metadata?.program_area
      });
    });
    
    console.log('\nCases by specialty:');
    Object.entries(casesBySpecialty).forEach(([specialty, cases]) => {
      console.log(`\n${specialty} (${cases.length} cases):`);
      cases.forEach(c => console.log(`  - ${c.case_id}: ${c.title} [${c.program_area}]`));
    });
    
    // Check for the specific allied health specialties
    const alliedSpecialties = ['Nursing', 'Radiology', 'Pharmacy', 'Laboratory'];
    console.log('\nChecking for allied health specialties:');
    alliedSpecialties.forEach(specialty => {
      const count = cases.filter(c => c.case_metadata?.specialty === specialty).length;
      console.log(`- ${specialty}: ${count} cases`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
})();