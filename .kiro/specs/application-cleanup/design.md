# Application Cleanup Design

## Overview

This design document outlines the systematic approach for identifying and removing obsolete files from the Virtual Patient Simulation application. The cleanup will be organized by file categories and will include safety checks to prevent removal of actively used files.

## Architecture

### Cleanup Categories

The cleanup process is organized into five main categories:

1. **Backend Utility Scripts** - One-time migration and debugging scripts
2. **Documentation Files** - Redundant, outdated, or superseded documentation
3. **Test and Development Files** - Obsolete test files and development artifacts
4. **Frontend Components** - Unused components and assets
5. **Configuration Files** - Obsolete or redundant configuration files

### Safety Framework

Before removing any file, the following safety checks will be performed:

1. **Dependency Analysis** - Check if the file is imported or referenced by other files
2. **Git History Analysis** - Review recent commits to understand file usage patterns
3. **Documentation Review** - Check if the file is mentioned in documentation as being actively used
4. **Backup Strategy** - Ensure files can be recovered if needed

## Components and Interfaces

### File Analysis Component

**Purpose:** Analyze files to determine if they are safe to remove

**Key Functions:**
- `analyzeFileUsage(filePath: string): FileUsageAnalysis`
- `checkDependencies(filePath: string): string[]`
- `isActivelyMaintained(filePath: string): boolean`

### Cleanup Executor Component

**Purpose:** Execute the actual file removal with safety checks

**Key Functions:**
- `removeFile(filePath: string, category: CleanupCategory): void`
- `createBackup(filePath: string): void`
- `validateRemoval(filePath: string): boolean`

### Report Generator Component

**Purpose:** Generate reports of cleanup actions taken

**Key Functions:**
- `generateCleanupReport(): CleanupReport`
- `logRemovalAction(filePath: string, reason: string): void`

## Data Models

### File Categories for Cleanup

#### Backend Utility Scripts (SimulatorBackend/)
- `addPatientNames.js` - One-time script to add patient names to cases
- `checkInitialPrompts.js` - Debugging script for initial prompts
- `checkPatientNames.js` - Debugging script for patient names
- `checkPediatric.js` - One-time script to check pediatric cases
- `checkPediatricStatus.js` - Debugging script for pediatric status
- `reorganize-programs.js` - One-time migration script (appears incomplete/corrupted)
- `test.js` - Basic API test script
- `testSimulationAPI.js` - API testing script
- `test-db-connection.js` - Database connection test script
- `updateInitialPrompts.js` - One-time update script

#### Documentation Files
- `API_Documentation.md` (root) - Superseded by Backend_API_Reference.md
- `dashboard-content-suggestions.md` - Design suggestions, likely implemented
- `switch-frontend.md` - Empty file
- `SimulatorBackend/AGENTS.md` - Brief Redis integration notes
- `SimulatorBackend/DESCRIPTION_UPDATE.md` - One-time update documentation
- `SimulatorBackend/INTEGRATION-COMPLETE.md` - Implementation completion notes
- `SimulatorBackend/frontend-instructions.md` - Outdated frontend integration instructions
- `simulatorfrontend/ERROR_HANDLING_IMPLEMENTATION.md` - Implementation notes
- `simulatorfrontend/LOADING_STATES_DEMO.md` - Implementation notes
- `simulatorfrontend/PERFORMANCE_OPTIMIZATIONS.md` - Implementation notes
- `simulatorfrontend/SPECIALTY_FILTERING_IMPLEMENTATION.md` - Implementation notes
- `simulatorfrontend/SPECIALTY_ROUTING_TESTING_SUMMARY.md` - Testing summary

#### Frontend Components
- `enhanced-dashboard-component.tsx` (root) - Standalone component file, likely superseded by actual implementation

#### Configuration and Build Files
- `SimulatorBackend/program1.json` - Appears to be test/sample data
- `SimulatorBackend/program2.json` - Appears to be test/sample data

## Error Handling

### File Removal Safety Checks

1. **Dependency Check Failure**
   - If a file has active dependencies, log warning and skip removal
   - Provide list of dependent files for manual review

2. **Git History Check**
   - If file was modified recently (within 30 days), flag for manual review
   - If file has high commit frequency, consider keeping

3. **Backup Failure**
   - If backup cannot be created, abort removal
   - Log error and continue with next file

### Recovery Procedures

1. **Accidental Removal**
   - Files can be recovered from Git history
   - Backup copies available in designated backup directory

2. **Dependency Discovery**
   - If removed file is later found to be needed, restore from backup
   - Update dependency analysis to prevent future issues

## Testing Strategy

### Pre-Cleanup Testing

1. **Dependency Analysis Testing**
   - Verify that dependency checking correctly identifies file relationships
   - Test with known dependencies to ensure accuracy

2. **Safety Check Testing**
   - Test safety checks with various file types
   - Verify that actively used files are not marked for removal

### Post-Cleanup Testing

1. **Application Functionality Testing**
   - Run full test suite to ensure no functionality is broken
   - Test both frontend and backend applications

2. **Build Process Testing**
   - Verify that build processes still work correctly
   - Test deployment processes to ensure no missing files

### Rollback Testing

1. **File Recovery Testing**
   - Test ability to restore files from backups
   - Verify Git history recovery procedures

## Implementation Phases

### Phase 1: Analysis and Planning
1. Analyze each file category for removal candidates
2. Check dependencies and usage patterns
3. Create detailed removal plan with safety checks

### Phase 2: Backend Cleanup
1. Remove obsolete utility scripts
2. Clean up backend documentation files
3. Remove test data files

### Phase 3: Frontend Cleanup
1. Remove obsolete documentation files
2. Clean up unused components
3. Remove development artifacts

### Phase 4: Final Cleanup
1. Remove root-level obsolete files
2. Clean up any remaining configuration files
3. Generate final cleanup report

### Phase 5: Validation
1. Run comprehensive tests
2. Verify application functionality
3. Document cleanup results