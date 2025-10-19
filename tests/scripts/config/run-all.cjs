#!/usr/bin/env node

/**
 * Configuration Test Runner
 * Executes all configuration tests and provides consolidated reporting
 * Handles both validation and error scenario tests
 * Requirements: 3.1, 3.3
 */

const { spawn } = require("child_process");

// ANSI color codes for output formatting
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  reset: "\x1b[0m",
};

function colorize(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

const log = console.log;

// Configuration test files to execute
const configurationTests = [
  {
    name: "Configuration Error Handling",
    file: "tests/integration/config/error-handling.cjs",
    description: "Tests error handling scenarios for configuration management",
    type: "error-handling",
    requirements: [
      "Configuration error recovery",
      "User-friendly error messages",
    ],
  },
  {
    name: "Configuration Validation",
    file: "tests/integration/config/validation.mjs",
    description: "Tests configuration validation and error message generation",
    type: "validation",
    requirements: [
      "Config validation",
      "Error message quality",
      "Recoverable error detection",
    ],
  },
];

// Execute a single test file
function executeTest(test) {
  return new Promise((resolve) => {
    log(colorize("cyan", `\n🧪 Running: ${test.name}`));
    log(colorize("gray", `   File: ${test.file}`));
    log(colorize("gray", `   Type: ${test.type}`));
    log(colorize("gray", `   Description: ${test.description}`));
    log(colorize("gray", `   Requirements: ${test.requirements.join(", ")}`));
    log(colorize("gray", "=".repeat(60)));

    const _isESModule = test.file.endsWith(".mjs");
    const command = "node";
    const args = [test.file];

    const child = spawn(command, args, {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    child.on("close", (code) => {
      const success = code === 0;
      if (success) {
        log(colorize("green", `✅ ${test.name} - PASSED`));
      } else {
        log(colorize("red", `❌ ${test.name} - FAILED (exit code: ${code})`));
      }
      resolve({ test, success, exitCode: code });
    });

    child.on("error", (error) => {
      log(colorize("red", `❌ ${test.name} - ERROR: ${error.message}`));
      resolve({ test, success: false, error: error.message });
    });
  });
}

// Execute individual test (when specific test is requested)
async function executeIndividualTest(testName) {
  const test = configurationTests.find(
    (t) =>
      t.name.toLowerCase().includes(testName.toLowerCase()) ||
      t.file.includes(testName) ||
      t.type.toLowerCase().includes(testName.toLowerCase())
  );

  if (!test) {
    log(colorize("red", `❌ Test not fstName}`));
    log(colorize("yellow", "Available tests:"));
    configurationTests.forEach((t, index) => {
      log(
        colorize("gray", `  ${index + 1}. ${t.name} (${t.type}) - ${t.file}`)
      );
    });
    return false;
  }

  log(colorize("blue", "🎯 Running Individual Configuration Test"));
  log(colorize("blue", "=".repeat(50)));

  const result = await executeTest(test);
  return result.success;
}

// Execute tests by type
async function executeTestsByType(type) {
  const testsOfType = configurationTests.filter(
    (t) => t.type.toLowerCase() === type.toLowerCase()
  );

  if (testsOfType.length === 0) {
    log(colorize("red", `❌ No tests found for type: ${type}`));
    log(colorize("yellow", "Available types:"));
    const types = [...new Set(configurationTests.map((t) => t.type))];
    types.forEach((t) => {
      log(colorize("gray", `  • ${t}`));
    });
    return false;
  }

  log(colorize("blue", `🎯 Running ${type} Configuration Tests`));
  log(colorize("blue", "=".repeat(50)));

  let allPassed = true;
  for (const test of testsOfType) {
    const result = await executeTest(test);
    if (!result.success) {
      allPassed = false;
    }
    log("");
  }

  return allPassed;
}

// Execute all configuration tests
async function executeAllTests() {
  log(colorize("blue", "🧪 Configuration Test Suite"));
  log(colorize("blue", "=".repeat(50)));
  log(
    colorize(
      "gray",
      "Executing all configuration tests with consolidated reporting"
    )
  );
  log("");

  const results = [];
  let totalTests = configurationTests.length;
  let passedTests = 0;

  for (const test of configurationTests) {
    const result = await executeTest(test);
    results.push(result);

    if (result.success) {
      passedTests++;
    }

    // Add spacing between tests
    log("");
  }

  // Consolidated reporting
  log(colorize("blue", "📊 Consolidated Test Results"));
  log(colorize("blue", "=".repeat(40)));
  log("");

  // Group results by type
  const resultsByType = {};
  results.forEach((result) => {
    const type = result.test.type;
    if (!resultsByType[type]) {
      resultsByType[type] = [];
    }
    resultsByType[type].push(result);
  });

  // Report by type
  Object.keys(resultsByType).forEach((type) => {
    log(colorize("cyan", `📋 ${type.toUpperCase()} Tests:`));
    resultsByType[type].forEach((result, index) => {
      const status = result.success
        ? colorize("green", "✅ PASSED")
        : colorize("red", "❌ FAILED");

      log(`  ${index + 1}. ${result.test.name} - ${status}`);

      if (!result.success) {
        if (result.error) {
          log(colorize("gray", `     Error: ${result.error}`));
        } else if (result.exitCode) {
          log(colorize("gray", `     Exit code: ${result.exitCode}`));
        }
      }
    });
    log("");
  });

  log(colorize("blue", "📈 Summary"));
  log(colorize("blue", "=".repeat(20)));
  log(colorize("green", `✅ Passed: ${passedTests}/${totalTests} tests`));

  if (passedTests < totalTests) {
    log(
      colorize(
        "red",
        `❌ Failed: ${totalTests - passedTests}/${totalTests} tests`
      )
    );
  }

  const successRate = Math.round((passedTests / totalTests) * 100);
  log(colorize("blue", `📊 Success Rate: ${successRate}%`));

  if (passedTests === totalTests) {
    log("");
    log(colorize("green", "🎉 All configuration tests passed!"));
    log(colorize("blue", "✅ Test categories completed:"));
    log(colorize("gray", "  • Configuration error handling scenarios"));
    log(colorize("gray", "  • Configuration validation tests"));
    log(colorize("gray", "  • Error message quality verification"));
    log(colorize("gray", "  • Recoverable error detection"));
  } else {
    log("");
    log(
      colorize(
        "yellow",
        "⚠️  Some tests failed. Please review the output above."
      )
    );
  }

  return passedTests === totalTests;
}

// Display help information
function displayHelp() {
  log(colorize("blue", "🔧 Configuration Test Runner Help"));
  log(colorize("blue", "=".repeat(40)));
  log("");
  log(colorize("yellow", "Usage:"));
  log("  node tests/scripts/config/run-all.cjs [options]");
  log("");
  log(colorize("yellow", "Options:"));
  log("  --help, -h          Show this help message");
  log("  --type <type>       Run tests of specific type");
  log("  --test <name>       Run specific test by name");
  log("  --list             List all available tests");
  log("");
  log(colorize("yellow", "Examples:"));
  log("  node tests/scripts/config/run-all.cjs");
  log("  node tests/scripts/config/run-all.cjs --type validation");
  log('  node tests/scripts/config/run-all.cjs --test "error handling"');
  log("  node tests/scripts/config/run-all.cjs --list");
}

// List all available tests
function listTests() {
  log(colorize("blue", "📋 Available Configuration Tests"));
  log(colorize("blue", "=".repeat(40)));
  log("");

  const typeGroups = {};
  configurationTests.forEach((test) => {
    if (!typeGroups[test.type]) {
      typeGroups[test.type] = [];
    }
    typeGroups[test.type].push(test);
  });

  Object.keys(typeGroups).forEach((type) => {
    log(colorize("cyan", `📂 ${type.toUpperCase()}:`));
    typeGroups[type].forEach((test, index) => {
      log(colorize("gray", `  ${index + 1}. ${test.name}`));
      log(colorize("gray", `     File: ${test.file}`));
      log(colorize("gray", `     Description: ${test.description}`));
      log("");
    });
  });
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  if (args.includes("--help") || args.includes("-h")) {
    displayHelp();
    return;
  }

  if (args.includes("--list")) {
    listTests();
    return;
  }

  const typeIndex = args.indexOf("--type");
  if (typeIndex !== -1 && typeIndex + 1 < args.length) {
    const type = args[typeIndex + 1];
    const success = await executeTestsByType(type);
    process.exit(success ? 0 : 1);
    return;
  }

  const testIndex = args.indexOf("--test");
  if (testIndex !== -1 && testIndex + 1 < args.length) {
    const testName = args[testIndex + 1];
    const success = await executeIndividualTest(testName);
    process.exit(success ? 0 : 1);
    return;
  }

  // Run all tests by default
  const success = await executeAllTests();
  process.exit(success ? 0 : 1);
}

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  log(colorize("red", `❌ Uncaught error: ${error.message}`));
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  log(colorize("red", `❌ Unhandled rejection: ${reason}`));
  process.exit(1);
});

main().catch((error) => {
  log(colorize("red", `❌ Test runner error: ${error.message}`));
  process.exit(1);
});
