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

// set up configs to access GitHub repo
const setupConfigs = async () => {
  console.log(initialText);

  // Migrate existing configuration to encrypted format if needed
  if (firstStart) {
    await configManager.migrateToEncrypted();
  }

  // Get configuration (either from saved config or prompts)
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
      return setupConfigs(); // Retry with fresh prompts
    }
    throw new Error(
      `GitHub API authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }

  return config;
};

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

// steps
// first call setupConfigs
let configs: ConfigType;
const main = async () => {
  const confirmation = await getConfirmation();
  if (!confirmation) {
    log(
      chalk.redBright(
        `Please go to ${linkToPersonalToken} and generate a personal token!`,
      ),
    );
    return;
  }

  if (firstStart) {
    const asciiText = await getAsciiText();
    log(asciiText);
    try {
      configs = await setupConfigs();
      if (configs.fromSavedConfig) {
        log(chalk.green(`Using saved configuration for ${configs.owner}`));
      }
    } catch (error) {
      log(
        chalk.red(
          `Configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ),
      );
      return;
    }
  }

  let selectedIndex = await selectAction();
  while (selectedIndex == 99) {
    selectedIndex = await selectAction();
  }

  switch (selectedIndex) {
    case 0: {
      const newLabel = await getNewLabel();
      createLabel(configs, newLabel);
      firstStart = firstStart && false;
      break;
    }

    case 1: {
      // console.log('create labels');
      createLabels(configs);
      firstStart = firstStart && false;
      break;
    }

    case 2: {
      // console.log('delete a label');
      const targetLabel = await getTargetLabel();
      deleteLabel(configs, targetLabel);
      firstStart = firstStart && false;
      break;
    }

    case 3: {
      // console.log('delete all labels');
      deleteLabels(configs);
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
      await displaySettings();
      firstStart = firstStart && false;
      break;
    }

    case 6: {
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
