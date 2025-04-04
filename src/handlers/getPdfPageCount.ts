import { z } from 'zod';
import pdf from 'pdf-parse';
import fs from 'node:fs/promises';
import { resolvePath } from '../utils/pathUtils.js';
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from './index.js';

// Define the Zod schema for input arguments
const GetPdfPageCountArgsSchema = z.object({
  path: z.string().min(1, 'Path cannot be empty.'),
}).strict();

// Infer TypeScript type for arguments
type GetPdfPageCountArgs = z.infer<typeof GetPdfPageCountArgsSchema>;

// Define the handler function
const handleGetPdfPageCountFunc = async (args: unknown) => {
  let parsedArgs: GetPdfPageCountArgs;
  try {
    parsedArgs = GetPdfPageCountArgsSchema.parse(args);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new McpError(ErrorCode.InvalidParams, `Invalid arguments: ${error.errors.map(e => `${e.path.join('.')} (${e.message})`).join(', ')}`);
    }
    throw new McpError(ErrorCode.InvalidParams, 'Argument validation failed');
  }

  const safePath = resolvePath(parsedArgs.path);

  try {
    const dataBuffer = await fs.readFile(safePath);
    // We only need the page count, but pdf-parse reads everything
    const data = await pdf(dataBuffer);

    // Return just the page count
    return {
        numPages: data.numpages,
    };
  } catch (error: any) {
    let errorMessage = `Failed to read or parse PDF for page count at '${parsedArgs.path}'.`;
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
export const getPdfPageCountToolDefinition: ToolDefinition = {
  name: 'get_pdf_page_count',
  description: 'Gets the total number of pages in a PDF file.',
  schema: GetPdfPageCountArgsSchema,
  handler: handleGetPdfPageCountFunc,
};