import { exec } from 'child_process';
import type { ExecException, ExecOptions } from 'child_process';

type ExecCallback = (
  error: ExecException | null,
  stdout: string,
  stderr: string,
) => void;

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GitRepositoryDetector } from './gitRepositoryDetector.js';

// Mock the child_process module
vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

const mockExec = vi.mocked(exec);

describe('GitRepositoryDetector Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Git command availability errors', () => {
    it('should handle git command not found error in getAllRemotes', async () => {
      mockExec.mockImplementation(
        (_command: string, _options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error('git: command not found');
            (error as NodeJS.ErrnoException).code = 'ENOENT';
            process.nextTick(() => callback(error, '', ''));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(false);
      expect(result.error).toBe('Git command not available');
    });

    it('should handle git command not found error in findGitRoot', async () => {
      mockExec.mockImplementation(
        (_command: string, _options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error('git: command not found');
            (error as NodeJS.ErrnoException).code = 'ENOENT';
            process.nextTick(() => callback(error, '', ''));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(false);
      expect(result.error).toBe('Git command not available');
    });

    it('should handle git command not found error in detectRepository', async () => {
      mockExec.mockImplementation(
        (_command: string, _options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error('git: command not found');
            (error as NodeJS.ErrnoException).code = 'ENOENT';
            process.nextTick(() => callback(error, '', ''));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(false);
      expect(result.error).toBe('Git command not available');
    });

    it('should handle not a git repository error', async () => {
      mockExec.mockImplementation(
        (_command: string, _options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error('fatal: not a git repository');
            (error as NodeJS.ErrnoException).code = '128';
            process.nextTick(() => callback(error, '', ''));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(false);
      expect(result.error).toBe('Not a Git repository');
    });
  });

  describe('Remote configuration errors', () => {
    it('should handle no remotes configured', async () => {
      mockExec.mockImplementation(
        (_command: string, _options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            process.nextTick(() => callback(null, '', ''));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(true);
      expect(result.repositoryInfo).toBeUndefined();
      expect(result.error).toBe('No remotes configured');
    });

    it('should handle empty remotes list', async () => {
      mockExec.mockImplementation(
        (_command: string, _options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            process.nextTick(() => callback(null, '   \n  \n  ', ''));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(true);
      expect(result.repositoryInfo).toBeUndefined();
      expect(result.error).toBe('No remotes configured');
    });

    it('should handle invalid remote URL format', async () => {
      mockExec.mockImplementation(
        (command: string, _options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            if (
              command.includes('git remote') &&
              !command.includes('get-url')
            ) {
              process.nextTick(() => callback(null, 'invalid-remote\n', ''));
            } else if (command.includes('git remote get-url')) {
              process.nextTick(() =>
                callback(new Error('No such remote'), '', ''),
              );
            }
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(true);
      expect(result.repositoryInfo).toBeUndefined();
      expect(result.error).toBe('Could not parse remote URL');
    });
  });

  describe('Network and connectivity errors', () => {
    it('should handle timeout errors', async () => {
      mockExec.mockImplementation(
        (_command: string, _options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error('Operation timed out');
            (error as NodeJS.ErrnoException).code = 'ETIMEDOUT';
            process.nextTick(() => callback(error, '', ''));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(false);
      expect(result.error).toBe('Git command timed out');
    });

    it('should handle DNS resolution errors', async () => {
      mockExec.mockImplementation(
        (_command: string, _options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error('Could not resolve hostname');
            (error as NodeJS.ErrnoException).code = 'ENOTFOUND';
            process.nextTick(() => callback(error, '', ''));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle connection refused errors', async () => {
      mockExec.mockImplementation(
        (_command: string, _options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error('Connection refused');
            (error as NodeJS.ErrnoException).code = 'ECONNREFUSED';
            process.nextTick(() => callback(error, '', ''));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle SSL certificate errors', async () => {
      mockExec.mockImplementation(
        (_command: string, _options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error('SSL certificate problem');
            (error as NodeJS.ErrnoException).code = 'CERT_UNTRUSTED';
            process.nextTick(() => callback(error, '', ''));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(false);
      expect(result.error).toBe('SSL certificate error');
    });
  });

  describe('Authentication and permission errors', () => {
    it('should handle authentication failures', async () => {
      mockExec.mockImplementation(
        (command: string, _options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            if (
              command.includes('git remote') &&
              !command.includes('get-url')
            ) {
              process.nextTick(() => callback(null, 'origin\n', ''));
            } else if (command.includes('git remote get-url')) {
              const error = new Error('Authentication failed');
              (error as NodeJS.ErrnoException).code = 'EAUTH';
              process.nextTick(() => callback(error, '', ''));
            }
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(true);
      expect(result.repositoryInfo).toBeUndefined();
      expect(result.error).toBe('Authentication failed');
    });

    it('should handle permission denied errors', async () => {
      mockExec.mockImplementation(
        (_command: string, _options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error(
              "fatal: could not read Username for 'https://github.com': terminal prompts disabled",
            );
            (error as NodeJS.ErrnoException).code = '128';
            process.nextTick(() => callback(error, '', ''));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(false);
      expect(result.error).toBe('Permission denied');
    });
  });

  describe('System resource errors', () => {
    it('should handle disk space errors', async () => {
      mockExec.mockImplementation(
        (_command: string, _options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error('No space left on device');
            (error as NodeJS.ErrnoException).code = 'ENOSPC';
            process.nextTick(() => callback(error, '', ''));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(false);
      expect(result.error).toBe('System resource error');
    });

    it('should handle interrupted system calls', async () => {
      mockExec.mockImplementation(
        (_command: string, _options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error('Interrupted system call');
            (error as NodeJS.ErrnoException).code = 'EINTR';
            process.nextTick(() => callback(error, '', ''));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(false);
      expect(result.error).toBe('System resource error');
    });

    it('should handle process killed errors', async () => {
      mockExec.mockImplementation(
        (_command: string, _options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error('Process killed');
            (error as any).signal = 'SIGKILL'; // eslint-disable-line @typescript-eslint/no-explicit-any
            process.nextTick(() => callback(error, '', ''));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(false);
      expect(result.error).toBe('Process terminated');
    });

    it('should handle memory allocation errors', async () => {
      mockExec.mockImplementation(
        (_command: string, _options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error('Cannot allocate memory');
            (error as NodeJS.ErrnoException).code = 'ENOMEM';
            process.nextTick(() => callback(error, '', ''));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(false);
      expect(result.error).toBe('System resource error');
    });
  });

  describe('File system errors', () => {
    it('should handle file not found errors', async () => {
      mockExec.mockImplementation(
        (_command: string, _options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error('No such file or directory');
            (error as NodeJS.ErrnoException).code = 'ENOENT';
            process.nextTick(() => callback(error, '', ''));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(false);
      expect(result.error).toBe('Git command not available');
    });

    it('should handle permission denied file access', async () => {
      mockExec.mockImplementation(
        (_command: string, _options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error('Permission denied');
            (error as NodeJS.ErrnoException).code = 'EACCES';
            process.nextTick(() => callback(error, '', ''));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(false);
      expect(result.error).toBe('Permission denied');
    });

    it('should handle corrupted repository errors', async () => {
      mockExec.mockImplementation(
        (_command: string, _options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error('fatal: bad object HEAD');
            (error as NodeJS.ErrnoException).code = '128';
            process.nextTick(() => callback(error, '', ''));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(false);
      expect(result.error).toBe('Repository corrupted');
    });
  });

  describe('Edge case error scenarios', () => {
    it('should handle malformed git output', async () => {
      mockExec.mockImplementation(
        (command: string, _options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            if (
              command.includes('git remote') &&
              !command.includes('get-url')
            ) {
              process.nextTick(() => callback(null, 'origin\n', ''));
            } else if (command.includes('git remote get-url origin')) {
              // Return malformed URL that can't be parsed
              process.nextTick(() => callback(null, 'not-a-valid-url\n', ''));
            }
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(true);
      expect(result.repositoryInfo).toBeUndefined();
      expect(result.error).toBe('Could not parse remote URL');
    });

    it('should handle empty git output', async () => {
      mockExec.mockImplementation(
        (command: string, _options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            if (
              command.includes('git remote') &&
              !command.includes('get-url')
            ) {
              process.nextTick(() => callback(null, 'origin\n', ''));
            } else if (command.includes('git remote get-url origin')) {
              // Return empty output
              process.nextTick(() => callback(null, '', ''));
            }
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(true);
      expect(result.repositoryInfo).toBeUndefined();
      expect(result.error).toBe('Could not parse remote URL');
    });

    it('should handle unexpected git command output format', async () => {
      mockExec.mockImplementation(
        (command: string, _options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            if (
              command.includes('git remote') &&
              !command.includes('get-url')
            ) {
              // Return unexpected format
              process.nextTick(() =>
                callback(
                  null,
                  'unexpected output format\nwith multiple lines\n',
                  '',
                ),
              );
            } else if (command.includes('git remote get-url')) {
              process.nextTick(() =>
                callback(null, 'https://github.com/owner/repo.git\n', ''),
              );
            }
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(true);
      expect(result.repositoryInfo).toBeDefined();
      expect(result.repositoryInfo!.owner).toBe('owner');
      expect(result.repositoryInfo!.repo).toBe('repo');
    });

    it('should handle git command with stderr warnings', async () => {
      mockExec.mockImplementation(
        (command: string, _options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            if (
              command.includes('git remote') &&
              !command.includes('get-url')
            ) {
              process.nextTick(() =>
                callback(null, 'origin\n', 'warning: some git warning\n'),
              );
            } else if (command.includes('git remote get-url origin')) {
              process.nextTick(() =>
                callback(
                  null,
                  'https://github.com/owner/repo.git\n',
                  'warning: another warning\n',
                ),
              );
            }
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(true);
      expect(result.repositoryInfo).toBeDefined();
      expect(result.repositoryInfo!.owner).toBe('owner');
      expect(result.repositoryInfo!.repo).toBe('repo');
    });

    it('should handle concurrent git operations conflicts', async () => {
      mockExec.mockImplementation(
        (_command: string, _options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error(
              "fatal: Unable to create '.git/index.lock': File exists",
            );
            (error as NodeJS.ErrnoException).code = '128';
            process.nextTick(() => callback(error, '', ''));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(false);
      expect(result.error).toBe('Git operation conflict');
    });

    it('should handle git version compatibility issues', async () => {
      mockExec.mockImplementation(
        (_command: string, _options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error("git: 'remote' is not a git command");
            (error as NodeJS.ErrnoException).code = '1';
            process.nextTick(() => callback(error, '', ''));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository();

      expect(result.isGitRepository).toBe(false);
      expect(result.error).toBe('Git command failed');
    });
  });
});
