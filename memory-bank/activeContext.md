<!-- Version: 1.17 | Last Updated: 2025-04-07 | Updated By: Sylph -->

# Active Context: PDF Reader MCP Server (Guidelines Alignment)

## 1. Current Focus

Finalizing project alignment and documentation according to Sylph Lab Playbook guidelines. Verifying CI status after fixing linting issues.

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
- **Benchmarking & Documentation:**
  - Created initial benchmark file, fixed TS errors, and successfully ran benchmarks (`pnpm run benchmark`) after user provided `test/fixtures/sample.pdf`.
  - Updated `docs/performance/index.md` with benchmark setup and initial results.
- **API Doc Generation:**
  - Initially encountered persistent TypeDoc v0.28.1 initialization error with Node.js script.
  - **Resolved:** Changed `docs:api` script in `package.json` to directly call TypeDoc CLI (`typedoc --entryPoints ...`). Successfully generated API docs.
- **Documentation Finalization:**
  - Reviewed and updated `README.md`, `docs/guide/getting-started.md`, and VitePress config (`docs/.vitepress/config.mts`) based on guidelines.
- **Code Commit:** Committed and pushed all recent changes.
- **CI Fixes:**
  - Fixed Prettier formatting issues identified by CI.
  - Fixed ESLint errors/warnings (`no-undef`, `no-unused-vars`, `no-unsafe-call`, `require-await`, unused eslint-disable) identified by CI.
  - Deleted unused `scripts/generate-api-docs.mjs` file.
  - Pushed fixes to trigger CI again.

## 3. Next Steps

- **Build Completed:** Project successfully built (`pnpm run build`).
- **GitHub Actions Status:**
  - Pushed existing tag `v0.4.0` (failed due to initial lint/format issues).
  - Pushed commit `03646d7` (failed due to initial lint/format issues).
  - Pushed commit `5344783` (failed due to lint issues).
  - Pushed commit `ffc1bdd` (failed due to format issues).
  - Pushed commit `97a8335` (failed due to format issues).
  - Pushed commit `a91d313` (CI run `14297879907` **passed** format/lint/test checks, but **failed** at Coveralls upload due to Coveralls internal server error).
- **Runtime Testing (Blocked):** Requires user interaction with `@modelcontextprotocol/inspector` or a live agent. Skipping for now.
- **Documentation Finalization (Mostly Complete):**
  - API docs generated.
  - Main pages reviewed/updated.
  - **Remaining:** Add complex features (PWA, share buttons, roadmap page) if requested.
- **Release Preparation:**
  - `CHANGELOG.md` updated for `1.0.0`.
  - Consider using `standard-version` or similar for final release tagging/publishing.
  - **Project is ready for final review.**

## 4. Active Decisions & Considerations

- **Switched to pnpm:** Changed package manager from npm to pnpm.
- **Using `pdfjs-dist` as the core PDF library.**
- Adopted the handler definition pattern from `filesystem-mcp`.
- Consolidated tools into a single `read_pdf` handler.
- Aligned project configuration with Guidelines.
- **Accepted ~95% test coverage**.
- **No Sponsorship:** Project will not include sponsorship links or files.
- **Using TypeDoc CLI for API Doc Generation:** Bypassed script initialization issues.
- **Ignoring Coveralls Failure:** The CI failure is external to the project code and related to Coveralls service. Core checks passed.
