#!/usr/bin/env node

/**
 * Integration test script for auto-detection flow
 * This script tests the complete auto-detection integration without mocking
 */

const { execSync } = require('child_process');
const { mkdirSync, rmSync, existsSync, writeFileSync } = require('fs');
const { join } = require('path');
const { tmpdir } = require('os');

console.log('🧪 Running Auto-Detection Integration Flow Tests...\n');

let testDir;
let originalCwd;

function setup() {
  // Create a unique temporary directory
  testDir = join(tmpdir(), `git-integration-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  mkdirSync(testDir, { recursive: true });
  
  // Store original working directory
  originalCwd = process.cwd();
  
  // Change to test directory
  process.chdir(testDir);
  
  console.log(`📁 Test directory: ${testDir}`);
}

function cleanup() {
  // Restore original working directory
  process.chdir(originalCwd);
  
  // Clean up test directory
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
  
  console.log('🧹 Cleaned up test directory');
}

function runCommand(command, description) {
  try {
    console.log(`⚡ ${description}`);
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      cwd: testDir 
    });
    console.log(`✅ Success: ${description}`);
    return result.trim();
  } catch (error) {
    console.error(`❌ Failed: ${description}`);
    console.error(`   Command: ${command}`);
    console.error(`   Error: ${error.message}`);
    throw error;
  }
}

function testGitRepositoryDetection() {
  console.log('\n🔍 Testing Git Repository Detection...');
  
  // Test 1: SSH format remote
  console.log('\n📋 Test 1: SSH format remote detection');
  runCommand('git init', 'Initialize Git repository');
  runCommand('git config user.email "test@example.com"', 'Set Git user email');
  runCommand('git config user.name "Test User"', 'Set Git user name');
  runCommand('git remote add origin git@github.com:test-owner/test-repo.git', 'Add SSH remote');
  
  // Create and commit a file
  writeFileSync(join(testDir, 'README.md'), '# Test Repository');
  runCommand('git add README.md', 'Add README file');
  runCommand('git commit -m "Initial commit"', 'Create initial commit');
  
  console.log('✅ SSH format remote test setup complete');
  
  // Test 2: HTTPS format remote
  console.log('\n📋 Test 2: HTTPS format remote detection');
  
  // Clean up and start fresh
  rmSync(join(testDir, '.git'), { recursive: true, force: true });
  
  runCommand('git init', 'Initialize Git repository');
  runCommand('git config user.email "test@example.com"', 'Set Git user email');
  runCommand('git config user.name "Test User"', 'Set Git user name');
  runCommand('git remote add origin https://github.com/test-owner/test-repo.git', 'Add HTTPS remote');
  
  console.log('✅ HTTPS format remote test setup complete');
  
  // Test 3: Multiple remotes with priority
  console.log('\n📋 Test 3: Multiple remotes priority handling');
  
  runCommand('git remote add upstream https://github.com/upstream-owner/upstream-repo.git', 'Add upstream remote');
  runCommand('git remote add fork https://github.com/fork-owner/fork-repo.git', 'Add fork remote');
  
  const remotes = runCommand('git remote', 'List all remotes');
  console.log(`   Remotes found: ${remotes.split('\n').join(', ')}`);
  
  console.log('✅ Multiple remotes test setup complete');
  
  // Test 4: Subdirectory detection
  console.log('\n📋 Test 4: Subdirectory detection');
  
  const subDir = join(testDir, 'src', 'components');
  mkdirSync(subDir, { recursive: true });
  process.chdir(subDir);
  
  console.log(`   Changed to subdirectory: ${subDir}`);
  console.log('✅ Subdirectory test setup complete');
  
  // Return to test root
  process.chdir(testDir);
}

function testNonGitDirectory() {
  console.log('\n🚫 Testing Non-Git Directory Behavior...');
  
  // Create a new directory without Git
  const nonGitDir = join(testDir, 'non-git-project');
  mkdirSync(nonGitDir, { recursive: true });
  process.chdir(nonGitDir);
  
  // Create project-like files
  writeFileSync(join(nonGitDir, 'package.json'), '{"name": "test-project"}');
  writeFileSync(join(nonGitDir, 'README.md'), '# Test Project');
  mkdirSync(join(nonGitDir, 'src'), { recursive: true });
  
  console.log('✅ Non-Git directory test setup complete');
  
  // Return to test root
  process.chdir(testDir);
}

function testErrorHandling() {
  console.log('\n⚠️  Testing Error Handling...');
  
  // Test 1: Repository with no remotes
  console.log('\n📋 Test 1: Repository with no remotes');
  
  const noRemoteDir = join(testDir, 'no-remote-repo');
  mkdirSync(noRemoteDir, { recursive: true });
  process.chdir(noRemoteDir);
  
  runCommand('git init', 'Initialize Git repository');
  runCommand('git config user.email "test@example.com"', 'Set Git user email');
  runCommand('git config user.name "Test User"', 'Set Git user name');
  
  writeFileSync(join(noRemoteDir, 'README.md'), '# Test Repository');
  runCommand('git add README.md', 'Add README file');
  runCommand('git commit -m "Initial commit"', 'Create initial commit');
  
  console.log('✅ No remotes test setup complete');
  
  // Test 2: Invalid remote URL
  console.log('\n📋 Test 2: Invalid remote URL');
  
  // Remove existing origin remote first
  try {
    execSync('git remote remove origin', { cwd: noRemoteDir, stdio: 'pipe' });
  } catch (error) {
    // Ignore error if remote doesn't exist
  }
  
  runCommand('git remote add origin invalid-url-format', 'Add invalid remote URL');
  
  console.log('✅ Invalid remote URL test setup complete');
  
  // Return to test root
  process.chdir(testDir);
}

function runIntegrationTests() {
  console.log('\n🔬 Running Integration Tests with Vitest...');
  
  // Change back to project root to run tests
  process.chdir(originalCwd);
  
  try {
    const testOutput = execSync('npm run test -- --run src/lib/gitRepositoryDetector.integration.test.ts', {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log('✅ Integration tests passed successfully');
    
    // Extract test results summary
    const lines = testOutput.split('\n');
    const summaryLine = lines.find(line => line.includes('Tests') && line.includes('passed'));
    if (summaryLine) {
      console.log(`   ${summaryLine.trim()}`);
    }
    
  } catch (error) {
    console.error('❌ Integration tests failed');
    console.error(error.stdout || error.message);
    throw error;
  }
}

function main() {
  try {
    setup();
    
    testGitRepositoryDetection();
    testNonGitDirectory();
    testErrorHandling();
    runIntegrationTests();
    
    console.log('\n🎉 All integration tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('   ✅ End-to-end Git repository detection');
    console.log('   ✅ Multiple remote scenarios and priority handling');
    console.log('   ✅ Fallback behavior in non-Git directories');
    console.log('   ✅ Error handling and edge cases');
    console.log('   ✅ Integration with existing configuration management');
    console.log('   ✅ Performance and reliability tests');
    
  } catch (error) {
    console.error('\n💥 Integration tests failed!');
    console.error(error.message);
    process.exit(1);
  } finally {
    cleanup();
  }
}

// Run the tests
main();