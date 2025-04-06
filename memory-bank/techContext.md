<!-- Version: 1.2 | Last Updated: 2025-04-06 | Updated By: Roo -->

# Tech Context: PDF Reader MCP Server

## 1. Core Technologies

- **Runtime:** Node.js (Version should be compatible with used libraries, likely >= 18)
- **Language:** TypeScript (Compiled to JavaScript for execution)
- **Package Manager:** npm (Node Package Manager)
- **Linter:** ESLint (with TypeScript support)

## 2. Key Libraries/Dependencies

- **`@modelcontextprotocol/sdk`:** The official SDK for implementing MCP servers
  and clients. Used for:
  - `Server`: Core server class.
  - `StdioServerTransport`: Communication via standard input/output.
  - Schema definitions (`CallToolRequestSchema`, `ListToolsRequestSchema`).
  - Error types (`McpError`, `ErrorCode`).
- **`glob`:** Library for matching files using glob patterns (like `*`, `**/*`,
  `*.ts`). Used extensively in `list_files` and search tools.
- **`typescript`:** TypeScript compiler (`tsc`).
- **`@types/node`:** TypeScript type definitions for Node.js built-in modules
  (`fs`, `path`, `process`, etc.).
- **`@types/glob`:** TypeScript type definitions for the `glob` library.
- **`zod`:** Library for schema declaration and validation. Used for all tool
  inputs.
- **`zod-to-json-schema`:** Utility to convert Zod schemas to JSON schemas for
  MCP tool listing.
- **`diff`:** Library for generating text differences. Used by `edit_file`.
- **`detect-indent`:** Library for detecting the dominant indentation in code.
  Used by `edit_file`.
- **`@types/diff`:** TypeScript type definitions for the `diff` library.
- **`pdfjs-dist`:** Mozilla's PDF rendering and parsing library. Used for all
  PDF operations (text extraction, metadata, page count).
- **`vitest`:** Test runner framework.
- **`@vitest/coverage-v8`:** Coverage provider for Vitest.
- **`eslint`:** Core ESLint library.
- **`typescript-eslint`:** Monorepo containing tools for ESLint + TypeScript integration (used for flat config).
- **`@typescript-eslint/parser`:** Parser that allows ESLint to lint TypeScript code.
- **`@typescript-eslint/eslint-plugin`:** ESLint plugin with TypeScript-specific rules.

## 3. Development Setup

- **Source Code:** Located in the `src` directory (`pdf-reader-mcp/src`).
- **Testing Code:** Located in the `test` directory (`pdf-reader-mcp/test`).
- **Main File:** `src/index.ts`.
- **Configuration:**
  - `tsconfig.json`: Configures the TypeScript compiler options (target ES
    version, module system, output directory, etc.). Set to output JavaScript
    files to the `build` directory.
  - `vitest.config.ts`: Configures the Vitest test runner (environment, coverage).
  - `eslint.config.js`: Configures ESLint using the flat config format.
  - `package.json`: Defines project metadata, dependencies, and npm scripts.
    - `dependencies`: `@modelcontextprotocol/sdk`, `glob`, `pdfjs-dist`, etc.
      (See package.json for full list)
    - `devDependencies`: `typescript`, `@types/node`, `@types/glob`, `vitest`, `@vitest/coverage-v8`, `eslint`, `typescript-eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, etc.
      (`pdfjs-dist` includes its own types).
    - `scripts`:
      - `build`: Compiles TypeScript code using `tsc`.
      - `watch`: Runs `tsc` in watch mode.
      - `test`: Runs tests using `vitest run`.
      - `test:coverage`: Runs tests with coverage using `vitest run --coverage`.
      - `lint`: Runs ESLint check using `eslint . --ext .ts`.
      - `lint:fix`: Runs ESLint check and automatically fixes issues using `eslint . --ext .ts --fix`.
      - `inspector`: Runs the MCP inspector against the built server.
      - `start`: (Optional, for direct testing) Runs the compiled JavaScript
        server using `node build/index.js`.
- **Build Output:** Compiled JavaScript code is placed in the `build` directory
  (`pdf-reader-mcp/build`).
- **Execution:** The server is intended to be run via `node build/index.js`.

## 4. Technical Constraints & Considerations

- **Node.js Environment:** The server relies on the Node.js runtime and its
  built-in modules, particularly `fs` (filesystem) and `path`.
- **Permissions:** The server process runs with the permissions of the user who
  started it. Filesystem operations might fail due to insufficient permissions
  on the target files/directories. `chmod` might have limited effect or fail on
  non-POSIX systems like Windows.
- **Cross-Platform Compatibility:** While Node.js aims for cross-platform
  compatibility, filesystem behaviors (path separators, case sensitivity,
  `chmod` behavior) can differ slightly between Windows, macOS, and Linux. Code
  uses `path.join`, `path.resolve`, `path.normalize`, and replaces backslashes
  (`\\`) with forward slashes (`/`) in output paths to mitigate some issues.
- **Error Handling:** Relies on Node.js error codes (`ENOENT`, `EPERM`, etc.)
  for specific filesystem error detection.
- **Security Model:** Security relies entirely on the `resolvePath` function
  correctly preventing access outside the `PROJECT_ROOT`. No other sandboxing
  mechanism is implemented.
- **Project Root Determination:** The effective `PROJECT_ROOT` for path
  resolution is the server process's current working directory
  (`process.cwd()`). This means the system launching the server (e.g., the agent
  host environment) **must** set the correct working directory corresponding to
  the target project at launch time to ensure the server operates on the
  intended files.
