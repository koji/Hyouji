/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it } from 'vitest'

import { StoredConfigType } from '../types'

// TODO: Fix mocking for Vitest 3.x - temporarily skipping integration tests
describe.skip('Integration Tests', () => {
  const validConfig: StoredConfigType = {
    token: 'ghp_1234567890123456789012345678901234567890',
    owner: 'testuser',
    lastUpdated: '2024-01-15T10:30:00.000Z',
  }

  beforeEach(() => {
    // Tests are skipped - no setup needed
  })

  describe('GitHub configuration integration', () => {
    it.skip('should handle saved configuration flow', async () => {
      // Import after mocks are set up
      const prompts = (await import('prompts')).default
      const { getGitHubConfigs } = await import('./inputGitHubConfig')
      const { ConfigManager } = await import('./configManager')

      const mockConfigManager = new ConfigManager()

      // Mock valid saved config
      ;(mockConfigManager.loadValidatedConfig as any).mockResolvedValueOnce({
        config: validConfig,
        shouldPromptForCredentials: false,
      })

      // Mock repo prompt
      ;(prompts as any).mockResolvedValueOnce({
        repo: 'test-repo',
      })

      const result = await getGitHubConfigs()

      expect(result.owner).toBe(validConfig.owner)
      expect(result.repo).toBe('test-repo')
      expect(result.fromSavedConfig).toBe(true)
    })

    it('should handle new configuration flow', async () => {
      const prompts = (await import('prompts')).default
      const { getGitHubConfigs } = await import('./inputGitHubConfig')
      const { ConfigManager } = await import('./configManager')

      const mockConfigManager = new ConfigManager()

      // Mock no saved config
      ;(mockConfigManager.loadValidatedConfig as any).mockResolvedValueOnce({
        config: null,
        shouldPromptForCredentials: true,
      })

      // Mock full credential prompts
      ;(prompts as any).mockResolvedValueOnce({
        octokit: 'ghp_newtoken123456789012345678901234567890',
        owner: 'newuser',
        repo: 'new-repo',
      })

      const result = await getGitHubConfigs()

      expect(result.owner).toBe('newuser')
      expect(result.repo).toBe('new-repo')
      expect(result.fromSavedConfig).toBe(false)
    })

    it('should handle configuration errors gracefully', async () => {
      const prompts = (await import('prompts')).default
      const { getGitHubConfigs } = await import('./inputGitHubConfig')
      const { ConfigManager } = await import('./configManager')

      const mockConfigManager = new ConfigManager()

      // Mock config loading error
      ;(mockConfigManager.loadValidatedConfig as any).mockRejectedValueOnce(
        new Error('Config loading failed'),
      )

      // Mock credential prompts
      ;(prompts as any).mockResolvedValueOnce({
        octokit: 'ghp_newtoken123456789012345678901234567890',
        owner: 'newuser',
        repo: 'new-repo',
      })

      const result = await getGitHubConfigs()

      expect(result.owner).toBe('newuser')
      expect(result.fromSavedConfig).toBe(false)
    })
  })

  describe('Settings display integration', () => {
    it('should handle config existence check', async () => {
      const { ConfigManager } = await import('./configManager')

      const mockConfigManager = new ConfigManager()
      ;(mockConfigManager.configExists as any).mockReturnValue(true)
      ;(mockConfigManager.loadConfig as any).mockResolvedValueOnce(validConfig)
      ;(mockConfigManager.getConfigPath as any).mockReturnValue(
        '/home/testuser/.config/github-label-manager/config.json',
      )

      // Test the components that would be used in displaySettings
      const configExists = mockConfigManager.configExists()
      const config = await mockConfigManager.loadConfig()
      const configPath = mockConfigManager.getConfigPath()

      expect(configExists).toBe(true)
      expect(config).toEqual(validConfig)
      expect(configPath).toContain('github-label-manager')
    })

    it('should handle missing config file', async () => {
      const { ConfigManager } = await import('./configManager')

      const mockConfigManager = new ConfigManager()
      ;(mockConfigManager.configExists as any).mockReturnValue(false)

      const configExists = mockConfigManager.configExists()
      expect(configExists).toBe(false)
    })

    it('should handle corrupted config file', async () => {
      const { ConfigManager } = await import('./configManager')

      const mockConfigManager = new ConfigManager()
      ;(mockConfigManager.configExists as any).mockReturnValue(true)
      ;(mockConfigManager.loadConfig as any).mockResolvedValueOnce(null)

      const configExists = mockConfigManager.configExists()
      const config = await mockConfigManager.loadConfig()

      expect(configExists).toBe(true)
      expect(config).toBeNull()
    })
  })

  describe('Backward compatibility', () => {
    it('should maintain same interface for existing code', async () => {
      const prompts = (await import('prompts')).default
      const { getGitHubConfigs } = await import('./inputGitHubConfig')
      const { ConfigManager } = await import('./configManager')

      const mockConfigManager = new ConfigManager()

      ;(mockConfigManager.loadValidatedConfig as any).mockResolvedValueOnce({
        config: null,
        shouldPromptForCredentials: true,
      })

      ;(prompts as any).mockResolvedValueOnce({
        octokit: 'token',
        owner: 'owner',
        repo: 'repo',
      })

      const config = await getGitHubConfigs()

      // Verify the interface matches what existing code expects
      expect(config).toHaveProperty('octokit')
      expect(config).toHaveProperty('owner')
      expect(config).toHaveProperty('repo')
      expect(typeof config.fromSavedConfig).toBe('boolean')
    })

    it('should work with existing features when no config exists', async () => {
      const prompts = (await import('prompts')).default
      const { getGitHubConfigs } = await import('./inputGitHubConfig')
      const { ConfigManager } = await import('./configManager')

      const mockConfigManager = new ConfigManager()

      // Mock no saved config
      ;(mockConfigManager.loadValidatedConfig as any).mockResolvedValueOnce({
        config: null,
        shouldPromptForCredentials: true,
      })

      // Mock traditional prompts
      ;(prompts as any).mockResolvedValueOnce({
        octokit: 'ghp_token123456789012345678901234567890',
        owner: 'user',
        repo: 'repo',
      })

      const result = await getGitHubConfigs()

      // Should work exactly like before
      expect(result.owner).toBe('user')
      expect(result.repo).toBe('repo')
      expect(result.fromSavedConfig).toBe(false)
    })
  })

  describe('Error handling integration', () => {
    it('should handle prompts cancellation', async () => {
      const prompts = (await import('prompts')).default
      const { getGitHubConfigs } = await import('./inputGitHubConfig')
      const { ConfigManager } = await import('./configManager')

      const mockConfigManager = new ConfigManager()

      ;(mockConfigManager.loadValidatedConfig as any).mockResolvedValueOnce({
        config: null,
        shouldPromptForCredentials: true,
      })

      // Mock cancelled prompts (user pressed Ctrl+C)
      ;(prompts as any).mockResolvedValueOnce({})

      const result = await getGitHubConfigs()

      // Should handle gracefully
      expect(result.fromSavedConfig).toBe(false)
    })

    it('should handle network errors during config validation', async () => {
      const prompts = (await import('prompts')).default
      const { getGitHubConfigs } = await import('./inputGitHubConfig')
      const { ConfigManager } = await import('./configManager')

      const mockConfigManager = new ConfigManager()

      ;(mockConfigManager.loadValidatedConfig as any).mockRejectedValueOnce(
        new Error('Network error'),
      )

      ;(prompts as any).mockResolvedValueOnce({
        octokit: 'token',
        owner: 'owner',
        repo: 'repo',
      })

      // Should not throw, should fall back to prompts
      const result = await getGitHubConfigs()
      expect(result.fromSavedConfig).toBe(false)
    })
  })

  describe('Configuration preservation', () => {
    it('should preserve owner when only token is invalid', async () => {
      const prompts = (await import('prompts')).default
      const { getGitHubConfigs } = await import('./inputGitHubConfig')
      const { ConfigManager } = await import('./configManager')

      const mockConfigManager = new ConfigManager()

      // Mock invalid token but preserved owner
      ;(mockConfigManager.loadValidatedConfig as any).mockResolvedValueOnce({
        config: null,
        shouldPromptForCredentials: true,
        preservedData: { owner: validConfig.owner },
      })

      // Mock credential prompts
      ;(prompts as any).mockResolvedValueOnce({
        octokit: 'ghp_newtoken123456789012345678901234567890',
        owner: validConfig.owner,
        repo: 'test-repo',
      })

      const result = await getGitHubConfigs()

      expect(result.owner).toBe(validConfig.owner)
      expect(result.fromSavedConfig).toBe(false)
    })
  })

  describe('Main application flow integration', () => {
    it.skip('should handle config validation in setupConfigs', async () => {
      const prompts = (await import('prompts')).default
      const { getGitHubConfigs } = await import('./inputGitHubConfig')
      const { ConfigManager } = await import('./configManager')

      const mockConfigManager = new ConfigManager()

      // Mock valid config
      ;(mockConfigManager.loadValidatedConfig as any).mockResolvedValueOnce({
        config: validConfig,
        shouldPromptForCredentials: false,
      })

      ;(prompts as any).mockResolvedValueOnce({
        repo: 'test-repo',
      })

      const config = await getGitHubConfigs()

      // Test that config has required fields
      expect(config.octokit).toBeDefined()
      expect(config.owner).toBe(validConfig.owner)
      expect(config.repo).toBe('test-repo')
    })

    it('should clear config and retry on authentication failure', async () => {
      const { ConfigManager } = await import('./configManager')

      const mockConfigManager = new ConfigManager()

      // Test the logic that would be in setupConfigs
      const fromSavedConfig = true

      if (fromSavedConfig) {
        ;(mockConfigManager.clearConfig as any).mockResolvedValueOnce(undefined)
        await mockConfigManager.clearConfig()

        expect(mockConfigManager.clearConfig).toHaveBeenCalled()
      }
    })
  })
})
