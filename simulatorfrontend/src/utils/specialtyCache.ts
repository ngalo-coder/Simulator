/**
 * Specialty caching utility to avoid repeated API calls
 * Implements in-memory and localStorage caching with TTL
 */

import { specialtyToSlug, slugToSpecialty } from './urlUtils';
import { trackCacheOperation } from './performanceMonitor';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface SpecialtyCacheData {
  specialties: string[];
  specialtyCounts: Record<string, number>;
  slugMappings: Record<string, string>; // specialty -> slug
  reverseMappings: Record<string, string>; // slug -> specialty
}

class SpecialtyCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly STORAGE_KEY = 'specialty_cache';
  private readonly STORAGE_TTL = 30 * 60 * 1000; // 30 minutes for localStorage

  /**
   * Get cached data by key
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      trackCacheOperation(false); // Cache miss
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      trackCacheOperation(false); // Cache miss (expired)
      return null;
    }

    trackCacheOperation(true); // Cache hit
    return entry.data;
  }

  /**
   * Set cached data with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
    };

    this.cache.set(key, entry);
  }

  /**
   * Clear specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.clearPersistentCache();
  }

  /**
   * Get specialty data from cache or return null
   */
  getSpecialtyData(): SpecialtyCacheData | null {
    // First try in-memory cache
    const memoryData = this.get<SpecialtyCacheData>('specialty_data');
    if (memoryData) {
      return memoryData;
    }

    // Try localStorage cache
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);

        // Check if localStorage cache is still valid
        if (Date.now() - parsed.timestamp < this.STORAGE_TTL) {
          // Restore to memory cache
          this.set('specialty_data', parsed.data, this.DEFAULT_TTL);
          trackCacheOperation(true); // localStorage cache hit
          return parsed.data;
        } else {
          // Remove expired localStorage cache
          localStorage.removeItem(this.STORAGE_KEY);
          trackCacheOperation(false); // Cache miss (expired)
        }
      } else {
        trackCacheOperation(false); // Cache miss (no data)
      }
    } catch (error) {
      console.warn('Failed to read specialty cache from localStorage:', error);
      trackCacheOperation(false); // Cache miss (error)
    }

    return null;
  }

  /**
   * Force refresh of specialty data by clearing cache
   */
  forceRefresh(): void {
    this.clear();
    console.log('Specialty cache force refreshed');
  }

  /**
   * Get specialty data with fallback to API if cache is empty
   */
  async getSpecialtyDataWithFallback(apiCall: () => Promise<SpecialtyCacheData>): Promise<SpecialtyCacheData | null> {
    // Try cache first
    let data = this.getSpecialtyData();

    if (!data) {
      try {
        // If no cache, try to fetch from API
        data = await apiCall();
        if (data) {
          this.setSpecialtyData(data);
        }
      } catch (error) {
        console.warn('Failed to fetch specialty data from API:', error);
        return null;
      }
    }

    return data;
  }

  /**
   * Set specialty data in both memory and localStorage
   */
  setSpecialtyData(data: SpecialtyCacheData): void {
    // Set in memory cache
    this.set('specialty_data', data, this.DEFAULT_TTL);

    // Set in localStorage for persistence
    try {
      const storageData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storageData));
    } catch (error) {
      console.warn('Failed to save specialty cache to localStorage:', error);
    }
  }

  /**
   * Build specialty cache data from API response
   */
  buildSpecialtyCache(specialties: string[], specialtyCounts: Record<string, number>): SpecialtyCacheData {
    const slugMappings: Record<string, string> = {};
    const reverseMappings: Record<string, string> = {};

    // Pre-compute all slug mappings
    specialties.forEach(specialty => {
      const slug = specialtyToSlug(specialty);
      slugMappings[specialty] = slug;
      reverseMappings[slug] = specialty;
    });

    return {
      specialties,
      specialtyCounts,
      slugMappings,
      reverseMappings,
    };
  }

  /**
   * Get specialty slug from cache (faster than computing)
   */
  getSpecialtySlug(specialty: string): string | null {
    const data = this.getSpecialtyData();
    return data?.slugMappings[specialty] || null;
  }

  /**
   * Get specialty name from slug cache (faster than computing)
   */
  getSpecialtyFromSlug(slug: string): string | null {
    const data = this.getSpecialtyData();
    return data?.reverseMappings[slug] || null;
  }

  /**
   * Check if specialty exists in cache
   */
  hasSpecialty(specialty: string): boolean {
    const data = this.getSpecialtyData();
    return data?.specialties.includes(specialty) || false;
  }

  /**
   * Check if slug exists in cache
   */
  hasSlug(slug: string): boolean {
    const data = this.getSpecialtyData();
    return slug in (data?.reverseMappings || {});
  }

  /**
   * Get specialty count from cache
   */
  getSpecialtyCount(specialty: string): number {
    const data = this.getSpecialtyData();
    return data?.specialtyCounts[specialty] || 0;
  }

  /**
   * Clear persistent cache
   */
  private clearPersistentCache(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear persistent cache:', error);
    }
  }

  /**
   * Get cache statistics for debugging
   */
  getStats(): {
    memoryEntries: number;
    hasSpecialtyData: boolean;
    specialtyCount: number;
    lastUpdated: number | null;
  } {
    const specialtyData = this.getSpecialtyData();
    
    return {
      memoryEntries: this.cache.size,
      hasSpecialtyData: !!specialtyData,
      specialtyCount: specialtyData?.specialties.length || 0,
      lastUpdated: this.cache.get('specialty_data')?.timestamp || null,
    };
  }
}

// Export singleton instance
export const specialtyCache = new SpecialtyCache();

// Export utility functions that use cache
export const getCachedSpecialtySlug = (specialty: string): string => {
  return specialtyCache.getSpecialtySlug(specialty) || specialtyToSlug(specialty);
};

export const getCachedSpecialtyFromSlug = (slug: string): string => {
  return specialtyCache.getSpecialtyFromSlug(slug) || slugToSpecialty(slug);
};

export const isCachedSpecialtyValid = (specialty: string): boolean => {
  return specialtyCache.hasSpecialty(specialty);
};

export const isCachedSlugValid = (slug: string): boolean => {
  return specialtyCache.hasSlug(slug);
};