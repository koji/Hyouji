#!/usr/bin/env node

/**
 * Integration Test Runner
 * Executes all integration tests and provides category-wise reporting
 * Requirements: 3.1, 3.3
 */

const { spawn } = require('child_process')
const fs = require('fs')
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

// Integration test categories and their files
const integrationTestCategories = [
  {
    name: 'Error Handling Integration Tests',
    category: 'error-handling',
    directory: 'tests/integration/error-handling',
    description: 'Integration tests for error handling scenarios',
    tests: [
      {
        name: 'JSON Import Error Handling',
        file: 'tests/integration/error-handling/json-import.cjs',
        description: 'Tests error handling in JSON import functionality',
      },
      {
        name: 'Error Scenarios',
        file: 'tests/integration/error-handling/scenarios.js',
        description:
          'Tests comprehensive error scenarios with actual implementation',
      },
      {
        name: 'Built Implementation Integration',
        file: 'tests/integration/error-handling/built-implementation.cjs',
        description: 'Tests error handling in the actual built implementation',
      },
    ],
  },
  {
    name: 'Configuration Integration Tests',
    category: 'config',
    directory: 'tests/integration/config',
    description: 'Integration tests for configuration management',
    tests: [
      {
        name: 'Configuration Error Handling',
        file: 'tests/integration/config/error-handling.cjs',
        description:
          'Tests error handling scenarios for configuration management',
      },
      {
        name: 'Configuration Validation',
        file: 'tests/integration/config/validation.mjs',
        description:
          'Tests configuration validation and error message generation',
      },
    ],
  },
]

// Discover additional integration test files
function discoverIntegrationTests() {
  const integrationDir = 'tests/integration'
  const discoveredTests = []

  if (!fs.existsSync(integrationDir)) {
    return discoveredTests
  }

  function scanDirectory(dir, category = 'misc') {
    const items = fs.readdirSync(dir)

    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        // Recursively scan subdirectories
        scanDirectory(fullPath, item)
      } else if (
        stat.isFile() &&
        (item.endsWith('.js') || item.endsWith('.cjs') || itemth('.mjs'))
      ) {
        // Skip .gitkeep files
        if (item === '.gitkeep') continue

        // Check if this file is already in our predefined categories
        const alreadyIncluded = integrationTestCategories.some((cat) =>
          cat.tests.some((test) => test.file === fullPath),
        )

        if (!alreadyIncluded) {
          discoveredTests.push({
            name: path.basename(item, path.extname(item)),
            file: fullPath,
            category: category,
            description: `Integration test: ${item}`,
          })
        }
      }
    }
  }

  scanDirectory(integrationDir)
  return discoveredTests
}

