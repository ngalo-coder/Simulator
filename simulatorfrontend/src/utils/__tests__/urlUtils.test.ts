/**
 * Tests for URL redirection and consistency utilities
 * Requirements: 1.2, 4.1, 4.2, 4.4
 */

import {
  createSimulationSessionUrl,
  createSimulationCaseUrl,
  parseSimulationUrl,
  createSpecialtyContext,
  preserveSpecialtyContext,
  isValidSimulationUrl,
  specialtyToSlug,
  slugToSpecialty
} from '../urlUtils';

describe('URL Redirection and Consistency Utilities', () => {
  describe('createSimulationSessionUrl', () => {
    it('should create correct session URL', () => {
      const result = createSimulationSessionUrl('VP-OPTH-001', 'session-123');
      expect(result).toBe('/simulation/VP-OPTH-001/session/session-123');
    });

    it('should throw error for missing parameters', () => {
      expect(() => createSimulationSessionUrl('', 'session-123')).toThrow();
      expect(() => createSimulationSessionUrl('VP-OPTH-001', '')).toThrow();
    });
  });

  describe('createSimulationCaseUrl', () => {
    it('should create correct case URL', () => {
      const result = createSimulationCaseUrl('VP-OPTH-001');
      expect(result).toBe('/simulation/VP-OPTH-001');
    });

    it('should throw error for missing caseId', () => {
      expect(() => createSimulationCaseUrl('')).toThrow();
    });
  });

  describe('parseSimulationUrl', () => {
    it('should parse case-only URL correctly', () => {
      const result = parseSimulationUrl('/simulation/VP-OPTH-001');
      expect(result).toEqual({
        caseId: 'VP-OPTH-001',
        isValid: true
      });
    });

    it('should parse session URL correctly', () => {
      const result = parseSimulationUrl('/simulation/VP-OPTH-001/session/session-123');
      expect(result).toEqual({
        caseId: 'VP-OPTH-001',
        sessionId: 'session-123',
        isValid: true
      });
    });

    it('should handle URLs with query parameters', () => {
      const result = parseSimulationUrl('/simulation/VP-OPTH-001?param=value#hash');
      expect(result).toEqual({
        caseId: 'VP-OPTH-001',
        isValid: true
      });
    });

    it('should return invalid for malformed URLs', () => {
      expect(parseSimulationUrl('/invalid/url')).toEqual({ isValid: false });
      expect(parseSimulationUrl('')).toEqual({ isValid: false });
      expect(parseSimulationUrl('/simulation/')).toEqual({ isValid: false });
    });
  });

  describe('createSpecialtyContext', () => {
    it('should create specialty context with both parameters', () => {
      const result = createSpecialtyContext('Internal Medicine', '/internal_medicine');
      expect(result).toEqual({
        specialty: 'Internal Medicine',
        specialtySlug: 'internal_medicine',
        returnUrl: '/internal_medicine'
      });
    });

    it('should create context with only specialty', () => {
      const result = createSpecialtyContext('Ophthalmology');
      expect(result).toEqual({
        specialty: 'Ophthalmology',
        specialtySlug: 'ophthalmology',
        returnUrl: '/ophthalmology'
      });
    });

    it('should return null for no parameters', () => {
      const result = createSpecialtyContext();
      expect(result).toBeNull();
    });
  });

  describe('preserveSpecialtyContext', () => {
    it('should preserve existing specialty context', () => {
      const currentState = {
        specialtyContext: {
          specialty: 'Cardiology',
          returnUrl: '/cardiology'
        }
      };
      
      const result = preserveSpecialtyContext(currentState, { newData: 'test' });
      
      expect(result.specialtyContext).toEqual(currentState.specialtyContext);
      expect(result.newData).toBe('test');
      expect(result.preservedAt).toBeDefined();
    });

    it('should handle missing specialty context', () => {
      const currentState = { someData: 'value' };
      const result = preserveSpecialtyContext(currentState);
      
      expect(result.specialtyContext).toBeNull();
      expect(result.someData).toBe('value');
    });
  });

  describe('isValidSimulationUrl', () => {
    it('should validate correct simulation URLs', () => {
      expect(isValidSimulationUrl('/simulation/VP-OPTH-001')).toBe(true);
      expect(isValidSimulationUrl('/simulation/VP-OPTH-001/session/123')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidSimulationUrl('/invalid/url')).toBe(false);
      expect(isValidSimulationUrl('/simulation/')).toBe(false);
      expect(isValidSimulationUrl('')).toBe(false);
    });
  });

  describe('Specialty slug conversion', () => {
    it('should convert specialty names to slugs', () => {
      expect(specialtyToSlug('Internal Medicine')).toBe('internal_medicine');
      expect(specialtyToSlug('Emergency Medicine')).toBe('emergency_medicine');
      expect(specialtyToSlug('Pediatrics & Neonatology')).toBe('pediatrics_neonatology');
    });

    it('should convert slugs back to specialty names', () => {
      expect(slugToSpecialty('internal_medicine')).toBe('Internal Medicine');
      expect(slugToSpecialty('emergency_medicine')).toBe('Emergency Medicine');
      expect(slugToSpecialty('pediatrics_neonatology')).toBe('Pediatrics Neonatology');
    });
  });
});