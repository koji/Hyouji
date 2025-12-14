import { existsSync } from "fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("fs", () => ({
  existsSync: vi.fn(),
}));

const mockExecAsync = vi.fn();
const mockExistsSync = vi.mocked(existsSync);

import { GitRepositoryDetector } from "./gitRepositoryDetector.js";

describe("GitRepositoryDetector Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Override the execAsync implementation before each test
    GitRepositoryDetector.overrideExecAsync(mockExecAsync);
  });

  describe("Git command availability errors", () => {
    it("should handle git command not found error", async () => {
      // Mock findGitRoot to succeed
      mockExistsSync.mockImplementation((path: string) => {
        return path.includes(".git");
      });
      // Mock getAllRemotes to fail with ENOENT
      const error: NodeJS.ErrnoException = new Error("git: command not found");
      error.code = "ENOENT";
      mockExecAsync.mockRejectedValue(error);

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(false);
      expect(result.error).toBe("Git command not available");
    });

    it("should handle not a git repository error", async () => {
      // Mock findGitRoot to fail (not a git repository)
      mockExistsSync.mockReturnValue(false);

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(false);
      expect(result.error).toBe("Not a Git repository");
    });
  });

  describe("Remote configuration errors", () => {
    it("should handle no remotes configured", async () => {
      // Mock findGitRoot to succeed
      mockExistsSync.mockImplementation((path: string) => {
        return path.includes(".git");
      });
      // Mock getAllRemotes to return empty
      mockExecAsync.mockResolvedValueOnce({ stdout: "", stderr: "" });

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(true);
      expect(result.repositoryInfo).toBeUndefined();
      expect(result.error).toBe("No remotes configured");
    });

    it("should handle repositories with malformed remote URLs", async () => {
      // Mock findGitRoot to succeed
      mockExistsSync.mockImplementation((path: string) => {
        return path.includes(".git");
      });
      // Mock getAllRemotes to return a remote name
      mockExecAsync.mockResolvedValueOnce({ stdout: "origin", stderr: "" });
      // Mock getRemoteUrl to return an invalid URL
      mockExecAsync.mockResolvedValueOnce({
        stdout: "invalid-url",
        stderr: "",
      });

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(true);
      expect(result.repositoryInfo).toBeUndefined();
      expect(result.error).toBe("Could not parse remote URL");
    });
  });
});
