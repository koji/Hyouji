import chalk from "chalk";

import {
  getAsciiText,
  initialText,
  labels,
  linkToPersonalToken,
} from "./constant.js";
import {
  createLabel,
  createLabels,
  deleteLabel,
  deleteLabels,
} from "./github/callApi.js";
import { ConfigManager } from "./config/configManager.js";
import { getConfirmation } from "./cli/confirmToken.js";
import { getDryRunChoice } from "./cli/dryRunPrompt.js";
import { CryptoUtils } from "./config/cryptoUtils.js";
import { generateSampleJson } from "./labels/generateSampleJson.js";
import { generateSampleYaml } from "./labels/generateSampleYaml.js";
import { importLabelsFromFile } from "./labels/importLabels.js";
import { getTargetLabel } from "./labels/inputDeleteLabel.js";
import { getGitHubConfigs } from "./config/inputGitHubConfig.js";
import { getLabelFilePath } from "./labels/inputLabelFile.js";
import { getNewLabel } from "./labels/inputNewLabel.js";
import { selectAction } from "./cli/selectPrompts.js";
import { ConfigType } from "./types/index.js";

const log = console.log;

let firstStart = true;
const configManager = new ConfigManager();

// Display current settings
const displaySettings = async () => {
  log(chalk.cyan("\n=== Current Settings ==="));

  const configPath = configManager.getConfigPath();
  log(chalk.blue(`Configuration file path: ${configPath}`));

  if (!configManager.configExists()) {
    log(
      chalk.yellow(
        "No configuration file exists. You will be prompted for credentials on next action."
      )
    );
    return;
  }

  try {
    const config = await configManager.loadConfig();

    if (!config) {
      log(chalk.yellow("Configuration file exists but contains invalid data."));
      return;
    }

    log(chalk.green(`GitHub account: ${config.owner}`));

    if (config.token) {
      const isEncrypted = CryptoUtils.isTokenEncrypted(config.token);
      const tokenStatus = isEncrypted
        ? "✓ Saved and encrypted"
        : "✓ Saved (plain text)";
      log(chalk.green(`Personal token: ${tokenStatus}`));

      // Show obfuscated version of the actual token (decrypted)
      const actualToken = CryptoUtils.decryptToken(config.token);
      const obfuscatedToken = CryptoUtils.obfuscateToken(actualToken);
      log(chalk.blue(`Token preview: ${obfuscatedToken}`));
    } else {
      log(chalk.red("Personal token: ✗ Not saved"));
    }

    if (config.lastUpdated) {
      const lastUpdated = new Date(config.lastUpdated);
      log(chalk.blue(`Last updated: ${lastUpdated.toLocaleString()}`));
    }
  } catch (error) {
    log(
      chalk.red(
        `Error reading configuration: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      )
    );
  }

  log(chalk.cyan("========================\n"));
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
      console.error("Error loading config:", error);
      hasValidConfig = false;
    }
  }

  // Only ask for confirmation if we don't have a valid saved configuration
  if (!hasValidConfig) {
    const confirmation = await getConfirmation();
    if (!confirmation) {
      log(
        chalk.redBright(
          `Please go to ${linkToPersonalToken} and generate a personal token!`
        )
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
    console.warn("Failed to display ASCII art, continuing...");
    console.error("Error:", error);
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
      throw new Error("Invalid configuration: missing required fields");
    }

    // Test the configuration by making a simple API call
    try {
      await config.octokit.request("GET /user");
    } catch (error) {
      // If the token is invalid, clear saved config and prompt again
      if (config.fromSavedConfig) {
        console.log(
          chalk.yellow(
            "Saved credentials are invalid. Please provide new credentials."
          )
        );
        await configManager.clearConfig();
        return initializeConfigs(); // Retry with fresh prompts
      }
      throw new Error(
        `GitHub API authentication failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    // Display configuration information with detection method
    if (config.fromSavedConfig) {
      log(chalk.green(`✓ Using saved configuration for ${config.owner}`));
    }

    if (config.autoDetected) {
      log(
        chalk.green(
          `✓ Repository auto-detected: ${config.owner}/${config.repo}`
        )
      );
      const detectionMethodText =
        config.detectionMethod === "origin"
          ? "origin remote"
          : config.detectionMethod === "first-remote"
          ? "first available remote"
          : "manual input";
      log(chalk.gray(`  Detection method: ${detectionMethodText}`));
    } else if (config.detectionMethod === "manual") {
      log(
        chalk.blue(`✓ Repository configured: ${config.owner}/${config.repo}`)
      );
      log(chalk.gray(`  Input method: manual`));
    }

    return config;
  } catch (error) {
    log(
      chalk.red(
        `Configuration error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      )
    );
    return null;
  }
};

type ActionSummary = {
  created: number;
  deleted: number;
  skipped: number;
  failed: number;
  notes: string[];
};

const makeSummary = (): ActionSummary => ({
  created: 0,
  deleted: 0,
  skipped: 0,
  failed: 0,
  notes: [],
});

const printSummary = (
  action: string,
  summary: ActionSummary,
  dryRun: boolean
) => {
  log(chalk.cyan(`\n=== ${action} summary ===`));
  if (dryRun) {
    log(chalk.yellow("Mode: dry run (no API calls executed)"));
  }
  log(
    chalk.green(`Created: ${summary.created}`) +
      chalk.red(`  Failed: ${summary.failed}`) +
      chalk.blue(`  Deleted: ${summary.deleted}`) +
      chalk.yellow(`  Skipped: ${summary.skipped}`)
  );
  summary.notes.forEach((note) => log(chalk.gray(`- ${note}`)));
  if (summary.failed > 0 && !dryRun) {
    log(
      chalk.yellow(
        "Some operations failed. Re-run the command or check your credentials/permissions."
      )
    );
  }
  log(chalk.cyan("========================\n"));
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

  if (selectedIndex === 8) {
    console.log("exit");
    process.exit(0);
    return;
  }

  const dryRun =
    selectedIndex >= 0 && selectedIndex <= 4 ? await getDryRunChoice() : false;

  switch (selectedIndex) {
    case 0: {
      const summary = makeSummary();
      const newLabel = await getNewLabel();
      if (dryRun) {
        log(
          chalk.yellow(
            `[dry-run] Would create label "${newLabel.name}" with color "${newLabel.color ?? "N/A"}"`
          )
        );
        summary.skipped += 1;
      } else {
        const ok = await createLabel(configs, newLabel);
        if (ok) {
          summary.created += 1;
        } else {
          summary.failed += 1;
        }
      }
      printSummary("Create a label", summary, dryRun);
      firstStart = firstStart && false;
      break;
    }

    case 1: {
      const summary = makeSummary();
      if (dryRun) {
        log(
          chalk.yellow(
            `[dry-run] Would create ${labels.length} preset labels (no API calls)`
          )
        );
        summary.skipped += labels.length;
      } else {
        const result = await createLabels(configs);
        summary.created = result.created;
        summary.failed = result.failed;
      }
      printSummary("Create preset labels", summary, dryRun);
      firstStart = firstStart && false;
      break;
    }

    case 2: {
      const summary = makeSummary();
      const targetLabel = await getTargetLabel();
      if (dryRun) {
        summary.skipped += targetLabel.length;
        targetLabel.forEach((name) =>
          log(chalk.yellow(`[dry-run] Would delete label "${name}"`))
        );
      } else {
        const result = await deleteLabel(configs, targetLabel);
        summary.deleted = result.deleted;
        summary.failed = result.failed;
      }
      printSummary("Delete a label", summary, dryRun);
      firstStart = firstStart && false;
      break;
    }

    case 3: {
      const summary = makeSummary();
      if (dryRun) {
        log(
          chalk.yellow(
            '[dry-run] Would delete all labels in the configured repository'
          )
        );
        summary.skipped += 1;
      } else {
        const result = await deleteLabels(configs);
        summary.deleted = result.deleted;
        summary.failed = result.failed;
        summary.notes.push("All labels processed");
      }
      printSummary("Delete all labels", summary, dryRun);
      firstStart = firstStart && false;
      break;
    }

    case 4: {
      const summary = makeSummary();
      try {
        const filePath = await getLabelFilePath();
        if (filePath) {
          const result = await importLabelsFromFile(configs, filePath, dryRun);
          summary.created = result.succeeded;
          summary.failed = result.failed;
          summary.skipped = result.skipped;
          summary.notes.push(
            `Processed ${result.attempted} label entries from file`
          );
        } else {
          log(chalk.yellow("No file path provided. Returning to main menu."));
          summary.skipped += 1;
        }
      } catch (error) {
        log(
          chalk.red(
            `Error during label import: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          )
        );
        summary.failed += 1;
      }
      printSummary("Import labels", summary, dryRun);
      firstStart = firstStart && false;
      break;
    }

    case 5: {
      try {
        await generateSampleJson();
      } catch (error) {
        log(
          chalk.red(
            `Error generating sample JSON: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          )
        );
      }
      firstStart = firstStart && false;
      break;
    }

    case 6: {
      try {
        await generateSampleYaml();
      } catch (error) {
        log(
          chalk.red(
            `Error generating sample YAML: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          )
        );
      }
      firstStart = firstStart && false;
      break;
    }

    case 7: {
      await displaySettings();
      firstStart = firstStart && false;
      break;
    }

    case 8: {
      console.log("exit");
      process.exit(0);
      return; // This line is never reached, but prevents lint fallthrough error
    }
    // eslint-disable-next-line no-fallthrough
    default: {
      console.log("invalid input");
      break;
    }
  }
  main();
};

main();
