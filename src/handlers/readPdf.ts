import { z } from 'zod';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
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

// Define the schema for a single PDF source
const PdfSourceSchema = z.object({
    path: z.string().min(1).optional().describe("Relative path to the local PDF file."),
    url: z.string().url().optional().describe("URL of the PDF file."),
}).strict().refine(
    (data) => (data.path && !data.url) || (!data.path && data.url),
    { message: "Each source must have either 'path' or 'url', but not both." }
);

// Define the Zod schema for the consolidated tool supporting multiple sources
const ReadPdfArgsSchema = z.object({
  sources: z.array(PdfSourceSchema).min(1).describe("An array of PDF sources to process."),
  include_full_text: z.boolean().optional().default(false).describe("Include the full text content of each PDF."),
  include_metadata: z.boolean().optional().default(true).describe("Include metadata and info objects for each PDF."),
  include_page_count: z.boolean().optional().default(true).describe("Include the total number of pages for each PDF."),
  pages: z.union([
    z.array(z.number().int().positive()).min(1),
    z.string().min(1).refine(val => /^[0-9,\-]+$/.test(val), { message: "Page string must contain only numbers, commas, and hyphens." })
  ]).optional().describe("Extract text only from specific pages (1-based) or ranges (e.g., [1, 3, 5] or '1,3-5,7') for each PDF. If provided, 'include_full_text' is ignored."),
}).strict().refine(
    (data) => !(data.pages && data.include_full_text),
    { message: "Cannot request both 'pages' (specific page text) and 'include_full_text' (full document text) simultaneously." }
);

type ReadPdfArgs = z.infer<typeof ReadPdfArgsSchema>;

// Define the handler function using pdfjs-dist, now handling multiple sources
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
    sources,
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

  const results: any[] = [];

  for (const source of sources) {
    let pdfDataSource: Buffer | { url: string };
    let sourceDescription: string = source.path ? `'${source.path}'` : (source.url ? `'${source.url}'` : 'unknown source');
    let individualResult: any = { source: source.path ?? source.url }; // Identify which result corresponds to which source

    try {
      // 1. Prepare PDF data source for this source
      if (source.path) {
        const safePath = resolvePath(source.path);
        pdfDataSource = await fs.readFile(safePath);
      } else if (source.url) {
        pdfDataSource = { url: source.url }; // pdfjs handles URL fetching
      } else {
        // Should be caught by schema validation, but good to have safeguard
         throw new McpError(ErrorCode.InvalidParams, "Source missing 'path' or 'url'.");
      }

      // 2. Load PDF document
      const loadingTask = pdfjsLib.getDocument(pdfDataSource);
      // Note: Catching errors within the loop to allow processing other sources
      const pdfDocument = await loadingTask.promise.catch((err: any) => {
          console.error(`[PDF Reader MCP] PDF.js loading error for ${sourceDescription}:`, err);
          throw new McpError(ErrorCode.InvalidRequest, `Failed to load PDF document. Reason: ${err?.message || 'Unknown loading error'}`, { cause: err });
      });

      // 3. Extract requested data
      const output: any = {};
      const totalPages = pdfDocument.numPages;

      if (include_metadata) {
          const metadata = await pdfDocument.getMetadata();
          output.info = metadata?.info;
          output.metadata = metadata?.metadata?.getAll();
      }
      if (include_page_count) {
          output.num_pages = totalPages;
      }

      let pagesToProcess: number[] = [];
      if (targetPages) {
          pagesToProcess = targetPages.filter(p => p <= totalPages); // Only process valid pages for this doc
          const invalidPages = targetPages.filter(p => p > totalPages);
          if (invalidPages.length > 0) {
              output.warnings = output.warnings || [];
              output.warnings.push(`Requested page numbers ${invalidPages.join(', ')} exceed total pages (${totalPages}).`);
          }
      } else if (include_full_text) {
          pagesToProcess = Array.from({ length: totalPages }, (_, i) => i + 1);
      }

      // 4. Extract text content if needed
      const extractedPageTexts: { page: number; text: string }[] = [];
      if (pagesToProcess.length > 0) {
          for (const pageNum of pagesToProcess) {
              try {
                  const page = await pdfDocument.getPage(pageNum);
                  const textContent = await page.getTextContent();
                  const pageText = textContent.items.map((item: any) => item.str).join('');
                  extractedPageTexts.push({ page: pageNum, text: pageText });
              } catch (pageError: any) {
                   console.warn(`[PDF Reader MCP] Error getting text content for page ${pageNum} in ${sourceDescription}: ${pageError.message}`);
                   if (targetPages) { // Only add error text if specific pages were requested
                      extractedPageTexts.push({ page: pageNum, text: `Error processing page: ${pageError.message}` });
                   }
              }
          }
          extractedPageTexts.sort((a, b) => a.page - b.page);
      }

      // 5. Populate output text fields
      if (targetPages) {
          output.page_texts = extractedPageTexts;
          // Note: missing_pages calculation might be complex if some pages error out
      } else if (include_full_text) {
          output.full_text = extractedPageTexts.map(p => p.text).join('\n\n');
      }

      // Add extracted data to the individual result
      individualResult = { ...individualResult, ...output, success: true };

    } catch (error: any) {
      // Catch errors specific to this source
      let errorMessage = `Failed to process PDF from ${sourceDescription}.`;
       if (error instanceof McpError) {
           errorMessage = error.message; // Use McpError message directly
       } else if (source.path && error.code === 'ENOENT') {
           const safePath = resolvePath(source.path); // Resolve again for error message
           errorMessage = `File not found at '${source.path}'. Resolved to: ${safePath}`;
       } else if (error instanceof Error) {
          errorMessage += ` Reason: ${error.message}`;
       } else {
          errorMessage += ` Unknown error: ${String(error)}`;
       }
       individualResult.error = errorMessage;
       individualResult.success = false;
    }
    results.push(individualResult);
  } // End loop over sources

  // Format the final result containing the array of individual results
  return {
      content: [{
          type: "text",
          text: JSON.stringify({ results }, null, 2) // Wrap the array in a 'results' key
      }]
  };
};

// Export the consolidated ToolDefinition
export const readPdfToolDefinition: ToolDefinition = {
  name: 'read_pdf',
  description: 'Reads content, metadata, or page count from one or more PDF files (local or URL) using pdfjs-dist, controlled by parameters.',
  schema: ReadPdfArgsSchema,
  handler: handleReadPdfFunc,
};