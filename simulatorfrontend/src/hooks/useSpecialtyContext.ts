import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/apiService';
import { isValidSpecialtySlug } from '../utils/urlUtils';
import { 
  specialtyCache, 
  getCachedSpecialtySlug, 
  getCachedSpecialtyFromSlug,
  isCachedSlugValid
} from '../utils/specialtyCache';

export interface SpecialtyRoute {
  specialty: string;        // "Internal Medicine"
  slug: string;            // "internal_medicine"
  caseCount: number;       // Number of cases in specialty
  isActive: boolean;       // Currently selected specialty
}

export interface SpecialtyContextState {
  currentSpecialty: string | null;
  currentSpecialtySlug: string | null;
  availableSpecialties: string[];
  specialtyRoutes: SpecialtyRoute[];
  loading: boolean;
  error: string | null;
}

export interface SpecialtyContextActions {
  navigateToSpecialty: (specialty: string) => void;
  navigateToSpecialtySlug: (slug: string) => void;
  isValidSpecialty: (specialty: string) => boolean;
  isValidSpecialtySlug: (slug: string) => boolean;
  getSpecialtyFromSlug: (slug: string) => string | null;
  getSlugFromSpecialty: (specialty: string) => string;
  refreshSpecialties: () => Promise<void>;
  forceRefreshSpecialties: (maxRetries?: number) => Promise<void>;
  clearError: () => void;
}

export interface UseSpecialtyContextReturn extends SpecialtyContextState, SpecialtyContextActions {}

/**
 * Custom hook for managing specialty state and navigation
 * Provides functions for getting available specialties, validating specialty names, and navigation helpers
 * Integrates with existing API service to fetch specialty data
 */
