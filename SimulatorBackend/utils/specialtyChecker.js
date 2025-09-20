import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Case from '../src/models/CaseModel.js';
import Specialty from '../src/models/SpecialtyModel.js';
import CaseService from '../src/services/caseService.js';

dotenv.config();

/**
 * Consolidated specialty checking utility
 * Combines functionality from checkSpecialties.js, checkSpecialtiesDirect.js, and checkFrontendSpecialties.js
 */
export class SpecialtyChecker {
  static async connectToDatabase() {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        dbName: process.env.DB_NAME
      });
      console.log('Connected to MongoDB successfully');
    } catch (error) {
      console.error('Database connection error:', error);
      process.exit(1);
    }
  }

  static async disconnectFromDatabase() {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }

  /**
   * Check specialties in cases vs database
   */
  static async checkSpecialtiesVsDatabase() {
    console.log('=== Checking Specialties vs Database ===\n');

    try {
      // Get distinct specialties from cases
      const caseSpecialties = await Case.distinct('case_metadata.specialty');
      console.log('Specialties from cases:', caseSpecialties);

      // Get specialties from specialty collection
      const dbSpecialties = await Specialty.find().select('name programArea active');
      console.log('Specialties from DB:', dbSpecialties.map(s => ({
        name: s.name,
        programArea: s.programArea,
        active: s.active
      })));

      // Check for mismatches
      const caseSpecialtyNames = caseSpecialties.filter(s => s && s.trim());
      const dbSpecialtyNames = dbSpecialties.map(s => s.name);

      const missingInDB = caseSpecialtyNames.filter(s => !dbSpecialtyNames.includes(s));
      const missingInCases = dbSpecialtyNames.filter(s => !caseSpecialtyNames.includes(s));

      console.log('Specialties in cases but not in DB:', missingInDB);
      console.log('Specialties in DB but not in cases:', missingInCases);

      return { caseSpecialties, dbSpecialties, missingInDB, missingInCases };
    } catch (error) {
      console.error('Error checking specialties vs database:', error);
      throw error;
    }
  }

  /**
   * Check specialties directly from database with detailed analysis
   */
  static async checkSpecialtiesDirect() {
    console.log('=== Checking Specialties Directly from Database ===\n');

    try {
      // Get all distinct specialties
      const allSpecialties = await mongoose.connection.db.collection('cases').distinct('case_metadata.specialty');
      console.log('All specialties in database:', allSpecialties.sort());

      // Check allied health specialties
      const alliedHealthSpecialties = ['Nursing', 'Laboratory', 'Pharmacy', 'Radiology', 'Ophthalmology'];
      console.log('\nAllied health specialties to check:', alliedHealthSpecialties);

      // Check case counts for each allied health specialty
      console.log('\n=== Allied Health Case Counts ===');
      for (const specialty of alliedHealthSpecialties) {
        const count = await mongoose.connection.db.collection('cases').countDocuments({
          'case_metadata.specialty': specialty,
          status: 'published'
        });
        console.log(`${specialty}: ${count} published cases`);
      }

      // Check program areas for allied health specialties
      console.log('\n=== Program Areas for Allied Health Specialties ===');
      for (const specialty of alliedHealthSpecialties) {
        const cases = await mongoose.connection.db.collection('cases').find({
          'case_metadata.specialty': specialty,
          status: 'published'
        }).limit(1).toArray();

        if (cases.length > 0) {
          console.log(`${specialty}: ${cases[0].case_metadata.program_area}`);
        } else {
          console.log(`${specialty}: No published cases found`);
        }
      }

      return { allSpecialties, alliedHealthSpecialties };
    } catch (error) {
      console.error('Error checking specialties directly:', error);
      throw error;
    }
  }

  /**
   * Check frontend specialty configuration
   */
  static async checkFrontendSpecialties() {
    console.log('=== Checking Frontend Specialty Configuration ===\n');

    try {
      // Get all case categories to see what specialties are available
      const categories = await CaseService.getCaseCategories();

      console.log('Available program areas:', categories.program_areas);
      console.log('Available specialties:', categories.specialties);
      console.log('Specialty counts:', categories.specialty_counts);

      // Check Basic Program specialties
      console.log('\n=== Basic Program Specialties ===');
      const basicCategories = await CaseService.getCaseCategories({ program_area: 'Basic Program' });
      console.log('Basic Program specialties:', basicCategories.specialties);
      console.log('Basic Program specialty counts:', basicCategories.specialty_counts);

      // Check Specialty Program specialties
      console.log('\n=== Specialty Program Specialties ===');
      const specialtyCategories = await CaseService.getCaseCategories({ program_area: 'Specialty Program' });
      console.log('Specialty Program specialties:', specialtyCategories.specialties);
      console.log('Specialty Program specialty counts:', specialtyCategories.specialty_counts);

      // Check which allied health specialties are missing from frontend config
      const alliedHealthSpecialties = ['Nursing', 'Laboratory', 'Pharmacy', 'Radiology', 'Ophthalmology'];
      const frontendConfigSpecialties = [
        'General Surgery', 'Internal Medicine', 'Pediatrics', 'Reproductive Health',
        'Emergency Medicine', 'Cardiology', 'Neurology', 'Psychiatry'
      ];

      console.log('\n=== Frontend Configuration Analysis ===');
      console.log('Allied health specialties:', alliedHealthSpecialties);
      console.log('Frontend configured specialties:', frontendConfigSpecialties);

      const missingAlliedHealth = alliedHealthSpecialties.filter(spec => !frontendConfigSpecialties.includes(spec));
      console.log('Allied health specialties missing from frontend config:', missingAlliedHealth);

      // Check if these specialties exist in the database
      console.log('\n=== Database Presence Check ===');
      for (const specialty of missingAlliedHealth) {
        const cases = await mongoose.connection.db.collection('cases').countDocuments({
          'case_metadata.specialty': specialty,
          status: 'published'
        });
        console.log(`${specialty}: ${cases} published cases`);
      }

      return { categories, basicCategories, specialtyCategories, missingAlliedHealth };
    } catch (error) {
      console.error('Error checking frontend specialties:', error);
      throw error;
    }
  }

  /**
   * Run all specialty checks
   */
  static async runAllChecks() {
    await this.connectToDatabase();

    try {
      console.log('='.repeat(60));
      console.log('COMPREHENSIVE SPECIALTY ANALYSIS REPORT');
      console.log('='.repeat(60));

      await this.checkSpecialtiesVsDatabase();
      console.log('\n' + '-'.repeat(60) + '\n');

      await this.checkSpecialtiesDirect();
      console.log('\n' + '-'.repeat(60) + '\n');

      await this.checkFrontendSpecialties();

      console.log('\n' + '='.repeat(60));
      console.log('ANALYSIS COMPLETE');
      console.log('='.repeat(60));
    } catch (error) {
      console.error('Error running comprehensive analysis:', error);
    } finally {
      await this.disconnectFromDatabase();
    }
  }
}

// Export individual methods for specific use cases
export const checkSpecialtiesVsDatabase = SpecialtyChecker.checkSpecialtiesVsDatabase.bind(SpecialtyChecker);
export const checkSpecialtiesDirect = SpecialtyChecker.checkSpecialtiesDirect.bind(SpecialtyChecker);
export const checkFrontendSpecialties = SpecialtyChecker.checkFrontendSpecialties.bind(SpecialtyChecker);
export const runAllSpecialtyChecks = SpecialtyChecker.runAllChecks.bind(SpecialtyChecker);

// Default export
export default SpecialtyChecker;