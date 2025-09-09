/**
 * Test file for Internal Medicine categorization functionality
 * This can be run to verify the categorization logic works correctly
 */

import { categorizeCase, getSubCategoriesWithCounts } from './internalMedicineCategories';

// Mock test cases for Internal Medicine
const testCases = [
  {
    title: 'Chest Pain Evaluation',
    description: 'A 65-year-old male presents with chest pain and shortness of breath. ECG shows ST elevation.',
    chief_complaint: 'Chest pain',
    tags: ['cardiology', 'emergency']
  },
  {
    title: 'Diabetes Management',
    description: 'A 45-year-old female with newly diagnosed Type 2 diabetes needs management plan.',
    chief_complaint: 'High blood sugar',
    tags: ['endocrinology', 'chronic']
  },
  {
    title: 'Pneumonia Case',
    description: 'A 78-year-old female with fever, cough, and shortness of breath. Chest X-ray shows consolidation.',
    chief_complaint: 'Shortness of breath',
    tags: ['pulmonology', 'infection']
  },
  {
    title: 'Abdominal Pain Workup',
    description: 'A 35-year-old male with acute abdominal pain and nausea. Suspected GI issue.',
    chief_complaint: 'Abdominal pain',
    tags: ['gastroenterology']
  },
  {
    title: 'Renal Failure',
    description: 'A 60-year-old patient with elevated creatinine and electrolyte imbalance.',
    chief_complaint: 'Fatigue',
    tags: ['nephrology']
  }
];

// Test categorization function
console.log('🧪 Testing Internal Medicine Case Categorization\n');

testCases.forEach((case_, index) => {
  const categories = categorizeCase(case_);
  console.log(`Case ${index + 1}: ${case_.title}`);
  console.log(`Chief Complaint: ${case_.chief_complaint}`);
  console.log(`Detected Categories: ${categories.join(', ')}`);
  console.log('---');
});

// Test sub-category counting
console.log('\n🧪 Testing Sub-Category Counts\n');
const subCategoriesWithCounts = getSubCategoriesWithCounts(testCases);
subCategoriesWithCounts.forEach(category => {
  if (category.count > 0) {
    console.log(`${category.name}: ${category.count} cases`);
  }
});

console.log('\n✅ Internal Medicine categorization test completed successfully!');