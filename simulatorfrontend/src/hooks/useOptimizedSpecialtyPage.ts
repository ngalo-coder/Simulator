/**
 * Optimized hook for specialty page to prevent unnecessary re-renders
 * Implements memoization and performance optimizations
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/apiService';
import { slugToSpecialty, isValidSpecialtySlug } from '../utils/urlUtils';
import { useNotification } from '../components/NotificationToast';
import { specialtyCache } from '../utils/specialtyCache';
import { trackPageLoad, trackApiCall, trackComponentRender } from '../utils/performanceMonitor';

interface Case {
  id: string;
  title: string;
  description: string;
  specialty?: string;
  patient_age?: number;
  patient_gender?: string;
  chief_complaint?: string;
}

interface CaseFilters {
  search: string;
  patient_age_min?: number;
  patient_age_max?: number;
  patient_gender?: string;
  page: number;
  limit: number;
}

interface CasesResponse {
  cases: Case[];
  currentPage: number;
  totalPages: number;
  totalCases: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface UseOptimizedSpecialtyPageReturn {
  // State
  cases: Case[];
  loading: boolean;
  error: string | null;
  specialtyName: string;
  filters: CaseFilters;
  casesResponse: CasesResponse;
  startingSimulation: boolean;
  
  // Actions
  handleFilterChange: (newFilters: Partial<CaseFilters>) => void;
  handlePageChange: (newPage: number) => void;
  clearAllFilters: () => void;
  hasActiveFilters: () => boolean;
  handleStartSimulation: (case_: Case) => Promise<void>;
  retryFetch: () => void;
}

/**
 * Optimized hook for specialty page functionality
 */
