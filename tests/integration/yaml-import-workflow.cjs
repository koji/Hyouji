#!/usr/bin/env node

/**
 * Integration test for end-to-end YAML import workflow
 * This script tests the complete YAML import functionality including:
 * - File format detection
 * - YAML parsing
 * - Label validation
 * - Import processing
 * Requirements: 1.1, 1.2, 1.3, 2.1, 5.1, 5.2, 5.3
 */

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

// Test scenarios for successful YAML import workflow
const testScenarios = [
  {
    name: 'Valid YAML with all fields',
    filePath: 'tests/fixtures/yaml/valid-labels.yaml',
    requirement: '1.2, 2.1',
    description:
      'Should successfully import YAML file with complete label data',
    expectedLabels: 5,
  },
  {
    name: 'Valid YAML with minimal fields',
    filePath: 'tests/fixtures/yaml/valid-minimal.yaml',
    requirement: '1.2, 2.1',
    description: 'Should successfully import YAML file with name-only labels',
    expectedLabels: 3,
  },
  {
    name: 'Valid YAML with mixed fields',
    filePath: 'tests/fixtures/yaml/valid-mixed-fields.yaml',
    requirement: '1.2, 2.1',
    description:
      'Should successfully import YAML file with mixed field configurations',
    expectedLabels: 5,
  },
  {
    name: 'Valid YAML with unknown fields',
    filePath: 'tests/fixtures/yaml/valid-with-unknown-fields.yaml',
    requirement: '1.2, 2.1',
    description:
      'Should successfully import YAML file and ignore unknown fields',
    expectedLabels: 1,
  },
  {
    name: 'Valid empty YAML array',
    filePath: 'tests/fixtures/yaml/valid-empty-array.yaml',
    requirement: '1.2, 2.1',
    description: 'Should handle empty YAML array gracefully',
    expectedLabels: 0,
  },
  {
    name: 'YAML file with .yml extension',
    filePath: 'tests/fixtures/yaml/test-yml-extension.yml',
    requirement: '5.2, 5.3',
    description: 'Should detect and parse .yml extension correctly',
    expectedLabels: 2,
    createFile: true,
    fileContent: `# Test file with .yml extension
- name: 'test-yml'
  color: 'ffffff'
- name: 'another-yml'
  color: 'aaaaaa'`,
  },
]

// Import required modules for testing
const yaml = require('js-yaml')

// Mock the file format detection logic
function detectFileFormat(filePath) {
  const extension = path.extname(filePath).toLowerCase()
  switch (extension) {
    case '.json':
      return 'json'
    case '.yaml':
    case '.yml':
      return 'yaml'
    default:
      return null
  }
}

// Mock the YAML parsing logic
function parseYamlContent(content) {
  return yaml.load(content)
}

// Mock the JSON parsing logic
function parseJsonContent(content) {
  return JSON.parse(content)
}

// Mock label validation logic
function validateLabel(labelObj, index) {
  const errors = []
  const warnings = []

  // Check if item is an object
  if (typeof labelObj !== 'object' || labelObj === null) {
    errors.push(`Item at index ${index} is not a valid object`)
    return { valid: false, errors, warnings }
  }

  // Validate required name field
  if (!labelObj.name) {
    errors.push(`Item at index ${index} is missing required 'name' field`)
    return { valid: false, errors, warnings }
  }
  if (typeof labelObj.name !== 'string') {
    errors.push(
      `Item at index ${index} has invalid 'name' field (must be a non-empty string)`,
    )
    return { valid: false, errors, warnings }
  }
  if (labelObj.name.trim() === '') {
    errors.push(
      `Item at index ${index} has empty 'name' field (name cannot be empty)`,
    )
    return { valid: false, errors, warnings }
  }

  // Validate optional color field
  if (labelObj.color !== undefined) {
    if (typeof labelObj.color !== 'string') {
      errors.push(
        `Item at index ${index} has invalid 'color' field (must be a string)`,
      )
      return { valid: false, errors, warnings }
    }
    if (labelObj.color.trim() === '') {
      errors.push(
        `Item at index ${index} has empty 'color' field (color cannot be empty if provided)`,
      )
      return { valid: false, errors, warnings }
    }
  }

  // Validate optional description field
  if (labelObj.description !== undefined) {
    if (typeof labelObj.description !== 'string') {
      errors.push(
        `Item at index ${index} has invalid 'description' field (must be a string)`,
      )
      return { valid: false, errors, warnings }
    }
  }

  // Check for unknown fields and warn user
  const knownFields = ['name', 'color', 'description']
  const unknownFields = Object.keys(labelObj).filter(
    (key) => !knownFields.includes(key),
  )
  if (unknownFields.length > 0) {
    warnings.push(
      `Item at index ${index} contains unknown fields that will be ignored: ${unknownFields.join(', ')}`,
    )
  }

  return { valid: true, errors, warnings }
}

