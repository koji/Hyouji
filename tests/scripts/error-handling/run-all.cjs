#!/usr/bin/env node

/**
 * Error Handling Test Runner
 * Executes all error handling tests and provides consolidated reporting
 * Requirements: 3.1, 3.3
 */

const { spawn } = require('child_process')
const path = require('path')

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

// Error handling test files to execute
const errorHandlingTests = [
  {
    name: 'JSON Import Error Handling',
    file: 'tests/integration/error-handling/json-import.cjs',
    description: 'Tests error handling in JSON import functionality',
    requirements: ['2.1', '2.2', '2.3', '2.4'],
  },
  {
    name: 'Error Scenarios',
    file: 'tests/integration/error-handling/scenarios.js',
    description:
      'Tests comprehensive error scenarios with actual implementation',
    requirements: ['2.1', '2.2', '2.3', '2.4'],
  },
  {
    name: 'Built Implementation Integration',
    file: 'tests/integration/error-handling/built-implementation.cjs',
    description: 'Tests error handling in the actual built implementation',
    requirements: ['2.1', '2.2', '2.3', '2.4'],
  },
  {
    name: 'Comprehensive E2E Error Handling',
    file: 'tests/e2e/error-handling-comprehensive.cjs',
    description: 'End-to-end comprehensive error handling validation',
    requirements: ['2.1', '2.2', '2.3', '2.4'],
  },
]

// Execute a single test file
function executeTest(test) {
  return new Promise((resolve) => {
    log(colorize('cyan', `\n🧪 Running: ${test.name}`))
    log(colorize('gray', `   File: ${test.file}`))
    log(colorize('gray', `   Description: ${test.description}`))
    log(colorize('gray', `   Requirements: ${test.requirements.join(', ')}`))
    log(colorize('gray', '='.repeat(60)))

    const isESModule = test.file.endsWith('.js')
    const command = isESModule ? 'node' : 'node'
    const args = [test.file]

    const child = spawn(command, args, {
      stdio: 'inherit',
      cwd: process.cwd(),
    })

    child.on('close', (code) => {
      const success = code === 0
      if (success) {
        log(colorize('green', `✅ ${test.name} - PASSED`))
      } else {
        log(colorize('red', `❌ ${test.name} - FAILED (exit code: ${code})`))
      }
      resolve({ test, success, exitCode: code })
    })

    child.on('error', (error) => {
      log(colorize('red', `❌ ${test.name} - ERROR: ${error.message}`))
      resolve({ test, success: false, error: error.message })
    })
  })
}

// Execute individual test (when specific test is requested)
async function executeIndividualTest(testName) {
  const test = errorHandlingTests.find(
    (t) =>
      t.name.toLowerCase().includes(testName.toLowerCase()) ||
      t.file.includes(testName),
  )

  if (!test) {
    log(colorize('red', `❌ Test not found: ${testName}`))
    log(colorize('yellow', 'Available tests:'))
    errorHandlingTests.forEach((t, index) => {
      log(colorize('gray', `  ${index + 1}. ${t.name} (${t.file})`))
    })
    return false
  }

  log(colorize('blue', '🎯 Running Individual Error Handling Test'))
  log(colorize('blue', '='.repeat(50)))

  const result = await executeTest(test)
  return result.success
}

// Execute all error handling tests
async function executeAllTests() {
  log(colorize('blue', '🧪 Error Handling Test Suite'))
  log(colorize('blue', '='.repeat(50)))
  log(
    colorize(
      'gray',
      'Executing all error handling tests with consolidated reporting',
    ),
  )
  log('')

  const results = []
  let totalTests = errorHandlingTests.length
  let passedTests = 0

  for (const test of errorHandlingTests) {
    const result = await executeTest(test)
    results.push(result)

    if (result.success) {
      passedTests++
    }

    // Add spacing between tests
    log('')
  }

  // Consolidated reporting
  log(colorize('blue', '📊 Consolidated Test Results'))
  log(colorize('blue', '='.repeat(40)))
  log('')

  results.forEach((result, index) => {
    const status = result.success
      ? colorize('green', '✅ PASSED')
      : colorize('red', '❌ FAILED')

    log(`${index + 1}. ${result.test.name} - ${status}`)

    if (!result.success) {
      if (result.error) {
        log(colorize('gray', `   Error: ${result.error}`))
      } else if (result.exitCode) {
        log(colorize('gray', `   Exit code: ${result.exitCode}`))
      }
    }
  })

  log('')
  log(colorize('blue', '📈 Summary'))
  log(colorize('blue', '='.repeat(20)))
  log(colorize('green', `✅ Passed: ${passedTests}/${totalTests} tests`))

  if (passedTests < totalTests) {
    log(
      colorize(
        'red',
        `❌ Failed: ${totalTests - passedTests}/${totalTests} tests`,
      ),
    )
  }

  const successRate = Math.round((passedTests / totalTests) * 100)
  log(colorize('blue', `📊 Success Rate: ${successRate}%`))

  if (passedTests === totalTests) {
    log('')
    log(colorize('green', '🎉 All error handling tests passed!'))
    log(colorize('blue', '✅ Requirements validated:'))
    log(colorize('gray', '  • 2.1: File not found error handling'))
    log(colorize('gray', '  • 2.2: JSON parsing error handling'))
    log(colorize('gray', '  • 2.3: Invalid structure validation'))
    log(
      colorize('gray', '  • 2.4: Field validation and user-friendly messages'),
    )
  } else {
    log('')
    log(
      colorize(
        'yellow',
        '⚠️  Some tests failed. Please review the output above.',
      ),
    )
  }

  return passedTests === totalTests
}

// Main execution
async function main() {
  const args = process.argv.slice(2)

  if (args.length > 0) {
    // Individual test execution
    const testName = args[0]
    log(colorize('blue', `🎯 Running individual test: ${testName}`))
    const success = await executeIndividualTest(testName)
    process.exit(success ? 0 : 1)
  } else {
    // Run all tests
    const success = await executeAllTests()
    process.exit(success ? 0 : 1)
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log(colorize('red', `❌ Uncaught error: ${error.message}`))
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  log(colorize('red', `❌ Unhandled rejection: ${reason}`))
  process.exit(1)
})

main().catch((error) => {
  log(colorize('red', `❌ Test runner error: ${error.message}`))
  process.exit(1)
})
