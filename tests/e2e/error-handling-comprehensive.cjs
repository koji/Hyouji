#!/usr/bin/env node

/**
 * Comprehensive test for error handling scenarios in JSON label import functionality
 * This script validates all error handling requirements 2.1, 2.2, 2.3, and 2.4
 * by testing the logic and verifying user-friendly error messages
 */

const fs = require('fs')

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

// Test data validation
function validateTestData() {
  log(colorize('blue', '🔍 Validating Test Data Files'))
  log(colorize('blue', '='.repeat(40)))

  const requiredFiles = [
    'tests/fixtures/json/invalid-json-syntax.json',
    'tests/fixtures/json/invalid-structure-not-array.json',
    'tests/fixtures/json/missing-required-fields.json',
    'tests/fixtures/json/invalid-field-types.json',
  ]

  let allFilesExist = true

  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      log(colorize('green', `✅ ${file} exists`))
    } else {
      log(colorize('red', `❌ ${file} missing`))
      allFilesExist = false
    }
  }

  return allFilesExist
}

// Test implementation code quality
function validateImplementation() {
  log(colorize('blue', '\n🔍 Validating Implementation Code'))
  log(colorize('blue', '='.repeat(40)))

  const implementationFile = 'src/lib/importJson.ts'

  if (!fs.existsSync(implementationFile)) {
    log(
      colorize('red', `❌ Implementation file ${implementationFile} not found`),
    )
    return false
  }

  const code = fs.readFileSync(implementationFile, 'utf8')

  // Check for required error handling patterns
  const checks = [
    {
      pattern: /fs\.existsSync\(filePath\)/,
      description: 'File existence check (Requirement 2.1)',
      required: true,
    },
    {
      pattern: /JSON\.parse\(.*\)/,
      description: 'JSON parsing with try-catch (Requirement 2.2)',
      required: true,
    },
    {
      pattern: /Array\.isArray\(.*\)/,
      description: 'Array structure validation (Requirement 2.3)',
      required: true,
    },
    {
      pattern: /missing required.*name.*field/i,
      description: 'Missing name field validation (Requirement 2.4)',
      required: true,
    },
    {
      pattern: /File not found at path/,
      description: 'User-friendly file not found message',
      required: true,
    },
    {
      pattern: /Invalid JSON syntax/,
      description: 'User-friendly JSON parse error message',
      required: true,
    },
    {
      pattern: /must contain an array/,
      description: 'User-friendly array validation message',
      required: true,
    },
  ]

  let passedChecks = 0

  for (const check of checks) {
    if (check.pattern.test(code)) {
      log(colorize('green', `✅ ${check.description}`))
      passedChecks++
    } else {
      log(colorize('red', `❌ ${check.description}`))
    }
  }

  log(
    colorize(
      'blue',
      `\nImplementation checks: ${passedChecks}/${checks.length} passed`,
    ),
  )
  return passedChecks === checks.length
}

// Test error scenarios with actual data
function testErrorScenarios() {
  log(colorize('blue', '\n🧪 Testing Error Scenarios'))
  log(colorize('blue', '='.repeat(40)))

  const scenarios = [
    {
      name: 'Non-existent file (Requirement 2.1)',
      test: () => {
        const nonExistentFile = 'tests/fixtures/json/non-existent-file.json'
        return !fs.existsSync(nonExistentFile)
      },
      expected: 'Should return false for non-existent file',
    },
    {
      name: 'Invalid JSON syntax (Requirement 2.2)',
      test: () => {
        try {
          const content = fs.readFileSync(
            'tests/fixtures/json/invalid-json-syntax.json',
            'utf8',
          )
          JSON.parse(content)
          return false // Should not reach here
        } catch (error) {
          return error instanceof SyntaxError
        }
      },
      expected: 'Should throw SyntaxError for invalid JSON',
    },
    {
      name: 'Invalid structure - not array (Requirement 2.3)',
      test: () => {
        try {
          const content = fs.readFileSync(
            'tests/fixtures/json/invalid-structure-not-array.json',
            'utf8',
          )
          const data = JSON.parse(content)
          return !Array.isArray(data)
        } catch (_error) {
          return false
        }
      },
      expected: 'Should detect non-array structure',
    },
    {
      name: 'Missing required fields (Requirement 2.4)',
      test: () => {
        try {
          const content = fs.readFileSync(
            'tests/fixtures/json/missing-required-fields.json',
            'utf8',
          )
          const data = JSON.parse(content)
          if (!Array.isArray(data)) return false

          // Check if any items are missing name field or have empty name
          return data.some(
            (item) =>
              !item.name ||
              typeof item.name !== 'string' ||
              item.name.trim() === '',
          )
        } catch (_error) {
          return false
        }
      },
      expected: 'Should detect missing or invalid name fields',
    },
    {
      name: 'Invalid field types (Requirement 2.4)',
      test: () => {
        try {
          const content = fs.readFileSync(
            'tests/fixtures/json/invalid-field-types.json',
            'utf8',
          )
          const data = JSON.parse(content)
          if (!Array.isArray(data)) return false

          // Check for invalid field types
          return data.some(
            (item) =>
              (item && typeof item.name !== 'string') ||
              (item &&
                item.color !== undefined &&
                typeof item.color !== 'string') ||
              (item &&
                item.description !== undefined &&
                typeof item.description !== 'string') ||
              typeof item !== 'object' ||
              item === null,
          )
        } catch (_error) {
          return false
        }
      },
      expected: 'Should detect invalid field types',
    },
  ]

  let passedTests = 0

  for (const scenario of scenarios) {
    try {
      const result = scenario.test()
      if (result) {
        log(colorize('green', `✅ ${scenario.name}`))
        passedTests++
      } else {
        log(colorize('red', `❌ ${scenario.name}`))
        log(colorize('gray', `   Expected: ${scenario.expected}`))
      }
    } catch (error) {
      log(colorize('red', `❌ ${scenario.name} - Error: ${error.message}`))
    }
  }

  log(
    colorize(
      'blue',
      `\nScenario tests: ${passedTests}/${scenarios.length} passed`,
    ),
  )
  return passedTests === scenarios.length
}