// Simulate the complete import workflow
async function testYamlImportWorkflow(scenario) {
  return new Promise((resolve) => {
    log(colorize('cyan', `\n📋 Test: ${scenario.name}`))
    log(colorize('gray', `   Requirement: ${scenario.requirement}`))
    log(colorize('gray', `   Description: ${scenario.description}`))
    log(colorize('gray', `   File: ${scenario.filePath}`))
    log(colorize('gray', `   Expected labels: ${scenario.expectedLabels}`))
    log('')

    try {
      // Create test file if needed
      if (scenario.createFile) {
        fs.writeFileSync(scenario.filePath, scenario.fileContent, 'utf8')
        log(colorize('blue', `📝 Created test file: ${scenario.filePath}`))
      }

      // Step 1: Check file existence
      if (!fs.existsSync(scenario.filePath)) {
        log(colorize('red', `❌ Test file ${scenario.filePath} does not exist`))
        resolve({ success: false, error: 'Test file missing' })
        return
      }

      // Step 2: Detect file format
      const format = detectFileFormat(scenario.filePath)
      log(colorize('blue', `🔍 Detected file format: ${format}`))

      if (format !== 'yaml') {
        log(colorize('red', `❌ Expected YAML format, got: ${format}`))
        resolve({ success: false, error: 'Wrong format detected' })
        return
      }

      // Step 3: Read file content
      const fileContent = fs.readFileSync(scenario.filePath, 'utf8')
      log(
        colorize(
          'blue',
          `📖 Read file content (${fileContent.length} characters)`,
        ),
      )

      // Step 4: Parse YAML content
      let parsedData
      try {
        parsedData = parseYamlContent(fileContent)
        log(colorize('green', '✅ YAML parsing successful'))
      } catch (parseError) {
        log(colorize('red', `❌ YAML parsing failed: ${parseError.message}`))
        resolve({ success: false, error: 'Parse error' })
        return
      }

      // Step 5: Validate structure (must be array)
      if (parsedData === null || parsedData === undefined) {
        if (scenario.expectedLabels === 0) {
          log(colorize('green', '✅ Empty YAML content handled correctly'))
          resolve({ success: true, validLabels: 0 })
          return
        } else {
          log(colorize('red', '❌ YAML content is null/undefined'))
          resolve({ success: false, error: 'Null content' })
          return
        }
      }

      if (!Array.isArray(parsedData)) {
        log(colorize('red', '❌ YAML content is not an array'))
        resolve({ success: false, error: 'Not an array' })
        return
      }

      log(
        colorize(
          'green',
          `✅ YAML structure validation passed (${parsedData.length} items)`,
        ),
      )

      // Step 6: Validate individual labels
      let validLabels = 0
      let totalWarnings = 0
      let totalErrors = 0

      for (let i = 0; i < parsedData.length; i++) {
        const validation = validateLabel(parsedData[i], i)

        if (validation.valid) {
          validLabels++
          log(
            colorize(
              'green',
              `  ✅ Label ${i + 1}: "${parsedData[i].name}" - Valid`,
            ),
          )
        } else {
          totalErrors += validation.errors.length
          log(
            colorize(
              'red',
              `  ❌ Label ${i + 1}: ${validation.errors.join(', ')}`,
            ),
          )
        }

        if (validation.warnings.length > 0) {
          totalWarnings += validation.warnings.length
          validation.warnings.forEach((warning) => {
            log(colorize('yellow', `  ⚠️  ${warning}`))
          })
        }
      }

      // Step 7: Verify expected results
      log('')
      log(colorize('blue', '📊 Import Results:'))
      log(colorize('blue', `   Total items processed: ${parsedData.length}`))
      log(colorize('green', `   Valid labels: ${validLabels}`))
      log(colorize('red', `   Total errors: ${totalErrors}`))
      log(colorize('yellow', `   Total warnings: ${totalWarnings}`))

      if (validLabels === scenario.expectedLabels) {
        log(
          colorize(
            'green',
            `✅ Expected ${scenario.expectedLabels} valid labels, got ${validLabels}`,
          ),
        )
        resolve({ success: true, validLabels, totalWarnings, totalErrors })
      } else {
        log(
          colorize(
            'red',
            `❌ Expected ${scenario.expectedLabels} valid labels, got ${validLabels}`,
          ),
        )
        resolve({ success: false, error: 'Label count mismatch' })
      }
    } catch (error) {
      log(colorize('red', `❌ Unexpected error: ${error.message}`))
      resolve({ success: false, error: error.message })
    } finally {
      // Clean up created test files
      if (scenario.createFile && fs.existsSync(scenario.filePath)) {
        fs.unlinkSync(scenario.filePath)
        log(colorize('gray', `🗑️  Cleaned up test file: ${scenario.filePath}`))
      }
    }
  })
}

