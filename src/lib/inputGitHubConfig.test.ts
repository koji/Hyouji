import { beforeEach, describe, expect, it, vi } from "vitest";

import { getGitHubConfigs } from "./inputGitHubConfig.js";

// Mock dependencies
vi.mock("prompts", () => ({
  default: vi.fn(),
}));
vi.mock("./configManager.js");
vi.mock("./gitRepositoryDetector.js");
vi.mock("@octokit/core");
vi.mock("../constant.js", () => ({
  githubConfigs: [
    {
      type: "password",
      name: "octokit",
      message: "Please type your personal token",
    },
    {
      type: "text",
      name: "owner",
      message: "Please type your GitHub account",
    },
    {
      type: "text",
      name: "repo",
      message: "Please type your target repo name",
    },
  ],
}));

describe("getGitHubConfigs auto-detection integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should use auto-detected repository when detection succeeds", async () => {
    const { ConfigManager } = await import("./configManager.js");
    const { GitRepositoryDetector } = await import(
      "./gitRepositoryDetector.js"
    );
    const { Octokit } = await import("@octokit/core");

    // Mock valid saved config
    vi.spyOn(ConfigManager.prototype, "loadValidatedConfig").mockResolvedValue({
      config: {
        token: "test-token",
        owner: "saved-owner",
        lastUpdated: "2024-01-01T00:00:00.000Z",
      },
      shouldPromptForCredentials: false,
    });
    const mockDetectRepository = vi.fn().mockResolvedValue({
      isGitRepository: true,
      repositoryInfo: {
        owner: "detected-owner",
        repo: "detected-repo",
        remoteUrl: "git@github.com:detected-owner/detected-repo.git",
        detectionMethod: "origin",
      },
    });

    vi.mocked(GitRepositoryDetector).detectRepository = mockDetectRepository;

    // Mock Octokit as a constructor
    const mockRequest = Object.assign(vi.fn(), {
      defaults: vi.fn(),
      endpoint: vi.fn(),
    });
    const mockGraphql = vi.fn();
    class MockOctokit {
      auth: string;
      request = mockRequest;
      graphql = mockGraphql;
      log = {};
      hook = vi.fn();
      constructor(options: { auth: string }) {
        this.auth = options.auth;
      }
    }
    vi.mocked(Octokit).mockImplementation(
      (options?: { auth: string }) => new MockOctokit(options ?? { auth: "" })
    );

    const result = await getGitHubConfigs();

    expect(result.owner).toBe("detected-owner");
    expect(result.repo).toBe("detected-repo");
    expect(result.fromSavedConfig).toBe(true);
    expect(result.autoDetected).toBe(true);
    expect(result.detectionMethod).toBe("origin");
    expect(result.octokit.auth).toBe("test-token");

    expect(mockDetectRepository).toHaveBeenCalledOnce();
  });

  it("should fallback to manual input when auto-detection fails", async () => {
    const prompts = (await import("prompts")).default;
    const { ConfigManager } = await import("./configManager.js");
    const { GitRepositoryDetector } = await import(
      "./gitRepositoryDetector.js"
    );
    const { Octokit } = await import("@octokit/core");

    // Mock valid saved config
    vi.spyOn(ConfigManager.prototype, "loadValidatedConfig").mockResolvedValue({
      config: {
        token: "test-token",
        owner: "saved-owner",
        lastUpdated: "2024-01-01T00:00:00.000Z",
      },
      shouldPromptForCredentials: false,
    });
    const mockDetectRepository = vi.fn().mockResolvedValue({
      isGitRepository: false,
      error: "Not a Git repository",
    });

    vi.mocked(GitRepositoryDetector).detectRepository = mockDetectRepository;

    // Mock manual input
    vi.mocked(prompts).mockResolvedValue({
      repo: "manual-repo",
    });

    // Mock Octokit as a constructor
    const mockRequest = Object.assign(vi.fn(), {
      defaults: vi.fn(),
      endpoint: vi.fn(),
    });
    const mockGraphql = vi.fn();
    class MockOctokit {
      auth: string;
      request = mockRequest;
      graphql = mockGraphql;
      log = {};
      hook = vi.fn();
      constructor(options: { auth: string }) {
        this.auth = options.auth;
      }
    }
    vi.mocked(Octokit).mockImplementation(
      (options?: { auth: string }) => new MockOctokit(options ?? { auth: "" })
    );

    const result = await getGitHubConfigs();

    expect(result.owner).toBe("saved-owner");
    expect(result.repo).toBe("manual-repo");
    expect(result.fromSavedConfig).toBe(true);
    expect(result.autoDetected).toBe(false);
    expect(result.detectionMethod).toBe("manual");
    expect(result.octokit.auth).toBe("test-token");

    expect(mockDetectRepository).toHaveBeenCalledOnce();
    expect(prompts).toHaveBeenCalledWith([
      {
        type: "text",
        name: "repo",
        message: "Please type your target repo name",
      },
    ]);
  });

  it("should handle auto-detection errors gracefully", async () => {
    const prompts = (await import("prompts")).default;
    const { ConfigManager } = await import("./configManager.js");
    const { GitRepositoryDetector } = await import(
      "./gitRepositoryDetector.js"
    );
    const { Octokit } = await import("@octokit/core");

    // Mock valid saved config
    vi.spyOn(ConfigManager.prototype, "loadValidatedConfig").mockResolvedValue({
      config: {
        token: "test-token",
        owner: "saved-owner",
        lastUpdated: "2024-01-01T00:00:00.000Z",
      },
      shouldPromptForCredentials: false,
    });

    // Mock auto-detection throwing an error
    const mockDetectRepository = vi
      .fn()
      .mockRejectedValue(new Error("Git command failed"));

    vi.mocked(GitRepositoryDetector).detectRepository = mockDetectRepository;

    // Mock manual input
    vi.mocked(prompts).mockResolvedValue({
      repo: "manual-repo",
    });

    // Mock Octokit as a constructor
    const mockRequest = Object.assign(vi.fn(), {
      defaults: vi.fn(),
      endpoint: vi.fn(),
    });
    const mockGraphql = vi.fn();
    class MockOctokit {
      auth: string;
      request = mockRequest;
      graphql = mockGraphql;
      log = {};
      hook = vi.fn();
      constructor(options: { auth: string }) {
        this.auth = options.auth;
      }
    }
    vi.mocked(Octokit).mockImplementation(
      (options?: { auth: string }) => new MockOctokit(options ?? { auth: "" })
    );

    const result = await getGitHubConfigs();

    expect(result.owner).toBe("saved-owner");
    expect(result.repo).toBe("manual-repo");
    expect(result.fromSavedConfig).toBe(true);
    expect(result.autoDetected).toBe(false);
    expect(result.detectionMethod).toBe("manual");
    expect(result.octokit.auth).toBe("test-token");

    expect(mockDetectRepository).toHaveBeenCalledOnce();
    expect(prompts).toHaveBeenCalledWith([
      {
        type: "text",
        name: "repo",
        message: "Please type your target repo name",
      },
    ]);
  });
});
