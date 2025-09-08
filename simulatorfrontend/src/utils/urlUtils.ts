/**
 * URL utility functions for specialty-slug conversion
 * Handles conversion between specialty names and URL-safe slugs
 */

/**
 * Converts a specialty name to a URL-safe slug
 * @param specialty - The specialty name (e.g., "Internal Medicine")
 * @returns URL-safe slug (e.g., "internal_medicine")
 */
export function specialtyToSlug(specialty: string): string {
  if (!specialty || typeof specialty !== 'string') {
    return '';
  }

  return specialty
    .trim()
    .toLowerCase()
    // Replace spaces and common separators with underscores
    .replace(/[\s\/&,]+/g, '_')
    // Remove special characters except underscores and hyphens
    .replace(/[^a-z0-9_-]/g, '')
    // Remove multiple consecutive underscores
    .replace(/_+/g, '_')
    // Remove leading/trailing underscores
    .replace(/^_+|_+$/g, '');
}

/**
 * Converts a URL slug back to a specialty name
 * @param slug - The URL slug (e.g., "internal_medicine")
 * @returns Specialty name (e.g., "Internal Medicine")
 */
export function slugToSpecialty(slug: string): string {
  if (!slug || typeof slug !== 'string') {
    return '';
  }

  return slug
    .trim()
    // Replace underscores and hyphens with spaces
    .replace(/[_-]/g, ' ')
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    // Capitalize each word
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

/**
 * Validates if a slug could be a valid specialty slug
 * @param slug - The URL slug to validate
 * @returns True if the slug appears to be valid
 */
export function isValidSpecialtySlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false;
  }

  const trimmedSlug = slug.trim();
  
  // Check if slug is empty after trimming
  if (!trimmedSlug) {
    return false;
  }

  // Check if slug contains only valid characters (lowercase letters, numbers, underscores, hyphens)
  const validSlugPattern = /^[a-z0-9_-]+$/;
  if (!validSlugPattern.test(trimmedSlug)) {
    return false;
  }

  // Check if slug doesn't start or end with underscore/hyphen
  if (/^[_-]|[_-]$/.test(trimmedSlug)) {
    return false;
  }

  // Check if slug doesn't have consecutive underscores/hyphens
  if (/[_-]{2,}/.test(trimmedSlug)) {
    return false;
  }

  return true;
}

/**
 * Normalizes a specialty slug to ensure consistency
 * @param slug - The slug to normalize
 * @returns Normalized slug
 */
export function normalizeSpecialtySlug(slug: string): string {
  if (!slug || typeof slug !== 'string') {
    return '';
  }

  return slug
    .trim()
    .toLowerCase()
    // Replace multiple consecutive underscores/hyphens with single underscore
    .replace(/[_-]+/g, '_')
    // Remove leading/trailing underscores
    .replace(/^_+|_+$/g, '');
}

/**
 * URL redirection and consistency utilities for simulation routing
 * Requirements: 1.2, 4.1, 4.2, 4.4
 */

/**
 * Creates a consistent simulation URL with session ID
 * @param caseId - The case identifier
 * @param sessionId - The session identifier
 * @returns Consistent simulation URL
 */
export function createSimulationSessionUrl(caseId: string, sessionId: string): string {
  if (!caseId || !sessionId) {
    throw new Error('Both caseId and sessionId are required for session URL');
  }
  return `/simulation/${caseId}/session/${sessionId}`;
}

/**
 * Creates a case-only simulation URL for bookmarking
 * @param caseId - The case identifier
 * @returns Case-only simulation URL
 */
export function createSimulationCaseUrl(caseId: string): string {
  if (!caseId) {
    throw new Error('caseId is required for case URL');
  }
  return `/simulation/${caseId}`;
}

/**
 * Extracts case and session IDs from simulation URLs
 * @param url - The simulation URL to parse
 * @returns Object containing caseId and sessionId (if present)
 */
export function parseSimulationUrl(url: string): { caseId?: string; sessionId?: string; isValid: boolean } {
  if (!url || typeof url !== 'string') {
    return { isValid: false };
  }

  // Remove query parameters and hash
  const cleanUrl = url.split('?')[0].split('#')[0];
  
  // Match case-only pattern: /simulation/{caseId}
  const caseOnlyMatch = cleanUrl.match(/^\/simulation\/([^\/]+)$/);
  if (caseOnlyMatch) {
    return {
      caseId: caseOnlyMatch[1],
      isValid: true
    };
  }

  // Match case-with-session pattern: /simulation/{caseId}/session/{sessionId}
  const sessionMatch = cleanUrl.match(/^\/simulation\/([^\/]+)\/session\/([^\/]+)$/);
  if (sessionMatch) {
    return {
      caseId: sessionMatch[1],
      sessionId: sessionMatch[2],
      isValid: true
    };
  }

  return { isValid: false };
}

/**
 * Creates specialty context for navigation state preservation
 * @param specialty - The specialty name
 * @param returnUrl - The URL to return to
 * @returns Specialty context object
 */
export function createSpecialtyContext(specialty?: string, returnUrl?: string) {
  if (!specialty && !returnUrl) {
    return null;
  }

  return {
    specialty: specialty || null,
    specialtySlug: specialty ? specialtyToSlug(specialty) : null,
    returnUrl: returnUrl || (specialty ? `/${specialtyToSlug(specialty)}` : '/simulation')
  };
}

/**
 * Preserves specialty context during navigation
 * @param currentState - Current navigation state
 * @param additionalData - Additional data to include in state
 * @returns Enhanced navigation state with preserved specialty context
 */
export function preserveSpecialtyContext(currentState: any, additionalData: any = {}) {
  return {
    ...currentState,
    ...additionalData,
    specialtyContext: currentState?.specialtyContext || null,
    preservedAt: new Date().toISOString()
  };
}

/**
 * Validates if a URL is a valid simulation URL
 * @param url - The URL to validate
 * @returns True if the URL is a valid simulation URL
 */
export function isValidSimulationUrl(url: string): boolean {
  const parsed = parseSimulationUrl(url);
  return parsed.isValid && !!parsed.caseId;
}

/**
 * Updates browser history for bookmark compatibility
 * @param url - The URL to set
 * @param title - The page title
 * @param state - The history state
 */
export function updateBrowserHistoryForBookmarks(url: string, title: string, state: any = {}) {
  if (typeof window !== 'undefined' && window.history?.replaceState) {
    const enhancedState = {
      ...state,
      bookmarkCompatible: true,
      updatedAt: new Date().toISOString()
    };
    
    window.history.replaceState(enhancedState, title, url);
  }
}