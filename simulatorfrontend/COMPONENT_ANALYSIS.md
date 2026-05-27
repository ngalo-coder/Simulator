# Components Analysis - SimulatorFrontend/src/components

## Executive Summary

The component directory contains 50+ files with varying levels of complexity and maturity. The codebase shows strong fundamentals with TypeScript, React hooks, and proper separation of concerns, but suffers from several patterns that create maintenance burden and potential performance issues. Key findings include significant code duplication, oversized components, inconsistent error handling, and scattered business logic.

---

## 1. MAJOR COMPONENT FILES & THEIR PURPOSE

### Admin Components (3 large files)

#### **AdminUserManagement.tsx** (~400+ lines)
- **Purpose**: Manage system users with CRUD operations, filtering, sorting, bulk actions
- **Key Features**:
  - Advanced filtering (search, role, status, discipline, email verified, date range)
  - Sorting on multiple columns
  - Pagination (20 users per page)
  - Bulk operations (status change, role promotion, deletion)
  - User statistics dashboard
  - 3 view modes: table, grid, analytics
- **State Complexity**: 14+ state variables managing filters, pagination, selection, UI modes
- **Key Issue**: Monolithic component doing too much

#### **AdminCaseManagement.tsx** (~200 lines)
- **Purpose**: Create, view, edit, delete medical cases
- **Key Features**:
  - Case CRUD operations
  - Filtering by specialty and program area
  - Pagination
  - Search functionality
- **Integration**: Embeds AdminCaseCreation modal

#### **AdminSpecialtyManagement.tsx** (~250 lines)
- **Purpose**: Configure specialty visibility and program area assignments
- **Key Features**:
  - Toggle specialty visibility
  - Assign specialties to program areas
  - Search and filter specialties
  - Bulk save operations
- **Data Flow**: Complex mapping between frontend specialty configs and backend IDs

#### **AdminAnalytics.tsx** (~150 lines)
- **Purpose**: Dashboard showing system performance and user analytics
- **Key Features**:
  - System statistics (users, cases, sessions)
  - Top performers list
  - Most active users by case count
  - Performance color coding

### Page Wrapper Components

#### **LazySpecialtyPage.tsx** (~50 lines, but optimized)
- **Purpose**: Lazy-load SpecialtyCasePage with Suspense fallback
- **Strengths**: Good code splitting implementation with skeleton loading
- **Pattern**: Proper use of React.lazy() and memo()

#### **SpecialtyRouteGuard.tsx** (~120 lines)
- **Purpose**: Validate specialty slug before rendering child components
- **Key Features**:
  - URL validation against available specialties
  - Error boundary integration
  - Detailed error messaging
  - Retry logic for network failures
- **Validation Flow**: Slug format check → API validation → show fallback if invalid

### Data Display Components

#### **ActivityTimeline.tsx** (~250 lines)
- **Purpose**: Display recent user activity with timeline visualization
- **Key Features**:
  - Status-based color coding (completed, in_progress, pending_feedback)
  - Duration and difficulty formatting
  - Feedback status display
  - Dark mode support
  - Motivational messaging
- **Props**: 6 configurable props for flexibility
- **Strengths**: Well-structured, reusable, good accessibility

#### **MilestoneTracker.tsx** (~200 lines)
- **Purpose**: Visualize learning goal progress with milestone tracking
- **Key Features**:
  - 5 color themes (medical, stable, warning, emergency, info)
  - Progress bars with milestone markers
  - Completion badges and rewards
  - Motivational progress messages
  - Summary statistics
- **Strengths**: Rich visual feedback, good UX patterns

#### **SkillBreakdown.tsx** (~150 lines)
- **Purpose**: Display competency scores across different medical skills
- **Key Features**:
  - Trend indicators (up/down/stable)
  - 4-tier competency levels (Novice→Expert)
  - Summary statistics
  - Grid layout with responsive design

#### **CaseCard.tsx** (~200+ lines)
- **Purpose**: Display individual case with metadata and action buttons
- **Key Features**:
  - Procedurally generated patient names
  - 14+ specialty-specific color themes
  - Completion status and best score tracking
  - Retake functionality
- **Issue**: Inline patient name generation is not reusable; specialty styling hardcoded

### Dialog/Modal Components

#### **FeedbackModal.tsx** (~250 lines)
- **Purpose**: Collect user feedback with rating and comments
- **Features**:
  - 5 feedback types (case, technical, UI/UX, medical accuracy, general)
  - Star rating (1-5)
  - Free-text comments
  - Metadata collection (URL, user agent, timestamp)
  - Success state management
- **Pattern**: Embedded form logic with API integration

#### **DataExportModal.tsx** (~150 lines)
- **Purpose**: Export user data in JSON/CSV/PDF formats
- **Features**:
  - 4 export types (all, progress, sessions, profile)
  - 3 format options
  - Blob-based download
  - Success state tracking
