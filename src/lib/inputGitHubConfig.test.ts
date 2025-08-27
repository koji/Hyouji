import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getGitHubConfigs } from './inputGitHubConfig.js';

// Mock dependencies
vi.mock('prompts');
vi.mock('./configManager.js');
vi.mock('./gitRepositoryDetector.js');
vi.mock('@octokit/core');

describe('getGitHubConfigs auto-detection integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use auto-detected repository when detection succeeds', async () => {
    const { ConfigManager } = await import('./configManager.js');
    const { GitRepositoryDetector } = await import('./gitRepositoryDetector.js');
    const { Octokit } = await import('@octokit/core');

    // Mock valid saved config
    const mockLoadValidatedConfig = vi.fn().mockResolvedValue({
      config: {
        token: 'test-token',
        owner: 'saved-owner',
        lastUpdated: '2024-01-01T00:00:00.000Z'
      },
      shouldPromptForCredentials: false
    });

    (ConfigManager as any).mockImplementation(() => ({
      loadValidatedConfig: mockLoadValidatedConfig
    }));

    // Mock successful auto-detection
    const mockDetectRepository = vi.fn().mockResolvedValue({
      isGitRepository: true,
      repositoryInfo: {
        owner: 'detected-owner',
        repo: 'detected-repo',
        remoteUrl: 'git@github.com:detected-owner/detected-repo.git',
        detectionMethod: 'origin'
      }
    });

    (GitRepositoryDetector.detectRepository as any) = mockDetectRepository;

    // Mock Octokit
    const mockOctokit = { auth: 'test-token' };
    (Octokit as any).mockImplementation(() => mockOctokit);

    const result = await getGitHubConfigs();

    expect(result).toEqual({
      octokit: mockOctokit,
      owner: 'detected-owner',
      repo: 'detected-repo',
      fromSavedConfig: true,
      autoDetected: true,
      detectionMethod: 'origin'
    });

    expect(mockDetectRepository).toHaveBeenCalledOnce();
  });

  it('should fallback to manual input when auto-detection fails', async () => {
    const prompts = (await import('prompts')).default;
    const { ConfigManager } = await import('./configManager.js');
    const { GitRepositoryDetector } = await import('./gitRepositoryDetector.js');
    const { Octokit } = await import('@octokit/core');

    // Mock valid saved config
    const mockLoadValidatedConfig = vi.fn().mockResolvedValue({
      config: {
        token: 'test-token',
        owner: 'saved-owner',
        lastUpdated: '2024-01-01T00:00:00.000Z'
      },
      shouldPromptForCredentials: false
    });

    (ConfigManager as any).mockImplementation(() => ({
      loadValidatedConfig: mockLoadValidatedConfig
    }));

    // Mock failed auto-detection
    const mockDetectRepository = vi.fn().mockResolvedValue({
      isGitRepository: false,
      error: 'Not a Git repository'
    });

    (GitRepositoryDetector.detectRepository as any) = mockDetectRepository;

    // Mock manual input
    (prompts as any).mockResolvedValue({
      repo: 'manual-repo'
    });

    // Mock Octokit
    const mockOctokit = { auth: 'test-token' };
    (Octokit as any).mockImplementation(() => mockOctokit);

    const result = await getGitHubConfigs();

    expect(result).toEqual({
      octokit: mockOctokit,
      owner: 'saved-owner',
      repo: 'manual-repo',
      fromSavedConfig: true,
      autoDetected: false,
      detectionMethod: 'manual'
    });

    expect(mockDetectRepository).toHaveBeenCalledOnce();
    expect(prompts).toHaveBeenCalledWith([{
      type: 'text',
      name: 'repo',
      message: 'Please type your target repo name'
    }]);
  });

  it('should handle auto-detection errors gracefully', async () => {
    const prompts = (await import('prompts')).default;
    const { ConfigManager } = await import('./configManager.js');
    const { GitRepositoryDetector } = await import('./gitRepositoryDetector.js');
    const { Octokit } = await import('@octokit/core');

    // Mock valid saved config
    const mockLoadValidatedConfig = vi.fn().mockResolvedValue({
      config: {
        token: 'test-token',
        owner: 'saved-owner',
        lastUpdated: '2024-01-01T00:00:00.000Z'
      },
      shouldPromptForCredentials: false
    });

    (ConfigManager as any).mockImplementation(() => ({
      loadValidatedConfig: mockLoadValidatedConfig
    }));

    // Mock auto-detection throwing an error
    const mockDetectRepository = vi.fn().mockRejectedValue(new Error('Git command failed'));

    (GitRepositoryDetector.detectRepository as any) = mockDetectRepository;

    // Mock manual input
    (prompts as any).mockResolvedValue({
      repo: 'manual-repo'
    });

    // Mock Octokit
    const mockOctokit = { auth: 'test-token' };
    (Octokit as any).mockImplementation(() => mockOctokit);

    const result = await getGitHubConfigs();

    expect(result).toEqual({
      octokit: mockOctokit,
      owner: 'saved-owner',
      repo: 'manual-repo',
      fromSavedConfig: true,
      autoDetected: false,
      detectionMethod: 'manual'
    });

    expect(mockDetectRepository).toHaveBeenCalledOnce();
    expect(prompts).toHaveBeenCalledWith([{
      type: 'text',
      name: 'repo',
      message: 'Please type your target repo name'
    }]);
  });
});