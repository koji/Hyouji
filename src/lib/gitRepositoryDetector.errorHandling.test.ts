import { exec } from 'child_process';
import { existsSync } from 'fs';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GitRepositoryDetector } from './gitRepositoryDetector';

// Mock child_process and fs modules
vi.mock('child_process', () => ({
  exec: vi.fn(),
}));
vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

const mockExec = vi.mocked(exec);
const mockExistsSync = vi.mocked(existsSync);

type ExecCallback = (
  error: Error | null,
  result?: { stdout: string; stderr: string },
) => void;

describe('GitRepositoryDetector - Error Handling and Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Git command not available scenarios', () => {
    it('should handle git command not found error in getAllRemotes', async () => {
      mockExec.mockImplementation(
        (command: string, options: object, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error('git: command not found');
            (error as NodeJS.ErrnoException).code = 'ENOENT';
            process.nextTick(() => callback(error, undefined));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.getAllRemotes('/project');
      expect(result).toEqual([]);
    });

    it('should handle git command not found error in getRemoteUrl', async () => {
      mockExec.mockImplementation(
        (command: string, options: object, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error('git: command not found');
            (error as NodeJS.ErrnoException).code = 'ENOENT';
            process.nextTick(() => callback(error, undefined));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.getRemoteUrl(
        '/project',
        'origin',
      );
      expect(result).toBeNull();
    });

    it('should handle git not installed during repository detection', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path.includes('.git');
      });

      mockExec.mockImplementation(
        (command: string, options: object, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error('git: command not found');
            (error as NodeJS.ErrnoException).code = 'ENOENT';
            process.nextTick(() => callback(error, undefined));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository('/project');

      expect(result.isGitRepository).toBe(true);
      expect(result.error).toBe('No remotes configured');
    });

    it('should handle git command with invalid syntax', async () => {
      mockExec.mockImplementation(
        (command: string, options: object, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error('fatal: not a git repository');
            (error as NodeJS.ErrnoException).code = 128;
            process.nextTick(() => callback(error, undefined));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.getAllRemotes('/project');
      expect(result).toEqual([]);
    });
  });

  describe('Repository with no remotes configured', () => {
    it('should handle empty remote list gracefully', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path.includes('.git');
      });

      mockExec.mockImplementation(
        (command: string, options: object, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            process.nextTick(() => callback(null, { stdout: '', stderr: '' }));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository('/project');

      expect(result.isGitRepository).toBe(true);
      expect(result.repositoryInfo).toBeUndefined();
      expect(result.error).toBe('No remotes configured');
    });

    it('should handle whitespace-only remote output', async () => {
      mockExec.mockImplementation(
        (command: string, options: object, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            process.nextTick(() =>
              callback(null, { stdout: '   \n  \n  ', stderr: '' }),
            );
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.getAllRemotes('/project');
      expect(result).toEqual([]);
    });

    it('should handle repository with only invalid remote names', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path.includes('.git');
      });

      mockExec.mockImplementation(
        (command: string, options: object, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            if (
              command.includes('git remote') &&
              !command.includes('get-url')
            ) {
              process.nextTick(() =>
                callback(null, { stdout: 'invalid-remote\n', stderr: '' }),
              );
            } else if (command.includes('git remote get-url')) {
              process.nextTick(() =>
                callback(new Error('No such remote'), undefined),
              );
            }
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository('/project');

      expect(result.isGitRepository).toBe(true);
      expect(result.error).toBe('Could not retrieve remote URL');
    });
  });

  describe('Network error scenarios during Git operations', () => {
    it('should handle network timeout during remote operations', async () => {
      mockExec.mockImplementation(
        (command: string, options: object, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error('Operation timed out');
            (error as NodeJS.ErrnoException).code = 'ETIMEDOUT';
            process.nextTick(() => callback(error, undefined));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.getRemoteUrl(
        '/project',
        'origin',
      );
      expect(result).toBeNull();
    });

    it('should handle DNS resolution failure', async () => {
      mockExec.mockImplementation(
        (command: string, options: object, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error('Could not resolve hostname');
            (error as NodeJS.ErrnoException).code = 'ENOTFOUND';
            process.nextTick(() => callback(error, undefined));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.getAllRemotes('/project');
      expect(result).toEqual([]);
    });

    it('should handle connection refused errors', async () => {
      mockExec.mockImplementation(
        (command: string, options: object, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error('Connection refused');
            (error as NodeJS.ErrnoException).code = 'ECONNREFUSED';
            process.nextTick(() => callback(error, undefined));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.getRemoteUrl(
        '/project',
        'origin',
      );
      expect(result).toBeNull();
    });

    it('should handle SSL certificate errors', async () => {
      mockExec.mockImplementation(
        (command: string, options: object, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error('SSL certificate problem');
            (error as NodeJS.ErrnoException).code = 'CERT_UNTRUSTED';
            process.nextTick(() => callback(error, undefined));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.getAllRemotes('/project');
      expect(result).toEqual([]);
    });

    it('should handle authentication failures during remote operations', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path.includes('.git');
      });

      mockExec.mockImplementation(
        (command: string, options: object, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            if (
              command.includes('git remote') &&
              !command.includes('get-url')
            ) {
              process.nextTick(() =>
                callback(null, { stdout: 'origin\n', stderr: '' }),
              );
            } else if (command.includes('git remote get-url')) {
              const error = new Error('Authentication failed');
              (error as NodeJS.ErrnoException).code = 'EAUTH';
              process.nextTick(() => callback(error, undefined));
            }
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository('/project');

      expect(result.isGitRepository).toBe(true);
      expect(result.error).toBe('Could not retrieve remote URL');
    });
  });

  describe('Graceful degradation in all error conditions', () => {
    it('should gracefully handle corrupted .git directory', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        if (path.includes('.git')) {
          return true;
        }
        return false;
      });

      mockExec.mockImplementation(
        (command: string, options: object, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error(
              'fatal: not a git repository (or any of the parent directories)',
            );
            (error as NodeJS.ErrnoException).code = 128;
            process.nextTick(() => callback(error, undefined));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository('/project');

      expect(result.isGitRepository).toBe(true);
      expect(result.error).toBe('No remotes configured');
    });

    it('should handle permission denied errors gracefully', async () => {
      mockExistsSync.mockImplementation(() => {
        const error = new Error('Permission denied');
        (error as NodeJS.ErrnoException).code = 'EACCES';
        throw error;
      });

      const result = await GitRepositoryDetector.detectRepository('/project');

      expect(result.isGitRepository).toBe(false);
      expect(result.error).toBe('Permission denied');
    });

    it('should handle disk full errors during git operations', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path.includes('.git');
      });

      mockExec.mockImplementation(
        (command: string, options: object, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error('No space left on device');
            (error as NodeJS.ErrnoException).code = 'ENOSPC';
            process.nextTick(() => callback(error, undefined));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository('/project');

      expect(result.isGitRepository).toBe(true);
      expect(result.error).toBe('No remotes configured');
    });

    it('should handle interrupted system calls', async () => {
      mockExec.mockImplementation(
        (command: string, options: object, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error('Interrupted system call');
            (error as NodeJS.ErrnoException).code = 'EINTR';
            process.nextTick(() => callback(error, undefined));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.getAllRemotes('/project');
      expect(result).toEqual([]);
    });

    it('should handle process killed scenarios', async () => {
      mockExec.mockImplementation(
        (command: string, options: object, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error('Process killed');
            (error as NodeJS.ErrnoException).signal = 'SIGKILL';
            process.nextTick(() => callback(error, undefined));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.getRemoteUrl(
        '/project',
        'origin',
      );
      expect(result).toBeNull();
    });

    it('should handle memory allocation failures', async () => {
      mockExec.mockImplementation(
        (command: string, options: object, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error('Cannot allocate memory');
            (error as NodeJS.ErrnoException).code = 'ENOMEM';
            process.nextTick(() => callback(error, undefined));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.getAllRemotes('/project');
      expect(result).toEqual([]);
    });

    it('should handle file descriptor limit exceeded', async () => {
      mockExec.mockImplementation(
        (command: string, options: object, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error('Too many open files');
            (error as NodeJS.ErrnoException).code = 'EMFILE';
            process.nextTick(() => callback(error, undefined));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.getRemoteUrl(
        '/project',
        'origin',
      );
      expect(result).toBeNull();
    });

    it('should handle broken pipe errors', async () => {
      mockExec.mockImplementation(
        (command: string, options: object, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error('Broken pipe');
            (error as NodeJS.ErrnoException).code = 'EPIPE';
            process.nextTick(() => callback(error, undefined));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.getAllRemotes('/project');
      expect(result).toEqual([]);
    });

    it('should handle command timeout gracefully', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path.includes('.git');
      });

      mockExec.mockImplementation(
        (command: string, options: object, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            // Simulate timeout by not calling callback within timeout period
            setTimeout(() => {
              const error = new Error('Command timeout');
              (error as NodeJS.ErrnoException).code = 'TIMEOUT';
              callback(error, undefined);
            }, 100);
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository('/project');

      expect(result.isGitRepository).toBe(true);
      expect(result.error).toBe('No remotes configured');
    });

    it('should handle malformed git config gracefully', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path.includes('.git');
      });

      mockExec.mockImplementation(
        (command: string, options: object, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            if (
              command.includes('git remote') &&
              !command.includes('get-url')
            ) {
              process.nextTick(() =>
                callback(null, { stdout: 'origin\n', stderr: '' }),
              );
            } else if (command.includes('git remote get-url')) {
              const error = new Error('fatal: bad config line');
              (error as NodeJS.ErrnoException).code = 128;
              process.nextTick(() => callback(error, undefined));
            }
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository('/project');

      expect(result.isGitRepository).toBe(true);
      expect(result.error).toBe('Could not retrieve remote URL');
    });

    it('should handle repository in detached HEAD state', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path.includes('.git');
      });

      mockExec.mockImplementation(
        (command: string, options: object, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            if (
              command.includes('git remote') &&
              !command.includes('get-url')
            ) {
              process.nextTick(() =>
                callback(null, {
                  stdout: 'origin\n',
                  stderr: 'HEAD detached at abc123\n',
                }),
              );
            } else if (command.includes('git remote get-url origin')) {
              process.nextTick(() =>
                callback(null, {
                  stdout: 'https://github.com/owner/repo.git\n',
                  stderr: '',
                }),
              );
            }
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository('/project');

      expect(result.isGitRepository).toBe(true);
      expect(result.repositoryInfo).toBeDefined();
      expect(result.repositoryInfo!.owner).toBe('owner');
      expect(result.repositoryInfo!.repo).toBe('repo');
    });

    it('should handle empty repository (no commits)', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path.includes('.git');
      });

      mockExec.mockImplementation(
        (command: string, options: object, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            if (
              command.includes('git remote') &&
              !command.includes('get-url')
            ) {
              process.nextTick(() =>
                callback(null, {
                  stdout: 'origin\n',
                  stderr:
                    'warning: You appear to have cloned an empty repository.\n',
                }),
              );
            } else if (command.includes('git remote get-url origin')) {
              process.nextTick(() =>
                callback(null, {
                  stdout: 'https://github.com/owner/repo.git\n',
                  stderr: '',
                }),
              );
            }
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository('/project');

      expect(result.isGitRepository).toBe(true);
      expect(result.repositoryInfo).toBeDefined();
      expect(result.repositoryInfo!.owner).toBe('owner');
      expect(result.repositoryInfo!.repo).toBe('repo');
    });
  });

  describe('Edge cases with malformed remote URLs', () => {
    it('should handle remote URL with special characters', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path.includes('.git');
      });

      mockExec.mockImplementation(
        (command: string, options: object, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            if (
              command.includes('git remote') &&
              !command.includes('get-url')
            ) {
              process.nextTick(() =>
                callback(null, { stdout: 'origin\n', stderr: '' }),
              );
            } else if (command.includes('git remote get-url origin')) {
              process.nextTick(() =>
                callback(null, {
                  stdout: 'git@github.com:owner/repo-with-@#$%^&*().git\n',
                  stderr: '',
                }),
              );
            }
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository('/project');

      expect(result.isGitRepository).toBe(true);
      expect(result.error).toBe('Could not parse remote URL');
    });

    it('should handle remote URL with unicode characters', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path.includes('.git');
      });

      mockExec.mockImplementation(
        (command: string, options: object, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            if (
              command.includes('git remote') &&
              !command.includes('get-url')
            ) {
              process.nextTick(() =>
                callback(null, { stdout: 'origin\n', stderr: '' }),
              );
            } else if (command.includes('git remote get-url origin')) {
              process.nextTick(() =>
                callback(null, {
                  stdout: 'git@github.com:ownér/repö.git\n',
                  stderr: '',
                }),
              );
            }
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository('/project');

      expect(result.isGitRepository).toBe(true);
      expect(result.error).toBe('Could not parse remote URL');
    });

    it('should handle extremely long remote URLs', async () => {
      const longUrl =
        'git@github.com:' + 'a'.repeat(100) + '/' + 'b'.repeat(100) + '.git';

      mockExistsSync.mockImplementation((path: string) => {
        return path.includes('.git');
      });

      mockExec.mockImplementation(
        (command: string, options: object, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            if (
              command.includes('git remote') &&
              !command.includes('get-url')
            ) {
              process.nextTick(() =>
                callback(null, { stdout: 'origin\n', stderr: '' }),
              );
            } else if (command.includes('git remote get-url origin')) {
              process.nextTick(() =>
                callback(null, { stdout: longUrl + '\n', stderr: '' }),
              );
            }
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.detectRepository('/project');

      expect(result.isGitRepository).toBe(true);
      expect(result.error).toBe('Could not parse remote URL');
    });
  });
});
