import * as fs from 'fs';

import chalk from 'chalk';

import { sampleData } from '../constant.js';

const log = console.log;

export const generateSampleJson = async (): Promise<void> => {
  try {
    // Define the output file path
    const outputPath = './hyouji.json';

    // Format the sample data as JSON with proper indentation
    const jsonContent = JSON.stringify(sampleData, null, 2);

    // Provide immediate feedback that operation is starting
    log(chalk.blue('Generating sample JSON file...'));

    // Write the JSON content to the file
    fs.writeFileSync(outputPath, jsonContent, 'utf8');

    // Display success message
    log(
      chalk.green(
        '✅ Sample JSON file generated successfully at ./hyouji.json',
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
            '❌ Error generating sample JSON file: Permission denied. Please check write permissions for the current directory.',
          ),
        );
      } else if (nodeError.code === 'ENOSPC') {
        log(
          chalk.red(
            '❌ Error generating sample JSON file: Insufficient disk space.',
          ),
        );
      } else if (nodeError.code === 'EROFS') {
        log(
          chalk.red(
            '❌ Error generating sample JSON file: Read-only file system.',
          ),
        );
      } else {
        log(
          chalk.red(`❌ Error generating sample JSON file: ${error.message}`),
        );
      }
    } else {
      log(
        chalk.red(
          '❌ An unexpected error occurred while generating the sample JSON file',
        ),
      );
    }
  }
};
