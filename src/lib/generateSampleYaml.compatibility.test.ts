import * as fs from 'fs'

import YAML from 'yaml'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { sampleData } from '../constant.js'
import { ConfigType, ImportLabelType } from '../types/index.js'

import { generateSampleYaml } from './generateSampleYaml.js'
import { importLabelsFromFile } from './importLabels.js'

// Mock oh-my-logo to avoid dependency issues in CI
vi.mock('oh-my-logo', () => ({
  render: vi.fn().mockResolvedValue('Mocked ASCII Art'),
}))

// Mock the createLabel function to avoid actual API calls and capture calls
let mockCreateLabel: ReturnType<typeof vi.fn>

vi.mock('./callApi.js', () => ({
  createLabel: vi.fn(),
}))

// Mock fs for file operations
vi.mock('fs')

// Mock chalk to avoid color codes in tests
vi.mock('chalk', () => ({
  default: {
    blue: vi.fn((text) => text),
    green: vi.fn((text) => text),
    red: vi.fn((text) => text),
    yellow: vi.fn((text) => text),
    cyan: vi.fn((text) => text),
  },
}))

describe('Sample YAML Compatibility Tests', () => {
  const testFilePath = './hyouji.yaml'
  const mockConfig: ConfigType = {
    octokit: {} as ConfigType['octokit'],
    owner: 'test-owner',
    repo: 'test-repo',
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    // Setup mock for createLabel to simulate successful API calls
    const mockFs = vi.mocked(fs)
    mockFs.existsSync = vi.fn().mockReturnValue(true)
    mockFs.readFileSync = vi.fn().mockReturnValue('')
    mockFs.writeFileSync = vi.fn()

    // Mock successful label creation
    if (!mockCreateLabel) {
      // Import and mock the createLabel function
      const { createLabel } = await import('./callApi.js')
      mockCreateLabel = createLabel as ReturnType<typeof vi.fn>
    }

    // Get the mocked function
    const { createLabel } = await import('./callApi.js')
    mockCreateLabel = createLabel as ReturnType<typeof vi.fn>
    // Clear mock calls
    mockCreateLabel.mockClear()
    mockCreateLabel.mockResolvedValue({
      status: 201,
      data: { id: 1, name: 'test', color: 'ffffff', description: 'test' },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // Clean up any generated files
    if (fs.existsSync && fs.existsSync(testFilePath)) {
      try {
        fs.unlinkSync(testFilePath)
      } catch {
        // Ignore cleanup errors in tests
      }
    }
  })

  describe('YAML Generation and Structure Validation', () => {
    it('should generate a YAML file that matches expected structure', async () => {
      // Generate the sample YAML file
      await generateSampleYaml()

      // Verify file exists
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        testFilePath,
        expect.any(String),
        'utf8',
      )

      // Get the written content
      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0]
      const yamlContent = writeCall[1] as string

      // Parse and verify structure
      const parsedYaml = YAML.parse(yamlContent) as typeof sampleData
      expect(Array.isArray(parsedYaml)).toBe(true)
      expect(parsedYaml).toHaveLength(sampleData.length)

      // Verify each item has the correct structure
      parsedYaml.forEach((item, index) => {
        expect(item).toHaveProperty('name')
        expect(item).toHaveProperty('color')
        expect(item).toHaveProperty('description')
        expect(item.name).toBe(sampleData[index].name)
        expect(item.color).toBe(sampleData[index].color)
        expect(item.description).toBe(sampleData[index].description)
      })
    })

    it('should generate YAML with proper formatting', async () => {
      await generateSampleYaml()

      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0]
      const yamlContent = writeCall[1] as string

      // Should be valid YAML
      expect(() => YAML.parse(yamlContent)).not.toThrow()

      // Should contain proper YAML structure indicators
      expect(yamlContent).toContain('- name:')
      expect(yamlContent).toContain('color:')
      expect(yamlContent).toContain('description:')
    })

    it('should preserve all sample data fields correctly', async () => {
      await generateSampleYaml()

      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0]
      const yamlContent = writeCall[1] as string
      const parsedYaml = YAML.parse(yamlContent) as typeof sampleData

      // Verify all original data is preserved
      expect(parsedYaml).toEqual(sampleData)
    })
  })

  describe('Import Functionality Compatibility', () => {
    it('should be successfully importable using existing import functionality', async () => {
      // Generate the sample YAML file
      await generateSampleYaml()

      // Mock fs.readFileSync to return the generated content
      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0]
      const yamlContent = writeCall[1] as string
      vi.mocked(fs.readFileSync).mockReturnValue(yamlContent)

      // Attempt to import the generated file - should not throw
      await expect(
        importLabelsFromFile(mockConfig, testFilePath),
      ).resolves.not.toThrow()

      // Verify that createLabel was called for each sample item
      expect(mockCreateLabel).toHaveBeenCalledTimes(sampleData.length)
    })

    it('should pass all validation checks during import', async () => {
      await generateSampleYaml()

      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0]
      const yamlContent = writeCall[1] as string
      vi.mocked(fs.readFileSync).mockReturnValue(yamlContent)

      // Import should complete without throwing errors
      await expect(
        importLabelsFromFile(mockConfig, testFilePath),
      ).resolves.not.toThrow()

      // Verify all labels were processed
      expect(mockCreateLabel).toHaveBeenCalledTimes(sampleData.length)
    })

    it('should handle color format correctly (without # prefix)', async () => {
      await generateSampleYaml()

      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0]
      const yamlContent = writeCall[1] as string
      vi.mocked(fs.readFileSync).mockReturnValue(yamlContent)

      await importLabelsFromFile(mockConfig, testFilePath)

      // Verify that colors don't have # prefix (as expected by GitHub API)
      mockCreateLabel.mock.calls.forEach((call) => {
        const labelData = call[1] as ImportLabelType
        if (labelData.color) {
          expect(labelData.color).not.toMatch(/^#/)
        }
      })
    })

    it('should create valid ImportLabelType objects during import', async () => {
      await generateSampleYaml()

      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0]
      const yamlContent = writeCall[1] as string
      vi.mocked(fs.readFileSync).mockReturnValue(yamlContent)

      await importLabelsFromFile(mockConfig, testFilePath)

      // Verify each call to createLabel has valid ImportLabelType structure
      mockCreateLabel.mock.calls.forEach((call, index) => {
        const labelData = call[1] as ImportLabelType
        expect(labelData).toHaveProperty('name')
        expect(typeof labelData.name).toBe('string')
        expect(labelData.name.length).toBeGreaterThan(0)

        if (labelData.color !== undefined) {
          expect(typeof labelData.color).toBe('string')
        }

        if (labelData.description !== undefined) {
          expect(typeof labelData.description).toBe('string')
        }

        // Verify data matches original sample data
        expect(labelData.name).toBe(sampleData[index].name)
        expect(labelData.color).toBe(sampleData[index].color)
        expect(labelData.description).toBe(sampleData[index].description)
      })
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle file overwrite scenario correctly', async () => {
      // Generate file first time
      await generateSampleYaml()
      const firstContent = vi.mocked(fs.writeFileSync).mock
        .calls[0][1] as string

      // Generate file second time (should overwrite)
      await generateSampleYaml()
      const secondContent = vi.mocked(fs.writeFileSync).mock
        .calls[1][1] as string

      // Content should be identical (deterministic generation)
      expect(firstContent).toBe(secondContent)
      expect(fs.writeFileSync).toHaveBeenCalledTimes(2)
    })

    it('should maintain compatibility after multiple generation cycles', async () => {
      // Generate and import multiple times to ensure consistency
      for (let i = 0; i < 3; i++) {
        vi.clearAllMocks()

        await generateSampleYaml()

        const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0]
        const yamlContent = writeCall[1] as string
        vi.mocked(fs.readFileSync).mockReturnValue(yamlContent)

        await importLabelsFromFile(mockConfig, testFilePath)

        // Each cycle should process the same number of labels
        expect(mockCreateLabel).toHaveBeenCalledTimes(sampleData.length)
      }
    })
  })

  describe('Requirements Validation', () => {
    it('should satisfy requirement 2.1 - YAML structure matches expected format for label import', async () => {
      await generateSampleYaml()

      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0]
      const yamlContent = writeCall[1] as string
      const parsedYaml = YAML.parse(yamlContent) as ImportLabelType[]

      // Should be an array of objects with correct structure
      expect(Array.isArray(parsedYaml)).toBe(true)
      parsedYaml.forEach((item) => {
        expect(item).toHaveProperty('name')
        expect(typeof item.name).toBe('string')
        expect(item.name.length).toBeGreaterThan(0)
      })
    })

    it('should satisfy requirement 2.2 - all sample data fields are correctly preserved', async () => {
      await generateSampleYaml()

      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0]
      const yamlContent = writeCall[1] as string
      const parsedYaml = YAML.parse(yamlContent)

      expect(parsedYaml).toEqual(sampleData)
    })

    it('should satisfy requirement 2.4 - generated YAML can be successfully imported', async () => {
      await generateSampleYaml()

      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0]
      const yamlContent = writeCall[1] as string
      vi.mocked(fs.readFileSync).mockReturnValue(yamlContent)

      // Import should work without errors (requirement 2.4)
      await expect(
        importLabelsFromFile(mockConfig, testFilePath),
      ).resolves.not.toThrow()

      expect(mockCreateLabel).toHaveBeenCalledTimes(sampleData.length)
    })
  })
})
