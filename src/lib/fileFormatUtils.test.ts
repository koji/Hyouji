import { describe, expect, it } from 'vitest'

import {
  detectFileFormat,
  formatSupportedExtensions,
  getSupportedExtensions,
  parseJsonContent,
  parseYamlContent,
} from './fileFormatUtils.js'

describe('fileFormatUtils', () => {
  describe('detectFileFormat', () => {
    it('should detect JSON format for .json extension', () => {
      expect(detectFileFormat('labels.json')).toBe('json')
      expect(detectFileFormat('/path/to/labels.json')).toBe('json')
      expect(detectFileFormat('nested/path/labels.json')).toBe('json')
    })

    it('should detect YAML format for .yaml extension', () => {
      expect(detectFileFormat('labels.yaml')).toBe('yaml')
      expect(detectFileFormat('/path/to/labels.yaml')).toBe('yaml')
      expect(detectFileFormat('nested/path/labels.yaml')).toBe('yaml')
    })

    it('should detect YAML format for .yml extension', () => {
      expect(detectFileFormat('labels.yml')).toBe('yaml')
      expect(detectFileFormat('/path/to/labels.yml')).toBe('yaml')
      expect(detectFileFormat('nested/path/labels.yml')).toBe('yaml')
    })

    it('should handle case-insensitive extensions', () => {
      expect(detectFileFormat('labels.JSON')).toBe('json')
      expect(detectFileFormat('labels.YAML')).toBe('yaml')
      expect(detectFileFormat('labels.YML')).toBe('yaml')
      expect(detectFileFormat('labels.Json')).toBe('json')
      expect(detectFileFormat('labels.Yaml')).toBe('yaml')
    })

    it('should return null for unsupported extensions', () => {
      expect(detectFileFormat('labels.txt')).toBeNull()
      expect(detectFileFormat('labels.xml')).toBeNull()
      expect(detectFileFormat('labels.csv')).toBeNull()
      expect(detectFileFormat('labels')).toBeNull()
      expect(detectFileFormat('labels.')).toBeNull()
    })

    it('should handle files without extensions', () => {
      expect(detectFileFormat('labels')).toBeNull()
      expect(detectFileFormat('/path/to/labels')).toBeNull()
    })

    it('should handle complex file paths', () => {
      expect(detectFileFormat('/home/user/project/config/labels.json')).toBe(
        'json',
      )
      expect(detectFileFormat('C:\\Users\\user\\project\\labels.yaml')).toBe(
        'yaml',
      )
      expect(detectFileFormat('./relative/path/labels.yml')).toBe('yaml')
    })
  })

  describe('parseJsonContent', () => {
    it('should parse valid JSON content', () => {
      const jsonString = '{"name": "test", "value": 123}'
      const result = parseJsonContent(jsonString)
      expect(result).toEqual({ name: 'test', value: 123 })
    })

    it('should parse JSON arrays', () => {
      const jsonString = '[{"name": "label1"}, {"name": "label2"}]'
      const result = parseJsonContent(jsonString)
      expect(result).toEqual([{ name: 'label1' }, { name: 'label2' }])
    })

    it('should throw error for invalid JSON', () => {
      const invalidJson = '{"name": "test", "value":}'
      expect(() => parseJsonContent(invalidJson)).toThrow()
    })

    it('should handle empty JSON objects and arrays', () => {
      expect(parseJsonContent('{}')).toEqual({})
      expect(parseJsonContent('[]')).toEqual([])
    })
  })

  describe('parseYamlContent', () => {
    it('should parse valid YAML content', () => {
      const yamlString = 'name: test\nvalue: 123'
      const result = parseYamlContent(yamlString)
      expect(result).toEqual({ name: 'test', value: 123 })
    })

    it('should parse YAML arrays', () => {
      const yamlString = '- name: label1\n- name: label2'
      const result = parseYamlContent(yamlString)
      expect(result).toEqual([{ name: 'label1' }, { name: 'label2' }])
    })

    it('should parse complex YAML structures', () => {
      const yamlString = `
- name: 'bug'
  color: 'd73a4a'
  description: "Something isn't working"
- name: 'enhancement'
  color: 'a2eeef'
  description: 'New feature or request'
      `.trim()
      const result = parseYamlContent(yamlString)
      expect(result).toEqual([
        {
          name: 'bug',
          color: 'd73a4a',
          description: "Something isn't working",
        },
        {
          name: 'enhancement',
          color: 'a2eeef',
          description: 'New feature or request',
        },
      ])
    })

    it('should throw error for invalid YAML', () => {
      const invalidYaml = 'name: test\n  invalid: indentation'
      expect(() => parseYamlContent(invalidYaml)).toThrow()
    })

    it('should throw detailed error for YAML syntax errors', () => {
      const invalidYaml = 'name: test\n  invalid: indentation'
      expect(() => parseYamlContent(invalidYaml)).toThrow(/YAMLException/)
    })

    it('should handle YAML with invalid mapping structure', () => {
      const invalidYaml = 'name: test\n- invalid: mixed structure'
      expect(() => parseYamlContent(invalidYaml)).toThrow()
    })

    it('should handle YAML with unclosed brackets', () => {
      const invalidYaml = 'items: [item1, item2'
      expect(() => parseYamlContent(invalidYaml)).toThrow()
    })

    it('should handle YAML with invalid escape sequences', () => {
      const invalidYaml = 'name: "invalid \\x escape"'
      expect(() => parseYamlContent(invalidYaml)).toThrow()
    })

    it('should handle YAML with duplicate keys', () => {
      const invalidYaml = 'name: first\nname: duplicate'
      // js-yaml throws an error for duplicate keys by default
      expect(() => parseYamlContent(invalidYaml)).toThrow(
        /YAMLException.*duplicated mapping key/,
      )
    })

    it('should handle YAML with invalid indentation in arrays', () => {
      const invalidYaml = '- name: item1\n  - name: item2' // Invalid mixed indentation
      expect(() => parseYamlContent(invalidYaml)).toThrow()
    })

    it('should handle YAML with tab characters (should work)', () => {
      const yamlWithTabs = 'name:\ttest\nvalue:\t123'
      expect(() => parseYamlContent(yamlWithTabs)).not.toThrow()
    })

    it('should handle YAML with invalid anchor references', () => {
      const invalidYaml = 'name: *undefined_anchor'
      expect(() => parseYamlContent(invalidYaml)).toThrow()
    })

    it('should handle empty YAML content', () => {
      expect(parseYamlContent('')).toBeUndefined()
      expect(parseYamlContent('null')).toBeNull()
    })

    it('should handle YAML with quotes and special characters', () => {
      const yamlString = `name: "test with spaces"\ndescription: 'single quotes'`
      const result = parseYamlContent(yamlString)
      expect(result).toEqual({
        name: 'test with spaces',
        description: 'single quotes',
      })
    })
  })

  describe('getSupportedExtensions', () => {
    it('should return array of supported extensions', () => {
      const extensions = getSupportedExtensions()
      expect(extensions).toEqual(['.json', '.yaml', '.yml'])
      expect(extensions).toHaveLength(3)
    })

    it('should return a new array each time (not mutate original)', () => {
      const extensions1 = getSupportedExtensions()
      const extensions2 = getSupportedExtensions()
      expect(extensions1).toEqual(extensions2)
      expect(extensions1).not.toBe(extensions2) // Different array instances
    })
  })

  describe('formatSupportedExtensions', () => {
    it('should return formatted string of supported extensions', () => {
      const formatted = formatSupportedExtensions()
      expect(formatted).toBe('.json, .yaml, .yml')
    })

    it('should be consistent with getSupportedExtensions', () => {
      const extensions = getSupportedExtensions()
      const formatted = formatSupportedExtensions()
      expect(formatted).toBe(extensions.join(', '))
    })
  })
})
