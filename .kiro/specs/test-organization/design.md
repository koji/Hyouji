# Design Document

## Overview

This design outlines the reorganization of test files in the Hyouji project from a scattered root-level structure to a well-organized testing hierarchy. The solution will create a comprehensive `tests/` directory with logical subdirectories for different test types, update package.json scripts, and ensure all existing functionality is preserved.

## Architecture

### Directory Structure

The new test organization will follow this structure:

```
tests/
├── unit/                    # Unit tests (future vitest tests)
├── integration/            # Integration tests
│   ├── error-handling/     # Error handling integration tests
│   └── config/            # Configuration integration tests
├── e2e/                   # End-to-end tests (comprehensive scenarios)
├── fixtures/              # Shared test data
│   ├── json/              # JSON test files
│   └── config/            # Configuration test files
└── scripts/               # Test utility scripts and runners
    ├── error-handling/    # Error handling test scripts
    ├── config/           # Configuration test scripts
    └── verification/     # Manual verification scripts
```

### Test File Categorization

Based on analysis of existing test files, they will be categorized as follows:

**Error Handling Tests:**

- `run-error-tests.cjs` → `tests/scripts/error-handling/run-all.cjs`
- `test-comprehensive-error-handling.cjs` → `tests/e2e/error-handling-comprehensive.cjs`
- `test-error-handling.cjs` → `tests/integration/error-handling/json-import.cjs`
- `test-error-scenarios.js` → `tests/integration/error-handling/scenarios.js`
- `test-integration-error-handling.cjs` → `tests/integration/error-handling/built-implementation.cjs`

**Configuration Tests:**

- `test-config-error-handling.cjs` → `tests/integration/config/error-handling.cjs`
- `test-config-validation.mjs` → `tests/integration/config/validation.mjs`
- `verify-config-error-handling.cjs` → `tests/scripts/verification/config-errors.cjs`

**Verification Scripts:**

- `verify-implementation.cjs` → `tests/scripts/verification/implementation.cjs`

**Test Data:**

- `test-data/` → `tests/fixtures/json/`

## Components and Interfaces

### Test Runner Scripts

Each test category will have a main runner script that can execute all tests in that category:

1. **Error Handling Runner** (`tests/scripts/error-handling/run-all.cjs`)
   - Executes all error handling tests in sequence
   - Provides consolidated reporting
   - Supports individual test execution

2. **Configuration Runner** (`tests/scripts/config/run-all.cjs`)
   - Executes all configuration tests
   - Handles both validation and error scenarios

3. **Integration Runner** (`tests/scripts/run-integration.cjs`)
   - Executes all integration tests
   - Provides category-wise reporting

### Package.json Script Updates

New npm scripts will be added to support the organized structure:

```json
{
  "scripts": {
    "test:error-handling": "node tests/scripts/error-handling/run-all.cjs",
    "test:config": "node tests/scripts/config/run-all.cjs",
    "test:integration": "node tests/scripts/run-integration.cjs",
    "test:verification": "node tests/scripts/verification/run-all.cjs",
    "test:all-custom": "npm run test:error-handling && npm run test:config && npm run test:integration"
  }
}
```

## Data Models

### Test Configuration Structure

```typescript
interface TestConfig {
  category: 'error-handling' | 'config' | 'integration' | 'verification';
  name: string;
  description: string;
  filePath: string;
  requirements: string[];
  dependencies?: string[];
}
```

### Test Result Structure

```typescript
interface TestResult {
  testName: string;
  category: string;
  passed: boolean;
  message: string;
  executionTime: number;
  requirements: string[];
}
```

## Error Handling

### File Migration Errors

- Validate all file moves preserve functionality
- Ensure no broken imports or path references
- Provide rollback capability if issues occur

### Script Execution Errors

- Maintain existing error handling within test scripts
- Add category-level error reporting
- Ensure individual test failures don't break entire suites

### Path Resolution

- Update all relative paths in moved files
- Ensure test data references remain valid
- Handle cross-platform path compatibility

## Testing Strategy

### Migration Validation

1. **Pre-migration Testing**: Run all existing tests to establish baseline
2. **Post-migration Testing**: Verify all tests still pass after reorganization
3. **Script Validation**: Ensure all npm scripts work with new structure
4. **Path Verification**: Confirm all file references are updated correctly

### Regression Testing

- Compare test outputs before and after migration
- Verify test data files are accessible from new locations
- Ensure no functionality is lost in the reorganization

### Integration Testing

- Test the new runner scripts work correctly
- Verify category-based test execution
- Ensure consolidated reporting functions properly

## Implementation Phases

### Phase 1: Directory Structure Creation

- Create the new `tests/` directory hierarchy
- Set up subdirectories for each test category

### Phase 2: File Migration

- Move test files to appropriate new locations
- Update internal path references
- Migrate test data to fixtures directory

### Phase 3: Script Updates

- Create new test runner scripts
- Update package.json with new test commands
- Ensure backward compatibility where possible

### Phase 4: Validation

- Run comprehensive testing to ensure nothing is broken
- Update any remaining path references
- Clean up old test files from root directory
