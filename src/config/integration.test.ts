import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GitRepositoryDetector } from '../github/gitRepositoryDetector.js'
import { StoredConfigType } from '../types'
import { ConfigManager } from './configManager.js'
import { getGitHubConfigs } from './inputGitHubConfig.js'

// Mock dependencies
vi.mock('../cli/promptClient.js', () => ({
  askText: vi.fn(),
  askPassword: vi.fn(),
}))
vi.mock('./configManager.js')
vi.mock('../github/gitRepositoryDetector.js')

describe('Integration Tests', () => {
  const validConfig: StoredConfigType = {
    token: 'ghp_1234567890123456789012345678901234567890',
    owner: 'testuser',
    lastUpdated: '2024-01-15T10:30:00.000Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GitHub configuration integration', () => {
    it('should handle saved configuration flow', async () => {
      const { askText } = await import('../cli/promptClient.js')

      vi.spyOn(
        ConfigManager.prototype,
        'loadValidatedConfig',
      ).mockResolvedValue({
        config: validConfig,
        shouldPromptForCredentials: false,
      })

      // Mock failed auto-detection to fall back to manual repo input
      vi.mocked(GitRepositoryDetector.detectRepository).mockResolvedValue({
        isGitRepository: false,
        error: 'Mocked detection failure',
      })

      vi.mocked(askText).mockResolvedValueOnce('test-repo')

      const result = await getGitHubConfigs()

      expect(result.owner).toBe(validConfig.owner)
      expect(result.repo).toBe('test-repo')
      expect(result.fromSavedConfig).toBe(true)
    })

    it('should handle new configuration flow', async () => {
      const { askText, askPassword } = await import('../cli/promptClient.js')

      vi.spyOn(
        ConfigManager.prototype,
        'loadValidatedConfig',
      ).mockResolvedValue({
        config: null,
        shouldPromptForCredentials: true,
      })

      vi.mocked(askPassword).mockResolvedValueOnce(
        'ghp_newtoken123456789012345678901234567890',
      )
      vi.mocked(askText)
        .mockResolvedValueOnce('newuser')
        .mockResolvedValueOnce('new-repo')

      const result = await getGitHubConfigs()

      expect(result.owner).toBe('newuser')
      expect(result.repo).toBe('new-repo')
      expect(result.fromSavedConfig).toBe(false)
    })

    it('should handle configuration errors gracefully', async () => {
      const { askText, askPassword } = await import('../cli/promptClient.js')

      vi.spyOn(
        ConfigManager.prototype,
        'loadValidatedConfig',
      ).mockRejectedValue(new Error('Config loading failed'))

      vi.mocked(askPassword).mockResolvedValueOnce(
        'ghp_newtoken123456789012345678901234567890',
      )
      vi.mocked(askText)
        .mockResolvedValueOnce('newuser')
        .mockResolvedValueOnce('new-repo')

      const result = await getGitHubConfigs()

      expect(result.owner).toBe('newuser')
      expect(result.fromSavedConfig).toBe(false)
    })
  })
})
