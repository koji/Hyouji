# Design Document

## Overview

This design transforms the GitHub Label Manager from a build-required tool into a globally installable npm package with persistent configuration management. The solution implements a configuration storage system using the user's home directory, adds Vite as the build tool, and introduces a new settings display feature while maintaining backward compatibility with existing functionality.

## Architecture

### Package Structure

```
github-label-manager/
├── src/
│   ├── index.ts (main entry point)
│   ├── lib/
│   │   ├── configManager.ts (new - handles persistent config)
│   │   ├── inputGitHubConfig.ts (modified - integrates with config manager)
│   │   ├── selectPrompts.ts (modified - adds settings option)
│   │   └── ... (existing files)
│   ├── types/
│   │   └── index.ts (modified - adds config types)
│   └── constant.ts (modified - adds settings menu option)
├── dist/ (Vite build output)
├── package.json (modified - adds bin field, Vite config)
├── vite.config.ts (new - Vite configuration)
└── ... (existing files)
```

### Configuration Management Architecture

- **Storage Location**: `~/.config/github-label-manager/config.json`
- **Fallback Location**: `~/.github-label-manager-config.json` (for systems without .config)
- **Security**: File permissions set to 600 (owner read/write only)
- **Format**: JSON with encrypted token storage

## Components and Interfaces

### ConfigManager Class

```typescript
interface ConfigData {
  token: string;
  owner: string;
  lastUpdated: string;
}

interface ConfigManager {
  loadConfig(): Promise<ConfigData | null>;
  saveConfig(config: ConfigData): Promise<void>;
  configExists(): boolean;
  getConfigPath(): string;
  validateConfig(config: ConfigData): Promise<boolean>;
  clearConfig(): Promise<void>;
}
```

### Modified Types

```typescript
// Extended ConfigType to include persistence info
export type ConfigType = {
  readonly octokit: Octokit;
  readonly owner: string;
  readonly repo: string;
  readonly fromSavedConfig?: boolean;
};

// New type for stored configuration
export type StoredConfigType = {
  token: string;
  owner: string;
  lastUpdated: string;
};
```

### Enhanced Menu System

The action selector will be extended to include:

- Index 6: "Display your settings" (new option)
- Index 7: "Exit" (moved from index 5)

## Data Models

### Configuration File Structure

```json
{
  "token": "ghp_xxxxxxxxxxxxxxxxxxxx",
  "owner": "username",
  "lastUpdated": "2024-01-15T10:30:00.000Z"
}
```

### Package.json Modifications

```json
{
  "bin": {
    "github-label-manager": "./dist/index.js",
    "glm": "./dist/index.js"
  },
  "files": ["dist/**/*", "README.md", "LICENSE"],
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch"
  }
}
```

## Error Handling

### Configuration Errors

1. **File Access Errors**: Graceful fallback to prompting for credentials
2. **Invalid JSON**: Clear config and prompt for new credentials
3. **Token Validation Errors**: Prompt for new token while preserving owner info
4. **Permission Errors**: Attempt alternative storage locations

### Build and Distribution Errors

1. **Missing Dependencies**: Clear error messages with installation instructions
2. **Build Failures**: Detailed error reporting with troubleshooting steps
3. **CLI Command Issues**: Proper shebang and executable permissions

## Testing Strategy

### Unit Tests

- ConfigManager class methods
- Configuration validation logic
- Menu option handling
- Token encryption/decryption

### Integration Tests

- End-to-end configuration flow
- CLI command execution
- Package installation and global usage
- Cross-platform compatibility (Windows, macOS, Linux)

### Manual Testing

- Fresh installation testing
- Configuration persistence across sessions
- Settings display functionality
- Error scenarios (invalid tokens, network issues)

## Implementation Details

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'GitHubLabelManager',
      fileName: 'index',
      formats: ['cjs'],
    },
    rollupOptions: {
      external: ['@octokit/core', 'prompts', 'chalk', 'fs', 'path', 'os'],
      output: {
        banner: '#!/usr/bin/env node',
      },
    },
    target: 'node14',
  },
});
```

### Configuration Storage Strategy

1. **Primary Location**: `~/.config/github-label-manager/config.json`
2. **Directory Creation**: Automatic creation with proper permissions
3. **Token Security**: Base64 encoding (not encryption for simplicity, but obfuscated)
4. **Validation**: Token format validation and API connectivity test

### Menu Integration

The settings display option will:

1. Show configuration file path
2. Display stored GitHub username
3. Indicate token presence (without revealing it)
4. Show last updated timestamp
5. Provide option to clear configuration

### Backward Compatibility

- Existing functionality remains unchanged
- Same prompts and user experience for core features
- Graceful handling when no saved configuration exists
