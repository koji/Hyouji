import { beforeEach, describe, expect, it, vi } from "vitest";
import { GitRepositoryDetector } from "./gitRepositoryDetector.js";

// Define a mock for the promisified exec function
const mockExecAsync = vi.fn();

describe("GitRepositoryDetector Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Override the execAsync implementation before each test
    GitRepositoryDetector.overrideExecAsync(mockExecAsync);
  });

  describe("Git command availability errors", () => {
    it("should handle git command not found error", async () => {
      const error: NodeJS.ErrnoException = new Error("git: command not found");
      error.code = "ENOENT";
      mockExecAsync.mockRejectedValue(error);

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(false);
      expect(result.error).toBe("Git command not available");
    });

    it("should handle not a git repository error", async () => {
      const error: NodeJS.ErrnoException = new Error(
        "fatal: not a git repository"
      );
      error.code = "128";
      mockExecAsync.mockRejectedValue(error);

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(false);
      expect(result.error).toBe("Not a Git repository");
    });
  });

  describe("Remote configuration errors", () => {
    it("should handle no remotes configured", async () => {
      mockExecAsync.mockResolvedValue({ stdout: "", stderr: "" });

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(true);
      expect(result.repositoryInfo).toBeUndefined();
      expect(result.error).toBe("No remotes configured");
    });

    it("should handle empty remotes list", async () => {
      mockExecAsync.mockResolvedValue({ stdout: "   \n  \n  ", stderr: "" });

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(true);
      expect(result.repositoryInfo).toBeUndefined();
      expect(result.error).toBe("No remotes configured");
    });
  });
});