- **Issue**: Backend export endpoints may not be implemented

#### **RetakeModal.tsx** (retake/RetakeModal.tsx, ~200 lines)
- **Purpose**: Modal for students to retake a case with reason/improvement goals
- **Features**:
  - Reason input (required)
  - Multi-select improvement areas (7 options)
  - Loading state
  - Success callback

### Feature-Specific Components

#### **SessionManager.tsx** (~150 lines)
- **Purpose**: Monitor and warn about session expiration
- **Features**:
  - JWT token expiry parsing from localStorage
  - Warning notification (5 minutes before expiry)
  - Expiration modal with re-login prompt
  - 30-second check interval
- **Pattern**: Separate sub-components for warning and expired states
- **Issue**: Token parsing from localStorage is fragile; no refresh token logic

#### **PrivacySettings.tsx** (~120 lines estimated)
- **Purpose**: User privacy/consent management
- **Features**: Privacy toggle settings, cookie management

#### **Navbar.tsx** (~250 lines)
- **Purpose**: Main navigation header
- **Features**:
  - Logo and branding
  - Role-based nav items (admin-only routes)
  - Mobile menu toggle
  - Scroll-based styling changes
  - Theme toggle integration
  - Current specialty indicator
- **Pattern**: Good use of conditional rendering for role-based access

#### **ProtectedRoute.tsx** (~25 lines)
- **Purpose**: Route protection wrapper
- **Features**: Auth check, admin role check, loading state
- **Strengths**: Simple, focused, well-typed

### Error Handling Components

#### **ErrorBoundary.tsx** (~40 lines)
- **Purpose**: Catch React errors and display fallback UI
- **Strengths**: Dev-mode error details display
- **Limitation**: Class component (older React pattern)

#### **SpecialtyErrorBoundary.tsx** (~80 lines)
- **Purpose**: Specialty-specific error handling with retry
- **Features**:
  - Error type detection (ChunkLoadError, network, specialty-not-found)
  - Dev-mode error details panel
  - Graceful fallback to SpecialtyFallback component
- **Enhancement**: Better error categorization than base ErrorBoundary

### Utility/Helper Components

#### **BreadCrumb.tsx** (~50 lines)
- **Purpose**: Navigation breadcrumb trail
- **Features**: Dynamic route building from location

#### **ThemeToggle.tsx** (~40 lines)
- **Purpose**: Dark mode toggle
- **Features**: Theme persistence to localStorage

#### **LoadingSpinner.tsx** (~50 lines)
- **Purpose**: Animated loading indicator
- **Features**: Size variants (sm, md, lg), optional text

#### **SkeletonLoader.tsx** (~200+ lines)
- **Purpose**: Skeleton loading placeholders for various component shapes
- **Components**: SkeletonSpecialtyPage, SkeletonCaseCard, etc.
- **Issue**: Inline JSX duplicates visual structure; should be data-driven

#### **NotificationToast.tsx** (~150 lines)
- **Purpose**: Toast notifications with auto-dismiss
- **Features**: 4 types (success, error, warning, info), queue management
- **Pattern**: Context + hook provider pattern

#### **SpecialtyFallback.tsx** (~80 lines)
- **Purpose**: Fallback UI when specialty is invalid or unavailable
- **Features**: Error message display, retry button, navigation help

#### **SpecialtyNavigation.tsx** (~100 lines)
- **Purpose**: Specialty selection navigation with case count badges
- **Features**:
  - Show/hide toggle for >6 specialties
  - Active state highlighting
  - Case count badges
  - Loading state placeholder
- **Strengths**: Responsive, accessible

### UI Component Library (ui/ directory)

#### **Button.tsx** (~80 lines)
- **Purpose**: Reusable button component
- **Features**: 6 variants, 5 sizes, loading state, icons, full-width
- **Strengths**: Comprehensive, flexible

#### **Card.tsx** (~60 lines)
- **Purpose**: Container component
- **Features**: 3 variants (flat, elevated, outlined), shadow control

#### **Modal.tsx** (~150 lines)
- **Purpose**: Dialog/modal container
- **Features**:
  - 5 sizes (sm-full)
  - Escape key support
  - Focus management
  - Body scroll prevention
  - Overlay click handling
- **Strengths**: Proper accessibility and focus trapping

#### **Input.tsx** (~80 lines)
- **Purpose**: Text input field
- **Features**: 3 sizes, error state, label, icon support

#### **Alert.tsx** (~50 lines)
- **Purpose**: Alert/message box
- **Features**: 4 types (info, success, warning, error)

#### **Badge.tsx** (~50 lines)
- **Purpose**: Label badges
- **Features**: 5 variants, size control

