import { z } from 'zod';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'node:fs/promises';
import { resolvePath } from '../utils/pathUtils.js';
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from './index.js';

// Helper
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

// Define the schema for a single PDF source, now including optional pages
const PdfSourceSchema = z.object({
    path: z.string().min(1).optional().describe("Relative path to the local PDF file."),
    url: z.string().url().optional().describe("URL of the PDF file."),
    pages: z.union([
        z.array(z.number().int().positive()).min(1),
        z.string().min(1).refine(val => /^[0-9,\-]+$/.test(val), { message: "Page string must contain only numbers, commas, and hyphens." })
    ]).optional().describe("Extract text only from specific pages (1-based) or ranges for *this specific source*. If provided, 'include_full_text' for the entire request is ignored for this source."),
}).strict().refine(
    (data) => (data.path && !data.url) || (!data.path && data.url),
    { message: "Each source must have either 'path' or 'url', but not both." }
);

// Define the Zod schema for the consolidated tool
// Remove the global 'pages' parameter
const ReadPdfArgsSchema = z.object({
  sources: z.array(PdfSourceSchema).min(1).describe("An array of PDF sources to process, each can optionally specify pages."),
  include_full_text: z.boolean().optional().default(false).describe("Include the full text content of each PDF (only if 'pages' is not specified for that source)."),
  include_metadata: z.boolean().optional().default(true).describe("Include metadata and info objects for each PDF."),
  include_page_count: z.boolean().optional().default(true).describe("Include the total number of pages for each PDF."),
}).strict().refine(
    (data) => {
        // The check for simultaneous 'pages' and 'include_full_text' is now implicitly handled
        // because 'pages' is per-source. If a source has 'pages', its result won't have 'full_text'.
        // If a source *doesn't* have 'pages', then 'include_full_text' applies to it.
        return true; // Keep refine structure but logic moved
    }
    // { message: "Cannot request both 'pages' (specific page text) and 'include_full_text' (full document text) simultaneously." } // Old message no longer applies globally
);

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
    sources,
    include_full_text, // Global flag, applies only if source doesn't specify pages
    include_metadata,
    include_page_count,
  } = parsedArgs;

  const results: any[] = [];

  for (const source of sources) {
    let pdfDataSource: Buffer | { url: string };
    let sourceDescription: string = source.path ? `'${source.path}'` : (source.url ? `'${source.url}'` : 'unknown source');
    let individualResult: any = { source: source.path ?? source.url };
    let targetPages: number[] | undefined = undefined; // Pages specific to this source

    try {
        // Parse pages specific to this source, if provided
        if (source.pages) {
            try {
                if (typeof source.pages === 'string') {
                    targetPages = parsePageRanges(source.pages);
                } else {
                    targetPages = [...new Set(source.pages)].sort((a, b) => a - b);
                }
                if (targetPages.length === 0 || targetPages.some(p => p <= 0)) {
                    throw new Error("Page numbers must be positive integers.");
                }
            } catch (error: any) {
                // Throw specific error for this source's page spec
                throw new McpError(ErrorCode.InvalidParams, `Invalid page specification for source ${sourceDescription}: ${error.message}`);
            }
        }

      // 1. Prepare PDF data source
      if (source.path) {
        const safePath = resolvePath(source.path);
        pdfDataSource = await fs.readFile(safePath);
      } else if (source.url) {
        pdfDataSource = { url: source.url };
      } else {
         throw new McpError(ErrorCode.InvalidParams, "Source missing 'path' or 'url'.");
      }

      // 2. Load PDF document
      const loadingTask = pdfjsLib.getDocument(pdfDataSource);
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
      // Determine pages to process based on *this source's* pages parameter or the global include_full_text flag
      if (targetPages) { // Pages specified for this source
          pagesToProcess = targetPages.filter(p => p <= totalPages);
          const invalidPages = targetPages.filter(p => p > totalPages);
          if (invalidPages.length > 0) {
              output.warnings = output.warnings || [];
              output.warnings.push(`Requested page numbers ${invalidPages.join(', ')} exceed total pages (${totalPages}).`);
          }
      } else if (include_full_text) { // No pages specified for source, check global flag
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
                   if (targetPages) {
                      extractedPageTexts.push({ page: pageNum, text: `Error processing page: ${pageError.message}` });
                   }
              }
          }
          extractedPageTexts.sort((a, b) => a.page - b.page);
      }

      // 5. Populate output text fields
      if (targetPages) { // If pages were specified for *this source*
          output.page_texts = extractedPageTexts;
          // Note: missing_pages calculation might be complex if some pages error out
      } else if (include_full_text) { // Only include full_text if pages were NOT specified for this source AND global flag is true
          output.full_text = extractedPageTexts.map(p => p.text).join('\n\n');
      }

      individualResult = { ...individualResult, data: output, success: true }; // Nest data under 'data' key

    } catch (error: any) {
      let errorMessage = `Failed to process PDF from ${sourceDescription}.`;
       if (error instanceof McpError) {
           errorMessage = error.message;
       } else if (source.path && error.code === 'ENOENT') {
           const safePath = resolvePath(source.path);
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

  return {
      content: [{
          type: "text",
          text: JSON.stringify({ results }, null, 2)
      }]
  };
};

// Export the consolidated ToolDefinition
export const readPdfToolDefinition: ToolDefinition = {
  name: 'read_pdf',
  description: 'Reads content/metadata from one or more PDFs (local/URL). Each source can specify pages to extract.',
  schema: ReadPdfArgsSchema,
  handler: handleReadPdfFunc,
};