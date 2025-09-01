import chalk from 'chalk';

import { getAsciiText, initialText, linkToPersonalToken } from './constant.js';
import {
  createLabel,
  createLabels,
  deleteLabel,
  deleteLabels,
} from './lib/callApi.js';
import { ConfigManager } from './lib/configManager.js';
import { getConfirmation } from './lib/confirmToken.js';
import { CryptoUtils } from './lib/cryptoUtils.js';
import { generateSampleJson } from './lib/generateSampleJson.js';
import { importLabelsFromJson } from './lib/importJson.js';
import { getTargetLabel } from './lib/inputDeleteLabel.js';
import { getGitHubConfigs } from './lib/inputGitHubConfig.js';
import { getJsonFilePath } from './lib/inputJsonFile.js';
import { getNewLabel } from './lib/inputNewLabel.js';
import { selectAction } from './lib/selectPrompts.js';
import { ConfigType } from './types/index.js';

const log = console.log;

let firstStart = true;
const configManager = new ConfigManager();

// Display current settings
const displaySettings = async () => {
  log(chalk.cyan('\n=== Current Settings ==='));

  const configPath = configManager.getConfigPath();
  log(chalk.blue(`Configuration file path: ${configPath}`));

  if (!configManager.configExists()) {
    log(
      chalk.yellow(
        'No configuration file exists. You will be prompted for credentials on next action.',
      ),
    );
    return;
  }

  try {
    const config = await configManager.loadConfig();

    if (!config) {
      log(chalk.yellow('Configuration file exists but contains invalid data.'));
      return;
    }

    log(chalk.green(`GitHub account: ${config.owner}`));

    if (config.token) {
      const isEncrypted = CryptoUtils.isTokenEncrypted(config.token);
      const tokenStatus = isEncrypted
        ? '✓ Saved and encrypted'
        : '✓ Saved (plain text)';
      log(chalk.green(`Personal token: ${tokenStatus}`));

      // Show obfuscated version of the actual token (decrypted)
      const actualToken = CryptoUtils.decryptToken(config.token);
      const obfuscatedToken = CryptoUtils.obfuscateToken(actualToken);
      log(chalk.blue(`Token preview: ${obfuscatedToken}`));
    } else {
      log(chalk.red('Personal token: ✗ Not saved'));
    }

    if (config.lastUpdated) {
      const lastUpdated = new Date(config.lastUpdated);
      log(chalk.blue(`Last updated: ${lastUpdated.toLocaleString()}`));
    }
  } catch (error) {
    log(
      chalk.red(
        `Error reading configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ),
    );
  }

  log(chalk.cyan('========================\n'));
};

// Global configuration variable
let configs: ConfigType;

const initializeConfigs = async () => {
  // Check if we have a valid saved configuration before asking for confirmation
  let hasValidConfig = false;

  if (configManager.configExists()) {
    try {
      const existingConfig = await configManager.loadValidatedConfig();
      if (
        existingConfig &&
        existingConfig.config &&
        !existingConfig.shouldPromptForCredentials
      ) {
        hasValidConfig = true;
      }
    } catch (error) {
      // If there's an error loading config, assume we need to ask for confirmation
      console.error('Error loading config:', error);
      hasValidConfig = false;
    }
  }

  // Only ask for confirmation if we don't have a valid saved configuration
  if (!hasValidConfig) {
    const confirmation = await getConfirmation();
    if (!confirmation) {
      log(
        chalk.redBright(
          `Please go to ${linkToPersonalToken} and generate a personal token!`,
        ),
      );
      return null;
    }
  }

  try {
    const asciiText = await getAsciiText();
    if (asciiText != null) {
      log(asciiText);
    }
  } catch (error) {
    // If ASCII art fails, continue without it
    console.warn('Failed to display ASCII art, continuing...');
    console.error('Error:', error);
  }

  try {
    console.log(initialText);

    // Migrate existing configuration to encrypted format if needed
    if (firstStart) {
      await configManager.migrateToEncrypted();
    }

    // Use the unified getGitHubConfigs function which handles both auto-detection and manual input
    const config = await getGitHubConfigs();

    // Validate configuration before use
    if (!config.octokit || !config.owner || !config.repo) {
      throw new Error('Invalid configuration: missing required fields');
    }

    // Test the configuration by making a simple API call
    try {
      await config.octokit.request('GET /user');
    } catch (error) {
      // If the token is invalid, clear saved config and prompt again
      if (config.fromSavedConfig) {
        console.log(
          chalk.yellow(
            'Saved credentials are invalid. Please provide new credentials.',
          ),
        );
        await configManager.clearConfig();
        return initializeConfigs(); // Retry with fresh prompts
      }
      throw new Error(
        `GitHub API authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    // Display configuration information with detection method
    if (config.fromSavedConfig) {
      log(chalk.green(`✓ Using saved configuration for ${config.owner}`));
    }

    if (config.autoDetected) {
      log(
        chalk.green(
          `✓ Repository auto-detected: ${config.owner}/${config.repo}`,
        ),
      );
      const detectionMethodText =
        config.detectionMethod === 'origin'
          ? 'origin remote'
          : config.detectionMethod === 'first-remote'
            ? 'first available remote'
            : 'manual input';
      log(chalk.gray(`  Detection method: ${detectionMethodText}`));
    } else if (config.detectionMethod === 'manual') {
      log(
        chalk.blue(`✓ Repository configured: ${config.owner}/${config.repo}`),
      );
      log(chalk.gray(`  Input method: manual`));
    }

    return config;
  } catch (error) {
    log(
      chalk.red(
        `Configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ),
    );
    return null;
  }
};

const main = async () => {
  if (firstStart) {
    configs = await initializeConfigs();
    if (!configs) {
      return; // Exit if configuration failed
    }
  }

  let selectedIndex = await selectAction();
  while (selectedIndex == 99) {
    selectedIndex = await selectAction();
  }

  switch (selectedIndex) {
    case 0: {
      const newLabel = await getNewLabel();
      await createLabel(configs, newLabel);
      firstStart = firstStart && false;
      break;
    }

    case 1: {
      // console.log('create labels');
      await createLabels(configs);
      firstStart = firstStart && false;
      break;
    }

    case 2: {
      // console.log('delete a label');
      const targetLabel = await getTargetLabel();
      await deleteLabel(configs, targetLabel);
      firstStart = firstStart && false;
      break;
    }

    case 3: {
      // console.log('delete all labels');
      await deleteLabels(configs);
      firstStart = firstStart && false;
      break;
    }

    case 4: {
      try {
        const filePath = await getJsonFilePath();
        if (filePath) {
          await importLabelsFromJson(configs, filePath);
        } else {
          log(chalk.yellow('No file path provided. Returning to main menu.'));
        }
      } catch (error) {
        log(
          chalk.red(
            `Error during JSON import: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ),
        );
      }
      firstStart = firstStart && false;
      break;
    }

    case 5: {
      try {
        await generateSampleJson();
      } catch (error) {
        log(
          chalk.red(
            `Error generating sample JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ),
        );
      }
      firstStart = firstStart && false;
      break;
    }

    case 6: {
      await displaySettings();
      firstStart = firstStart && false;
      break;
    }

    case 7: {
      console.log('exit');
      process.exit(0);
    }
    // eslint-disable-next-line no-fallthrough
    default: {
      console.log('invalid input');
      break;
    }
  }
  main();
};

main();