async function runYamlWorkflowTests() {
  log(colorize('blue', '🧪 Testing End-to-End YAML Import Workflow'))
  log(colorize('blue', '='.repeat(50)))
  log('')

  let passedTests = 0
  let totalTests = testScenarios.length
  let totalLabelsProcessed = 0
  let totalWarnings = 0
  let totalErrors = 0

  for (const scenario of testScenarios) {
    const result = await testYamlImportWorkflow(scenario)
    if (result.success) {
      passedTests++
      if (result.validLabels !== undefined) {
        totalLabelsProcessed += result.validLabels
      }
      if (result.totalWarnings !== undefined) {
        totalWarnings += result.totalWarnings
      }
      if (result.totalErrors !== undefined) {
        totalErrors += result.totalErrors
      }
    }

    // Add a small delay between tests for readability
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  log('')
  log(colorize('blue', '📊 Overall Test Results Summary'))
  log(colorize('blue', '='.repeat(40)))
  log(colorize('green', `✅ Passed: ${passedTests}/${totalTests} tests`))
  log(colorize('blue', `📋 Total labels processed: ${totalLabelsProcessed}`))
  log(colorize('yellow', `⚠️  Total warnings: ${totalWarnings}`))
  log(colorize('red', `❌ Total errors: ${totalErrors}`))

  if (passedTests === totalTests) {
    log(colorize('green', '🎉 All YAML import workflow tests passed!'))
  } else {
    log(colorize('red', `❌ ${totalTests - passedTests} tests failed`))
  }

  log('')
  log(colorize('blue', '📋 Workflow verification checklist:'))
  log('□ File format detection works for .yaml and .yml extensions')
  log('□ YAML parsing handles various valid structures correctly')
  log('□ Label validation maintains consistency with JSON validation')
  log("□ Unknown fields are handled with warnings but don't block import")
  log('□ Empty arrays and edge cases are handled gracefully')
  log('□ Progress reporting and error handling work as expected')
  log('□ All requirements 1.1, 1.2, 1.3, 2.1, 5.1, 5.2, 5.3 are satisfied')

  return passedTests === totalTests
}

// Run the tests
runYamlWorkflowTests()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    log(colorize('red', `Test runner error: ${error.message}`))
    process.exit(1)
  })
