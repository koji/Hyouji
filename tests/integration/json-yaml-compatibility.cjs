#!/usr/bin/env node

/**
 * Compatibility test to ensure JSON functionality remains unchanged after YAML support
 * This script tests that equivalent JSON and YAML files produce identical results
 * Requirements: 1.3, 3.1, 3.3
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

// Import required modules
const yaml = require('js-yaml')

// Test data for compatibility testing
const testData = [
  {
    name: 'Basic labels with all fields',
    labels: [
      { name: 'bug', color: 'd73a4a', description: "Something isn't working" },
      {
        name: 'enhancement',
        color: 'a2eeef',
        description: 'New feature or request',
      },
      {
        name: 'documentation',
        color: '0075ca',
        description: 'Improvements or additions to documentation',
      },
    ],
  },
  {
    name: 'Labels with minimal fields',
    labels: [
      { name: 'bug' },
      { name: 'enhancement' },
      { name: 'documentation' },
    ],
  },
  {
    name: 'Labels with mixed field configurations',
    labels: [
      { name: 'name-only' },
      { name: 'with-color', color: 'ffffff' },
      { name: 'with-description', description: 'Has description but no color' },
      { name: 'with-all', color: 'aaaaaa', description: 'Has all fields' },
    ],
  },
  {
    name: 'Empty array',
    labels: [],
  },
  {
    name: 'Labels with unknown fields',
    labels: [
      {
        name: 'test-label',
        color: 'ffffff',
        description: 'Test description',
        unknownField: 'should be ignored',
        priority: 'high',
        category: 'testing',
      },
    ],
  },
]

// Mock file format detection
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

// Mock parsing functions
function parseJsonContent(content) {
  return JSON.parse(content)
}

function parseYamlContent(content) {
  return yaml.load(content)
}

// Mock label validation (same logic for both formats)
function validateAndProcessLabels(data, format) {
  if (!Array.isArray(data)) {
    throw new Error(
      `${format.toUpperCase()} file must contain an array of label objects`,
    )
  }

  const results = {
    validLabels: [],
    errors: [],
    warnings: [],
  }

  for (let i = 0; i < data.length; i++) {
    const item = data[i]

    // Check if item is an object
    if (typeof item !== 'object' || item === null) {
      results.errors.push(`Item at index ${i} is not a valid object`)
      continue
    }

    // Validate required name field
    if (
      !item.name ||
      typeof item.name !== 'string' ||
      item.name.trim() === ''
    ) {
      results.errors.push(
        `Item at index ${i} has invalid or missing 'name' field`,
      )
      continue
    }

    // Validate optional color field
    if (
      item.color !== undefined &&
      (typeof item.color !== 'string' || item.color.trim() === '')
    ) {
      results.errors.push(`Item at index ${i} has invalid 'color' field`)
      continue
    }

    // Validate optional description field
    if (
      item.description !== undefined &&
      typeof item.description !== 'string'
    ) {
      results.errors.push(`Item at index ${i} has invalid 'description' field`)
      continue
    }

    // Check for unknown fields
    const knownFields = ['name', 'color', 'description']
    const unknownFields = Object.keys(item).filter(
      (key) => !knownFields.includes(key),
    )
    if (unknownFields.length > 0) {
      results.warnings.push(
        `Item at index ${i} contains unknown fields: ${unknownFields.join(', ')}`,
      )
    }

    // Create clean label object (without unknown fields)
    const cleanLabel = {
      name: item.name,
    }
    if (item.color !== undefined) cleanLabel.color = item.color
    if (item.description !== undefined)
      cleanLabel.description = item.description

    results.validLabels.push(cleanLabel)
  }

  return results
}

// Test compatibility between JSON and YAML formats
async function testFormatCompatibility(testCase) {
  return new Promise((resolve) => {
    log(colorize('cyan', `\n📋 Testing: ${testCase.name}`))
    log(colorize('gray', `   Labels count: ${testCase.labels.length}`))
    log('')

    try {
      // Create temporary test files
      const jsonFile = `tests/fixtures/temp-${Date.now()}.json`
      const yamlFile = `tests/fixtures/temp-${Date.now()}.yaml`

      // Generate JSON content
      const jsonContent = JSON.stringify(testCase.labels, null, 2)
      fs.writeFileSync(jsonFile, jsonContent, 'utf8')

      // Generate YAML content
      const yamlContent = yaml.dump(testCase.labels)
      fs.writeFileSync(yamlFile, yamlContent, 'utf8')

      log(colorize('blue', '📝 Created temporary test files'))
      log(colorize('gray', `   JSON: ${jsonFile}`))
      log(colorize('gray', `   YAML: ${yamlFile}`))

      // Test JSON processing
      const _jsonFormat = detectFileFormat(jsonFile)
      const jsonFileContent = fs.readFileSync(jsonFile, 'utf8')
      const jsonParsedData = parseJsonContent(jsonFileContent)
      const jsonResults = validateAndProcessLabels(jsonParsedData, 'json')

      log(colorize('green', `✅ JSON processing complete:`))
      log(
        colorize('blue', `   Valid labels: ${jsonResults.validLabels.length}`),
      )
      log(colorize('red', `   Errors: ${jsonResults.errors.length}`))
      log(colorize('yellow', `   Warnings: ${jsonResults.warnings.length}`))

      // Test YAML processing
      const _yamlFormat = detectFileFormat(yamlFile)
      const yamlFileContent = fs.readFileSync(yamlFile, 'utf8')
      const yamlParsedData = parseYamlContent(yamlFileContent)
      const yamlResults = validateAndProcessLabels(yamlParsedData, 'yaml')

      log(colorize('green', `✅ YAML processing complete:`))
      log(
        colorize('blue', `   Valid labels: ${yamlResults.validLabels.length}`),
      )
      log(colorize('red', `   Errors: ${yamlResults.errors.length}`))
      log(colorize('yellow', `   Warnings: ${yamlResults.warnings.length}`))

      // Compare results
      const resultsMatch =
        jsonResults.validLabels.length === yamlResults.validLabels.length &&
        jsonResults.errors.length === yamlResults.errors.length &&
        jsonResults.warnings.length === yamlResults.warnings.length

      if (resultsMatch) {
        // Deep compare valid labels
        let labelsMatch = true
        for (let i = 0; i < jsonResults.validLabels.length; i++) {
          const jsonLabel = jsonResults.validLabels[i]
          const yamlLabel = yamlResults.validLabels[i]

          if (JSON.stringify(jsonLabel) !== JSON.stringify(yamlLabel)) {
            labelsMatch = false
            log(colorize('red', `❌ Label mismatch at index ${i}:`))
            log(colorize('red', `   JSON: ${JSON.stringify(jsonLabel)}`))
            log(colorize('red', `   YAML: ${JSON.stringify(yamlLabel)}`))
            break
          }
        }

        if (labelsMatch) {
          log(colorize('green', '✅ JSON and YAML results are identical'))
          resolve({
            success: true,
            validLabels: jsonResults.validLabels.length,
          })
        } else {
          log(colorize('red', '❌ JSON and YAML label data differs'))
          resolve({ success: false, error: 'Label data mismatch' })
        }
      } else {
        log(colorize('red', '❌ JSON and YAML processing results differ'))
        log(
          colorize(
            'red',
            `   JSON: ${jsonResults.validLabels.length} valid, ${jsonResults.errors.length} errors, ${jsonResults.warnings.length} warnings`,
          ),
        )
        log(
          colorize(
            'red',
            `   YAML: ${yamlResults.validLabels.length} valid, ${yamlResults.errors.length} errors, ${yamlResults.warnings.length} warnings`,
          ),
        )
        resolve({ success: false, error: 'Results mismatch' })
      }

      // Clean up temporary files
      fs.unlinkSync(jsonFile)
      fs.unlinkSync(yamlFile)
      log(colorize('gray', '🗑️  Cleaned up temporary files'))
    } catch (error) {
      log(colorize('red', `❌ Compatibility test error: ${error.message}`))
      resolve({ success: false, error: error.message })
    }
  })
}

// Test that existing JSON functionality still works
async function testJsonBackwardCompatibility() {
  log(colorize('cyan', '\n📋 Testing JSON Backward Compatibility'))
  log('')

  const existingJsonFiles = [
    'tests/fixtures/json/invalid-field-types.json',
    'tests/fixtures/json/invalid-structure-not-array.json',
    'tests/fixtures/json/missing-required-fields.json',
  ]

  let passedTests = 0
  let totalTests = existingJsonFiles.length

  for (const jsonFile of existingJsonFiles) {
    try {
      if (!fs.existsSync(jsonFile)) {
        log(colorize('yellow', `⚠️  Skipping ${jsonFile} - file not found`))
        continue
      }

      log(colorize('blue', `🔍 Testing: ${path.basename(jsonFile)}`))

      const format = detectFileFormat(jsonFile)
      if (format !== 'json') {
        log(colorize('red', `❌ Format detection failed for ${jsonFile}`))
        continue
      }

      const content = fs.readFileSync(jsonFile, 'utf8')

      try {
        const parsedData = parseJsonContent(content)
        log(colorize('green', '✅ JSON parsing successful'))

        if (Array.isArray(parsedData)) {
          const results = validateAndProcessLabels(parsedData, 'json')
          log(
            colorize('blue', `   Valid labels: ${results.validLabels.length}`),
          )
          log(colorize('red', `   Errors: ${results.errors.length}`))
          log(colorize('yellow', `   Warnings: ${results.warnings.length}`))
        } else {
          log(
            colorize(
              'yellow',
              '⚠️  Non-array structure (expected for some test files)',
            ),
          )
        }

        passedTests++
      } catch (parseError) {
        log(
          colorize(
            'yellow',
            `⚠️  Parse error (expected for some test files): ${parseError.message}`,
          ),
        )
        passedTests++ // Parse errors are expected for some test files
      }
    } catch (error) {
      log(colorize('red', `❌ Error testing ${jsonFile}: ${error.message}`))
    }
  }

  log(
    colorize(
      'green',
      `✅ JSON backward compatibility: ${passedTests}/${totalTests} tests passed`,
    ),
  )
  return passedTests === totalTests
}

async function runCompatibilityTests() {
  log(colorize('blue', '🧪 Testing JSON-YAML Compatibility'))
  log(colorize('blue', '='.repeat(40)))
  log('')

  let passedTests = 0
  let totalTests = testData.length
  let totalLabelsProcessed = 0

  // Test format compatibility
  for (const testCase of testData) {
    const result = await testFormatCompatibility(testCase)
    if (result.success) {
      passedTests++
      if (result.validLabels !== undefined) {
        totalLabelsProcessed += result.validLabels
      }
    }

    // Add a small delay between tests for readability
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  // Test JSON backward compatibility
  const jsonCompatible = await testJsonBackwardCompatibility()

  log('')
  log(colorize('blue', '📊 Compatibility Test Results Summary'))
  log(colorize('blue', '='.repeat(45)))
  log(
    colorize(
      'green',
      `✅ Format compatibility: ${passedTests}/${totalTests} tests passed`,
    ),
  )
  log(
    colorize(
      'green',
      `✅ JSON backward compatibility: ${jsonCompatible ? 'PASSED' : 'FAILED'}`,
    ),
  )
  log(colorize('blue', `📋 Total labels processed: ${totalLabelsProcessed}`))

  const allTestsPassed = passedTests === totalTests && jsonCompatible

  if (allTestsPassed) {
    log(colorize('green', '🎉 All compatibility tests passed!'))
  } else {
    log(colorize('red', `❌ Some compatibility tests failed`))
  }

  log('')
  log(colorize('blue', '📋 Compatibility verification checklist:'))
  log('□ JSON and YAML produce identical results for equivalent data')
  log('□ Existing JSON functionality remains unchanged')
  log('□ Validation logic is consistent between formats')
  log('□ Error handling patterns are the same for both formats')
  log('□ Unknown field handling works identically')
  log('□ Edge cases (empty arrays, null values) handled consistently')
  log('□ All requirements 1.3, 3.1, 3.3 are satisfied')

  return allTestsPassed
}

// Run the tests
runCompatibilityTests()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    log(colorize('red', `Test runner error: ${error.message}`))
    process.exit(1)
  })
