import { existsSync, promises as fs } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

import { StoredConfigType } from '../types'

import { CryptoUtils } from './cryptoUtils'

export enum ConfigErrorType {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  CORRUPTED_FILE = 'CORRUPTED_FILE',
  INVALID_FORMAT = 'INVALID_FORMAT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class ConfigError extends Error {
  constructor(
    public type: ConfigErrorType,
    message: string,
    public originalError?: Error,
  ) {
    super(message)
    this.name = 'ConfigError'
  }
}

export class ConfigManager {
  private readonly configDir: string
  private readonly configPath: string
  private readonly fallbackConfigPath: string

  constructor() {
    // Primary location: ~/.config/github-label-manager/config.json
    this.configDir = join(homedir(), '.config', 'github-label-manager')
    this.configPath = join(this.configDir, 'config.json')

    // Fallback location: ~/.github-label-manager-config.json
    this.fallbackConfigPath = join(
      homedir(),
      '.github-label-manager-config.json',
    )
  }

  /**
   * Load configuration from file
   */
  async loadConfig(): Promise<StoredConfigType | null> {
    const locations = [
      { path: this.configPath, name: 'primary' },
      { path: this.fallbackConfigPath, name: 'fallback' },
    ]

    for (const location of locations) {
      try {
        if (await this.fileExists(location.path)) {
          const config = await this.loadConfigFromPath(location.path)
          if (config) {
            return config
          }
        }
      } catch (error) {
        await this.handleConfigLoadError(error, location.path, location.name)
      }
    }

    return null
  }

  /**
   * Load and validate configuration from a specific path
   */
  private async loadConfigFromPath(
    configPath: string,
  ): Promise<StoredConfigType | null> {
    try {
      const data = await fs.readFile(configPath, 'utf-8')

      if (!data.trim()) {
        throw new ConfigError(
          ConfigErrorType.CORRUPTED_FILE,
          'Configuration file is empty',
        )
      }

      let config: StoredConfigType
      try {
        config = JSON.parse(data)
      } catch (parseError) {
        throw new ConfigError(
          ConfigErrorType.CORRUPTED_FILE,
          'Configuration file contains invalid JSON',
          parseError as Error,
        )
      }

      if (await this.validateConfig(config)) {
        // Decrypt the token before returning
        const decryptedConfig = {
          ...config,
          token: CryptoUtils.decryptToken(config.token),
        }
        return decryptedConfig as StoredConfigType
      } else {
        throw new ConfigError(
          ConfigErrorType.INVALID_FORMAT,
          'Configuration file has invalid format or missing required fields',
        )
      }
    } catch (error) {
      if (error instanceof ConfigError) {
        throw error
      }

      const nodeError = error as NodeJS.ErrnoException
      if (nodeError.code === 'EACCES' || nodeError.code === 'EPERM') {
        throw new ConfigError(
          ConfigErrorType.PERMISSION_DENIED,
          `Permission denied accessing configuration file: ${configPath}`,
          nodeError,
        )
      }

      if (nodeError.code === 'ENOENT') {
        throw new ConfigError(
          ConfigErrorType.FILE_NOT_FOUND,
          `Configuration file not found: ${configPath}`,
          nodeError,
        )
      }

      throw new ConfigError(
        ConfigErrorType.UNKNOWN_ERROR,
        `Unexpected error loading configuration: ${nodeError.message}`,
        nodeError,
      )
    }
  }

  /**
   * Handle configuration loading errors with user-friendly messages
   */
  private async handleConfigLoadError(
    error: unknown,
    configPath: string,
    locationName: string,
  ): Promise<void> {
    if (error instanceof ConfigError) {
      switch (error.type) {
        case ConfigErrorType.CORRUPTED_FILE:
          console.warn(
            `⚠️  Configuration file at ${locationName} location is corrupted: ${error.message}`,
          )
          console.warn(`   File: ${configPath}`)
          console.warn(
            `   The file will be ignored and you'll be prompted for credentials.`,
          )

          // Attempt to backup corrupted file
          await this.backupCorruptedFile(configPath)
          break

        case ConfigErrorType.PERMISSION_DENIED:
          console.warn(
            `⚠️  Permission denied accessing configuration file at ${locationName} location.`,
          )
          console.warn(`   File: ${configPath}`)
          console.warn(
            `   Please check file permissions or run with appropriate privileges.`,
          )
          break

        case ConfigErrorType.INVALID_FORMAT:
          console.warn(
            `⚠️  Configuration file at ${locationName} location has invalid format.`,
          )
          console.warn(`   File: ${configPath}`)
          console.warn(
            `   The file will be ignored and you'll be prompted for credentials.`,
          )

          // Attempt to backup invalid file
          await this.backupCorruptedFile(configPath)
          break

        default:
          console.warn(
            `⚠️  Failed to load configuration from ${locationName} location: ${error.message}`,
          )
          console.warn(`   File: ${configPath}`)
      }
    } else {
      console.warn(
        `⚠️  Unexpected error loading configuration from ${locationName} location.`,
      )
      console.warn(`   File: ${configPath}`)
    }
  }

