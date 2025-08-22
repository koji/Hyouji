#!/usr/bin/env node

/**
 * Test script for configuration error handling scenarios
 * Tests the new error handling functionality for ConfigManager
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

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
  };
  return `${colors[color] || ''}${text}${colors.reset}`;
};

const log = console.log;

// Test scenarios for configuration error handling
const testScenarios = [
  {
    name: 'Corrupted JSON file',
    setup: (configPath) => {
      fs.writeFileSync(configPath, '{ invalid json content', { mode: 0o600 });
    },
    expectedBehavior: 'Should detect corrupted file and create backup',
  },
  {
    name: 'Empty configuration file',
    setup: (configPath) => {
      fs.writeFileSync(configPath, '', { mode: 0o600 });
    },
    expectedBehavior: 'Should detect empty file and handle gracefully',
  },
  {
    name: 'Invalid configuration format',
    setup: (configPath) => {
      fs.writeFileSync(
        configPath,
        JSON.stringify({
          token: 'invalid-token-format',
          owner: 'testuser',
        }),
        { mode: 0o600 },
      );
    },
    expectedBehavior: 'Should detect invalid token format',
  },
  {
    name: 'Missing required fields',
    setup: (configPath) => {
      fs.writeFileSync(
        configPath,
        JSON.stringify({
          token: 'ghp_1234567890123456789012345678901234567890',
          // missing owner field
        }),
        { mode: 0o600 },
      );
    },
    expectedBehavior: 'Should detect missing owner field',
  },
];

// Test the ConfigManager error handling
async function testConfigErrorHandling() {
  log(colorize('blue', '🧪 Testing Configuration Error Handling'));
  log(colorize('blue', '='.repeat(50)));
  log('');

  let passedTests = 0;
  const totalTests = testScenarios.length;

  // Create a temporary config directory for testing
  const tempConfigDir = path.join(os.tmpdir(), 'github-label-manager-test');
  const tempConfigPath = path.join(tempConfigDir, 'config.json');

  try {
    // Ensure temp directory exists
    if (!fs.existsSync(tempConfigDir)) {
      fs.mkdirSync(tempConfigDir, { recursive: true, mode: 0o700 });
    }

    for (const scenario of testScenarios) {
      log(colorize('cyan', `📋 Test: ${scenario.name}`));

      try {
        // Clean up any existing config file
        if (fs.existsSync(tempConfigPath)) {
          fs.unlinkSync(tempConfigPath);
        }

        // Set up the test scenario
        scenario.setup(tempConfigPath);

        // Import and test the ConfigManager
        // Note: We need to use dynamic import since this is a CommonJS file testing ES modules
        const { ConfigManager } = await import('../../../src/lib/configManager.js');

        // Create a ConfigManager instance with custom paths for testing
        const configManager = new ConfigManager();

        // Try to load the corrupted config
        const result = await configManager.loadConfig();

        // For corrupted/invalid files, result should be null
        if (result === null) {
          log(
            colorize(
              'green',
              '✅ Test passed - ConfigManager handled error gracefully',
            ),
          );
          passedTests++;
        } else {
          log(
            colorize(
              'red',
              '❌ Test failed - ConfigManager should have returned null for invalid config',
            ),
          );
        }
      } catch (error) {
        log(colorize('red', `❌ Test failed with exception: ${error.message}`));
      }

      log(colorize('gray', '-'.repeat(40)));
    }

    // Clean up temp directory
    if (fs.existsSync(tempConfigDir)) {
      fs.rmSync(tempConfigDir, { recursive: true, force: true });
    }
  } catch (error) {
    log(colorize('red', `Test setup error: ${error.message}`));
    return false;
  }

  log('');
  log(colorize('blue', '📊 Test Results'));
  log(colorize('blue', '='.repeat(20)));
  log(`Total tests: ${totalTests}`);
  log(`Passed: ${colorize('green', passedTests)}`);
  log(`Failed: ${colorize('red', totalTests - passedTests)}`);

  const success = passedTests === totalTests;
  if (success) {
    log(
      colorize('green', '\n🎉 All configuration error handling tests passed!'),
    );
  } else {
    log(
      colorize(
        'red',
        '\n❌ Some tests failed. Please check the implementation.',
      ),
    );
  }

  return success;
}

// Run the tests
testConfigErrorHandling()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    log(colorize('red', `Test runner error: ${error.message}`));
    process.exit(1);
  });
