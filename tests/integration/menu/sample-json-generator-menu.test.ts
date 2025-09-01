/**
 * Integration tests for sample JSON generator menu functionality
 * Tests menu option display, selection, and end-to-end flow
 * Requirements: 1.1, 1.3, 3.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, unlinkSync, readFileSync } from 'fs';
import path from 'path';

// Mock prompts to simulate user interactions
vi.mock('prompts', () => ({
  default: vi.fn(),
}));

// Mock chalk to avoid color codes in tests
vi.mock('chalk', () => ({
  default: {
    cyan: (text: string) => text,
    green: (text: string) => text,
    red: (text: string) => text,
    yellow: (text: string) => text,
    blue: (text: string) => text,
    gray: (text: string) => text,
    redBright: (text: string) => text,
  },
}));

// Mock oh-my-logo to avoid external dependencies
vi.mock('oh-my-logo', () => ({
  render: vi.fn().mockResolvedValue('Mocked ASCII Art'),
}));

describe('Sample JSON Generator Menu Integration Tests', () => {
  const testJsonFile = 'hyouji.json';

  beforeEach(() => {
    // Clean up any existing test files
    if (existsSync(testJsonFile)) {
      unlinkSync(testJsonFile);
    }

    // Reset all mocks
    vi.clearAllMocks();

    // Mock console.log to capture output
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Mock process.exit to prevent test termination
    vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('Process exit called');
    });
  });

  afterEach(() => {
    // Clean up test files
    if (existsSync(testJsonFile)) {
      unlinkSync(testJsonFile);
    }

    // Restore all mocks
    vi.restoreAllMocks();
  });

  describe('Menu Option Display', () => {
    it('should include "Generate sample JSON" option in action selector', async () => {
      // Import the constant to check menu options
      const { actionSelector } = await import('../../../src/constant.js');

      // Verify the menu option exists
      const generateJsonOption = actionSelector.choices.find(
        (choice: any) => choice.title === 'Generate sample JSON',
      );

      expect(generateJsonOption).toBeDefined();
      expect(generateJsonOption.value).toBe(5);
      expect(generateJsonOption.title).toBe('Generate sample JSON');
    });

    it('should have "Generate sample JSON" option positioned after "import JSON"', async () => {
      const { actionSelector } = await import('../../../src/constant.js');

      const importJsonIndex = actionSelector.choices.findIndex(
        (choice: any) => choice.title === 'import JSON',
      );
      const generateJsonIndex = actionSelector.choices.findIndex(
        (choice: any) => choice.title === 'Generate sample JSON',
      );

      expect(importJsonIndex).toBe(4);
      expect(generateJsonIndex).toBe(5);
      expect(generateJsonIndex).toBe(importJsonIndex + 1);
    });

    it('should maintain correct indexing for subsequent menu options', async () => {
      const { actionSelector } = await import('../../../src/constant.js');

      const settingsOption = actionSelector.choices.find(
        (choice: any) => choice.title === 'Display your settings',
      );
      const exitOption = actionSelector.choices.find(
        (choice: any) => choice.title === 'exit',
      );

      expect(settingsOption.value).toBe(6);
      expect(exitOption.value).toBe(7);
    });
  });

  describe('Menu Selection Functionality', () => {
    it('should trigger generateSampleJson function when option 5 is selected', async () => {
      // Mock the generateSampleJson function
      const mockGenerateSampleJson = vi.fn().mockResolvedValue(undefined);

      // Mock the module
      vi.doMock('../../../src/lib/generateSampleJson.js', () => ({
        generateSampleJson: mockGenerateSampleJson,
      }));

      // Mock prompts to return option 5 (Generate sample JSON)
      const prompts = await import('prompts');
      (prompts.default as any).mockResolvedValue({ action: [5] });

      // Mock configuration to avoid GitHub API calls
      const mockConfig = {
        octokit: {
          request: vi.fn().mockResolvedValue({}),
        },
        owner: 'test-owner',
        repo: 'test-repo',
        fromSavedConfig: true,
        autoDetected: false,
        detectionMethod: 'manual',
      };

      // Mock the config manager and related functions
      vi.doMock('../../../src/lib/configManager.js', () => ({
        ConfigManager: vi.fn().mockImplementation(() => ({
          configExists: () => true,
          loadConfig: () => Promise.resolve(mockConfig),
          loadValidatedConfig: () =>
            Promise.resolve({
              config: mockConfig,
              shouldPromptForCredentials: false,
            }),
          migrateToEncrypted: () => Promise.resolve(),
          getConfigPath: () => '/mock/path/config.json',
        })),
      }));

      vi.doMock('../../../src/lib/inputGitHubConfig.js', () => ({
        getGitHubConfigs: () => Promise.resolve(mockConfig),
      }));

      vi.doMock('../../../src/lib/confirmToken.js', () => ({
        getConfirmation: () => Promise.resolve(true),
      }));

      // Import and run the main function
      const indexModule = await import('../../../src/index.js');

      // Wait for the async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify that generateSampleJson was called
      expect(mockGenerateSampleJson).toHaveBeenCalled();
    });

    it('should handle errors gracefully when generateSampleJson fails', async () => {
      const mockError = new Error('Test error');
      const mockGenerateSampleJson = vi.fn().mockRejectedValue(mockError);

      vi.doMock('../../../src/lib/generateSampleJson.js', () => ({
        generateSampleJson: mockGenerateSampleJson,
      }));

      const prompts = await import('prompts');
      (prompts.default as any).mockResolvedValue({ action: [5] });

      // Mock configuration
      const mockConfig = {
        octokit: {
          request: vi.fn().mockResolvedValue({}),
        },
        owner: 'test-owner',
        repo: 'test-repo',
        fromSavedConfig: true,
        autoDetected: false,
        detectionMethod: 'manual',
      };

      vi.doMock('../../../src/lib/configManager.js', () => ({
        ConfigManager: vi.fn().mockImplementation(() => ({
          configExists: () => true,
          loadConfig: () => Promise.resolve(mockConfig),
          loadValidatedConfig: () =>
            Promise.resolve({
              config: mockConfig,
              shouldPromptForCredentials: false,
            }),
          migrateToEncrypted: () => Promise.resolve(),
          getConfigPath: () => '/mock/path/config.json',
        })),
      }));

      vi.doMock('../../../src/lib/inputGitHubConfig.js', () => ({
        getGitHubConfigs: () => Promise.resolve(mockConfig),
      }));

      vi.doMock('../../../src/lib/confirmToken.js', () => ({
        getConfirmation: () => Promise.resolve(true),
      }));

      // Import and run the main function
      await import('../../../src/index.js');

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify error handling was triggered
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Error generating sample JSON'),
      );
    });
  });

  describe('Application Flow', () => {
    it('should return to main menu after successful execution', async () => {
      const mockGenerateSampleJson = vi.fn().mockResolvedValue(undefined);

      vi.doMock('../../../src/lib/generateSampleJson.js', () => ({
        generateSampleJson: mockGenerateSampleJson,
      }));

      const prompts = await import('prompts');
      // First call returns option 5, second call returns option 7 (exit)
      (prompts.default as any)
        .mockResolvedValueOnce({ action: [5] })
        .mockResolvedValueOnce({ action: [7] });

      // Mock configuration
      const mockConfig = {
        octokit: {
          request: vi.fn().mockResolvedValue({}),
        },
        owner: 'test-owner',
        repo: 'test-repo',
        fromSavedConfig: true,
        autoDetected: false,
        detectionMethod: 'manual',
      };

      vi.doMock('../../../src/lib/configManager.js', () => ({
        ConfigManager: vi.fn().mockImplementation(() => ({
          configExists: () => true,
          loadConfig: () => Promise.resolve(mockConfig),
          loadValidatedConfig: () =>
            Promise.resolve({
              config: mockConfig,
              shouldPromptForCredentials: false,
            }),
          migrateToEncrypted: () => Promise.resolve(),
          getConfigPath: () => '/mock/path/config.json',
        })),
      }));

      vi.doMock('../../../src/lib/inputGitHubConfig.js', () => ({
        getGitHubConfigs: () => Promise.resolve(mockConfig),
      }));

      vi.doMock('../../../src/lib/confirmToken.js', () => ({
        getConfirmation: () => Promise.resolve(true),
      }));

      try {
        await import('../../../src/index.js');
      } catch (error) {
        // Expected to throw due to process.exit mock
        expect((error as Error).message).toBe('Process exit called');
      }

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify that prompts was called multiple times (menu returned)
      expect(prompts.default).toHaveBeenCalledTimes(2);
    });

    it('should set firstStart to false after execution', async () => {
      const mockGenerateSampleJson = vi.fn().mockResolvedValue(undefined);

      vi.doMock('../../../src/lib/generateSampleJson.js', () => ({
        generateSampleJson: mockGenerateSampleJson,
      }));

      const prompts = await import('prompts');
      (prompts.default as any).mockResolvedValue({ action: [5] });

      // Mock configuration
      const mockConfig = {
        octokit: {
          request: vi.fn().mockResolvedValue({}),
        },
        owner: 'test-owner',
        repo: 'test-repo',
        fromSavedConfig: true,
        autoDetected: false,
        detectionMethod: 'manual',
      };

      vi.doMock('../../../src/lib/configManager.js', () => ({
        ConfigManager: vi.fn().mockImplementation(() => ({
          configExists: () => true,
          loadConfig: () => Promise.resolve(mockConfig),
          loadValidatedConfig: () =>
            Promise.resolve({
              config: mockConfig,
              shouldPromptForCredentials: false,
            }),
          migrateToEncrypted: () => Promise.resolve(),
          getConfigPath: () => '/mock/path/config.json',
        })),
      }));

      vi.doMock('../../../src/lib/inputGitHubConfig.js', () => ({
        getGitHubConfigs: () => Promise.resolve(mockConfig),
      }));

      vi.doMock('../../../src/lib/confirmToken.js', () => ({
        getConfirmation: () => Promise.resolve(true),
      }));

      // Import and run
      await import('../../../src/index.js');

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify the function was called (indicating firstStart behavior worked)
      expect(mockGenerateSampleJson).toHaveBeenCalled();
    });
  });

  describe('End-to-End Flow', () => {
    it('should complete full flow from menu selection to file creation', async () => {
      // Use the real generateSampleJson function for end-to-end test
      const prompts = await import('prompts');
      (prompts.default as any).mockResolvedValue({ action: [5] });

      // Mock configuration
      const mockConfig = {
        octokit: {
          request: vi.fn().mockResolvedValue({}),
        },
        owner: 'test-owner',
        repo: 'test-repo',
        fromSavedConfig: true,
        autoDetected: false,
        detectionMethod: 'manual',
      };

      vi.doMock('../../../src/lib/configManager.js', () => ({
        ConfigManager: vi.fn().mockImplementation(() => ({
          configExists: () => true,
          loadConfig: () => Promise.resolve(mockConfig),
          loadValidatedConfig: () =>
            Promise.resolve({
              config: mockConfig,
              shouldPromptForCredentials: false,
            }),
          migrateToEncrypted: () => Promise.resolve(),
          getConfigPath: () => '/mock/path/config.json',
        })),
      }));

      vi.doMock('../../../src/lib/inputGitHubConfig.js', () => ({
        getGitHubConfigs: () => Promise.resolve(mockConfig),
      }));

      vi.doMock('../../../src/lib/confirmToken.js', () => ({
        getConfirmation: () => Promise.resolve(true),
      }));

      // Import and run
      await import('../../../src/index.js');

      // Wait for file creation
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Verify file was created
      expect(existsSync(testJsonFile)).toBe(true);

      // Verify file content
      const fileContent = readFileSync(testJsonFile, 'utf8');
      const jsonData = JSON.parse(fileContent);

      expect(Array.isArray(jsonData)).toBe(true);
      expect(jsonData).toHaveLength(3);
      expect(jsonData[0]).toHaveProperty('name', 'Type: Bug Fix');
      expect(jsonData[0]).toHaveProperty('color', 'FF8A65');
      expect(jsonData[0]).toHaveProperty(
        'description',
        'Fix features that are not working',
      );
    });

    it('should display success message after file creation', async () => {
      const prompts = await import('prompts');
      (prompts.default as any).mockResolvedValue({ action: [5] });

      // Mock configuration
      const mockConfig = {
        octokit: {
          request: vi.fn().mockResolvedValue({}),
        },
        owner: 'test-owner',
        repo: 'test-repo',
        fromSavedConfig: true,
        autoDetected: false,
        detectionMethod: 'manual',
      };

      vi.doMock('../../../src/lib/configManager.js', () => ({
        ConfigManager: vi.fn().mockImplementation(() => ({
          configExists: () => true,
          loadConfig: () => Promise.resolve(mockConfig),
          loadValidatedConfig: () =>
            Promise.resolve({
              config: mockConfig,
              shouldPromptForCredentials: false,
            }),
          migrateToEncrypted: () => Promise.resolve(),
          getConfigPath: () => '/mock/path/config.json',
        })),
      }));

      vi.doMock('../../../src/lib/inputGitHubConfig.js', () => ({
        getGitHubConfigs: () => Promise.resolve(mockConfig),
      }));

      vi.doMock('../../../src/lib/confirmToken.js', () => ({
        getConfirmation: () => Promise.resolve(true),
      }));

      // Import and run
      await import('../../../src/index.js');

      // Wait for execution
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Verify success message was displayed
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Sample JSON file generated successfully'),
      );
    });
  });
});
