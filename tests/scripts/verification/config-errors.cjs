#!/usr/bin/env node

/**
 * Manual verification script for configuration error handling
 * This script creates test scenarios and verifies the error handling works
 */

const fs = require('fs')
const path = require('path')
const os = require('os')

// Color functions for output
const colorize = (color, text) => {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
    reset: '\x1b[0m',
  }
  return `${colors[color] || ''}${text}${colors.reset}`
}

const log = console.log

// Create test configuration files to verify error handling
function createTestScenarios() {
  log(
    colorize(
      'blue',
      '🧪 Creating Test Scenarios for Configuration Error Handling',
    ),
  )
  log(colorize('blue', '='.repeat(60)))
  log('')

  const testDir = path.join(os.tmpdir(), 'github-label-manager-error-test')

  // Ensure test directory exists
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true, mode: 0o700 })
  }

  const scenarios = [
    {
      name: 'Corrupted JSON file',
      filename: 'corrupted-config.json',
      content:
        '{ "token": "ghp_1234567890123456789012345678901234567890", "owner": "testuser"',
      description: 'Missing closing brace - should trigger JSON parse error',
    },
    {
      name: 'Empty configuration file',
      filename: 'empty-config.json',
      content: '',
      description: 'Empty file - should trigger empty file error',
    },
    {
      name: 'Invalid token format',
      filename: 'invalid-token-config.json',
      content: JSON.stringify({
        token: 'invalid-token-format',
        owner: 'testuser',
        lastUpdated: new Date().toISOString(),
      }),
      description: 'Invalid token format - should trigger validation error',
    },
    {
      name: 'Missing owner field',
      filename: 'missing-owner-config.json',
      content: JSON.stringify({
        token: 'ghp_1234567890123456789012345678901234567890',
        lastUpdated: new Date().toISOString(),
      }),
      description: 'Missing owner field - should trigger validation error',
    },
    {
      name: 'Valid configuration',
      filename: 'valid-config.json',
      content: JSON.stringify({
        token: 'ghp_1234567890123456789012345678901234567890',
        owner: 'testuser',
        lastUpdated: new Date().toISOString(),
      }),
      description: 'Valid configuration - should pass validation',
    },
  ]

  scenarios.forEach((scenario) => {
    const filePath = path.join(testDir, scenario.filename)
    fs.writeFileSync(filePath, scenario.content, { mode: 0o600 })

    log(colorize('cyan', `✓ Created: ${scenario.name}`))
    log(colorize('gray', `  File: ${filePath}`))
    log(colorize('gray', `  Description: ${scenario.description}`))
    log('')
  })

  log(colorize('green', '✅ All test scenarios created successfully!'))
  log(colorize('blue', `Test directory: ${testDir}`))
  log('')

  return { testDir, scenarios }
}

// Provide manual verification instructions
function provideVerificationInstructions(testDir, scenarios) {
  log(colorize('blue', '📋 Manual Verification Instructions'))
  log(colorize('blue', '='.repeat(40)))
  log('')

  log(colorize('yellow', 'To manually verify the error handling:'))
  log('')

  log(
    '1. Copy one of the test configuration files to your actual config location:',
  )
  log(colorize('gray', '   ~/.config/github-label-manager/config.json'))
  log('   or')
  log(colorize('gray', '   ~/.github-label-manager-config.json'))
  log('')

  log('2. Run the application:')
  log(colorize('cyan', '   npm run build && node dist/index.js'))
  log('')

  log('3. Observe the error handling behavior for each scenario:')
  log('')

  scenarios.forEach((scenario, index) => {
    log(colorize('cyan', `   ${index + 1}. ${scenario.name}:`))
    log(
      colorize('gray', `      File: ${path.join(testDir, scenario.filename)}`),
    )
    log(colorize('gray', `      Expected: ${scenario.description}`))
    log('')
  })

  log(colorize('yellow', 'Expected behaviors:'))
  log(
    '• Corrupted JSON: Should show warning about corrupted file and create backup',
  )
  log('• Empty file: Should show warning about empty file')
  log(
    '• Invalid token: Should show validation error and prompt for new credentials',
  )
  log(
    '• Missing owner: Should show validation error and prompt for new credentials',
  )
  log(
    '• Valid config: Should load successfully (but may fail API validation without real token)',
  )
  log('')

  log(colorize('green', '✅ Verification instructions provided!'))
}

// Clean up test files
function cleanupTestFiles(testDir) {
  log(colorize('blue', '🧹 Cleaning up test files...'))

  try {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
      log(colorize('green', '✅ Test files cleaned up successfully!'))
    }
  } catch (error) {
    log(colorize('red', `❌ Failed to clean up test files: ${error.message}`))
  }
}

// Main function
function main() {
  log(colorize('blue', '🚀 Configuration Error Handling Verification'))
  log(colorize('blue', '='.repeat(50)))
  log('')

  const { testDir, scenarios } = createTestScenarios()
  provideVerificationInstructions(testDir, scenarios)

  log(
    colorize(
      'yellow',
      'Note: Test files will remain in the temp directory for manual testing.',
    ),
  )
  log(colorize('yellow', 'Run this script with --cleanup to remove them.'))

  // Check if cleanup was requested
  if (process.argv.includes('--cleanup')) {
    cleanupTestFiles(testDir)
  }
}

// Run the script
main()
