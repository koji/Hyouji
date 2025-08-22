#!/usr/bin/env node

/**
 * Verification Test Runner
 * Executes all verification scripts and provides consolidated reporting
 * Requirements: 3.1, 3.3
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for output formatting
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  reset: '\x1b[0m',
};

function colorize(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

const log = console.log;

// Verification scripts to execute
const verificationScripts = [
  {
    name: 'Configuration Error Verification',
    file: 'tests/scripts/verification/config-errors.cjs',
    description: 'Manual verification script for configuration error handling scenarios',
    type: 'config',
    requirements: ['Configuration error handling', 'User-friendly error messages'],
    interactive: true,
  },
  {
    name: 'Implementation Verification',
    file: 'tests/scripts/verification/implementation.cjs',
    description: 'Verifies the actual implementation code and build output',
    type: 'implementation',
    requirements: ['Code quality', 'Build verification', 'Test data availability'],
    interactive: false,
  },
];

// Discover additional verification scripts
function discoverVerificationScripts() {
  const verificationDir = 'tests/scripts/verification';
  const discoveredScripts = [];

  if (!fs.existsSync(verificationDir)) {
    return discoveredScripts;
  }

  const items = fs.readdirSync(verificationDir);

  for (const item of items) {
    const fullPath = path.join(verificationDir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.cjs') || item.endsWith('.mjs'))) {
      // Skip .gitkeep files and already included scripts
      if (item === '.gitkeep' || item === 'run-all.cjs') continue;

      const alreadyIncluded = verificationScripts.some(script => script.file === fullPath);

      if (!alreadyIncluded) {
        discoveredScripts.push({
          name: path.basename(item, path.extname(item)),
          file: fullPath,
          description: `Verification script: ${item}`,
          type: 'misc',
          requirements: ['Manual verification'],
          interactive: true,
        });
      }
    }
  }

  return discoveredScripts;
}

// Execute a single verification script
function executeVerificationScript(script) {
  return new Promise((resolve) => {
    log(colorize('cyan', `\n🔍 Running: ${script.name}`));
    log(colorize('gray', `   File: ${script.file}`));
    log(colorize('gray', `   Type: ${script.type}`));
    log(colorize('gray', `   Description: ${script.description}`));
    log(colorize('gray', `   Requirements: ${script.requirements.join(', ')}`));

    if (script.interactive) {
      log(colorize('yellow', `   ⚠️  Interactive script - may require manual steps`));
    }

    log(colorize('gray', '='.repeat(60)));

    const command = 'node';
    const args = [script.file];

    const child = spawn(command, args, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    child.on('close', (code) => {
      const success = code === 0;
      if (success) {
        log(colorize('green', `✅ ${script.name} - COMPLETED`));
      } else {
        log(colorize('red', `❌ ${script.name} - FAILED (exit code: ${code})`));
      }
      resolve({ script, success, exitCode: code });
    });

    child.on('error', (error) => {
      log(colorize('red', `❌ ${script.name} - ERROR: ${error.message}`));
      resolve({ script, success: false, error: error.message });
    });
  });
}

// Execute individual verification script
async function executeIndividualScript(scriptName) {
  const allScripts = [...verificationScripts, ...discoverVerificationScripts()];
  const script = allScripts.find(
    (s) => s.name.toLowerCase().includes(scriptName.toLowerCase()) ||
      s.file.includes(scriptName) ||
      s.type.toLowerCase().includes(scriptName.toLowerCase())
  );

  if (!script) {
    log(colorize('red', `❌ Verification script not found: ${scriptName}`));
    log(colorize('yellow', 'Available verification scripts:'));
    allScripts.forEach((s, index) => {
      log(colorize('gray', `  ${index + 1}. ${s.name} (${s.type}) - ${s.file}`));
    });
    return false;
  }

  log(colorize('blue', '🎯 Running Individual Verification Script'));
  log(colorize('blue', '='.repeat(50)));

  const result = await executeVerificationScript(script);
  return result.success;
}

// Execute verification scripts by type
async function executeScriptsByType(type) {
  const allScripts = [...verificationScripts, ...discoverVerificationScripts()];
  const scriptsOfType = allScripts.filter(s =>
    s.type.toLowerCase() === type.toLowerCase()
  );

  if (scriptsOfType.length === 0) {
    log(colorize('red', `❌ No verification scripts found for type: ${type}`));
    log(colorize('yellow', 'Available types:'));
    const types = [...new Set(allScripts.map(s => s.type))];
    types.forEach(t => {
      log(colorize('gray', `  • ${t}`));
    });
    return false;
  }

  log(colorize('blue', `🎯 Running ${type} Verification Scripts`));
  log(colorize('blue', '='.repeat(50)));

  let allPassed = true;
  for (const script of scriptsOfType) {
    const result = await executeVerificationScript(script);
    if (!result.success) {
      allPassed = false;
    }
    log('');
  }

  return allPassed;
}

// Execute all verification scripts
async function executeAllScripts() {
  log(colorize('blue', '🔍 Verification Script Suite'));
  log(colorize('blue', '='.repeat(50)));
  log(colorize('gray', 'Executing all verification scripts with consolidated reporting'));
  log('');

  const allScripts = [...verificationScripts, ...discoverVerificationScripts()];
  const results = [];
  let totalScripts = allScripts.length;
  let completedScripts = 0;

  for (const script of allScripts) {
    const result = await executeVerificationScript(script);
    results.push(result);

    if (result.success) {
      completedScripts++;
    }

    // Add spacing between scripts
    log('');
  }

  // Consolidated reporting
  log(colorize('blue', '📊 Consolidated Verification Results'));
  log(colorize('blue', '='.repeat(50)));
  log('');

  // Group results by type
  const resultsByType = {};
  results.forEach(result => {
    const type = result.script.type;
    if (!resultsByType[type]) {
      resultsByType[type] = [];
    }
    resultsByType[type].push(result);
  });

  // Report by type
  Object.keys(resultsByType).forEach(type => {
    const typeResults = resultsByType[type];
    const typeCompleted = typeResults.filter(r => r.success).length;

    log(colorize('cyan', `📋 ${type.toUpperCase()} Verification (${typeCompleted}/${typeResults.length} completed):`));
    typeResults.forEach((result, index) => {
      const status = result.success ?
        colorize('green', '✅ COMPLETED') :
        colorize('red', '❌ FAILED');

      log(`  ${index + 1}. ${result.script.name} - ${status}`);

      if (result.script.interactive) {
        log(colorize('gray', `     Note: Interactive script - may require manual verification`));
      }

      if (!result.success) {
        if (result.error) {
          log(colorize('gray', `     Error: ${result.error}`));
        } else if (result.exitCode) {
          log(colorize('gray', `     Exit code: ${result.exitCode}`));
        }
      }
    });
    log('');
  });

  log(colorize('blue', '📈 Summary'));
  log(colorize('blue', '='.repeat(20)));
  log(colorize('green', `✅ Completed: ${completedScripts}/${totalScripts} scripts`));

  if (completedScripts < totalScripts) {
    log(colorize('red', `❌ Failed: ${totalScripts - completedScripts}/${totalScripts} scripts`));
  }

  const completionRate = Math.round((completedScripts / totalScripts) * 100);
  log(colorize('blue', `📊 Completion Rate: ${completionRate}%`));

  if (completedScripts === totalScripts) {
    log('');
    log(colorize('green', '🎉 All verification scripts completed!'));
    log(colorize('blue', '✅ Verification categories completed:'));

    const types = [...new Set(results.map(r => r.script.type))];
    types.forEach(type => {
      const typeScripts = results.filter(r => r.script.type === type);
      const typeCompleted = typeScripts.filter(r => r.success).length;
      log(colorize('gray', `  • ${type}: ${typeCompleted}/${typeScripts.length} scripts`));
    });

    log('');
    log(colorize('yellow', '📝 Note: Some scripts may be interactive and require manual verification.'));
    log(colorize('yellow', '    Please review the output above to ensure all requirements are met.'));
  } else {
    log('');
    log(colorize('yellow', '⚠️  Some verification scripts failed. Please review the output above.'));
  }

  return completedScripts === totalScripts;
}

// Display help information
function displayHelp() {
  log(colorize('blue', '🔧 Verification Script Runner Help'));
  log(colorize('blue', '='.repeat(40)));
  log('');
  log(colorize('yellow', 'Usage:'));
  log('  node tests/scripts/verification/run-all.cjs [options]');
  log('');
  log(colorize('yellow', 'Options:'));
  log('  --help, -h          Show this help message');
  log('  --type <type>       Run verification scripts of specific type');
  log('  --script <name>     Run specific verification script by name');
  log('  --list             List all available verification scripts');
  log('');
  log(colorize('yellow', 'Examples:'));
  log('  node tests/scripts/verification/run-all.cjs');
  log('  node tests/scripts/verification/run-all.cjs --type config');
  log('  node tests/scripts/verification/run-all.cjs --script implementation');
  log('  node tests/scripts/verification/run-all.cjs --list');
  log('');
  log(colorize('yellow', 'Note:'));
  log('  Some verification scripts are interactive and may require manual steps.');
  log('  Please follow the instructions provided by each script.');
}

// List all available verification scripts
function listScripts() {
  log(colorize('blue', '📋 Available Verification Scripts'));
  log(colorize('blue', '='.repeat(40)));
  log('');

  const allScripts = [...verificationScripts, ...discoverVerificationScripts()];
  const typeGroups = {};

  allScripts.forEach(script => {
    if (!typeGroups[script.type]) {
      typeGroups[script.type] = [];
    }
    typeGroups[script.type].push(script);
  });

  Object.keys(typeGroups).forEach(type => {
    log(colorize('cyan', `📂 ${type.toUpperCase()}:`));
    typeGroups[type].forEach((script, index) => {
      log(colorize('gray', `  ${index + 1}. ${script.name}`));
      log(colorize('gray', `     File: ${script.file}`));
      log(colorize('gray', `     Description: ${script.description}`));
      log(colorize('gray', `     Requirements: ${script.requirements.join(', ')}`));
      if (script.interactive) {
        log(colorize('yellow', `     Interactive: Yes (requires manual steps)`));
      }
      log('');
    });
  });
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  if (args.includes('--help') || args.includes('-h')) {
    displayHelp();
    return;
  }

  if (args.includes('--list')) {
    listScripts();
    return;
  }

  const typeIndex = args.indexOf('--type');
  if (typeIndex !== -1 && typeIndex + 1 < args.length) {
    const type = args[typeIndex + 1];
    const success = await executeScriptsByType(type);
    process.exit(success ? 0 : 1);
    return;
  }

  const scriptIndex = args.indexOf('--script');
  if (scriptIndex !== -1 && scriptIndex + 1 < args.length) {
    const scriptName = args[scriptIndex + 1];
    const success = await executeIndividualScript(scriptName);
    process.exit(success ? 0 : 1);
    return;
  }

  // Run all scripts by default
  const success = await executeAllScripts();
  process.exit(success ? 0 : 1);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log(colorize('red', `❌ Uncaught error: ${error.message}`));
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(colorize('red', `❌ Unhandled rejection: ${reason}`));
  process.exit(1);
});

main().catch((error) => {
  log(colorize('red', `❌ Verification runner error: ${error.message}`));
  process.exit(1);
});