#### **SearchAndFilter.tsx** (~200 lines)
- **Purpose**: Reusable search + filter UI
- **Features**: Search bar, dynamic filter sections, results count
- **Issue**: Prop-drilling pattern requires 10+ props

#### **EnhancedProgressBar.tsx** (~100 lines)
- **Purpose**: Progress bar with milestone markers
- **Features**: Customizable milestones, size variants, animations

#### **ProgressCard.tsx** (~80 lines)
- **Purpose**: Card displaying progress metric
- **Features**: Title, value, icon, status color

#### **EnhancedProgramCard.tsx** (~120 lines)
- **Purpose**: Card for displaying program/track information
- **Features**: Icon, description, metadata, links

#### **SpecialtyCard.tsx** (~100 lines)
- **Purpose**: Card for specialty selection
- **Features**: Icon, case count, description

#### **SpecialtyGrid.tsx** (~50 lines)
- **Purpose**: Grid layout for specialty cards
- **Features**: Responsive grid, loading states

#### **SpecialtySearchAndFilter.tsx** (~180 lines)
- **Purpose**: Specialty-specific search + filter
- **Issue**: Duplicate of SearchAndFilter with specialty variations

---

## 2. COMMON PATTERNS & ISSUES

### 2.1 State Management Anti-Patterns

#### **Scattered State Across Multiple useState() Hooks**
```tsx
// AdminUserManagement.tsx example - 14+ state variables
const [users, setUsers] = useState<User[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [selectedUser, setSelectedUser] = useState<User | null>(null);
const [showUserDetails, setShowUserDetails] = useState(false);
const [currentPage, setCurrentPage] = useState(1);
const [totalUsers, setTotalUsers] = useState(0);
const [totalPages, setTotalPages] = useState(0);
const [stats, setStats] = useState<UserStats | null>(null);
const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);
const [showBulkConfirm, setShowBulkConfirm] = useState(false);
const [viewMode, setViewMode] = useState<'table' | 'grid' | 'analytics'>('table');
const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ ... });
const [filters, setFilters] = useState<UserFilters>({ ... });
```

**Issues**:
- Hard to track related state updates
- High cognitive load
- Increased risk of inconsistent state
- Difficult to add new features without breaking state invariants

**Better Alternative**: Reduce state complexity
```tsx
interface AdminState {
  users: User[];
  loading: boolean;
  error: string | null;
  selectedUser: User | null;
  pagination: { page: number; total: number; pages: number };
  filters: UserFilters;
  viewMode: 'table' | 'grid' | 'analytics';
  // ... all related states
}

const [state, setState] = useState<AdminState>(initialState);
```

#### **Multiple Dependencies in useEffect**
```tsx
// SpecialtyNavigation.tsx
useEffect(() => {
  fetchUsers();
}, [currentPage, filters, sortConfig, limit]);

useEffect(() => {
  fetchUserStats();
}, [fetchUserStats]);
```

**Issues**: 
- Dependency array becomes unmanageable
- Performance implications with multiple fetches
- Risk of missing dependencies (ESLint warnings)

---

### 2.2 Code Duplication

#### **Duplicate Filter/Search Logic**
- `SearchAndFilter.tsx` vs `SpecialtySearchAndFilter.tsx` (~95% similar)
- Filter state management duplicated across AdminUserManagement, AdminCaseManagement, AdminSpecialtyManagement
- Color/status mapping functions repeated in multiple components

#### **Duplicate Error Handling Patterns**
```tsx
// Appears in: AdminUserManagement, AdminCaseManagement, AdminAnalytics, FeedbackModal
try {
  setLoading(true);
  setError(null);
  const response = await api.someMethod();
  setData(response);
} catch (error: any) {
  console.error('Error:', error);
  setError('Failed to load data. Please try again.');
} finally {
  setLoading(false);
}
```

**Better Pattern**: Extract to custom hook
```tsx
const useAsyncData = <T,>(fetcher: () => Promise<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetcher()
      .then(d => mounted && setData(d))
      .catch(e => mounted && setError(e.message))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);
  
  return { data, loading, error };
};
```

#### **Duplicate UI Color/Theme Logic**
- Specialty color themes hardcoded in CaseCard.tsx (14+ specialties)
- Status colors repeated in ActivityTimeline, MilestoneTracker, SkillBreakdown
- Should be centralized in theme/constants file

#### **Duplicate Modal Patterns**
- `FeedbackModal`, `DataExportModal`, `RetakeModal` all follow same basic pattern
- Modal wrapping, state management, form handling nearly identical

---

### 2.3 Inconsistent Error Handling

#### **Varied Error Messages**
- Some show generic "Failed to load data"
- Some parse error types (Session expired, 401, 403, etc.)
- Some use `error.message`, some just `error`
- Some log errors, some silent failures

