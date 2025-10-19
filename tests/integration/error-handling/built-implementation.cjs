#!/usr/bin/env node

/**
 * Integration test for error handling scenarios in the actual built application
 * This tests the real importLabelsFromFile function from the built code
 */

// const fs = require('fs')

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

const log = console.log

// Mock configs for testing (won't actually create labels since octokit is null)
const mockConfigs = {
  octokit: null,
  owner: 'test-owner',
  repo: 'test-repo',
}

// Test scenarios
const testScenarios = [
  {
    name: 'Non-existent file path',
    filePath: 'tests/fixtures/json/non-existent-file.json',
    requirement: '2.1',
  },
  {
    name: 'Invalid JSON syntax',
    filePath: 'tests/fixtures/json/invalid-json-syntax.json',
    requirement: '2.2',
  },
  {
    name: 'Invalid structure (not array)',
    filePath: 'tests/fixtures/json/invalid-structure-not-array.json',
    requirement: '2.3',
  },
  {
    name: 'Missing required fields',
    filePath: 'tests/fixtures/json/missing-required-fields.json',
    requirement: '2.4',
  },
  {
    name: 'Invalid field types',
    filePath: 'tests/fixtures/json/invalid-field-types.json',
    requirement: '2.4',
  },
]

async function testWithActualImplementation() {
  log(
    colorize(
      'blue',
      '🔧 Integration Test: Testing actual built implementation',
    ),
  )
  log(colorize('blue', '='.repeat(60)))
  log('')

  // Try to load the actual implementation
  let importLabelsFromFile
  try {
    // Try different ways to import the function
    const importModule = await import('../../../src/lib/importLabels.ts')
    importLabelsFromFile = importModule.importLabelsFromFile

    if (!importLabelsFromFile) {
      log(
        colorize(
          'red',
          '❌ Could not load importLabelsFromFile function from built code',
        ),
      )
      return false
    }

    log(
      colorize('green', '✅ Successfully loaded importLabelsFromFile function'),
    )
  } catch (error) {
    log(
      colorize(
        'red',
        `❌ Failed to load built implementation: ${error.message}`,
      ),
    )
    return false
  }

  log('')
  let passedTests = 0

  for (const scenario of testScenarios) {
    log(
      colorize(
        'cyan',
        `📋 Testing: ${scenario.name} (Requirement ${scenario.requirement})`,
      ),
    )
    log(colorize('gray', `   File: ${scenario.filePath}`))
    log('')

    try {
      // Capture console output
      const originalLog = console.log
      const capturedOutput = []
      console.log = (...args) => {
        capturedOutput.push(args.join(' '))
        originalLog(...args)
      }

      // Call the actual function
      await importLabelsFromFile(mockConfigs, scenario.filePath)

      // Restore console.log
      console.log = originalLog

      // Verify that appropriate error messages were displayed
      const output = capturedOutput.join('\n')
      let testPassed = false

      switch (scenario.requirement) {
        case '2.1': // File not found
          testPassed = output.includes('File not found at path')
          break
        case '2.2': // Invalid JSON syntax
          testPassed =
            output.includes('Invalid JSON syntax') ||
            output.includes('Parse error')
          break
        case '2.3': // Invalid structure
          testPassed = output.includes('must contain an array of label objects')
          break
        case '2.4': // Validation errors
          testPassed =
            output.includes('missing required') ||
            output.includes('invalid') ||
            output.includes('not a valid object') ||
            output.includes('No valid labels found')
          break
      }

      if (testPassed) {
        log(
          colorize(
            'green',
            `✅ Test passed - appropriate error handling detected`,
          ),
        )
        passedTests++
      } else {
        log(
          colorize('red', `❌ Test failed - expected error message not found`),
        )
        log(colorize('gray', `   Captured output: ${output}`))
      }
    } catch (error) {
      log(colorize('red', `❌ Test failed with exception: ${error.message}`))
    }

    log('')
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  log(colorize('blue', '📊 Integration Test Results'))
  log(colorize('blue', '='.repeat(30)))
  log(
    colorize(
      'green',
      `✅ Passed: ${passedTests}/${testScenarios.length} tests`,
    ),
  )

  return passedTests === testScenarios.length
}

// Run the integration test
testWithActualImplementation()
  .then((success) => {
    if (success) {
      log('')
      log(colorize('green', '🎉 All integration tests passed!'))
      log(
        colorize(
          'blue',
          'The actual implementation correctly handles all error scenarios.',
        ),
      )
    } else {
      log('')
      log(colorize('red', '❌ Some integration tests failed.'))
    }
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    log(colorize('red', `Integration test runner error: ${error.message}`))
    process.exit(1)
  })
