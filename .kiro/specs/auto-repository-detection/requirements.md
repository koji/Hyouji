# Requirements Document

## Introduction

この機能は、hyoujiコマンドの実行時に現在のディレクトリがGitリポジトリ内かどうかを自動検出し、ユーザーエクスペリエンスを向上させることを目的としています。現在、ユーザーは常に対象リポジトリを手動で入力する必要がありますが、この機能により、リポジトリ内で実行した場合は自動的にそのリポジトリが対象となり、リポジトリ外で実行した場合のみ入力を求めるようになります。

## Requirements

### Requirement 1

**User Story:** As a developer, I want hyouji to automatically detect when I'm running it inside a Git repository, so that I don't have to manually input the repository information every time.

#### Acceptance Criteria

1. WHEN hyouji is executed inside a Git repository THEN the system SHALL automatically detect the repository information without prompting the user
2. WHEN the current directory contains a .git folder or is within a Git repository THEN the system SHALL extract the repository owner and name from the Git remote configuration
3. WHEN multiple remotes exist THEN the system SHALL prioritize the 'origin' remote for repository detection
4. IF no 'origin' remote exists THEN the system SHALL use the first available remote

### Requirement 2

**User Story:** As a developer, I want hyouji to prompt me for repository information when I'm not inside a Git repository, so that I can still use the tool from any location.

#### Acceptance Criteria

1. WHEN hyouji is executed outside of a Git repository THEN the system SHALL prompt the user to input the target repository information
2. WHEN no .git folder is found in the current directory or any parent directories THEN the system SHALL fall back to the current manual input behavior
3. WHEN Git repository detection fails for any reason THEN the system SHALL gracefully fall back to manual input

### Requirement 3

**User Story:** As a developer, I want clear feedback about which repository hyouji has detected, so that I can confirm it's operating on the correct repository.

#### Acceptance Criteria

1. WHEN a repository is automatically detected THEN the system SHALL display the detected repository information to the user
2. WHEN displaying detected repository information THEN the system SHALL show both the owner and repository name in a clear format
3. WHEN automatic detection occurs THEN the system SHALL provide a brief confirmation message before proceeding with label operations

### Requirement 4

**User Story:** As a developer, I want hyouji to handle edge cases gracefully, so that the tool remains reliable in various Git repository configurations.

#### Acceptance Criteria

1. WHEN the Git remote URL is in SSH format (git@github.com:owner/repo.git) THEN the system SHALL correctly parse the owner and repository name
2. WHEN the Git remote URL is in HTTPS format (https://github.com/owner/repo.git) THEN the system SHALL correctly parse the owner and repository name
3. WHEN the Git remote URL has non-standard formats THEN the system SHALL handle parsing errors gracefully and fall back to manual input
4. WHEN Git commands fail or are not available THEN the system SHALL fall back to manual input without crashing
5. WHEN the detected repository information is invalid THEN the system SHALL validate the information and fall back to manual input if necessary
