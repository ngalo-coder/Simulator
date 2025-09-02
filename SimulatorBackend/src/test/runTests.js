#!/usr/bin/env node

/**
 * Test runner script for comprehensive unit tests
 * This script runs all unit tests and generates coverage reports
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');

console.log('🧪 Running Comprehensive Unit Tests for Simuatech Backend');
console.log('=' .repeat(60));

try {
  // Change to project root directory
  process.chdir(projectRoot);
  
  console.log('📦 Installing test dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('\n🔍 Running unit tests with coverage...');
  execSync('npm run test:coverage', { stdio: 'inherit' });
  
  console.log('\n✅ All tests completed successfully!');
  console.log('\n📊 Coverage report generated in ./coverage directory');
  console.log('📄 Open ./coverage/lcov-report/index.html to view detailed coverage');
  
} catch (error) {
  console.error('\n❌ Test execution failed:', error.message);
  process.exit(1);
}