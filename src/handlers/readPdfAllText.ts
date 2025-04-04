import { z } from 'zod';
import pdf from 'pdf-parse';
import fs from 'node:fs/promises';
import { resolvePath } from '../utils/pathUtils.js';
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js"; // Keep this for error handling
import type { ToolDefinition } from './index.js'; // Import the internal interface

// 1. Define the Zod schema for input arguments
const ReadPdfAllTextArgsSchema = z.object({
  path: z.string().min(1, 'Path cannot be empty.'),
}).strict(); // Use strict to prevent unexpected arguments

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

  const safePath = resolvePath(parsedArgs.path);

  try {
    const dataBuffer = await fs.readFile(safePath);
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
    // Provide a more specific error message if possible
    let errorMessage = `Failed to read or parse PDF at '${parsedArgs.path}'.`;
    if (error.code === 'ENOENT') {
      errorMessage = `File not found at '${parsedArgs.path}'. Resolved to: ${safePath}`;
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
