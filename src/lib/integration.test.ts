import { beforeEach, describe, expect, it, vi } from "vitest";
import { getGitHubConfigs } from "./inputGitHubConfig.js";
import { ConfigManager } from "./configManager.js";
import { GitRepositoryDetector } from "./gitRepositoryDetector.js";
import { StoredConfigType } from "../types";

// Mock dependencies
vi.mock("prompts", () => ({
  default: vi.fn(),
}));
vi.mock("./configManager.js");
vi.mock("./gitRepositoryDetector.js");

describe("Integration Tests", () => {
  const validConfig: StoredConfigType = {
    token: "ghp_1234567890123456789012345678901234567890",
    owner: "testuser",
    lastUpdated: "2024-01-15T10:30:00.000Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GitHub configuration integration", () => {
    it("should handle saved configuration flow", async () => {
      const prompts = (await import("prompts")).default;

      vi.spyOn(
        ConfigManager.prototype,
        "loadValidatedConfig"
      ).mockResolvedValue({
        config: validConfig,
        shouldPromptForCredentials: false,
      });

      // Mock failed auto-detection to fall back to manual repo input
      vi.mocked(GitRepositoryDetector.detectRepository).mockResolvedValue({
        isGitRepository: false,
        error: "Mocked detection failure",
      });

      vi.mocked(prompts).mockResolvedValueOnce({
        repo: "test-repo",
      });

      const result = await getGitHubConfigs();

      expect(result.owner).toBe(validConfig.owner);
      expect(result.repo).toBe("test-repo");
      expect(result.fromSavedConfig).toBe(true);
    });

    it("should handle new configuration flow", async () => {
      const prompts = (await import("prompts")).default;

      vi.spyOn(
        ConfigManager.prototype,
        "loadValidatedConfig"
      ).mockResolvedValue({
        config: null,
        shouldPromptForCredentials: true,
      });

      vi.mocked(prompts).mockResolvedValueOnce({
        octokit: "ghp_newtoken123456789012345678901234567890",
        owner: "newuser",
        repo: "new-repo",
      });

      const result = await getGitHubConfigs();

      expect(result.owner).toBe("newuser");
      expect(result.repo).toBe("new-repo");
      expect(result.fromSavedConfig).toBe(false);
    });

    it("should handle configuration errors gracefully", async () => {
      const prompts = (await import("prompts")).default;

      vi.spyOn(
        ConfigManager.prototype,
        "loadValidatedConfig"
      ).mockRejectedValue(new Error("Config loading failed"));

      vi.mocked(prompts).mockResolvedValueOnce({
        octokit: "ghp_newtoken123456789012345678901234567890",
        owner: "newuser",
        repo: "new-repo",
      });

      const result = await getGitHubConfigs();

      expect(result.owner).toBe("newuser");
      expect(result.fromSavedConfig).toBe(false);
    });
  });
});
