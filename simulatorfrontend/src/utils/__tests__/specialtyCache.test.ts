/**
 * Tests for specialty cache performance optimizations
 */

import { specialtyCache, getCachedSpecialtySlug, getCachedSpecialtyFromSlug } from '../specialtyCache';

describe('SpecialtyCache Performance Tests', () => {
  beforeEach(() => {
    specialtyCache.clear();
  });

  test('should cache specialty-to-slug mappings', () => {
    const testData = specialtyCache.buildSpecialtyCache(
      ['Internal Medicine', 'Pediatrics'],
      { 'Internal Medicine': 10, 'Pediatrics': 5 }
    );
    
    specialtyCache.setSpecialtyData(testData);
    
    // First call should populate cache
    const slug1 = getCachedSpecialtySlug('Internal Medicine');
    expect(slug1).toBe('internal_medicine');
    
    // Second call should use cache
    const slug2 = getCachedSpecialtySlug('Internal Medicine');
    expect(slug2).toBe('internal_medicine');
    
    // Verify reverse mapping
    const specialty = getCachedSpecialtyFromSlug('internal_medicine');
    expect(specialty).toBe('Internal Medicine');
  });

  test('should handle cache misses gracefully', () => {
    const slug = getCachedSpecialtySlug('Nonexistent Specialty');
    expect(slug).toBe('nonexistent_specialty'); // Falls back to computation
  });

  test('should provide cache statistics', () => {
    const stats = specialtyCache.getStats();
    expect(stats).toHaveProperty('memoryEntries');
    expect(stats).toHaveProperty('hasSpecialtyData');
    expect(stats).toHaveProperty('specialtyCount');
    expect(stats).toHaveProperty('lastUpdated');
  });

  test('should persist data to localStorage', () => {
    const testData = specialtyCache.buildSpecialtyCache(
      ['Cardiology'],
      { 'Cardiology': 8 }
    );
    
    specialtyCache.setSpecialtyData(testData);
    
    // Clear memory cache but keep localStorage
    specialtyCache.delete('specialty_data');
    
    // Should restore from localStorage
    const cachedData = specialtyCache.getSpecialtyData();
    expect(cachedData?.specialties).toContain('Cardiology');
  });
});