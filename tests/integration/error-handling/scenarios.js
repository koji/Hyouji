#!/usr/bin/env node

/**
 * Comprehensive test for error handling scenarios in JSON label import functionality
 * Tests requirements 2.1, 2.2, 2.3, and 2.4 from the spec
 */

import { importLabelsFromJson } from '../../../src/lib/importJson.js';
import chalk from 'chalk';
import fs from 'fs';

const log = console.log;

// Mock configs for testing (won't actually create labels since octokit is null)
const mockConfigs = {
  octokit: null,
  owner: 'test-owner',
  repo: 'test-repo',
};

// Test scenarios covering all sub-tasks
const testScenarios = [
  {
    name: 'Non-existent file paths',
    filePath: 'tests/fixtures/json/non-existent-file.json',
    requirement: '2.1',
    description: 'Should display error message when file is not found',
    expectedError: 'File not found at path',
  },
  {
    name: 'Invalid JSON syntax',
    filePath: 'tests/fixtures/json/invalid-json-syntax.json',
    requirement: '2.2',
    description: 'Should display parsing error message for invalid JSON',
    expectedError: 'Invalid JSON syntax',
  },
  {
    name: 'Invalid data structures (not array)',
    filePath: 'tests/fixtures/json/invalid-structure-not-array.json',
    requirement: '2.3',
    description:
      'Should display format validation error when JSON is not an array',
    expectedError: 'must contain an array of label objects',
  },
  {
    name: 'Missing required fields',
    filePath: 'tests/fixtures/json/missing-required-fields.json',
    requirement: '2.4',
    description: 'Should display validation error for missing required fields',
    expectedError: 'missing required',
  },
  {
    name: 'Invalid field types',
    filePath: 'tests/fixtures/json/invalid-field-types.json',
    requirement: '2.4',
    description: 'Should display validation error for invalid field types',
    expectedError: 'invalid',
  },
];

// Capture console output for testing
let capturedOutput = [];
const originalLog = console.log;

function startCapture() {
  capturedOutput = [];
  console.log = (...args) => {
    capturedOutput.push(args.join(' '));
    originalLog(...args);
  };
}

function stopCapture() {
  console.log = originalLog;
  return capturedOutput.join('\n');
}

async function runErrorHandlingTests() {
  log(chalk.blue('🧪 Testing Error Handling Scenarios for JSON Label Import'));
  log(chalk.blue('='.repeat(60)));
  log('');

  let passedTests = 0;
  let totalTests = testScenarios.length;

  for (let i = 0;i < testScenarios.length;i++) {
    const scenario = testScenarios[i];

    log(chalk.cyan(`Test ${i + 1}: ${scenario.name}`));
    log(chalk.gray(`Requirement: ${scenario.requirement}`));
    log(chalk.gray(`Description: ${scenario.description}`));
    log(chalk.gray(`File: ${scenario.filePath}`));
    log('');

    log(
      chalk.yellow(
        'Expected behavior: Error should be handled gracefully with user-friendly message',
      ),
    );
    log(chalk.yellow('Actual output:'));
    log(chalk.gray('-'.repeat(50)));

    try {
      // Start capturing output
      startCapture();

      // Run the import function
      await importLabelsFromJson(mockConfigs, scenario.filePath);

      // Stop capturing and get output
      const output = stopCapture();

      // Check if the expected error message is present
      const hasExpectedError = output
        .toLowerCase()
        .includes(scenario.expectedError.toLowerCase());

      if (hasExpectedError) {
        log(chalk.green(`✅ Test passed - Expected error message found`));
        passedTests++;
      } else {
        log(chalk.red(`❌ Test failed - Expected error message not found`));
        log(chalk.gray(`   Expected to contain: "${scenario.expectedError}"`));
        log(chalk.gray(`   Actual output: ${output}`));
      }
    } catch (error) {
      stopCapture();
      log(chalk.red(`❌ Test failed with exception: ${error.message}`));
    }

    log(chalk.gray('-'.repeat(50)));
    log('');

    // Add a small delay between tests for readability
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Summary
  log(chalk.blue('📊 Test Results Summary'));
  log(chalk.blue('='.repeat(30)));
  log(chalk.green(`✅ Passed: ${passedTests}/${totalTests} tests`));

  if (passedTests === totalTests) {
    log(chalk.green('🎉 All error handling tests passed!'));
  } else {
    log(chalk.red(`❌ ${totalTests - passedTests} tests failed`));
  }

  log('');
  log(chalk.blue('📋 Manual verification checklist:'));
  log('□ Error messages are user-friendly and informative');
  log("□ Application doesn't crash on any error scenario");
  log(
    '□ Appropriate error types are handled (file not found, JSON parse, validation)',
  );
  log('□ Error messages specify what went wrong and where');
  log('□ Application continues gracefully after errors');
  log('□ All requirements 2.1, 2.2, 2.3, and 2.4 are satisfied');

  return passedTests === totalTests;
}

// Additional test to verify error message quality
async function testErrorMessageQuality() {
  log(chalk.blue('\n🔍 Testing Error Message Quality'));
  log(chalk.blue('='.repeat(40)));

  const qualityTests = [
    {
      name: 'File path included in error message',
      test: async () => {
        startCapture();
        await importLabelsFromJson(mockConfigs, 'non-existent.json');
        const output = stopCapture();
        return output.includes('non-existent.json');
      },
    },
    {
      name: 'Specific validation errors with item indices',
      test: async () => {
        startCapture();
        await importLabelsFromJson(
          mockConfigs,
          'tests/fixtures/json/missing-required-fields.json',
        );
        const output = stopCapture();
        return output.includes('index') && output.includes('missing required');
      },
    },
    {
      name: 'Color-coded error messages',
      test: async () => {
        startCapture();
        await importLabelsFromJson(mockConfigs, 'non-existent.json');
        const output = stopCapture();
        // Check if chalk colors are being used (ANSI escape codes)
        return output.includes('\x1b[') || output.includes('Error:');
      },
    },
  ];

  let qualityPassed = 0;

  for (const test of qualityTests) {
    try {
      const result = await test.test();
      if (result) {
        log(chalk.green(`✅ ${test.name}`));
        qualityPassed++;
      } else {
        log(chalk.red(`❌ ${test.name}`));
      }
    } catch (error) {
      log(chalk.red(`❌ ${test.name} - Error: ${error.message}`));
    }
  }

  log(
    chalk.blue(
      `\nError message quality: ${qualityPassed}/${qualityTests.length} checks passed`,
    ),
  );
  return qualityPassed === qualityTests.length;
}

// Run all tests
async function main() {
  try {
    const basicTestsPass = await runErrorHandlingTests();
    const qualityTestsPass = await testErrorMessageQuality();

    const allTestsPass = basicTestsPass && qualityTestsPass;

    if (allTestsPass) {
      log(chalk.green('\n🎉 All error handling tests completed successfully!'));
      log(
        chalk.blue(
          'The implementation correctly handles all error scenarios with user-friendly messages.',
        ),
      );
    } else {
      log(
        chalk.red('\n❌ Some tests failed. Please review the implementation.'),
      );
    }

    process.exit(allTestsPass ? 0 : 1);
  } catch (error) {
    log(chalk.red(`Test runner error: ${error.message}`));
    process.exit(1);
  }
}

main();
