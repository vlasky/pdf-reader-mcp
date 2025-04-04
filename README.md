# PDF Reader MCP Server (@shtse8/pdf-reader-mcp)

[![npm version](https://badge.fury.io/js/%40shtse8%2Fpdf-reader-mcp.svg)](https://badge.fury.io/js/%40shtse8%2Fpdf-reader-mcp)
[![Docker Pulls](https://img.shields.io/docker/pulls/shtse8/pdf-reader-mcp.svg)](https://hub.docker.com/r/shtse8/pdf-reader-mcp)

<!-- Add other badges like License, Build Status if applicable -->

**Empower your AI agents (like Cline/Claude) with the ability to read and
extract information from PDF files within your project.**

This Node.js server implements the
[Model Context Protocol (MCP)](https://docs.modelcontextprotocol.com/) to
provide tools for interacting with PDF documents located within a defined
project root directory.

---

## ⭐ Why Use This Server?

- **🛡️ Secure Project Root Focus:**
  - All operations are **strictly confined to the project root directory**
    (determined by the server's launch context), preventing unauthorized access
    to other parts of the filesystem.
  - Uses **relative paths** from the project root. **Important:** The server
    determines its project root from its own Current Working Directory (`cwd`)
    at launch. The process starting the server (e.g., your MCP host) **must**
    set the `cwd` to your intended project directory.
- **⚡ Efficient PDF Processing:**
  - Leverages the `pdf-parse` library for extracting text, metadata, and page
    information.
  - Provides specific tools for common PDF reading tasks.
- **🚀 Easy Integration:** Get started quickly using `npx` with minimal
  configuration.
- **🐳 Containerized Option:** Also available as a Docker image for consistent
  deployment environments.
- **✅ Robust Validation:** Uses Zod schemas to validate all incoming tool
  arguments.

---

## 🚀 Quick Start: Usage with MCP Host (Recommended: `npx`)

The simplest and recommended way to use this server is via `npx`, configured
directly in your MCP host environment (e.g., Roo/Cline's `mcp_settings.json`).
This ensures you always use the latest version from npm without needing local
installation or Docker.

**Configure your MCP Host:**

Modify your MCP host's settings (e.g., `mcp_settings.json`) to run the server
using `npx`.

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

If you prefer using Bun, you can use `bunx` instead:

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

**That's it!** Restart your MCP Host environment (if necessary) for the settings
to take effect. Your AI agent can now use the PDF reader tools. **Important:**
The server uses its own Current Working Directory (`cwd`) as the project root.
Ensure your MCP Host (e.g., Cline/VSCode) is configured to launch the `npx` or
`bunx` command with the `cwd` set to your active project's root directory.

---

## ✨ PDF Reading Tools

This server equips your AI agent with the following tools for PDF interaction:

- 📄 **`read_pdf_all_text`:**
  - **Description:** Reads all text content and basic information (metadata,
    page count) from a specified PDF file.
  - **Input:** `{ "path": "string" }` (Relative path to the PDF file)
  - **Output:** An object containing `text`, `numPages`, `numRenderedPages`,
    `info`, `metadata`, and `version` from the PDF.

- 📑 **`read_pdf_page_text`:**
  - **Description:** Reads text content from specific pages of a PDF file.
  - **Input:** `{ "path": "string", "pages": "number[] | string" }` (Relative
    path and an array of 1-based page numbers like `[1, 3, 5]` or a string range
    like `'1,3-5,7'`)
  - **Output:** An object containing an array `pages` (each element has `page`
    number and extracted `text`) and optionally `missingPages` if some requested
    pages couldn't be processed.

- ℹ️ **`get_pdf_metadata`:**
  - **Description:** Reads metadata (like author, title, creator, producer,
    dates) and general info from a PDF file without extracting all text content
    explicitly in the output (though it's parsed internally).
  - **Input:** `{ "path": "string" }` (Relative path to the PDF file)
  - **Output:** An object containing `info`, `metadata`, `numPages`, and
    `version`.

- #️⃣ **`get_pdf_page_count`:**
  - **Description:** Quickly gets the total number of pages in a PDF file.
  - **Input:** `{ "path": "string" }` (Relative path to the PDF file)
  - **Output:** An object containing `numPages`.

---

## 🐳 Alternative Usage: Docker

For users who prefer containerization or need a specific environment.

**1. Ensure Docker is running.**

**2. Configure your MCP Host:**

Modify your MCP host's settings to run the Docker container. **Crucially, you
must mount your project directory to `/app` inside the container.**

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
        "/path/to/your/project:/app", // IMPORTANT: Replace with your project path
        "shtse8/pdf-reader-mcp:latest"
      ],
      "name": "PDF Reader (Docker)"
    }
  }
}
```

**Explanation:**

- `-v "/path/to/your/project:/app"`: Mounts your local project directory into
  the container at `/app`. The server inside the container will treat `/app` as
  its root. **Remember to replace `/path/to/your/project` with the correct
  absolute path for your system.**
- `shtse8/pdf-reader-mcp:latest`: Specifies the Docker image. Docker will pull
  it if needed.

**3. Restart your MCP Host environment.**

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
    // Note: Ensure the command is launched from your intended project root directory.
  }
}
```

---

## 💻 Development

1. Clone the repository.
2. Install dependencies: `npm install`
3. Build: `npm run build` (compiles TypeScript to `build/`)
4. Watch for changes: `npm run watch` (optional, recompiles on save)

---

## 🚢 Publishing (via GitHub Actions)

This repository uses GitHub Actions (`.github/workflows/publish.yml`) to
automatically:

1. Publish the package to
   [npm](https://www.npmjs.com/package/@shtse8/pdf-reader-mcp) on pushes to
   `main`.
2. Build and push a Docker image to
   [Docker Hub](https://hub.docker.com/r/shtse8/pdf-reader-mcp) on pushes to
   `main`.

Requires `NPM_TOKEN`, `DOCKERHUB_USERNAME`, and `DOCKERHUB_TOKEN` secrets
configured in the GitHub repository settings.

---

## 🙌 Contributing

Contributions are welcome! Please open an issue or submit a pull request.
