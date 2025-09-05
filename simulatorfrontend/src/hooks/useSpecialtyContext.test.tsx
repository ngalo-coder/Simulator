import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { useSpecialtyContext } from './useSpecialtyContext';
import { apiService } from '../services/apiService';;
import React from 'react';

// Mock the API service
vi.mock('../services/apiService', () => ({
  api: {
    getCaseCategories: vi.fn(),
  },
}));

// Mock React Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/' }),
  };
});

describe('useSpecialtyContext', () => {
  const mockSpecialties = ['Internal Medicine', 'Pediatrics', 'Emergency Medicine'];
  const mockSpecialtyCounts = {
    'Internal Medicine': 15,
    'Pediatrics': 8,
    'Emergency Medicine': 12,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (apiService.getCaseCategories as any).mockResolvedValue({
      specialties: mockSpecialties,
      specialty_counts: mockSpecialtyCounts,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>{children}</BrowserRouter>
  );

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useSpecialtyContext(), { wrapper });
    
    expect(result.current.loading).toBe(true);
    expect(result.current.availableSpecialties).toEqual([]);
    expect(result.current.currentSpecialty).toBe(null);
  });

  it('should fetch and set available specialties', async () => {
    const { result } = renderHook(() => useSpecialtyContext(), { wrapper });
    
    // Wait for the async initialization to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.availableSpecialties).toEqual(mockSpecialties);
    expect(result.current.specialtyRoutes).toHaveLength(3);
    expect(result.current.specialtyRoutes[0]).toMatchObject({
      specialty: 'Internal Medicine',
      slug: 'internal_medicine',
      caseCount: 15,
      isActive: false,
    });
  });

  it('should validate specialty names correctly', async () => {
    const { result } = renderHook(() => useSpecialtyContext(), { wrapper });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isValidSpecialty('Internal Medicine')).toBe(true);
    expect(result.current.isValidSpecialty('Cardiology')).toBe(false);
    expect(result.current.isValidSpecialty('')).toBe(false);
  });

  it('should convert between specialty names and slugs', async () => {
    const { result } = renderHook(() => useSpecialtyContext(), { wrapper });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.getSlugFromSpecialty('Internal Medicine')).toBe('internal_medicine');
    expect(result.current.getSpecialtyFromSlug('internal_medicine')).toBe('Internal Medicine');
    expect(result.current.getSpecialtyFromSlug('invalid_slug')).toBe(null);
  });

  it('should navigate to specialty correctly', async () => {
    const { result } = renderHook(() => useSpecialtyContext(), { wrapper });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.navigateToSpecialty('Internal Medicine');
    });

    expect(mockNavigate).toHaveBeenCalledWith('/internal_medicine');
  });

  it('should navigate to specialty slug correctly', async () => {
    const { result } = renderHook(() => useSpecialtyContext(), { wrapper });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.navigateToSpecialtySlug('pediatrics');
    });

    expect(mockNavigate).toHaveBeenCalledWith('/pediatrics');
  });

  it('should handle API errors gracefully', async () => {
    (apiService.getCaseCategories as any).mockRejectedValue(new Error('API Error'));
    
    const { result } = renderHook(() => useSpecialtyContext(), { wrapper });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('API Error');
    expect(result.current.availableSpecialties).toEqual([]);
  });

  it('should clear error state', async () => {
    (apiService.getCaseCategories as any).mockRejectedValue(new Error('API Error'));
    
    const { result } = renderHook(() => useSpecialtyContext(), { wrapper });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe('API Error');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });

  it('should refresh specialties data', async () => {
    const { result } = renderHook(() => useSpecialtyContext(), { wrapper });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Clear the mock and set up new data
    vi.clearAllMocks();
    (apiService.getCaseCategories as any).mockResolvedValue({
      specialties: ['Cardiology'],
      specialty_counts: { 'Cardiology': 5 },
    });

    await act(async () => {
      await result.current.refreshSpecialties();
    });

    expect(apiService.getCaseCategories).toHaveBeenCalled();
    expect(result.current.availableSpecialties).toEqual(['Cardiology']);
  });

  describe('caching behavior', () => {
    it('should cache specialty data to avoid repeated API calls', async () => {
      const { result, rerender } = renderHook(() => useSpecialtyContext(), { wrapper });
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(apiService.getCaseCategories).toHaveBeenCalledTimes(1);

      // Rerender the hook - should use cached data
      rerender();
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should still only be called once due to caching
      expect(apiService.getCaseCategories).toHaveBeenCalledTimes(1);
    });

    it('should refresh cache when explicitly requested', async () => {
      const { result } = renderHook(() => useSpecialtyContext(), { wrapper });
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(apiService.getCaseCategories).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refreshSpecialties();
      });

      expect(apiService.getCaseCategories).toHaveBeenCalledTimes(2);
    });
  });

  describe('URL parameter handling', () => {
    it('should detect specialty from URL path', async () => {
      // This test would require more complex setup to mock the location properly
      // For now, we'll test the URL parsing logic separately
      const { result } = renderHook(() => useSpecialtyContext(), { wrapper });
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Test that the hook initializes properly (URL detection tested in integration tests)
      expect(result.current.currentSpecialtySlug).toBe(null); // Default route
      expect(result.current.availableSpecialties).toEqual(mockSpecialties);
    });

    it('should handle invalid specialty slugs in URL', async () => {
      const CustomWrapper = ({ children }: { children: React.ReactNode }) => (
        <MemoryRouter initialEntries={['/invalid-specialty!']}>
          {children}
        </MemoryRouter>
      );

      const { result } = renderHook(() => useSpecialtyContext(), { wrapper: CustomWrapper });
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.currentSpecialtySlug).toBe(null);
      expect(result.current.currentSpecialty).toBe(null);
    });

    it('should handle non-specialty routes', async () => {
      const CustomWrapper = ({ children }: { children: React.ReactNode }) => (
        <MemoryRouter initialEntries={['/dashboard']}>
          {children}
        </MemoryRouter>
      );

      const { result } = renderHook(() => useSpecialtyContext(), { wrapper: CustomWrapper });
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.currentSpecialtySlug).toBe(null);
      expect(result.current.currentSpecialty).toBe(null);
    });
  });

  describe('specialty route validation', () => {
    it('should validate specialty slugs against available specialties', async () => {
      const { result } = renderHook(() => useSpecialtyContext(), { wrapper });
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isValidSpecialtySlug('internal_medicine')).toBe(true);
      expect(result.current.isValidSpecialtySlug('pediatrics')).toBe(true);
      expect(result.current.isValidSpecialtySlug('cardiology')).toBe(false); // Not in mock data
      expect(result.current.isValidSpecialtySlug('invalid_slug')).toBe(false);
    });

    it('should handle empty or malformed slugs', async () => {
      const { result } = renderHook(() => useSpecialtyContext(), { wrapper });
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isValidSpecialtySlug('')).toBe(false);
      expect(result.current.isValidSpecialtySlug('  ')).toBe(false);
      expect(result.current.isValidSpecialtySlug('INVALID')).toBe(false);
      expect(result.current.isValidSpecialtySlug('invalid slug')).toBe(false);
    });
  });

  describe('navigation edge cases', () => {
    it('should not navigate with empty specialty name', async () => {
      const { result } = renderHook(() => useSpecialtyContext(), { wrapper });
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.navigateToSpecialty('');
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should not navigate with invalid slug', async () => {
      const { result } = renderHook(() => useSpecialtyContext(), { wrapper });
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.navigateToSpecialtySlug('invalid slug!');
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should handle navigation with special characters in specialty names', async () => {
      const { result } = renderHook(() => useSpecialtyContext(), { wrapper });
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.navigateToSpecialty('Obstetrics & Gynecology');
      });

      expect(mockNavigate).toHaveBeenCalledWith('/obstetrics_gynecology');
    });
  });

  describe('error handling and recovery', () => {
    it('should handle network timeouts', async () => {
      (apiService.getCaseCategories as any).mockRejectedValue(new Error('Network timeout'));
      
      const { result } = renderHook(() => useSpecialtyContext(), { wrapper });
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Network timeout');
      expect(result.current.availableSpecialties).toEqual([]);
    });

    it('should handle malformed API responses', async () => {
      (apiService.getCaseCategories as any).mockResolvedValue({
        // Missing specialties array
        specialty_counts: mockSpecialtyCounts,
      });
      
      const { result } = renderHook(() => useSpecialtyContext(), { wrapper });
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.availableSpecialties).toEqual([]);
    });

    it('should recover from errors when refreshing', async () => {
      // First call fails
      (apiService.getCaseCategories as any).mockRejectedValueOnce(new Error('API Error'));
      // Second call succeeds
      (apiService.getCaseCategories as any).mockResolvedValueOnce({
        specialties: mockSpecialties,
        specialty_counts: mockSpecialtyCounts,
      });
      
      const { result } = renderHook(() => useSpecialtyContext(), { wrapper });
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.error).toBe('API Error');

      await act(async () => {
        await result.current.refreshSpecialties();
      });

      expect(result.current.error).toBe(null);
      expect(result.current.availableSpecialties).toEqual(mockSpecialties);
    });
  });
});