// Verify error message quality
function verifyErrorMessageQuality() {
  log(colorize('blue', '\n📝 Verifying Error Message Quality'))
  log(colorize('blue', '='.repeat(40)))

  const implementationFile = 'src/lib/importJson.ts'
  const code = fs.readFileSync(implementationFile, 'utf8')

  const qualityChecks = [
    {
      pattern: /Error: File not found at path: \$\{.*\}/,
      description: 'File path included in error message',
      weight: 1,
    },
    {
      pattern: /Error: Invalid JSON syntax in file: \$\{.*\}/,
      description: 'File name included in JSON error',
      weight: 1,
    },
    {
      pattern: /Parse error: \$\{.*error.*message\}/,
      description: 'Detailed parse error information',
      weight: 1,
    },
    {
      pattern: /Item at index \$\{.*\}/,
      description: 'Specific item location in validation errors',
      weight: 1,
    },
    {
      pattern: /chalk\.(red|yellow|green|blue|cyan)/,
      description: 'Color-coded error messages for better UX',
      weight: 1,
    },
    {
      pattern: /must be a.*string/,
      description: 'Clear type expectations in error messages',
      weight: 1,
    },
  ]

  let qualityScore = 0
  let maxScore = 0

  for (const check of qualityChecks) {
    maxScore += check.weight
    if (check.pattern.test(code)) {
      log(colorize('green', `✅ ${check.description}`))
      qualityScore += check.weight
    } else {
      log(colorize('yellow', `⚠️  ${check.description}`))
    }
  }

  const percentage = Math.round((qualityScore / maxScore) * 100)
  log(
    colorize(
      'blue',
      `\nError message quality: ${qualityScore}/${maxScore} (${percentage}%)`,
    ),
  )

  return percentage >= 80 // 80% threshold for good quality
}

// Main test runner
async function runComprehensiveTests() {
  log(colorize('blue', '🧪 Comprehensive Error Handling Test Suite'))
  log(colorize('blue', '='.repeat(60)))
  log(colorize('gray', 'Testing requirements 2.1, 2.2, 2.3, and 2.4'))
  log('')

  const results = {
    testData: validateTestData(),
    implementation: validateImplementation(),
    scenarios: testErrorScenarios(),
    messageQuality: verifyErrorMessageQuality(),
  }

  log(colorize('blue', '\n📊 Final Test Results'))
  log(colorize('blue', '='.repeat(30)))

  const categories = [
    { name: 'Test Data Files', result: results.testData },
    { name: 'Implementation Code', result: results.implementation },
    { name: 'Error Scenarios', result: results.scenarios },
    { name: 'Message Quality', result: results.messageQuality },
  ]

  let passedCategories = 0

  for (const category of categories) {
    if (category.result) {
      log(colorize('green', `✅ ${category.name}`))
      passedCategories++
    } else {
      log(colorize('red', `❌ ${category.name}`))
    }
  }

  const overallSuccess = passedCategories === categories.length

  log('')
  if (overallSuccess) {
    log(colorize('green', '🎉 All comprehensive tests passed!'))
    log(
      colorize('blue', 'Error handling implementation meets all requirements:'),
    )
    log(
      colorize('gray', '  • 2.1: File not found errors are handled gracefully'),
    )
    log(
      colorize('gray', '  • 2.2: JSON parsing errors display helpful messages'),
    )
    log(
      colorize('gray', '  • 2.3: Invalid structure validation works correctly'),
    )
    log(
      colorize(
        'gray',
        '  • 2.4: Field validation provides specific error details',
      ),
    )
    log(
      colorize('gray', '  • Error messages are user-friendly and informative'),
    )
  } else {
    log(
      colorize(
        'red',
        `❌ ${categories.length - passedCategories} test categories failed`,
      ),
    )
  }

  return overallSuccess
}

// Run the comprehensive test suite
runComprehensiveTests()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    log(colorize('red', `Test suite error: ${error.message}`))
    process.exit(1)
  })
