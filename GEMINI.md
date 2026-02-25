# Hyouji GitHub Label Manager

## Project Overview

This project is a command-line tool named "Hyouji" (表示), which means "display" in Japanese. It's designed to elegantly manage and display GitHub labels, bringing clarity and harmony to your repository's categorization. Built with Node.js and TypeScript, Hyouji allows users to create, delete, and import labels for their GitHub repositories, providing an interactive and efficient command-line interface.

### Key Technologies

*   **Runtime:** Node.js
*   **Language:** TypeScript
*   **Framework/Libraries:**
    *   `@octokit/core`: For interacting with the GitHub API.
    *   `@opentui/core`: For interactive terminal UI prompts (selection and input handling).
    *   `chalk`: for styling terminal output.
    *   `yaml`: For parsing YAML files.
*   **Build Tool:** Vite
*   **Testing:** Vitest
*   **Linting & Formatting:** Biome

### Architecture

The application is structured as a monolithic CLI tool. The main entry point is `src/index.ts`, which orchestrates the user interaction flow and calls various modules to handle specific tasks. Configuration, including the GitHub token, is stored in a JSON file in the user's home directory and is encrypted for security.

Interactive prompts are centralized in `src/cli/promptClient.ts`:

*   Primary path: OpenTUI (`@opentui/core`) for TUI-based selection/input.
*   Fallback path: Node readline/raw input when OpenTUI is unavailable.
*   Action selection supports `Esc` to exit (same behavior as choosing the `exit` action).

## Building and Running

### Prerequisites

*   Node.js (`>=22.22.0`)
*   A package manager like `npm`, `yarn`, `pnpm`, or `bun`.

### Installation

To run the tool from the source, first install the dependencies. The recommended package manager for this repository is `bun`:

```bash
bun install
```

Alternatively, you can use other package managers:

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Build

To build the project, run the following command:

```bash
bun run build
```

This will compile the TypeScript code and output the JavaScript files to the `dist` directory.

### Running the application

To run the application after building it, use the following command:

```bash
bun run start
```

Equivalent npm command:

```bash
npm run start
```

### Running in development mode

To build the project and watch for changes, run:

```bash
bun run dev
```

Equivalent npm command:

```bash
npm run dev
```

## Development Conventions

### Testing

The project uses Vitest for unit and integration testing. To run the tests, use the following command:

```bash
bun run test
```

Equivalent npm command:

```bash
npm run test
```

To run the tests in watch mode, use:

```bash
bun run test:watch
```

Equivalent npm command:

```bash
npm run test:watch
```

### Linting and Formatting

The project uses Biome for linting and formatting. To lint the code, run:

```bash
bun run lint
```

Equivalent npm command:

```bash
npm run lint
```

To automatically fix linting and formatting issues, run:

```bash
bun run lint:fix
```

Equivalent npm command:

```bash
npm run lint:fix
```

### Contribution Guidelines

While no explicit contribution guidelines are provided in the repository, the presence of a `CONTRIBUTING.md` file in the `.github` directory suggests that contributions are welcome. It is recommended to follow the existing coding style and to add tests for any new features or bug fixes.
