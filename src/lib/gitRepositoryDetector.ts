import { type ChildProcess, exec } from "child_process";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { promisify } from "util";

const GIT_COMMAND_TIMEOUT_MS = 5000;

export interface GitRepositoryInfo {
  owner: string;
  repo: string;
  remoteUrl: string;
  detectionMethod: "origin" | "first-remote" | "manual";
}

export interface GitDetectionResult {
  isGitRepository: boolean;
  repositoryInfo?: GitRepositoryInfo;
  error?: string;
}

export class GitRepositoryDetector {
  /**
   * Allows tests to override execAsync implementation
   */
  private static execAsyncInternal: (
    command: string,
    options?: { cwd: string; timeout: number }
  ) => Promise<{ stdout: string; stderr: string }> & { child?: ChildProcess } =
    promisify(exec);

  /**
   * Overrides the internal execAsync function for testing purposes.
   * @param mock - The mock function to use for execAsync.
   */
  static overrideExecAsync(
    mock: (
      command: string,
      options?: { cwd: string; timeout: number }
    ) => Promise<{ stdout: string; stderr: string }>
  ) {
    this.execAsyncInternal = mock;
  }

  /**
   * Detects Git repository information from the current working directory
   * @param cwd - Current working directory (defaults to process.cwd())
   * @returns Promise<GitDetectionResult>
   */
  static async detectRepository(cwd?: string): Promise<GitDetectionResult> {
    const workingDir = cwd || process.cwd();

    try {
      // Find Git root directory
      const gitRoot = await this.findGitRoot(workingDir);
      if (!gitRoot) {
        return {
          isGitRepository: false,
          error: "Not a Git repository",
        };
      }

      // Get all remotes
      const remotes = await this.getAllRemotes(gitRoot);
      if (remotes.length === 0) {
        return {
          isGitRepository: true,
          error: "No remotes configured",
        };
      }

      // Try to get origin remote first, then fallback to first remote
      let remoteUrl: string | null = null;
      let detectionMethod: "origin" | "first-remote" = "origin";

      if (remotes.includes("origin")) {
        remoteUrl = await this.getRemoteUrl(gitRoot, "origin");
      }

      if (!remoteUrl && remotes.length > 0) {
        remoteUrl = await this.getRemoteUrl(gitRoot, remotes[0]);
        detectionMethod = "first-remote";
      }

      if (!remoteUrl) {
        return {
          isGitRepository: true,
          error: "Could not retrieve remote URL",
        };
      }

      // Parse the Git URL
      const parsedUrl = this.parseGitUrl(remoteUrl);
      if (!parsedUrl) {
        return {
          isGitRepository: true,
          error: "Could not parse remote URL",
        };
      }

      return {
        isGitRepository: true,
        repositoryInfo: {
          owner: parsedUrl.owner,
          repo: parsedUrl.repo,
          remoteUrl,
          detectionMethod,
        },
      };
    } catch (err) {
      const error = err as NodeJS.ErrnoException;
      if (
        error.code === "ENOENT" ||
        error.message.includes("command not found")
      ) {
        return {
          isGitRepository: false,
          error: "Git command not available",
        };
      }
      if (
        error.code === "128" ||
        error.message.includes("not a git repository")
      ) {
        return {
          isGitRepository: false,
          error: "Not a Git repository",
        };
      }
      return {
        isGitRepository: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Finds the Git root directory by traversing up the directory tree
   * @param startPath - Starting directory path
   * @returns Promise<string | null> - Git root path or null if not found
   */
  static async findGitRoot(startPath: string): Promise<string | null> {
    let currentPath = startPath;

    while (currentPath !== dirname(currentPath)) {
      const gitPath = join(currentPath, ".git");

      if (existsSync(gitPath)) {
        return currentPath;
      }

      currentPath = dirname(currentPath);
    }

    return null;
  }

  /**
   * Gets the URL for a specific Git remote
   * @param gitRoot - Git repository root directory
   * @param remoteName - Name of the remote (e.g., 'origin')
   * @returns Promise<string | null> - Remote URL or null if not found
   */
  static async getRemoteUrl(
    gitRoot: string,
    remoteName: string
  ): Promise<string | null> {
    try {
      const { stdout } = await this.execAsyncInternal(
        `git remote get-url ${remoteName}`,
        {
          cwd: gitRoot,
          timeout: GIT_COMMAND_TIMEOUT_MS,
        }
      );

      return stdout.trim() || null;
    } catch {
      return null;
    }
  }

  /**
   * Parses a Git URL to extract owner and repository name
   * @param url - Git remote URL
   * @returns Object with owner and repo or null if parsing fails
   */
  static parseGitUrl(url: string): { owner: string; repo: string } | null {
    // Input validation
    if (!url || typeof url !== "string" || url.trim().length === 0) {
      return null;
    }

    const trimmedUrl = url.trim();

    try {
      // SSH format: git@github.com:owner/repo.git
      const sshMatch = trimmedUrl.match(
        /^git@github\.com:([^/\s:]+)\/([^/\s:]+?)(?:\.git)?$/
      );
      if (sshMatch) {
        const owner = sshMatch[1];
        const repo = sshMatch[2];

        // Validate extracted values
        if (
          this.isValidGitHubIdentifier(owner) &&
          this.isValidGitHubIdentifier(repo)
        ) {
          return { owner, repo };
        }
      }

      // HTTPS format: https://github.com/owner/repo.git or https://github.com/owner/repo
      const httpsMatch = trimmedUrl.match(
        /^https:\/\/github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git)?(?:\/)?$/
      );
      if (httpsMatch) {
        const owner = httpsMatch[1];
        const repo = httpsMatch[2];

        // Validate extracted values
        if (
          this.isValidGitHubIdentifier(owner) &&
          this.isValidGitHubIdentifier(repo)
        ) {
          return { owner, repo };
        }
      }

      // HTTP format (less secure but sometimes used): http://github.com/owner/repo.git
      const httpMatch = trimmedUrl.match(
        /^http:\/\/github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git)?(?:\/)?$/
      );
      if (httpMatch) {
        const owner = httpMatch[1];
        const repo = httpMatch[2];

        // Validate extracted values
        if (
          this.isValidGitHubIdentifier(owner) &&
          this.isValidGitHubIdentifier(repo)
        ) {
          return { owner, repo };
        }
      }
    } catch {
      // Handle regex errors or other parsing issues
      return null;
    }

    return null;
  }

  /**
   * Validates if a string is a valid GitHub identifier (username or repository name)
   * @param identifier - The identifier to validate
   * @returns boolean - True if valid, false otherwise
   */
  private static isValidGitHubIdentifier(identifier: string): boolean {
    if (!identifier || typeof identifier !== "string") {
      return false;
    }

    // GitHub username/repo name rules:
    // - Can contain alphanumeric characters and hyphens
    // - Cannot start or end with a hyphen
    // - Cannot contain consecutive hyphens
    // - Must be 1-39 characters long
    const GITHUB_IDENTIFIER_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;

    return (
      identifier.length >= 1 &&
      identifier.length <= 39 &&
      GITHUB_IDENTIFIER_REGEX.test(identifier) &&
      !identifier.includes("--") // No consecutive hyphens
    );
  }

  /**
   * Gets all configured Git remotes
   * @param gitRoot - Git repository root directory
   * @returns Promise<string[]> - Array of remote names
   */
  static async getAllRemotes(gitRoot: string): Promise<string[]> {
    const { stdout } = await this.execAsyncInternal("git remote", {
      cwd: gitRoot,
      timeout: GIT_COMMAND_TIMEOUT_MS,
    });

    return stdout
      .trim()
      .split("\n")
      .filter((remote) => remote.length > 0);
  }
}
