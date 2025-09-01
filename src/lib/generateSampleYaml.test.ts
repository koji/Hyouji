import * as fs from 'fs';

import yaml from 'js-yaml';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sampleData } from '../constant.js';

import { generateSampleYaml } from './generateSampleYaml';

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

describe('generateSampleYaml', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Successful generation', () => {
    it('should generate YAML file with correct path', async () => {
      // Arrange
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);

      // Act
      await generateSampleYaml();

      // Assert
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        './hyouji.yaml',
        expect.any(String),
        'utf8',
      );
    });

    it('should generate YAML with correct content structure', async () => {
      // Arrange
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);

      // Act
      await generateSampleYaml();

      // Assert
      expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
      const [, yamlContent] = mockWriteFileSync.mock.calls[0];

      // Parse the generated YAML to verify structure
      const parsedYaml = yaml.load(yamlContent as string);
      expect(parsedYaml).toEqual(sampleData);
    });

    it('should generate valid YAML syntax', async () => {
      // Arrange
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);

      // Act
      await generateSampleYaml();

      // Assert
      const [, yamlContent] = mockWriteFileSync.mock.calls[0];

      // Should not throw when parsing the generated YAML
      expect(() => yaml.load(yamlContent as string)).not.toThrow();
    });

    it('should preserve all sample data fields correctly', async () => {
      // Arrange
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);

      // Act
      await generateSampleYaml();

      // Assert
      const [, yamlContent] = mockWriteFileSync.mock.calls[0];
      const parsedYaml = yaml.load(yamlContent as string) as typeof sampleData;

      // Verify all fields are preserved
      expect(parsedYaml).toHaveLength(sampleData.length);
      parsedYaml.forEach((label, index) => {
        expect(label.name).toBe(sampleData[index].name);
        expect(label.color).toBe(sampleData[index].color);
        expect(label.description).toBe(sampleData[index].description);
      });
    });
  });

  describe('Error handling', () => {
    it('should handle EACCES error (permission denied)', async () => {
      // Arrange
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);
      const error = new Error('Permission denied') as NodeJS.ErrnoException;
      error.code = 'EACCES';
      mockWriteFileSync.mockImplementation(() => {
        throw error;
      });

      // Act & Assert - should not throw
      await expect(generateSampleYaml()).resolves.not.toThrow();
    });

    it('should handle ENOSPC error (insufficient disk space)', async () => {
      // Arrange
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);
      const error = new Error('No space left') as NodeJS.ErrnoException;
      error.code = 'ENOSPC';
      mockWriteFileSync.mockImplementation(() => {
        throw error;
      });

      // Act & Assert - should not throw
      await expect(generateSampleYaml()).resolves.not.toThrow();
    });

    it('should handle EROFS error (read-only file system)', async () => {
      // Arrange
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);
      const error = new Error('Read-only') as NodeJS.ErrnoException;
      error.code = 'EROFS';
      mockWriteFileSync.mockImplementation(() => {
        throw error;
      });

      // Act & Assert - should not throw
      await expect(generateSampleYaml()).resolves.not.toThrow();
    });

    it('should handle generic Error objects', async () => {
      // Arrange
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);
      const error = new Error('Generic error message');
      mockWriteFileSync.mockImplementation(() => {
        throw error;
      });

      // Act & Assert - should not throw
      await expect(generateSampleYaml()).resolves.not.toThrow();
    });

    it('should handle non-Error objects', async () => {
      // Arrange
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);
      mockWriteFileSync.mockImplementation(() => {
        throw 'String error';
      });

      // Act & Assert - should not throw
      await expect(generateSampleYaml()).resolves.not.toThrow();
    });
  });

  describe('YAML format validation', () => {
    it('should generate YAML with correct structure for label import', async () => {
      // Arrange
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);

      // Act
      await generateSampleYaml();

      // Assert
      const [, yamlContent] = mockWriteFileSync.mock.calls[0];
      const parsedYaml = yaml.load(yamlContent as string) as typeof sampleData;

      // Should be an array
      expect(Array.isArray(parsedYaml)).toBe(true);

      // Each item should have required structure
      parsedYaml.forEach((item) => {
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('color');
        expect(item).toHaveProperty('description');
        expect(typeof item.name).toBe('string');
        expect(typeof item.color).toBe('string');
        expect(typeof item.description).toBe('string');
      });
    });

    it('should generate YAML that matches sample data exactly', async () => {
      // Arrange
      const mockWriteFileSync = vi.mocked(fs.writeFileSync);

      // Act
      await generateSampleYaml();

      // Assert
      const [, yamlContent] = mockWriteFileSync.mock.calls[0];
      const parsedYaml = yaml.load(yamlContent as string);

      expect(parsedYaml).toEqual(sampleData);
    });
  });
});
