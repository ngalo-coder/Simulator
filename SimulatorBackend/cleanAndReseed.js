import { MongoClient } from 'mongodb';
import fs from 'fs';
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
    
    // Clear the cases collection
    await db.collection('cases').deleteMany({});
    console.log('Cleared cases collection');
    
    // Load and insert cases without duplicates
    const CASE_FILES = [
      "cases/ophthalmology_cases.json",
      "cases/nursing_cases.json",
      "cases/radiology_cases.json",
      "cases/laboratory_cases.json",
      "cases/pharmacy_cases.json"
    ];
    
    let allCases = [];
    for (const filePath of CASE_FILES) {
      try {
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const cases = JSON.parse(rawData);
        console.log(`Loaded ${cases.length} cases from ${filePath}`);
        allCases = allCases.concat(cases);
      } catch (error) {
        console.error(`Error loading ${filePath}:`, error.message);
      }
    }
    
    // Remove duplicates based on case_id
    const uniqueCases = [];
    const seenCaseIds = new Set();
    
    for (const caseData of allCases) {
      const caseId = caseData.case_metadata?.case_id;
      if (caseId && !seenCaseIds.has(caseId)) {
        seenCaseIds.add(caseId);
        uniqueCases.push(caseData);
      }
    }
    
    console.log(`Total unique cases: ${uniqueCases.length}`);
    
    // Insert unique cases
    if (uniqueCases.length > 0) {
      const result = await db.collection('cases').insertMany(uniqueCases);
      console.log(`Successfully inserted ${result.insertedCount} unique cases`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
})();