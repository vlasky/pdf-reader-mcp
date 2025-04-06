<!-- Version: 1.9 | Last Updated: 2025-04-06 | Updated By: Sylph -->

# Tech Context: PDF Reader MCP Server

## 1. Core Technologies

- **Runtime:** Node.js (>= 18.0.0 recommended)
- **Language:** TypeScript (Compiled to JavaScript for execution)
- **Package Manager:** npm (Node Package Manager)
- **Linter:** ESLint (with TypeScript support, including **strict type-aware rules**)
- **Formatter:** Prettier
- **Testing:** Vitest (with **~95% coverage achieved**)
- **Git Hooks:** Husky, lint-staged, commitlint
- **Dependency Update:** Dependabot

## 2. Key Libraries/Dependencies

- **`@modelcontextprotocol/sdk`:** The official SDK for implementing MCP servers and clients.
- **`glob`:** Library for matching files using glob patterns.
- **`pdfjs-dist`:** Mozilla's PDF rendering and parsing library.
- **`zod`:** Library for schema declaration and validation.
- **`zod-to-json-schema`:** Utility to convert Zod schemas to JSON schemas.

- **Dev Dependencies (Key):**
  - **`typescript`:** TypeScript compiler (`tsc`).
  - **`@types/node`:** TypeScript type definitions for Node.js.
  - **`@types/glob`:** TypeScript type definitions for `glob`.
  - **`vitest`:** Test runner framework.
  - **`@vitest/coverage-v8`:** Coverage provider for Vitest.
  - **`eslint`:** Core ESLint library.
  - **`typescript-eslint`:** Tools for ESLint + TypeScript integration.
  - **`prettier`:** Code formatter.
  - **`eslint-config-prettier`:** Turns off ESLint rules that conflict with Prettier.
  - **`husky`:** Git hooks manager.
  - **`lint-staged`:** Run linters on staged files.
  - **`@commitlint/cli` & `@commitlint/config-conventional`:** Commit message linting.
  - **`standard-version`:** Release automation tool.
  - **`typedoc` & `typedoc-plugin-markdown`:** API documentation generation.
  - **`vitepress` & `vue`:** Documentation website framework.

## 3. Development Setup

- **Source Code:** Located in the `src` directory.
- **Testing Code:** Located in the `test` directory.
- **Main File:** `src/index.ts`.
- **Configuration:**
  - `tsconfig.json`: TypeScript compiler options (**strictest settings enabled**, includes recommended options like `declaration` and `sourceMap`).
  - `vitest.config.ts`: Vitest test runner configuration (**100% coverage thresholds set**, ~95% achieved).
  - `eslint.config.js`: ESLint flat configuration (integrates Prettier, enables **strict type-aware linting** and **additional guideline rules**).
  - `.prettierrc.cjs`: Prettier formatting rules.
  - `.gitignore`: Specifies intentionally untracked files (`node_modules/`, `build/`, `coverage/`, etc.).
  - `.github/workflows/ci.yml`: GitHub Actions workflow (validation, publishing, release, **fixed Action versions**, **Coveralls**).
  - `.github/dependabot.yml`: Automated dependency update configuration.
  - `package.json`: Project metadata, dependencies, and npm scripts (includes `start`, `typecheck`, `prepare`, `benchmark`, `release`, `clean`, `docs:api`, `prepublishOnly`, etc.).
  - `commitlint.config.cjs`: Commitlint configuration.
  - `.husky/`: Directory containing Git hook scripts.
- **Build Output:** Compiled JavaScript in the `build` directory.
- **Execution:** Run via `node build/index.js` or `npm start`.

## 4. Technical Constraints & Considerations

- **Node.js Environment:** Relies on Node.js runtime (>=18.0.0) and built-in modules.
- **Permissions:** Server process permissions affect filesystem operations.
- **Cross-Platform Compatibility:** Filesystem behaviors might differ. Code uses Node.js `path` module to mitigate.
- **Error Handling:** Relies on Node.js error codes and McpError.
- **Security Model:** Relies on `resolvePath` for path validation within `PROJECT_ROOT`.
- **Project Root Determination:** `PROJECT_ROOT` is the server's `process.cwd()`. The launching process must set this correctly.
