import { z } from 'zod';
import pdf from 'pdf-parse';
import fs from 'node:fs/promises';
import { resolvePath } from '../utils/pathUtils.js';
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from './index.js';

// Define the Zod schema for input arguments
const GetPdfMetadataArgsSchema = z.object({
  path: z.string().min(1).optional().describe("Relative path to the local PDF file."),
  url: z.string().url().optional().describe("URL of the PDF file."),
}).strict().refine(
    (data) => (data.path && !data.url) || (!data.path && data.url), // Ensure either path or url is provided, but not both
    { message: "Either 'path' or 'url' must be provided, but not both." }
);

// Infer TypeScript type for arguments
type GetPdfMetadataArgs = z.infer<typeof GetPdfMetadataArgsSchema>;

// Define the handler function
const handleGetPdfMetadataFunc = async (args: unknown) => {
  let parsedArgs: GetPdfMetadataArgs;
  try {
    parsedArgs = GetPdfMetadataArgsSchema.parse(args);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new McpError(ErrorCode.InvalidParams, `Invalid arguments: ${error.errors.map(e => `${e.path.join('.')} (${e.message})`).join(', ')}`);
    }
    throw new McpError(ErrorCode.InvalidParams, 'Argument validation failed');
  }

  const { path: relativePath, url } = parsedArgs;
  let dataBuffer: Buffer;
  let sourceDescription: string = 'unknown source'; // Initialize

  try {
    // Fetch or read the PDF buffer
    if (relativePath) {
      sourceDescription = `'${relativePath}'`;
      const safePath = resolvePath(relativePath);
      dataBuffer = await fs.readFile(safePath);
    } else if (url) {
      sourceDescription = `'${url}'`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new McpError(ErrorCode.InternalError, `Failed to fetch PDF from ${url}. Status: ${response.status} ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      dataBuffer = Buffer.from(arrayBuffer);
    } else {
      throw new McpError(ErrorCode.InvalidParams, "Missing 'path' or 'url'.");
    }

    // Now parse the buffer
    // We only need metadata, but pdf-parse reads everything anyway
    const data = await pdf(dataBuffer);

    // Return the metadata and info objects provided by pdf-parse
    return {
        info: data.info, // General PDF info (creator, producer, dates, etc.)
        metadata: data.metadata, // XMP or other metadata streams
        // Optionally include numPages and version if useful context
        numPages: data.numpages,
        version: data.version,
    };
  } catch (error: any) {
    if (error instanceof McpError) throw error; // Re-throw known MCP errors

    let errorMessage = `Failed to read or parse PDF for metadata from ${sourceDescription}.`;
    // Keep ENOENT check for local files
    if (relativePath && error.code === 'ENOENT') {
      const safePath = resolvePath(relativePath); // Resolve again for error message
      errorMessage = `File not found at '${relativePath}'. Resolved to: ${safePath}`;
    } else if (error instanceof Error) {
       errorMessage += ` Reason: ${error.message}`;
    } else {
       errorMessage += ` Unknown error: ${String(error)}`;
    }
    throw new McpError(ErrorCode.InternalError, errorMessage, { cause: error });
  }
};

// Export the ToolDefinition object
export const getPdfMetadataToolDefinition: ToolDefinition = {
  name: 'get_pdf_metadata',
  description: 'Reads metadata (like author, title, dates) from a PDF file.',
  schema: GetPdfMetadataArgsSchema,
  handler: handleGetPdfMetadataFunc,
};