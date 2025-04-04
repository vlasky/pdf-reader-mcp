import { z } from 'zod';
import pdf from 'pdf-parse';
import fs from 'node:fs/promises';
import { resolvePath } from '../utils/pathUtils.js';
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from './index.js';

// Helper (copied from readPdfPageText)
const parsePageRanges = (ranges: string): number[] => {
    const pages: Set<number> = new Set();
    const parts = ranges.split(',');
    for (const part of parts) {
        if (part.includes('-')) {
            const [startStr, endStr] = part.split('-');
            const start = parseInt(startStr, 10);
            const end = parseInt(endStr, 10);
            if (!isNaN(start) && !isNaN(end) && start <= end) {
                for (let i = start; i <= end; i++) { pages.add(i); }
            } else { throw new Error(`Invalid page range: ${part}`); }
        } else {
            const page = parseInt(part, 10);
            if (!isNaN(page)) { pages.add(page); }
            else { throw new Error(`Invalid page number: ${part}`); }
        }
    }
    return Array.from(pages).sort((a, b) => a - b);
};

// Define the Zod schema for the consolidated tool
const ReadPdfArgsSchema = z.object({
  path: z.string().min(1).optional().describe("Relative path to the local PDF file."),
  url: z.string().url().optional().describe("URL of the PDF file."),
  include_full_text: z.boolean().optional().default(false).describe("Include the full text content of the PDF."),
  include_metadata: z.boolean().optional().default(true).describe("Include metadata and info objects."),
  include_page_count: z.boolean().optional().default(true).describe("Include the total number of pages."),
  pages: z.union([
    z.array(z.number().int().positive()).min(1),
    z.string().min(1).refine(val => /^[0-9,\-]+$/.test(val), { message: "Page string must contain only numbers, commas, and hyphens." })
  ]).optional().describe("Extract text only from specific pages (1-based) or ranges (e.g., [1, 3, 5] or '1,3-5,7'). If provided, 'include_full_text' is ignored and output contains 'page_texts' array."),
}).strict().refine(
    (data) => (data.path && !data.url) || (!data.path && data.url),
    { message: "Either 'path' or 'url' must be provided, but not both." }
).refine(
    (data) => !(data.pages && data.include_full_text),
    { message: "Cannot request both 'pages' (specific page text) and 'include_full_text' (full document text) simultaneously. If 'pages' is provided, only text for those pages will be returned." }
);

// Infer TypeScript type
type ReadPdfArgs = z.infer<typeof ReadPdfArgsSchema>;

// Define the handler function
const handleReadPdfFunc = async (args: unknown) => {
  let parsedArgs: ReadPdfArgs;
  try {
    parsedArgs = ReadPdfArgsSchema.parse(args);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new McpError(ErrorCode.InvalidParams, `Invalid arguments: ${error.errors.map(e => `${e.path.join('.')} (${e.message})`).join(', ')}`);
    }
    throw new McpError(ErrorCode.InvalidParams, 'Argument validation failed');
  }

  const {
    path: relativePath,
    url,
    include_full_text,
    include_metadata,
    include_page_count,
    pages: requestedPagesInput
  } = parsedArgs;

  let targetPages: number[] | undefined = undefined;
  if (requestedPagesInput) {
      try {
          if (typeof requestedPagesInput === 'string') {
              targetPages = parsePageRanges(requestedPagesInput);
          } else {
              targetPages = [...new Set(requestedPagesInput)].sort((a, b) => a - b);
          }
          if (targetPages.length === 0 || targetPages.some(p => p <= 0)) {
              throw new Error("Page numbers must be positive integers.");
          }
      } catch (error: any) {
          throw new McpError(ErrorCode.InvalidParams, `Invalid page specification: ${error.message}`);
      }
  }

  let dataBuffer: Buffer;
  let sourceDescription: string = 'unknown source';

  try {
    // 1. Fetch or read the PDF buffer
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

    // 2. Parse the PDF (conditionally using pagerender)
    let pdfData: any;
    const extractedPageTexts: { page: number; text: string }[] = [];
    let missingPages: number[] = [];

    if (targetPages) {
        // --- Parse specific pages using pagerender ---
        const options = {
          async pagerender(pageData: any) {
            const currentPage = pageData.page; // Assuming 1-based
            if (targetPages!.includes(currentPage)) {
              try {
                const textContent = await pageData.getTextContent();
                extractedPageTexts.push({
                  page: currentPage,
                  text: textContent.items.map((item: any) => item.str).join(' '),
                });
              } catch (renderError: any) {
                 console.warn(`[PDF Reader MCP] Error getting text content for page ${currentPage}: ${renderError.message}`);
                 extractedPageTexts.push({ page: currentPage, text: `Error rendering page: ${renderError.message}` });
              }
            }
            return '';
          }
        };
        pdfData = await pdf(dataBuffer, options); // Still get metadata etc. even with pagerender
        extractedPageTexts.sort((a, b) => a.page - b.page);
        const foundPages = extractedPageTexts.map(t => t.page);
        missingPages = targetPages.filter(p => !foundPages.includes(p));

        if (extractedPageTexts.length === 0) {
            throw new McpError(ErrorCode.InvalidRequest, `Requested pages (${targetPages.join(', ')}) not found or rendered. Total pages: ${pdfData?.numpages ?? 'unknown'}.`);
        }

    } else {
        // --- Parse the whole document normally ---
        pdfData = await pdf(dataBuffer);
    }

    // 3. Construct the output based on flags
    const output: any = {};
    if (targetPages) {
        // Output for specific pages request
        output.page_texts = extractedPageTexts;
        if (missingPages.length > 0) {
            output.missing_pages = missingPages;
        }
    } else if (include_full_text) {
        // Output full text if requested and not specific pages
        output.full_text = pdfData.text;
    }

    if (include_metadata) {
        output.info = pdfData.info;
        output.metadata = pdfData.metadata;
    }
    if (include_page_count) {
        output.num_pages = pdfData.numpages;
    }
    // Optionally add version?
    // output.version = pdfData.version;

    // Check if output is empty (if all flags were false)
     if (Object.keys(output).length === 0) {
        return { message: "No information requested. Set include_full_text, include_metadata, include_page_count to true or provide specific pages." };
    }

    return output;

  } catch (error: any) {
    if (error instanceof McpError) throw error;

    let errorMessage = `Failed to process PDF from ${sourceDescription}.`;
    if (relativePath && error.code === 'ENOENT') {
      const safePath = resolvePath(relativePath);
      errorMessage = `File not found at '${relativePath}'. Resolved to: ${safePath}`;
    } else if (error instanceof Error) {
       errorMessage += ` Reason: ${error.message}`;
    } else {
       errorMessage += ` Unknown error: ${String(error)}`;
    }
    throw new McpError(ErrorCode.InternalError, errorMessage, { cause: error });
  }
};

// Export the consolidated ToolDefinition
export const readPdfToolDefinition: ToolDefinition = {
  name: 'read_pdf',
  description: 'Reads content, metadata, or page count from a PDF file (local or URL), controlled by parameters.',
  schema: ReadPdfArgsSchema,
  handler: handleReadPdfFunc,
};