export const useSpecialtyContext = (): UseSpecialtyContextReturn => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [state, setState] = useState<SpecialtyContextState>({
    currentSpecialty: null,
    currentSpecialtySlug: null,
    availableSpecialties: [],
    specialtyRoutes: [],
    loading: true,
    error: null,
  });

  // Performance optimization: debounce location changes
  const [debouncedLocation, setDebouncedLocation] = useState(location.pathname);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLocation(location.pathname);
    }, 100); // 100ms debounce
    
    return () => clearTimeout(timer);
  }, [location.pathname]);

  /**
   * Fetch available specialties from the API with improved caching
   */
  const fetchSpecialties = useCallback(async (): Promise<{
    specialties: string[];
    specialtyCounts: Record<string, number>;
  }> => {
    try {
      // Use the improved cache with fallback
      const cachedData = await specialtyCache.getSpecialtyDataWithFallback(async () => {
        console.log('Fetching specialties from API (cache miss or expired)');
        const categoriesData = await api.getCaseCategories();
        const specialties = categoriesData.specialties || [];
        const specialtyCounts = categoriesData.specialty_counts || {};

        // Build and cache the specialty data
        const cacheData = specialtyCache.buildSpecialtyCache(specialties, specialtyCounts);
        specialtyCache.setSpecialtyData(cacheData);

        return cacheData;
      });

      if (cachedData) {
        return {
          specialties: cachedData.specialties,
          specialtyCounts: cachedData.specialtyCounts,
        };
      }

      // Fallback if no data available
      console.warn('No specialty data available from cache or API');
      return { specialties: [], specialtyCounts: {} };
    } catch (error) {
      console.error('Error fetching specialties:', error);
      // Return empty data instead of throwing to prevent app crashes
      return { specialties: [], specialtyCounts: {} };
    }
  }, []);

  /**
   * Update specialty routes based on available specialties and current location
   * Memoized for performance optimization
   */
  const updateSpecialtyRoutes = useCallback((
    specialties: string[],
    specialtyCounts: Record<string, number>,
    currentSlug: string | null
  ): SpecialtyRoute[] => {
    return specialties.map(specialty => {
      // Use cached slug conversion for better performance
      const slug = getCachedSpecialtySlug(specialty);
      return {
        specialty,
        slug,
        caseCount: specialtyCounts[specialty] || 0,
        isActive: slug === currentSlug,
      };
    });
  }, []);

  /**
   * Extract specialty slug from current URL path
   * Memoized to prevent unnecessary recalculations
   */
  const getCurrentSpecialtySlug = useMemo((): string | null => {
    const pathSegments = debouncedLocation.split('/').filter(Boolean);
    
    // Check if we're on a specialty route (first segment could be a specialty slug)
    if (pathSegments.length > 0) {
      const potentialSlug = pathSegments[0];
      
      // First check cache for faster validation
      if (isCachedSlugValid(potentialSlug)) {
        return potentialSlug;
      }
      
      // Fallback to format validation
      if (isValidSpecialtySlug(potentialSlug)) {
        return potentialSlug;
      }
    }
    
    return null;
  }, [debouncedLocation]);

  /**
   * Initialize and update specialty context based on current location
   */
  const initializeSpecialtyContext = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Check if user is authenticated before fetching data
      if (!api.isAuthenticated()) {
        setState(prev => ({
          ...prev,
          loading: false,
          availableSpecialties: [],
          specialtyRoutes: [],
        }));
        return;
      }

      const { specialties, specialtyCounts } = await fetchSpecialties();
      const currentSlug = getCurrentSpecialtySlug;
      
      let currentSpecialty: string | null = null;
      
      // If we have a current slug, validate it against available specialties
      if (currentSlug) {
        // Use cached conversion for better performance
        const potentialSpecialty = getCachedSpecialtyFromSlug(currentSlug);
        
        // Check if this specialty exists in our available specialties
        const matchingSpecialty = specialties.find(
          specialty => getCachedSpecialtySlug(specialty) === currentSlug
        );
        
        if (matchingSpecialty) {
          currentSpecialty = matchingSpecialty;
        } else {
          // Invalid specialty slug - set error but don't redirect yet
          setState(prev => ({
            ...prev,
            error: `Invalid specialty: ${potentialSpecialty}`,
          }));
        }
      }

      const specialtyRoutes = updateSpecialtyRoutes(specialties, specialtyCounts, currentSlug);

      setState(prev => ({
        ...prev,
        currentSpecialty,
        currentSpecialtySlug: currentSlug,
        availableSpecialties: specialties,
        specialtyRoutes,
        loading: false,
      }));

    } catch (error) {
      console.error('Error initializing specialty context:', error);
      // If error is due to authentication, don't set error state as it's expected
      if (error instanceof Error && error.message.includes('Session expired')) {
        setState(prev => ({
          ...prev,
          loading: false,
          availableSpecialties: [],
          specialtyRoutes: [],
        }));
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load specialties',
        }));
      }
    }
  }, [fetchSpecialties, getCurrentSpecialtySlug, updateSpecialtyRoutes]);

  /**
   * Navigate to a specialty by name (optimized with caching)
   */
  const navigateToSpecialty = useCallback((specialty: string) => {
    if (!specialty) return;
    
    const slug = getCachedSpecialtySlug(specialty);
    if (slug) {
      navigate(`/${slug}`);
    }
  }, [navigate]);

  /**
   * Navigate to a specialty by slug
   */
  const navigateToSpecialtySlug = useCallback((slug: string) => {
    if (!slug || !isValidSpecialtySlug(slug)) return;
    
    navigate(`/${slug}`);
  }, [navigate]);

  /**
   * Check if a specialty name is valid (exists in available specialties)
   */
  const isValidSpecialty = useCallback((specialty: string): boolean => {
    if (!specialty) return false;
    return state.availableSpecialties.includes(specialty);
  }, [state.availableSpecialties]);

  /**
   * Check if a specialty slug is valid (optimized with caching)
   */
  const isValidSpecialtySlugFn = useCallback((slug: string): boolean => {
    if (!isValidSpecialtySlug(slug)) return false;
    
    // First check cache for faster validation
    if (isCachedSlugValid(slug)) return true;
    
    // Fallback to checking available specialties
    return state.availableSpecialties.some(
      availableSpecialty => getCachedSpecialtySlug(availableSpecialty) === slug
    );
  }, [state.availableSpecialties]);

  /**
   * Get specialty name from slug (optimized with caching)
   */
  const getSpecialtyFromSlug = useCallback((slug: string): string | null => {
    if (!slug || !isValidSpecialtySlug(slug)) return null;
    
    // Use cached conversion for better performance
    const cachedSpecialty = getCachedSpecialtyFromSlug(slug);
    if (cachedSpecialty && state.availableSpecialties.includes(cachedSpecialty)) {
      return cachedSpecialty;
    }
    
    // Fallback to finding the matching specialty
    const matchingSpecialty = state.availableSpecialties.find(
      specialty => getCachedSpecialtySlug(specialty) === slug
    );
    
    return matchingSpecialty || null;
  }, [state.availableSpecialties]);

  /**
   * Get slug from specialty name (optimized with caching)
   */
  const getSlugFromSpecialty = useCallback((specialty: string): string => {
    return getCachedSpecialtySlug(specialty);
  }, []);

  /**
   * Refresh specialties data from API
   */
  const refreshSpecialties = useCallback(async (): Promise<void> => {
    try {
      // Force refresh cache to get fresh data
      specialtyCache.forceRefresh();
      await initializeSpecialtyContext();
      console.log('Specialties refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh specialties:', error);
      // Still try to initialize with cached data
      await initializeSpecialtyContext();
    }
  }, [initializeSpecialtyContext]);

  /**
   * Force refresh specialties with retry mechanism
   */
  const forceRefreshSpecialties = useCallback(async (maxRetries: number = 3): Promise<void> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempting to refresh specialties (attempt ${attempt}/${maxRetries})`);
        specialtyCache.forceRefresh();
        await initializeSpecialtyContext();
        console.log('Specialties force refreshed successfully');
        return;
      } catch (error) {
        console.error(`Failed to refresh specialties (attempt ${attempt}/${maxRetries}):`, error);
        if (attempt === maxRetries) {
          throw error;
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }, [initializeSpecialtyContext]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Initialize on mount and when location changes
  useEffect(() => {
    initializeSpecialtyContext();
  }, [initializeSpecialtyContext]);

  // Memoized specialty routes for performance
  const memoizedSpecialtyRoutes = useMemo(() => {
    const cachedData = specialtyCache.getSpecialtyData();
    return updateSpecialtyRoutes(
      state.availableSpecialties,
      cachedData?.specialtyCounts || {},
      getCurrentSpecialtySlug
    );
  }, [state.availableSpecialties, getCurrentSpecialtySlug, updateSpecialtyRoutes]);

  // Update current specialty when location changes (optimized)
  useEffect(() => {
    const currentSlug = getCurrentSpecialtySlug;
    
    if (currentSlug !== state.currentSpecialtySlug) {
      const matchingSpecialty = state.availableSpecialties.find(
        specialty => getCachedSpecialtySlug(specialty) === currentSlug
      );
      
      setState(prev => ({
        ...prev,
        currentSpecialty: matchingSpecialty || null,
        currentSpecialtySlug: currentSlug,
        specialtyRoutes: memoizedSpecialtyRoutes,
      }));
    }
  }, [debouncedLocation, state.currentSpecialtySlug, state.availableSpecialties, getCurrentSpecialtySlug, memoizedSpecialtyRoutes]);

  return {
    // State
    currentSpecialty: state.currentSpecialty,
    currentSpecialtySlug: state.currentSpecialtySlug,
    availableSpecialties: state.availableSpecialties,
    specialtyRoutes: state.specialtyRoutes,
    loading: state.loading,
    error: state.error,

    // Actions
    navigateToSpecialty,
    navigateToSpecialtySlug,
    isValidSpecialty,
    isValidSpecialtySlug: isValidSpecialtySlugFn,
    getSpecialtyFromSlug,
    getSlugFromSpecialty,
    refreshSpecialties,
    forceRefreshSpecialties,
    clearError,
  };
};

export default useSpecialtyContext;