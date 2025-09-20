import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProgramArea from '../src/models/ProgramAreaModel.js';
import Specialty from '../src/models/SpecialtyModel.js';
import Case from '../src/models/CaseModel.js';
import connectDB from '../src/config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Connect to MongoDB
await connectDB();

async function initializeProgramAreasAndSpecialties() {
  try {
    console.log('Starting initialization of program areas and specialties...');

    // Get existing program areas and specialties from cases
    const existingProgramAreas = await Case.distinct('case_metadata.program_area');
    const existingSpecialties = await Case.distinct('case_metadata.specialty');

    console.log('Existing program areas from cases:', existingProgramAreas);
    console.log('Existing specialties from cases:', existingSpecialties);

    // Build specialty-to-program-area mapping from existing cases
    const specialtyToProgramAreaMap = await buildSpecialtyMappingFromCases();
    console.log('Built dynamic mapping from cases:', Object.keys(specialtyToProgramAreaMap).length, 'specialties mapped');
    
    // Create program areas collection if it doesn't exist
    const programAreasCount = await ProgramArea.countDocuments();
    if (programAreasCount === 0) {
      console.log('Creating program areas collection...');
      
      const programAreasToCreate = existingProgramAreas
        .filter(area => area && area.trim() !== '')
        .map(area => ({
          name: area,
          description: `${area} program for medical training`,
          active: true
        }));
      
      if (programAreasToCreate.length > 0) {
        await ProgramArea.insertMany(programAreasToCreate);
        console.log(`Created ${programAreasToCreate.length} program areas`);
      } else {
        console.log('No program areas to create');
        
        // Create default program areas if none exist
        await ProgramArea.insertMany([
          {
            name: 'Basic Program',
            description: 'Fundamental medical training program',
            active: true
          },
          {
            name: 'Specialty Program',
            description: 'Advanced specialized medical training',
            active: true
          }
        ]);
        console.log('Created default program areas');
      }
    } else {
      console.log(`Program areas collection already exists with ${programAreasCount} entries`);
    }
    
    // Create or update specialties collection
    const specialtiesCount = await Specialty.countDocuments();
    
    // Get program areas from the database
    const programAreas = await ProgramArea.find();
    const programAreaMap = {};
    programAreas.forEach(pa => {
      programAreaMap[pa.name] = pa.name;
    });
    
    // Default program area if none match
    const defaultProgramArea = programAreas.length > 0 ?
      programAreas[0].name : 'Basic Program';
    
    if (specialtiesCount === 0) {
      console.log('Creating specialties collection...');
      
      const specialtiesToCreate = [];
      for (const specialty of existingSpecialties) {
        if (specialty && specialty.trim() !== '') {
          const programArea = await determineMatchingProgramArea(specialty, programAreaMap, specialtyToProgramAreaMap);
          specialtiesToCreate.push({
            name: specialty,
            programArea: programArea || defaultProgramArea,
            description: `${specialty} specialty for medical training`,
            active: true
          });
        }
      }
      
      if (specialtiesToCreate.length > 0) {
        await Specialty.insertMany(specialtiesToCreate);
        console.log(`Created ${specialtiesToCreate.length} specialties`);
      } else {
        console.log('No specialties to create');
      }
    } else {
      console.log(`Specialties collection already exists with ${specialtiesCount} entries`);
      
      // Check for and add any new specialties that exist in cases but not in specialties collection
      const existingSpecialtyNames = (await Specialty.find().select('name')).map(s => s.name);
      const newSpecialties = existingSpecialties.filter(specialty =>
        specialty && specialty.trim() !== '' && !existingSpecialtyNames.includes(specialty)
      );
      
      if (newSpecialties.length > 0) {
        console.log(`Found ${newSpecialties.length} new specialties to add:`, newSpecialties);
        
        const specialtiesToAdd = [];
        for (const specialty of newSpecialties) {
          const programArea = await determineMatchingProgramArea(specialty, programAreaMap, specialtyToProgramAreaMap);
          specialtiesToAdd.push({
            name: specialty,
            programArea: programArea || defaultProgramArea,
            description: `${specialty} specialty for medical training`,
            active: true
          });
        }
        
        await Specialty.insertMany(specialtiesToAdd);
        console.log(`Added ${specialtiesToAdd.length} new specialties`);
      } else {
        console.log('No new specialties to add');
      }
    }
    
    console.log('Initialization complete!');
  } catch (error) {
    console.error('Error initializing program areas and specialties:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Load mapping rules from configuration
let MAPPING_RULES = null;

function loadMappingRules() {
  if (MAPPING_RULES) return MAPPING_RULES;

  // Try to load from config file first
  const configPath = path.join(__dirname, '../config/specialty-mapping.json');

  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      MAPPING_RULES = JSON.parse(configData);
      console.log('✅ Loaded mapping rules from config file');
      return MAPPING_RULES;
    }
  } catch (error) {
    console.log('⚠️  Could not load config file, using default rules');
  }

  // Create config file template if it doesn't exist
  if (!fs.existsSync(configPath)) {
    const configTemplate = {
      // Override mappings from cases - add specialty: program_area pairs here
      // Example: "Cardiac Surgery": "Specialty Program"
      overrides: {},

      // Additional keyword rules for edge cases
      keywordRules: {
        'Basic Program': ['general medicine', 'primary care'],
        'Specialty Program': ['interventional', 'surgical', 'advanced']
      }
    };

    try {
      // Ensure config directory exists
      const configDir = path.dirname(configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      fs.writeFileSync(configPath, JSON.stringify(configTemplate, null, 2));
      console.log('📝 Created specialty mapping config template at:', configPath);
    } catch (writeError) {
      console.log('⚠️  Could not create config template:', writeError.message);
    }
  }

  // Default mapping configuration
  MAPPING_RULES = {
    // Keyword-based rules for automatic assignment
    keywordRules: {
      'Basic Program': [
        'internal medicine', 'pediatrics', 'psychiatry', 'emergency',
        'family medicine', 'nursing', 'pharmacy', 'laboratory',
        'general practice', 'primary care', 'preventive medicine',
        'community medicine', 'public health', 'general medicine'
      ],
      'Specialty Program': [
        'surgery', 'ophthalmology', 'cardiology', 'neurology',
        'obstetrics', 'gynecology', 'dermatology', 'orthopedics',
        'radiology', 'pathology', 'anesthesiology', 'gastroenterology',
        'oncology', 'nephrology', 'pulmonology', 'endocrinology',
        'hematology', 'rheumatology', 'infectious disease', 'ent',
        'otolaryngology', 'urology', 'neurosurgery', 'cardiac surgery',
        'plastic surgery', 'vascular surgery', 'thoracic surgery',
        'interventional radiology', 'nuclear medicine', 'palliative care',
        'sports medicine', 'pain management', 'critical care'
      ]
    },

    // Specialty name patterns for exact matches
    exactMatches: {
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
    }
  };

  return MAPPING_RULES;
}

// Helper function to determine which program area a specialty belongs to
async function determineMatchingProgramArea(specialty, programAreaMap, specialtyMapping = null) {
  if (!specialty || typeof specialty !== 'string') {
    return getDefaultProgramArea(programAreaMap);
  }

  // Load mapping rules from config
  const mappingRules = loadMappingRules();

  // 1. Check config file overrides first (highest priority)
  if (mappingRules.overrides[specialty] && programAreaMap[mappingRules.overrides[specialty]]) {
    return mappingRules.overrides[specialty];
  }

  // Build mapping from cases if not provided
  if (!specialtyMapping) {
    specialtyMapping = await buildSpecialtyMappingFromCases();
  }

  // 2. Check if we have a direct mapping from cases
  if (specialtyMapping[specialty] && programAreaMap[specialtyMapping[specialty]]) {
    return specialtyMapping[specialty];
  }

  // 3. Try case-insensitive match
  const normalizedSpecialty = specialty.toLowerCase().trim();
  for (const [caseSpecialty, programArea] of Object.entries(specialtyMapping)) {
    if (caseSpecialty.toLowerCase() === normalizedSpecialty && programAreaMap[programArea]) {
      return programArea;
    }
  }

  // 4. Try partial match for compound specialties
  for (const [caseSpecialty, programArea] of Object.entries(specialtyMapping)) {
    if (normalizedSpecialty.includes(caseSpecialty.toLowerCase()) && programAreaMap[programArea]) {
      return programArea;
    }
  }

  // 5. Check keyword-based rules from config
  for (const [programArea, keywords] of Object.entries(mappingRules.keywordRules)) {
    if (programAreaMap[programArea]) {
      const matchesKeyword = keywords.some(keyword =>
        normalizedSpecialty.includes(keyword.toLowerCase())
      );
      if (matchesKeyword) {
        return programArea;
      }
    }
  }

  // 6. Log unknown specialty for manual review
  console.log(`⚠️  Unknown specialty detected: "${specialty}" - assigned to default program area`);
  console.log(`   Available mappings: ${Object.keys(specialtyMapping).join(', ')}`);
  console.log(`   Consider adding "${specialty}" to a case with the appropriate program_area`);
  console.log(`   Or add override in config file: "${specialty}": "Program Name"`);

  // 7. Default to the first program area
  return getDefaultProgramArea(programAreaMap);
}

// Advanced pattern matching for complex cases
function performAdvancedMatching(specialty, programAreaMap) {
  // Handle compound specialties
  if (specialty.includes(' & ') || specialty.includes(' and ')) {
    const parts = specialty.split(/\s*&\s*|\s+and\s+/i);
    for (const part of parts) {
      const trimmedPart = part.trim();
      const match = determineMatchingProgramArea(trimmedPart, programAreaMap);
      if (match && match !== getDefaultProgramArea(programAreaMap)) {
        return match;
      }
    }
  }

  // Handle specialties with parentheses or additional descriptors
  const baseSpecialty = specialty.replace(/\s*\([^)]*\)/g, '').trim();

  // Handle common medical specialty patterns
  if (baseSpecialty.includes('medicine') && !baseSpecialty.includes('internal')) {
    return 'Basic Program';
  }

  if (baseSpecialty.includes('surgery') || baseSpecialty.includes('surgical')) {
    return 'Specialty Program';
  }

  // Handle pediatric specialties
  if (baseSpecialty.includes('pediatric') || baseSpecialty.includes('paediatric')) {
    return 'Basic Program';
  }

  return null;
}

// Build specialty-to-program-area mapping from existing cases
async function buildSpecialtyMappingFromCases() {
  try {
    // Query cases to get specialty and program_area pairs
    const cases = await Case.find(
      {
        'case_metadata.specialty': { $exists: true, $ne: null, $ne: '' },
        'case_metadata.program_area': { $exists: true, $ne: null, $ne: '' }
      },
      'case_metadata.specialty case_metadata.program_area'
    ).lean();

    // Build mapping from cases
    const specialtyMapping = {};
    cases.forEach(caseData => {
      const specialty = caseData.case_metadata?.specialty;
      const programArea = caseData.case_metadata?.program_area;

      if (specialty && programArea && !specialtyMapping[specialty]) {
        specialtyMapping[specialty] = programArea;
      }
    });

    console.log(`📊 Built mapping from ${cases.length} cases`);
    console.log(`📋 Mapped specialties: ${Object.keys(specialtyMapping).join(', ')}`);

    return specialtyMapping;
  } catch (error) {
    console.error('Error building specialty mapping from cases:', error);
    return {};
  }
}

// Get default program area
function getDefaultProgramArea(programAreaMap) {
  // Prefer 'Basic Program' as default if available
  if (programAreaMap['Basic Program']) {
    return 'Basic Program';
  }

  // Otherwise return the first available program area
  return Object.values(programAreaMap)[0] || 'Basic Program';
}

// Export functions for use by other scripts
export {
  buildSpecialtyMappingFromCases,
  determineMatchingProgramArea,
  loadMappingRules,
  getDefaultProgramArea
};

// Run the initialization if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeProgramAreasAndSpecialties();
}