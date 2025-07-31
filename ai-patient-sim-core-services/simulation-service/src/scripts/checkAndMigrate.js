// ai-patient-sim-core-services/simulation-service/src/scripts/checkAndMigrate.js
const mongoose = require('mongoose');
const TemplateCase = require('../models/TemplateCase');
const migrateTemplateCases = require('./migrateTemplateCases');
require('dotenv').config();

async function checkAndMigrate() {
  try {
    console.log('🔍 Checking database status...');
    
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-patient-sim';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('📊 Database:', mongoose.connection.db.databaseName);

    // Check if template cases exist
    const caseCount = await TemplateCase.countDocuments({ isActive: true });
    console.log(`📋 Current template cases in database: ${caseCount}`);

    if (caseCount === 0) {
      console.log('⚠️ No template cases found. Running migration...');
      await migrateTemplateCases();
    } else {
      console.log('✅ Template cases already exist in database');
      
      // Show sample cases
      const sampleCases = await TemplateCase.find({ isActive: true })
        .select('caseId title specialty difficulty')
        .limit(5);
      
      console.log('\n📋 Sample cases in database:');
      sampleCases.forEach(case_ => {
        console.log(`  - ${case_.caseId}: ${case_.title} (${case_.specialty}, ${case_.difficulty})`);
      });
    }

    // Test API endpoint simulation
    console.log('\n🧪 Testing case retrieval...');
    const testCases = await TemplateCase.find({ isActive: true }).limit(3);
    console.log(`✅ Successfully retrieved ${testCases.length} cases for API`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('🔍 Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📦 Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  checkAndMigrate();
}

module.exports = checkAndMigrate;