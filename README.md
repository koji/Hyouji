# Hyouji(表示) GitHub Label Manager

### article

https://levelup.gitconnected.com/create-github-labels-from-terminal-158d4868fab

[![CI](https://github.com/koji/github-label-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/koji/github-label-manager/actions/workflows/ci.yml)
[![Publish](https://github.com/koji/github-label-manager/actions/workflows/publish.yml/badge.svg)](https://github.com/koji/github-label-manager/actions/workflows/publish.yml)
[![npm version](https://badge.fury.io/js/github-label-manager.svg)](https://badge.fury.io/js/github-label-manager)

A simple CLI tool to create/delete labels with GitHub Labels API. Now available as a global npm package with persistent configuration storage.

### article

https://levelup.gitconnected.com/create-github-labels-from-terminal-158d4868fab

<img width="1023" height="263" alt="Image" src="https://private-user-images.githubusercontent.com/474225/478702834-8082b045-1ce4-46a7-996b-7ff3d5944c1f.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NTUzNjgzMDYsIm5iZiI6MTc1NTM2ODAwNiwicGF0aCI6Ii80NzQyMjUvNDc4NzAyODM0LTgwODJiMDQ1LTFjZTQtNDZhNy05OTZiLTdmZjNkNTk0NGMxZi5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUwODE2JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MDgxNlQxODEzMjZaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT03ZjU0ZDUwZjAxM2E5ZTkzYzE1NmZjNjVjMDg2MjYwMWZkMjEwNTFjYjBhNDJmMDA0ZTI5Mjg2NWE3MTUyYmM3JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.5SzQX41VgBouxi1sk7srLJMZZ6Zur0JeK-P1hhN21PU" />

https://user-images.githubusercontent.com/474225/130368605-b5c6410f-53f6-4ef0-b321-8950edeebf7d.mov

### Labels API

https://docs.github.com/en/rest/reference/issues#labels

`label data format`

```json
// label format
{
  "id": 3218144327,
  "node_id": "MDU6TGFiZWwzMjE4MTQ0MzI3",
  "url": "https://api.github.com/repos/koji/frontend-tools/labels/wontfix",
  "name": "wontfix",
  "color": "ffffff",
  "default": true,
  "description": "This will not be worked on"
}
```

## Installation

Install globally via npm:

```bash
npm install -g github-label-manager
```

Or use with npx (no installation required):

```bash
npx github-label-manager
```

## Features

This tool provides the following functionality:

1. Create a single label on a specific repo
2. Create multiple labels on a specific repo
3. Delete a single label from a specific repo
4. Delete all labels from a specific repo
5. Import labels from JSON file
6. **Display your saved settings** - View your stored GitHub configuration
7. **Persistent configuration** - Save your GitHub token and username for future use

## Usage

After installation, run the tool from anywhere:

```bash
github-label-manager
```

Or use the short alias:

```bash
glm
```

### First Time Setup

On your first run, you'll be prompted to enter:

- **GitHub Personal Token** - Generate one [here](https://github.com/settings/tokens) with `repo` scope
- **GitHub Username** - Your GitHub account name

These credentials will be securely saved and reused for future sessions.

### Menu Options

1. **Create a single label on a specific repo**
2. **Create multiple labels on a specific repo**
3. **Delete a single label from a specific repo**
4. **Delete all labels from a specific repo**
5. **Import labels from JSON file**
6. **Display your settings** - View your saved configuration
7. **Exit**

### Settings Management

The tool now includes persistent configuration storage with enhanced security:

- **Automatic saving**: Your GitHub token and username are saved after first use
- **Settings display**: Use option 6 to view your current configuration
- **Secure storage**: Configuration is stored in `~/.config/github-label-manager/config.json`
- **Token encryption**: Your personal token is automatically encrypted using machine-specific keys
- **Automatic migration**: Existing plain text configurations are automatically upgraded to encrypted format
- **Token security**: Your personal token is never displayed in plain text, only an obfuscated preview is shown

### Security Features

**Token Encryption**:

- All GitHub personal tokens are automatically encrypted before being saved to disk
- Encryption uses machine-specific keys derived from your system information
- Existing plain text configurations are automatically migrated to encrypted format on first run
- Even if someone gains access to your configuration file, the token remains protected

**Privacy Protection**:

- Tokens are never displayed in plain text in the interface
- Only an obfuscated preview (e.g., `ghp_****...****3456`) is shown in settings
- The settings display shows whether your token is encrypted or in plain text format

If you want to create/delete a single label, you need to type the followings.

#### create

- label name
- label color (technically optional)
- label description (technically optional)

#### delete

- label name

In terms of multiple labels, this script is using `label.js` to define name, color and description. The format is very simple.  
If you want to put your own labels, you will need to modify `label.js` file.

```js
module.exports = Object.freeze([
  {
    name: "Type: Bug Fix",
    color: "FF8A65",
    description: "Fix features that are not working",
  },
  {
    name: "Type: Enhancement",
    color: "64B5F7",
    description: "Add new features",
  },
```

## Quick Start

1. Install the package globally:

   ```bash
   npm install -g github-label-manager
   ```

2. Run the tool:

   ```bash
   github-label-manager
   ```

3. On first run, enter your GitHub credentials when prompted

4. Select your desired operation from the menu

5. Follow the prompts to manage your repository labels

### Example Usage

```bash
# Install globally
npm i -g hyouji

# Run the tool
hyouji

# Or run without installing
npx hyouji
```

## Development

If you want to contribute or run from source:

```bash
git clone https://github.com/koji/hyouji.git
cd hyouji
npm install
npm run build
npm start
```

You can use `pnpm`, `yarn` or `bun`.

### Predefined Labels

The "Create multiple labels" option uses predefined labels from `src/constant.ts`. These include common labels for project management:

```js
{
  name: 'Type: Bug Fix',
  color: 'FF8A65',
  description: 'Fix features that are not working',
},
{
  name: 'Type: Enhancement',
  color: '64B5F7',
  description: 'Add new features',
},
// ... and many more
```

## Configuration

### Configuration File Location

Your settings are stored in:

- **Primary**: `~/.config/github-label-manager/config.json`
- **Fallback**: `~/.github-label-manager-config.json`

### Viewing Your Settings

Use the "Display your settings" menu option to:

- See your configuration file path
- View your stored GitHub username
- Check if a token is saved (without revealing the actual token)
- See when your configuration was last updated

### Clearing Configuration

If you need to reset your configuration, you can:

1. Delete the configuration file manually
2. The tool will prompt for new credentials on the next run

## Troubleshooting

### Invalid Token Error

If you see authentication errors:

1. Check that your token has the correct `repo` scope
2. Verify the token hasn't expired
3. The tool will automatically prompt for a new token if validation fails

### Permission Issues

If you encounter file permission errors:

- Ensure you have write access to your home directory
- The tool will attempt to use fallback locations if needed

## Requirements

- Node.js 10 or higher
- GitHub Personal Access Token with `repo` scope

https://user-images.githubusercontent.com/474225/130368605-b5c6410f-53f6-4ef0-b321-8950edeebf7d.mov

## Articles

- [Create GitHub Labels from Terminal](https://levelup.gitconnected.com/create-github-labels-from-terminal-158d4868fab)
- [Logical Colorful GitHub Labels](https://seantrane.com/posts/logical-colorful-github-labels-18230/)
