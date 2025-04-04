# Active Context: PDF Reader MCP Server (Initial Setup)

## 1. Current Focus

The primary focus has been setting up the initial project structure and
implementing the core PDF reading tools based on the `filesystem-mcp` template.

## 2. Recent Changes (as of 2025-04-04 ~17:24 GMT+1)

- Cloned `filesystem-mcp` as a base.
- Updated `package.json` with new project name (`@shtse8/pdf-reader-mcp`),
  version, description, and added `pdf-parse` dependency.
- Ran `npm install`.
- Created handler files for the four PDF tools (initially local path only):
  - `src/handlers/readPdfAllText.ts`
  - `src/handlers/readPdfPageText.ts`
  - `src/handlers/getPdfMetadata.ts`
  - `src/handlers/getPdfPageCount.ts`
- Refactored handlers to follow the `ToolDefinition` export pattern found in
  `filesystem-mcp` (instead of using `defineHandler`).
- Integrated the new tool definitions into `src/handlers/index.ts`.
- Updated `README.md` to reflect the PDF Reader functionality and tools
  (initially local path only).
- Removed unused filesystem handlers (e.g., listFiles, editFile) from
  `src/handlers/index.ts` and deleted corresponding `.ts` files.
- **Added URL support:** Modified all PDF handlers and Zod schemas to accept
  either a local `path` or a remote `url`. Updated `README.md` again.
- Updated Memory Bank files (`techContext.md`, `systemPatterns.md`,
  `projectbrief.md`, `productContext.md`) with initial PDF Reader context.
- Removed unused filesystem handlers (e.g., listFiles, editFile) from
  `src/handlers/index.ts` and deleted corresponding `.ts` files.

## 3. Next Steps

- Update `memory-bank/progress.md` to reflect URL support.
- Build the project (`npm run build`) again after adding URL support.
- Consider adding basic tests for the PDF handlers.
- Commit the initial implementation to the Git repository.
- Potentially test the server using `@modelcontextprotocol/inspector` or by
  integrating with Cline.

## 4. Active Decisions & Considerations

- Using `pdf-parse` as the core PDF library.
- Adopted the handler definition pattern from `filesystem-mcp`.
- `read_pdf_page_text` uses the `pagerender` callback for potentially better
  accuracy on specific pages.
- Removed inherited filesystem tools to focus solely on PDF functionality.
- Added support for fetching PDFs via URL using `fetch`.
