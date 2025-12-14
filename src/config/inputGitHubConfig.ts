import { Octokit } from '@octokit/core'
import chalk from 'chalk'
import prompts from 'prompts'

import { githubConfigs } from '../constant.js'
import { ConfigType, StoredConfigType } from '../types/index.js'

import { ConfigError, ConfigManager } from './configManager.js'
import { GitRepositoryDetector } from '../github/gitRepositoryDetector.js'

// Type for validation result from ConfigManager
type ValidationResult = {
  config: StoredConfigType | null;
  shouldPromptForCredentials: boolean;
  preservedData?: Partial<StoredConfigType>;
}

export const getGitHubConfigs = async (): Promise<ConfigType> => {
  const configManager = new ConfigManager()

  // Try to load and validate existing configuration
  let validationResult: ValidationResult = {
    config: null,
    shouldPromptForCredentials: true,
    preservedData: undefined,
  }
  try {
    const result = await configManager.loadValidatedConfig()
    if (result) {
      validationResult = result
    }
  } catch {
    // Configuration loading errors are already handled and logged in ConfigManager
    // We just continue with prompting for new credentials
    validationResult = {
      config: null,
      shouldPromptForCredentials: true,
      preservedData: undefined,
    }
  }

  if (validationResult.config && !validationResult.shouldPromptForCredentials) {
    // We have valid saved config, try auto-detection first
    try {
      const detectionResult = await GitRepositoryDetector.detectRepository()

      if (detectionResult.isGitRepository && detectionResult.repositoryInfo) {
        // Auto-detection successful - provide user feedback
        console.log(
          chalk.green(
            `✓ Detected repository: ${detectionResult.repositoryInfo.owner}/${detectionResult.repositoryInfo.repo}`,
          ),
        )
        console.log(
          chalk.gray(
            `  Detection method: ${detectionResult.repositoryInfo.detectionMethod === 'origin' ? 'origin remote' : 'first available remote'}`,
          ),
        )

        const octokit = new Octokit({
          auth: validationResult.config.token,
        })

        return {
          octokit,
          owner: detectionResult.repositoryInfo.owner,
          repo: detectionResult.repositoryInfo.repo,
          fromSavedConfig: true,
          autoDetected: true,
          detectionMethod: detectionResult.repositoryInfo.detectionMethod,
        }
      } else {
        // Auto-detection failed, provide feedback and fallback to manual input
        if (detectionResult.error) {
          console.log(
            chalk.yellow(
              `⚠️  Repository auto-detection failed: ${detectionResult.error}`,
            ),
          )
        }
        console.log(chalk.gray('  Falling back to manual input...'))
      }
    } catch (error) {
      // Handle unexpected errors gracefully
      console.log(
        chalk.yellow(
          '⚠️  Repository auto-detection failed, falling back to manual input',
        ),
      )
      if (error instanceof Error) {
        console.log(chalk.gray(`  Error: ${error.message}`))
      }
    }

    // Fallback to manual input when auto-detection fails
    const repoResponse = await prompts([
      {
        type: 'text',
        name: 'repo',
        message: 'Please type your target repo name',
      },
    ])

    const octokit = new Octokit({
      auth: validationResult.config.token,
    })

    return {
      octokit,
      owner: validationResult.config.owner,
      repo: repoResponse.repo,
      fromSavedConfig: true,
      autoDetected: false,
      detectionMethod: 'manual',
    }
  }

  // No saved config or invalid config, prompt for credentials
  const promptConfig = [...githubConfigs]

  // If we have preserved data (like a valid owner), pre-fill it
  if (validationResult.preservedData?.owner) {
    const ownerPromptIndex = promptConfig.findIndex(
      (prompt) => prompt.name === 'owner',
    )
    if (ownerPromptIndex !== -1) {
      promptConfig[ownerPromptIndex] = {
        ...promptConfig[ownerPromptIndex],
        initial: validationResult.preservedData.owner,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as prompts.PromptObject<'text'>
    }
  }

  const response = await prompts(promptConfig)

  // Save the new configuration for future use
  if (response.octokit && response.owner) {
    try {
      await configManager.saveConfig({
        token: response.octokit,
        owner: response.owner,
        lastUpdated: new Date().toISOString(),
      })

      if (
        validationResult.preservedData?.owner &&
        validationResult.preservedData.owner !== response.owner
      ) {
        console.log('✓ Configuration updated with new credentials')
      } else {
        console.log('✓ Configuration saved successfully')
      }
    } catch (error) {
      if (error instanceof ConfigError) {
        console.error(`❌ ${ConfigManager.getErrorMessage(error)}`)

        if (!ConfigManager.isRecoverableError(error)) {
          console.error(
            '   This may affect future sessions. Please resolve the issue or contact support.',
          )
        }
      } else {
        console.warn(
          '⚠️  Failed to save configuration:',
          error instanceof Error ? error.message : 'Unknown error',
        )
      }
    }
  }

  // Create Octokit instance and return config
  const octokit = new Octokit({
    auth: response.octokit,
  })

  return {
    octokit,
    owner: response.owner,
    repo: response.repo,
    fromSavedConfig: false,
    autoDetected: false,
    detectionMethod: 'manual',
  }
}
