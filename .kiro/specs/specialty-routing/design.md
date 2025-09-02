# Design Document

## Overview

The specialty-specific routing system transforms the current generic case browsing experience into a specialty-focused navigation system. Users will be routed to URLs like `/internal_medicine` or `/pediatrics` that display only cases relevant to that specialty. The design leverages React Router's dynamic routing capabilities and the existing API filtering functionality to create a seamless, bookmarkable experience.

## Architecture

### URL Structure
- **Current:** `/simulation` (shows all cases)
- **New:** `/{specialty_slug}` (shows specialty-specific cases)
- **Examples:** `/internal_medicine`, `/pediatrics`, `/cardiology`, `/emergency_medicine`

### Route Mapping Strategy
The system will use a dynamic routing approach where specialty names from the API are converted to URL-safe slugs:
- Spaces → underscores: "Internal Medicine" → "internal_medicine"
- Special characters removed/encoded
- Case-insensitive matching for robustness

### Navigation Flow
```
Browse Cases → Explore Cases → View Cases
     ↓              ↓             ↓
Dashboard → Specialty Grid → /{specialty_slug}
```

## Components and Interfaces

### 1. Enhanced Router Configuration
**File:** `src/App.tsx`
- Add dynamic route: `<Route path="/:specialty" element={<SpecialtyCasePage />} />`
- Maintain existing routes for backward compatibility
- Add route guards for invalid specialties

### 2. New SpecialtyCasePage Component
**File:** `src/pages/SpecialtyCasePage.tsx`
- Extends existing case browsing functionality
- Extracts specialty from URL parameters
- Filters cases by specialty using existing API
- Displays specialty-specific header and breadcrumbs
- Handles empty states and error conditions

### 3. URL Utility Functions
**File:** `src/utils/urlUtils.ts`
```typescript
interface UrlUtils {
  specialtyToSlug(specialty: string): string;
  slugToSpecialty(slug: string): string;
  isValidSpecialtySlug(slug: string): boolean;
}
```

### 4. Enhanced Navigation Components
**Files:** 
- `src/pages/DashboardPage.tsx` - Update "View cases" links
- `src/pages/CaseBrowsingPage.tsx` - Add specialty context awareness
- `src/components/Navigation.tsx` - Add specialty breadcrumbs

### 5. Specialty Context Hook
**File:** `src/hooks/useSpecialtyContext.ts`
```typescript
interface SpecialtyContext {
  currentSpecialty: string | null;
  availableSpecialties: string[];
  navigateToSpecialty(specialty: string): void;
  isValidSpecialty(specialty: string): boolean;
}
```

## Data Models

### Specialty Route Data
```typescript
interface SpecialtyRoute {
  specialty: string;        // "Internal Medicine"
  slug: string;            // "internal_medicine"
  caseCount: number;       // Number of cases in specialty
  isActive: boolean;       // Currently selected specialty
}

interface SpecialtyPageData {
  specialty: string;
  cases: PatientCase[];
  totalCases: number;
  currentPage: number;
  totalPages: number;
}
```

### URL Parameter Interface
```typescript
interface SpecialtyParams {
  specialty: string;  // URL parameter from /:specialty route
}
```

## Error Handling

### Invalid Specialty Routes
- **Detection:** Check specialty slug against available specialties from API
- **Fallback:** Redirect to main case browsing page with error message
- **User Feedback:** Toast notification explaining the invalid specialty

### API Error Scenarios
- **Network Errors:** Show retry mechanism with cached specialty list
- **Empty Results:** Display encouraging message to check other specialties
- **Authentication Errors:** Redirect to login while preserving intended specialty URL

### URL Encoding Issues
- **Special Characters:** Sanitize and validate specialty names
- **Case Sensitivity:** Normalize to lowercase for URL matching
- **Invalid Characters:** Strip or encode problematic characters

## Testing Strategy

### Unit Tests
- URL utility functions (specialty ↔ slug conversion)
- Specialty context hook functionality
- Route parameter validation
- Error handling scenarios

### Integration Tests
- Navigation flow from dashboard to specialty pages
- API integration with specialty filtering
- Browser history and bookmarking functionality
- Cross-specialty navigation

### End-to-End Tests
- Complete user journey: Browse → Explore → View Cases
- Direct URL access to specialty pages
- Sharing and bookmarking specialty URLs
- Error scenarios (invalid specialties, network issues)

### Performance Considerations
- **Route Caching:** Cache specialty-to-slug mappings
- **API Optimization:** Reuse existing case filtering endpoints
- **Component Lazy Loading:** Load specialty pages on demand
- **State Management:** Minimize re-renders when switching specialties

## Implementation Phases

### Phase 1: Core Routing Infrastructure
- URL utility functions
- Dynamic route configuration
- Basic SpecialtyCasePage component

### Phase 2: Navigation Integration
- Update dashboard navigation links
- Implement specialty context hook
- Add breadcrumb navigation

### Phase 3: Enhanced User Experience
- Error handling and fallbacks
- Empty state designs
- Performance optimizations

### Phase 4: Testing and Polish
- Comprehensive test coverage
- Cross-browser compatibility
- Accessibility improvements