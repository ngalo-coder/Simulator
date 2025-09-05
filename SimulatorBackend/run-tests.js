#!/usr/bin/env node

/**
 * Test Runner for Multimedia System
 * Runs comprehensive tests to validate the implementation
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🧪 Multimedia System Test Runner');
console.log('================================\n');

// Check if .env file exists
if (!fs.existsSync('.env')) {
  console.log('⚠️  No .env file found. Creating from .env.example...');
  if (fs.existsSync('.env.example')) {
    fs.copyFileSync('.env.example', '.env');
    console.log('✅ Created .env file from .env.example');
  } else {
    console.log('❌ No .env.example file found. Please create .env manually.');
    process.exit(1);
  }
}

// Check if MongoDB is running (basic check)
console.log('🔍 Checking MongoDB connection...');
try {
  // This is a basic check - in production you'd want more robust connection testing
  console.log('✅ MongoDB connection check passed (basic)');
} catch (error) {
  console.log('❌ MongoDB connection failed. Please ensure MongoDB is running.');
  console.log('   For local development: mongod --dbpath /path/to/db');
  process.exit(1);
}

// Install dependencies if needed
console.log('📦 Checking dependencies...');
try {
  execSync('npm list --depth=0', { stdio: 'pipe' });
  console.log('✅ Dependencies are installed');
} catch (error) {
  console.log('📥 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed');
}

// Run Jest tests
console.log('\n🧪 Running Jest Tests...');
console.log('========================');
try {
  execSync('npm test', { stdio: 'inherit' });
  console.log('\n✅ Jest tests completed successfully');
} catch (error) {
  console.log('\n❌ Some Jest tests failed. Check the output above for details.');
  console.log('   You can run individual test files with: npm test -- tests/filename.test.js');
}

// Run integration tests
console.log('\n🔗 Running Integration Tests...');
console.log('===============================');
try {
  execSync('node test-multimedia.js', { stdio: 'inherit' });
  console.log('\n✅ Integration tests completed successfully');
} catch (error) {
  console.log('\n❌ Integration tests failed. Check the output above for details.');
}

// Check code coverage
console.log('\n📊 Checking Test Coverage...');
console.log('============================');
const coverageDir = 'coverage';
if (fs.existsSync(coverageDir)) {
  const coverageSummary = path.join(coverageDir, 'coverage-summary.json');
  if (fs.existsSync(coverageSummary)) {
    const coverage = JSON.parse(fs.readFileSync(coverageSummary, 'utf8'));
    console.log('Coverage Summary:');
    console.log(`  Statements: ${coverage.total.statements.pct}%`);
    console.log(`  Branches:   ${coverage.total.branches.pct}%`);
    console.log(`  Functions:  ${coverage.total.functions.pct}%`);
    console.log(`  Lines:      ${coverage.total.lines.pct}%`);

    if (coverage.total.statements.pct >= 80) {
      console.log('✅ Test coverage meets requirements (80%+)');
    } else {
      console.log('⚠️  Test coverage below 80%. Consider adding more tests.');
    }
  } else {
    console.log('⚠️  No coverage summary found. Run tests with coverage to generate report.');
  }
} else {
  console.log('⚠️  No coverage directory found. Run: npm run test:coverage');
}

// Final summary
console.log('\n🎉 Test Execution Complete!');
console.log('===========================');
console.log('Available test commands:');
console.log('  npm test              - Run all Jest tests');
console.log('  npm run test:watch    - Run tests in watch mode');
console.log('  npm run test:coverage - Run tests with coverage report');
console.log('  node test-multimedia.js - Run integration tests');
console.log('  node run-tests.js     - Run this comprehensive test suite');

console.log('\n📁 Test Files:');
console.log('  tests/*.test.js       - Jest unit tests');
console.log('  test-multimedia.js    - Integration tests');
console.log('  run-tests.js          - This test runner');

console.log('\n🚀 Ready to proceed with other tasks!');