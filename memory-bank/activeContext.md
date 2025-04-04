# Active Context: PDF Reader MCP Server (Initial Setup)

## 1. Current Focus

The primary focus has been setting up the initial project structure and
implementing the core PDF reading tools based on the `filesystem-mcp` template.

## 2. Recent Changes (Chronological Summary)

- Cloned `filesystem-mcp` as a base.
- Updated `package.json` (name, version, description).
- Implemented initial PDF tools using `pdf-parse`.
- Removed unused filesystem handlers.
- Added URL support to `pdf-parse` based tools.
- Consolidated tools into a single `read_pdf` handler.
- **Switched PDF Library:** Uninstalled `pdf-parse`, installed `pdfjs-dist`.
- Rewrote the `read_pdf` handler (`src/handlers/readPdf.ts`) to use
  `pdfjs-dist`.
- Updated `README.md` and Memory Bank files to reflect the switch to
  `pdfjs-dist` and the consolidated tool.
- **Added Multiple Source Support:** Modified `read_pdf` handler and schema to
  accept an array of `sources` (each with `path` or `url`) and return an array
  of results. Updated `README.md` and Memory Bank files again.

## 3. Next Steps

- Update `memory-bank/progress.md` to reflect tool consolidation.
- Build the project (`npm run build`) again after adding multi-source support.
- Consider adding basic tests for the PDF handlers.
- Commit the initial implementation to the Git repository.
- Potentially test the server using `@modelcontextprotocol/inspector` or by
  integrating with Cline.

## 4. Active Decisions & Considerations

- **Using `pdfjs-dist` as the core PDF library.**
- Adopted the handler definition pattern from `filesystem-mcp`.
- The consolidated `read_pdf` tool uses `pdfjs-dist` API (including `getPage`
  and `getTextContent`) to handle specific page requests internally.
- Removed inherited filesystem tools.
- Consolidated tools into a single `read_pdf` handler.
- Added support for processing multiple sources in a single call.
