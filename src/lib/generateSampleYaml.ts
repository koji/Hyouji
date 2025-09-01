import * as fs from 'fs';

import chalk from 'chalk';
import yaml from 'js-yaml';

import { sampleData } from '../constant.js';

const log = console.log;

export const generateSampleYaml = async (): Promise<void> => {
  try {
    // Define the output file path
    const outputPath = './hyouji.yaml';

    // Format the sample data as YAML with proper indentation
    const yamlContent = yaml.dump(sampleData, {
      indent: 2,
      lineWidth: -1, // Disable line wrapping
      noRefs: true, // Disable references
      quotingType: '"', // Use double quotes for strings
      forceQuotes: false, // Only quote when necessary
    });

    // Provide immediate feedback that operation is starting
    log(chalk.blue('Generating sample YAML file...'));

    // Write the YAML content to the file
    fs.writeFileSync(outputPath, yamlContent, 'utf8');

    // Display success message
    log(
      chalk.green(
        '✅ Sample YAML file generated successfully at ./hyouji.yaml',
      ),
    );
  } catch (error) {
    // Handle different types of errors with appropriate messages
    if (error instanceof Error) {
      // Check for common file system errors by checking the error code property
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code === 'EACCES') {
        log(
          chalk.red(
            '❌ Error generating sample YAML file: Permission denied. Please check write permissions for the current directory.',
          ),
        );
      } else if (nodeError.code === 'ENOSPC') {
        log(
          chalk.red(
            '❌ Error generating sample YAML file: Insufficient disk space.',
          ),
        );
      } else if (nodeError.code === 'EROFS') {
        log(
          chalk.red(
            '❌ Error generating sample YAML file: Read-only file system.',
          ),
        );
      } else {
        log(
          chalk.red(`❌ Error generating sample YAML file: ${error.message}`),
        );
      }
    } else {
      log(
        chalk.red(
          '❌ An unexpected error occurred while generating the sample YAML file',
        ),
      );
    }
  }
};
