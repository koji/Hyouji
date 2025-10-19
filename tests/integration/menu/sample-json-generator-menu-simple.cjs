#!/usr/bin/env node

/**
 * Simple integration test for sample JSON generator menu functionality
 * Tests the core functionality without complex mocking
 * Requirements: 1.1, 1.3, 3.3
 */

const { existsSync, readFileSync } = require('fs')
const { join } = require('path')

console.log(
  '🧪 Running Sample JSON Generator Menu Simple Integration Test...\n',
)

function testMenuIntegration() {
  console.log('📋 Testing Menu Integration...')

  try {
    const originalCwd = process.cwd()

    // Test 1: Menu option exists in constants
    console.log('🔍 Checking menu option in constants...')
    const constantsPath = join(originalCwd, 'src', 'constant.ts')
    const constantsContent = readFileSync(constantsPath, 'utf8')

    if (!constantsContent.includes('Generate sample JSON')) {
      throw new Error('Menu option "Generate sample JSON" not found')
    }

    // Verify it has value 5
    const generateJsonMatch = constantsContent.match(
      /{\s*title:\s*['"]Generate sample JSON['"],\s*value:\s*5\s*}/,
    )
    if (!generateJsonMatch) {
      throw new Error('Generate sample JSON option not found with value 5')
    }

    console.log('✅ Menu option correctly configured')

    // Test 2: Switch case implementation
    console.log('🔍 Checking switch case implementation...')
    const indexPath = join(originalCwd, 'src', 'index.ts')
    const indexContent = readFileSync(indexPath, 'utf8')

    if (!indexContent.includes('case 5:')) {
      throw new Error('Case 5 not found in switch statement')
    }

    const case5Match = indexContent.match(/case 5:\s*{([\s\S]*?)break;/)
    if (!case5Match || !case5Match[1].includes('generateSampleJson')) {
      throw new Error('Case 5 does not call generateSampleJson')
    }

    if (!case5Match[1].includes('try') || !case5Match[1].includes('catch')) {
      throw new Error('Case 5 missing error handling')
    }

    console.log('✅ Switch case correctly implemented')

    // Test 3: Function exists and is imported
    console.log('🔍 Checking function import and implementation...')
    if (!indexContent.includes('generateSampleJson')) {
      throw new Error('generateSampleJson not imported')
    }

    const generateSampleJsonPath = join(
      originalCwd,
      'src',
      'lib',
      'generateSampleJson.ts',
    )
    if (!existsSync(generateSampleJsonPath)) {
      throw new Error('generateSampleJson.ts file not found')
    }

    const functionContent = readFileSync(generateSampleJsonPath, 'utf8')
    if (!functionContent.includes('export const generateSampleJson')) {
      throw new Error('generateSampleJson function not exported')
    }

    console.log('✅ Function correctly implemented and imported')

    // Test 4: Built application includes everything
    console.log('🔍 Checking built application...')
    const builtPath = join(originalCwd, 'dist', 'index.js')
    if (!existsSync(builtPath)) {
      throw new Error('Built application not found')
    }

    const builtContent = readFileSync(builtPath, 'utf8')
    if (!builtContent.includes('generateSampleJson')) {
      throw new Error('generateSampleJson not found in built application')
    }

    if (!builtContent.includes('case 5:')) {
      throw new Error('Case 5 not found in built application')
    }

    console.log('✅ Built application correctly includes all components')

    console.log('\n🎉 All menu integration tests passed!')
  } catch (error) {
    console.error('❌ Menu integration test failed:', error.message)
    process.exit(1)
  }
}

// Run the test
testMenuIntegration()
