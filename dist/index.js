#!/usr/bin/env node
import chalk from "chalk";
import prompts from "prompts";
import { renderFilled } from "oh-my-logo";
import * as fs from "fs";
import { promises, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { createHash, randomBytes, createCipheriv, createDecipheriv } from "crypto";
import { Octokit } from "@octokit/core";
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
const jsonFilePath = {
  type: "text",
  name: "filePath",
  message: "Please type the path to your JSON file"
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
    { title: "import JSON", value: 4 },
    { title: "Display your settings", value: 5 },
    { title: "exit", value: 6 }
  ]
};
const holdToken = {
  type: "confirm",
  name: "value",
  message: "Do you have a personal token?",
  initial: true
};
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
const log$2 = console.log;
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
      log$2(chalk.green(`${resp.status}: Created ${label.name}`));
      break;
    case 404:
      log$2(chalk.red(`${resp.status}: Resource not found`));
      break;
    case 422:
      log$2(chalk.red(`${resp.status}: Validation failed`));
      break;
    default:
      log$2(chalk.yellow(`${resp.status}: Something wrong`));
      break;
  }
};
const createLabels = async (configs2) => {
  labels.forEach(async (label) => {
    createLabel(configs2, label);
  });
  log$2("Created all labels");
  log$2(chalk.bgBlueBright(extraGuideText));
};
const deleteLabel = (configs2, labelNames) => {
  labelNames.forEach(async (labelName) => {
    await configs2.octokit.request(
      "DELETE /repos/{owner}/{repo}/labels/{name}",
      {
        owner: configs2.owner,
        repo: configs2.repo,
        name: labelName
      }
    );
  });
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
    log$2(chalk.red("something wrong"));
    return [];
  }
};
const deleteLabels = async (configs2) => {
  const names = await getLabels(configs2);
  names.forEach(async (name) => {
    await configs2.octokit.request(
      "DELETE /repos/{owner}/{repo}/labels/{name}",
      {
        owner: configs2.owner,
        repo: configs2.repo,
        name
      }
    );
  });
  log$2("");
  names.forEach((label) => log$2(chalk.bgGreen(`deleted ${label}`)));
  log$2(chalk.bgBlueBright(extraGuideText));
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
  async fileExists(path) {
    try {
      await promises.access(path);
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
const log$1 = console.log;
const importLabelsFromJson = async (configs2, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      log$1(chalk.red(`Error: File not found at path: ${filePath}`));
      return;
    }
    const fileContent = fs.readFileSync(filePath, "utf8");
    let jsonData;
    try {
      jsonData = JSON.parse(fileContent);
    } catch (parseError) {
      log$1(chalk.red(`Error: Invalid JSON syntax in file: ${filePath}`));
      log$1(
        chalk.red(
          `Parse error: ${parseError instanceof Error ? parseError.message : "Unknown error"}`
        )
      );
      return;
    }
    if (!Array.isArray(jsonData)) {
      log$1(chalk.red("Error: JSON file must contain an array of label objects"));
      return;
    }
    const validLabels = [];
    for (let i = 0; i < jsonData.length; i++) {
      const item = jsonData[i];
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
      log$1(chalk.red("Error: No valid labels found in JSON file"));
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
      fromSavedConfig: true
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
    fromSavedConfig: false
  };
};
const getJsonFilePath = async () => {
  const response = await prompts(jsonFilePath);
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
const setupConfigs = async () => {
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
      return setupConfigs();
    }
    throw new Error(
      `GitHub API authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
  return config;
};
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
const main = async () => {
  let hasValidConfig = false;
  if (firstStart && configManager.configExists()) {
    try {
      const existingConfig = await configManager.loadValidatedConfig();
      if (existingConfig && existingConfig.config && !existingConfig.shouldPromptForCredentials) {
        hasValidConfig = true;
      }
    } catch (error) {
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
      return;
    }
  }
  if (firstStart) {
    const asciiText = await getAsciiText();
    if (asciiText != null) log(asciiText);
    if (hasValidConfig) {
      try {
        const existingConfig = await configManager.loadValidatedConfig();
        if (existingConfig && existingConfig.config) {
          const repoResponse = await prompts([
            {
              type: "text",
              name: "repo",
              message: "Please type your target repo name"
            }
          ]);
          configs = {
            octokit: new Octokit({ auth: existingConfig.config.token }),
            owner: existingConfig.config.owner,
            repo: repoResponse.repo,
            fromSavedConfig: true
          };
          log(chalk.green(`Using saved configuration for ${configs.owner}`));
        } else {
          configs = await setupConfigs();
        }
      } catch (error) {
        configs = await setupConfigs();
      }
    } else {
      try {
        configs = await setupConfigs();
        if (configs.fromSavedConfig) {
          log(chalk.green(`Using saved configuration for ${configs.owner}`));
        }
      } catch (error) {
        log(
          chalk.red(
            `Configuration error: ${error instanceof Error ? error.message : "Unknown error"}`
          )
        );
        return;
      }
    }
  }
  let selectedIndex = await selectAction();
  while (selectedIndex == 99) {
    selectedIndex = await selectAction();
  }
  switch (selectedIndex) {
    case 0: {
      const newLabel2 = await getNewLabel();
      createLabel(configs, newLabel2);
      firstStart = firstStart && false;
      break;
    }
    case 1: {
      createLabels(configs);
      firstStart = firstStart && false;
      break;
    }
    case 2: {
      const targetLabel = await getTargetLabel();
      deleteLabel(configs, targetLabel);
      firstStart = firstStart && false;
      break;
    }
    case 3: {
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
          log(chalk.yellow("No file path provided. Returning to main menu."));
        }
      } catch (error) {
        log(
          chalk.red(
            `Error during JSON import: ${error instanceof Error ? error.message : "Unknown error"}`
          )
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
      console.log("exit");
      process.exit(0);
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
