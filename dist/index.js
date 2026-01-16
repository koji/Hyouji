#!/usr/bin/env node
import o from "chalk";
import { renderFilled as K } from "oh-my-logo";
import * as D from "fs";
import { promises as w, existsSync as F } from "fs";
import { homedir as x } from "os";
import * as q from "path";
import { join as S, dirname as U } from "path";
import { createHash as z, randomBytes as Z, createCipheriv as Q, createDecipheriv as X } from "crypto";
import b from "prompts";
import j from "yaml";
import { Octokit as O } from "@octokit/core";
import { exec as ee } from "child_process";
import { promisify as te } from "util";
const re = [
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
], oe = [
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
], ne = {
  type: "text",
  name: "name",
  message: "Please type label name you want to delete"
}, ie = {
  type: "text",
  name: "filePath",
  message: "Please type the path to your JSON or YAML file"
}, ae = {
  type: "toggle",
  name: "dryRun",
  message: "Run in dry-run mode? (no API calls will be made)",
  active: "yes",
  inactive: "no",
  initial: !1
}, se = {
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
}, le = {
  type: "confirm",
  name: "value",
  message: "Do you have a personal token?",
  initial: !0
}, H = [
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
], T = (
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
), ce = "Please input your GitHub info", de = async () => {
  try {
    return await K("Hyouji", {
      palette: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57"],
      direction: "diagonal"
    });
  } catch (n) {
    return console.error("Error rendering ASCII art:", n), `
╔══════════════════════════════════════════════════════════════╗
║                     Hyouji                                   ║
║              GitHub Label Manager CLI Tool                   ║
╚══════════════════════════════════════════════════════════════╝
Please report this issue to https://github.com/koji/Hyouji/issues
Thank you!
`;
  }
}, V = "If you don't see action selector, please hit space key.", fe = "https://github.com/settings/tokens", u = console.log, M = async (n, e) => {
  try {
    u(o.cyan(`⏳ Creating label "${e.name}"...`));
    const t = await n.octokit.request(
      "POST /repos/{owner}/{repo}/labels",
      {
        owner: n.owner,
        repo: n.repo,
        name: e.name,
        color: e.color,
        description: e.description
      }
    );
    switch (t.status) {
      case 201:
        return u(o.green(`✓ ${t.status}: Created ${e.name}`)), !0;
      case 404:
        return u(o.red(`${t.status}: Resource not found`)), !1;
      case 422:
        return u(o.red(`${t.status}: Validation failed`)), !1;
      default:
        return u(o.yellow(`${t.status}: Something wrong`)), !1;
    }
  } catch (t) {
    return u(
      o.red(
        `Error creating label "${e.name}": ${t instanceof Error ? t.message : "Unknown error"}`
      )
    ), !1;
  }
}, ue = async (n) => {
  let e = 0, t = 0;
  for (const r of T)
    await M(n, r) ? e++ : t++;
  return u(t === 0 ? o.green("✓ Created all labels successfully") : o.yellow(`Finished processing labels: ${e} created, ${t} failed`)), u(o.bgBlueBright(V)), { created: e, failed: t };
}, pe = async (n, e) => {
  let t = 0, r = 0;
  for (const a of e)
    try {
      u(o.cyan(`⏳ Deleting label "${a}"...`));
      const i = await n.octokit.request(
        "DELETE /repos/{owner}/{repo}/labels/{name}",
        {
          owner: n.owner,
          repo: n.repo,
          name: a
        }
      );
      i.status === 204 ? (t++, u(o.green(`${i.status}: Deleted ${a}`))) : (r++, u(o.yellow(`${i.status}: Something wrong with ${a}`)));
    } catch (i) {
      r++, i && typeof i == "object" && "status" in i && i.status === 404 ? u(o.red(`404: Label "${a}" not found`)) : u(
        o.red(
          `Error deleting label "${a}": ${i instanceof Error ? i.message : "Unknown error"}`
        )
      );
    }
  return { deleted: t, failed: r };
}, ge = async (n) => {
  const e = await n.octokit.request(
    "GET /repos/{owner}/{repo}/labels",
    {
      owner: n.owner,
      repo: n.repo
    }
  );
  return e.status === 200 ? await e.data.map((r) => r.name) : (u(o.red("something wrong")), []);
}, me = async (n) => {
  const e = await ge(n);
  if (e.length === 0)
    return u(o.yellow("No labels found to delete")), { deleted: 0, failed: 0 };
  u(o.blue(`Deleting ${e.length} labels...`));
  let t = 0, r = 0;
  for (const a of e)
    try {
      const i = await n.octokit.request(
        "DELETE /repos/{owner}/{repo}/labels/{name}",
        {
          owner: n.owner,
          repo: n.repo,
          name: a
        }
      );
      i.status === 204 ? (t++, u(o.green(`${i.status}: Deleted ${a}`))) : (r++, u(o.yellow(`${i.status}: Something wrong with ${a}`)));
    } catch (i) {
      r++, i && typeof i == "object" && "status" in i && i.status === 404 ? u(o.red(`404: Label "${a}" not found`)) : u(
        o.red(
          `Error deleting label "${a}": ${i instanceof Error ? i.message : "Unknown error"}`
        )
      );
    }
  return u(o.blue("Finished deleting labels")), u(o.bgBlueBright(V)), { deleted: t, failed: r };
};
class E {
  static {
    this.ALGORITHM = "aes-256-cbc";
  }
  static {
    this.ENCODING = "hex";
  }
  /**
   * Generate a machine-specific key based on system information
   * This provides basic obfuscation without requiring user passwords
   */
  static generateMachineKey() {
    const e = [
      x(),
      process.platform,
      process.arch,
      process.env.USER || process.env.USERNAME || "default"
    ].join("|");
    return z("sha256").update(e).digest();
  }
  /**
   * Encrypt a token using machine-specific key
   * @param token - The token to encrypt
   * @returns Encrypted token string
   */
  static encryptToken(e) {
    try {
      const t = this.generateMachineKey(), r = Z(16), a = Q(this.ALGORITHM, t, r);
      let i = a.update(e, "utf8", this.ENCODING);
      return i += a.final(this.ENCODING), r.toString(this.ENCODING) + ":" + i;
    } catch {
      return console.warn("⚠️  Token encryption failed, storing in plain text"), e;
    }
  }
  /**
   * Decrypt a token using machine-specific key
   * @param encryptedToken - The encrypted token string
   * @returns Decrypted token string
   */
  static decryptToken(e) {
    try {
      if (!e.includes(":"))
        return e;
      const [t, r] = e.split(":");
      if (!t || !r)
        return e;
      const a = this.generateMachineKey(), i = Buffer.from(t, this.ENCODING), c = X(this.ALGORITHM, a, i);
      let s = c.update(r, this.ENCODING, "utf8");
      return s += c.final("utf8"), s;
    } catch {
      return console.warn("⚠️  Token decryption failed, using as plain text"), e;
    }
  }
  /**
   * Check if a token appears to be encrypted
   * @param token - Token to check
   * @returns True if token appears to be encrypted
   */
  static isTokenEncrypted(e) {
    return e.includes(":") && e.length > 50;
  }
  /**
   * Obfuscate a token for display purposes (show only first/last few characters)
   * @param token - Token to obfuscate
   * @returns Obfuscated token string
   */
  static obfuscateToken(e) {
    if (!e || e.length < 8)
      return "***";
    const t = e.substring(0, 4), r = e.substring(e.length - 4), a = "*".repeat(Math.min(e.length - 8, 20));
    return `${t}${a}${r}`;
  }
}
class p extends Error {
  constructor(e, t, r) {
    super(t), this.type = e, this.originalError = r, this.name = "ConfigError";
  }
}
class P {
  constructor() {
    this.configDir = S(x(), ".config", "github-label-manager"), this.configPath = S(this.configDir, "config.json"), this.fallbackConfigPath = S(
      x(),
      ".github-label-manager-config.json"
    );
  }
  /**
   * Load configuration from file
   */
  async loadConfig() {
    const e = [
      { path: this.configPath, name: "primary" },
      { path: this.fallbackConfigPath, name: "fallback" }
    ];
    for (const t of e)
      try {
        if (await this.fileExists(t.path)) {
          const r = await this.loadConfigFromPath(t.path);
          if (r)
            return r;
        }
      } catch (r) {
        await this.handleConfigLoadError(r, t.path, t.name);
      }
    return null;
  }
  /**
   * Load and validate configuration from a specific path
   */
  async loadConfigFromPath(e) {
    try {
      const t = await w.readFile(e, "utf-8");
      if (!t.trim())
        throw new p(
          "CORRUPTED_FILE",
          "Configuration file is empty"
        );
      let r;
      try {
        r = JSON.parse(t);
      } catch (a) {
        throw new p(
          "CORRUPTED_FILE",
          "Configuration file contains invalid JSON",
          a
        );
      }
      if (await this.validateConfig(r))
        return {
          ...r,
          token: E.decryptToken(r.token)
        };
      throw new p(
        "INVALID_FORMAT",
        "Configuration file has invalid format or missing required fields"
      );
    } catch (t) {
      if (t instanceof p)
        throw t;
      const r = t;
      throw r.code === "EACCES" || r.code === "EPERM" ? new p(
        "PERMISSION_DENIED",
        `Permission denied accessing configuration file: ${e}`,
        r
      ) : r.code === "ENOENT" ? new p(
        "FILE_NOT_FOUND",
        `Configuration file not found: ${e}`,
        r
      ) : new p(
        "UNKNOWN_ERROR",
        `Unexpected error loading configuration: ${r.message}`,
        r
      );
    }
  }
  /**
   * Handle configuration loading errors with user-friendly messages
   */
  async handleConfigLoadError(e, t, r) {
    if (e instanceof p)
      switch (e.type) {
        case "CORRUPTED_FILE":
          console.warn(
            `⚠️  Configuration file at ${r} location is corrupted: ${e.message}`
          ), console.warn(`   File: ${t}`), console.warn(
            "   The file will be ignored and you'll be prompted for credentials."
          ), await this.backupCorruptedFile(t);
          break;
        case "PERMISSION_DENIED":
          console.warn(
            `⚠️  Permission denied accessing configuration file at ${r} location.`
          ), console.warn(`   File: ${t}`), console.warn(
            "   Please check file permissions or run with appropriate privileges."
          );
          break;
        case "INVALID_FORMAT":
          console.warn(
            `⚠️  Configuration file at ${r} location has invalid format.`
          ), console.warn(`   File: ${t}`), console.warn(
            "   The file will be ignored and you'll be prompted for credentials."
          ), await this.backupCorruptedFile(t);
          break;
        default:
          console.warn(
            `⚠️  Failed to load configuration from ${r} location: ${e.message}`
          ), console.warn(`   File: ${t}`);
      }
    else
      console.warn(
        `⚠️  Unexpected error loading configuration from ${r} location.`
      ), console.warn(`   File: ${t}`);
  }
  /**
   * Backup corrupted configuration file
   */
  async backupCorruptedFile(e) {
    try {
      const t = `${e}.backup.${Date.now()}`;
      await w.copyFile(e, t), console.warn(`   Corrupted file backed up to: ${t}`);
    } catch (t) {
      console.warn(
        `   Could not backup corrupted file: ${t instanceof Error ? t.message : "Unknown error"}`
      );
    }
  }
  /**
   * Save configuration to file
   */
  async saveConfig(e) {
    const t = {
      ...e,
      token: E.encryptToken(e.token),
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
    }, r = JSON.stringify(t, null, 2);
    try {
      if (await this.ensureConfigDirectory(), await w.writeFile(this.configPath, r, { mode: 384 }), await this.fileExists(this.fallbackConfigPath))
        try {
          await w.unlink(this.fallbackConfigPath);
        } catch {
          console.warn(
            `⚠️  Could not remove old fallback configuration file: ${this.fallbackConfigPath}`
          );
        }
      return;
    } catch (a) {
      const i = a;
      if (i.code === "EACCES" || i.code === "EPERM")
        console.warn(
          "⚠️  Permission denied writing to primary configuration location."
        ), console.warn(`   Attempted path: ${this.configPath}`), console.warn("   Trying fallback location...");
      else {
        if (i.code === "ENOSPC")
          throw new p(
            "UNKNOWN_ERROR",
            "Insufficient disk space to save configuration"
          );
        console.warn(
          `⚠️  Failed to save configuration to primary location: ${i.message}`
        ), console.warn("   Trying fallback location...");
      }
      try {
        await w.writeFile(this.fallbackConfigPath, r, {
          mode: 384
        }), console.warn(
          `✓ Configuration saved to fallback location: ${this.fallbackConfigPath}`
        );
        return;
      } catch (c) {
        const s = c;
        throw s.code === "EACCES" || s.code === "EPERM" ? new p(
          "PERMISSION_DENIED",
          "Permission denied: Cannot save configuration to any location. Please check file permissions or run with appropriate privileges.",
          s
        ) : s.code === "ENOSPC" ? new p(
          "UNKNOWN_ERROR",
          "Insufficient disk space to save configuration",
          s
        ) : new p(
          "UNKNOWN_ERROR",
          `Failed to save configuration to any location. Primary error: ${i.message}. Fallback error: ${s.message}`,
          s
        );
      }
    }
  }
  /**
   * Check if configuration file exists
   */
  configExists() {
    try {
      return F(this.configPath) || F(this.fallbackConfigPath);
    } catch {
      return !1;
    }
  }
  /**
   * Get the path to the configuration file
   */
  getConfigPath() {
    return F(this.configPath) ? this.configPath : F(this.fallbackConfigPath) ? this.fallbackConfigPath : this.configPath;
  }
  /**
   * Validate configuration data format
   */
  async validateConfig(e) {
    if (!e || typeof e != "object" || !e.token || typeof e.token != "string" || e.token.trim() === "" || !e.owner || typeof e.owner != "string" || e.owner.trim() === "")
      return !1;
    const t = E.decryptToken(e.token);
    return !!/^(ghp_|gho_|ghu_|ghs_)[a-zA-Z0-9]{36}$/.test(t);
  }
  /**
   * Validate credentials against GitHub API
   */
  async validateCredentials(e) {
    try {
      const { Octokit: t } = await import("@octokit/core"), r = E.decryptToken(e.token), i = await new t({
        auth: r
      }).request("GET /user");
      return i.data.login.toLowerCase() !== e.owner.toLowerCase() ? {
        isValid: !1,
        error: new p(
          "INVALID_FORMAT",
          `Token belongs to user '${i.data.login}' but configuration is for '${e.owner}'`
        )
      } : { isValid: !0 };
    } catch (t) {
      const r = t;
      return r.status === 401 ? {
        isValid: !1,
        error: new p(
          "INVALID_FORMAT",
          "GitHub token is invalid or has expired"
        )
      } : r.status === 403 ? {
        isValid: !1,
        error: new p(
          "INVALID_FORMAT",
          "GitHub token has insufficient permissions or rate limit exceeded"
        )
      } : r.code === "ENOTFOUND" || r.code === "ECONNREFUSED" || r.code === "ETIMEDOUT" ? {
        isValid: !1,
        error: new p(
          "NETWORK_ERROR",
          "Unable to connect to GitHub API. Please check your internet connection."
        )
      } : {
        isValid: !1,
        error: new p(
          "UNKNOWN_ERROR",
          `Failed to validate credentials: ${r.message || "Unknown error"}`
        )
      };
    }
  }
  /**
   * Migrate existing plain text configuration to encrypted format
   */
  async migrateToEncrypted() {
    const e = await this.loadConfig();
    if (e && !E.isTokenEncrypted(e.token)) {
      console.log("🔒 Migrating configuration to encrypted format...");
      try {
        await this.saveConfig(e), console.log("✓ Configuration successfully encrypted");
      } catch (t) {
        console.warn(
          "⚠️  Failed to encrypt existing configuration:",
          t instanceof Error ? t.message : "Unknown error"
        );
      }
    }
  }
  /**
   * Load and validate configuration with credential validation
   */
  async loadValidatedConfig() {
    const e = await this.loadConfig();
    if (!e)
      return { config: null, shouldPromptForCredentials: !0 };
    const t = await this.validateCredentials(e);
    if (t.isValid)
      return { config: e, shouldPromptForCredentials: !1 };
    const r = {};
    return t.error && (console.warn(`⚠️  ${P.getErrorMessage(t.error)}`), t.error.type === "INVALID_FORMAT" && !t.error.message.includes("Token belongs to user") && (r.owner = e.owner, console.warn(
      `   Your GitHub username '${e.owner}' will be preserved.`
    ))), {
      config: null,
      shouldPromptForCredentials: !0,
      preservedData: Object.keys(r).length > 0 ? r : void 0
    };
  }
  /**
   * Clear configuration file
   */
  async clearConfig() {
    const e = [];
    if (await this.fileExists(this.configPath))
      try {
        await w.unlink(this.configPath);
      } catch (t) {
        const r = t;
        r.code === "EACCES" || r.code === "EPERM" ? e.push(
          `Permission denied removing primary config file: ${this.configPath}`
        ) : e.push(
          `Failed to remove primary config file: ${r.message}`
        );
      }
    if (await this.fileExists(this.fallbackConfigPath))
      try {
        await w.unlink(this.fallbackConfigPath);
      } catch (t) {
        const r = t;
        r.code === "EACCES" || r.code === "EPERM" ? e.push(
          `Permission denied removing fallback config file: ${this.fallbackConfigPath}`
        ) : e.push(
          `Failed to remove fallback config file: ${r.message}`
        );
      }
    if (e.length > 0)
      throw new p(
        "PERMISSION_DENIED",
        `Failed to clear configuration: ${e.join("; ")}`
      );
  }
  /**
   * Ensure configuration directory exists with proper permissions
   */
  async ensureConfigDirectory() {
    try {
      await w.mkdir(this.configDir, { recursive: !0, mode: 448 });
    } catch (e) {
      const t = e;
      if (t.code === "EEXIST")
        return;
      throw t.code === "EACCES" || t.code === "EPERM" ? new p(
        "PERMISSION_DENIED",
        `Permission denied creating configuration directory: ${this.configDir}`,
        t
      ) : t.code === "ENOSPC" ? new p(
        "UNKNOWN_ERROR",
        "Insufficient disk space to create configuration directory",
        t
      ) : new p(
        "UNKNOWN_ERROR",
        `Failed to create configuration directory: ${t.message}`,
        t
      );
    }
  }
  /**
   * Check if file exists
   */
  async fileExists(e) {
    try {
      return await w.access(e), !0;
    } catch {
      return !1;
    }
  }
  /**
   * Get user-friendly error message for configuration problems
   */
  static getErrorMessage(e) {
    switch (e.type) {
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
      default:
        return `An unexpected error occurred: ${e.message}`;
    }
  }
  /**
   * Check if an error is recoverable (user can continue with prompts)
   */
  static isRecoverableError(e) {
    return [
      "FILE_NOT_FOUND",
      "CORRUPTED_FILE",
      "INVALID_FORMAT"
      /* INVALID_FORMAT */
    ].includes(e.type);
  }
}
const he = async () => (await b(le)).value, ye = async () => !!(await b(ae)).dryRun, k = console.log, we = async () => {
  try {
    const n = "./hyouji.json", e = JSON.stringify(H, null, 2);
    k(o.blue("Generating sample JSON file...")), D.writeFileSync(n, e, "utf8"), k(
      o.green(
        "✅ Sample JSON file generated successfully at ./hyouji.json"
      )
    );
  } catch (n) {
    if (n instanceof Error) {
      const e = n;
      e.code === "EACCES" ? k(
        o.red(
          "❌ Error generating sample JSON file: Permission denied. Please check write permissions for the current directory."
        )
      ) : e.code === "ENOSPC" ? k(
        o.red(
          "❌ Error generating sample JSON file: Insufficient disk space."
        )
      ) : e.code === "EROFS" ? k(
        o.red(
          "❌ Error generating sample JSON file: Read-only file system."
        )
      ) : k(o.red(`❌ Error generating sample JSON file: ${n.message}`));
    } else
      k(
        o.red(
          "❌ An unexpected error occurred while generating the sample JSON file"
        )
      );
  }
}, C = console.log, Ee = async () => {
  try {
    const n = "./hyouji.yaml", e = j.stringify(H, {
      indent: 2,
      singleQuote: !1
      // Use double quotes for strings
    });
    C(o.blue("Generating sample YAML file...")), D.writeFileSync(n, e, "utf8"), C(
      o.green(
        "✅ Sample YAML file generated successfully at ./hyouji.yaml"
      )
    );
  } catch (n) {
    if (n instanceof Error) {
      const e = n;
      e.code === "EACCES" ? C(
        o.red(
          "❌ Error generating sample YAML file: Permission denied. Please check write permissions for the current directory."
        )
      ) : e.code === "ENOSPC" ? C(
        o.red(
          "❌ Error generating sample YAML file: Insufficient disk space."
        )
      ) : e.code === "EROFS" ? C(
        o.red(
          "❌ Error generating sample YAML file: Read-only file system."
        )
      ) : C(o.red(`❌ Error generating sample YAML file: ${n.message}`));
    } else
      C(
        o.red(
          "❌ An unexpected error occurred while generating the sample YAML file"
        )
      );
  }
}, be = (n) => {
  switch (q.extname(n).toLowerCase()) {
    case ".json":
      return "json";
    case ".yaml":
    case ".yml":
      return "yaml";
    default:
      return null;
  }
}, ke = (n) => JSON.parse(n), Ce = (n) => {
  try {
    return j.parse(n);
  } catch (e) {
    throw e instanceof Error ? new Error(`YAML Error: ${e.message}`) : e;
  }
}, $e = () => [".json", ".yaml", ".yml"], Ie = () => $e().join(", "), d = console.log, ve = async (n, e, t = !1) => {
  const r = {
    attempted: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0
  };
  try {
    if (!D.existsSync(e))
      return d(o.red(`Error: File not found at path: ${e}`)), r.failed += 1, r;
    const a = be(e);
    if (!a)
      return d(
        o.red(
          `Error: Unsupported file format. Supported formats: ${Ie()}`
        )
      ), r.failed += 1, r;
    const i = D.readFileSync(e, "utf8");
    let c;
    try {
      a === "json" ? c = ke(i) : a === "yaml" && (c = Ce(i));
    } catch (f) {
      const y = a.toUpperCase();
      return d(o.red(`Error: Invalid ${y} syntax in file: ${e}`)), d(
        o.red(
          `Parse error: ${f instanceof Error ? f.message : "Unknown error"}`
        )
      ), r.failed += 1, r;
    }
    if (!Array.isArray(c))
      return d(o.red("Error: File must contain an array of label objects")), r.failed += 1, r;
    const s = [];
    for (let f = 0; f < c.length; f++) {
      const y = c[f];
      if (typeof y != "object" || y === null) {
        d(o.red(`Error: Item at index ${f} is not a valid object`));
        continue;
      }
      const m = y;
      if (!m.name) {
        d(
          o.red(
            `Error: Item at index ${f} is missing required 'name' field`
          )
        );
        continue;
      }
      if (typeof m.name != "string") {
        d(
          o.red(
            `Error: Item at index ${f} has invalid 'name' field (must be a non-empty string)`
          )
        );
        continue;
      }
      if (m.name.trim() === "") {
        d(
          o.red(
            `Error: Item at index ${f} has empty 'name' field (name cannot be empty)`
          )
        );
        continue;
      }
      if (m.color !== void 0) {
        if (typeof m.color != "string") {
          d(
            o.red(
              `Error: Item at index ${f} has invalid 'color' field (must be a string)`
            )
          );
          continue;
        }
        if (m.color.trim() === "") {
          d(
            o.red(
              `Error: Item at index ${f} has empty 'color' field (color cannot be empty if provided)`
            )
          );
          continue;
        }
      }
      if (m.description !== void 0 && typeof m.description != "string") {
        d(
          o.red(
            `Error: Item at index ${f} has invalid 'description' field (must be a string)`
          )
        );
        continue;
      }
      const A = ["name", "color", "description"], L = Object.keys(m).filter(
        (Y) => !A.includes(Y)
      );
      L.length > 0 && d(
        o.yellow(
          `Warning: Item at index ${f} contains unknown fields that will be ignored: ${L.join(", ")}`
        )
      );
      const J = {
        name: m.name.trim(),
        ...m.color !== void 0 && {
          color: m.color.trim()
        },
        ...m.description !== void 0 && {
          description: m.description
        }
      };
      s.push(J);
    }
    if (s.length === 0)
      return d(o.red("Error: No valid labels found in file")), r.failed += 1, r;
    if (r.attempted = s.length, t)
      return s.forEach((f) => {
        r.skipped += 1, d(o.yellow(`[dry-run] Would create label "${f.name}"`));
      }), d(
        o.blue(
          `Dry run summary: Would create ${s.length} labels.`
        )
      ), r;
    d(o.blue(`Starting import of ${s.length} labels...`)), d("");
    let h = 0, v = 0;
    for (let f = 0; f < s.length; f++) {
      const y = s[f], m = `[${f + 1}/${s.length}]`;
      try {
        d(o.cyan(`${m} Processing: ${y.name}`)), await M(n, y), h++;
      } catch (A) {
        v++, d(
          o.red(
            `${m} Failed to create label "${y.name}": ${A instanceof Error ? A.message : "Unknown error"}`
          )
        );
      }
    }
    d(""), v === 0 ? (d(
      o.green(
        `✅ Import completed successfully! Created ${h} labels.`
      )
    ), r.succeeded = h) : (d(o.yellow("⚠️  Import completed with some errors:")), d(o.green(`  • Successfully created: ${h} labels`)), d(o.red(`  • Failed to create: ${v} labels`)), d(o.blue(`  • Total processed: ${s.length} labels`)), r.succeeded = h, r.failed += v);
  } catch (a) {
    d(
      o.red(
        `Error reading file: ${a instanceof Error ? a.message : "Unknown error"}`
      )
    ), r.failed += 1;
  }
  return r;
}, Fe = async () => [(await b(ne)).name], G = 5e3;
class Pe {
  static {
    this.execAsyncInternal = te(ee);
  }
  /**
   * Overrides the internal execAsync function for testing purposes.
   * @param mock - The mock function to use for execAsync.
   */
  static overrideExecAsync(e) {
    this.execAsyncInternal = e;
  }
  /**
   * Detects Git repository information from the current working directory
   * @param cwd - Current working directory (defaults to process.cwd())
   * @returns Promise<GitDetectionResult>
   */
  static async detectRepository(e) {
    const t = e || process.cwd();
    let r;
    try {
      r = await this.findGitRoot(t);
    } catch (v) {
      const f = v;
      return {
        isGitRepository: !1,
        error: f instanceof Error ? f.message : "Unknown error occurred"
      };
    }
    if (!r)
      return {
        isGitRepository: !1,
        error: "Not a Git repository"
      };
    const a = await this.getAllRemotes(r);
    if ("error" in a)
      return { isGitRepository: !1, error: a.error };
    const i = a.remotes;
    if (i.length === 0)
      return {
        isGitRepository: !0,
        error: "No remotes configured"
      };
    let c = null, s = "origin";
    if (i.includes("origin") && (c = await this.getRemoteUrl(r, "origin")), !c && i.length > 0 && (c = await this.getRemoteUrl(r, i[0]), s = "first-remote"), !c)
      return {
        isGitRepository: !0,
        error: "Could not retrieve remote URL"
      };
    const h = this.parseGitUrl(c);
    return h ? {
      isGitRepository: !0,
      repositoryInfo: {
        owner: h.owner,
        repo: h.repo,
        remoteUrl: c,
        detectionMethod: s
      }
    } : {
      isGitRepository: !0,
      error: "Could not parse remote URL"
    };
  }
  /**
   * Finds the Git root directory by traversing up the directory tree
   * @param startPath - Starting directory path
   * @returns Promise<string | null> - Git root path or null if not found
   */
  static async findGitRoot(e) {
    let t = e;
    for (; t !== U(t); ) {
      const r = S(t, ".git");
      if (F(r))
        return t;
      t = U(t);
    }
    return F(S(t, ".git")) ? t : null;
  }
  /**
   * Gets the URL for a specific Git remote
   * @param gitRoot - Git repository root directory
   * @param remoteName - Name of the remote (e.g., 'origin')
   * @returns Promise<string | null> - Remote URL or null if not found
   */
  static async getRemoteUrl(e, t) {
    try {
      const { stdout: r } = await this.execAsyncInternal(
        `git remote get-url ${t}`,
        {
          cwd: e,
          timeout: G
        }
      );
      return r.trim() || null;
    } catch {
      return null;
    }
  }
  /**
   * Parses a Git URL to extract owner and repository name
   * @param url - Git remote URL
   * @returns Object with owner and repo or null if parsing fails
   */
  static parseGitUrl(e) {
    if (!e || typeof e != "string" || e.trim().length === 0)
      return null;
    const t = e.trim();
    try {
      const r = t.match(
        /^git@github\.com:([^/\s:]+)\/([^/\s:]+?)(?:\.git)?$/
      );
      if (r) {
        const c = r[1], s = r[2];
        if (this.isValidGitHubIdentifier(c) && this.isValidGitHubIdentifier(s))
          return { owner: c, repo: s };
      }
      const a = t.match(
        /^https:\/\/github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git)?(?:\/)?$/
      );
      if (a) {
        const c = a[1], s = a[2];
        if (this.isValidGitHubIdentifier(c) && this.isValidGitHubIdentifier(s))
          return { owner: c, repo: s };
      }
      const i = t.match(
        /^http:\/\/github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git)?(?:\/)?$/
      );
      if (i) {
        const c = i[1], s = i[2];
        if (this.isValidGitHubIdentifier(c) && this.isValidGitHubIdentifier(s))
          return { owner: c, repo: s };
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
  static isValidGitHubIdentifier(e) {
    if (!e || typeof e != "string")
      return !1;
    const t = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
    return e.length >= 1 && e.length <= 39 && t.test(e) && !e.includes("--");
  }
  /**
   * Gets all configured Git remotes
   * @param gitRoot - Git repository root directory
   * @returns Promise with remotes array or error object
   */
  static async getAllRemotes(e) {
    try {
      const { stdout: t } = await this.execAsyncInternal("git remote", {
        cwd: e,
        timeout: G
      });
      return {
        remotes: t.trim().split(`
`).filter((r) => r.length > 0)
      };
    } catch (t) {
      const r = t;
      return r.code === "ENOENT" ? { error: "Git command not available" } : r instanceof Error && (r.message.includes("not a git repository") || r.message.includes("Not a git repository")) ? { error: "Not a Git repository" } : { remotes: [] };
    }
  }
}
const Re = async () => {
  const n = new P();
  let e = {
    config: null,
    shouldPromptForCredentials: !0,
    preservedData: void 0
  };
  try {
    const i = await n.loadValidatedConfig();
    i && (e = i);
  } catch {
    e = {
      config: null,
      shouldPromptForCredentials: !0,
      preservedData: void 0
    };
  }
  if (e.config && !e.shouldPromptForCredentials) {
    try {
      const s = await Pe.detectRepository();
      if (s.isGitRepository && s.repositoryInfo)
        return console.log(
          o.green(
            `✓ Detected repository: ${s.repositoryInfo.owner}/${s.repositoryInfo.repo}`
          )
        ), console.log(
          o.gray(
            `  Detection method: ${s.repositoryInfo.detectionMethod === "origin" ? "origin remote" : "first available remote"}`
          )
        ), {
          octokit: new O({
            auth: e.config.token
          }),
          owner: s.repositoryInfo.owner,
          repo: s.repositoryInfo.repo,
          fromSavedConfig: !0,
          autoDetected: !0,
          detectionMethod: s.repositoryInfo.detectionMethod
        };
      s.error && console.log(
        o.yellow(
          `⚠️  Repository auto-detection failed: ${s.error}`
        )
      ), console.log(o.gray("  Falling back to manual input..."));
    } catch (s) {
      console.log(
        o.yellow(
          "⚠️  Repository auto-detection failed, falling back to manual input"
        )
      ), s instanceof Error && console.log(o.gray(`  Error: ${s.message}`));
    }
    const i = await b([
      {
        type: "text",
        name: "repo",
        message: "Please type your target repo name"
      }
    ]);
    return {
      octokit: new O({
        auth: e.config.token
      }),
      owner: e.config.owner,
      repo: i.repo,
      fromSavedConfig: !0,
      autoDetected: !1,
      detectionMethod: "manual"
    };
  }
  const t = [...re];
  if (e.preservedData?.owner) {
    const i = t.findIndex(
      (c) => c.name === "owner"
    );
    i !== -1 && (t[i] = {
      ...t[i],
      initial: e.preservedData.owner
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    });
  }
  const r = await b(t);
  if (r.octokit && r.owner)
    try {
      await n.saveConfig({
        token: r.octokit,
        owner: r.owner,
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
      }), e.preservedData?.owner && e.preservedData.owner !== r.owner ? console.log("✓ Configuration updated with new credentials") : console.log("✓ Configuration saved successfully");
    } catch (i) {
      i instanceof p ? (console.error(`❌ ${P.getErrorMessage(i)}`), P.isRecoverableError(i) || console.error(
        "   This may affect future sessions. Please resolve the issue or contact support."
      )) : console.warn(
        "⚠️  Failed to save configuration:",
        i instanceof Error ? i.message : "Unknown error"
      );
    }
  return {
    octokit: new O({
      auth: r.octokit
    }),
    owner: r.owner,
    repo: r.repo,
    fromSavedConfig: !1,
    autoDetected: !1,
    detectionMethod: "manual"
  };
}, Ne = async () => (await b(ie)).filePath, Se = async () => await b(oe), _ = async () => {
  const n = await b(se), { action: e } = n;
  return e[0] !== void 0 ? e[0] : 99;
}, l = console.log;
let g = !0;
const I = new P(), Ae = async () => {
  l(o.cyan(`
=== Current Settings ===`));
  const n = I.getConfigPath();
  if (l(o.blue(`Configuration file path: ${n}`)), !I.configExists()) {
    l(
      o.yellow(
        "No configuration file exists. You will be prompted for credentials on next action."
      )
    );
    return;
  }
  try {
    const e = await I.loadConfig();
    if (!e) {
      l(o.yellow("Configuration file exists but contains invalid data."));
      return;
    }
    if (l(o.green(`GitHub account: ${e.owner}`)), e.token) {
      const r = E.isTokenEncrypted(e.token) ? "✓ Saved and encrypted" : "✓ Saved (plain text)";
      l(o.green(`Personal token: ${r}`));
      const a = E.decryptToken(e.token), i = E.obfuscateToken(a);
      l(o.blue(`Token preview: ${i}`));
    } else
      l(o.red("Personal token: ✗ Not saved"));
    if (e.lastUpdated) {
      const t = new Date(e.lastUpdated);
      l(o.blue(`Last updated: ${t.toLocaleString()}`));
    }
  } catch (e) {
    l(
      o.red(
        `Error reading configuration: ${e instanceof Error ? e.message : "Unknown error"}`
      )
    );
  }
  l(o.cyan(`========================
`));
};
let $;
const W = async () => {
  let n = !1;
  if (I.configExists())
    try {
      const e = await I.loadValidatedConfig();
      e && e.config && !e.shouldPromptForCredentials && (n = !0);
    } catch (e) {
      console.error("Error loading config:", e), n = !1;
    }
  if (!n && !await he())
    return l(
      o.redBright(
        `Please go to ${fe} and generate a personal token!`
      )
    ), null;
  try {
    const e = await de();
    e != null && l(e);
  } catch (e) {
    console.warn("Failed to display ASCII art, continuing..."), console.error("Error:", e);
  }
  try {
    console.log(ce), g && await I.migrateToEncrypted();
    const e = await Re();
    if (!e.octokit || !e.owner || !e.repo)
      throw new Error("Invalid configuration: missing required fields");
    try {
      await e.octokit.request("GET /user");
    } catch (t) {
      if (e.fromSavedConfig)
        return console.log(
          o.yellow(
            "Saved credentials are invalid. Please provide new credentials."
          )
        ), await I.clearConfig(), W();
      throw new Error(
        `GitHub API authentication failed: ${t instanceof Error ? t.message : "Unknown error"}`
      );
    }
    if (e.fromSavedConfig && l(o.green(`✓ Using saved configuration for ${e.owner}`)), e.autoDetected) {
      l(
        o.green(
          `✓ Repository auto-detected: ${e.owner}/${e.repo}`
        )
      );
      const t = e.detectionMethod === "origin" ? "origin remote" : e.detectionMethod === "first-remote" ? "first available remote" : "manual input";
      l(o.gray(`  Detection method: ${t}`));
    } else e.detectionMethod === "manual" && (l(
      o.blue(`✓ Repository configured: ${e.owner}/${e.repo}`)
    ), l(o.gray("  Input method: manual")));
    return e;
  } catch (e) {
    return l(
      o.red(
        `Configuration error: ${e instanceof Error ? e.message : "Unknown error"}`
      )
    ), null;
  }
}, R = () => ({
  created: 0,
  deleted: 0,
  skipped: 0,
  failed: 0,
  notes: []
}), N = (n, e, t) => {
  l(o.cyan(`
=== ${n} summary ===`)), t && l(o.yellow("Mode: dry run (no API calls executed)")), l(
    o.green(`Created: ${e.created}`) + o.red(`  Failed: ${e.failed}`) + o.blue(`  Deleted: ${e.deleted}`) + o.yellow(`  Skipped: ${e.skipped}`)
  ), e.notes.forEach((r) => l(o.gray(`- ${r}`))), e.failed > 0 && !t && l(
    o.yellow(
      "Some operations failed. Re-run the command or check your credentials/permissions."
    )
  ), l(o.cyan(`========================
`));
}, B = async () => {
  if (g && ($ = await W(), !$))
    return;
  let n = await _();
  for (; n == 99; )
    n = await _();
  if (n === 8) {
    console.log("exit"), process.exit(0);
    return;
  }
  const e = n >= 0 && n <= 4 ? await ye() : !1;
  switch (n) {
    case 0: {
      const t = R(), r = await Se();
      e ? (l(
        o.yellow(
          `[dry-run] Would create label "${r.name}" with color "${r.color ?? "N/A"}"`
        )
      ), t.skipped += 1) : await M($, r) ? t.created += 1 : t.failed += 1, N("Create a label", t, e), g = g && !1;
      break;
    }
    case 1: {
      const t = R();
      if (e)
        l(
          o.yellow(
            `[dry-run] Would create ${T.length} preset labels (no API calls)`
          )
        ), t.skipped += T.length;
      else {
        const r = await ue($);
        t.created = r.created, t.failed = r.failed;
      }
      N("Create preset labels", t, e), g = g && !1;
      break;
    }
    case 2: {
      const t = R(), r = await Fe();
      if (e)
        t.skipped += r.length, r.forEach(
          (a) => l(o.yellow(`[dry-run] Would delete label "${a}"`))
        );
      else {
        const a = await pe($, r);
        t.deleted = a.deleted, t.failed = a.failed;
      }
      N("Delete a label", t, e), g = g && !1;
      break;
    }
    case 3: {
      const t = R();
      if (e)
        l(
          o.yellow(
            "[dry-run] Would delete all labels in the configured repository"
          )
        ), t.skipped += 1;
      else {
        const r = await me($);
        t.deleted = r.deleted, t.failed = r.failed, t.notes.push("All labels processed");
      }
      N("Delete all labels", t, e), g = g && !1;
      break;
    }
    case 4: {
      const t = R();
      try {
        const r = await Ne();
        if (r) {
          const a = await ve($, r, e);
          t.created = a.succeeded, t.failed = a.failed, t.skipped = a.skipped, t.notes.push(
            `Processed ${a.attempted} label entries from file`
          );
        } else
          l(o.yellow("No file path provided. Returning to main menu.")), t.skipped += 1;
      } catch (r) {
        l(
          o.red(
            `Error during label import: ${r instanceof Error ? r.message : "Unknown error"}`
          )
        ), t.failed += 1;
      }
      N("Import labels", t, e), g = g && !1;
      break;
    }
    case 5: {
      try {
        await we();
      } catch (t) {
        l(
          o.red(
            `Error generating sample JSON: ${t instanceof Error ? t.message : "Unknown error"}`
          )
        );
      }
      g = g && !1;
      break;
    }
    case 6: {
      try {
        await Ee();
      } catch (t) {
        l(
          o.red(
            `Error generating sample YAML: ${t instanceof Error ? t.message : "Unknown error"}`
          )
        );
      }
      g = g && !1;
      break;
    }
    case 7: {
      await Ae(), g = g && !1;
      break;
    }
    case 8: {
      console.log("exit"), process.exit(0);
      return;
    }
    // eslint-disable-next-line no-fallthrough
    default: {
      console.log("invalid input");
      break;
    }
  }
  B();
};
B();