#### **Silent Failures in Retake/Feedback Components**
```tsx
// RetakeModal.tsx - basic alert instead of proper error handling
} catch (error) {
  console.error('Error starting retake:', error);
  alert('Failed to start retake. Please try again.');
}
```

#### **Incomplete API Error Handling**
- FeedbackModal catches fetch errors but DataExportModal doesn't
- SessionManager parses JWT without try-catch on token operations

---

### 2.4 Type Safety Issues

#### **Any Types Used Throughout**
```tsx
// AdminCaseManagement.tsx
const [filterSpecialty, setFilterSpecialty] = useState<string>('');
// Should check if specialty is actually a string enum

// AdminSpecialtyManagement.tsx
const [visibilityMap, setVisibilityMap] = useState<Record<string, SpecialtyVisibility>>({});
// Later uses: visibilityMap[specialtyId] - could be undefined

// FeedbackModal.tsx
const handleSubmit = async (e: React.FormEvent) => {
  // ...
  catch (error) { // error should be typed as Error | unknown
```

#### **Missing Type Definitions**
- Component props sometimes use generic JSX.IntrinsicAttributes instead of strict types
- API response types inconsistent (sometimes wrapped in {data: ...}, sometimes direct)
- No strict null checks on optional properties before access

---

### 2.5 Performance Issues

#### **Inefficient Memoization**
```tsx
// SkillBreakdown.tsx - components not memoized but should be
const getTrendIcon = (trend?: ...) => { /* ... */ };
// Called in render without memoization, creates new objects each render
```

#### **Inline Functions in Renders**
```tsx
// Navbar.tsx - onClick handlers defined inline
{filteredNavigationItems.map((item) => (
  <Link
    key={item.name}
    to={item.href}
    // Inline function reference - will cause re-render even with memo
    onClick={() => setIsMobileMenuOpen(false)}
  >
```

#### **Missing useMemo/useCallback**
- `AdminUserManagement.filteredAndSortedUsers` uses useMemo (good!)
- But `AdminUserManagement.fetchUsers` uses useCallback while also being in useEffect dependency
- `SkillBreakdown` computes summary stats every render without memoization

#### **Large Components Re-render Unnecessarily**
- AdminUserManagement renders all 14+ state variables on ANY change
- SkeletonLoader re-creates animation on every parent re-render

#### **N+1 Query Patterns**
```tsx
// AdminUserManagement.tsx - bulk operations
await Promise.all(Array.from(selectedUsers).map(userId =>
  api.updateUserStatus(userId, { status })
));
// Should have batch endpoint instead
```

---

### 2.6 Inconsistent Naming Conventions

