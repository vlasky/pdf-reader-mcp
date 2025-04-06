# Getting Started

This guide assumes you have an MCP client or host environment capable of launching and communicating with the PDF Reader MCP Server.

## 1. Launch the Server

Ensure the server is launched with its **working directory set to the root of the project** containing the PDF files you want to access.

- **If installed via npm:** Your MCP host might manage this automatically.
- **If running standalone:** `cd /path/to/your/project && node /path/to/pdf-reader-mcp/build/index.js`
- **If using Docker:** `docker run -i --rm -v "/path/to/your/project:/app" sylphlab/pdf-reader-mcp:latest`

## 2. Using the `read_pdf` Tool

The server provides a single primary tool: `read_pdf`.

**Tool Schema:**

```json
{
  "type": "object",
  "properties": {
    "sources": {
      "type": "array",
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
              { "type": "string", "minLength": 1 }
            ],
            "description": "Extract text only from specific pages (1-based) or ranges (e.g., '1-3, 5'). Applies only to this source."
          }
        },
        "additionalProperties": false,
        // Requires either 'path' or 'url'
        "oneOf": [{ "required": ["path"] }, { "required": ["url"] }]
      },
      "minItems": 1,
      "description": "An array of PDF sources to process."
    },
    "include_full_text": {
      "type": "boolean",
      "default": false,
      "description": "Include full text (ignored if 'pages' is specified for a source)."
    },
    "include_metadata": {
      "type": "boolean",
      "default": true,
      "description": "Include metadata and info objects."
    },
    "include_page_count": {
      "type": "boolean",
      "default": true,
      "description": "Include the total page count."
    }
  },
  "required": ["sources"],
  "additionalProperties": false
}
```

**Example MCP Request (Get metadata and page count for one PDF):**

```json
{
  "tool_name": "read_pdf",
  "arguments": {
    "sources": [{ "path": "./documents/report.pdf" }],
    "include_metadata": true,
    "include_page_count": true,
    "include_full_text": false
  }
}
```

**Example MCP Request (Get text from page 2 of one PDF, full text of another):**

```json
{
  "tool_name": "read_pdf",
  "arguments": {
    "sources": [
      {
        "path": "./invoices/inv-001.pdf",
        "pages": [2] // Get only page 2 text
      },
      {
        "url": "https://example.com/whitepaper.pdf"
        // No 'pages', so 'include_full_text' applies
      }
    ],
    "include_metadata": false,
    "include_page_count": false,
    "include_full_text": true // Applies only to the URL source
  }
}
```

## 3. Understanding the Response

The response will be an array, with each element corresponding to a source in the request. Each element contains:

- `source`: The original path or URL.
- `status`: 'success' or 'error'.
- `pageCount` (if requested and successful).
- `metadata` (if requested and successful).
- `info` (if requested and successful).
- `text` (if full text requested or specific pages requested, and successful).
- `error` (if status is 'error').

See the API Reference for full details.
