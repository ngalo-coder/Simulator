/**
 * Tests for performance monitoring utilities
 */

import { performanceMonitor, trackPageLoad, trackApiCall, trackCacheOperation } from '../performanceMonitor';

describe('PerformanceMonitor Tests', () => {
  beforeEach(() => {
    performanceMonitor.clear();
  });

  test('should track timing metrics', () => {
    performanceMonitor.startTiming('test_operation');
    
    // Simulate some work
    const start = performance.now();
    while (performance.now() - start < 10) {
      // Wait 10ms
    }
    
    const duration = performanceMonitor.endTiming('test_operation');
    expect(duration).toBeGreaterThan(0);
    expect(duration).toBeLessThan(100); // Should be reasonable
  });

  test('should track cache operations', () => {
    trackCacheOperation(true);  // hit
    trackCacheOperation(false); // miss
    trackCacheOperation(true);  // hit
    
    const stats = performanceMonitor.getCacheStats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBeCloseTo(0.67, 2);
  });

  test('should track component renders', () => {
    performanceMonitor.recordRender('TestComponent');
    performanceMonitor.recordRender('TestComponent');
    performanceMonitor.recordRender('AnotherComponent');
    
    expect(performanceMonitor.getRenderCount('TestComponent')).toBe(2);
    expect(performanceMonitor.getRenderCount('AnotherComponent')).toBe(1);
  });

  test('should provide performance summary', () => {
    // Track some operations
    const endPageLoad = trackPageLoad('test_page');
    setTimeout(endPageLoad, 1);
    
    const endApiCall = trackApiCall('test_api');
    setTimeout(endApiCall, 1);
    
    trackCacheOperation(true);
    performanceMonitor.recordRender('TestComponent');
    
    const summary = performanceMonitor.getSummary();
    expect(summary).toHaveProperty('averagePageLoad');
    expect(summary).toHaveProperty('cacheHitRate');
    expect(summary).toHaveProperty('totalRenders');
    expect(summary).toHaveProperty('slowestOperations');
  });

  test('should handle utility functions', () => {
    const endPageLoad = trackPageLoad('specialty_internal_medicine');
    expect(typeof endPageLoad).toBe('function');
    
    const endApiCall = trackApiCall('getCases');
    expect(typeof endApiCall).toBe('function');
  });
});