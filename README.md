# PDF Reader MCP Server (@shtse8/pdf-reader-mcp)

[![npm version](https://badge.fury.io/js/%40shtse8%2Fpdf-reader-mcp.svg)](https://badge.fury.io/js/%40shtse8%2Fpdf-reader-mcp)
[![Docker Pulls](https://img.shields.io/docker/pulls/shtse8/pdf-reader-mcp.svg)](https://hub.docker.com/r/shtse8/pdf-reader-mcp)

<!-- Add other badges like License, Build Status if applicable -->

**Empower your AI agents (like Cline/Claude) with the ability to read and
extract information from PDF files within your project, using a single, flexible
tool.**

This Node.js server implements the
[Model Context Protocol (MCP)](https://docs.modelcontextprotocol.com/) to
provide a consolidated `read_pdf` tool for interacting with PDF documents (local
or URL) located within a defined project root directory.

---

## ⭐ Why Use This Server?

- **🛡️ Secure Project Root Focus:**
  - All local file operations are **strictly confined to the project root
    directory** (determined by the server's launch context), preventing
    unauthorized access.
  - Uses **relative paths** for local files. **Important:** The server
    determines its project root from its own Current Working Directory (`cwd`)
    at launch. The process starting the server (e.g., your MCP host) **must**
    set the `cwd` to your intended project directory.
- **🌐 URL Support:** Can directly process PDFs from public URLs.
- **⚡ Efficient PDF Processing:**
  - Leverages the `pdf-parse` library for extracting text, metadata, and page
    information.
- **🔧 Flexible & Consolidated Tool:**
  - A single `read_pdf` tool handles various extraction needs via parameters,
    simplifying agent interaction.
- **🚀 Easy Integration:** Get started quickly using `npx` with minimal
  configuration.
- **🐳 Containerized Option:** Also available as a Docker image for consistent
  deployment environments.
- **✅ Robust Validation:** Uses Zod schemas to validate all incoming tool
  arguments.

---

## 🚀 Quick Start: Usage with MCP Host (Recommended: `npx`)

The simplest way is via `npx`, configured in your MCP host (e.g.,
`mcp_settings.json`).

```json
{
  "mcpServers": {
    "pdf-reader-mcp": {
      "command": "npx",
      "args": [
        "@shtse8/pdf-reader-mcp"
      ],
      "name": "PDF Reader (npx)"
    }
  }
}
```

**(Alternative) Using `bunx`:**

```json
{
  "mcpServers": {
    "pdf-reader-mcp": {
      "command": "bunx",
      "args": [
        "@shtse8/pdf-reader-mcp"
      ],
      "name": "PDF Reader (bunx)"
    }
  }
}
```

**Important:** Ensure your MCP Host launches the command with the `cwd` set to
your project's root directory for local file access.

---

## ✨ The `read_pdf` Tool

This server provides a single, powerful tool: `read_pdf`.

- **Description:** Reads content, metadata, or page count from a PDF file (local
  or URL), controlled by parameters.
- **Input:** An object containing:
  - `sources` (array): **Required.** An array of source objects. Each object
    must contain _either_ `path` (string, relative path to local PDF) _or_ `url`
    (string, URL of PDF).
  - `include_full_text` (boolean, optional, default `false`): Include the full
    text content for each PDF. Ignored if `pages` is provided.
  - `include_metadata` (boolean, optional, default `true`): Include metadata
    (`info` and `metadata` objects) for each PDF.
  - `include_page_count` (boolean, optional, default `true`): Include the total
    number of pages (`num_pages`) for each PDF.
  - `pages` (string | number[], optional): Extract text only from specific pages
    (1-based) or ranges (e.g., `[1, 3, 5]` or `'1,3-5,7'`) for each PDF. If
    provided, output contains `page_texts` array instead of `full_text`.
- **Output:** An object containing a `results` array. Each element corresponds
  to a source in the input `sources` array and has the following structure:
  - `source` (string): The original path or URL.
  - `success` (boolean): True if processing succeeded, false otherwise.
  - `error` (string, optional): Error message if `success` is false.
  - `data` (object, optional): Contains the extracted data if `success` is true:
    - `full_text` (string, optional)
    - `page_texts` (array, optional): Array of `{ page: number, text: string }`.
    - `missing_pages` (array, optional)
    - `info` (object, optional)
    - `metadata` (object, optional)
    - `num_pages` (number, optional)
    - `warnings` (array, optional) **Example Usage:**

1. **Get metadata and page count for multiple files:**
   ```json
   {
     "sources": [
       { "path": "report.pdf" },
       { "url": "http://example.com/another.pdf" },
       { "path": "nonexistent.pdf" }
     ]
   }
   ```
   _(Example Output:
   `{ "results": [ { "source": "report.pdf", "success": true, "data": { "info": {...}, "metadata": {...}, "num_pages": 10 } }, { "source": "http://example.com/another.pdf", "success": true, "data": { "info": {...}, "metadata": {...}, "num_pages": 5 } }, { "source": "nonexistent.pdf", "success": false, "error": "File not found..." } ] }`)_

2. **Get full text for one file:**
   ```json
   {
     "sources": [{ "url": "http://example.com/document.pdf" }],
     "include_full_text": true,
     "include_metadata": false,
     "include_page_count": false
   }
   ```
   _(Example Output:
   `{ "results": [ { "source": "http://example.com/document.pdf", "success": true, "data": { "full_text": "..." } } ] }`)_

3. **Get text from pages 1 and 3-5 for one file (excluding defaults):**
   ```json
   {
     "sources": [{ "path": "manual.pdf" }],
     "pages": "1,3-5",
     "include_metadata": false,
     "include_page_count": false
   }
   ```
   _(Example Output:
   `{ "results": [ { "source": "manual.pdf", "success": true, "data": { "page_texts": [ { "page": 1, "text": "..." }, { "page": 3, "text": "..." }, ... ] } } ] }`)_

---

## 🐳 Alternative Usage: Docker

Configure your MCP Host to run the Docker container, mounting your project
directory to `/app`.

```json
{
  "mcpServers": {
    "pdf-reader-mcp": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-v",
        "/path/to/your/project:/app",
        "shtse8/pdf-reader-mcp:latest"
      ],
      "name": "PDF Reader (Docker)"
    }
  }
}
```

**Note on Volume Mount Path:** Instead of hardcoding `/path/to/your/project`,
you can often use shell variables to automatically use the current working
directory:

- **Linux/macOS:** `-v "$PWD:/app"`
- **Windows Cmd:** `-v "%CD%:/app"`
- **Windows PowerShell:** `-v "${PWD}:/app"`
- **VS Code Tasks/Launch:** You might be able to use `${workspaceFolder}` if
  supported by your MCP host integration.

---

## 🛠️ Other Usage Options

### Local Build (For Development)

1. Clone: `git clone https://github.com/shtse8/pdf-reader-mcp.git`
2. Install: `cd pdf-reader-mcp && npm install`
3. Build: `npm run build`
4. Configure MCP Host:
   ```json
   {
     "mcpServers": {
       "pdf-reader-mcp": {
         "command": "node",
         "args": ["/path/to/cloned/repo/pdf-reader-mcp/build/index.js"],
         "name": "PDF Reader (Local Build)"
       }
     }
   }
   ```

---

## 💻 Development

1. Clone, `npm install`, `npm run build`.
2. `npm run watch` for auto-recompile.

---

## 🚢 Publishing (via GitHub Actions)

Uses GitHub Actions (`.github/workflows/publish.yml`) to publish to npm and
Docker Hub on pushes to `main`. Requires `NPM_TOKEN`, `DOCKERHUB_USERNAME`,
`DOCKERHUB_TOKEN` secrets.

---

## 🙌 Contributing

Contributions welcome! Open an issue or PR.
