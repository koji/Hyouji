import * as fs from 'fs';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as callApi from './callApi.js';
import { importLabelsFromFile } from './importLabels.js';

// Mock dependencies
vi.mock('fs');
vi.mock('./callApi.js');

const mockFs = vi.mocked(fs);
const mockCallApi = vi.mocked(callApi);

describe('importLabelsFromFile', () => {
  const mockConfig = {
    octokit: {} as ConfigType['octokit'], // Mock Octokit instance
    owner: 'test-owner',
    repo: 'test-repo',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.log to avoid test output noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('JSON format support', () => {
    it('should successfully import valid JSON file', async () => {
      const jsonContent = JSON.stringify([
        { name: 'bug', color: 'd73a4a', description: 'Bug reports' },
        { name: 'feature', color: 'a2eeef', description: 'New features' },
      ]);

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(jsonContent);
      mockCallApi.createLabel.mockResolvedValue(undefined);

      await importLabelsFromFile(mockConfig, 'test.json');

      expect(mockCallApi.createLabel).toHaveBeenCalledTimes(2);
      expect(mockCallApi.createLabel).toHaveBeenCalledWith(mockConfig, {
        name: 'bug',
        color: 'd73a4a',
        description: 'Bug reports',
      });
    });

    it('should handle JSON parsing errors', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid json');

      await importLabelsFromFile(mockConfig, 'test.json');

      expect(mockCallApi.createLabel).not.toHaveBeenCalled();
    });
  });

  describe('YAML format support', () => {
    it('should successfully import valid YAML file', async () => {
      const yamlContent = `
- name: 'bug'
  color: 'd73a4a'
  description: 'Bug reports'
- name: 'feature'
  color: 'a2eeef'
  description: 'New features'
`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(yamlContent);
      mockCallApi.createLabel.mockResolvedValue(undefined);

      await importLabelsFromFile(mockConfig, 'test.yaml');

      expect(mockCallApi.createLabel).toHaveBeenCalledTimes(2);
      expect(mockCallApi.createLabel).toHaveBeenCalledWith(mockConfig, {
        name: 'bug',
        color: 'd73a4a',
        description: 'Bug reports',
      });
    });

    it('should handle YAML parsing errors', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid: yaml: content: [');

      await importLabelsFromFile(mockConfig, 'test.yaml');

      expect(mockCallApi.createLabel).not.toHaveBeenCalled();
    });

    it('should handle YAML syntax errors with detailed messages', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('name: test\n  invalid: indentation');

      await importLabelsFromFile(mockConfig, 'test.yaml');

      expect(mockCallApi.createLabel).not.toHaveBeenCalled();
    });

    it('should handle YAML with invalid mapping structure', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('name: test\n- invalid: mixed');

      await importLabelsFromFile(mockConfig, 'test.yaml');

      expect(mockCallApi.createLabel).not.toHaveBeenCalled();
    });

    it('should handle YAML with unclosed brackets', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('items: [item1, item2');

      await importLabelsFromFile(mockConfig, 'test.yaml');

      expect(mockCallApi.createLabel).not.toHaveBeenCalled();
    });

    it('should handle YAML with invalid anchor references', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('name: *undefined_anchor');

      await importLabelsFromFile(mockConfig, 'test.yaml');

      expect(mockCallApi.createLabel).not.toHaveBeenCalled();
    });

    it('should handle empty YAML files gracefully', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('');

      await importLabelsFromFile(mockConfig, 'test.yaml');

      expect(mockCallApi.createLabel).not.toHaveBeenCalled();
    });

    it('should handle YAML files with null content', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('null');

      await importLabelsFromFile(mockConfig, 'test.yaml');

      expect(mockCallApi.createLabel).not.toHaveBeenCalled();
    });

    it('should support .yml extension', async () => {
      const yamlContent = `
- name: 'test'
  color: 'ffffff'
`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(yamlContent);
      mockCallApi.createLabel.mockResolvedValue(undefined);

      await importLabelsFromFile(mockConfig, 'test.yml');

      expect(mockCallApi.createLabel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Format detection', () => {
    it('should reject unsupported file formats', async () => {
      mockFs.existsSync.mockReturnValue(true);

      await importLabelsFromFile(mockConfig, 'test.txt');

      expect(mockFs.readFileSync).not.toHaveBeenCalled();
      expect(mockCallApi.createLabel).not.toHaveBeenCalled();
    });

    it('should reject .xml files with proper error message', async () => {
      mockFs.existsSync.mockReturnValue(true);

      await importLabelsFromFile(mockConfig, 'test.xml');

      expect(mockFs.readFileSync).not.toHaveBeenCalled();
      expect(mockCallApi.createLabel).not.toHaveBeenCalled();
    });

    it('should reject .csv files with proper error message', async () => {
      mockFs.existsSync.mockReturnValue(true);

      await importLabelsFromFile(mockConfig, 'test.csv');

      expect(mockFs.readFileSync).not.toHaveBeenCalled();
      expect(mockCallApi.createLabel).not.toHaveBeenCalled();
    });

    it('should reject files without extensions', async () => {
      mockFs.existsSync.mockReturnValue(true);

      await importLabelsFromFile(mockConfig, 'labels');

      expect(mockFs.readFileSync).not.toHaveBeenCalled();
      expect(mockCallApi.createLabel).not.toHaveBeenCalled();
    });

    it('should reject files with empty extensions', async () => {
      mockFs.existsSync.mockReturnValue(true);

      await importLabelsFromFile(mockConfig, 'labels.');

      expect(mockFs.readFileSync).not.toHaveBeenCalled();
      expect(mockCallApi.createLabel).not.toHaveBeenCalled();
    });

    it('should handle file not found', async () => {
      mockFs.existsSync.mockReturnValue(false);

      await importLabelsFromFile(mockConfig, 'nonexistent.json');

      expect(mockFs.readFileSync).not.toHaveBeenCalled();
      expect(mockCallApi.createLabel).not.toHaveBeenCalled();
    });
  });

  describe('Data validation consistency across formats', () => {
    describe('Array structure validation', () => {
      it('should validate that JSON content is an array', async () => {
        const jsonContent = JSON.stringify({ name: 'not-an-array' });

        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(jsonContent);

        await importLabelsFromFile(mockConfig, 'test.json');

        expect(mockCallApi.createLabel).not.toHaveBeenCalled();
      });

      it('should validate that YAML content is an array', async () => {
        const yamlContent = `
name: 'not-an-array'
description: 'This should be an array'
`;

        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(yamlContent);

        await importLabelsFromFile(mockConfig, 'test.yaml');

        expect(mockCallApi.createLabel).not.toHaveBeenCalled();
      });
    });

    describe('Required field validation', () => {
      it('should require name field in JSON format', async () => {
        const jsonContent = JSON.stringify([
          { name: 'valid', color: 'ffffff' },
          { color: 'ffffff' }, // missing name
          { name: 'also-valid', color: 'aaaaaa' },
        ]);

        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(jsonContent);
        mockCallApi.createLabel.mockResolvedValue(undefined);

        await importLabelsFromFile(mockConfig, 'test.json');

        expect(mockCallApi.createLabel).toHaveBeenCalledTimes(2);
        expect(mockCallApi.createLabel).toHaveBeenCalledWith(mockConfig, {
          name: 'valid',
          color: 'ffffff',
        });
        expect(mockCallApi.createLabel).toHaveBeenCalledWith(mockConfig, {
          name: 'also-valid',
          color: 'aaaaaa',
        });
      });

      it('should require name field in YAML format', async () => {
        const yamlContent = `
- name: 'valid'
  color: 'ffffff'
- color: 'ffffff' # missing name
- name: 'also-valid'
  color: 'aaaaaa'
`;

        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(yamlContent);
        mockCallApi.createLabel.mockResolvedValue(undefined);

        await importLabelsFromFile(mockConfig, 'test.yaml');

        expect(mockCallApi.createLabel).toHaveBeenCalledTimes(2);
        expect(mockCallApi.createLabel).toHaveBeenCalledWith(mockConfig, {
          name: 'valid',
          color: 'ffffff',
        });
        expect(mockCallApi.createLabel).toHaveBeenCalledWith(mockConfig, {
          name: 'also-valid',
          color: 'aaaaaa',
        });
      });
    });

    describe('Field type validation', () => {
      it('should validate field types in JSON format', async () => {
        const jsonContent = JSON.stringify([
          { name: 123, color: 'ffffff' }, // invalid name type
          { name: 'valid', color: true }, // invalid color type
          { name: 'also-valid', description: 456 }, // invalid description type
          { name: 'completely-valid', color: 'aaaaaa', description: 'test' },
        ]);

        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(jsonContent);
        mockCallApi.createLabel.mockResolvedValue(undefined);

        await importLabelsFromFile(mockConfig, 'test.json');

        expect(mockCallApi.createLabel).toHaveBeenCalledTimes(1);
        expect(mockCallApi.createLabel).toHaveBeenCalledWith(mockConfig, {
          name: 'completely-valid',
          color: 'aaaaaa',
          description: 'test',
        });
      });

      it('should validate field types in YAML format', async () => {
        const yamlContent = `
- name: 123 # invalid name type
  color: 'ffffff'
- name: 'valid'
  color: true # invalid color type
- name: 'also-valid'
  description: 456 # invalid description type
- name: 'completely-valid'
  color: 'aaaaaa'
  description: 'test'
`;

        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(yamlContent);
        mockCallApi.createLabel.mockResolvedValue(undefined);

        await importLabelsFromFile(mockConfig, 'test.yaml');

        expect(mockCallApi.createLabel).toHaveBeenCalledTimes(1);
        expect(mockCallApi.createLabel).toHaveBeenCalledWith(mockConfig, {
          name: 'completely-valid',
          color: 'aaaaaa',
          description: 'test',
        });
      });
    });

    describe('Empty field validation', () => {
      it('should reject empty name fields in JSON format', async () => {
        const jsonContent = JSON.stringify([
          { name: '', color: 'ffffff' }, // empty name
          { name: '   ', color: 'aaaaaa' }, // whitespace-only name
          { name: 'valid', color: '' }, // empty color (should be rejected)
          { name: 'also-valid', color: '   ' }, // whitespace-only color (should be rejected)
          { name: 'description-test', description: '' }, // empty description (should be allowed)
          { name: 'final-valid', color: 'bbbbbb', description: 'test' },
        ]);

        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(jsonContent);
        mockCallApi.createLabel.mockResolvedValue(undefined);

        await importLabelsFromFile(mockConfig, 'test.json');

        expect(mockCallApi.createLabel).toHaveBeenCalledTimes(2);
        expect(mockCallApi.createLabel).toHaveBeenCalledWith(mockConfig, {
          name: 'description-test',
          description: '',
        });
        expect(mockCallApi.createLabel).toHaveBeenCalledWith(mockConfig, {
          name: 'final-valid',
          color: 'bbbbbb',
          description: 'test',
        });
      });

      it('should reject empty name fields in YAML format', async () => {
        const yamlContent = `
- name: '' # empty name
  color: 'ffffff'
- name: '   ' # whitespace-only name
  color: 'aaaaaa'
- name: 'valid'
  color: '' # empty color (should be rejected)
- name: 'also-valid'
  color: '   ' # whitespace-only color (should be rejected)
- name: 'description-test'
  description: '' # empty description (should be allowed)
- name: 'final-valid'
  color: 'bbbbbb'
  description: 'test'
`;

        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(yamlContent);
        mockCallApi.createLabel.mockResolvedValue(undefined);

        await importLabelsFromFile(mockConfig, 'test.yaml');

        expect(mockCallApi.createLabel).toHaveBeenCalledTimes(2);
        expect(mockCallApi.createLabel).toHaveBeenCalledWith(mockConfig, {
          name: 'description-test',
          description: '',
        });
        expect(mockCallApi.createLabel).toHaveBeenCalledWith(mockConfig, {
          name: 'final-valid',
          color: 'bbbbbb',
          description: 'test',
        });
      });
    });

    describe('Unknown field handling', () => {
      it('should handle unknown fields with warnings in JSON format', async () => {
        const jsonContent = JSON.stringify([
          {
            name: 'test',
            color: 'ffffff',
            description: 'test desc',
            unknownField: 'should be ignored',
            anotherUnknown: 123,
          },
        ]);

        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(jsonContent);
        mockCallApi.createLabel.mockResolvedValue(undefined);

        await importLabelsFromFile(mockConfig, 'test.json');

        expect(mockCallApi.createLabel).toHaveBeenCalledWith(mockConfig, {
          name: 'test',
          color: 'ffffff',
          description: 'test desc',
        });
      });

      it('should handle unknown fields with warnings in YAML format', async () => {
        const yamlContent = `
- name: 'test'
  color: 'ffffff'
  description: 'test desc'
  unknownField: 'should be ignored'
  anotherUnknown: 123
`;

        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(yamlContent);
        mockCallApi.createLabel.mockResolvedValue(undefined);

        await importLabelsFromFile(mockConfig, 'test.yaml');

        expect(mockCallApi.createLabel).toHaveBeenCalledWith(mockConfig, {
          name: 'test',
          color: 'ffffff',
          description: 'test desc',
        });
      });
    });

    describe('Optional field handling', () => {
      it('should handle optional fields correctly in JSON format', async () => {
        const jsonContent = JSON.stringify([
          { name: 'name-only' },
          { name: 'with-color', color: 'ffffff' },
          { name: 'with-description', description: 'test desc' },
          { name: 'with-all', color: 'aaaaaa', description: 'full label' },
        ]);

        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(jsonContent);
        mockCallApi.createLabel.mockResolvedValue(undefined);

        await importLabelsFromFile(mockConfig, 'test.json');

        expect(mockCallApi.createLabel).toHaveBeenCalledTimes(4);
        expect(mockCallApi.createLabel).toHaveBeenCalledWith(mockConfig, {
          name: 'name-only',
        });
        expect(mockCallApi.createLabel).toHaveBeenCalledWith(mockConfig, {
          name: 'with-color',
          color: 'ffffff',
        });
        expect(mockCallApi.createLabel).toHaveBeenCalledWith(mockConfig, {
          name: 'with-description',
          description: 'test desc',
        });
        expect(mockCallApi.createLabel).toHaveBeenCalledWith(mockConfig, {
          name: 'with-all',
          color: 'aaaaaa',
          description: 'full label',
        });
      });

      it('should handle optional fields correctly in YAML format', async () => {
        const yamlContent = `
- name: 'name-only'
- name: 'with-color'
  color: 'ffffff'
- name: 'with-description'
  description: 'test desc'
- name: 'with-all'
  color: 'aaaaaa'
  description: 'full label'
`;

        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(yamlContent);
        mockCallApi.createLabel.mockResolvedValue(undefined);

        await importLabelsFromFile(mockConfig, 'test.yaml');

        expect(mockCallApi.createLabel).toHaveBeenCalledTimes(4);
        expect(mockCallApi.createLabel).toHaveBeenCalledWith(mockConfig, {
          name: 'name-only',
        });
        expect(mockCallApi.createLabel).toHaveBeenCalledWith(mockConfig, {
          name: 'with-color',
          color: 'ffffff',
        });
        expect(mockCallApi.createLabel).toHaveBeenCalledWith(mockConfig, {
          name: 'with-description',
          description: 'test desc',
        });
        expect(mockCallApi.createLabel).toHaveBeenCalledWith(mockConfig, {
          name: 'with-all',
          color: 'aaaaaa',
          description: 'full label',
        });
      });
    });

    describe('Non-object validation', () => {
      it('should skip non-object items in JSON format', async () => {
        const jsonContent = JSON.stringify([
          'string-item', // not an object
          123, // not an object
          null, // not an object
          { name: 'valid', color: 'ffffff' },
          [], // not a valid object
          { name: 'also-valid', color: 'aaaaaa' },
        ]);

        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(jsonContent);
        mockCallApi.createLabel.mockResolvedValue(undefined);

        await importLabelsFromFile(mockConfig, 'test.json');

        expect(mockCallApi.createLabel).toHaveBeenCalledTimes(2);
        expect(mockCallApi.createLabel).toHaveBeenCalledWith(mockConfig, {
          name: 'valid',
          color: 'ffffff',
        });
        expect(mockCallApi.createLabel).toHaveBeenCalledWith(mockConfig, {
          name: 'also-valid',
          color: 'aaaaaa',
        });
      });

      it('should skip non-object items in YAML format', async () => {
        const yamlContent = `
- 'string-item' # not an object
- 123 # not an object
- null # not an object
- name: 'valid'
  color: 'ffffff'
- [] # not a valid object
- name: 'also-valid'
  color: 'aaaaaa'
`;

        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(yamlContent);
        mockCallApi.createLabel.mockResolvedValue(undefined);

        await importLabelsFromFile(mockConfig, 'test.yaml');

        expect(mockCallApi.createLabel).toHaveBeenCalledTimes(2);
        expect(mockCallApi.createLabel).toHaveBeenCalledWith(mockConfig, {
          name: 'valid',
          color: 'ffffff',
        });
        expect(mockCallApi.createLabel).toHaveBeenCalledWith(mockConfig, {
          name: 'also-valid',
          color: 'aaaaaa',
        });
      });
    });

    describe('Empty array handling', () => {
      it('should handle empty arrays in JSON format', async () => {
        const jsonContent = JSON.stringify([]);

        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(jsonContent);

        await importLabelsFromFile(mockConfig, 'test.json');

        expect(mockCallApi.createLabel).not.toHaveBeenCalled();
      });

      it('should handle empty arrays in YAML format', async () => {
        const yamlContent = '[]';

        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(yamlContent);

        await importLabelsFromFile(mockConfig, 'test.yaml');

        expect(mockCallApi.createLabel).not.toHaveBeenCalled();
      });
    });
  });

  describe('Error handling during import', () => {
    it('should continue processing after individual label failures', async () => {
      const jsonContent = JSON.stringify([
        { name: 'success1', color: 'ffffff' },
        { name: 'failure', color: 'aaaaaa' },
        { name: 'success2', color: 'bbbbbb' },
      ]);

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(jsonContent);
      mockCallApi.createLabel
        .mockResolvedValueOnce(undefined) // success1
        .mockRejectedValueOnce(new Error('API Error')) // failure
        .mockResolvedValueOnce(undefined); // success2

      await importLabelsFromFile(mockConfig, 'test.json');

      expect(mockCallApi.createLabel).toHaveBeenCalledTimes(3);
    });
  });
});
