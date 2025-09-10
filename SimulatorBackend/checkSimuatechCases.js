import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './SimulatorBackend/.env' });

async function checkSimuatechCases() {
  let client;
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    // Connect to the simuatech database
    const simuatechDbUri = MONGODB_URI.replace(/\/[^/?]*(\?|$)/, '/simuatech$1');
    client = new MongoClient(simuatechDbUri);
    await client.connect();
    
    console.log('Connected to simuatech database successfully.');
    
    const db = client.db();
    
    // Count cases in simuatech database
    const caseCount = await db.collection('cases').countDocuments();
    console.log(`\nTotal Cases in simuatech database: ${caseCount}`);
    
    // Get case details
    const cases = await db.collection('cases')
      .find({}, { projection: { title: 1, specialty: 1, category: 1, discipline: 1, difficulty: 1, status: 1 } })
      .limit(20)
      .toArray();
    
    console.log('\n=== FIRST 20 CASES IN SIMUATECH DATABASE ===');
    cases.forEach((caseItem, index) => {
      console.log(`${index + 1}. ${caseItem.title}`);
      console.log(`   Specialty: ${caseItem.specialty}`);
      console.log(`   Category: ${caseItem.category}`);
      console.log(`   Discipline: ${caseItem.discipline}`);
      console.log(`   Difficulty: ${caseItem.difficulty}`);
      console.log(`   Status: ${caseItem.status}`);
      console.log('');
    });
    
    // Check for allied health cases specifically
    const alliedHealthCases = await db.collection('cases')
      .find({ 
        $or: [
          { discipline: { $in: ['nursing', 'laboratory', 'pharmacy', 'radiology'] } },
          { specialty: { $regex: 'nursing|lab|pharmacy|radiology', $options: 'i' } }
        ]
      })
      .toArray();
    
    console.log(`\nTotal Allied Health Cases in simuatech database: ${alliedHealthCases.length}`);
    
    if (alliedHealthCases.length > 0) {
      console.log('\n=== ALLIED HEALTH CASES ===');
      alliedHealthCases.forEach((caseItem, index) => {
        console.log(`${index + 1}. ${caseItem.title}`);
        console.log(`   Specialty: ${caseItem.specialty}`);
        console.log(`   Discipline: ${caseItem.discipline}`);
        console.log(`   Category: ${caseItem.category}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('Error checking simuatech database:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('\nDatabase connection closed.');
    }
  }
}

// Run the function
checkSimuatechCases();