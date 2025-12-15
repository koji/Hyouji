# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.0.16](2025-12-14)

- feat: add optional dry-run flow for create/delete/import actions so users can preview changes without API calls
- ux: show clearer progress logs plus per-action summaries of created/deleted/skipped/failed label operations
- fix: improve label import validation and sequential preset creation handling

### [0.0.15](2025-12-14)

- refactor: reorganize source into feature folders (`src/cli`, `src/config`, `src/github`, `src/labels`, `src/utils`) and remove legacy `src/lib`
- tests: move unit/integration tests alongside their modules and update import paths
- build: keep entrypoint and configs pointing to new layout; no behavioral changes intended

### [0.0.6](2025-08-23)

- fix message display bugs

### [0.0.5](2025-08-18)

- fix bug #56
- fix oh-my-logo method from renderFilled to render (renderFilled returns void, render returns string)

### 0.0.4 (2025-08-18)

- clean up repo
- fix readme file path issue

### 0.0.3 (2025-08-17)

#### Features

- **logo**: Added colorful ASCII art logo using oh-my-logo library
- **build**: Migrated from CommonJS to ES modules for better compatibility
- **types**: Added TypeScript declarations for oh-my-logo package

#### Technical Changes

- Updated build output from `index.cjs` to `index.js` (ES modules)
- Added oh-my-logo dependency for enhanced visual branding
- Updated CI/CD workflows to handle ES module build artifacts
- Improved TypeScript compilation with proper type declarations

### 0.0.2 (2021-08-24)

Add confirmation for a personal token

### 0.0.1 (2021-08-22)

Initial version
