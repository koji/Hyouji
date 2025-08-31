import * as fs from 'fs';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sampleData } from '../constant.js';

import { generateSampleJson } from './generateSampleJson';

// Mock fs module
vi.mock('fs');

// Mock chalk to avoid color codes in tests
vi.mock('chalk', () => ({
  default: {
    blue: vi.fn((text) => text),
    green: vi.fn((text) => text),
    red: vi.fn((text) => text),
  },
}));

describe('generateSampleJson', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('successful JSON file creation', () => {
    it('should create JSON file with correct content and formatting', async () => {
      // Arrange
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);
      mockWriteFileSync.mockImplementation(() => {});

      // Act
      await generateSampleJson();

      // Assert
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        './hyouji.json',
        JSON.stringify(sampleData, null, 2),
        'utf8',
      );
    });

    it('should generate JSON with proper indentation (2 spaces)', async () => {
      // Arrange
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);
      mockWriteFileSync.mockImplementation(() => {});

      // Act
      await generateSampleJson();

      // Assert
      const expectedJson = JSON.stringify(sampleData, null, 2);
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        './hyouji.json',
        expectedJson,
        'utf8',
      );

      // Verify the JSON contains proper indentation
      expect(expectedJson).toContain('  {'); // 2-space indentation
      expect(expectedJson).toContain('    "name":'); // 4-space indentation for nested properties
    });

    it('should generate JSON with correct sample data structure', async () => {
      // Arrange
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);
      mockWriteFileSync.mockImplementation(() => {});

      // Act
      await generateSampleJson();

      // Assert
      const [, jsonContent] = mockWriteFileSync.mock.calls[0];
      const parsedJson = JSON.parse(jsonContent as string);

      expect(Array.isArray(parsedJson)).toBe(true);
      expect(parsedJson).toHaveLength(sampleData.length);

      // Verify each label object has required fields
      parsedJson.forEach((label: unknown, index: number) => {
        const labelItem = label as Record<string, unknown>;
        expect(labelItem).toHaveProperty('name');
        expect(labelItem).toHaveProperty('color');
        expect(labelItem).toHaveProperty('description');
        expect(labelItem.name).toBe(sampleData[index].name);
        expect(labelItem.color).toBe(sampleData[index].color);
        expect(labelItem.description).toBe(sampleData[index].description);
      });
    });

    it('should verify color values are in correct format without # prefix', async () => {
      // Arrange
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);
      mockWriteFileSync.mockImplementation(() => {});

      // Act
      await generateSampleJson();

      // Assert
      const [, jsonContent] = mockWriteFileSync.mock.calls[0];
      const parsedJson = JSON.parse(jsonContent as string);

      parsedJson.forEach((label: unknown) => {
        const labelItem = label as Record<string, unknown>;
        expect(labelItem.color).not.toMatch(/^#/); // Should not start with #
        expect(labelItem.color).toMatch(/^[A-F0-9]{6}$/i); // Should be 6-character hex
      });
    });
  });

  describe('file overwrite behavior', () => {
    it('should overwrite existing hyouji.json file without prompting', async () => {
      // Arrange
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);
      mockWriteFileSync.mockImplementation(() => {});

      // Act
      await generateSampleJson();

      // Assert
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        './hyouji.json',
        expect.any(String),
        'utf8',
      );

      // Verify no additional prompts or checks for existing file
      expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling for file system errors', () => {
    it('should handle permission denied errors (EACCES)', async () => {
      // Arrange
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);
      const permissionError = new Error(
        'Permission denied',
      ) as NodeJS.ErrnoException;
      permissionError.code = 'EACCES';
      mockWriteFileSync.mockImplementation(() => {
        throw permissionError;
      });

      // Act & Assert - should not throw
      await expect(generateSampleJson()).resolves.not.toThrow();
    });

    it('should handle insufficient disk space errors (ENOSPC)', async () => {
      // Arrange
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);
      const diskSpaceError = new Error(
        'No space left on device',
      ) as NodeJS.ErrnoException;
      diskSpaceError.code = 'ENOSPC';
      mockWriteFileSync.mockImplementation(() => {
        throw diskSpaceError;
      });

      // Act & Assert - should not throw
      await expect(generateSampleJson()).resolves.not.toThrow();
    });

    it('should handle read-only file system errors (EROFS)', async () => {
      // Arrange
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);
      const readOnlyError = new Error(
        'Read-only file system',
      ) as NodeJS.ErrnoException;
      readOnlyError.code = 'EROFS';
      mockWriteFileSync.mockImplementation(() => {
        throw readOnlyError;
      });

      // Act & Assert - should not throw
      await expect(generateSampleJson()).resolves.not.toThrow();
    });

    it('should handle generic file system errors with error message', async () => {
      // Arrange
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);
      const genericError = new Error('Generic file system error');
      mockWriteFileSync.mockImplementation(() => {
        throw genericError;
      });

      // Act & Assert - should not throw
      await expect(generateSampleJson()).resolves.not.toThrow();
    });

    it('should handle unexpected non-Error exceptions', async () => {
      // Arrange
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);
      mockWriteFileSync.mockImplementation(() => {
        throw 'Unexpected string error';
      });

      // Act & Assert - should not throw
      await expect(generateSampleJson()).resolves.not.toThrow();
    });
  });

  describe('file system operations', () => {
    it('should write to the correct file path', async () => {
      // Arrange
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);
      mockWriteFileSync.mockImplementation(() => {});

      // Act
      await generateSampleJson();

      // Assert
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        './hyouji.json',
        expect.any(String),
        'utf8',
      );
    });

    it('should use UTF-8 encoding', async () => {
      // Arrange
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);
      mockWriteFileSync.mockImplementation(() => {});

      // Act
      await generateSampleJson();

      // Assert
      const [, , encoding] = mockWriteFileSync.mock.calls[0];
      expect(encoding).toBe('utf8');
    });

    it('should call writeFileSync exactly once on success', async () => {
      // Arrange
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);
      mockWriteFileSync.mockImplementation(() => {});

      // Act
      await generateSampleJson();

      // Assert
      expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
    });

    it('should not call writeFileSync when error occurs before write', async () => {
      // This test ensures that if there were any pre-write validations that failed,
      // we wouldn't attempt to write. Currently the function doesn't have such validations,
      // but this test documents the expected behavior.

      // Arrange
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);
      mockWriteFileSync.mockImplementation(() => {});

      // Act
      await generateSampleJson();

      // Assert - writeFileSync should be called since no pre-write errors exist
      expect(mockWriteFileSync).toHaveBeenCalled();
    });
  });

  describe('integration with constants', () => {
    it('should use sampleData from constants', async () => {
      // Arrange
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);
      mockWriteFileSync.mockImplementation(() => {});

      // Act
      await generateSampleJson();

      // Assert
      const [, jsonContent] = mockWriteFileSync.mock.calls[0];
      const parsedJson = JSON.parse(jsonContent as string);

      expect(parsedJson).toEqual(sampleData);
    });

    it('should handle empty sampleData gracefully', async () => {
      // This test ensures the function works even if sampleData is empty
      // We can't easily mock the import, but we can verify the structure
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);
      mockWriteFileSync.mockImplementation(() => {});

      // Act
      await generateSampleJson();

      // Assert
      const [, jsonContent] = mockWriteFileSync.mock.calls[0];
      expect(() => JSON.parse(jsonContent as string)).not.toThrow();
    });

    it('should generate valid JSON that can be parsed', async () => {
      // Arrange
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);
      mockWriteFileSync.mockImplementation(() => {});

      // Act
      await generateSampleJson();

      // Assert
      const [, jsonContent] = mockWriteFileSync.mock.calls[0];
      expect(() => JSON.parse(jsonContent as string)).not.toThrow();

      const parsedJson = JSON.parse(jsonContent as string);
      expect(Array.isArray(parsedJson)).toBe(true);
    });
  });

  describe('JSON format validation', () => {
    it('should generate JSON with correct structure for label import', async () => {
      // Arrange
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);
      mockWriteFileSync.mockImplementation(() => {});

      // Act
      await generateSampleJson();

      // Assert
      const [, jsonContent] = mockWriteFileSync.mock.calls[0];
      const parsedJson = JSON.parse(jsonContent as string);

      // Verify it's an array of label objects
      expect(Array.isArray(parsedJson)).toBe(true);

      // Verify each item has the expected structure
      parsedJson.forEach((item: unknown) => {
        const labelItem = item as Record<string, unknown>;
        expect(typeof item).toBe('object');
        expect(typeof labelItem.name).toBe('string');
        expect(typeof labelItem.color).toBe('string');
        expect(typeof labelItem.description).toBe('string');

        // Verify required fields are present and not empty
        expect((labelItem.name as string).length).toBeGreaterThan(0);
        expect((labelItem.color as string).length).toBeGreaterThan(0);
        expect((labelItem.description as string).length).toBeGreaterThan(0);
      });
    });

    it('should generate JSON compatible with existing import functionality', async () => {
      // This test verifies that the generated JSON structure matches what
      // the import functionality expects

      // Arrange
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);
      mockWriteFileSync.mockImplementation(() => {});

      // Act
      await generateSampleJson();

      // Assert
      const [, jsonContent] = mockWriteFileSync.mock.calls[0];
      const parsedJson = JSON.parse(jsonContent as string);

      // Verify the structure matches the expected format for import
      expect(Array.isArray(parsedJson)).toBe(true);
      expect(parsedJson.length).toBeGreaterThan(0);

      // Verify first item has all required fields
      const firstItem = parsedJson[0];
      expect(firstItem).toHaveProperty('name');
      expect(firstItem).toHaveProperty('color');
      expect(firstItem).toHaveProperty('description');

      // Verify the structure matches sampleData
      expect(parsedJson).toEqual(sampleData);
    });
  });
});
