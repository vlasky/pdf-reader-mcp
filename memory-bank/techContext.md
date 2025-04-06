<!-- Version: 1.4 | Last Updated: 2025-04-06 | Updated By: Roo -->

# Tech Context: PDF Reader MCP Server

## 1. Core Technologies

- **Runtime:** Node.js (Version should be compatible with used libraries, likely >= 18)
- **Language:** TypeScript (Compiled to JavaScript for execution)
- **Package Manager:** npm (Node Package Manager)
- **Linter:** ESLint (with TypeScript support, including type-aware rules)
- **Formatter:** Prettier

## 2. Key Libraries/Dependencies

- **`@modelcontextprotocol/sdk`:** The official SDK for implementing MCP servers and clients.
- **`glob`:** Library for matching files using glob patterns.
- **`typescript`:** TypeScript compiler (`tsc`).
- **`@types/node`:** TypeScript type definitions for Node.js built-in modules.
- **`@types/glob`:** TypeScript type definitions for the `glob` library.
- **`zod`:** Library for schema declaration and validation.
- **`zod-to-json-schema`:** Utility to convert Zod schemas to JSON schemas.
- **`diff`:** Library for generating text differences (used by inherited `edit_file`).
- **`detect-indent`:** Library for detecting indentation (used by inherited `edit_file`).
- **`@types/diff`:** TypeScript type definitions for the `diff` library.
- **`pdfjs-dist`:** Mozilla's PDF rendering and parsing library.
- **`vitest`:** Test runner framework.
- **`@vitest/coverage-v8`:** Coverage provider for Vitest.
- **`eslint`:** Core ESLint library.
- **`typescript-eslint`:** Tools for ESLint + TypeScript integration.
- **`@typescript-eslint/parser`:** Parser for ESLint to lint TypeScript.
- **`@typescript-eslint/eslint-plugin`:** ESLint plugin with TypeScript-specific rules.
- **`prettier`:** Code formatter.
- **`eslint-config-prettier`:** Turns off ESLint rules that conflict with Prettier.

## 3. Development Setup

- **Source Code:** Located in the `src` directory.
- **Testing Code:** Located in the `test` directory.
- **Main File:** `src/index.ts`.
- **Configuration:**
  - `tsconfig.json`: TypeScript compiler options.
  - `vitest.config.ts`: Vitest test runner configuration.
  - `eslint.config.js`: ESLint flat configuration (integrates Prettier rules, enables type-aware linting for TS files).
  - `.prettierrc.cjs`: Prettier formatting rules (using CommonJS).
  - `package.json`: Project metadata, dependencies, and npm scripts.
    - `dependencies`: (See package.json for full list)
    - `devDependencies`: (Includes TypeScript, Vitest, ESLint, Prettier related packages - See package.json for full list)
    - `scripts`:
      - `build`: Compiles TypeScript.
      - `watch`: Compiles TypeScript in watch mode.
      - `test`: Runs tests.
      - `test:coverage`: Runs tests with coverage.
      - `lint`: Runs ESLint check (including type-aware rules).
      - `lint:fix`: Runs ESLint check and fixes issues.
      - `format`: Formats code using Prettier.
      - `check-format`: Checks if code formatting matches Prettier rules.
      - `inspector`: Runs the MCP inspector.
      - `start`: Runs the compiled server.
- **Build Output:** Compiled JavaScript in the `build` directory.
- **Execution:** Run via `node build/index.js`.

## 4. Technical Constraints & Considerations

- **Node.js Environment:** Relies on Node.js runtime and built-in modules.
- **Permissions:** Server process permissions affect filesystem operations.
- **Cross-Platform Compatibility:** Filesystem behaviors might differ. Code uses Node.js `path` module to mitigate.
- **Error Handling:** Relies on Node.js error codes and McpError.
- **Security Model:** Relies on `resolvePath` for path validation within `PROJECT_ROOT`.
- **Project Root Determination:** `PROJECT_ROOT` is the server's `process.cwd()`. The launching process must set this correctly.
