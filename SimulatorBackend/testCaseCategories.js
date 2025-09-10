import dotenv from 'dotenv';
dotenv.config();

// Import after dotenv config
import { CaseService } from './src/services/caseService.js';
import connectDB from './src/config/db.js';

(async () => {
  try {
    await connectDB();
    console.log('Testing getCaseCategories...');
    
    // Test without program_area filter
    const allCategories = await CaseService.getCaseCategories();
    console.log('All categories:', allCategories);
    
    // Test with Basic Program filter
    const basicCategories = await CaseService.getCaseCategories('Basic Program');
    console.log('Basic Program categories:', basicCategories);
    
    // Test with Specialty Program filter  
    const specialtyCategories = await CaseService.getCaseCategories('Specialty Program');
    console.log('Specialty Program categories:', specialtyCategories);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
})();