- Components: `AdminUserManagement`, `FeedbackModal`, `RetakeModal` (some use -Modal suffix, some don't)
- State setters: Sometimes `setLoading`, sometimes `loading` state pair
- Handler functions: `handleUserAction`, `handleSort`, `handleSubmit` vs `onRetakeSuccess`, `onClose`
- Type naming: `UserFilters` vs `FilterOption` vs `CaseData` (inconsistent pluralization/suffix)

---

## 3. REFACTORING OPPORTUNITIES

### 3.1 Extract Reusable Data Fetching Hook

**Current Problem**: 10+ components repeat fetch + error + loading pattern

**Opportunity**:
```tsx
// hooks/useDataFetch.ts
export const useDataFetch = <T, P extends Record<string, any> = {}>(
  fetcher: (params?: P) => Promise<T>,
  params?: P,
  options?: { autoFetch?: boolean; cacheKey?: string }
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetcher(params);
      setData(result);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [fetcher, params]);
  
  useEffect(() => {
    if (options?.autoFetch !== false) fetch();
  }, [fetch, options?.autoFetch]);
  
  return { data, loading, error, refetch: fetch };
};
```

**Impact**: Eliminate 150+ lines of duplicated fetch logic

---

### 3.2 Consolidate Color/Theme Configuration

**Current Problem**: 14+ specialty themes hardcoded in CaseCard.tsx, status colors scattered

**Opportunity**:
```tsx
// utils/themeConfig.ts
export const SPECIALTY_THEMES = {
  'internal_medicine': { bg: 'bg-blue-100', text: 'text-medical-800', icon: '🩺', gradient: 'from-medical-50 to-medical-100' },
  'cardiology': { bg: 'bg-red-100', text: 'text-red-800', icon: '❤️', gradient: 'from-red-50 to-red-100' },
  // ... all 14 specialties
} as const;

export const STATUS_COLORS = {
  completed: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
  in_progress: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
  // ... all statuses
} as const;

export const getSpecialtyTheme = (specialty: string) => SPECIALTY_THEMES[specialty as keyof typeof SPECIALTY_THEMES];
export const getStatusColor = (status: string) => STATUS_COLORS[status as keyof typeof STATUS_COLORS];
```

**Impact**: Single source of truth for themes, easier theming updates

---

### 3.3 Create Reusable Admin Table Component

**Current Problem**: AdminUserManagement, AdminCaseManagement, AdminSpecialtyManagement all implement similar table UX

**Opportunity**:
```tsx
// components/AdminTable.tsx
interface AdminTableProps<T> {
  columns: ColumnConfig<T>[];
  data: T[];
  loading: boolean;
  pagination: PaginationState;
  sorting: SortConfig;
  selection: Set<string>;
  onColumnSort: (column: string) => void;
  onSelectionChange: (id: string, selected: boolean) => void;
  onActionClick: (id: string, action: string) => void;
  actions: ActionConfig[];
}

export const AdminTable = <T extends { _id: string }>(props: AdminTableProps<T>) => {
  // Reusable implementation of sorting, pagination, selection, actions
};
```

**Impact**: DRY out admin components, easier maintenance

---

### 3.4 Extract Modal/Dialog Logic into Custom Hook

**Current Problem**: FeedbackModal, DataExportModal, RetakeModal all have similar state management

**Opportunity**:
```tsx
// hooks/useModal.ts
export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const open = () => { setIsOpen(true); setError(null); setSuccess(false); };
  const close = () => setIsOpen(false);
  const reset = () => { setIsOpen(false); setError(null); setSuccess(false); };
  
  return { isOpen, isLoading, error, success, open, close, reset, setIsLoading, setError, setSuccess };
};
```

**Usage**:
```tsx
const modal = useModal();
<Modal isOpen={modal.isOpen} onClose={modal.close}>...</Modal>
```

---

### 3.5 Consolidate SearchAndFilter Components

**Current Problem**: `SearchAndFilter.tsx` and `SpecialtySearchAndFilter.tsx` are 95% duplicate

**Opportunity**:
```tsx
// components/ui/SearchAndFilter.tsx - generalized
interface SearchAndFilterProps<T> {
  filters: T;
  onFiltersChange: (filters: T) => void;
  filterGroups: FilterGroupConfig[];
  searchPlaceholder?: string;
  // ...
}
```

**Impact**: Single maintainable component, less code

---

### 3.6 Extract Form Handling Logic

**Current Problem**: FeedbackModal and RetakeModal have similar form state management

**Opportunity**:
```tsx
// hooks/useForm.ts
export const useForm = <T extends Record<string, any>>(
  initialValues: T,
  onSubmit: (values: T) => Promise<void>
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (field: keyof T, value: any) => setValues(v => ({ ...v, [field]: value }));
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (e) {
      setErrors(parseErrors(e));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return { values, errors, isSubmitting, handleChange, handleSubmit, setValues };
};
```

---

### 3.7 Create Pagination Component

**Current Problem**: Pagination logic duplicated in AdminUserManagement, AdminCaseManagement, AdminSpecialtyManagement

**Opportunity**:
```tsx
// components/ui/Pagination.tsx
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ ... }) => {
  // Reusable pagination with controls
};
```

---

### 3.8 Migrate Session Management to useReducer

**Current Problem**: SessionManager manually parses JWT and manages multiple state flags

**Opportunity**:
```tsx
// hooks/useSessionExpiry.ts
type SessionState = 
  | { status: 'active'; expiresAt: number }
  | { status: 'warning'; minutesLeft: number }
  | { status: 'expired' };

type SessionAction = 
  | { type: 'SESSION_CHECKED'; expiresAt: number }
  | { type: 'SESSION_WARNING'; minutesLeft: number }
  | { type: 'SESSION_EXPIRED' };

const sessionReducer = (state: SessionState, action: SessionAction): SessionState => {
  // Cleaner, more predictable state transitions
};
```

---

### 3.9 Create ErrorBoundary Variants

**Current Problem**: ErrorBoundary and SpecialtyErrorBoundary both exist; pattern not reusable

**Opportunity**:
```tsx
// components/ErrorBoundary.tsx - generic
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}
```

---

### 3.10 Extract Inline Generators to Utilities

**Current Problem**: CaseCard.tsx has inline patient name generation logic

**Opportunity**:
```tsx
// utils/caseUtils.ts
export const generatePatientName = (gender: string): string => {
  const firstNames = { male: [...], female: [...] };
  const lastNames = [...];
  // ...
};

export const getSpecialtyTheme = (specialty: string) => {
  // Move from CaseCard hardcoded switch
};
```

---

## 4. ANTI-PATTERNS & TECHNICAL DEBT

### 4.1 **Prop Drilling in Admin Components**

**Example**: SearchAndFilter requires 10+ props
```tsx
<SearchAndFilter
  searchTerm={searchTerm}
  onSearchChange={onSearchChange}
  difficultyFilter={difficultyFilter}
  onDifficultyChange={onDifficultyChange}
  durationFilter={durationFilter}
  onDurationChange={onDurationChange}
  specialtyFilter={specialtyFilter}
  onSpecialtyChange={onSpecialtyChange}
  difficultyOptions={difficultyOptions}
  durationOptions={durationOptions}
  specialtyOptions={specialtyOptions}
  resultsCount={resultsCount}
  className={className}
/>
```

**Better**: Use single object
```tsx
<SearchAndFilter
  state={filterState}
  onChange={setFilterState}
  options={filterOptions}
/>
```

---

### 4.2 **Magic Strings Throughout Codebase**

- Specialty names as strings: `'internal_medicine'`, `'cardiology'`, etc.
- Status values: `'completed'`, `'in_progress'`, `'pending'`
- Role values: `'admin'`, `'educator'`, `'student'`

**Fix**: Use enums/constants
```tsx
enum SpecialtyType {
  InternalMedicine = 'internal_medicine',
  Cardiology = 'cardiology',
  // ...
}

enum UserRole {
  Admin = 'admin',
  Educator = 'educator',
  Student = 'student',
}
```

---

### 4.3 **Direct localStorage Access Without Abstraction**

**Found in**: SessionManager.tsx, useAuth.tsx, ThemeToggle.tsx
```tsx
const token = localStorage.getItem('authToken');
localStorage.setItem('currentUser', JSON.stringify(user));
```

**Issue**: No error handling, no abstraction layer

**Fix**:
```tsx
// utils/storage.ts
export const storage = {
  getToken: () => {
    try {
      return localStorage.getItem('authToken');
    } catch (e) {
      console.error('Storage access failed');
      return null;
    }
  },
  setUser: (user: User) => {
    try {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } catch (e) {
      console.error('Storage write failed');
    }
  },
  // ...
};
```

---

### 4.4 **Inconsistent API Response Handling**

**Multiple patterns observed**:
```tsx
// Pattern 1: Direct array
const response: CasesResponse = await api.getAdminCases(filters);
setCases(response.cases || []);

// Pattern 2: Wrapped in data
const categoriesData = rawCategories?.data || rawCategories;

// Pattern 3: Sometimes wrapped, sometimes not
if (response.ok) {
  const data = await response.json();
  // Unpredictable structure
}
```

**Fix**: Normalize API responses with a wrapper
```tsx
interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
  pagination?: PaginationInfo;
}

const api = {
  async getAdminCases(filters: any): Promise<ApiResponse<CaseData[]>> {
    // Always returns consistent structure
  }
};
```

---

### 4.5 **Scattered Validation Logic**

**Found in**: SpecialtyRouteGuard, FeedbackModal, RetakeModal
```tsx
// Each implements own validation
if (!specialty) return;
if (!isValidSpecialtySlug(specialty)) return;
if (!retakeReason.trim()) alert('...');
```

**Better**: Centralized validators
```tsx
// utils/validators.ts
export const validateSpecialtySlug = (slug: string): ValidationResult => {
  if (!slug) return { valid: false, error: 'Specialty required' };
  if (!isValidFormat(slug)) return { valid: false, error: 'Invalid format' };
  return { valid: true };
};
```

---

### 4.6 **Missing Accessibility Features**

- Some color-only status indicators (no text labels)
- Some modals don't trap focus properly
- ARIA labels missing in several places
- Keyboard navigation not always supported

---

### 4.7 **No Loading State for Long-Running Operations**

- AdminUserManagement bulk operations don't show progress
- API calls can take several seconds without feedback
- No cancellation tokens for aborted requests

---

### 4.8 **Hardcoded Configuration Values**

```tsx
// AdminUserManagement.tsx
const limit = 20;

// SessionManager.tsx
const interval = setInterval(checkSession, 30000);

// Navbar.tsx scroll trigger
if (window.scrollY > 10)
```

**Fix**: Config file
```tsx
// config/app.ts
export const APP_CONFIG = {
  ADMIN_PAGE_SIZE: 20,
  SESSION_CHECK_INTERVAL: 30000,
  NAVBAR_SCROLL_THRESHOLD: 10,
};
```

---

## 5. OVERSIZED & COMPLEX COMPONENTS

### 5.1 **AdminUserManagement.tsx** (~400+ lines) ⚠️ CRITICAL

**Complexity**: 14+ state variables, 3 view modes, bulk operations, filtering, sorting, pagination

**Refactor Approach**:
```
AdminUserManagement
├── UserTable (extracted table view)
├── UserGrid (extracted grid view)
├── UserAnalytics (extracted analytics view)
├── UserFilters (extracted filter panel)
├── BulkActions (extracted bulk operation UI)
└── UserStatsCard (extracted stats display)
```

**Extract to**:
- `UserManagementContainer.tsx` (state orchestration)
- `UserTable.tsx` (table view, 60-80 lines)
- `UserAnalyticsView.tsx` (analytics view, 80-100 lines)
- `UserFiltersPanel.tsx` (filter controls, 60-80 lines)
- `BulkActionBar.tsx` (bulk operations, 40-60 lines)

**Estimated Lines After Refactor**: 5-6 focused files of 60-100 lines each vs 1 file of 400 lines

---

### 5.2 **CaseCard.tsx** (~250+ lines) ⚠️ HIGH

**Issues**:
- 14+ specialty themes hardcoded inline
- Patient name generation logic embedded
- Multiple conditional render branches
- Complex card layout with many sub-sections

**Extract to**:
- `CaseCardHeader.tsx` (title, specialty, patient info)
- `CaseCardMetadata.tsx` (age, gender, chief complaint, duration, difficulty)
- `CaseCardActions.tsx` (start, retake buttons)
- `utils/specialtyThemes.ts` (all theme data)
- `utils/patientNameGenerator.ts` (name generation)

**Estimated Lines After Refactor**: 80-100 lines + utility files

---

### 5.3 **FeedbackModal.tsx** (~250 lines) ⚠️ HIGH

**Issues**:
- Form logic + API integration + UI rendering combined
- Default feedback types hardcoded inline
- Multiple state transitions (loading, success, error)

**Extract to**:
- `useFeedbackForm.ts` (form state + submission logic)
- `FeedbackTypeSelector.tsx` (type selection UI)
- `FeedbackRating.tsx` (star rating component)
- `utils/feedbackConfig.ts` (feedback types definition)

**Estimated Lines After Refactor**: 120-150 lines

---

### 5.4 **AdminSpecialtyManagement.tsx** (~250 lines) ⚠️ HIGH

**Issues**:
- Complex visibility mapping logic
- Frontend-to-backend ID normalization mixed with UI
- Multiple filter states

**Extract to**:
- `SpecialtyVisibilityToggle.tsx` (toggle UI)
- `SpecialtyProgramAssignment.tsx` (program area select)
- `useSpecialtyVisibility.ts` (data fetching + mapping)
- `SpecialtyFilters.tsx` (filter controls)

---

### 5.5 **Navbar.tsx** (~250 lines) ⚠️ MEDIUM

**Issues**:
- Navigation items definition inline
- Mobile menu logic mixed with desktop nav
- Theme toggle integrated

**Extract to**:
- `DesktopNav.tsx` (desktop navigation)
- `MobileNav.tsx` (mobile menu)
- `NavLogo.tsx` (logo section)
- `navConfig.ts` (navigation items)

---

### 5.6 **SkeletonLoader.tsx** (~200+ lines) ⚠️ MEDIUM

**Issues**:
- All skeleton variants defined in single file
- JSX structure duplicates component shapes
- Should be data-driven

**Extract to**:
```
SkeletonLoader/
├── SkeletonSpecialtyPage.tsx
├── SkeletonCaseCard.tsx
├── SkeletonActivityTimeline.tsx
├── utils.ts (shared skeleton helpers)
└── index.ts
```

---

### 5.7 **SkillBreakdown.tsx** (~150 lines) ⚠️ MEDIUM

**Issues**:
- Calculation functions (getTrendIcon, getTrendText) should be extracted
- Summary stats calculation not memoized
- Multiple grid layouts

**Extract to**:
- `SkillCard.tsx` (individual skill display)
- `SkillSummary.tsx` (summary section)
- `utils/skillCalculations.ts`

---

### Complexity Breakdown by Lines:

| Component | Lines | Complexity | Priority |
|-----------|-------|-----------|----------|
| AdminUserManagement.tsx | 400+ | 🔴 CRITICAL | 1 |
| CaseCard.tsx | 250+ | 🔴 HIGH | 2 |
| FeedbackModal.tsx | 250 | 🔴 HIGH | 3 |
| AdminSpecialtyManagement.tsx | 250 | 🔴 HIGH | 4 |
| Navbar.tsx | 250 | 🟡 MEDIUM | 5 |
| SkeletonLoader.tsx | 200+ | 🟡 MEDIUM | 6 |
| SkillBreakdown.tsx | 150 | 🟡 MEDIUM | 7 |
| AdminCaseManagement.tsx | 200 | 🟡 MEDIUM | 8 |
| RetakeModal.tsx | 200 | 🟡 MEDIUM | 9 |
| ActivityTimeline.tsx | 250 | 🟢 GOOD | - |
| MilestoneTracker.tsx | 200 | 🟢 GOOD | - |

---

## 6. RECOMMENDED REFACTORING ROADMAP

### Phase 1: Foundation (Weeks 1-2)
1. **Create utility modules** for reusable logic
   - `utils/themeConfig.ts` - All theme/color definitions
   - `utils/validators.ts` - Validation functions
   - `utils/storage.ts` - localStorage abstraction
   - `utils/caseUtils.ts` - Case-related helpers
   - `config/app.ts` - Configuration constants

2. **Create custom hooks** for common patterns
   - `hooks/useAsyncData.ts` - Data fetching
   - `hooks/useForm.ts` - Form handling
   - `hooks/useModal.ts` - Modal state
   - `hooks/useSessionExpiry.ts` - Session management

3. **Create reusable components**
   - `components/ui/Pagination.tsx`
   - `components/AdminTable.tsx`

**Impact**: Removes 200+ lines of duplication, foundation for Phase 2

---

### Phase 2: Admin Components (Weeks 3-4)
1. Refactor `AdminUserManagement.tsx` using AdminTable + extracted views
2. Refactor `AdminCaseManagement.tsx` similarly
3. Consolidate `SearchAndFilter.tsx` and `SpecialtySearchAndFilter.tsx`
4. Extract `AdminSpecialtyManagement.tsx` views

**Impact**: 3 files of 400 lines each → 12 files of 60-100 lines each

---

### Phase 3: Modal/Dialog Components (Week 5)
1. Extract form logic from `FeedbackModal`, `RetakeModal`, `AdminCaseCreation`
2. Create `ModalBase.tsx` for common modal patterns
3. Consolidate modal error handling

**Impact**: Reduces state management complexity by 30%

---

### Phase 4: UI Polish (Week 6)
1. Break down `Navbar.tsx`, `SkeletonLoader.tsx`, `CaseCard.tsx`
2. Improve data-driven design (especially SkeletonLoader)
3. Add missing accessibility features

**Impact**: Better maintainability, improved a11y, better mobile UX

---

### Phase 5: Type Safety (Week 7)
1. Replace all `any` types with proper definitions
2. Create typed API response wrappers
3. Add strict null checks where needed
4. Create enums for magic strings

**Impact**: Catch bugs early, better IDE support, improved DX

---

## 7. PERFORMANCE OPTIMIZATION OPPORTUNITIES

### Low Hanging Fruit (Quick Wins)

1. **Memoize expensive calculations**
   - SkillBreakdown summary stats
   - ActivityTimeline formatting functions
   - Component render in grid layouts

2. **Use useCallback for event handlers**
   - Navbar navigation item handlers
   - Modal close handlers
   - Form submit handlers

3. **Lazy load admin components**
   ```tsx
   const AdminUserManagement = lazy(() => import('./AdminUserManagement'));
   const AdminCaseManagement = lazy(() => import('./AdminCaseManagement'));
   ```

4. **Extract inline filtering**
   - CaseCard filtering logic repeated 250+ lines
   - Move to useMemo with dependency array

### Medium Complexity

5. **Implement virtualization for large lists**
   - Admin tables with 100+ rows
   - Use react-window or react-virtualized

6. **Add request deduplication**
   - Multiple fetches for same data
   - Use AbortController + request cache

7. **Implement request batching**
   - Bulk user updates currently N requests
   - Add batch API endpoints

### Data Structure Optimization

8. **Replace Set<string> with Map for selections**
   - Faster lookups in large datasets
   - Better performance for bulk operations

9. **Normalize nested data structures**
   - Flatten deeply nested objects for easier updates
   - Consider normalized state shape

---

## SUMMARY & KEY METRICS

| Metric | Current | Target After Refactor |
|--------|---------|----------------------|
| **Largest Component** | 400+ lines | <150 lines |
| **Code Duplication** | ~300 lines | ~50 lines |
| **Components > 200 lines** | 7 | 0 |
| **useState Calls (max/component)** | 14 | <8 |
| **useEffect Dependencies (max)** | 8+ | <4 |
| **Custom Hooks** | 3 | 8+ |
| **Reusable Components** | 16 | 25+ |
| **Test Coverage Potential** | ~40% | ~80%+ |

---

## CONCLUSION

The component directory shows solid React fundamentals but suffers from:
1. **State complexity** that grows with features
2. **Code duplication** across similar features
3. **Missing abstractions** for common patterns
4. **Performance concerns** from large, complex components
5. **Type safety gaps** from inconsistent typing

The recommended refactoring roadmap (7 weeks) would significantly improve:
- Maintainability
- Testability
- Performance
- Developer experience
- Code reusability

**Priority 1**: Extract AdminUserManagement and create utility layer
**Priority 2**: Consolidate modals and forms
**Priority 3**: Improve type safety and error handling
**Priority 4**: Add performance optimizations
