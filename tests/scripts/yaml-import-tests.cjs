#!/usr/bin/env node

/**
 * Comprehensive test runner for YAML import functionality
 * This script runs all YAML-related tests including:
 * - Unit tests (via vitest)
 * - Integration tests for error handling
 * - End-to-end workflow tests
 * - Compatibility tests
 */

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const log = console.log

// ANSI color codes for output formatting
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  reset: '\x1b[0m',
}

function colorize(color, text) {
  return `${colors[color]}${text}${colors.reset}`
}

// Test suite configuration
const testSuites = [
  {
    name: 'Unit Tests - File Format Utils',
    command: 'npm',
    args: ['run', 'test', '--', 'src/lib/fileFormatUtils.test.ts', '--run'],
    description: 'Tests file format detection and parsing utilities',
    requirement: '5.2, 5.3',
  },
  {
    name: 'Unit Tests - Import Labels',
    command: 'npm',
    args: ['run', 'test', '--', 'src/lib/importLabels.test.ts', '--run'],
    description: 'Tests YAML import functionality and validation',
    requirement: '1.2, 2.1, 5.1, 5.4',
  },
  {
    name: 'Integration Tests - YAML Error Handling',
    command: 'node',
    args: ['tests/integration/error-handling/yaml-import.cjs'],
    description: 'Tests error handling scenarios for YAML import',
    requirement: '1.4, 3.2, 5.4',
  },
  {
    name: 'Integration Tests - YAML Workflow',
    command: 'node',
    args: ['tests/integration/yaml-import-workflow.cjs'],
    description: 'Tests end-to-end YAML import workflow',
    requirement: '1.1, 1.2, 1.3, 2.1, 5.1, 5.2, 5.3',
  },
  {
    name: 'Compatibility Tests - JSON/YAML',
    command: 'node',
    args: ['tests/integration/json-yaml-compatibility.cjs'],
    description: 'Tests compatibility between JSON and YAML formats',
    requirement: '1.3, 3.1, 3.3',
  },
]

// Run a single test suite
function runTestSuite(suite) {
  return new Promise((resolve) => {
    log(colorize('cyan', `\n🧪 Running: ${suite.name}`))
    log(colorize('gray', `   Description: ${suite.description}`))
    log(colorize('gray', `   Requirements: ${suite.requirement}`))
    log(
      colorize('gray', `   Command: ${suite.command} ${suite.args.join(' ')}`),
    )
    log('')

    const startTime = Date.now()
    const child = spawn(suite.command, suite.args, {
      stdio: 'inherit',
      shell: true,
    })

    child.on('close', (code) => {
      const duration = Date.now() - startTime
      const durationStr = `${(duration / 1000).toFixed(2)}s`

      if (code === 0) {
        log(colorize('green', `✅ ${suite.name} - PASSED (${durationStr})`))
        resolve({ success: true, duration })
      } else {
        log(colorize('red', `❌ ${suite.name} - FAILED (${durationStr})`))
        resolve({ success: false, duration, exitCode: code })
      }
    })

    child.on('error', (error) => {
      log(colorize('red', `❌ ${suite.name} - ERROR: ${error.message}`))
      resolve({ success: false, error: error.message })
    })
  })
}

// Check if all required test files exist
function checkTestFiles() {
  const requiredFiles = [
    'src/lib/fileFormatUtils.test.ts',
    'src/lib/importLabels.test.ts',
    'tests/integration/error-handling/yaml-import.cjs',
    'tests/integration/yaml-import-workflow.cjs',
    'tests/integration/json-yaml-compatibility.cjs',
  ]

  const missingFiles = requiredFiles.filter((file) => !fs.existsSync(file))

  if (missingFiles.length > 0) {
    log(colorize('red', '❌ Missing required test files:'))
    missingFiles.forEach((file) => {
      log(colorize('red', `   - ${file}`))
    })
    return false
  }

  return true
}

