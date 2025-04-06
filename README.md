# PDF Reader MCP Server (@sylphlab/pdf-reader-mcp)

[![CI/CD Pipeline](https://github.com/sylphlab/pdf-reader-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/sylphlab/pdf-reader-mcp/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/sylphlab/pdf-reader-mcp/badge.svg?branch=main)](https://coveralls.io/github/sylphlab/pdf-reader-mcp?branch=main)
[![npm version](https://badge.fury.io/js/%40sylphlab%2Fpdf-reader-mcp.svg)](https://badge.fury.io/js/%40sylphlab%2Fpdf-reader-mcp)
[![Docker Pulls](https://img.shields.io/docker/pulls/sylphlab/pdf-reader-mcp.svg)](https://hub.docker.com/r/sylphlab/pdf-reader-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Empower your AI agents (like Cline) with the ability to securely read and extract information (text, metadata, page count) from PDF files within your project context using a single, flexible tool.

## Installation

### Using npm (Recommended)

Install as a dependency in your MCP host environment or project:

```bash
npm install @sylphlab/pdf-reader-mcp
```

Configure your MCP host (e.g., `mcp_settings.json`) to use `npx`:

```json
{
  "mcpServers": {
    "pdf-reader-mcp": {
      "command": "npx",
      "args": ["@sylphlab/pdf-reader-mcp"],
      "name": "PDF Reader (npx)"
    }
  }
}
```

_(Ensure the host sets the correct `cwd` for the target project)_

### Using Docker

Pull the image:

```bash
docker pull sylphlab/pdf-reader-mcp:latest
```

Configure your MCP host to run the container, mounting your project directory to `/app`:

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
        "/path/to/your/project:/app", // Or use "$PWD:/app", "%CD%:/app", etc.
        "sylphlab/pdf-reader-mcp:latest"
      ],
      "name": "PDF Reader (Docker)"
    }
  }
}
```

### Local Build (For Development)

1. Clone: `git clone https://github.com/sylphlab/pdf-reader-mcp.git`
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
   _(Ensure the host sets the correct `cwd` for the target project)_

## Quick Start

Assuming the server is running and configured in your MCP host:

**MCP Request (Get metadata and page 2 text from a local PDF):**

```json
{
  "tool_name": "read_pdf",
  "arguments": {
    "sources": [
      {
        "path": "./documents/my_report.pdf",
        "pages": [2]
      }
    ],
    "include_metadata": true,
    "include_page_count": false, // Default is true, explicitly false here
    "include_full_text": false // Ignored because 'pages' is specified
  }
}
```

**Expected Response Snippet:**

```json
{
  "results": [
    {
      "source": "./documents/my_report.pdf",
      "success": true,
      "data": {
        "page_texts": [
          { "page": 2, "text": "Text content from page 2..." }
        ],
        "info": { ... },
        "metadata": { ... }
        // num_pages not included as requested
      }
    }
  ]
}
```

## Why Choose This Project?

- **🛡️ Secure:** Confines file access strictly to the project root directory.
- **🌐 Flexible:** Handles both local relative paths and public URLs.
- **🧩 Consolidated:** A single `read_pdf` tool serves multiple extraction needs (full text, specific pages, metadata, page count).
- **⚙️ Structured Output:** Returns data in a predictable JSON format, easy for agents to parse.
- **🚀 Easy Integration:** Designed for seamless use within MCP environments via `npx` or Docker.
- **✅ Robust:** Uses `pdfjs-dist` for reliable parsing and Zod for input validation.

## Performance Advantages

_(Performance benchmarks are planned and will be added to the documentation.)_

## Features

- Read full text content from PDF files.
- Read text content from specific pages or page ranges.
- Read PDF metadata (author, title, creation date, etc.).
- Get the total page count of a PDF.
- Process multiple PDF sources (local paths or URLs) in a single request.
- Securely operates within the defined project root.
- Provides structured JSON output via MCP.
- Available via npm and Docker Hub.

## Design Philosophy

The server prioritizes security through context confinement, efficiency via structured data transfer, and simplicity for easy integration into AI agent workflows. It aims for minimal dependencies, relying on the robust `pdfjs-dist` library.

See the full [Design Philosophy](./docs/design/index.md) documentation.

## Comparison with Other Solutions

Compared to direct file access (often infeasible) or generic filesystem tools, this server offers PDF-specific parsing capabilities. Unlike external CLI tools (e.g., `pdftotext`), it provides a secure, integrated MCP interface with structured output, enhancing reliability and ease of use for AI agents.

See the full [Comparison](./docs/comparison/index.md) documentation.

## Future Plans

- Implement comprehensive benchmark tests.
- Enhance documentation with more examples and advanced use cases.
- Explore potential optimizations for very large PDF files.

## Documentation

For detailed usage, API reference, and guides, please visit the **[Full Documentation Website](https://sylphlab.github.io/pdf-reader-mcp/)** (Link to be updated once deployed).

## Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md](./CONTRIBUTING.md) guidelines and open an issue or pull request on GitHub.

## License

This project is licensed under the [MIT License](./LICENSE).
