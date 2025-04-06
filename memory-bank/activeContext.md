<!-- Version: 1.2 | Last Updated: 2025-04-06 | Updated By: Sylph -->

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
- **Guidelines Alignment:**
  - Removed sponsorship information (`.github/FUNDING.yml`, `README.md` badges) per Guideline #9.
  - Updated `package.json` scripts (`lint`, `format`, `validate`, added `test:watch`, etc.) and removed unused dependencies (`diff`, `detect-indent`, `@types/diff`) per Guidelines #3 & #1.
  - Verified `tsconfig.json`, `eslint.config.js`, `.prettierrc.cjs`, `vitest.config.ts` align with Guidelines.
  - Updated `.gitignore` to include `dist/` and `coverage/`.
  - Renamed and refactored GitHub Actions workflow to `.github/workflows/ci.yml` to better align with Guideline #8 (separate validate/publish/release jobs, PR trigger, auto release notes).
  - Added tests to improve coverage for `readPdf.ts`, reaching ~95%. Accepted this level due to difficulty covering Zod-protected/edge-case error paths.
  - **Updated Project Identity:** Changed GitHub repository URL to `sylphlab/pdf-reader-mcp` and NPM package name to `@sylphlab/pdf-reader-mcp` across relevant project files (`package.json`, `README.md`, `ci.yml`, `LICENSE`).

## 3. Next Steps

- Build the project (`npm run build`).
- Test the updated GitHub Actions workflow (`ci.yml`) by pushing a tag (e.g., `v0.4.0`).
- Commit changes to the Git repository.
- Perform runtime testing using `@modelcontextprotocol/inspector` or a live agent.
- **Documentation (Major):** Rewrite `README.md`, set up VitePress, create detailed content per Guideline #6.
- **Benchmarking:** Implement and run benchmark tests per Guideline #5.

## 4. Active Decisions & Considerations

- **Using `pdfjs-dist` as the core PDF library.**
- Adopted the handler definition pattern from `filesystem-mcp`.
- Consolidated tools into a single `read_pdf` handler with multi-source and per-source page support.
- Aligned project configuration (linting, formatting, testing, CI) with the provided Guidelines.
- **Accepted ~95% test coverage** as sufficient given the nature of the remaining uncovered lines (protected by Zod validation or extreme edge cases).
- **No Sponsorship:** Project will not include sponsorship links or files.