// Check if all required test fixtures exist
function checkTestFixtures() {
  const requiredFixtures = [
    'tests/fixtures/yaml/valid-labels.yaml',
    'tests/fixtures/yaml/valid-minimal.yaml',
    'tests/fixtures/yaml/valid-mixed-fields.yaml',
    'tests/fixtures/yaml/valid-empty-array.yaml',
    'tests/fixtures/yaml/valid-with-unknown-fields.yaml',
    'tests/fixtures/yaml/invalid-field-types.yaml',
    'tests/fixtures/yaml/invalid-structure-not-array.yaml',
    'tests/fixtures/yaml/invalid-yaml-syntax.yaml',
    'tests/fixtures/yaml/missing-required-fields.yaml',
    'tests/fixtures/yaml/invalid-empty-name.yaml',
    'tests/fixtures/yaml/invalid-empty-color.yaml',
    'tests/fixtures/yaml/invalid-non-objects.yaml',
  ]

  const missingFixtures = requiredFixtures.filter(
    (file) => !fs.existsSync(file),
  )

  if (missingFixtures.length > 0) {
    log(
      colorize(
        'yellow',
        '⚠️  Missing test fixtures (will be created if needed):',
      ),
    )
    missingFixtures.forEach((file) => {
      log(colorize('yellow', `   - ${file}`))
    })
  }

  return missingFixtures.length === 0
}

// Main test runner
async function runAllTests() {
  log(colorize('blue', '🧪 YAML Import Test Suite Runner'))
  log(colorize('blue', '='.repeat(50)))
  log('')

  // Pre-flight checks
  log(colorize('blue', '🔍 Pre-flight checks...'))

  const filesExist = checkTestFiles()
  if (!filesExist) {
    log(colorize('red', '❌ Pre-flight check failed: Missing test files'))
    process.exit(1)
  }

  const fixturesExist = checkTestFixtures()
  log(colorize('green', '✅ Test files check passed'))
  if (fixturesExist) {
    log(colorize('green', '✅ Test fixtures check passed'))
  }

  // Run test suites
  let passedSuites = 0
  let totalSuites = testSuites.length
  let totalDuration = 0
  const results = []

  for (const suite of testSuites) {
    const result = await runTestSuite(suite)
    results.push({ suite, result })

    if (result.success) {
      passedSuites++
    }

    if (result.duration) {
      totalDuration += result.duration
    }

    // Add a small delay between test suites
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  // Summary
  log('')
  log(colorize('blue', '📊 Test Suite Results Summary'))
  log(colorize('blue', '='.repeat(40)))

  results.forEach(({ suite, result }) => {
    const status = result.success
      ? colorize('green', '✅ PASSED')
      : colorize('red', '❌ FAILED')
    const duration = result.duration
      ? ` (${(result.duration / 1000).toFixed(2)}s)`
      : ''
    log(`${status} ${suite.name}${duration}`)

    if (!result.success && result.exitCode) {
      log(colorize('red', `   Exit code: ${result.exitCode}`))
    }
    if (!result.success && result.error) {
      log(colorize('red', `   Error: ${result.error}`))
    }
  })

  log('')
  log(colorize('blue', '📈 Overall Statistics:'))
  log(
    colorize('green', `✅ Passed: ${passedSuites}/${totalSuites} test suites`),
  )
  log(
    colorize(
      'blue',
      `⏱️  Total duration: ${(totalDuration / 1000).toFixed(2)}s`,
    ),
  )

  if (passedSuites === totalSuites) {
    log(colorize('green', '🎉 All YAML import tests passed!'))
    log('')
    log(colorize('blue', '📋 Implementation verification checklist:'))
    log('□ YAML parsing with js-yaml library works correctly')
    log('□ File format detection supports .yaml and .yml extensions')
    log('□ YAML validation maintains consistency with JSON validation')
    log('□ Error handling provides clear, user-friendly messages')
    log("□ Unknown fields are handled with warnings but don't block import")
    log('□ Edge cases (empty files, syntax errors) are handled gracefully')
    log('□ JSON functionality remains completely unchanged')
    log('□ All task requirements have been satisfied')
  } else {
    log(
      colorize('red', `❌ ${totalSuites - passedSuites} test suite(s) failed`),
    )
    log('')
    log(colorize('yellow', '📋 Next steps:'))
    log('1. Review failed test output above')
    log('2. Fix any issues in the implementation')
    log('3. Re-run this test suite')
    log('4. Ensure all requirements are met before marking task complete')
  }

  return passedSuites === totalSuites
}

// Run the tests
runAllTests()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    log(colorize('red', `Test runner error: ${error.message}`))
    process.exit(1)
  })
