import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getGitHubConfigs } from './inputGitHubConfig.js';

// Mock dependencies
vi.mock('prompts');
vi.mock('./configManager.js');
vi.mock('./gitRepositoryDetector.js');
vi.mock('@octokit/core');
vi.mock('../constant.js', () => ({
  githubConfigs: [
    {
      type: 'password',
      name: 'octokit',
      message: 'Please type your personal token',
    },
    {
      type: 'text',
      name: 'owner',
      message: 'Please type your GitHub account',
    },
    {
      type: 'text',
      name: 'repo',
      message: 'Please type your target repo name',
    },
  ],
}));

describe('getGitHubConfigs auto-detection integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use auto-detected repository when detection succeeds', async () => {
    const { ConfigManager } = await import('./configManager.js');
    const { GitRepositoryDetector } = await import(
      './gitRepositoryDetector.js'
    );
    const { Octokit } = await import('@octokit/core');

    // Mock valid saved config
    const mockLoadValidatedConfig = vi.fn().mockResolvedValue({
      config: {
        token: 'test-token',
        owner: 'saved-owner',
        lastUpdated: '2024-01-01T00:00:00.000Z',
      },
      shouldPromptForCredentials: false,
    });

    vi.mocked(ConfigManager).mockImplementation(
      () =>
        ({
          loadValidatedConfig: mockLoadValidatedConfig,
        }) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    );

    // Mock successful auto-detection
    const mockDetectRepository = vi.fn().mockResolvedValue({
      isGitRepository: true,
      repositoryInfo: {
        owner: 'detected-owner',
        repo: 'detected-repo',
        remoteUrl: 'git@github.com:detected-owner/detected-repo.git',
        detectionMethod: 'origin',
      },
    });

    vi.mocked(GitRepositoryDetector).detectRepository = mockDetectRepository;

    // Mock Octokit
    const mockOctokit = { auth: 'test-token' } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    vi.mocked(Octokit).mockImplementation(() => mockOctokit);

    const result = await getGitHubConfigs();

    expect(result).toEqual({
      octokit: mockOctokit,
      owner: 'detected-owner',
      repo: 'detected-repo',
      fromSavedConfig: true,
      autoDetected: true,
      detectionMethod: 'origin',
    });

    expect(mockDetectRepository).toHaveBeenCalledOnce();
  });

  it('should fallback to manual input when auto-detection fails', async () => {
    const prompts = (await import('prompts')).default;
    const { ConfigManager } = await import('./configManager.js');
    const { GitRepositoryDetector } = await import(
      './gitRepositoryDetector.js'
    );
    const { Octokit } = await import('@octokit/core');

    // Mock valid saved config
    const mockLoadValidatedConfig = vi.fn().mockResolvedValue({
      config: {
        token: 'test-token',
        owner: 'saved-owner',
        lastUpdated: '2024-01-01T00:00:00.000Z',
      },
      shouldPromptForCredentials: false,
    });

    vi.mocked(ConfigManager).mockImplementation(
      () =>
        ({
          loadValidatedConfig: mockLoadValidatedConfig,
        }) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    );

    // Mock failed auto-detection
    const mockDetectRepository = vi.fn().mockResolvedValue({
      isGitRepository: false,
      error: 'Not a Git repository',
    });

    vi.mocked(GitRepositoryDetector).detectRepository = mockDetectRepository;

    // Mock manual input
    vi.mocked(prompts).mockResolvedValue({
      repo: 'manual-repo',
    });

    // Mock Octokit
    const mockOctokit = { auth: 'test-token' } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    vi.mocked(Octokit).mockImplementation(() => mockOctokit);

    const result = await getGitHubConfigs();

    expect(result).toEqual({
      octokit: mockOctokit,
      owner: 'saved-owner',
      repo: 'manual-repo',
      fromSavedConfig: true,
      autoDetected: false,
      detectionMethod: 'manual',
    });

    expect(mockDetectRepository).toHaveBeenCalledOnce();
    expect(prompts).toHaveBeenCalledWith([
      {
        type: 'text',
        name: 'repo',
        message: 'Please type your target repo name',
      },
    ]);
  });

  it('should handle auto-detection errors gracefully', async () => {
    const prompts = (await import('prompts')).default;
    const { ConfigManager } = await import('./configManager.js');
    const { GitRepositoryDetector } = await import(
      './gitRepositoryDetector.js'
    );
    const { Octokit } = await import('@octokit/core');

    // Mock valid saved config
    const mockLoadValidatedConfig = vi.fn().mockResolvedValue({
      config: {
        token: 'test-token',
        owner: 'saved-owner',
        lastUpdated: '2024-01-01T00:00:00.000Z',
      },
      shouldPromptForCredentials: false,
    });

    vi.mocked(ConfigManager).mockImplementation(
      () =>
        ({
          loadValidatedConfig: mockLoadValidatedConfig,
        }) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    );

    // Mock auto-detection throwing an error
    const mockDetectRepository = vi
      .fn()
      .mockRejectedValue(new Error('Git command failed'));

    vi.mocked(GitRepositoryDetector).detectRepository = mockDetectRepository;

    // Mock manual input
    vi.mocked(prompts).mockResolvedValue({
      repo: 'manual-repo',
    });

    // Mock Octokit
    const mockOctokit = { auth: 'test-token' } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    vi.mocked(Octokit).mockImplementation(() => mockOctokit);

    const result = await getGitHubConfigs();

    expect(result).toEqual({
      octokit: mockOctokit,
      owner: 'saved-owner',
      repo: 'manual-repo',
      fromSavedConfig: true,
      autoDetected: false,
      detectionMethod: 'manual',
    });

    expect(mockDetectRepository).toHaveBeenCalledOnce();
    expect(prompts).toHaveBeenCalledWith([
      {
        type: 'text',
        name: 'repo',
        message: 'Please type your target repo name',
      },
    ]);
  });
});
