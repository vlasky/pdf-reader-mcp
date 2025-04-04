# Plan: PDF Reader MCP Tool Development

1. **Project Setup:**
   - Clone `https://github.com/shtse8/filesystem-mcp` to
     `c:/Users/shtse/pdf-reader`. (Already done implicitly by user starting in
     this empty dir, but good to note).
   - Initialize Git and push to `https://github.com/shtse8/pdf-reader-mcp.git`.
     (User has done this).
   - Create Memory Bank directory and core files:
     - `memory-bank/projectbrief.md`
     - `memory-bank/productContext.md`
     - `memory-bank/activeContext.md`
     - `memory-bank/systemPatterns.md`
     - `memory-bank/techContext.md`
     - `memory-bank/progress.md`

2. **Technology Selection & Dependency:**
   - Research and choose a suitable Node.js PDF processing library (e.g.,
     `pdf-parse` or `pdfjs-dist`).
   - Add the chosen library to `package.json` dependencies.

3. **Feature Implementation:**
   - Define MCP tool schemas and implement logic:
     - `read_pdf_all_text`: Extract all text. Input: `{ "path": "string" }`
     - `read_pdf_page_text`: Extract text from specific pages. Input:
       `{ "path": "string", "pages": "number[] | string" }`
     - `get_pdf_metadata`: Read metadata. Input: `{ "path": "string" }`
     - `get_pdf_page_count`: Get total page count. Input: `{ "path": "string" }`
   - Implement core functionality using the chosen PDF library.
   - Integrate new tools into the existing MCP server framework.

   ```mermaid
   graph TD
       subgraph "PDF Tool Implementation"
           A[Define read_pdf_all_text] --> B{Use PDF Library};
           C[Define read_pdf_page_text] --> B;
           D[Define get_pdf_metadata] --> B;
           E[Define get_pdf_page_count] --> B;
           B --> F[Implement Logic];
           F --> G[Integrate into MCP Server];
       end
   ```

4. **Documentation & Refinement:**
   - Update `README.md` with new PDF tool descriptions and usage examples.
   - Update Memory Bank files (`techContext.md`, `systemPatterns.md`,
     `progress.md`).

5. **Handover:**
   - Confirm plan with the user. (Done).
   - Save plan to `PLAN.md`. (This step).
   - Switch to "Code" mode for implementation.
