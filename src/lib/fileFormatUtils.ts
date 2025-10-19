import * as yaml from 'js-yaml'
import * as path from 'path'

/**
 * Supported file formats for label import
 */
export type SupportedFormat = 'json' | 'yaml'

/**
 * Detects file format based on file extension
 * @param filePath - Path to the file
 * @returns The detected format or null if unsupported
 */
export const detectFileFormat = (filePath: string): SupportedFormat | null => {
  const extension = path.extname(filePath).toLowerCase()

  switch (extension) {
    case '.json':
      return 'json'
    case '.yaml':
    case '.yml':
      return 'yaml'
    default:
      return null
  }
}

/**
 * Parses JSON content from a string
 * @param content - The JSON content as string
 * @returns Parsed JSON data
 * @throws Error if JSON parsing fails
 */
export const parseJsonContent = (content: string): unknown => {
  return JSON.parse(content)
}

/**
 * Parses YAML content from a string
 * @param content - The YAML content as string
 * @returns Parsed YAML data
 * @throws Error if YAML parsing fails
 */
export const parseYamlContent = (content: string): unknown => {
  try {
    return yaml.load(content)
  } catch (error) {
    // Enhance YAML error messages to be more descriptive
    if (error instanceof yaml.YAMLException) {
      throw new Error(`YAMLException: ${error.message}`)
    }
    throw error
  }
}

/**
 * Gets a list of supported file extensions
 * @returns Array of supported file extensions
 */
export const getSupportedExtensions = (): string[] => {
  return ['.json', '.yaml', '.yml']
}

/**
 * Formats supported extensions for user-friendly display
 * @returns Formatted string of supported extensions
 */
export const formatSupportedExtensions = (): string => {
  return getSupportedExtensions().join(', ')
}
