#!/usr/bin/env node
import chalk from "chalk";
import { renderFilled } from "oh-my-logo";
import * as fs from "fs";
import { promises, existsSync } from "fs";
import { homedir } from "os";
import * as path from "path";
import { join, dirname } from "path";
import { createHash, randomBytes, createCipheriv, createDecipheriv } from "crypto";
import prompts from "prompts";
import * as yaml from "js-yaml";
import yaml__default from "js-yaml";
import { Octokit } from "@octokit/core";
import { exec } from "child_process";
import { promisify } from "util";
const githubConfigs = [
  {
    type: "password",
    name: "octokit",
    message: "Please type your personal token"
  },
  {
    type: "text",
    name: "owner",
    message: "Please type your GitHub account"
  },
  {
    type: "text",
    name: "repo",
    message: "Please type your target repo name"
  }
];
const newLabel = [
  {
    type: "text",
    name: "name",
    message: "Please type new label name"
  },
  {
    type: "text",
    name: "color",
    message: 'Please type label color without "#" '
  },
  {
    type: "text",
    name: "description",
    message: "Please type label description"
  }
];
const deleteLabel$1 = {
  type: "text",
  name: "name",
  message: "Please type label name you want to delete"
};
const labelFilePath = {
  type: "text",
  name: "filePath",
  message: "Please type the path to your JSON or YAML file"
};
const actionSelector = {
  type: "multiselect",
  name: "action",
  message: "Please select an action",
  choices: [
    { title: "create a label", value: 0 },
    { title: "create multiple labels", value: 1 },
    { title: "delete a label", value: 2 },
    { title: "delete all labels", value: 3 },
    { title: "import labels from JSON or YAML", value: 4 },
    { title: "Generate sample JSON", value: 5 },
    { title: "Generate sample YAML", value: 6 },
    { title: "Display your settings", value: 7 },
    { title: "exit", value: 8 }
  ]
};
const holdToken = {
  type: "confirm",
  name: "value",
  message: "Do you have a personal token?",
  initial: true
};
const sampleData = [
  {
    name: "Type: Bug Fix",
    color: "FF8A65",
    description: "Fix features that are not working"
  },
  {
    name: "Type: Enhancement",
    color: "64B5F7",
    description: "Add new features"
  },
  {
    name: "Type: Improvement",
    color: "4DB6AC",
    description: "Improve existing functionality"
  }
];
const labels = (
  // the following labels are based on this post
  // https://qiita.com/willow-micro/items/51eeb3efe5b4192a4abd
  [
    {
      name: "Type: Bug Fix",
      color: "FF8A65",
      description: "Fix features that are not working"
    },
    {
      name: "Type: Enhancement",
      color: "64B5F7",
      description: "Add new features"
    },
    {
      name: "Type: Improvement",
      color: "4DB6AC",
      description: "Improve existing functionality"
    },
    {
      name: "Type: Modification",
      color: "4DD0E1",
      description: "Modify existing functionality"
    },
    {
      name: "Type: Optimization",
      color: "BA68C8",
      description: "Optimized existing functionality"
    },
    {
      name: "Type: Security Fix",
      color: "FF8A65",
      description: "Fix security issue"
    },
    {
      name: "Status: Available",
      color: "81C784",
      description: "Waiting for working on it"
    },
    {
      name: "Status: In Progress",
      color: "64B5F7",
      description: "Currently working on it"
    },
    {
      name: "Status: Completed",
      color: "4DB6AC",
      description: "Worked on it and completed"
    },
    {
      name: "Status: Canceled",
      color: "E57373",
      description: "Worked on it, but canceled"
    },
    {
      name: "Status: Inactive (Abandoned)",
      color: "90A4AF",
      description: "For now, there is no plan to work on it"
    },
    {
      name: "Status: Inactive (Duplicate)",
      color: "90A4AF",
      description: "This issue is duplicated"
    },
    {
      name: "Status: Inactive (Invalid)",
      color: "90A4AF",
      description: "This issue is invalid"
    },
    {
      name: "Status: Inactive (Won't Fix)",
      color: "90A4AF",
      description: "There is no plan to fix this issue"
    },
    {
      name: "Status: Pending",
      color: "A2887F",
      description: "Worked on it, but suspended"
    },
    {
      name: "Priority: ASAP",
      color: "FF8A65",
      description: "We must work on it asap"
    },
    {
      name: "Priority: High",
      color: "FFB74D",
      description: "We must work on it"
    },
    {
      name: "Priority: Medium",
      color: "FFF177",
      description: "We need to work on it"
    },
    {
      name: "Priority: Low",
      color: "DCE775",
      description: "We should work on it"
    },
    {
      name: "Priority: Safe",
      color: "81C784",
      description: "We would work on it"
    },
    {
      name: "Effort Effortless",
      color: "81C784",
      description: "No efforts are expected"
    },
    {
      name: "Effort Heavy",
      color: "FFB74D",
      description: "Heavy efforts are expected"
    },
    {
      name: "Effort Normal",
      color: "FFF177",
      description: "Normal efforts are expected"
    },
    {
      name: "Effort Light",
      color: "DCE775",
      description: "Light efforts are expected"
    },
    {
      name: "Effort Painful",
      color: "FF8A65",
      description: "Painful efforts are expected"
    },
    {
      name: "Feedback Discussion",
      color: "F06293",
      description: "A discussion about features"
    },
    {
      name: "Feedback Question",
      color: "F06293",
      description: "A question about features"
    },
    {
      name: "Feedback Suggestion",
      color: "F06293",
      description: "A suggestion about features"
    },
    {
      name: "Docs",
      color: "000",
      description: "Documentation"
    }
  ]
);
const initialText = `Please input your GitHub info`;
const getAsciiText = async () => {
  try {
    const result = await renderFilled("Hyouji", {
      palette: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57"],
      direction: "diagonal"
    });
    return result;
  } catch (error) {
    console.error("Error rendering ASCII art:", error);
    return `
╔══════════════════════════════════════════════════════════════╗
║                     Hyouji                                   ║
║              GitHub Label Manager CLI Tool                   ║
╚══════════════════════════════════════════════════════════════╝
Please report this issue to https://github.com/koji/Hyouji/issues
Thank you!
`;
  }
};
const extraGuideText = `If you don't see action selector, please hit space key.`;
const linkToPersonalToken = "https://github.com/settings/tokens";
const log$4 = console.log;
const createLabel = async (configs2, label) => {
  const resp = await configs2.octokit.request(
    "POST /repos/{owner}/{repo}/labels",
    {
      owner: configs2.owner,
      repo: configs2.repo,
      name: label.name,
      color: label.color,
      description: label.description
    }
  );
  const status = resp.status;
  switch (status) {
    case 201:
      log$4(chalk.green(`${resp.status}: Created ${label.name}`));
      break;
    case 404:
      log$4(chalk.red(`${resp.status}: Resource not found`));
      break;
    case 422:
      log$4(chalk.red(`${resp.status}: Validation failed`));
      break;
    default:
      log$4(chalk.yellow(`${resp.status}: Something wrong`));
      break;
  }
};
const createLabels = async (configs2) => {
  labels.forEach(async (label) => {
    createLabel(configs2, label);
  });
  log$4("Created all labels");
  log$4(chalk.bgBlueBright(extraGuideText));
};
const deleteLabel = async (configs2, labelNames) => {
  for (const labelName of labelNames) {
    try {
      const resp = await configs2.octokit.request(
        "DELETE /repos/{owner}/{repo}/labels/{name}",
        {
          owner: configs2.owner,
          repo: configs2.repo,
          name: labelName
        }
      );
      if (resp.status === 204) {
        log$4(chalk.green(`${resp.status}: Deleted ${labelName}`));
      } else {
        log$4(chalk.yellow(`${resp.status}: Something wrong with ${labelName}`));
      }
    } catch (error) {
      if (error && typeof error === "object" && "status" in error && error.status === 404) {
        log$4(chalk.red(`404: Label "${labelName}" not found`));
      } else {
        log$4(
          chalk.red(
            `Error deleting label "${labelName}": ${error instanceof Error ? error.message : "Unknown error"}`
          )
        );
      }
    }
  }
};
const getLabels = async (configs2) => {
  const resp = await configs2.octokit.request(
    "GET /repos/{owner}/{repo}/labels",
    {
      owner: configs2.owner,
      repo: configs2.repo
    }
  );
  if (resp.status === 200) {
    const names = await resp.data.map((label) => label.name);
    return names;
  } else {
    log$4(chalk.red("something wrong"));
    return [];
  }
};
const deleteLabels = async (configs2) => {
  const names = await getLabels(configs2);
  if (names.length === 0) {
    log$4(chalk.yellow("No labels found to delete"));
    return;
  }
  log$4(chalk.blue(`Deleting ${names.length} labels...`));
  for (const name of names) {
    try {
      const resp = await configs2.octokit.request(
        "DELETE /repos/{owner}/{repo}/labels/{name}",
        {
          owner: configs2.owner,
          repo: configs2.repo,
          name
        }
      );
      if (resp.status === 204) {
        log$4(chalk.green(`${resp.status}: Deleted ${name}`));
      } else {
        log$4(chalk.yellow(`${resp.status}: Something wrong with ${name}`));
      }
    } catch (error) {
      if (error && typeof error === "object" && "status" in error && error.status === 404) {
        log$4(chalk.red(`404: Label "${name}" not found`));
      } else {
        log$4(
          chalk.red(
            `Error deleting label "${name}": ${error instanceof Error ? error.message : "Unknown error"}`
          )
        );
      }
    }
  }
  log$4(chalk.blue("Finished deleting labels"));
  log$4(chalk.bgBlueBright(extraGuideText));
};
const _CryptoUtils = class _CryptoUtils {
  /**
   * Generate a machine-specific key based on system information
   * This provides basic obfuscation without requiring user passwords
   */
  static generateMachineKey() {
    const machineInfo = [
      homedir(),
      process.platform,
      process.arch,
      process.env.USER || process.env.USERNAME || "default"
    ].join("|");
    return createHash("sha256").update(machineInfo).digest();
  }
  /**
   * Encrypt a token using machine-specific key
   * @param token - The token to encrypt
   * @returns Encrypted token string
   */
  static encryptToken(token) {
    try {
      const key = this.generateMachineKey();
      const iv = randomBytes(16);
      const cipher = createCipheriv(this.ALGORITHM, key, iv);
      let encrypted = cipher.update(token, "utf8", this.ENCODING);
      encrypted += cipher.final(this.ENCODING);
      return iv.toString(this.ENCODING) + ":" + encrypted;
    } catch {
      console.warn("⚠️  Token encryption failed, storing in plain text");
      return token;
    }
  }
  /**
   * Decrypt a token using machine-specific key
   * @param encryptedToken - The encrypted token string
   * @returns Decrypted token string
   */
  static decryptToken(encryptedToken) {
    try {
      if (!encryptedToken.includes(":")) {
        return encryptedToken;
      }
      const [ivHex, encrypted] = encryptedToken.split(":");
      if (!ivHex || !encrypted) {
        return encryptedToken;
      }
      const key = this.generateMachineKey();
      const iv = Buffer.from(ivHex, this.ENCODING);
      const decipher = createDecipheriv(this.ALGORITHM, key, iv);
      let decrypted = decipher.update(encrypted, this.ENCODING, "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch {
      console.warn("⚠️  Token decryption failed, using as plain text");
      return encryptedToken;
    }
  }
  /**
   * Check if a token appears to be encrypted
   * @param token - Token to check
   * @returns True if token appears to be encrypted
   */
  static isTokenEncrypted(token) {
    return token.includes(":") && token.length > 50;
  }
  /**
   * Obfuscate a token for display purposes (show only first/last few characters)
   * @param token - Token to obfuscate
   * @returns Obfuscated token string
   */
  static obfuscateToken(token) {
    if (!token || token.length < 8) {
      return "***";
    }
    const start = token.substring(0, 4);
    const end = token.substring(token.length - 4);
    const middle = "*".repeat(Math.min(token.length - 8, 20));
    return `${start}${middle}${end}`;
  }
};
_CryptoUtils.ALGORITHM = "aes-256-cbc";
_CryptoUtils.ENCODING = "hex";
let CryptoUtils = _CryptoUtils;
class ConfigError extends Error {
  constructor(type, message, originalError) {
    super(message);
    this.type = type;
    this.originalError = originalError;
    this.name = "ConfigError";
  }
}
class ConfigManager {
  constructor() {
    this.configDir = join(homedir(), ".config", "github-label-manager");
    this.configPath = join(this.configDir, "config.json");
    this.fallbackConfigPath = join(
      homedir(),
      ".github-label-manager-config.json"
    );
  }
  /**
   * Load configuration from file
   */
  async loadConfig() {
    const locations = [
      { path: this.configPath, name: "primary" },
      { path: this.fallbackConfigPath, name: "fallback" }
    ];
    for (const location of locations) {
      try {
        if (await this.fileExists(location.path)) {
          const config = await this.loadConfigFromPath(location.path);
          if (config) {
            return config;
          }
        }
      } catch (error) {
        await this.handleConfigLoadError(error, location.path, location.name);
      }
    }
    return null;
  }
  /**
   * Load and validate configuration from a specific path
   */
  async loadConfigFromPath(configPath) {
    try {
      const data = await promises.readFile(configPath, "utf-8");
      if (!data.trim()) {
        throw new ConfigError(
          "CORRUPTED_FILE",
          "Configuration file is empty"
        );
      }
      let config;
      try {
        config = JSON.parse(data);
      } catch (parseError) {
        throw new ConfigError(
          "CORRUPTED_FILE",
          "Configuration file contains invalid JSON",
          parseError
        );
      }
      if (await this.validateConfig(config)) {
        const decryptedConfig = {
          ...config,
          token: CryptoUtils.decryptToken(config.token)
        };
        return decryptedConfig;
      } else {
        throw new ConfigError(
          "INVALID_FORMAT",
          "Configuration file has invalid format or missing required fields"
        );
      }
    } catch (error) {
      if (error instanceof ConfigError) {
        throw error;
      }
      const nodeError = error;
      if (nodeError.code === "EACCES" || nodeError.code === "EPERM") {
        throw new ConfigError(
          "PERMISSION_DENIED",
          `Permission denied accessing configuration file: ${configPath}`,
          nodeError
        );
      }
      if (nodeError.code === "ENOENT") {
        throw new ConfigError(
          "FILE_NOT_FOUND",
          `Configuration file not found: ${configPath}`,
          nodeError
        );
      }
      throw new ConfigError(
        "UNKNOWN_ERROR",
        `Unexpected error loading configuration: ${nodeError.message}`,
        nodeError
      );
    }
  }
  /**
   * Handle configuration loading errors with user-friendly messages
   */
  async handleConfigLoadError(error, configPath, locationName) {
    if (error instanceof ConfigError) {
      switch (error.type) {
        case "CORRUPTED_FILE":
          console.warn(
            `⚠️  Configuration file at ${locationName} location is corrupted: ${error.message}`
          );
          console.warn(`   File: ${configPath}`);
          console.warn(
            `   The file will be ignored and you'll be prompted for credentials.`
          );
          await this.backupCorruptedFile(configPath);
          break;
        case "PERMISSION_DENIED":
          console.warn(
            `⚠️  Permission denied accessing configuration file at ${locationName} location.`
          );
          console.warn(`   File: ${configPath}`);
          console.warn(
            `   Please check file permissions or run with appropriate privileges.`
          );
          break;
        case "INVALID_FORMAT":
          console.warn(
            `⚠️  Configuration file at ${locationName} location has invalid format.`
          );
          console.warn(`   File: ${configPath}`);
          console.warn(
            `   The file will be ignored and you'll be prompted for credentials.`
          );
          await this.backupCorruptedFile(configPath);
          break;
        default:
          console.warn(
            `⚠️  Failed to load configuration from ${locationName} location: ${error.message}`
          );
          console.warn(`   File: ${configPath}`);
      }
    } else {
      console.warn(
        `⚠️  Unexpected error loading configuration from ${locationName} location.`
      );
      console.warn(`   File: ${configPath}`);
    }
  }
  /**
   * Backup corrupted configuration file
   */
  async backupCorruptedFile(configPath) {
    try {
      const backupPath = `${configPath}.backup.${Date.now()}`;
      await promises.copyFile(configPath, backupPath);
      console.warn(`   Corrupted file backed up to: ${backupPath}`);
    } catch (backupError) {
      console.warn(
        `   Could not backup corrupted file: ${backupError instanceof Error ? backupError.message : "Unknown error"}`
      );
    }
  }
  /**
   * Save configuration to file
   */
  async saveConfig(config) {
    const encryptedConfig = {
      ...config,
      token: CryptoUtils.encryptToken(config.token),
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
    };
    const configJson = JSON.stringify(encryptedConfig, null, 2);
    try {
      await this.ensureConfigDirectory();
      await promises.writeFile(this.configPath, configJson, { mode: 384 });
      if (await this.fileExists(this.fallbackConfigPath)) {
        try {
          await promises.unlink(this.fallbackConfigPath);
        } catch {
          console.warn(
            `⚠️  Could not remove old fallback configuration file: ${this.fallbackConfigPath}`
          );
        }
      }
      return;
    } catch (primaryError) {
      const nodeError = primaryError;
      if (nodeError.code === "EACCES" || nodeError.code === "EPERM") {
        console.warn(
          `⚠️  Permission denied writing to primary configuration location.`
        );
        console.warn(`   Attempted path: ${this.configPath}`);
        console.warn(`   Trying fallback location...`);
      } else if (nodeError.code === "ENOSPC") {
        throw new ConfigError(
          "UNKNOWN_ERROR",
          "Insufficient disk space to save configuration"
        );
      } else {
        console.warn(
          `⚠️  Failed to save configuration to primary location: ${nodeError.message}`
        );
        console.warn(`   Trying fallback location...`);
      }
      try {
        await promises.writeFile(this.fallbackConfigPath, configJson, {
          mode: 384
        });
        console.warn(
          `✓ Configuration saved to fallback location: ${this.fallbackConfigPath}`
        );
        return;
      } catch (fallbackError) {
        const fallbackNodeError = fallbackError;
        if (fallbackNodeError.code === "EACCES" || fallbackNodeError.code === "EPERM") {
          throw new ConfigError(
            "PERMISSION_DENIED",
            "Permission denied: Cannot save configuration to any location. Please check file permissions or run with appropriate privileges.",
            fallbackNodeError
          );
        }
        if (fallbackNodeError.code === "ENOSPC") {
          throw new ConfigError(
            "UNKNOWN_ERROR",
            "Insufficient disk space to save configuration",
            fallbackNodeError
          );
        }
        throw new ConfigError(
          "UNKNOWN_ERROR",
          `Failed to save configuration to any location. Primary error: ${nodeError.message}. Fallback error: ${fallbackNodeError.message}`,
          fallbackNodeError
        );
      }
    }
  }
  /**
   * Check if configuration file exists
   */
  configExists() {
    try {
      return existsSync(this.configPath) || existsSync(this.fallbackConfigPath);
    } catch {
      return false;
    }
  }
  /**
   * Get the path to the configuration file
   */
  getConfigPath() {
    if (existsSync(this.configPath)) {
      return this.configPath;
    }
    if (existsSync(this.fallbackConfigPath)) {
      return this.fallbackConfigPath;
    }
    return this.configPath;
  }
  /**
   * Validate configuration data format
   */
  async validateConfig(config) {
    if (!config || typeof config !== "object") {
      return false;
    }
    if (!config.token || typeof config.token !== "string" || config.token.trim() === "") {
      return false;
    }
    if (!config.owner || typeof config.owner !== "string" || config.owner.trim() === "") {
      return false;
    }
    const actualToken = CryptoUtils.decryptToken(config.token);
    const tokenPattern = /^(ghp_|gho_|ghu_|ghs_)[a-zA-Z0-9]{36}$/;
    if (!tokenPattern.test(actualToken)) {
      return false;
    }
    return true;
  }
  /**
   * Validate credentials against GitHub API
   */
  async validateCredentials(config) {
    try {
      const { Octokit: Octokit2 } = await import("@octokit/core");
      const decryptedToken = CryptoUtils.decryptToken(config.token);
      const octokit = new Octokit2({
        auth: decryptedToken
      });
      const response = await octokit.request("GET /user");
      if (response.data.login.toLowerCase() !== config.owner.toLowerCase()) {
        return {
          isValid: false,
          error: new ConfigError(
            "INVALID_FORMAT",
            `Token belongs to user '${response.data.login}' but configuration is for '${config.owner}'`
          )
        };
      }
      return { isValid: true };
    } catch (error) {
      const apiError = error;
      if (apiError.status === 401) {
        return {
          isValid: false,
          error: new ConfigError(
            "INVALID_FORMAT",
            "GitHub token is invalid or has expired"
          )
        };
      }
      if (apiError.status === 403) {
        return {
          isValid: false,
          error: new ConfigError(
            "INVALID_FORMAT",
            "GitHub token has insufficient permissions or rate limit exceeded"
          )
        };
      }
      if (apiError.code === "ENOTFOUND" || apiError.code === "ECONNREFUSED" || apiError.code === "ETIMEDOUT") {
        return {
          isValid: false,
          error: new ConfigError(
            "NETWORK_ERROR",
            "Unable to connect to GitHub API. Please check your internet connection."
          )
        };
      }
      return {
        isValid: false,
        error: new ConfigError(
          "UNKNOWN_ERROR",
          `Failed to validate credentials: ${apiError.message || "Unknown error"}`
        )
      };
    }
  }
  /**
   * Migrate existing plain text configuration to encrypted format
   */
  async migrateToEncrypted() {
    const config = await this.loadConfig();
    if (!config) {
      return;
    }
    if (CryptoUtils.isTokenEncrypted(config.token)) {
      return;
    }
    console.log("🔒 Migrating configuration to encrypted format...");
    try {
      await this.saveConfig(config);
      console.log("✓ Configuration successfully encrypted");
    } catch (error) {
      console.warn(
        "⚠️  Failed to encrypt existing configuration:",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
  /**
   * Load and validate configuration with credential validation
   */
  async loadValidatedConfig() {
    const config = await this.loadConfig();
    if (!config) {
      return { config: null, shouldPromptForCredentials: true };
    }
    const validation = await this.validateCredentials(config);
    if (validation.isValid) {
      return { config, shouldPromptForCredentials: false };
    }
    const preservedData = {};
    if (validation.error) {
      console.warn(`⚠️  ${ConfigManager.getErrorMessage(validation.error)}`);
      if (validation.error.type === "INVALID_FORMAT" && !validation.error.message.includes("Token belongs to user")) {
        preservedData.owner = config.owner;
        console.warn(
          `   Your GitHub username '${config.owner}' will be preserved.`
        );
      }
    }
    return {
      config: null,
      shouldPromptForCredentials: true,
      preservedData: Object.keys(preservedData).length > 0 ? preservedData : void 0
    };
  }
  /**
   * Clear configuration file
   */
  async clearConfig() {
    const errors = [];
    if (await this.fileExists(this.configPath)) {
      try {
        await promises.unlink(this.configPath);
      } catch (error) {
        const nodeError = error;
        if (nodeError.code === "EACCES" || nodeError.code === "EPERM") {
          errors.push(
            `Permission denied removing primary config file: ${this.configPath}`
          );
        } else {
          errors.push(
            `Failed to remove primary config file: ${nodeError.message}`
          );
        }
      }
    }
    if (await this.fileExists(this.fallbackConfigPath)) {
      try {
        await promises.unlink(this.fallbackConfigPath);
      } catch (error) {
        const nodeError = error;
        if (nodeError.code === "EACCES" || nodeError.code === "EPERM") {
          errors.push(
            `Permission denied removing fallback config file: ${this.fallbackConfigPath}`
          );
        } else {
          errors.push(
            `Failed to remove fallback config file: ${nodeError.message}`
          );
        }
      }
    }
    if (errors.length > 0) {
      throw new ConfigError(
        "PERMISSION_DENIED",
        `Failed to clear configuration: ${errors.join("; ")}`
      );
    }
  }
  /**
   * Ensure configuration directory exists with proper permissions
   */
  async ensureConfigDirectory() {
    try {
      await promises.mkdir(this.configDir, { recursive: true, mode: 448 });
    } catch (error) {
      const nodeError = error;
      if (nodeError.code === "EEXIST") {
        return;
      }
      if (nodeError.code === "EACCES" || nodeError.code === "EPERM") {
        throw new ConfigError(
          "PERMISSION_DENIED",
          `Permission denied creating configuration directory: ${this.configDir}`,
          nodeError
        );
      }
      if (nodeError.code === "ENOSPC") {
        throw new ConfigError(
          "UNKNOWN_ERROR",
          "Insufficient disk space to create configuration directory",
          nodeError
        );
      }
      throw new ConfigError(
        "UNKNOWN_ERROR",
        `Failed to create configuration directory: ${nodeError.message}`,
        nodeError
      );
    }
  }
  /**
   * Check if file exists
   */
  async fileExists(path2) {
    try {
      await promises.access(path2);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Get user-friendly error message for configuration problems
   */
  static getErrorMessage(error) {
    switch (error.type) {
      case "FILE_NOT_FOUND":
        return "Configuration file not found. You will be prompted to enter your credentials.";
      case "PERMISSION_DENIED":
        return "Permission denied accessing configuration file. Please check file permissions or run with appropriate privileges.";
      case "CORRUPTED_FILE":
        return "Configuration file is corrupted or contains invalid data. A backup has been created and you will be prompted for new credentials.";
      case "INVALID_FORMAT":
        return "Configuration file has invalid format. You will be prompted to enter your credentials again.";
      case "NETWORK_ERROR":
        return "Network error occurred while validating credentials. Please check your internet connection.";
      case "UNKNOWN_ERROR":
      default:
        return `An unexpected error occurred: ${error.message}`;
    }
  }
  /**
   * Check if an error is recoverable (user can continue with prompts)
   */
  static isRecoverableError(error) {
    return [
      "FILE_NOT_FOUND",
      "CORRUPTED_FILE",
      "INVALID_FORMAT"
      /* INVALID_FORMAT */
    ].includes(error.type);
  }
}
const getConfirmation = async () => {
  const response = await prompts(holdToken);
  return response.value;
};
const log$3 = console.log;
const generateSampleJson = async () => {
  try {
    const outputPath = "./hyouji.json";
    const jsonContent = JSON.stringify(sampleData, null, 2);
    log$3(chalk.blue("Generating sample JSON file..."));
    fs.writeFileSync(outputPath, jsonContent, "utf8");
    log$3(
      chalk.green(
        "✅ Sample JSON file generated successfully at ./hyouji.json"
      )
    );
  } catch (error) {
    if (error instanceof Error) {
      const nodeError = error;
      if (nodeError.code === "EACCES") {
        log$3(
          chalk.red(
            "❌ Error generating sample JSON file: Permission denied. Please check write permissions for the current directory."
          )
        );
      } else if (nodeError.code === "ENOSPC") {
        log$3(
          chalk.red(
            "❌ Error generating sample JSON file: Insufficient disk space."
          )
        );
      } else if (nodeError.code === "EROFS") {
        log$3(
          chalk.red(
            "❌ Error generating sample JSON file: Read-only file system."
          )
        );
      } else {
        log$3(chalk.red(`❌ Error generating sample JSON file: ${error.message}`));
      }
    } else {
      log$3(
        chalk.red(
          "❌ An unexpected error occurred while generating the sample JSON file"
        )
      );
    }
  }
};
const log$2 = console.log;
const generateSampleYaml = async () => {
  try {
    const outputPath = "./hyouji.yaml";
    const yamlContent = yaml__default.dump(sampleData, {
      indent: 2,
      lineWidth: -1,
      // Disable line wrapping
      noRefs: true,
      // Disable references
      quotingType: '"',
      // Use double quotes for strings
      forceQuotes: false
      // Only quote when necessary
    });
    log$2(chalk.blue("Generating sample YAML file..."));
    fs.writeFileSync(outputPath, yamlContent, "utf8");
    log$2(
      chalk.green(
        "✅ Sample YAML file generated successfully at ./hyouji.yaml"
      )
    );
  } catch (error) {
    if (error instanceof Error) {
      const nodeError = error;
      if (nodeError.code === "EACCES") {
        log$2(
          chalk.red(
            "❌ Error generating sample YAML file: Permission denied. Please check write permissions for the current directory."
          )
        );
      } else if (nodeError.code === "ENOSPC") {
        log$2(
          chalk.red(
            "❌ Error generating sample YAML file: Insufficient disk space."
          )
        );
      } else if (nodeError.code === "EROFS") {
        log$2(
          chalk.red(
            "❌ Error generating sample YAML file: Read-only file system."
          )
        );
      } else {
        log$2(chalk.red(`❌ Error generating sample YAML file: ${error.message}`));
      }
    } else {
      log$2(
        chalk.red(
          "❌ An unexpected error occurred while generating the sample YAML file"
        )
      );
    }
  }
};
const detectFileFormat = (filePath) => {
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case ".json":
      return "json";
    case ".yaml":
    case ".yml":
      return "yaml";
    default:
      return null;
  }
};
const parseJsonContent = (content) => {
  return JSON.parse(content);
};
const parseYamlContent = (content) => {
  try {
    return yaml.load(content);
  } catch (error) {
    if (error instanceof yaml.YAMLException) {
      throw new Error(`YAMLException: ${error.message}`);
    }
    throw error;
  }
};
const getSupportedExtensions = () => {
  return [".json", ".yaml", ".yml"];
};
const formatSupportedExtensions = () => {
  return getSupportedExtensions().join(", ");
};
const log$1 = console.log;
const importLabelsFromFile = async (configs2, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      log$1(chalk.red(`Error: File not found at path: ${filePath}`));
      return;
    }
    const format = detectFileFormat(filePath);
    if (!format) {
      log$1(
        chalk.red(
          `Error: Unsupported file format. Supported formats: ${formatSupportedExtensions()}`
        )
      );
      return;
    }
    const fileContent = fs.readFileSync(filePath, "utf8");
    let parsedData;
    try {
      if (format === "json") {
        parsedData = parseJsonContent(fileContent);
      } else if (format === "yaml") {
        parsedData = parseYamlContent(fileContent);
      }
    } catch (parseError) {
      const formatName = format.toUpperCase();
      log$1(chalk.red(`Error: Invalid ${formatName} syntax in file: ${filePath}`));
      log$1(
        chalk.red(
          `Parse error: ${parseError instanceof Error ? parseError.message : "Unknown error"}`
        )
      );
      return;
    }
    if (!Array.isArray(parsedData)) {
      log$1(chalk.red("Error: File must contain an array of label objects"));
      return;
    }
    const validLabels = [];
    for (let i = 0; i < parsedData.length; i++) {
      const item = parsedData[i];
      if (typeof item !== "object" || item === null) {
        log$1(chalk.red(`Error: Item at index ${i} is not a valid object`));
        continue;
      }
      const labelObj = item;
      if (!labelObj.name) {
        log$1(
          chalk.red(
            `Error: Item at index ${i} is missing required 'name' field`
          )
        );
        continue;
      }
      if (typeof labelObj.name !== "string") {
        log$1(
          chalk.red(
            `Error: Item at index ${i} has invalid 'name' field (must be a non-empty string)`
          )
        );
        continue;
      }
      if (labelObj.name.trim() === "") {
        log$1(
          chalk.red(
            `Error: Item at index ${i} has empty 'name' field (name cannot be empty)`
          )
        );
        continue;
      }
      if (labelObj.color !== void 0) {
        if (typeof labelObj.color !== "string") {
          log$1(
            chalk.red(
              `Error: Item at index ${i} has invalid 'color' field (must be a string)`
            )
          );
          continue;
        }
        if (labelObj.color.trim() === "") {
          log$1(
            chalk.red(
              `Error: Item at index ${i} has empty 'color' field (color cannot be empty if provided)`
            )
          );
          continue;
        }
      }
      if (labelObj.description !== void 0) {
        if (typeof labelObj.description !== "string") {
          log$1(
            chalk.red(
              `Error: Item at index ${i} has invalid 'description' field (must be a string)`
            )
          );
          continue;
        }
      }
      const knownFields = ["name", "color", "description"];
      const unknownFields = Object.keys(labelObj).filter(
        (key) => !knownFields.includes(key)
      );
      if (unknownFields.length > 0) {
        log$1(
          chalk.yellow(
            `Warning: Item at index ${i} contains unknown fields that will be ignored: ${unknownFields.join(", ")}`
          )
        );
      }
      const validLabel = {
        name: labelObj.name.trim(),
        ...labelObj.color !== void 0 && {
          color: labelObj.color.trim()
        },
        ...labelObj.description !== void 0 && {
          description: labelObj.description
        }
      };
      validLabels.push(validLabel);
    }
    if (validLabels.length === 0) {
      log$1(chalk.red("Error: No valid labels found in file"));
      return;
    }
    log$1(chalk.blue(`Starting import of ${validLabels.length} labels...`));
    log$1("");
    let successCount = 0;
    let errorCount = 0;
    for (let i = 0; i < validLabels.length; i++) {
      const label = validLabels[i];
      const progress = `[${i + 1}/${validLabels.length}]`;
      try {
        log$1(chalk.cyan(`${progress} Processing: ${label.name}`));
        await createLabel(configs2, label);
        successCount++;
      } catch (error) {
        errorCount++;
        log$1(
          chalk.red(
            `${progress} Failed to create label "${label.name}": ${error instanceof Error ? error.message : "Unknown error"}`
          )
        );
      }
    }
    log$1("");
    if (errorCount === 0) {
      log$1(
        chalk.green(
          `✅ Import completed successfully! Created ${successCount} labels.`
        )
      );
    } else {
      log$1(chalk.yellow(`⚠️  Import completed with some errors:`));
      log$1(chalk.green(`  • Successfully created: ${successCount} labels`));
      log$1(chalk.red(`  • Failed to create: ${errorCount} labels`));
      log$1(chalk.blue(`  • Total processed: ${validLabels.length} labels`));
    }
  } catch (error) {
    log$1(
      chalk.red(
        `Error reading file: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    );
  }
};
const getTargetLabel = async () => {
  const response = await prompts(deleteLabel$1);
  return [response.name];
};
const GIT_COMMAND_TIMEOUT_MS = 5e3;
const _GitRepositoryDetector = class _GitRepositoryDetector {
  /**
   * Overrides the internal execAsync function for testing purposes.
   * @param mock - The mock function to use for execAsync.
   */
  static overrideExecAsync(mock) {
    this.execAsyncInternal = mock;
  }
  /**
   * Detects Git repository information from the current working directory
   * @param cwd - Current working directory (defaults to process.cwd())
   * @returns Promise<GitDetectionResult>
   */
  static async detectRepository(cwd) {
    const workingDir = cwd || process.cwd();
    let gitRoot;
    try {
      gitRoot = await this.findGitRoot(workingDir);
    } catch (err) {
      const error = err;
      return {
        isGitRepository: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
    if (!gitRoot) {
      return {
        isGitRepository: false,
        error: "Not a Git repository"
      };
    }
    const remotesResult = await this.getAllRemotes(gitRoot);
    if ("error" in remotesResult) {
      return { isGitRepository: false, error: remotesResult.error };
    }
    const remotes = remotesResult.remotes;
    if (remotes.length === 0) {
      return {
        isGitRepository: true,
        error: "No remotes configured"
      };
    }
    let remoteUrl = null;
    let detectionMethod = "origin";
    if (remotes.includes("origin")) {
      remoteUrl = await this.getRemoteUrl(gitRoot, "origin");
    }
    if (!remoteUrl && remotes.length > 0) {
      remoteUrl = await this.getRemoteUrl(gitRoot, remotes[0]);
      detectionMethod = "first-remote";
    }
    if (!remoteUrl) {
      return {
        isGitRepository: true,
        error: "Could not retrieve remote URL"
      };
    }
    const parsedUrl = this.parseGitUrl(remoteUrl);
    if (!parsedUrl) {
      return {
        isGitRepository: true,
        error: "Could not parse remote URL"
      };
    }
    return {
      isGitRepository: true,
      repositoryInfo: {
        owner: parsedUrl.owner,
        repo: parsedUrl.repo,
        remoteUrl,
        detectionMethod
      }
    };
  }
  /**
   * Finds the Git root directory by traversing up the directory tree
   * @param startPath - Starting directory path
   * @returns Promise<string | null> - Git root path or null if not found
   */
  static async findGitRoot(startPath) {
    let currentPath = startPath;
    while (currentPath !== dirname(currentPath)) {
      const gitPath = join(currentPath, ".git");
      if (existsSync(gitPath)) {
        return currentPath;
      }
      currentPath = dirname(currentPath);
    }
    if (existsSync(join(currentPath, ".git"))) {
      return currentPath;
    }
    return null;
  }
  /**
   * Gets the URL for a specific Git remote
   * @param gitRoot - Git repository root directory
   * @param remoteName - Name of the remote (e.g., 'origin')
   * @returns Promise<string | null> - Remote URL or null if not found
   */
  static async getRemoteUrl(gitRoot, remoteName) {
    try {
      const { stdout } = await this.execAsyncInternal(
        `git remote get-url ${remoteName}`,
        {
          cwd: gitRoot,
          timeout: GIT_COMMAND_TIMEOUT_MS
        }
      );
      return stdout.trim() || null;
    } catch {
      return null;
    }
  }
  /**
   * Parses a Git URL to extract owner and repository name
   * @param url - Git remote URL
   * @returns Object with owner and repo or null if parsing fails
   */
  static parseGitUrl(url) {
    if (!url || typeof url !== "string" || url.trim().length === 0) {
      return null;
    }
    const trimmedUrl = url.trim();
    try {
      const sshMatch = trimmedUrl.match(
        /^git@github\.com:([^/\s:]+)\/([^/\s:]+?)(?:\.git)?$/
      );
      if (sshMatch) {
        const owner = sshMatch[1];
        const repo = sshMatch[2];
        if (this.isValidGitHubIdentifier(owner) && this.isValidGitHubIdentifier(repo)) {
          return { owner, repo };
        }
      }
      const httpsMatch = trimmedUrl.match(
        /^https:\/\/github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git)?(?:\/)?$/
      );
      if (httpsMatch) {
        const owner = httpsMatch[1];
        const repo = httpsMatch[2];
        if (this.isValidGitHubIdentifier(owner) && this.isValidGitHubIdentifier(repo)) {
          return { owner, repo };
        }
      }
      const httpMatch = trimmedUrl.match(
        /^http:\/\/github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git)?(?:\/)?$/
      );
      if (httpMatch) {
        const owner = httpMatch[1];
        const repo = httpMatch[2];
        if (this.isValidGitHubIdentifier(owner) && this.isValidGitHubIdentifier(repo)) {
          return { owner, repo };
        }
      }
    } catch {
      return null;
    }
    return null;
  }
  /**
   * Validates if a string is a valid GitHub identifier (username or repository name)
   * @param identifier - The identifier to validate
   * @returns boolean - True if valid, false otherwise
   */
  static isValidGitHubIdentifier(identifier) {
    if (!identifier || typeof identifier !== "string") {
      return false;
    }
    const GITHUB_IDENTIFIER_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
    return identifier.length >= 1 && identifier.length <= 39 && GITHUB_IDENTIFIER_REGEX.test(identifier) && !identifier.includes("--");
  }
  /**
   * Gets all configured Git remotes
   * @param gitRoot - Git repository root directory
   * @returns Promise with remotes array or error object
   */
  static async getAllRemotes(gitRoot) {
    try {
      const { stdout } = await this.execAsyncInternal("git remote", {
        cwd: gitRoot,
        timeout: GIT_COMMAND_TIMEOUT_MS
      });
      return {
        remotes: stdout.trim().split("\n").filter((remote) => remote.length > 0)
      };
    } catch (err) {
      const error = err;
      if (error.code === "ENOENT") {
        return { error: "Git command not available" };
      }
      if (error instanceof Error && (error.message.includes("not a git repository") || error.message.includes("Not a git repository"))) {
        return { error: "Not a Git repository" };
      }
      return { remotes: [] };
    }
  }
};
_GitRepositoryDetector.execAsyncInternal = promisify(exec);
let GitRepositoryDetector = _GitRepositoryDetector;
const getGitHubConfigs = async () => {
  var _a, _b;
  const configManager2 = new ConfigManager();
  let validationResult = {
    config: null,
    shouldPromptForCredentials: true,
    preservedData: void 0
  };
  try {
    const result = await configManager2.loadValidatedConfig();
    if (result) {
      validationResult = result;
    }
  } catch {
    validationResult = {
      config: null,
      shouldPromptForCredentials: true,
      preservedData: void 0
    };
  }
  if (validationResult.config && !validationResult.shouldPromptForCredentials) {
    try {
      const detectionResult = await GitRepositoryDetector.detectRepository();
      if (detectionResult.isGitRepository && detectionResult.repositoryInfo) {
        console.log(
          chalk.green(
            `✓ Detected repository: ${detectionResult.repositoryInfo.owner}/${detectionResult.repositoryInfo.repo}`
          )
        );
        console.log(
          chalk.gray(
            `  Detection method: ${detectionResult.repositoryInfo.detectionMethod === "origin" ? "origin remote" : "first available remote"}`
          )
        );
        const octokit3 = new Octokit({
          auth: validationResult.config.token
        });
        return {
          octokit: octokit3,
          owner: detectionResult.repositoryInfo.owner,
          repo: detectionResult.repositoryInfo.repo,
          fromSavedConfig: true,
          autoDetected: true,
          detectionMethod: detectionResult.repositoryInfo.detectionMethod
        };
      } else {
        if (detectionResult.error) {
          console.log(
            chalk.yellow(
              `⚠️  Repository auto-detection failed: ${detectionResult.error}`
            )
          );
        }
        console.log(chalk.gray("  Falling back to manual input..."));
      }
    } catch (error) {
      console.log(
        chalk.yellow(
          "⚠️  Repository auto-detection failed, falling back to manual input"
        )
      );
      if (error instanceof Error) {
        console.log(chalk.gray(`  Error: ${error.message}`));
      }
    }
    const repoResponse = await prompts([
      {
        type: "text",
        name: "repo",
        message: "Please type your target repo name"
      }
    ]);
    const octokit2 = new Octokit({
      auth: validationResult.config.token
    });
    return {
      octokit: octokit2,
      owner: validationResult.config.owner,
      repo: repoResponse.repo,
      fromSavedConfig: true,
      autoDetected: false,
      detectionMethod: "manual"
    };
  }
  const promptConfig = [...githubConfigs];
  if ((_a = validationResult.preservedData) == null ? void 0 : _a.owner) {
    const ownerPromptIndex = promptConfig.findIndex(
      (prompt) => prompt.name === "owner"
    );
    if (ownerPromptIndex !== -1) {
      promptConfig[ownerPromptIndex] = {
        ...promptConfig[ownerPromptIndex],
        initial: validationResult.preservedData.owner
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      };
    }
  }
  const response = await prompts(promptConfig);
  if (response.octokit && response.owner) {
    try {
      await configManager2.saveConfig({
        token: response.octokit,
        owner: response.owner,
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
      });
      if (((_b = validationResult.preservedData) == null ? void 0 : _b.owner) && validationResult.preservedData.owner !== response.owner) {
        console.log("✓ Configuration updated with new credentials");
      } else {
        console.log("✓ Configuration saved successfully");
      }
    } catch (error) {
      if (error instanceof ConfigError) {
        console.error(`❌ ${ConfigManager.getErrorMessage(error)}`);
        if (!ConfigManager.isRecoverableError(error)) {
          console.error(
            "   This may affect future sessions. Please resolve the issue or contact support."
          );
        }
      } else {
        console.warn(
          "⚠️  Failed to save configuration:",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }
  }
  const octokit = new Octokit({
    auth: response.octokit
  });
  return {
    octokit,
    owner: response.owner,
    repo: response.repo,
    fromSavedConfig: false,
    autoDetected: false,
    detectionMethod: "manual"
  };
};
const getLabelFilePath = async () => {
  const response = await prompts(labelFilePath);
  return response.filePath;
};
const getNewLabel = async () => {
  const response = await prompts(newLabel);
  return response;
};
const selectAction = async () => {
  const response = await prompts(actionSelector);
  const { action } = response;
  return action[0] !== void 0 ? action[0] : 99;
};
const log = console.log;
let firstStart = true;
const configManager = new ConfigManager();
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
      const tokenStatus = isEncrypted ? "✓ Saved and encrypted" : "✓ Saved (plain text)";
      log(chalk.green(`Personal token: ${tokenStatus}`));
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
        `Error reading configuration: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    );
  }
  log(chalk.cyan("========================\n"));
};
let configs;
const initializeConfigs = async () => {
  let hasValidConfig = false;
  if (configManager.configExists()) {
    try {
      const existingConfig = await configManager.loadValidatedConfig();
      if (existingConfig && existingConfig.config && !existingConfig.shouldPromptForCredentials) {
        hasValidConfig = true;
      }
    } catch (error) {
      console.error("Error loading config:", error);
      hasValidConfig = false;
    }
  }
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
    console.warn("Failed to display ASCII art, continuing...");
    console.error("Error:", error);
  }
  try {
    console.log(initialText);
    if (firstStart) {
      await configManager.migrateToEncrypted();
    }
    const config = await getGitHubConfigs();
    if (!config.octokit || !config.owner || !config.repo) {
      throw new Error("Invalid configuration: missing required fields");
    }
    try {
      await config.octokit.request("GET /user");
    } catch (error) {
      if (config.fromSavedConfig) {
        console.log(
          chalk.yellow(
            "Saved credentials are invalid. Please provide new credentials."
          )
        );
        await configManager.clearConfig();
        return initializeConfigs();
      }
      throw new Error(
        `GitHub API authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
    if (config.fromSavedConfig) {
      log(chalk.green(`✓ Using saved configuration for ${config.owner}`));
    }
    if (config.autoDetected) {
      log(
        chalk.green(
          `✓ Repository auto-detected: ${config.owner}/${config.repo}`
        )
      );
      const detectionMethodText = config.detectionMethod === "origin" ? "origin remote" : config.detectionMethod === "first-remote" ? "first available remote" : "manual input";
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
        `Configuration error: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    );
    return null;
  }
};
const main = async () => {
  if (firstStart) {
    configs = await initializeConfigs();
    if (!configs) {
      return;
    }
  }
  let selectedIndex = await selectAction();
  while (selectedIndex == 99) {
    selectedIndex = await selectAction();
  }
  switch (selectedIndex) {
    case 0: {
      const newLabel2 = await getNewLabel();
      await createLabel(configs, newLabel2);
      firstStart = firstStart && false;
      break;
    }
    case 1: {
      await createLabels(configs);
      firstStart = firstStart && false;
      break;
    }
    case 2: {
      const targetLabel = await getTargetLabel();
      await deleteLabel(configs, targetLabel);
      firstStart = firstStart && false;
      break;
    }
    case 3: {
      await deleteLabels(configs);
      firstStart = firstStart && false;
      break;
    }
    case 4: {
      try {
        const filePath = await getLabelFilePath();
        if (filePath) {
          await importLabelsFromFile(configs, filePath);
        } else {
          log(chalk.yellow("No file path provided. Returning to main menu."));
        }
      } catch (error) {
        log(
          chalk.red(
            `Error during label import: ${error instanceof Error ? error.message : "Unknown error"}`
          )
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
            `Error generating sample JSON: ${error instanceof Error ? error.message : "Unknown error"}`
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
            `Error generating sample YAML: ${error instanceof Error ? error.message : "Unknown error"}`
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
      return;
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
