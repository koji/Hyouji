# Auto-Detection Integration Tests

This directory contains comprehensive integration tests for the Git repository auto-detection feature in hyouji.

## Overview

The integration tests verify the complete auto-detection flow from end-to-end, ensuring that:

1. **End-to-end flow in actual Git repository environment** - Tests work with real Git repositories
2. **Fallback behavior in non-Git directories** - Ensures graceful handling when not in a Git repository
3. **Multiple remote scenarios and priority handling** - Verifies correct remote prioritization logic
4. **Integration with existing configuration management** - Tests integration with the broader application

## Test Files

### `src/lib/gitRepositoryDetector.integration.test.ts`

Comprehensive Vitest-based integration tests that cover:

#### End-to-end Git Repository Detection

- ✅ SSH format remote detection (`git@github.com:owner/repo.git`)
- ✅ HTTPS format remote detection (`https://github.com/owner/repo.git`)
- ✅ Detection from subdirectories within Git repositories

#### Fallback Behavior

- ✅ Non-Git directory handling
- ✅ Project directories without Git initialization

#### Multiple Remote Scenarios

- ✅ Origin remote prioritization when multiple remotes exist
- ✅ First remote fallback when origin doesn't exist
- ✅ No remotes configured handling
- ✅ Malformed remote URL handling

#### Integration with Configuration Management

- ✅ Repository detection integration with `getGitHubConfigs`
- ✅ Fallback to manual input when auto-detection fails
- ✅ Multiple remotes priority handling
- ✅ Git command error handling

#### Error Handling and Edge Cases

- ✅ Invalid remote URL parsing
- ✅ Empty repositories (no commits)
- ✅ Deeply nested directory structures

#### Performance and Reliability

- ✅ Reasonable execution time limits (< 5 seconds)
- ✅ Concurrent detection request handling

### `integration-flow.cjs`

A standalone Node.js script that:

1. **Sets up real Git repository environments** for testing
2. **Creates various Git scenarios** (SSH remotes, HTTPS remotes, multiple remotes, etc.)
3. **Tests non-Git directory behavior**
4. **Verifies error handling scenarios**
5. **Runs the Vitest integration tests**
6. **Provides comprehensive test reporting**

## Running the Tests

### Individual Integration Tests

```bash
npm run test -- --run src/lib/gitRepositoryDetector.integration.test.ts
```

### Complete Integration Flow

```bash
npm run test:auto-detection
```

### All Integration Tests

```bash
npm run test:integration
```

## Test Coverage

The integration tests cover all requirements specified in the auto-detection specification:

### Requirements 1.1-1.4 (Automatic Detection)

- ✅ Automatic repository detection inside Git repositories
- ✅ Repository owner and name extraction from Git remotes
- ✅ Origin remote prioritization
- ✅ First available remote fallback

### Requirements 2.1-2.3 (Fallback Behavior)

- ✅ Manual input prompting outside Git repositories
- ✅ Graceful fallback when no .git folder found
- ✅ Error handling with fallback to manual input

### Requirements 3.1-3.3 (User Feedback)

- ✅ Display of detected repository information
- ✅ Clear format showing owner and repository name
- ✅ Confirmation messages before proceeding

### Requirements 4.1-4.5 (Edge Cases)

- ✅ SSH format URL parsing
- ✅ HTTPS format URL parsing
- ✅ Non-standard format error handling
- ✅ Git command failure handling
- ✅ Invalid repository information validation

## Test Environment

The integration tests:

- **Use real Git repositories** created in temporary directories
- **Execute actual Git commands** to simulate real-world scenarios
- **Test in isolated environments** that are cleaned up after each test
- **Handle concurrent execution** safely
- **Provide detailed error reporting** for debugging

## Verification

All tests pass successfully and verify:

1. **Functional correctness** - All detection scenarios work as expected
2. **Error resilience** - Graceful handling of all error conditions
3. **Performance** - Reasonable execution times under various conditions
4. **Integration** - Proper integration with existing configuration management
5. **User experience** - Appropriate feedback and fallback behavior

## Maintenance

When modifying the auto-detection functionality:

1. **Run integration tests** to ensure no regressions
2. **Update test scenarios** if new edge cases are discovered
3. **Verify test coverage** remains comprehensive
4. **Check performance** remains within acceptable limits

The integration tests provide confidence that the auto-detection feature works correctly in real-world scenarios and integrates properly with the existing hyouji application.
