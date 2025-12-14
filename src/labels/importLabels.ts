import chalk from 'chalk'
import * as fs from 'fs'

import { ConfigType, ImportLabelType } from '../types/index.js'

import { createLabel } from '../github/callApi.js'
import {
  detectFileFormat,
  formatSupportedExtensions,
  parseJsonContent,
  parseYamlContent,
} from '../utils/fileFormatUtils.js'

const log = console.log

export type ImportSummary = {
  attempted: number
  succeeded: number
  failed: number
  skipped: number
}

export const importLabelsFromFile = async (
  configs: ConfigType,
  filePath: string,
  dryRun = false,
): Promise<ImportSummary> => {
  const summary: ImportSummary = {
    attempted: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
  }

  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      log(chalk.red(`Error: File not found at path: ${filePath}`))
      summary.failed += 1
      return summary
    }

    // Detect file format based on extension
    const format = detectFileFormat(filePath)
    if (!format) {
      log(
        chalk.red(
          `Error: Unsupported file format. Supported formats: ${formatSupportedExtensions()}`,
        ),
      )
      summary.failed += 1
      return summary
    }

    // Read file content
    const fileContent = fs.readFileSync(filePath, 'utf8')

    // Parse content based on detected format
    let parsedData: unknown
    try {
      if (format === 'json') {
        parsedData = parseJsonContent(fileContent)
      } else if (format === 'yaml') {
        parsedData = parseYamlContent(fileContent)
      }
    } catch (parseError) {
      const formatName = format.toUpperCase()
      log(chalk.red(`Error: Invalid ${formatName} syntax in file: ${filePath}`))
      log(
        chalk.red(
          `Parse error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
        ),
      )
      summary.failed += 1
      return summary
    }

    // Validate structure (must be array)
    if (!Array.isArray(parsedData)) {
      log(chalk.red('Error: File must contain an array of label objects'))
      summary.failed += 1
      return summary
    }

    // Validate each label object
    const validLabels: ImportLabelType[] = []
    for (let i = 0; i < parsedData.length; i++) {
      const item = parsedData[i]

      // Check if item is an object
      if (typeof item !== 'object' || item === null) {
        log(chalk.red(`Error: Item at index ${i} is not a valid object`))
        continue
      }

      const labelObj = item as Record<string, unknown>

      // Validate required name field
      if (!labelObj.name) {
        log(
          chalk.red(
            `Error: Item at index ${i} is missing required 'name' field`,
          ),
        )
        continue
      }
      if (typeof labelObj.name !== 'string') {
        log(
          chalk.red(
            `Error: Item at index ${i} has invalid 'name' field (must be a non-empty string)`,
          ),
        )
        continue
      }
      if (labelObj.name.trim() === '') {
        log(
          chalk.red(
            `Error: Item at index ${i} has empty 'name' field (name cannot be empty)`,
          ),
        )
        continue
      }

      // Validate optional color field
      if (labelObj.color !== undefined) {
        if (typeof labelObj.color !== 'string') {
          log(
            chalk.red(
              `Error: Item at index ${i} has invalid 'color' field (must be a string)`,
            ),
          )
          continue
        }
        if (labelObj.color.trim() === '') {
          log(
            chalk.red(
              `Error: Item at index ${i} has empty 'color' field (color cannot be empty if provided)`,
            ),
          )
          continue
        }
      }

      // Validate optional description field
      if (labelObj.description !== undefined) {
        if (typeof labelObj.description !== 'string') {
          log(
            chalk.red(
              `Error: Item at index ${i} has invalid 'description' field (must be a string)`,
            ),
          )
          continue
        }
        // Note: Empty description is allowed as it's a valid use case
      }

      // Check for unknown fields and warn user
      const knownFields = ['name', 'color', 'description']
      const unknownFields = Object.keys(labelObj).filter(
        (key) => !knownFields.includes(key),
      )
      if (unknownFields.length > 0) {
        log(
          chalk.yellow(
            `Warning: Item at index ${i} contains unknown fields that will be ignored: ${unknownFields.join(', ')}`,
          ),
        )
      }

      // Create valid label object
      const validLabel: ImportLabelType = {
        name: (labelObj.name as string).trim(),
        ...(labelObj.color !== undefined && {
          color: (labelObj.color as string).trim(),
        }),
        ...(labelObj.description !== undefined && {
          description: labelObj.description as string,
        }),
      }

      validLabels.push(validLabel)
    }

    // Check if we have any valid labels to import
    if (validLabels.length === 0) {
      log(chalk.red('Error: No valid labels found in file'))
      summary.failed += 1
      return summary
    }

    summary.attempted = validLabels.length

    if (dryRun) {
      validLabels.forEach((label) => {
        summary.skipped += 1
        log(chalk.yellow(`[dry-run] Would create label "${label.name}"`))
      })
      log(
        chalk.blue(
          `Dry run summary: Will create ${validLabels.length} labels, delete 0.`,
        ),
      )
      return summary
    }

    // Display number of labels to be imported
    log(chalk.blue(`Starting import of ${validLabels.length} labels...`))
    log('') // Empty line for better readability

    // Import each label using existing createLabel function with progress reporting
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < validLabels.length; i++) {
      const label = validLabels[i]
      const progress = `[${i + 1}/${validLabels.length}]`

      try {
        log(chalk.cyan(`${progress} Processing: ${label.name}`))
        await createLabel(configs, label)
        successCount++
      } catch (error) {
        errorCount++
        log(
          chalk.red(
            `${progress} Failed to create label "${label.name}": ${error instanceof Error ? error.message : 'Unknown error'}`,
          ),
        )
        // Continue processing remaining labels
      }
    }

    // Display completion message with summary
    log('') // Empty line for better readability
    if (errorCount === 0) {
      log(
        chalk.green(
          `✅ Import completed successfully! Created ${successCount} labels.`,
        ),
      )
      summary.succeeded = successCount
    } else {
      log(chalk.yellow(`⚠️  Import completed with some errors:`))
      log(chalk.green(`  • Successfully created: ${successCount} labels`))
      log(chalk.red(`  • Failed to create: ${errorCount} labels`))
      log(chalk.blue(`  • Total processed: ${validLabels.length} labels`))
      summary.succeeded = successCount
      summary.failed += errorCount
    }
  } catch (error) {
    log(
      chalk.red(
        `Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ),
    )
    summary.failed += 1
  }

  return summary
}
