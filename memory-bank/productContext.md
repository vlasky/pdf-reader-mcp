# Product Context: PDF Reader MCP Server

## 1. Problem Solved

AI agents often need to access information contained within PDF documents as
part of user tasks (e.g., summarizing reports, extracting data from invoices,
referencing documentation). Directly providing PDF file content to the agent is
inefficient (large token count) and often impossible due to binary format.
Executing external CLI tools for each PDF interaction can be slow, insecure, and
lack structured output.

This MCP server provides a secure, efficient, and structured way for agents to
interact with PDF files within the user's project context.

## 2. How It Should Work

- The server runs as a background process, managed by the agent's host
  environment.
- The host environment ensures the server is launched with its working directory
  set to the user's current project root.
- The agent uses MCP calls to invoke specific PDF reading tools provided by the
  server.
- The agent provides the relative path to the target PDF file within the project
  root.
- The server uses the `pdf-parse` library to process the PDF.
- The server returns structured data (text, metadata, page count) back to the
  agent via MCP.
- All file access is strictly limited to the project root directory.

## 3. User Experience Goals

- **Seamless Integration:** The agent should be able to use the PDF tools
  naturally as part of its workflow without complex setup for the end-user.
- **Reliability:** Tools should reliably parse standard PDF files and return
  accurate information or clear error messages.
- **Security:** Users should trust that the server only accesses files within
  the intended project scope.
- **Efficiency:** Reading PDF data should be reasonably fast and avoid excessive
  token usage compared to sending raw file content (which isn't feasible
  anyway).
