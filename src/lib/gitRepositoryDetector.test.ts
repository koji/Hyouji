import { exec, ExecOptions } from 'child_process';
import { existsSync } from 'fs';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GitRepositoryDetector } from './gitRepositoryDetector';

// Type for exec callback function
type ExecCallback = (
  error: Error | null,
  stdout: string,
  stderr: string,
) => void;

// Mock child_process and fs modules
vi.mock('child_process', () => ({
  exec: vi.fn(),
}));
vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

const mockExec = vi.mocked(exec);
const mockExistsSync = vi.mocked(existsSync);

describe('GitRepositoryDetector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('findGitRoot', () => {
    it('should find git root in current directory', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path.includes('.git');
      });

      const result = await GitRepositoryDetector.findGitRoot('/project');
      expect(result).toBe('/project');
      expect(mockExistsSync).toHaveBeenCalledWith('/project/.git');
    });

    it('should find git root in parent directory', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path === '/project/.git';
      });

      const result = await GitRepositoryDetector.findGitRoot('/project/src');
      expect(result).toBe('/project');
    });

    it('should return null when no git root found', async () => {
      mockExistsSync.mockReturnValue(false);

      const result = await GitRepositoryDetector.findGitRoot('/no-git');
      expect(result).toBeNull();
    });

    it('should handle root directory without infinite loop', async () => {
      mockExistsSync.mockReturnValue(false);

      const result = await GitRepositoryDetector.findGitRoot('/');
      expect(result).toBeNull();
    });
  });

  describe('getAllRemotes', () => {
    it('should return array of remotes', async () => {
      mockExec.mockImplementation(
        (
          command: string,
          options: ExecOptions,
          callback?: (
            error: Error | null,
            stdout: string,
            stderr: string,
          ) => void,
        ) => {
          if (typeof callback === 'function') {
            process.nextTick(() => callback(null, 'origin\nupstream\n', ''));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.getAllRemotes('/project');
      expect(result).toEqual(['origin', 'upstream']);
    });

    it('should return empty array when no remotes', async () => {
      mockExec.mockImplementation(
        (command: string, options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            process.nextTick(() => callback(null, '', ''));
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.getAllRemotes('/project');
      expect(result).toEqual([]);
    });

    it('should return empty array on git command error', async () => {
      mockExec.mockImplementation(
        (command: string, options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            process.nextTick(() =>
              callback(new Error('Git not found'), '', ''),
            );
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.getAllRemotes('/project');
      expect(result).toEqual([]);
    });

    it('should filter out empty remote names', async () => {
      mockExec.mockImplementation(
        (command: string, options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            process.nextTick(() =>
              callback(null, 'origin\n\nupstream\n\n', ''),
            );
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.getAllRemotes('/project');
      expect(result).toEqual(['origin', 'upstream']);
    });
  });

  describe('getRemoteUrl', () => {
    it('should return remote URL for valid remote', async () => {
      mockExec.mockImplementation(
        (command: string, options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            process.nextTick(() =>
              callback(null, 'git@github.com:owner/repo.git\n', ''),
            );
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.getRemoteUrl(
        '/project',
        'origin',
      );
      expect(result).toBe('git@github.com:owner/repo.git');
    });

    it('should return null for non-existent remote', async () => {
      mockExec.mockImplementation(
        (command: string, options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            process.nextTick(() =>
              callback(new Error('No such remote'), '', ''),
            );
          }
          return {} as ReturnType<typeof exec>;
        },
      );

      const result = await GitRepositoryDetector.getRemoteUrl(
        '/project',
        'nonexistent',
      );
      expect(result).toBeNull();
    });

    it('should return null for empty stdout', async () => {
      mockExec.mockImplementation(
        (command: string, options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            process.nextTick(() => callback(null, '', ''));
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

    it('should handle timeout errors', async () => {
      mockExec.mockImplementation(
        (command: string, options: ExecOptions, callback?: ExecCallback) => {
          if (typeof callback === 'function') {
            const error = new Error('Command timeout') as Error & {
              code: string;
            };
            error.code = 'TIMEOUT';
            process.nextTick(() => callback(error, '', ''));
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
  });

  describe('detectRepository', () => {
    describe('successful detection scenarios', () => {
      it('should detect repository with origin remote', async () => {
        // Mock findGitRoot
        mockExistsSync.mockImplementation((path: string) => {
          return path.includes('.git');
        });

        // Mock getAllRemotes and getRemoteUrl
        mockExec.mockImplementation(
          (command: string, options: ExecOptions, callback?: ExecCallback) => {
            if (typeof callback === 'function') {
              if (
                command.includes('git remote') &&
                !command.includes('get-url')
              ) {
                process.nextTick(() =>
                  callback(null, 'origin\nupstream\n', ''),
                );
              } else if (command.includes('git remote get-url origin')) {
                process.nextTick(() =>
                  callback(null, 'git@github.com:owner/repo.git\n', ''),
                );
              }
            }
            return {} as ReturnType<typeof exec>;
          },
        );

        const result = await GitRepositoryDetector.detectRepository('/project');

        expect(result.isGitRepository).toBe(true);
        expect(result.repositoryInfo).toEqual({
          owner: 'owner',
          repo: 'repo',
          remoteUrl: 'git@github.com:owner/repo.git',
          detectionMethod: 'origin',
        });
      });

      it('should fallback to first remote when origin not available', async () => {
        mockExistsSync.mockImplementation((path: string) => {
          return path.includes('.git');
        });

        mockExec.mockImplementation(
          (command: string, options: ExecOptions, callback?: ExecCallback) => {
            if (typeof callback === 'function') {
              if (
                command.includes('git remote') &&
                !command.includes('get-url')
              ) {
                process.nextTick(() => callback(null, 'upstream\nfork\n', ''));
              } else if (command.includes('git remote get-url upstream')) {
                process.nextTick(() =>
                  callback(null, 'https://github.com/owner/repo.git\n', ''),
                );
              }
            }
            return {} as ReturnType<typeof exec>;
          },
        );

        const result = await GitRepositoryDetector.detectRepository('/project');

        expect(result.isGitRepository).toBe(true);
        expect(result.repositoryInfo).toEqual({
          owner: 'owner',
          repo: 'repo',
          remoteUrl: 'https://github.com/owner/repo.git',
          detectionMethod: 'first-remote',
        });
      });
    });

    describe('error handling scenarios', () => {
      it('should handle not a git repository', async () => {
        mockExistsSync.mockReturnValue(false);

        const result = await GitRepositoryDetector.detectRepository('/not-git');

        expect(result.isGitRepository).toBe(false);
        expect(result.error).toBe('Not a Git repository');
      });

      it('should handle no remotes configured', async () => {
        mockExistsSync.mockImplementation((path: string) => {
          return path.includes('.git');
        });

        mockExec.mockImplementation(
          (command: string, options: ExecOptions, callback?: ExecCallback) => {
            if (typeof callback === 'function') {
              process.nextTick(() => callback(null, '', ''));
            }
            return {} as ReturnType<typeof exec>;
          },
        );

        const result = await GitRepositoryDetector.detectRepository('/project');

        expect(result.isGitRepository).toBe(true);
        expect(result.error).toBe('No remotes configured');
      });

      it('should handle git command not available in getAllRemotes', async () => {
        mockExistsSync.mockImplementation((path: string) => {
          return path.includes('.git');
        });

        mockExec.mockImplementation(
          (command: string, options: ExecOptions, callback?: ExecCallback) => {
            if (typeof callback === 'function') {
              process.nextTick(() =>
                callback(new Error('git: command not found'), '', ''),
              );
            }
            return {} as ReturnType<typeof exec>;
          },
        );

        const result = await GitRepositoryDetector.detectRepository('/project');

        // When git command is not available, getAllRemotes returns empty array
        // which leads to "No remotes configured" error, not the git command error
        expect(result.isGitRepository).toBe(true);
        expect(result.error).toBe('No remotes configured');
      });

      it('should handle filesystem errors during git root detection', async () => {
        mockExistsSync.mockImplementation(() => {
          throw new Error('Permission denied');
        });

        const result = await GitRepositoryDetector.detectRepository('/project');

        expect(result.isGitRepository).toBe(false);
        expect(result.error).toBe('Permission denied');
      });

      it('should handle could not retrieve remote URL', async () => {
        mockExistsSync.mockImplementation((path: string) => {
          return path.includes('.git');
        });

        mockExec.mockImplementation(
          (command: string, options: ExecOptions, callback?: ExecCallback) => {
            if (typeof callback === 'function') {
              if (
                command.includes('git remote') &&
                !command.includes('get-url')
              ) {
                process.nextTick(() => callback(null, 'origin\n', ''));
              } else if (command.includes('git remote get-url')) {
                process.nextTick(() =>
                  callback(new Error('Remote not found'), '', ''),
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

      it('should handle invalid remote URL', async () => {
        mockExistsSync.mockImplementation((path: string) => {
          return path.includes('.git');
        });

        mockExec.mockImplementation(
          (command: string, options: ExecOptions, callback?: ExecCallback) => {
            if (typeof callback === 'function') {
              if (
                command.includes('git remote') &&
                !command.includes('get-url')
              ) {
                process.nextTick(() => callback(null, 'origin\n', ''));
              } else if (command.includes('git remote get-url origin')) {
                process.nextTick(() => callback(null, 'invalid-url\n', ''));
              }
            }
            return {} as ReturnType<typeof exec>;
          },
        );

        const result = await GitRepositoryDetector.detectRepository('/project');

        expect(result.isGitRepository).toBe(true);
        expect(result.error).toBe('Could not parse remote URL');
      });

      it('should handle unexpected errors gracefully', async () => {
        mockExistsSync.mockImplementation(() => {
          throw new Error('Filesystem error');
        });

        const result = await GitRepositoryDetector.detectRepository('/project');

        expect(result.isGitRepository).toBe(false);
        expect(result.error).toBe('Filesystem error');
      });
    });

    describe('integration tests', () => {
      it('should handle non-git directory gracefully', async () => {
        // Test in a temporary directory that's not a git repository
        const result = await GitRepositoryDetector.detectRepository('/tmp');

        expect(result.isGitRepository).toBe(false);
        expect(result.error).toBe('Not a Git repository');
      });

      it('should detect current repository if run in git directory', async () => {
        // This test will work if run in the actual git repository
        const result = await GitRepositoryDetector.detectRepository();

        // We can't guarantee the exact result since it depends on the environment,
        // but we can test that it doesn't crash and returns a valid structure
        expect(result).toHaveProperty('isGitRepository');
        if (result.isGitRepository && result.repositoryInfo) {
          expect(result.repositoryInfo).toHaveProperty('owner');
          expect(result.repositoryInfo).toHaveProperty('repo');
          expect(result.repositoryInfo).toHaveProperty('remoteUrl');
          expect(result.repositoryInfo).toHaveProperty('detectionMethod');
          expect(['origin', 'first-remote']).toContain(
            result.repositoryInfo.detectionMethod,
          );
        }
      });
    });

    describe('method orchestration', () => {
      it('should use current working directory when no cwd provided', async () => {
        mockExistsSync.mockReturnValue(false);

        const result = await GitRepositoryDetector.detectRepository();

        expect(result.isGitRepository).toBe(false);
        expect(result.error).toBe('Not a Git repository');
      });

      it('should prioritize origin remote over others', async () => {
        mockExistsSync.mockImplementation((path: string) => {
          return path.includes('.git');
        });

        mockExec.mockImplementation(
          (command: string, options: ExecOptions, callback?: ExecCallback) => {
            if (typeof callback === 'function') {
              if (
                command.includes('git remote') &&
                !command.includes('get-url')
              ) {
                process.nextTick(() =>
                  callback(null, 'upstream\norigin\nfork\n', ''),
                );
              } else if (command.includes('git remote get-url origin')) {
                process.nextTick(() =>
                  callback(null, 'git@github.com:owner/repo.git\n', ''),
                );
              }
            }
            return {} as ReturnType<typeof exec>;
          },
        );

        const result = await GitRepositoryDetector.detectRepository('/project');

        expect(result.isGitRepository).toBe(true);
        expect(result.repositoryInfo?.detectionMethod).toBe('origin');
      });
    });
  });

  describe('parseGitUrl', () => {
    describe('SSH format URLs', () => {
      it('should parse SSH URL with .git extension', () => {
        const url = 'git@github.com:owner/repo.git';
        const result = GitRepositoryDetector.parseGitUrl(url);

        expect(result).toEqual({
          owner: 'owner',
          repo: 'repo',
        });
      });

      it('should parse SSH URL without .git extension', () => {
        const url = 'git@github.com:owner/repo';
        const result = GitRepositoryDetector.parseGitUrl(url);

        expect(result).toEqual({
          owner: 'owner',
          repo: 'repo',
        });
      });

      it('should parse SSH URL with hyphens in owner and repo', () => {
        const url = 'git@github.com:my-owner/my-repo.git';
        const result = GitRepositoryDetector.parseGitUrl(url);

        expect(result).toEqual({
          owner: 'my-owner',
          repo: 'my-repo',
        });
      });

      it('should parse SSH URL with numbers in owner and repo', () => {
        const url = 'git@github.com:owner123/repo456.git';
        const result = GitRepositoryDetector.parseGitUrl(url);

        expect(result).toEqual({
          owner: 'owner123',
          repo: 'repo456',
        });
      });
    });

    describe('HTTPS format URLs', () => {
      it('should parse HTTPS URL with .git extension', () => {
        const url = 'https://github.com/owner/repo.git';
        const result = GitRepositoryDetector.parseGitUrl(url);

        expect(result).toEqual({
          owner: 'owner',
          repo: 'repo',
        });
      });

      it('should parse HTTPS URL without .git extension', () => {
        const url = 'https://github.com/owner/repo';
        const result = GitRepositoryDetector.parseGitUrl(url);

        expect(result).toEqual({
          owner: 'owner',
          repo: 'repo',
        });
      });

      it('should parse HTTPS URL with trailing slash', () => {
        const url = 'https://github.com/owner/repo/';
        const result = GitRepositoryDetector.parseGitUrl(url);

        expect(result).toEqual({
          owner: 'owner',
          repo: 'repo',
        });
      });

      it('should parse HTTPS URL with hyphens in owner and repo', () => {
        const url = 'https://github.com/my-owner/my-repo.git';
        const result = GitRepositoryDetector.parseGitUrl(url);

        expect(result).toEqual({
          owner: 'my-owner',
          repo: 'my-repo',
        });
      });
    });

    describe('HTTP format URLs', () => {
      it('should parse HTTP URL with .git extension', () => {
        const url = 'http://github.com/owner/repo.git';
        const result = GitRepositoryDetector.parseGitUrl(url);

        expect(result).toEqual({
          owner: 'owner',
          repo: 'repo',
        });
      });

      it('should parse HTTP URL without .git extension', () => {
        const url = 'http://github.com/owner/repo';
        const result = GitRepositoryDetector.parseGitUrl(url);

        expect(result).toEqual({
          owner: 'owner',
          repo: 'repo',
        });
      });
    });

    describe('Input validation and error handling', () => {
      it('should return null for empty string', () => {
        const result = GitRepositoryDetector.parseGitUrl('');
        expect(result).toBeNull();
      });

      it('should return null for whitespace-only string', () => {
        const result = GitRepositoryDetector.parseGitUrl('   ');
        expect(result).toBeNull();
      });

      it('should return null for null input', () => {
        const result = GitRepositoryDetector.parseGitUrl(
          null as unknown as string,
        );
        expect(result).toBeNull();
      });

      it('should return null for undefined input', () => {
        const result = GitRepositoryDetector.parseGitUrl(
          undefined as unknown as string,
        );
        expect(result).toBeNull();
      });

      it('should return null for non-string input', () => {
        const result = GitRepositoryDetector.parseGitUrl(
          123 as unknown as string,
        );
        expect(result).toBeNull();
      });

      it('should handle URLs with leading/trailing whitespace', () => {
        const url = '  git@github.com:owner/repo.git  ';
        const result = GitRepositoryDetector.parseGitUrl(url);

        expect(result).toEqual({
          owner: 'owner',
          repo: 'repo',
        });
      });
    });

    describe('Malformed URLs', () => {
      it('should return null for non-GitHub SSH URL', () => {
        const url = 'git@gitlab.com:owner/repo.git';
        const result = GitRepositoryDetector.parseGitUrl(url);
        expect(result).toBeNull();
      });

      it('should return null for non-GitHub HTTPS URL', () => {
        const url = 'https://gitlab.com/owner/repo.git';
        const result = GitRepositoryDetector.parseGitUrl(url);
        expect(result).toBeNull();
      });

      it('should return null for malformed SSH URL', () => {
        const url = 'git@github.com/owner/repo.git';
        const result = GitRepositoryDetector.parseGitUrl(url);
        expect(result).toBeNull();
      });

      it('should return null for URL with missing owner', () => {
        const url = 'git@github.com:/repo.git';
        const result = GitRepositoryDetector.parseGitUrl(url);
        expect(result).toBeNull();
      });

      it('should return null for URL with missing repo', () => {
        const url = 'git@github.com:owner/.git';
        const result = GitRepositoryDetector.parseGitUrl(url);
        expect(result).toBeNull();
      });

      it('should return null for URL with invalid characters in owner', () => {
        const url = 'git@github.com:owner@invalid/repo.git';
        const result = GitRepositoryDetector.parseGitUrl(url);
        expect(result).toBeNull();
      });

      it('should return null for URL with invalid characters in repo', () => {
        const url = 'git@github.com:owner/repo@invalid.git';
        const result = GitRepositoryDetector.parseGitUrl(url);
        expect(result).toBeNull();
      });

      it('should return null for URL with consecutive hyphens', () => {
        const url = 'git@github.com:owner--invalid/repo.git';
        const result = GitRepositoryDetector.parseGitUrl(url);
        expect(result).toBeNull();
      });

      it('should return null for URL with hyphen at start', () => {
        const url = 'git@github.com:-owner/repo.git';
        const result = GitRepositoryDetector.parseGitUrl(url);
        expect(result).toBeNull();
      });

      it('should return null for URL with hyphen at end', () => {
        const url = 'git@github.com:owner/repo-.git';
        const result = GitRepositoryDetector.parseGitUrl(url);
        expect(result).toBeNull();
      });

      it('should return null for URL with too long identifier', () => {
        const longName = 'a'.repeat(40); // 40 characters, exceeds GitHub limit of 39
        const url = `git@github.com:${longName}/repo.git`;
        const result = GitRepositoryDetector.parseGitUrl(url);
        expect(result).toBeNull();
      });

      it('should return null for completely invalid URL', () => {
        const url = 'not-a-url-at-all';
        const result = GitRepositoryDetector.parseGitUrl(url);
        expect(result).toBeNull();
      });

      it('should return null for URL with spaces in path', () => {
        const url = 'git@github.com:owner with spaces/repo.git';
        const result = GitRepositoryDetector.parseGitUrl(url);
        expect(result).toBeNull();
      });

      it('should return null for HTTPS URL with extra path segments', () => {
        const url = 'https://github.com/owner/repo/extra/path.git';
        const result = GitRepositoryDetector.parseGitUrl(url);
        expect(result).toBeNull();
      });
    });

    describe('Edge cases', () => {
      it('should handle single character owner and repo', () => {
        const url = 'git@github.com:a/b.git';
        const result = GitRepositoryDetector.parseGitUrl(url);

        expect(result).toEqual({
          owner: 'a',
          repo: 'b',
        });
      });

      it('should handle maximum length identifiers (39 characters)', () => {
        const maxLengthName = 'a'.repeat(39);
        const url = `git@github.com:${maxLengthName}/${maxLengthName}.git`;
        const result = GitRepositoryDetector.parseGitUrl(url);

        expect(result).toEqual({
          owner: maxLengthName,
          repo: maxLengthName,
        });
      });

      it('should handle mixed case identifiers', () => {
        const url = 'git@github.com:MyOwner/MyRepo.git';
        const result = GitRepositoryDetector.parseGitUrl(url);

        expect(result).toEqual({
          owner: 'MyOwner',
          repo: 'MyRepo',
        });
      });
    });

    describe('Performance and timeout handling', () => {
      it('should handle command timeouts gracefully', async () => {
        mockExistsSync.mockImplementation((path: string) => {
          return path.includes('.git');
        });

        mockExec.mockImplementation(
          (command: string, options: ExecOptions, callback?: ExecCallback) => {
            // Simulate timeout by calling callback with timeout error after a short delay
            if (typeof callback === 'function') {
              setTimeout(() => {
                const error = new Error('Command timeout') as Error & {
                  code: string;
                };
                error.code = 'TIMEOUT';
                callback(error, '', '');
              }, 10);
            }
            return {} as ReturnType<typeof exec>;
          },
        );

        // This should timeout and return empty array for getAllRemotes
        const result = await GitRepositoryDetector.getAllRemotes('/project');
        expect(result).toEqual([]);
      });

      it('should handle very long directory paths', async () => {
        const longPath =
          '/very/long/path/that/goes/on/and/on/and/on/and/on/project';
        mockExistsSync.mockReturnValue(false);

        const result = await GitRepositoryDetector.findGitRoot(longPath);
        expect(result).toBeNull();
      });
    });

    describe('GitHub identifier validation edge cases', () => {
      it('should reject identifiers that are too short (empty)', () => {
        const url = 'git@github.com:/.git';
        const result = GitRepositoryDetector.parseGitUrl(url);
        expect(result).toBeNull();
      });

      it('should accept identifiers at the boundary (39 characters)', () => {
        const maxName = 'a'.repeat(39);
        const url = `git@github.com:${maxName}/${maxName}.git`;
        const result = GitRepositoryDetector.parseGitUrl(url);

        expect(result).toEqual({
          owner: maxName,
          repo: maxName,
        });
      });

      it('should handle identifiers with numbers at boundaries', () => {
        const url = 'git@github.com:1owner1/2repo2.git';
        const result = GitRepositoryDetector.parseGitUrl(url);

        expect(result).toEqual({
          owner: '1owner1',
          repo: '2repo2',
        });
      });
    });

    describe('Complex integration scenarios', () => {
      it('should handle repository with multiple remotes and origin priority', async () => {
        mockExistsSync.mockImplementation((path: string) => {
          return path.includes('.git');
        });

        mockExec.mockImplementation(
          (command: string, options: ExecOptions, callback?: ExecCallback) => {
            if (typeof callback === 'function') {
              if (
                command.includes('git remote') &&
                !command.includes('get-url')
              ) {
                process.nextTick(() =>
                  callback(null, 'fork\nupstream\norigin\n', ''),
                );
              } else if (command.includes('git remote get-url origin')) {
                process.nextTick(() =>
                  callback(null, 'git@github.com:main/project.git\n', ''),
                );
              }
            }
            return {} as ReturnType<typeof exec>;
          },
        );

        const result = await GitRepositoryDetector.detectRepository('/project');

        expect(result.isGitRepository).toBe(true);
        expect(result.repositoryInfo?.detectionMethod).toBe('origin');
        expect(result.repositoryInfo?.owner).toBe('main');
        expect(result.repositoryInfo?.repo).toBe('project');
      });

      it('should handle repository where origin fails but first remote succeeds', async () => {
        mockExistsSync.mockImplementation((path: string) => {
          return path.includes('.git');
        });

        mockExec.mockImplementation(
          (command: string, options: ExecOptions, callback?: ExecCallback) => {
            if (typeof callback === 'function') {
              if (
                command.includes('git remote') &&
                !command.includes('get-url')
              ) {
                process.nextTick(() => callback(null, 'upstream\nfork\n', ''));
              } else if (command.includes('git remote get-url upstream')) {
                process.nextTick(() =>
                  callback(null, 'https://github.com/fork/project.git\n', ''),
                );
              }
            }
            return {} as ReturnType<typeof exec>;
          },
        );

        const result = await GitRepositoryDetector.detectRepository('/project');

        expect(result.isGitRepository).toBe(true);
        expect(result.repositoryInfo?.detectionMethod).toBe('first-remote');
        expect(result.repositoryInfo?.owner).toBe('fork');
        expect(result.repositoryInfo?.repo).toBe('project');
      });

      it('should handle nested git repository detection', async () => {
        mockExistsSync.mockImplementation((path: string) => {
          // Simulate nested structure where .git is found in parent
          return path === '/project/.git';
        });

        const result =
          await GitRepositoryDetector.findGitRoot('/project/src/lib');
        expect(result).toBe('/project');
      });
    });
  });
});
