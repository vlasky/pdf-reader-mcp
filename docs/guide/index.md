# Guide

Welcome to the guide for the PDF Reader MCP Server. This guide will walk you through setting up and using the server with your AI agent host.

## What is PDF Reader MCP Server?

This is a Node.js server implementing the [Model Context Protocol (MCP)](https://docs.modelcontextprotocol.com/). It acts as a specialized tool provider for AI agents (like Cline), enabling them to interact with PDF documents found within a user's project directory.

The core functionality is exposed through a single, powerful tool: `read_pdf`.

## Key Features

- **Secure:** All local file access is restricted to the project root directory where the server is launched.
- **Flexible:** Reads full text, specific pages, metadata, and page counts.
- **Supports Local & Remote:** Can process local PDF files (using relative paths) and PDFs from URLs.
- **Consolidated Tool:** Simplifies agent interaction with a single `read_pdf` command.
- **Easy Setup:** Integrates easily via `npx` or Docker.
- **Robust:** Built with strict TypeScript, comprehensive tests (~95% coverage), and Zod validation.

## Installation & Setup

There are two primary ways to use the server:

### 1. Using `npx` (Recommended)

This is the simplest method if your MCP host environment supports running commands. Configure your host (e.g., in its `mcp_settings.json` or equivalent) to launch the server using `npx`.

**Example Configuration (`mcp_settings.json`):**

```json
{
  "mcpServers": {
    "pdf-reader-mcp": {
      "command": "npx",
      "args": ["@shtse8/pdf-reader-mcp"],
      "name": "PDF Reader (npx)"
      // "enabled": true // Ensure it's enabled
    }
    // ... other servers
  }
}
```

**Important:** Your MCP Host **must** launch this command with its **Current Working Directory (CWD)** set to your project's root directory. The server uses its CWD to resolve relative paths for local PDF files securely.

### 2. Using Docker

If you prefer containerization or your host integrates well with Docker:

**Example Configuration (`mcp_settings.json`):**

```json
{
  "mcpServers": {
    "pdf-reader-mcp": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        // Mount your project directory to /app inside the container
        "-v",
        "/path/to/your/project:/app",
        // Use the latest image
        "shtse8/pdf-reader-mcp:latest"
      ],
      "name": "PDF Reader (Docker)"
      // "enabled": true
    }
    // ... other servers
  }
}
```

**Notes on Volume Mount (`-v`):**

- Replace `/path/to/your/project` with the **absolute path** to your project on the host machine.
- You can often use shell variables for the host path:
  - Linux/macOS: `-v "$PWD:/app"`
  - Windows Cmd: `-v "%CD%:/app"`
  - Windows PowerShell: `-v "${PWD}:/app"`
- The container's working directory is `/app`, so the server will treat the mounted volume as the project root.

## Basic Usage: The `read_pdf` Tool

Once the server is configured and running, your AI agent can use the `read_pdf` tool.

**Tool Name:** `read_pdf`

**Description:** Reads content, metadata, or page count from one or more PDFs (local or URL). Each source can specify pages to extract.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "sources": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "properties": {
          "path": {
            "type": "string",
            "description": "Relative path to the local PDF file."
          },
          "url": {
            "type": "string",
            "format": "uri",
            "description": "URL of the PDF file."
          },
          "pages": {
            "anyOf": [
              { "type": "array", "items": { "type": "integer", "minimum": 1 }, "minItems": 1 },
              { "type": "string", "pattern": "^[0-9,-]+$" }
            ],
            "description": "Optional: Extract text only from specific pages (1-based) or ranges (e.g., [1, 3, 5] or '1,3-5,7') for this specific source. Overrides 'include_full_text' for this source."
          }
        },
        "required": [], // Either path or url is required by refine
        "additionalProperties": false
      },
      "description": "An array of PDF sources to process."
    },
    "include_full_text": {
      "type": "boolean",
      "default": false,
      "description": "Include the full text content of each PDF (only if 'pages' is not specified for that source)."
    },
    "include_metadata": {
      "type": "boolean",
      "default": true,
      "description": "Include metadata and info objects for each PDF."
    },
    "include_page_count": {
      "type": "boolean",
      "default": true,
      "description": "Include the total number of pages for each PDF."
    }
  },
  "required": ["sources"],
  "additionalProperties": false
}
```

_(Refinement: Each object in `sources` must have exactly one of `path` or `url`)_

**Output:**

The tool returns a JSON object containing a `results` array. Each element in the array corresponds to a source provided in the input, maintaining the order.

**Result Object Structure:**

```typescript
interface PdfSourceResult {
  source: string; // The original path or URL
  success: boolean; // Was processing this source successful?
  data?: {
    info?: object; // PDF info dictionary
    metadata?: object; // PDF metadata dictionary
    num_pages?: number; // Total page count
    full_text?: string; // Full extracted text (if requested and no specific pages)
    page_texts?: { page: number; text: string }[]; // Text from specific pages (if requested)
    warnings?: string[]; // Non-critical warnings (e.g., page out of bounds)
  };
  error?: string; // Error message if success is false
}
```

**Example MCP Tool Call (Agent Perspective):**

```xml
<use_mcp_tool>
  <server_name>pdf-reader-mcp</server_name>
  <tool_name>read_pdf</tool_name>
  <arguments>
    {
      "sources": [
        { "path": "documents/report-Q1.pdf", "pages": [1, 3] },
        { "url": "https://example.com/datasheet.pdf" }
      ],
      "include_metadata": true,
      "include_page_count": true
    }
  </arguments>
</use_mcp_tool>
```

**Example Response (Simplified):**

```json
{
  "results": [
    {
      "source": "documents/report-Q1.pdf",
      "success": true,
      "data": {
        "info": { "...": "..." },
        "metadata": { "...": "..." },
        "num_pages": 10,
        "page_texts": [
          { "page": 1, "text": "Text from page 1..." },
          { "page": 3, "text": "Text from page 3..." }
        ]
      }
    },
    {
      "source": "https://example.com/datasheet.pdf",
      "success": true,
      "data": {
        "info": { "...": "..." },
        "metadata": { "...": "..." },
        "num_pages": 5
        // No full_text or page_texts as neither was requested for this source
      }
    },
    // Example of a failed source:
    {
      "source": "nonexistent.pdf", // If this was included in request
      "success": false,
      "error": "File not found at 'nonexistent.pdf'. Resolved to: /path/to/project/nonexistent.pdf"
    }
  ]
}
```

_(Further sections like API Reference, Advanced Usage, Troubleshooting can be added later)_
