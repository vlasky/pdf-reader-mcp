# Project Brief: PDF Reader MCP Server

## 1. Project Goal

To create a Model Context Protocol (MCP) server that allows AI agents (like
Cline) to securely read and extract information (text, metadata, page count)
from PDF files located within a specified project directory.

## 2. Core Requirements

- Implement an MCP server using Node.js and TypeScript.
- Base the server on the existing `@shtse8/filesystem-mcp` structure.
- Provide MCP tools for:
  - Reading all text content from a PDF.
  - Reading text content from specific pages of a PDF.
  - Reading metadata from a PDF.
  - Getting the total page count of a PDF.
- Ensure all operations are confined to the project root directory determined at
  server launch.
- Use relative paths for all file operations.
- Utilize the `pdf-parse` library for PDF processing.
- Maintain clear documentation (README, Memory Bank).
- Package the server for distribution via npm and Docker Hub.

## 3. Scope

- **In Scope:** Implementing the core PDF reading tools, packaging, basic
  documentation.
- **Out of Scope (Initially):** Advanced PDF features (image extraction,
  annotation reading, form filling), complex error recovery beyond basic file
  access/parsing errors, UI for the server.

## 4. Target User

AI agents interacting with user projects that contain PDF documents.
