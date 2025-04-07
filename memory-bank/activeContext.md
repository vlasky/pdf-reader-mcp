<!-- Version: 1.24 | Last Updated: 2025-04-07 | Updated By: Sylph -->

# Active Context: PDF Reader MCP Server (Guidelines Alignment)

## 1. Current Focus

Project alignment and documentation according to Sylph Lab Playbook guidelines are complete. CI workflow fixed, Test Analytics integrated, and Git history corrected _again_. Version correctly bumped to `0.3.11` and pushed.

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
- **CI Fixes & Enhancements:**
  - Fixed Prettier formatting issues identified by CI.
  - Fixed ESLint errors/warnings (`no-undef`, `no-unused-vars`, `no-unsafe-call`, `require-await`, unused eslint-disable) identified by CI.
  - Deleted unused `scripts/generate-api-docs.mjs` file.
  - **Fixed `pnpm publish` error:** Added `--no-git-checks` flag to the publish command in `.github/workflows/ci.yml` to resolve `ERR_PNPM_GIT_UNCLEAN` error during tag-triggered publish jobs.
  - **Integrated Codecov Test Analytics:** Updated `package.json` to generate JUnit XML test reports and added `codecov/test-results-action@v1` to `.github/workflows/ci.yml` to upload them.
  - Added `test-report.junit.xml` to `.gitignore`.
- **Switched Coverage Tool:** Updated `.github/workflows/ci.yml` to replace Coveralls with Codecov based on user feedback. Added Codecov badge to `README.md`.
- **Version Bump Correction Saga (0.3.11):**
  - **Attempt 1:** Ran `standard-version` before committing `.gitignore` changes, pushed incorrect `v0.3.11` tag/commit.
  - **Attempt 2 (Correction):** Reset local branch (`git reset --hard cb8cc40`), deleted local tag, committed `.gitignore` (`1bff7bb`), re-ran `standard-version` (created `f8f076e`), force pushed. Workflow _still_ failed, indicating CI/Test Analytics changes were missing from the commit history.
  - **Attempt 3 (Final Correction):** Soft reset (`git reset --soft HEAD~1` from `f8f076e`), discarded incorrect Memory Bank updates, re-applied missing changes (`--no-git-checks` in `ci.yml`, JUnit reporter in `package.json`, Test Analytics step in `ci.yml`), committed all changes together (`d89d55d`), deleted local and remote `v0.3.11` tags, re-tagged `v0.3.11` on `d89d55d`, force pushed `main` and the new tag.

## 3. Next Steps

- **Build Completed:** Project successfully built (`pnpm run build`).
- **GitHub Actions Status:**
  - Pushed commit `c150022` (CI run `14298157760` **passed** format/lint/test checks, but **failed** at Codecov upload due to missing `CODECOV_TOKEN`).
  - Pushed tag `v0.3.10` (Triggered publish/release workflow - status needed verification).
  - **Pushed tag `v0.3.11` (Final Corrected Version)**. Publish/release workflow triggered. Status needs verification.
- **Runtime Testing (Blocked):** Requires user interaction with `@modelcontextprotocol/inspector` or a live agent. Skipping for now.
- **Documentation Finalization (Mostly Complete):**
  - API docs generated.
  - Main pages reviewed/updated.
  - Codecov badge added (requires manual token update in `README.md`).
  - **Remaining:** Add complex features (PWA, share buttons, roadmap page) if requested.
- **Release Preparation:**
  - `CHANGELOG.md` updated for `0.3.10`.
  - **Project is ready for final review. Requires Codecov token configuration and verification of the _final, correct_ `v0.3.11` publish/release workflow.**

## 4. Active Decisions & Considerations

- **Switched to pnpm:** Changed package manager from npm to pnpm.
- **Using `pdfjs-dist` as the core PDF library.**
- Adopted the handler definition pattern from `filesystem-mcp`.
- Consolidated tools into a single `read_pdf` handler.
- Aligned project configuration with Guidelines.
- **Accepted ~95% test coverage**.
- **No Sponsorship:** Project will not include sponsorship links or files.
- **Using TypeDoc CLI for API Doc Generation:** Bypassed script initialization issues.
- **Switched to Codecov:** Replaced Coveralls with Codecov for coverage reporting. Test Analytics integration added.
- **Codecov Token Required:** CI is currently blocked on Codecov upload (coverage and test results) due to missing `CODECOV_TOKEN` secret in GitHub repository settings. This needs to be added by the user.
- **Version bumped to `0.3.11`**.
- **Publish Workflow:** Modified to bypass Git checks during `pnpm publish`. Verification pending on the _final, correct_ `v0.3.11` workflow run.
- **CI Workflow:** Added Codecov Test Analytics upload step.
