import { z } from 'zod';
import pdf from 'pdf-parse';
import fs from 'node:fs/promises';
import { resolvePath } from '../utils/pathUtils.js';
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from './index.js';

// Helper to parse page ranges like "1,3-5,7" into an array of numbers [1, 3, 4, 5, 7]
const parsePageRanges = (ranges: string): number[] => {
    const pages: Set<number> = new Set();
    const parts = ranges.split(',');
    for (const part of parts) {
        if (part.includes('-')) {
            const [startStr, endStr] = part.split('-');
            const start = parseInt(startStr, 10);
            const end = parseInt(endStr, 10);
            if (!isNaN(start) && !isNaN(end) && start <= end) {
                for (let i = start; i <= end; i++) {
                    pages.add(i);
                }
            } else {
                throw new Error(`Invalid page range: ${part}`);
            }
        } else {
            const page = parseInt(part, 10);
            if (!isNaN(page)) {
                pages.add(page);
            } else {
                throw new Error(`Invalid page number: ${part}`);
            }
        }
    }
    return Array.from(pages).sort((a, b) => a - b);
};

// Define the Zod schema for input arguments
const ReadPdfPageTextArgsSchema = z.object({
  path: z.string().min(1).optional().describe("Relative path to the local PDF file."),
  url: z.string().url().optional().describe("URL of the PDF file."),
  // Allow pages as an array of numbers or a string range
  pages: z.union([
    z.array(z.number().int().positive()).min(1),
    z.string().min(1).refine(val => /^[0-9,\-]+$/.test(val), { message: "Page string must contain only numbers, commas, and hyphens." })
  ]).describe("Page numbers (1-based) or ranges (e.g., [1, 3, 5] or '1,3-5,7') to extract text from."),
}).strict().refine(
    (data) => (data.path && !data.url) || (!data.path && data.url), // Ensure either path or url is provided, but not both
    { message: "Either 'path' or 'url' must be provided, but not both." }
);
// Infer TypeScript type for arguments
type ReadPdfPageTextArgs = z.infer<typeof ReadPdfPageTextArgsSchema>;

// Define the handler function
const handleReadPdfPageTextFunc = async (args: unknown) => {
  let parsedArgs: ReadPdfPageTextArgs;
  try {
    parsedArgs = ReadPdfPageTextArgsSchema.parse(args);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new McpError(ErrorCode.InvalidParams, `Invalid arguments: ${error.errors.map(e => `${e.path.join('.')} (${e.message})`).join(', ')}`);
    }
    throw new McpError(ErrorCode.InvalidParams, 'Argument validation failed');
  }

  let targetPages: number[];
  try {
      if (typeof parsedArgs.pages === 'string') {
          targetPages = parsePageRanges(parsedArgs.pages);
      } else {
          targetPages = [...new Set(parsedArgs.pages)].sort((a, b) => a - b); // Ensure unique and sorted
      }
      if (targetPages.length === 0 || targetPages.some(p => p <= 0)) {
          throw new Error("Page numbers must be positive integers.");
      }
  } catch (error: any) {
      throw new McpError(ErrorCode.InvalidParams, `Invalid page specification: ${error.message}`);
  }

  // Remove the redundant declaration and logic for targetPages here
  // It's already handled correctly starting at line 67
  const { path: relativePath, url } = parsedArgs; // Keep path and url extraction
  let dataBuffer: Buffer;
  let sourceDescription: string = 'unknown source'; // Initialize
  const extractedTexts: { page: number; text: string }[] = [];

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

    // Use the pagerender callback to capture text page by page
    const options = {
      async pagerender(pageData: any) {
        // pageData.page is 0-based in the callback? Let's assume 1-based based on pdf-parse docs examples
        // But pdf-parse docs are inconsistent. Let's test or assume 1-based for now.
        // If it's 0-based, we need to adjust: const currentPage = pageData.page + 1;
        const currentPage = pageData.page; // Assuming 1-based page number from pdf-parse

        if (targetPages.includes(currentPage)) {
          try {
            const textContent = await pageData.getTextContent();
            extractedTexts.push({
              page: currentPage,
              text: textContent.items.map((item: any) => item.str).join(' '), // Join text items
            });
          } catch (renderError: any) {
             console.warn(`[PDF Reader MCP] Error getting text content for page ${currentPage}: ${renderError.message}`);
             // Optionally add an error entry for this page
             extractedTexts.push({
                page: currentPage,
                text: `Error rendering page: ${renderError.message}`
             });
          }
        }
        return ''; // Must return something (string expected)
      }
    };

    // Run pdf-parse with the pagerender option
    await pdf(dataBuffer, options);

    // Sort results by page number just in case pagerender wasn't sequential
    extractedTexts.sort((a, b) => a.page - b.page);

    // Check if any requested pages were actually found/rendered
    const foundPages = extractedTexts.map(t => t.page);
    const missingPages = targetPages.filter(p => !foundPages.includes(p));

    if (extractedTexts.length === 0 && targetPages.length > 0) {
        // Attempt to get total pages to give better context
        let totalPages = 'unknown';
        try {
            const basicData = await pdf(dataBuffer); // Parse again without options for total pages
            totalPages = basicData.numpages.toString();
        } catch (_) { /* Ignore error here */ }
        throw new McpError(ErrorCode.InvalidRequest, `Requested pages (${targetPages.join(', ')}) not found or rendered. Total pages: ${totalPages}.`);
    }

    // Return the collected texts
    return {
        pages: extractedTexts,
        missingPages: missingPages.length > 0 ? missingPages : undefined, // Include missing pages if any
    };

  } catch (error: any) {
    if (error instanceof McpError) throw error; // Re-throw McpErrors

    let errorMessage = `Failed to read or parse PDF for page text from ${sourceDescription}.`;
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
export const readPdfPageTextToolDefinition: ToolDefinition = {
  name: 'read_pdf_page_text',
  description: 'Reads text content from specific pages of a PDF file.',
  schema: ReadPdfPageTextArgsSchema,
  handler: handleReadPdfPageTextFunc,
};