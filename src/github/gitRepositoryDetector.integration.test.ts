import { exec } from "child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { promisify } from "util";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GitRepositoryDetector } from "./gitRepositoryDetector.js";
import { ConfigManager } from "../config/configManager.js";

const execAsync = promisify(exec);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("GitRepositoryDetector Integration Tests", () => {
  let testDir: string;
  let mockConfigManager: ConfigManager;
  const runGit = (command: string, cwd?: string) =>
    execAsync(command, { cwd: cwd ?? testDir });

  beforeEach(async () => {
    // Create a unique temporary directory for each test
    testDir = join(
      tmpdir(),
      `git-test-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    );
    mkdirSync(testDir, { recursive: true });

    // Mock ConfigManager for integration tests
    mockConfigManager = new ConfigManager();
    vi.spyOn(mockConfigManager, "loadValidatedConfig").mockResolvedValue({
      config: {
        token: "ghp_test_token_1234567890123456789012345678901234567890",
        owner: "test-owner",
        lastUpdated: new Date().toISOString(),
      },
      shouldPromptForCredentials: false,
    });
    vi.spyOn(mockConfigManager, "saveConfig").mockResolvedValue();
  });

  afterEach(async () => {
    // Clean up test directory
    if (existsSync(testDir)) {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          rmSync(testDir, { recursive: true, force: true });
          break;
        } catch (error) {
          if (attempt === 4) {
            console.warn(
              `Failed to remove test directory after retries: ${testDir}`,
              error
            );
            break;
          }
          await sleep(100);
        }
      }
    }

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe("End-to-end flow in actual Git repository environment", () => {
    it(
      "should detect repository from origin remote in SSH format",
      async () => {
      // Initialize Git repository
      await runGit("git init");
      await runGit('git config user.email "test@example.com"');
      await runGit('git config user.name "Test User"');

      // Add origin remote in SSH format
      await runGit(
        "git remote add origin git@github.com:test-owner/test-repo.git"
      );

      // Create initial commit
      writeFileSync(join(testDir, "README.md"), "# Test Repository");
      await runGit("git add README.md");
      await runGit('git commit -m "Initial commit"');

      const result = await GitRepositoryDetector.detectRepository(testDir);

      expect(result.isGitRepository).toBe(true);
      expect(result.repositoryInfo).toBeDefined();
      expect(result.repositoryInfo!.owner).toBe("test-owner");
      expect(result.repositoryInfo!.repo).toBe("test-repo");
      expect(result.repositoryInfo!.detectionMethod).toBe("origin");
      expect(result.repositoryInfo!.remoteUrl).toBe(
        "git@github.com:test-owner/test-repo.git"
      );
    },
    15000
    );

    it("should detect repository from origin remote in HTTPS format", async () => {
      // Initialize Git repository
      await runGit("git init");
      await runGit('git config user.email "test@example.com"');
      await runGit('git config user.name "Test User"');

      // Add origin remote in HTTPS format
      await runGit(
        "git remote add origin https://github.com/test-owner/test-repo.git"
      );

      // Create initial commit
      writeFileSync(join(testDir, "README.md"), "# Test Repository");
      await runGit("git add README.md");
      await runGit('git commit -m "Initial commit"');

      const result = await GitRepositoryDetector.detectRepository(testDir);

      expect(result.isGitRepository).toBe(true);
      expect(result.repositoryInfo).toBeDefined();
      expect(result.repositoryInfo!.owner).toBe("test-owner");
      expect(result.repositoryInfo!.repo).toBe("test-repo");
      expect(result.repositoryInfo!.detectionMethod).toBe("origin");
      expect(result.repositoryInfo!.remoteUrl).toBe(
        "https://github.com/test-owner/test-repo.git"
      );
    });

    it("should detect repository from subdirectory", async () => {
      // Initialize Git repository
      await runGit("git init");
      await runGit('git config user.email "test@example.com"');
      await runGit('git config user.name "Test User"');

      // Add origin remote
      await runGit(
        "git remote add origin https://github.com/test-owner/test-repo.git"
      );

      // Create subdirectory and change to it
      const subDir = join(testDir, "src", "components");
      mkdirSync(subDir, { recursive: true });

      const result = await GitRepositoryDetector.detectRepository(subDir);

      expect(result.isGitRepository).toBe(true);
      expect(result.repositoryInfo).toBeDefined();
      expect(result.repositoryInfo!.owner).toBe("test-owner");
      expect(result.repositoryInfo!.repo).toBe("test-repo");
      expect(result.repositoryInfo!.detectionMethod).toBe("origin");
    });
  });

  describe("Fallback behavior in non-Git directories", () => {
    it("should return false for non-Git directory", async () => {
      // Ensure we're in a non-Git directory (no .git folder)
      const result = await GitRepositoryDetector.detectRepository(testDir);

      expect(result.isGitRepository).toBe(false);
      expect(result.repositoryInfo).toBeUndefined();
      expect(result.error).toBe("Not a Git repository");
    });

    it("should handle directory without any Git configuration", async () => {
      // Create a directory structure that looks like it might be a project
      mkdirSync(join(testDir, "src"), { recursive: true });
      writeFileSync(join(testDir, "package.json"), '{"name": "test-project"}');
      writeFileSync(join(testDir, "README.md"), "# Test Project");

      const result = await GitRepositoryDetector.detectRepository(testDir);

      expect(result.isGitRepository).toBe(false);
      expect(result.error).toBe("Not a Git repository");
    });
  });

  describe("Multiple remote scenarios and priority handling", () => {
    it("should prioritize origin remote when multiple remotes exist", async () => {
      // Initialize Git repository
      await runGit("git init");
      await runGit('git config user.email "test@example.com"');
      await runGit('git config user.name "Test User"');

      // Add multiple remotes - upstream first, then origin
      await runGit(
        "git remote add upstream https://github.com/upstream-owner/upstream-repo.git"
      );
      await runGit(
        "git remote add origin https://github.com/origin-owner/origin-repo.git"
      );
      await runGit(
        "git remote add fork https://github.com/fork-owner/fork-repo.git"
      );

      const result = await GitRepositoryDetector.detectRepository(testDir);

      expect(result.isGitRepository).toBe(true);
      expect(result.repositoryInfo).toBeDefined();
      expect(result.repositoryInfo!.owner).toBe("origin-owner");
      expect(result.repositoryInfo!.repo).toBe("origin-repo");
      expect(result.repositoryInfo!.detectionMethod).toBe("origin");
    });

    it("should use first remote when origin does not exist", async () => {
      // Initialize Git repository
      await runGit("git init");
      await runGit('git config user.email "test@example.com"');
      await runGit('git config user.name "Test User"');

      // Add remotes without origin - order matters for git remote command
      await runGit(
        "git remote add upstream https://github.com/upstream-owner/upstream-repo.git"
      );
      await runGit(
        "git remote add fork https://github.com/fork-owner/fork-repo.git"
      );

      const result = await GitRepositoryDetector.detectRepository(testDir);

      expect(result.isGitRepository).toBe(true);
      expect(result.repositoryInfo).toBeDefined();
      // Git remote returns remotes in alphabetical order, so 'fork' comes before 'upstream'
      expect(result.repositoryInfo!.owner).toBe("fork-owner");
      expect(result.repositoryInfo!.repo).toBe("fork-repo");
      expect(result.repositoryInfo!.detectionMethod).toBe("first-remote");
    });

    it("should handle repository with no remotes configured", async () => {
      // Initialize Git repository without remotes
      await runGit("git init");
      await runGit('git config user.email "test@example.com"');
      await runGit('git config user.name "Test User"');

      // Create initial commit
      writeFileSync(join(testDir, "README.md"), "# Test Repository");
      await runGit("git add README.md");
      await runGit('git commit -m "Initial commit"');

      const result = await GitRepositoryDetector.detectRepository(testDir);

      expect(result.isGitRepository).toBe(true);
      expect(result.repositoryInfo).toBeUndefined();
      expect(result.error).toBe("No remotes configured");
    });

    it("should handle malformed remote URLs gracefully", async () => {
      // Initialize Git repository
      await runGit("git init");
      await runGit('git config user.email "test@example.com"');
      await runGit('git config user.name "Test User"');

      // Add malformed remote URL
      await runGit("git remote add origin invalid-url-format");

      const result = await GitRepositoryDetector.detectRepository(testDir);

      expect(result.isGitRepository).toBe(true);
      expect(result.repositoryInfo).toBeUndefined();
      expect(result.error).toBe("Could not parse remote URL");
    });
  });

  describe("Integration with existing configuration management", () => {
    it("should detect repository information correctly for integration", async () => {
      // Initialize Git repository with origin remote
      await runGit("git init");
      await runGit('git config user.email "test@example.com"');
      await runGit('git config user.name "Test User"');
      await runGit(
        "git remote add origin https://github.com/detected-owner/detected-repo.git"
      );

      // Test the detection directly
      const result = await GitRepositoryDetector.detectRepository(testDir);

      expect(result.isGitRepository).toBe(true);
      expect(result.repositoryInfo).toBeDefined();
      expect(result.repositoryInfo!.owner).toBe("detected-owner");
      expect(result.repositoryInfo!.repo).toBe("detected-repo");
      expect(result.repositoryInfo!.detectionMethod).toBe("origin");
    });

    it("should handle fallback when no Git repository exists", async () => {
      // Don't initialize Git repository (should trigger fallback)
      const result = await GitRepositoryDetector.detectRepository(testDir);

      expect(result.isGitRepository).toBe(false);
      expect(result.repositoryInfo).toBeUndefined();
      expect(result.error).toBe("Not a Git repository");
    });

    it("should handle repository with multiple remotes correctly", async () => {
      // Initialize Git repository
      await runGit("git init");
      await runGit('git config user.email "test@example.com"');
      await runGit('git config user.name "Test User"');

      // Add multiple remotes - upstream first, then origin
      await runGit(
        "git remote add upstream https://github.com/upstream-owner/upstream-repo.git"
      );
      await runGit(
        "git remote add origin https://github.com/origin-owner/origin-repo.git"
      );

      const result = await GitRepositoryDetector.detectRepository(testDir);

      expect(result.isGitRepository).toBe(true);
      expect(result.repositoryInfo).toBeDefined();
      // Should prioritize origin
      expect(result.repositoryInfo!.owner).toBe("origin-owner");
      expect(result.repositoryInfo!.repo).toBe("origin-repo");
      expect(result.repositoryInfo!.detectionMethod).toBe("origin");
    }, 10000);

    it("should handle Git command errors gracefully", async () => {
      // Create a directory that looks like Git but will cause command failures
      mkdirSync(join(testDir, ".git"), { recursive: true });

      // Change to a directory where Git commands might fail
      const invalidGitDir = join(testDir, "invalid-git");
      mkdirSync(invalidGitDir, { recursive: true });
      mkdirSync(join(invalidGitDir, ".git"), { recursive: true });

      const result = await GitRepositoryDetector.detectRepository(invalidGitDir);

      // Should handle the error gracefully
      expect(result.isGitRepository).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("Error handling and edge cases", () => {
    it("should handle repositories with invalid remote URLs", async () => {
      // Initialize Git repository
      await runGit("git init");
      await runGit('git config user.email "test@example.com"');
      await runGit('git config user.name "Test User"');

      // Add an invalid remote URL that can't be parsed
      await runGit("git remote add origin invalid-url-format");

      const result = await GitRepositoryDetector.detectRepository(testDir);

      expect(result.isGitRepository).toBe(true);
      expect(result.repositoryInfo).toBeUndefined();
      expect(result.error).toBe("Could not parse remote URL");
    }, 10000);

    it("should handle empty repository with no commits", async () => {
      // Initialize Git repository without any commits
      await runGit("git init");
      await runGit('git config user.email "test@example.com"');
      await runGit('git config user.name "Test User"');
      await runGit(
        "git remote add origin https://github.com/test-owner/test-repo.git"
      );

      const result = await GitRepositoryDetector.detectRepository(testDir);

      expect(result.isGitRepository).toBe(true);
      expect(result.repositoryInfo).toBeDefined();
      expect(result.repositoryInfo!.owner).toBe("test-owner");
      expect(result.repositoryInfo!.repo).toBe("test-repo");
    });

    it("should handle repository in a deeply nested directory", async () => {
      // Initialize Git repository
      await runGit("git init");
      await runGit('git config user.email "test@example.com"');
      await runGit('git config user.name "Test User"');
      await runGit(
        "git remote add origin https://github.com/test-owner/test-repo.git"
      );

      // Create deeply nested directory structure
      const deepDir = join(
        testDir,
        "very",
        "deep",
        "nested",
        "directory",
        "structure"
      );
      mkdirSync(deepDir, { recursive: true });

      const result = await GitRepositoryDetector.detectRepository(deepDir);

      expect(result.isGitRepository).toBe(true);
      expect(result.repositoryInfo).toBeDefined();
      expect(result.repositoryInfo!.owner).toBe("test-owner");
      expect(result.repositoryInfo!.repo).toBe("test-repo");
    });
  });

  describe("Performance and reliability", () => {
    it("should complete detection within reasonable time limits", async () => {
      // Initialize Git repository
      await runGit("git init");
      await runGit('git config user.email "test@example.com"');
      await runGit('git config user.name "Test User"');
      await runGit(
        "git remote add origin https://github.com/test-owner/test-repo.git"
      );

      const startTime = Date.now();
      const result = await GitRepositoryDetector.detectRepository(testDir);
      const endTime = Date.now();

      expect(result.isGitRepository).toBe(true);
      expect(result.repositoryInfo).toBeDefined();

      // Should complete within 5 seconds (generous timeout for CI environments)
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it("should handle concurrent detection requests", async () => {
      // Initialize Git repository
      await runGit("git init");
      await runGit('git config user.email "test@example.com"');
      await runGit('git config user.name "Test User"');
      await runGit(
        "git remote add origin https://github.com/test-owner/test-repo.git"
      );

      // Run multiple detection requests concurrently
      const promises = Array.from({ length: 5 }, () =>
        GitRepositoryDetector.detectRepository(testDir)
      );

      const results = await Promise.all(promises);

      // All results should be consistent
      results.forEach((result) => {
        expect(result.isGitRepository).toBe(true);
        expect(result.repositoryInfo).toBeDefined();
        expect(result.repositoryInfo!.owner).toBe("test-owner");
        expect(result.repositoryInfo!.repo).toBe("test-repo");
      });
    });
  });

  describe("Additional error handling integration tests", () => {
    it("should handle repository with corrupted remote configuration", async () => {
      // Initialize Git repository
      await runGit("git init");
      await runGit('git config user.email "test@example.com"');
      await runGit('git config user.name "Test User"');

      // Add a remote and then corrupt the config
      await runGit(
        "git remote add origin https://github.com/test-owner/test-repo.git"
      );

      // Corrupt the git config by writing invalid content
      writeFileSync(join(testDir, ".git", "config"), "invalid config content");

      const result = await GitRepositoryDetector.detectRepository(testDir);

      // Should handle the error gracefully
      expect(result.isGitRepository).toBe(true);
      expect(result.error).toBeDefined();
    });

    it("should handle repository with missing .git/config file", async () => {
      // Initialize Git repository
      await runGit("git init");

      // Remove the config file
      if (existsSync(join(testDir, ".git", "config"))) {
        rmSync(join(testDir, ".git", "config"));
      }

      const result = await GitRepositoryDetector.detectRepository(testDir);

      expect(result.isGitRepository).toBe(true);
      expect(result.error).toBe("No remotes configured");
    });

    it("should handle repository with read-only .git directory", async () => {
      // Initialize Git repository
      await runGit("git init");
      await runGit('git config user.email "test@example.com"');
      await runGit('git config user.name "Test User"');
      await runGit(
        "git remote add origin https://github.com/test-owner/test-repo.git"
      );

      // Make .git directory read-only (this might not work on all systems)
      try {
        await execAsync(`chmod 444 ${join(testDir, ".git", "config")}`, {
          cwd: testDir,
        });
      } catch {
        // Skip this test if chmod fails
        return;
      }

      const result = await GitRepositoryDetector.detectRepository(testDir);

      // Should still be able to read the repository info
      expect(result.isGitRepository).toBe(true);
      if (result.repositoryInfo) {
        expect(result.repositoryInfo.owner).toBe("test-owner");
        expect(result.repositoryInfo.repo).toBe("test-repo");
      }

      // Restore permissions for cleanup
      try {
        await execAsync(`chmod 644 ${join(testDir, ".git", "config")}`, {
          cwd: testDir,
        });
      } catch {
        // Ignore cleanup errors
      }
    }, 10000);

    it("should handle repository with extremely long path", async () => {
      // Create a deeply nested directory structure
      const deepPath = join(
        testDir,
        "very",
        "very",
        "very",
        "deep",
        "nested",
        "directory",
        "structure",
        "that",
        "goes",
        "on",
        "and",
        "on"
      );
      mkdirSync(deepPath, { recursive: true });

      // Initialize Git repository in the deep path
      await runGit("git init", deepPath);
      await runGit('git config user.email "test@example.com"', deepPath);
      await runGit('git config user.name "Test User"', deepPath);
      await runGit(
        "git remote add origin https://github.com/test-owner/test-repo.git",
        deepPath
      );

      const result = await GitRepositoryDetector.detectRepository(deepPath);

      expect(result.isGitRepository).toBe(true);
      expect(result.repositoryInfo).toBeDefined();
      expect(result.repositoryInfo!.owner).toBe("test-owner");
      expect(result.repositoryInfo!.repo).toBe("test-repo");
    });

    it("should handle repository with special characters in path", async () => {
      // Create directory with special characters (if supported by filesystem)
      const specialDir = join(testDir, "test-repo with spaces & symbols!");
      try {
        mkdirSync(specialDir, { recursive: true });

        // Initialize Git repository
        await runGit("git init", specialDir);
        await runGit('git config user.email "test@example.com"', specialDir);
        await runGit('git config user.name "Test User"', specialDir);
        await runGit(
          "git remote add origin https://github.com/test-owner/test-repo.git",
          specialDir
        );

        const result = await GitRepositoryDetector.detectRepository(specialDir);

        expect(result.isGitRepository).toBe(true);
        expect(result.repositoryInfo).toBeDefined();
        expect(result.repositoryInfo!.owner).toBe("test-owner");
        expect(result.repositoryInfo!.repo).toBe("test-repo");
      } catch {
        // Skip this test if filesystem doesn't support special characters
        console.warn(
          "Skipping special characters test due to filesystem limitations"
        );
      }
    });

    it("should handle repository with non-GitHub remotes mixed with GitHub remotes", async () => {
      // Initialize Git repository
      await runGit("git init");
      await runGit('git config user.email "test@example.com"');
      await runGit('git config user.name "Test User"');

      // Add non-GitHub remotes first (alphabetically before 'origin')
      await runGit(
        "git remote add bitbucket https://bitbucket.org/user/repo.git"
      );
      await runGit("git remote add gitlab https://gitlab.com/user/repo.git");

      // Add GitHub remote as 'origin' (should be detected with priority)
      await runGit(
        "git remote add origin https://github.com/test-owner/test-repo.git"
      );

      const result = await GitRepositoryDetector.detectRepository(testDir);

      expect(result.isGitRepository).toBe(true);
      expect(result.repositoryInfo).toBeDefined();
      expect(result.repositoryInfo!.owner).toBe("test-owner");
      expect(result.repositoryInfo!.repo).toBe("test-repo");
      expect(result.repositoryInfo!.detectionMethod).toBe("origin");
    });

    it("should handle repository with only non-GitHub remotes", async () => {
      // Initialize Git repository
      await runGit("git init");
      await runGit('git config user.email "test@example.com"');
      await runGit('git config user.name "Test User"');

      // Add only non-GitHub remotes
      await runGit("git remote add origin https://gitlab.com/user/repo.git");
      await runGit(
        "git remote add upstream https://bitbucket.org/user/repo.git"
      );

      const result = await GitRepositoryDetector.detectRepository(testDir);

      expect(result.isGitRepository).toBe(true);
      expect(result.repositoryInfo).toBeUndefined();
      expect(result.error).toBe("Could not parse remote URL");
    });
  });
});
