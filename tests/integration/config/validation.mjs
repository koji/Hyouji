#!/usr/bin/env node

/**
 * Test script for configuration validation and error handling
 * Tests the ConfigManager error handling functionality
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  ConfigManager,
  ConfigError,
  ConfigErrorType,
} from '../../../src/lib/configManager.ts';

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

// Test configuration validation
async function testConfigValidation() {
  log(colorize('blue', '🧪 Testing Configuration Validation'));
  log(colorize('blue', '='.repeat(40)));
  log('');

  const configManager = new ConfigManager();
  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Valid configuration
  totalTests++;
  const validConfig = {
    token: 'ghp_1234567890123456789012345678901234567890',
    owner: 'testuser',
    lastUpdated: new Date().toISOString(),
  };

  try {
    const isValid = await configManager.validateConfig(validConfig);
    if (isValid) {
      log(colorize('green', '✅ Valid configuration test passed'));
      passedTests++;
    } else {
      log(colorize('red', '❌ Valid configuration test failed'));
    }
  } catch (error) {
    log(
      colorize(
        'red',
        `❌ Valid configuration test failed with error: ${error.message}`,
      ),
    );
  }

  // Test 2: Invalid token format
  totalTests++;
  const invalidTokenConfig = {
    token: 'invalid-token-format',
    owner: 'testuser',
    lastUpdated: new Date().toISOString(),
  };

  try {
    const isValid = await configManager.validateConfig(invalidTokenConfig);
    if (!isValid) {
      log(colorize('green', '✅ Invalid token format test passed'));
      passedTests++;
    } else {
      log(
        colorize(
          'red',
          '❌ Invalid token format test failed - should have been invalid',
        ),
      );
    }
  } catch (error) {
    log(
      colorize(
        'red',
        `❌ Invalid token format test failed with error: ${error.message}`,
      ),
    );
  }

  // Test 3: Missing owner field
  totalTests++;
  const missingOwnerConfig = {
    token: 'ghp_1234567890123456789012345678901234567890',
    lastUpdated: new Date().toISOString(),
  };

  try {
    const isValid = await configManager.validateConfig(missingOwnerConfig);
    if (!isValid) {
      log(colorize('green', '✅ Missing owner field test passed'));
      passedTests++;
    } else {
      log(
        colorize(
          'red',
          '❌ Missing owner field test failed - should have been invalid',
        ),
      );
    }
  } catch (error) {
    log(
      colorize(
        'red',
        `❌ Missing owner field test failed with error: ${error.message}`,
      ),
    );
  }

  // Test 4: Empty token
  totalTests++;
  const emptyTokenConfig = {
    token: '',
    owner: 'testuser',
    lastUpdated: new Date().toISOString(),
  };

  try {
    const isValid = await configManager.validateConfig(emptyTokenConfig);
    if (!isValid) {
      log(colorize('green', '✅ Empty token test passed'));
      passedTests++;
    } else {
      log(
        colorize(
          'red',
          '❌ Empty token test failed - should have been invalid',
        ),
      );
    }
  } catch (error) {
    log(
      colorize(
        'red',
        `❌ Empty token test failed with error: ${error.message}`,
      ),
    );
  }

  log('');
  log(colorize('blue', '📊 Validation Test Results'));
  log(colorize('blue', '='.repeat(30)));
  log(`Total tests: ${totalTests}`);
  log(`Passed: ${colorize('green', passedTests)}`);
  log(`Failed: ${colorize('red', totalTests - passedTests)}`);

  return passedTests === totalTests;
}

// Test error message generation
function testErrorMessages() {
  log(colorize('blue', '\n🧪 Testing Error Messages'));
  log(colorize('blue', '='.repeat(30)));
  log('');

  let passedTests = 0;
  let totalTests = 0;

  const errorTypes = [
    ConfigErrorType.FILE_NOT_FOUND,
    ConfigErrorType.PERMISSION_DENIED,
    ConfigErrorType.CORRUPTED_FILE,
    ConfigErrorType.INVALID_FORMAT,
    ConfigErrorType.NETWORK_ERROR,
    ConfigErrorType.UNKNOWN_ERROR,
  ];

  for (const errorType of errorTypes) {
    totalTests++;
    try {
      const error = new ConfigError(errorType, 'Test error message');
      const userMessage = ConfigManager.getErrorMessage(error);

      if (userMessage && userMessage.length > 0) {
        log(
          colorize('green', `✅ ${errorType} error message: "${userMessage}"`),
        );
        passedTests++;
      } else {
        log(colorize('red', `❌ ${errorType} error message is empty`));
      }
    } catch (error) {
      log(
        colorize(
          'red',
          `❌ ${errorType} error message test failed: ${error.message}`,
        ),
      );
    }
  }

  log('');
  log(colorize('blue', '📊 Error Message Test Results'));
  log(colorize('blue', '='.repeat(35)));
  log(`Total tests: ${totalTests}`);
  log(`Passed: ${colorize('green', passedTests)}`);
  log(`Failed: ${colorize('red', totalTests - passedTests)}`);

  return passedTests === totalTests;
}

// Test recoverable error detection
function testRecoverableErrors() {
  log(colorize('blue', '\n🧪 Testing Recoverable Error Detection'));
  log(colorize('blue', '='.repeat(45)));
  log('');

  let passedTests = 0;
  let totalTests = 0;

  const recoverableErrors = [
    ConfigErrorType.FILE_NOT_FOUND,
    ConfigErrorType.CORRUPTED_FILE,
    ConfigErrorType.INVALID_FORMAT,
  ];

  const nonRecoverableErrors = [
    ConfigErrorType.PERMISSION_DENIED,
    ConfigErrorType.NETWORK_ERROR,
    ConfigErrorType.UNKNOWN_ERROR,
  ];

  // Test recoverable errors
  for (const errorType of recoverableErrors) {
    totalTests++;
    const error = new ConfigError(errorType, 'Test error');
    if (ConfigManager.isRecoverableError(error)) {
      log(
        colorize(
          'green',
          `✅ ${errorType} correctly identified as recoverable`,
        ),
      );
      passedTests++;
    } else {
      log(colorize('red', `❌ ${errorType} should be recoverable`));
    }
  }

  // Test non-recoverable errors
  for (const errorType of nonRecoverableErrors) {
    totalTests++;
    const error = new ConfigError(errorType, 'Test error');
    if (!ConfigManager.isRecoverableError(error)) {
      log(
        colorize(
          'green',
          `✅ ${errorType} correctly identified as non-recoverable`,
        ),
      );
      passedTests++;
    } else {
      log(colorize('red', `❌ ${errorType} should be non-recoverable`));
    }
  }

  log('');
  log(colorize('blue', '📊 Recoverable Error Test Results'));
  log(colorize('blue', '='.repeat(40)));
  log(`Total tests: ${totalTests}`);
  log(`Passed: ${colorize('green', passedTests)}`);
  log(`Failed: ${colorize('red', totalTests - passedTests)}`);

  return passedTests === totalTests;
}

// Main test runner
async function runTests() {
  log(colorize('blue', '🚀 Configuration Error Handling Test Suite'));
  log(colorize('blue', '='.repeat(50)));
  log('');

  const validationTestsPass = await testConfigValidation();
  const errorMessageTestsPass = testErrorMessages();
  const recoverableTestsPass = testRecoverableErrors();

  const allTestsPass =
    validationTestsPass && errorMessageTestsPass && recoverableTestsPass;

  log('');
  log(colorize('blue', '🏁 Final Results'));
  log(colorize('blue', '='.repeat(20)));
  log(
    `Validation tests: ${validationTestsPass ? colorize('green', 'PASS') : colorize('red', 'FAIL')}`,
  );
  log(
    `Error message tests: ${errorMessageTestsPass ? colorize('green', 'PASS') : colorize('red', 'FAIL')}`,
  );
  log(
    `Recoverable error tests: ${recoverableTestsPass ? colorize('green', 'PASS') : colorize('red', 'FAIL')}`,
  );

  if (allTestsPass) {
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

  return allTestsPass;
}

// Run the tests
runTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    log(colorize('red', `Test runner error: ${error.message}`));
    process.exit(1);
  });