  /**
   * Backup corrupted configuration file
   */
  private async backupCorruptedFile(configPath: string): Promise<void> {
    try {
      const backupPath = `${configPath}.backup.${Date.now()}`
      await fs.copyFile(configPath, backupPath)
      console.warn(`   Corrupted file backed up to: ${backupPath}`)
    } catch (backupError) {
      console.warn(
        `   Could not backup corrupted file: ${backupError instanceof Error ? backupError.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Save configuration to file
   */
  async saveConfig(config: StoredConfigType): Promise<void> {
    // Encrypt the token before saving
    const encryptedConfig = {
      ...config,
      token: CryptoUtils.encryptToken(config.token),
      lastUpdated: new Date().toISOString(),
    }

    const configJson = JSON.stringify(encryptedConfig, null, 2)

    // Try primary location first
    try {
      await this.ensureConfigDirectory()
      await fs.writeFile(this.configPath, configJson, { mode: 0o600 })

      // Remove fallback file if it exists
      if (await this.fileExists(this.fallbackConfigPath)) {
        try {
          await fs.unlink(this.fallbackConfigPath)
        } catch {
          console.warn(
            `⚠️  Could not remove old fallback configuration file: ${this.fallbackConfigPath}`,
          )
        }
      }

      return
    } catch (primaryError) {
      const nodeError = primaryError as NodeJS.ErrnoException

      if (nodeError.code === 'EACCES' || nodeError.code === 'EPERM') {
        console.warn(
          `⚠️  Permission denied writing to primary configuration location.`,
        )
        console.warn(`   Attempted path: ${this.configPath}`)
        console.warn(`   Trying fallback location...`)
      } else if (nodeError.code === 'ENOSPC') {
        throw new ConfigError(
          ConfigErrorType.UNKNOWN_ERROR,
          'Insufficient disk space to save configuration',
        )
      } else {
        console.warn(
          `⚠️  Failed to save configuration to primary location: ${nodeError.message}`,
        )
        console.warn(`   Trying fallback location...`)
      }

      // Try fallback location
      try {
        await fs.writeFile(this.fallbackConfigPath, configJson, {
          mode: 0o600,
        })
        console.warn(
          `✓ Configuration saved to fallback location: ${this.fallbackConfigPath}`,
        )
        return
      } catch (fallbackError) {
        const fallbackNodeError = fallbackError as NodeJS.ErrnoException

        if (
          fallbackNodeError.code === 'EACCES' ||
          fallbackNodeError.code === 'EPERM'
        ) {
          throw new ConfigError(
            ConfigErrorType.PERMISSION_DENIED,
            'Permission denied: Cannot save configuration to any location. Please check file permissions or run with appropriate privileges.',
            fallbackNodeError,
          )
        }

        if (fallbackNodeError.code === 'ENOSPC') {
          throw new ConfigError(
            ConfigErrorType.UNKNOWN_ERROR,
            'Insufficient disk space to save configuration',
            fallbackNodeError,
          )
        }

        throw new ConfigError(
          ConfigErrorType.UNKNOWN_ERROR,
          `Failed to save configuration to any location. Primary error: ${nodeError.message}. Fallback error: ${fallbackNodeError.message}`,
          fallbackNodeError,
        )
      }
    }
  }

  /**
   * Check if configuration file exists
   */
  configExists(): boolean {
    try {
      return existsSync(this.configPath) || existsSync(this.fallbackConfigPath)
    } catch {
      return false
    }
  }

  /**
   * Get the path to the configuration file
   */
  getConfigPath(): string {
    if (existsSync(this.configPath)) {
      return this.configPath
    }
    if (existsSync(this.fallbackConfigPath)) {
      return this.fallbackConfigPath
    }
    return this.configPath // Return primary path as default
  }

  /**
   * Validate configuration data format
   */
  async validateConfig(config: StoredConfigType): Promise<boolean> {
    if (!config || typeof config !== 'object') {
      return false
    }

    // Check required fields
    if (
      !config.token ||
      typeof config.token !== 'string' ||
      config.token.trim() === ''
    ) {
      return false
    }

    if (
      !config.owner ||
      typeof config.owner !== 'string' ||
      config.owner.trim() === ''
    ) {
      return false
    }

    // For validation, we need to decrypt the token first if it's encrypted
    const actualToken = CryptoUtils.decryptToken(config.token)

    // Validate token format (GitHub personal access tokens start with 'ghp_', 'gho_', 'ghu_', or 'ghs_')
    const tokenPattern = /^(ghp_|gho_|ghu_|ghs_)[a-zA-Z0-9]{36}$/
    if (!tokenPattern.test(actualToken)) {
      return false
    }

    return true
  }

  /**
   * Validate credentials against GitHub API
   */
  async validateCredentials(
    config: StoredConfigType,
  ): Promise<{ isValid: boolean; error?: ConfigError }> {
    try {
      // Import Octokit dynamically to avoid circular dependencies
      const { Octokit } = await import('@octokit/core')

      // Decrypt token for API validation
      const decryptedToken = CryptoUtils.decryptToken(config.token)

      const octokit = new Octokit({
        auth: decryptedToken,
      })

      // Test the token by making a simple API call
      const response = await octokit.request('GET /user')

      // Check if the authenticated user matches the stored owner
      if (response.data.login.toLowerCase() !== config.owner.toLowerCase()) {
        return {
          isValid: false,
          error: new ConfigError(
            ConfigErrorType.INVALID_FORMAT,
            `Token belongs to user '${response.data.login}' but configuration is for '${config.owner}'`,
          ),
        }
      }

      return { isValid: true }
    } catch (error: unknown) {
      // Handle different types of API errors
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiError = error as any // Type assertion for API error handling

      if (apiError.status === 401) {
        return {
          isValid: false,
          error: new ConfigError(
            ConfigErrorType.INVALID_FORMAT,
            'GitHub token is invalid or has expired',
          ),
        }
      }

      if (apiError.status === 403) {
        return {
          isValid: false,
          error: new ConfigError(
            ConfigErrorType.INVALID_FORMAT,
            'GitHub token has insufficient permissions or rate limit exceeded',
          ),
        }
      }

      if (
        apiError.code === 'ENOTFOUND' ||
        apiError.code === 'ECONNREFUSED' ||
        apiError.code === 'ETIMEDOUT'
      ) {
        return {
          isValid: false,
          error: new ConfigError(
            ConfigErrorType.NETWORK_ERROR,
            'Unable to connect to GitHub API. Please check your internet connection.',
          ),
        }
      }

      return {
        isValid: false,
        error: new ConfigError(
          ConfigErrorType.UNKNOWN_ERROR,
          `Failed to validate credentials: ${apiError.message || 'Unknown error'}`,
        ),
      }
    }
  }

  /**
   * Migrate existing plain text configuration to encrypted format
   */
  async migrateToEncrypted(): Promise<void> {
    const config = await this.loadConfig()

    if (!config) {
      return // No config to migrate
    }

    // Check if token is already encrypted
    if (CryptoUtils.isTokenEncrypted(config.token)) {
      return // Already encrypted
    }

    console.log('🔒 Migrating configuration to encrypted format...')

    try {
      // Save the config again, which will encrypt the token
      await this.saveConfig(config)
      console.log('✓ Configuration successfully encrypted')
    } catch (error) {
      console.warn(
        '⚠️  Failed to encrypt existing configuration:',
        error instanceof Error ? error.message : 'Unknown error',
      )
    }
  }

  /**
   * Load and validate configuration with credential validation
   */
  async loadValidatedConfig(): Promise<{
    config: StoredConfigType | null
    shouldPromptForCredentials: boolean
    preservedData?: Partial<StoredConfigType>
  }> {
    const config = await this.loadConfig()

    if (!config) {
      return { config: null, shouldPromptForCredentials: true }
    }

    // Validate credentials against GitHub API
    const validation = await this.validateCredentials(config)

    if (validation.isValid) {
      return { config, shouldPromptForCredentials: false }
    }

    // Credentials are invalid, determine what to preserve
    const preservedData: Partial<StoredConfigType> = {}

    if (validation.error) {
      console.warn(`⚠️  ${ConfigManager.getErrorMessage(validation.error)}`)

      // If it's just a token issue but owner might be valid, preserve the owner
      if (
        validation.error.type === ConfigErrorType.INVALID_FORMAT &&
        !validation.error.message.includes('Token belongs to user')
      ) {
        preservedData.owner = config.owner
        console.warn(
          `   Your GitHub username '${config.owner}' will be preserved.`,
        )
      }
    }

    return {
      config: null,
      shouldPromptForCredentials: true,
      preservedData:
        Object.keys(preservedData).length > 0 ? preservedData : undefined,
    }
  }

  /**
   * Clear configuration file
   */
  async clearConfig(): Promise<void> {
    const errors: string[] = []

    // Try to remove primary config file
    if (await this.fileExists(this.configPath)) {
      try {
        await fs.unlink(this.configPath)
      } catch (error) {
        const nodeError = error as NodeJS.ErrnoException
        if (nodeError.code === 'EACCES' || nodeError.code === 'EPERM') {
          errors.push(
            `Permission denied removing primary config file: ${this.configPath}`,
          )
        } else {
          errors.push(
            `Failed to remove primary config file: ${nodeError.message}`,
          )
        }
      }
    }

    // Try to remove fallback config file
    if (await this.fileExists(this.fallbackConfigPath)) {
      try {
        await fs.unlink(this.fallbackConfigPath)
      } catch (error) {
        const nodeError = error as NodeJS.ErrnoException
        if (nodeError.code === 'EACCES' || nodeError.code === 'EPERM') {
          errors.push(
            `Permission denied removing fallback config file: ${this.fallbackConfigPath}`,
          )
        } else {
          errors.push(
            `Failed to remove fallback config file: ${nodeError.message}`,
          )
        }
      }
    }

    if (errors.length > 0) {
      throw new ConfigError(
        ConfigErrorType.PERMISSION_DENIED,
        `Failed to clear configuration: ${errors.join('; ')}`,
      )
    }
  }

  /**
   * Ensure configuration directory exists with proper permissions
   */
  private async ensureConfigDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.configDir, { recursive: true, mode: 0o700 })
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException

      if (nodeError.code === 'EEXIST') {
        // Directory already exists, that's fine
        return
      }

      if (nodeError.code === 'EACCES' || nodeError.code === 'EPERM') {
        throw new ConfigError(
          ConfigErrorType.PERMISSION_DENIED,
          `Permission denied creating configuration directory: ${this.configDir}`,
          nodeError,
        )
      }

      if (nodeError.code === 'ENOSPC') {
        throw new ConfigError(
          ConfigErrorType.UNKNOWN_ERROR,
          'Insufficient disk space to create configuration directory',
          nodeError,
        )
      }

      throw new ConfigError(
        ConfigErrorType.UNKNOWN_ERROR,
        `Failed to create configuration directory: ${nodeError.message}`,
        nodeError,
      )
    }
  }

  /**
   * Check if file exists
   */
  private async fileExists(path: string): Promise<boolean> {
    try {
      await fs.access(path)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get user-friendly error message for configuration problems
   */
  static getErrorMessage(error: ConfigError): string {
    switch (error.type) {
      case ConfigErrorType.FILE_NOT_FOUND:
        return 'Configuration file not found. You will be prompted to enter your credentials.'

      case ConfigErrorType.PERMISSION_DENIED:
        return 'Permission denied accessing configuration file. Please check file permissions or run with appropriate privileges.'

      case ConfigErrorType.CORRUPTED_FILE:
        return 'Configuration file is corrupted or contains invalid data. A backup has been created and you will be prompted for new credentials.'

      case ConfigErrorType.INVALID_FORMAT:
        return 'Configuration file has invalid format. You will be prompted to enter your credentials again.'

      case ConfigErrorType.NETWORK_ERROR:
        return 'Network error occurred while validating credentials. Please check your internet connection.'

      case ConfigErrorType.UNKNOWN_ERROR:
      default:
        return `An unexpected error occurred: ${error.message}`
    }
  }

  /**
   * Check if an error is recoverable (user can continue with prompts)
   */
  static isRecoverableError(error: ConfigError): boolean {
    return [
      ConfigErrorType.FILE_NOT_FOUND,
      ConfigErrorType.CORRUPTED_FILE,
      ConfigErrorType.INVALID_FORMAT,
    ].includes(error.type)
  }
}
