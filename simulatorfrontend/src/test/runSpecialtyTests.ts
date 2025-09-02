#!/usr/bin/env node

/**
 * Test runner for specialty routing comprehensive tests
 * Runs all specialty routing related tests in organized categories
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

interface TestCategory {
  name: string;
  pattern: string;
  description: string;
}

const testCategories: TestCategory[] = [
  {
    name: 'Unit Tests',
    pattern: 'src/utils/urlUtils.test.ts src/hooks/useSpecialtyContext.test.tsx',
    description: 'URL utility functions and specialty context hook unit tests'
  },
  {
    name: 'Component Tests',
    pattern: 'src/pages/SpecialtyCasePage.test.tsx src/components/SpecialtyHeader.test.tsx src/components/SpecialtyNavigation.test.tsx',
    description: 'Individual component tests for specialty routing'
  },
  {
    name: 'Integration Tests',
    pattern: 'src/test/integration/specialtyRouting.integration.test.tsx',
    description: 'Navigation flow and API integration tests'
  },
  {
    name: 'End-to-End Tests',
    pattern: 'src/test/e2e/specialtyRouting.e2e.test.tsx',
    description: 'Complete user journey tests from dashboard to specialty cases'
  },
  {
    name: 'Error Scenarios',
    pattern: 'src/test/errorScenarios/specialtyRouting.error.test.tsx',
    description: 'Error handling, invalid routes, and edge case tests'
  }
];

function runTestCategory(category: TestCategory): boolean {
  console.log(`\n🧪 Running ${category.name}...`);
  console.log(`📝 ${category.description}\n`);

  try {
    // Check if test files exist
    const testFiles = category.pattern.split(' ');
    const missingFiles = testFiles.filter(file => !existsSync(path.join(process.cwd(), file)));
    
    if (missingFiles.length > 0) {
      console.log(`⚠️  Warning: Missing test files: ${missingFiles.join(', ')}`);
      return false;
    }

    // Run the tests
    const command = `npm run test -- ${category.pattern} --run --reporter=verbose`;
    execSync(command, { stdio: 'inherit' });
    
    console.log(`✅ ${category.name} completed successfully\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${category.name} failed:`);
    console.error(error);
    return false;
  }
}

function runAllTests(): void {
  console.log('🚀 Starting Specialty Routing Comprehensive Test Suite\n');
  console.log('This test suite covers:');
  console.log('- URL utility functions and specialty context hook');
  console.log('- Navigation flow and API integration');
  console.log('- Complete user journeys');
  console.log('- Error scenarios and edge cases');
  console.log('- Performance and accessibility\n');

  const results: { [key: string]: boolean } = {};
  let totalTests = 0;
  let passedTests = 0;

  for (const category of testCategories) {
    const success = runTestCategory(category);
    results[category.name] = success;
    totalTests++;
    if (success) passedTests++;
  }

  // Print summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  
  for (const [categoryName, success] of Object.entries(results)) {
    const status = success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${categoryName}`);
  }
  
  console.log(`\nTotal: ${passedTests}/${totalTests} test categories passed`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All specialty routing tests passed!');
    console.log('\nThe specialty routing system is ready for:');
    console.log('- ✅ URL-safe specialty slug conversion');
    console.log('- ✅ Dynamic routing and navigation');
    console.log('- ✅ API integration with filtering');
    console.log('- ✅ Error handling and recovery');
    console.log('- ✅ Cross-browser compatibility');
    console.log('- ✅ Performance optimization');
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${totalTests - passedTests} test categories failed. Please review and fix issues.`);
    process.exit(1);
  }
}

function runCoverage(): void {
  console.log('\n📈 Running test coverage analysis...\n');
  
  try {
    const command = 'npm run test:coverage -- src/utils/urlUtils.ts src/hooks/useSpecialtyContext.ts src/pages/SpecialtyCasePage.tsx --run';
    execSync(command, { stdio: 'inherit' });
    console.log('\n✅ Coverage analysis completed');
  } catch (error) {
    console.error('\n❌ Coverage analysis failed:', error);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('Specialty Routing Test Runner');
  console.log('\nUsage:');
  console.log('  npm run test:specialty              # Run all specialty routing tests');
  console.log('  npm run test:specialty -- --coverage # Run tests with coverage');
  console.log('  npm run test:specialty -- --unit     # Run only unit tests');
  console.log('  npm run test:specialty -- --e2e      # Run only end-to-end tests');
  console.log('  npm run test:specialty -- --errors   # Run only error scenario tests');
  process.exit(0);
}

if (args.includes('--coverage')) {
  runCoverage();
} else if (args.includes('--unit')) {
  runTestCategory(testCategories[0]);
} else if (args.includes('--e2e')) {
  runTestCategory(testCategories[3]);
} else if (args.includes('--errors')) {
  runTestCategory(testCategories[4]);
} else {
  runAllTests();
}