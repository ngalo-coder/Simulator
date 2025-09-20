import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProgramArea from '../src/models/ProgramAreaModel.js';
import Specialty from '../src/models/SpecialtyModel.js';
import Case from '../src/models/CaseModel.js';
import connectDB from '../src/config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Connect to MongoDB
await connectDB();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function showCurrentMappings() {
  console.log('\n📊 Current Specialty Mappings:');
  console.log('=' .repeat(50));

  try {
    // Get mappings from cases
    const cases = await Case.find(
      {
        'case_metadata.specialty': { $exists: true, $ne: null, $ne: '' },
        'case_metadata.program_area': { $exists: true, $ne: null, $ne: '' }
      },
      'case_metadata.specialty case_metadata.program_area'
    ).lean();

    const mappings = {};
    cases.forEach(caseData => {
      const specialty = caseData.case_metadata?.specialty;
      const programArea = caseData.case_metadata?.program_area;
      if (specialty && programArea) {
        mappings[specialty] = programArea;
      }
    });

    // Group by program area
    const byProgramArea = {};
    Object.entries(mappings).forEach(([specialty, programArea]) => {
      if (!byProgramArea[programArea]) {
        byProgramArea[programArea] = [];
      }
      byProgramArea[programArea].push(specialty);
    });

    // Display organized by program area
    for (const [programArea, specialties] of Object.entries(byProgramArea)) {
      console.log(`\n${programArea}:`);
      specialties.forEach(specialty => {
        console.log(`  - ${specialty}`);
      });
    }

    console.log(`\n📈 Total: ${Object.keys(mappings).length} specialties mapped`);
  } catch (error) {
    console.error('Error showing mappings:', error);
  }
}

async function addManualMapping() {
  try {
    console.log('\n➕ Add Manual Specialty Mapping');
    console.log('=' .repeat(40));

    const specialty = await question('Enter specialty name: ');
    if (!specialty.trim()) {
      console.log('❌ Specialty name cannot be empty');
      return;
    }

    // Show available program areas
    const programAreas = await ProgramArea.find({ active: true }).select('name').lean();
    console.log('\nAvailable Program Areas:');
    programAreas.forEach((pa, index) => {
      console.log(`${index + 1}. ${pa.name}`);
    });

    const programAreaChoice = await question('\nSelect program area (number): ');
    const programAreaIndex = parseInt(programAreaChoice) - 1;

    if (programAreaIndex < 0 || programAreaIndex >= programAreas.length) {
      console.log('❌ Invalid program area selection');
      return;
    }

    const selectedProgramArea = programAreas[programAreaIndex].name;

    // Update config file
    const configPath = path.join(__dirname, '../config/specialty-mapping.json');
    let config = {};

    try {
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, 'utf8');
        config = JSON.parse(configData);
      }
    } catch (error) {
      console.log('⚠️  Could not load existing config, creating new one');
    }

    // Add the override
    if (!config.overrides) {
      config.overrides = {};
    }
    config.overrides[specialty] = selectedProgramArea;

    // Save config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`✅ Added mapping: "${specialty}" → "${selectedProgramArea}"`);
    console.log(`📝 Updated config file: ${configPath}`);

  } catch (error) {
    console.error('Error adding manual mapping:', error);
  }
}

async function removeManualMapping() {
  try {
    console.log('\n➖ Remove Manual Specialty Mapping');
    console.log('=' .repeat(40));

    const configPath = path.join(__dirname, '../config/specialty-mapping.json');

    if (!fs.existsSync(configPath)) {
      console.log('❌ No config file found');
      return;
    }

    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);

    if (!config.overrides || Object.keys(config.overrides).length === 0) {
      console.log('❌ No manual mappings found');
      return;
    }

    console.log('\nCurrent manual mappings:');
    Object.entries(config.overrides).forEach(([specialty, programArea], index) => {
      console.log(`${index + 1}. ${specialty} → ${programArea}`);
    });

    const choice = await question('\nEnter number to remove (or "all" to remove all): ');

    if (choice.toLowerCase() === 'all') {
      config.overrides = {};
      console.log('✅ Removed all manual mappings');
    } else {
      const index = parseInt(choice) - 1;
      const entries = Object.entries(config.overrides);

      if (index < 0 || index >= entries.length) {
        console.log('❌ Invalid selection');
        return;
      }

      const [specialty] = entries[index];
      delete config.overrides[specialty];
      console.log(`✅ Removed mapping for: "${specialty}"`);
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`📝 Updated config file: ${configPath}`);

  } catch (error) {
    console.error('Error removing manual mapping:', error);
  }
}

async function showUnmappedSpecialties() {
  console.log('\n🔍 Unmapped Specialties');
  console.log('=' .repeat(30));

  try {
    // Get all specialties from cases
    const allSpecialties = await Case.distinct('case_metadata.specialty');
    const validSpecialties = allSpecialties.filter(s => s && s.trim() !== '');

    // Get mapped specialties
    const mappedSpecialties = await Specialty.find({ active: true }).select('name').lean();
    const mappedNames = mappedSpecialties.map(s => s.name);

    // Find unmapped ones
    const unmapped = validSpecialties.filter(specialty => !mappedNames.includes(specialty));

    if (unmapped.length === 0) {
      console.log('✅ All specialties are mapped!');
    } else {
      console.log(`⚠️  Found ${unmapped.length} unmapped specialties:`);
      unmapped.forEach(specialty => {
        console.log(`  - ${specialty}`);
      });
    }

  } catch (error) {
    console.error('Error finding unmapped specialties:', error);
  }
}

async function main() {
  console.log('🛠️  Specialty Mapping Management Tool');
  console.log('=' .repeat(50));

  while (true) {
    console.log('\n📋 Available Actions:');
    console.log('1. Show current mappings');
    console.log('2. Add manual mapping');
    console.log('3. Remove manual mapping');
    console.log('4. Show unmapped specialties');
    console.log('5. Exit');

    const choice = await question('\nSelect action (1-5): ');

    switch (choice) {
      case '1':
        await showCurrentMappings();
        break;
      case '2':
        await addManualMapping();
        break;
      case '3':
        await removeManualMapping();
        break;
      case '4':
        await showUnmappedSpecialties();
        break;
      case '5':
        console.log('\n👋 Goodbye!');
        rl.close();
        await mongoose.connection.close();
        return;
      default:
        console.log('❌ Invalid choice. Please select 1-5.');
    }
  }
}

// Run the tool if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await main();
  } catch (error) {
    console.error('Error running management tool:', error);
    process.exit(1);
  }
}