export const useOptimizedSpecialtyPage = (): UseOptimizedSpecialtyPageReturn => {
  const { specialty: specialtySlug } = useParams<{ specialty: string }>();
  const { addNotification } = useNotification();
  
  // Performance tracking
  const pageLoadEndRef = useRef<(() => void) | null>(null);
  
  // Refs to prevent unnecessary re-renders
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchParamsRef = useRef<string>('');
  
  // Track component renders
  useEffect(() => {
    trackComponentRender('SpecialtyPage');
  });
  
  // State
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingSimulation, setStartingSimulation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Memoized specialty name to prevent recalculation
  const specialtyName = useMemo(() => {
    if (!specialtySlug) return '';
    
    // Use cached conversion for better performance
    const cached = specialtyCache.getSpecialtyFromSlug(specialtySlug);
    return cached || slugToSpecialty(specialtySlug);
  }, [specialtySlug]);
  
  // Optimized filters state with memoization
  const [filters, setFilters] = useState<CaseFilters>({
    search: '',
    patient_age_min: undefined,
    patient_age_max: undefined,
    patient_gender: '',
    page: 1,
    limit: 12
  });
  
  const [casesResponse, setCasesResponse] = useState<CasesResponse>({
    cases: [],
    currentPage: 1,
    totalPages: 1,
    totalCases: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Memoized filter change handler to prevent re-renders
  const handleFilterChange = useCallback((newFilters: Partial<CaseFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset to first page when filters change
    }));
  }, []);

  // Memoized page change handler
  const handlePageChange = useCallback((newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  }, []);

  // Memoized clear filters function
  const clearAllFilters = useCallback(() => {
    setFilters({
      search: '',
      patient_age_min: undefined,
      patient_age_max: undefined,
      patient_gender: '',
      page: 1,
      limit: 12
    });
  }, []);

  // Memoized active filters check
  const hasActiveFilters = useCallback((): boolean => {
    return !!(filters.search || 
             filters.patient_age_min !== undefined || 
             filters.patient_age_max !== undefined || 
             filters.patient_gender);
  }, [filters.search, filters.patient_age_min, filters.patient_age_max, filters.patient_gender]);

  // Optimized fetch function with request deduplication
  const fetchSpecialtyCases = useCallback(async (showNotification: boolean = true) => {
    const endApiCall = trackApiCall('getCases');
    
    try {
      // Validate specialty slug
      if (!specialtySlug || !isValidSpecialtySlug(specialtySlug)) {
        setError('Invalid specialty URL');
        setLoading(false);
        endApiCall();
        return;
      }

      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setError(null);

      // Build comprehensive filter object
      const apiFilters = {
        specialty: specialtyName,
        search: filters.search,
        patient_age_min: filters.patient_age_min,
        patient_age_max: filters.patient_age_max,
        patient_gender: filters.patient_gender,
        page: filters.page,
        limit: filters.limit
      };

      // Create cache key for request deduplication
      const cacheKey = JSON.stringify(apiFilters);
      
      // Skip if same request is already in progress
      if (cacheKey === lastFetchParamsRef.current && loading) {
        return;
      }
      
      lastFetchParamsRef.current = cacheKey;

      // Remove undefined values
      const cleanFilters = Object.fromEntries(
        Object.entries(apiFilters).filter(([_, value]) => value !== undefined && value !== '')
      );

      const response = await api.getCases(cleanFilters);
      endApiCall();
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      if (response && response.cases && Array.isArray(response.cases)) {
        setCases(response.cases);
        setCasesResponse({
          cases: response.cases,
          currentPage: response.currentPage || filters.page,
          totalPages: response.totalPages || 1,
          totalCases: response.totalCases || response.cases.length,
          hasNextPage: response.hasNextPage || false,
          hasPrevPage: response.hasPrevPage || false
        });
      } else {
        setCases([]);
        setCasesResponse({
          cases: [],
          currentPage: 1,
          totalPages: 1,
          totalCases: 0,
          hasNextPage: false,
          hasPrevPage: false
        });
        setError('Invalid response format');
        if (showNotification) {
          addNotification('Received invalid data from server. Please try again.', 'error');
        }
      }
    } catch (error) {
      endApiCall();
      
      // Don't show error if request was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      
      console.error('Error fetching specialty cases:', error);
      setError('Failed to load cases');
      setCases([]);
      setCasesResponse({
        cases: [],
        currentPage: 1,
        totalPages: 1,
        totalCases: 0,
        hasNextPage: false,
        hasPrevPage: false
      });
      
      if (showNotification) {
        addNotification('Failed to load cases. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
      
      // End page load tracking on first successful load
      if (pageLoadEndRef.current) {
        pageLoadEndRef.current();
        pageLoadEndRef.current = null;
      }
    }
  }, [specialtySlug, specialtyName, filters, loading, addNotification]);

  // Optimized simulation start handler
  const handleStartSimulation = useCallback(async (case_: Case) => {
    try {
      setStartingSimulation(true);
      const response = await api.startSimulation(case_.id);
      
      // Handle navigation logic here or return response for parent to handle
      addNotification(`Starting simulation for "${case_.title}"`, 'success');
      
      return response;
    } catch (error) {
      console.error('Error starting simulation:', error);
      addNotification('Failed to start simulation. Please try again.', 'error');
      throw error;
    } finally {
      setStartingSimulation(false);
    }
  }, [addNotification]);

  // Retry function
  const retryFetch = useCallback(() => {
    fetchSpecialtyCases(true);
  }, [fetchSpecialtyCases]);

  // Effect for initial load and filter changes
  useEffect(() => {
    // Start page load tracking
    if (!pageLoadEndRef.current) {
      pageLoadEndRef.current = trackPageLoad(`specialty_${specialtyName}`);
    }
    
    fetchSpecialtyCases();
  }, [specialtySlug, specialtyName]);

  // Effect for filter changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        fetchSpecialtyCases(false);
      }
    }, 300); // 300ms debounce for filter changes

    return () => clearTimeout(timer);
  }, [filters, fetchSpecialtyCases, loading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // State
    cases,
    loading,
    error,
    specialtyName,
    filters,
    casesResponse,
    startingSimulation,
    
    // Actions
    handleFilterChange,
    handlePageChange,
    clearAllFilters,
    hasActiveFilters,
    handleStartSimulation,
    retryFetch,
  };
};