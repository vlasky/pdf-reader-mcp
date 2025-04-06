<!-- Version: 1.13 | Last Updated: 2025-04-06 | Updated By: Sylph -->

# Active Context: PDF Reader MCP Server (Guidelines Alignment)

## 1. Current Focus

Aligning the project configuration, structure, and CI/CD processes with the provided "TypeScript Project Development Guidelines".

## 2. Recent Changes (Chronological Summary)

- Cloned `filesystem-mcp` as a base.
- Updated `package.json` (name, version, description).
- Implemented initial PDF tools using `pdf-parse`.
- Removed unused filesystem handlers.
- Added URL support to `pdf-parse` based tools.
- Consolidated tools into a single `read_pdf` handler.
- **Switched PDF Library:** Uninstalled `pdf-parse`, installed `pdfjs-dist`.
- Rewrote the `read_pdf` handler (`src/handlers/readPdf.ts`) to use `pdfjs-dist`.
- Updated `README.md` and Memory Bank files to reflect the switch to `pdfjs-dist` and the consolidated tool.
- **Added Multiple Source Support & Per-Source Pages:** Modified `read_pdf` handler and schema to accept an array of `sources`. Moved the optional `pages` parameter into each source object.
- Created `CHANGELOG.md` and `LICENSE`.
- Updated `.github/workflows/publish.yml` initially.
- **Guidelines Alignment (Initial):**
  - Removed sponsorship information (`.github/FUNDING.yml`, `README.md` badges).
  - Updated `package.json` scripts (`lint`, `format`, `validate`, added `test:watch`, etc.) and removed unused dependencies.
  - Verified `tsconfig.json`, `eslint.config.js`, `.prettierrc.cjs`, `vitest.config.ts` alignment.
  - Updated `.gitignore`.
  - Refactored GitHub Actions workflow to `.github/workflows/ci.yml`.
  - Added tests (~95% coverage).
  - Updated Project Identity (`sylphlab` scope).
- **Guidelines Alignment (Configuration Deep Dive):**
  - Updated `package.json` with missing metadata, dev dependencies (`husky`, `lint-staged`, `commitlint`, `typedoc`, `standard-version`), scripts (`start`, `typecheck`, `prepare`, `benchmark`, `release`, `clean`, `docs:api`, `prepublishOnly`), and `files` array.
  - Updated `tsconfig.json` with missing compiler options and refined `exclude` array.
  - Updated `eslint.config.js` to enable `stylisticTypeChecked`, enforce stricter rules (`no-unused-vars`, `no-explicit-any` to `error`), and add missing recommended rules.
  - Created `.github/dependabot.yml` for automated dependency updates.
  - Updated `.github/workflows/ci.yml` to use fixed Action versions and add Coveralls integration.
  - Set up Git Hooks using Husky (`pre-commit` with `lint-staged`, `commit-msg` with `commitlint`) and created `commitlint.config.cjs`.

## 3. Next Steps

- **Build Completed:** Project successfully built (`npm run build`).
- **GitHub Actions Triggered:** Pushed existing tag `v0.4.0` to trigger `ci.yml` workflow (tag was already remote).
- **Runtime Testing (Blocked):** Requires user interaction with `@modelcontextprotocol/inspector` or a live agent. Skipping for now.
- **Documentation (In Progress):** Set up initial VitePress structure, config, placeholders, installed dependencies, confirmed scripts. Populated initial content for README, API, Design, Performance, Comparison sections. Updated VitePress config. Fixed Markdown parsing issues. Successfully built docs. Created `CONTRIBUTING.md` and added initial `CHANGELOG.md` entry. Next: Implement Benchmarking.
- **Benchmarking:** Created initial benchmark file, fixed TS errors, and successfully ran benchmarks (`npm run benchmark`) after user provided `test/fixtures/sample.pdf`.

## 4. Active Decisions & Considerations

- **Switched to pnpm:** Changed package manager from npm to pnpm to align with TypeScript guidelines recommendation. Deleted `package-lock.json` and generated `pnpm-lock.yaml`.

- **Using `pdfjs-dist` as the core PDF library.**
- Adopted the handler definition pattern from `filesystem-mcp`.
- Consolidated tools into a single `read_pdf` handler.
- Aligned project configuration (linting, formatting, testing, CI, Git Hooks, Dependabot) with the provided Guidelines.
- **Accepted ~95% test coverage**.
- **No Sponsorship:** Project will not include sponsorship links or files.
