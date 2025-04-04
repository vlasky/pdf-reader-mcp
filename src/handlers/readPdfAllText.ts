import { z } from 'zod';
import pdf from 'pdf-parse';
import fs from 'node:fs/promises';
import { resolvePath } from '../utils/pathUtils.js';
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js"; // Keep this for error handling
import type { ToolDefinition } from './index.js'; // Import the internal interface

// 1. Define the Zod schema for input arguments
const ReadPdfAllTextArgsSchema = z.object({
  path: z.string().min(1).optional().describe("Relative path to the local PDF file."),
  url: z.string().url().optional().describe("URL of the PDF file."),
}).strict().refine(
    (data) => (data.path && !data.url) || (!data.path && data.url), // Ensure either path or url is provided, but not both
    { message: "Either 'path' or 'url' must be provided, but not both." }
);

// Infer TypeScript type for arguments
type ReadPdfAllTextArgs = z.infer<typeof ReadPdfAllTextArgsSchema>;

// 2. Define the handler function
const handleReadPdfAllTextFunc = async (args: unknown) => {
  // Validate and parse arguments using the Zod schema
  let parsedArgs: ReadPdfAllTextArgs;
  try {
    parsedArgs = ReadPdfAllTextArgsSchema.parse(args);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new McpError(ErrorCode.InvalidParams, `Invalid arguments: ${error.errors.map(e => `${e.path.join('.')} (${e.message})`).join(', ')}`);
    }
    throw new McpError(ErrorCode.InvalidParams, 'Argument validation failed');
  }

  const { path: relativePath, url } = parsedArgs;
  let dataBuffer: Buffer;
  let sourceDescription: string = 'unknown source'; // Initialize here
  try {
    if (relativePath) {
      sourceDescription = `'${relativePath}'`;
      const safePath = resolvePath(relativePath);
      dataBuffer = await fs.readFile(safePath);
    } else if (url) {
      sourceDescription = `'${url}'`;
      const response = await fetch(url);
      if (!response.ok) {
        // Use InternalError or a more generic code if NetworkError doesn't exist
        throw new McpError(ErrorCode.InternalError, `Failed to fetch PDF from ${url}. Status: ${response.status} ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      dataBuffer = Buffer.from(arrayBuffer);
    } else {
      // This should be caught by Zod refine, but as a safeguard:
      throw new McpError(ErrorCode.InvalidParams, "Missing 'path' or 'url'.");
    }

    // Now parse the buffer
    const data = await pdf(dataBuffer);

    // pdf-parse returns numpages, numrender, info, metadata, text, version
    // Return the raw data structure from pdf-parse
    // The caller (src/index.ts) doesn't seem to expect a specific output schema validation here,
    // it just passes the result through. We can add output validation later if needed.
    return {
        text: data.text,
        numPages: data.numpages,
        numRenderedPages: data.numrender,
        info: data.info,
        metadata: data.metadata,
        version: data.version,
    };
  } catch (error: any) {
    if (error instanceof McpError) throw error; // Re-throw known MCP errors

    let errorMessage = `Failed to read or parse PDF from ${sourceDescription}.`; // Remove default value here, already initialized
    // Keep ENOENT check for local files
    if (relativePath && error.code === 'ENOENT') {
      const safePath = resolvePath(relativePath); // Resolve again for error message
      errorMessage = `File not found at '${relativePath}'. Resolved to: ${safePath}`;
    } else if (error instanceof Error) {
       errorMessage += ` Reason: ${error.message}`;
    } else {
       errorMessage += ` Unknown error: ${String(error)}`;
    }
    // Throw McpError for consistency with other handlers
    throw new McpError(ErrorCode.InternalError, errorMessage, { cause: error });
  }
};

// 3. Export the ToolDefinition object
export const readPdfAllTextToolDefinition: ToolDefinition = {
  name: 'read_pdf_all_text',
  description: 'Reads all text content and basic info from a PDF file.',
  schema: ReadPdfAllTextArgsSchema, // Use the Zod schema here
  handler: handleReadPdfAllTextFunc, // Use the handler function here
};

// Default export might not be needed if index.ts imports the named export
// export default readPdfAllTextToolDefinition;
