import { z } from 'zod';
// Import pdfjs-dist. Need to figure out the correct import path/style for Node.js
// CommonJS style might be needed, or specific imports. Let's try the standard import first.
// It often requires setting a worker source, but for text extraction in Node, we might bypass it or use a fake worker.
import * as pdfjsLib from 'pdfjs-dist';
// Set up a minimal worker source for Node.js environment compatibility
// pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.js'; // This might not be strictly needed for text extraction in Node, but often included in examples. Let's try without first.
import fs from 'node:fs/promises';
import { resolvePath } from '../utils/pathUtils.js';
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from './index.js';

// Helper (copied from previous version)
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

// Define the Zod schema (remains the same)
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

type ReadPdfArgs = z.infer<typeof ReadPdfArgsSchema>;

// Define the handler function using pdfjs-dist
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
  let pagesToProcess: number[] = []; // All pages or specific pages

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
          pagesToProcess = targetPages; // Process only specified pages
      } catch (error: any) {
          throw new McpError(ErrorCode.InvalidParams, `Invalid page specification: ${error.message}`);
      }
  }

  let pdfDataSource: Buffer | { url: string };
  let sourceDescription: string = 'unknown source';

  try {
    // 1. Prepare PDF data source
    if (relativePath) {
      sourceDescription = `'${relativePath}'`;
      const safePath = resolvePath(relativePath);
      pdfDataSource = await fs.readFile(safePath);
    } else if (url) {
      sourceDescription = `'${url}'`;
      // pdfjs can directly take a URL
      pdfDataSource = { url: url };
    } else {
      throw new McpError(ErrorCode.InvalidParams, "Missing 'path' or 'url'.");
    }

    // 2. Load PDF document
    // Disable worker thread for Node.js environment
    const loadingTask = pdfjsLib.getDocument(pdfDataSource);
    loadingTask.promise.catch((err: any) => { // Add type for err
        // Catch loading errors early
        console.error(`[PDF Reader MCP] PDF.js loading error for ${sourceDescription}:`, err);
        // Throw a more specific error if possible, otherwise rethrow
        throw new McpError(ErrorCode.InvalidRequest, `Failed to load PDF document from ${sourceDescription}. Reason: ${err?.message || 'Unknown loading error'}`, { cause: err });
    });
    const pdfDocument = await loadingTask.promise;


    // 3. Extract requested data
    const output: any = {};
    const totalPages = pdfDocument.numPages;

    // Get metadata if requested
    if (include_metadata) {
        const metadata = await pdfDocument.getMetadata();
        // pdfjs-dist separates info and metadata differently than pdf-parse
        output.info = metadata?.info; // Author, Creator, Dates etc.
        output.metadata = metadata?.metadata?.getAll(); // Raw metadata stream content
    }

    // Get page count if requested
    if (include_page_count) {
        output.num_pages = totalPages;
    }

    // Determine which pages need text extraction
    if (!targetPages && include_full_text) {
        // Need all pages for full text
        pagesToProcess = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else if (!targetPages && !include_full_text) {
        // No text needed
        pagesToProcess = [];
    }
    // If targetPages is set, pagesToProcess is already assigned

    // Validate requested page numbers against total pages
    const invalidPages = pagesToProcess.filter(p => p > totalPages);
     if (invalidPages.length > 0) {
        throw new McpError(ErrorCode.InvalidParams, `Requested page numbers ${invalidPages.join(', ')} exceed total pages (${totalPages}).`);
    }


    // 4. Extract text content if needed
    const extractedPageTexts: { page: number; text: string }[] = [];
    if (pagesToProcess.length > 0) {
        for (const pageNum of pagesToProcess) {
            try {
                const page = await pdfDocument.getPage(pageNum);
                const textContent = await page.getTextContent();
                // Join items into a single string for the page
                const pageText = textContent.items.map((item: any) => item.str).join(''); // Use empty string join for better flow? Or space? Let's try space.
                // const pageText = textContent.items.map((item: any) => item.str).join(' ');
                 extractedPageTexts.push({ page: pageNum, text: pageText });
            } catch (pageError: any) {
                 console.warn(`[PDF Reader MCP] Error getting text content for page ${pageNum}: ${pageError.message}`);
                 // Add error entry if processing specific pages, otherwise skip for full text?
                 if (targetPages) {
                    extractedPageTexts.push({ page: pageNum, text: `Error processing page: ${pageError.message}` });
                 }
            }
        }
        extractedPageTexts.sort((a, b) => a.page - b.page); // Ensure order
    }

    // 5. Populate output text fields
    if (targetPages) {
        output.page_texts = extractedPageTexts;
        const foundPages = extractedPageTexts.map(t => t.page);
        const missingPages = targetPages.filter(p => !foundPages.includes(p));
         if (missingPages.length > 0) {
            output.missing_pages = missingPages;
        }
    } else if (include_full_text) {
        // Combine text from all processed pages
        output.full_text = extractedPageTexts.map(p => p.text).join('\n\n'); // Add double newline between pages?
    }


    // 6. Final checks and return
    if (Object.keys(output).length === 0) {
        return { message: "No information requested. Set include_full_text, include_metadata, include_page_count to true or provide specific pages." };
    }

    return output;

  } catch (error: any) {
    if (error instanceof McpError) throw error;

    let errorMessage = `Failed to process PDF from ${sourceDescription}.`;
    if (relativePath && error.code === 'ENOENT') { // Keep ENOENT check
      const safePath = resolvePath(relativePath);
      errorMessage = `File not found at '${relativePath}'. Resolved to: ${safePath}`;
    } else if (error instanceof Error) {
       errorMessage += ` Reason: ${error.message}`;
    } else {
       errorMessage += ` Unknown error: ${String(error)}`;
    }
    // Check for specific pdfjs errors if possible
    if (error?.name === 'PasswordException') {
         throw new McpError(ErrorCode.InvalidRequest, `PDF from ${sourceDescription} is password protected.`, { cause: error });
    }
     if (error?.name === 'InvalidPDFException') {
         throw new McpError(ErrorCode.InvalidRequest, `Invalid or corrupted PDF document from ${sourceDescription}.`, { cause: error });
    }

    throw new McpError(ErrorCode.InternalError, errorMessage, { cause: error });
  }
};

// Export the consolidated ToolDefinition
export const readPdfToolDefinition: ToolDefinition = {
  name: 'read_pdf',
  description: 'Reads content, metadata, or page count from a PDF file (local or URL) using pdfjs-dist, controlled by parameters.',
  schema: ReadPdfArgsSchema,
  handler: handleReadPdfFunc,
};