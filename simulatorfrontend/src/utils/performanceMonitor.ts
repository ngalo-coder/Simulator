/**
 * Performance monitoring utility for specialty routing
 * Tracks loading times, cache hit rates, and component render performance
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private cacheStats: CacheStats = { hits: 0, misses: 0, hitRate: 0 };
  private renderCounts: Map<string, number> = new Map();

  /**
   * Start timing a performance metric
   */
  startTiming(name: string, metadata?: Record<string, any>): void {
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    });
  }

  /**
   * End timing a performance metric
   */
  endTiming(name: string): number | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    this.metrics.set(name, {
      ...metric,
      endTime,
      duration,
    });

    return duration;
  }

  /**
   * Get timing for a specific metric
   */
  getTiming(name: string): number | null {
    const metric = this.metrics.get(name);
    return metric?.duration || null;
  }

  /**
   * Record cache hit
   */
  recordCacheHit(): void {
    this.cacheStats.hits++;
    this.updateHitRate();
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(): void {
    this.cacheStats.misses++;
    this.updateHitRate();
  }

  /**
   * Update cache hit rate
   */
  private updateHitRate(): void {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    this.cacheStats.hitRate = total > 0 ? this.cacheStats.hits / total : 0;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    return { ...this.cacheStats };
  }

  /**
   * Record component render
   */
  recordRender(componentName: string): void {
    const current = this.renderCounts.get(componentName) || 0;
    this.renderCounts.set(componentName, current + 1);
  }

  /**
   * Get render count for a component
   */
  getRenderCount(componentName: string): number {
    return this.renderCounts.get(componentName) || 0;
  }

  /**
   * Get all performance metrics
   */
  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values()).filter(metric => metric.duration !== undefined);
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    averagePageLoad: number;
    cacheHitRate: number;
    totalRenders: number;
    slowestOperations: Array<{ name: string; duration: number }>;
  } {
    const completedMetrics = this.getAllMetrics();
    const pageLoadMetrics = completedMetrics.filter(m => m.name.includes('page_load'));
    
    const averagePageLoad = pageLoadMetrics.length > 0
      ? pageLoadMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / pageLoadMetrics.length
      : 0;

    const totalRenders = Array.from(this.renderCounts.values()).reduce((sum, count) => sum + count, 0);

    const slowestOperations = completedMetrics
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 5)
      .map(m => ({ name: m.name, duration: m.duration || 0 }));

    return {
      averagePageLoad,
      cacheHitRate: this.cacheStats.hitRate,
      totalRenders,
      slowestOperations,
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    this.cacheStats = { hits: 0, misses: 0, hitRate: 0 };
    this.renderCounts.clear();
  }

  /**
   * Log performance summary to console (development only)
   */
  logSummary(): void {
    if (import.meta.env.MODE !== 'development') return;

    const summary = this.getSummary();
    console.group('🚀 Performance Summary');
    console.log(`Average Page Load: ${summary.averagePageLoad.toFixed(2)}ms`);
    console.log(`Cache Hit Rate: ${(summary.cacheHitRate * 100).toFixed(1)}%`);
    console.log(`Total Renders: ${summary.totalRenders}`);
    
    if (summary.slowestOperations.length > 0) {
      console.log('Slowest Operations:');
      summary.slowestOperations.forEach(op => {
        console.log(`  ${op.name}: ${op.duration.toFixed(2)}ms`);
      });
    }
    
    console.groupEnd();
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for common performance tracking
export const trackPageLoad = (pageName: string) => {
  const metricName = `page_load_${pageName}`;
  performanceMonitor.startTiming(metricName);
  
  return () => performanceMonitor.endTiming(metricName);
};

export const trackApiCall = (apiName: string) => {
  const metricName = `api_call_${apiName}`;
  performanceMonitor.startTiming(metricName);
  
  return () => performanceMonitor.endTiming(metricName);
};

export const trackCacheOperation = (hit: boolean) => {
  if (hit) {
    performanceMonitor.recordCacheHit();
  } else {
    performanceMonitor.recordCacheMiss();
  }
};

export const trackComponentRender = (componentName: string) => {
  performanceMonitor.recordRender(componentName);
};

// React hook for performance tracking
import { useEffect } from 'react';

export const usePerformanceTracking = (componentName: string) => {
  useEffect(() => {
    trackComponentRender(componentName);
  });

  return {
    startTiming: (name: string) => performanceMonitor.startTiming(`${componentName}_${name}`),
    endTiming: (name: string) => performanceMonitor.endTiming(`${componentName}_${name}`),
  };
};