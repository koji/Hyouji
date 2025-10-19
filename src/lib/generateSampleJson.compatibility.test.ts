import * as fs from 'fs'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { sampleData } from '../constant.js'
import { ConfigType, ImportLabelType } from '../types/index.js'

import { generateSampleJson } from './generateSampleJson.js'
import { importLabelsFromFile } from './importLabels.js'

// Mock the createLabel function to avoid actual API calls and capture calls
vi.mock('./callApi.js', () => ({
  createLabel: vi.fn().mockResolvedValue(undefined),
}))

// Mock oh-my-logo to avoid dependency issues in CI
vi.mock('oh-my-logo', () => ({
  render: vi.fn().mockResolvedValue('Mocked ASCII Art'),
}))

describe('Sample JSON Compatibility Tests', () => {
  const testFilePath = './hyouji.json'
  const mockConfig: ConfigType = {
    octokit: {} as ConfigType['octokit'],
    owner: 'test-owner',
    repo: 'test-repo',
  }

  let mockCreateLabel: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    // Clear any existing test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath)
    }
    // Get the mocked function
    const { createLabel } = await import('./callApi.js')
    mockCreateLabel = createLabel as ReturnType<typeof vi.fn>
    // Clear mock calls
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath)
    }
  })

  describe('JSON Generation and Structure Validation', () => {
    it('should generate a JSON file that matches expected structure', async () => {
      // Generate the sample JSON file
      await generateSampleJson()

      // Verify file exists
      expect(fs.existsSync(testFilePath)).toBe(true)

      // Read and parse the generated file
      const fileContent = fs.readFileSync(testFilePath, 'utf8')
      const parsedData = JSON.parse(fileContent)

      // Verify it's an array
      expect(Array.isArray(parsedData)).toBe(true)

      // Verify it contains the expected number of items
      expect(parsedData).toHaveLength(sampleData.length)

      // Verify each item has the correct structure
      parsedData.forEach((item: unknown, index: number) => {
        expect(typeof item).toBe('object')
        expect(item).not.toBeNull()

        const labelItem = item as Record<string, unknown>

        // Verify required fields
        expect(labelItem).toHaveProperty('name')
        expect(typeof labelItem.name).toBe('string')
        expect((labelItem.name as string).trim()).not.toBe('')

        // Verify optional fields if present
        if (labelItem.color !== undefined) {
          expect(typeof labelItem.color).toBe('string')
          expect((labelItem.color as string).trim()).not.toBe('')
        }

        if (labelItem.description !== undefined) {
          expect(typeof labelItem.description).toBe('string')
        }

        // Verify content matches sample data
        expect(labelItem.name).toBe(sampleData[index].name)
        expect(labelItem.color).toBe(sampleData[index].color)
        expect(labelItem.description).toBe(sampleData[index].description)
      })
    })

    it('should generate JSON with proper formatting', async () => {
      await generateSampleJson()

      const fileContent = fs.readFileSync(testFilePath, 'utf8')

      // Verify proper JSON formatting (should be parseable)
      expect(() => JSON.parse(fileContent)).not.toThrow()

      // Verify indentation (should contain proper spacing)
      expect(fileContent).toContain('  {') // 2-space indentation
      expect(fileContent).toContain('    "name":') // 4-space indentation for properties
    })

    it('should preserve all sample data fields correctly', async () => {
      await generateSampleJson()

      const fileContent = fs.readFileSync(testFilePath, 'utf8')
      const parsedData = JSON.parse(fileContent)

      // Verify each sample data item is preserved exactly
      sampleData.forEach((originalItem, index) => {
        const generatedItem = parsedData[index]

        expect(generatedItem.name).toBe(originalItem.name)
        expect(generatedItem.color).toBe(originalItem.color)
        expect(generatedItem.description).toBe(originalItem.description)

        // Verify no extra fields are added
        const expectedKeys = ['name', 'color', 'description']
        const actualKeys = Object.keys(generatedItem)
        expect(actualKeys.sort()).toEqual(expectedKeys.sort())
      })
    })
  })

  describe('Import Functionality Compatibility', () => {
    it('should be successfully importable using existing import functionality', async () => {
      // Generate the sample JSON file
      await generateSampleJson()

      // Verify file exists and is readable
      expect(fs.existsSync(testFilePath)).toBe(true)

      // Attempt to import the generated file - should not throw
      await expect(
        importLabelsFromFile(mockConfig, testFilePath),
      ).resolves.not.toThrow()

      // Verify createLabel was called for each sample data item (indicating successful processing)
      expect(mockCreateLabel).toHaveBeenCalledTimes(sampleData.length)
    })

    it('should pass all validation checks during import', async () => {
      await generateSampleJson()

      // Import should complete without throwing errors
      await expect(
        importLabelsFromFile(mockConfig, testFilePath),
      ).resolves.not.toThrow()

      // Verify all labels were processed (createLabel called for each)
      expect(mockCreateLabel).toHaveBeenCalledTimes(sampleData.length)
    })

    it('should handle color format correctly (without # prefix)', async () => {
      await generateSampleJson()

      const fileContent = fs.readFileSync(testFilePath, 'utf8')
      const parsedData = JSON.parse(fileContent)

      // Verify color values don't have # prefix
      parsedData.forEach((item: unknown) => {
        const labelItem = item as Record<string, unknown>
        if (labelItem.color) {
          expect(labelItem.color).not.toMatch(/^#/)
          // Verify it's a valid hex color format (6 characters)
          expect(labelItem.color).toMatch(/^[0-9A-Fa-f]{6}$/)
        }
      })

      // Import should succeed with these color values
      await expect(
        importLabelsFromFile(mockConfig, testFilePath),
      ).resolves.not.toThrow()
      expect(mockCreateLabel).toHaveBeenCalledTimes(sampleData.length)
    })

    it('should create valid ImportLabelType objects during import', async () => {
      await generateSampleJson()

      await importLabelsFromFile(mockConfig, testFilePath)

      // Verify createLabel was called for each sample data item
      expect(mockCreateLabel).toHaveBeenCalledTimes(sampleData.length)

      // Verify each call had the correct structure
      mockCreateLabel.mock.calls.forEach((call: unknown[], index: number) => {
        const [, labelData] = call
        const originalSample = sampleData[index]

        expect(labelData).toEqual({
          name: originalSample.name,
          color: originalSample.color,
          description: originalSample.description,
        } as ImportLabelType)
      })
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle file overwrite scenario correctly', async () => {
      // Generate file first time
      await generateSampleJson()
      const firstContent = fs.readFileSync(testFilePath, 'utf8')

      // Generate file second time (should overwrite)
      await generateSampleJson()
      const secondContent = fs.readFileSync(testFilePath, 'utf8')

      // Content should be identical (successful overwrite)
      expect(firstContent).toBe(secondContent)

      // File should still be importable
      await expect(
        importLabelsFromFile(mockConfig, testFilePath),
      ).resolves.not.toThrow()
      expect(mockCreateLabel).toHaveBeenCalledTimes(sampleData.length)
    })

    it('should maintain compatibility after multiple generation cycles', async () => {
      // Generate and import multiple times
      for (let i = 0; i < 3; i++) {
        vi.clearAllMocks()

        await generateSampleJson()
        await expect(
          importLabelsFromFile(mockConfig, testFilePath),
        ).resolves.not.toThrow()
        expect(mockCreateLabel).toHaveBeenCalledTimes(sampleData.length)
      }
    })
  })

  describe('Requirements Validation', () => {
    it('should satisfy requirement 2.1 - JSON structure matches expected format for label import', async () => {
      await generateSampleJson()

      const fileContent = fs.readFileSync(testFilePath, 'utf8')
      const parsedData = JSON.parse(fileContent)

      // Verify it's a valid JSON array (requirement 2.1)
      expect(Array.isArray(parsedData)).toBe(true)

      // Verify each label object contains required fields (requirement 2.1)
      parsedData.forEach((item: unknown) => {
        const labelItem = item as Record<string, unknown>
        expect(labelItem).toHaveProperty('name')
        expect(labelItem).toHaveProperty('color')
        expect(labelItem).toHaveProperty('description')
        expect(typeof labelItem.name).toBe('string')
        expect(typeof labelItem.color).toBe('string')
        expect(typeof labelItem.description).toBe('string')
      })
    })

    it('should satisfy requirement 2.2 - all sample data fields are correctly preserved', async () => {
      await generateSampleJson()

      const fileContent = fs.readFileSync(testFilePath, 'utf8')
      const parsedData = JSON.parse(fileContent)

      // Verify all sample data is preserved exactly (requirement 2.2)
      expect(parsedData).toEqual(sampleData)
    })

    it('should satisfy requirement 2.4 - generated JSON can be successfully imported', async () => {
      await generateSampleJson()

      // Import should work without errors (requirement 2.4)
      await expect(
        importLabelsFromFile(mockConfig, testFilePath),
      ).resolves.not.toThrow()

      // All labels should be processed successfully
      expect(mockCreateLabel).toHaveBeenCalledTimes(sampleData.length)

      // Each call should have valid data
      mockCreateLabel.mock.calls.forEach((call: unknown[]) => {
        const [, labelData] = call
        const label = labelData as Record<string, unknown>
        expect(label).toHaveProperty('name')
        expect(label).toHaveProperty('color')
        expect(label).toHaveProperty('description')
      })
    })
  })
})
