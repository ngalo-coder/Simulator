import { MongoClient } from 'mongodb';
import fs from 'fs'; // Node.js file system module to read the JSON file
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file
// const fs = require('fs');

// Step 1: Load the JSON file containing all cases
function loadCasesFromJson(filePath) {
    try {
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const cases = JSON.parse(rawData);
        console.log(`Successfully loaded ${cases.length} cases from ${filePath}.`);
        return cases;
    } catch (error) {
        console.error(`Error loading JSON file: ${error.message}`);
        return null;
    }
}

// Step 2: Connect to MongoDB and insert cases
async function pushCasesToMongoDB(cases, mongoUri, dbName, collectionName) {
    const client = new MongoClient(mongoUri);

    try {
        // Connect to MongoDB
        await client.connect();
        console.log("Connected to MongoDB successfully.");

        // Select the database and collection
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // Insert cases into the collection
        const result = await collection.insertMany(cases);
        console.log(`Successfully inserted ${result.insertedCount} cases into MongoDB.`);
    } catch (error) {
        console.error(`Error inserting cases into MongoDB: ${error.message}`);
    } finally {
        // Close the connection
        await client.close();
    }
}

// Main function to execute the script
(async () => {
    // Configuration
    const MONGO_URI = process.env.MONGODB_URI;
    const DB_NAME = process.env.DB_NAME;
    
    if (!MONGO_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    if (!DB_NAME) {
      throw new Error('DB_NAME environment variable is not set');
    }
    const COLLECTION_NAME = "cases"
    const CASE_FILES = [
      "cases/ophthalmology_cases.json",
      "cases/nursing_cases.json",
      "cases/radiology_cases.json",
      "cases/laboratory_cases.json",
      "cases/pharmacy_cases.json"
    ];

    // Load cases from JSON
    let allCases = [];
    for (const filePath of CASE_FILES) {
      const cases = loadCasesFromJson(filePath);
      if (cases) allCases = allCases.concat(cases);
    }

    if (allCases.length > 0) {
        await pushCasesToMongoDB(allCases, MONGO_URI, DB_NAME, COLLECTION_NAME);
    }
})();









