# Active Context: PDF Reader MCP Server (Initial Setup)

## 1. Current Focus

The primary focus has been setting up the initial project structure and
implementing the core PDF reading tools based on the `filesystem-mcp` template.

## 2. Recent Changes (Chronological Summary)

- Cloned `filesystem-mcp` as a base.
- Updated `package.json` (name, version, description, added `pdf-parse`).
- Ran `npm install`.
- Implemented four separate PDF handlers (`readPdfAllText`, `readPdfPageText`,
  `getPdfMetadata`, `getPdfPageCount`) using the `ToolDefinition` pattern.
- Integrated these handlers into `src/handlers/index.ts`.
- Updated `README.md` and Memory Bank files for initial PDF functionality.
- Removed unused filesystem handlers and their imports/files.
- Added URL support (`fetch`) to the four separate PDF handlers.
- **Consolidated Tools:** Merged the four PDF tools into a single `read_pdf`
  handler (`src/handlers/readPdf.ts`) with parameters (`include_full_text`,
  `include_metadata`, `include_page_count`, `pages`).
- Updated `src/handlers/index.ts` to only use `readPdfToolDefinition`.
- Deleted the four previous separate PDF handler files.
- Updated `README.md` and Memory Bank files again to reflect the consolidated
  `read_pdf` tool.

## 3. Next Steps

- Update `memory-bank/progress.md` to reflect tool consolidation.
- Build the project (`npm run build`) again after consolidation.
- Consider adding basic tests for the PDF handlers.
- Commit the initial implementation to the Git repository.
- Potentially test the server using `@modelcontextprotocol/inspector` or by
  integrating with Cline.

## 4. Active Decisions & Considerations

- Using `pdf-parse` as the core PDF library.
- Adopted the handler definition pattern from `filesystem-mcp`.
- The consolidated `read_pdf` tool uses `pagerender` internally when the `pages`
  parameter is provided.
- Removed inherited filesystem tools.
- Added URL support using `fetch`.
- Consolidated tools into a single `read_pdf` handler for simplicity.
