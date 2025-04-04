import { z } from 'zod';
import pdf from 'pdf-parse';
import fs from 'node:fs/promises';
import { resolvePath } from '../utils/pathUtils.js';
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from './index.js';

// Define the Zod schema for input arguments
const GetPdfMetadataArgsSchema = z.object({
  path: z.string().min(1, 'Path cannot be empty.'),
}).strict();

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

  const safePath = resolvePath(parsedArgs.path);

  try {
    const dataBuffer = await fs.readFile(safePath);
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
    let errorMessage = `Failed to read or parse PDF for metadata at '${parsedArgs.path}'.`;
    if (error.code === 'ENOENT') {
      errorMessage = `File not found at '${parsedArgs.path}'. Resolved to: ${safePath}`;
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