// Execute a single test file
function executeTest(test) {
  return new Promise((resolve) => {
    log(colorize('cyan', `\n🧪 Running: ${test.name}`))
    log(colorize('gray', `   File: ${test.file}`))
    log(colorize('gray', `   Category: ${test.category || 'misc'}`))
    log(colorize('gray', `   Description: ${test.description}`))
    log(colorize('gray', '='.repeat(60)))

    const isESModule = test.file.endsWith('.mjs') || test.file.endsWith('.js')
    const command = 'node'
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

// Execute tests by category
async function executeTestsByCategory(categoryName) {
  const category = integrationTestCategories.find(
    (cat) =>
      cat.category.toLowerCase() === categoryName.toLowerCase() ||
      cat.name.toLowerCase().includes(categoryName.toLowerCase()),
  )

  if (!category) {
    log(colorize('red', `❌ Category not found: ${categoryName}`))
    log(colorize('yellow', 'Available categories:'))
    integrationTestCategories.forEach((cat) => {
      log(colorize('gray', `  • ${cat.category} - ${cat.name}`))
    })
    return false
  }

  log(colorize('blue', `🎯 Running ${category.name}`))
  log(colorize('blue', '='.repeat(50)))
  log(colorize('gray', category.description))
  log('')

  let allPassed = true
  const results = []

  for (const test of category.tests) {
    const result = await executeTest({ ...test, category: category.category })
    results.push(result)
    if (!result.success) {
      allPassed = false
    }
    log('')
  }

  // Category summary
  const passedTests = results.filter((r) => r.success).length
  log(colorize('blue', `📊 ${category.name} Summary`))
  log(colorize('blue', '='.repeat(30)))
  log(colorize('green', `✅ Passed: ${passedTests}/${results.length} tests`))

  if (passedTests < results.length) {
    log(
      colorize(
        'red',
        `❌ Failed: ${results.length - passedTests}/${results.length} tests`,
      ),
    )
  }

  return allPassed
}

// Execute individual test
async function executeIndividualTest(testName) {
  // Search in all categories
  let foundTest = null
  let foundCategory = null

  for (const category of integrationTestCategories) {
    const test = category.tests.find(
      (t) =>
        t.name.toLowerCase().includes(testName.toLowerCase()) ||
        t.file.includes(testName),
    )
    if (test) {
      foundTest = { ...test, category: category.category }
      foundCategory = category
      break
    }
  }

  // Also check discovered tests
  if (!foundTest) {
    const discoveredTests = discoverIntegrationTests()
    foundTest = discoveredTests.find(
      (t) =>
        t.name.toLowerCase().includes(testName.toLowerCase()) ||
        t.file.includes(testName),
    )
  }

  if (!foundTest) {
    log(colorize('red', `❌ Test not found: ${testName}`))
    log(colorize('yellow', 'Available tests:'))

    integrationTestCategories.forEach((category) => {
      log(colorize('cyan', `📂 ${category.name}:`))
      category.tests.forEach((test, index) => {
        log(colorize('gray', `  ${index + 1}. ${test.name} - ${test.file}`))
      })
    })

    const discoveredTests = discoverIntegrationTests()
    if (discoveredTests.length > 0) {
      log(colorize('cyan', '📂 Other Integration Tests:'))
      discoveredTests.forEach((test, index) => {
        log(colorize('gray', `  ${index + 1}. ${test.name} - ${test.file}`))
      })
    }

    return false
  }

  log(colorize('blue', '🎯 Running Individual Integration Test'))
  log(colorize('blue', '='.repeat(50)))

  const result = await executeTest(foundTest)
  return result.success
}

// Execute all integration tests
async function executeAllTests() {
  log(colorize('blue', '🧪 Integration Test Suite'))
  log(colorize('blue', '='.repeat(50)))
  log(
    colorize(
      'gray',
      'Executing all integration tests with category-wise reporting',
    ),
  )
  log('')

  const allResults = []
  let totalTests = 0
  let totalPassed = 0

  // Execute tests by category
  for (const category of integrationTestCategories) {
    log(colorize('cyan', `📂 ${category.name}`))
    log(colorize('gray', `   ${category.description}`))
    log(colorize('gray', '='.repeat(60)))

    const categoryResults = []

    for (const test of category.tests) {
      const result = await executeTest({ ...test, category: category.category })
      categoryResults.push(result)
      allResults.push(result)
      totalTests++

      if (result.success) {
        totalPassed++
      }

      log('')
    }

    // Category summary
    const categoryPassed = categoryResults.filter((r) => r.success).length
    log(colorize('blue', `📊 ${category.name} Summary:`))
    log(
      colorize(
        'green',
        `   ✅ Passed: ${categoryPassed}/${categoryResults.length}`,
      ),
    )
    if (categoryPassed < categoryResults.length) {
      log(
        colorize(
          'red',
          `   ❌ Failed: ${categoryResults.length - categoryPassed}/${categoryResults.length}`,
        ),
      )
    }
    log('')
  }

  // Check for additional discovered tests
  const discoveredTests = discoverIntegrationTests()
  if (discoveredTests.length > 0) {
    log(colorize('cyan', '📂 Additional Integration Tests'))
    log(
      colorize(
        'gray',
        '   Other integration tests found in the test directory',
      ),
    )
    log(colorize('gray', '='.repeat(60)))

    for (const test of discoveredTests) {
      const result = await executeTest(test)
      allResults.push(result)
      totalTests++

      if (result.success) {
        totalPassed++
      }

      log('')
    }
  }

  // Consolidated reporting
  log(colorize('blue', '📊 Consolidated Integration Test Results'))
  log(colorize('blue', '='.repeat(50)))
  log('')

  // Group results by category
  const resultsByCategory = {}
  allResults.forEach((result) => {
    const category = result.test.category || 'misc'
    if (!resultsByCategory[category]) {
      resultsByCategory[category] = []
    }
    resultsByCategory[category].push(result)
  })

  // Report by category
  Object.keys(resultsByCategory).forEach((category) => {
    const categoryResults = resultsByCategory[category]
    const categoryPassed = categoryResults.filter((r) => r.success).length

    log(
      colorize(
        'cyan',
        `📋 ${category.toUpperCase()} (${categoryPassed}/${categoryResults.length} passed):`,
      ),
    )
    categoryResults.forEach((result, index) => {
      const status = result.success
        ? colorize('green', '✅ PASSED')
        : colorize('red', '❌ FAILED')

      log(`  ${index + 1}. ${result.test.name} - ${status}`)

      if (!result.success) {
        if (result.error) {
          log(colorize('gray', `     Error: ${result.error}`))
        } else if (result.exitCode) {
          log(colorize('gray', `     Exit code: ${result.exitCode}`))
        }
      }
    })
    log('')
  })

  log(colorize('blue', '📈 Overall Summary'))
  log(colorize('blue', '='.repeat(25)))
  log(colorize('green', `✅ Passed: ${totalPassed}/${totalTests} tests`))

  if (totalPassed < totalTests) {
    log(
      colorize(
        'red',
        `❌ Failed: ${totalTests - totalPassed}/${totalTests} tests`,
      ),
    )
  }

  const successRate = Math.round((totalPassed / totalTests) * 100)
  log(colorize('blue', `📊 Success Rate: ${successRate}%`))

  if (totalPassed === totalTests) {
    log('')
    log(colorize('green', '🎉 All integration tests passed!'))
    log(colorize('blue', '✅ Categories completed:'))
    integrationTestCategories.forEach((category) => {
      log(colorize('gray', `  • ${category.name}`))
    })
    if (discoveredTests.length > 0) {
      log(
        colorize(
          'gray',
          `  • Additional tests (${discoveredTests.length} files)`,
        ),
      )
    }
  } else {
    log('')
    log(
      colorize(
        'yellow',
        '⚠️  Some tests failed. Please review the output above.',
      ),
    )
  }

  return totalPassed === totalTests
}

// Display help information
function displayHelp() {
  log(colorize('blue', '🔧 Integration Test Runner Help'))
  log(colorize('blue', '='.repeat(40)))
  log('')
  log(colorize('yellow', 'Usage:'))
  log('  node tests/scripts/run-integration.cjs [options]')
  log('')
  log(colorize('yellow', 'Options:'))
  log('  --help, -h          Show this help message')
  log('  --category <name>   Run tests from specific category')
  log('  --test <name>       Run specific test by name')
  log('  --list             List all available tests and categories')
  log('')
  log(colorize('yellow', 'Examples:'))
  log('  node tests/scripts/run-integration.cjs')
  log('  node tests/scripts/run-integration.cjs --category error-handling')
  log('  node tests/scripts/run-integration.cjs --test "json import"')
  log('  node tests/scripts/run-integration.cjs --list')
}

// List all available tests and categories
function listTests() {
  log(colorize('blue', '📋 Available Integration Tests'))
  log(colorize('blue', '='.repeat(40)))
  log('')

  integrationTestCategories.forEach((category) => {
    log(colorize('cyan', `📂 ${category.name} (${category.category}):`))
    log(colorize('gray', `   ${category.description}`))
    category.tests.forEach((test, index) => {
      log(colorize('gray', `   ${index + 1}. ${test.name}`))
      log(colorize('gray', `      File: ${test.file}`))
      log(colorize('gray', `      Description: ${test.description}`))
    })
    log('')
  })

  const discoveredTests = discoverIntegrationTests()
  if (discoveredTests.length > 0) {
    log(colorize('cyan', '📂 Additional Integration Tests:'))
    discoveredTests.forEach((test, index) => {
      log(colorize('gray', `   ${index + 1}. ${test.name} (${test.category})`))
      log(colorize('gray', `      File: ${test.file}`))
      log(colorize('gray', `      Description: ${test.description}`))
    })
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)

  // Parse arguments
  if (args.includes('--help') || args.includes('-h')) {
    displayHelp()
    return
  }

  if (args.includes('--list')) {
    listTests()
    return
  }

  const categoryIndex = args.indexOf('--category')
  if (categoryIndex !== -1 && categoryIndex + 1 < args.length) {
    const category = args[categoryIndex + 1]
    const success = await executeTestsByCategory(category)
    process.exit(success ? 0 : 1)
    return
  }

  const testIndex = args.indexOf('--test')
  if (testIndex !== -1 && testIndex + 1 < args.length) {
    const testName = args[testIndex + 1]
    const success = await executeIndividualTest(testName)
    process.exit(success ? 0 : 1)
    return
  }

  // Run all tests by default
  const success = await executeAllTests()
  process.exit(success ? 0 : 1)
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
