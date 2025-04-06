import { z } from 'zod';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'node:fs/promises';
import { resolvePath } from '../utils/pathUtils.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import type { ToolDefinition } from './index.js';

// Helper
const parsePageRanges = (ranges: string): number[] => {
  const pages: Set<number> = new Set();
  const parts = ranges.split(',');
  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      // Add checks for undefined before parseInt, although split should guarantee elements if includes('-') is true
      if (startStr === undefined || endStr === undefined) {
        throw new Error(`Invalid page range format after split: ${part}`);
      }
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

// Define the schema for a single PDF source, now including optional pages
const PdfSourceSchema = z
  .object({
    path: z.string().min(1).optional().describe('Relative path to the local PDF file.'),
    url: z.string().url().optional().describe('URL of the PDF file.'),
    pages: z
      .union([
        z.array(z.number().int().positive()).min(1),
        z
          .string()
          .min(1)
          .refine((val) => /^[0-9,-]+$/.test(val), {
            message: 'Page string must contain only numbers, commas, and hyphens.',
          }), // Removed unnecessary escape for hyphen
      ])
      .optional()
      .describe(
        "Extract text only from specific pages (1-based) or ranges for *this specific source*. If provided, 'include_full_text' for the entire request is ignored for this source."
      ),
  })
  .strict()
  .refine((data) => (data.path && !data.url) || (!data.path && data.url), {
    message: "Each source must have either 'path' or 'url', but not both.",
  });

// Define the Zod schema for the consolidated tool
// Remove the global 'pages' parameter
const ReadPdfArgsSchema = z
  .object({
    sources: z
      .array(PdfSourceSchema)
      .min(1)
      .describe('An array of PDF sources to process, each can optionally specify pages.'),
    include_full_text: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        "Include the full text content of each PDF (only if 'pages' is not specified for that source)."
      ),
    include_metadata: z
      .boolean()
      .optional()
      .default(true)
      .describe('Include metadata and info objects for each PDF.'),
    include_page_count: z
      .boolean()
      .optional()
      .default(true)
      .describe('Include the total number of pages for each PDF.'),
  })
  .strict()
  .refine(
    () => {
      // Ensure unused 'data' parameter is removed
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
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid arguments: ${error.errors.map((e) => `${e.path.join('.')} (${e.message})`).join(', ')}`
      );
    }
    throw new McpError(ErrorCode.InvalidParams, 'Argument validation failed');
  }

  const {
    sources,
    include_full_text, // Global flag, applies only if source doesn't specify pages
    include_metadata,
    include_page_count,
  } = parsedArgs;

  // Define interfaces for clearer result typing (assuming they might have been lost in previous diffs)
  interface PdfInfo {
    PDFFormatVersion?: string;
    IsLinearized?: boolean;
    IsAcroFormPresent?: boolean;
    IsXFAPresent?: boolean;
    [key: string]: unknown; // Allow other properties
  }

  interface PdfMetadata {
    [key: string]: unknown;
  }

  interface ExtractedPageText {
    page: number;
    text: string;
  }

  interface PdfResultData {
    info?: PdfInfo;
    metadata?: PdfMetadata;
    num_pages?: number;
    full_text?: string;
    page_texts?: ExtractedPageText[];
    warnings?: string[];
  }

  interface PdfSourceResult {
    source: string;
    success: boolean;
    data?: PdfResultData;
    error?: string;
  }
  const results: PdfSourceResult[] = []; // Ensure specific type is used

  for (const source of sources) {
    let pdfDataSource: Buffer | { url: string };
    const sourceDescription: string = source.path
      ? `'${source.path}'`
      : source.url
        ? `'${source.url}'`
        : 'unknown source';
    let individualResult: PdfSourceResult = {
      source: source.path ?? source.url ?? 'unknown',
      success: false,
    }; // Ensure specific type and initialization
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
          if (targetPages.length === 0 || targetPages.some((p) => p <= 0)) {
            throw new Error('Page numbers must be positive integers.');
          }
        } catch (error: unknown) {
          // Use unknown type
          // Throw specific error for this source's page spec
          // Add type guard for error message
          const message = error instanceof Error ? error.message : String(error);
          throw new McpError(
            ErrorCode.InvalidParams,
            `Invalid page specification for source ${sourceDescription}: ${message}`
          );
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
      const pdfDocument = await loadingTask.promise.catch((err: unknown) => {
        // Use unknown type
        console.error(`[PDF Reader MCP] PDF.js loading error for ${sourceDescription}:`, err);
        // Add type guard for error message and cause
        const message = err instanceof Error ? err.message : String(err);
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Failed to load PDF document. Reason: ${message || 'Unknown loading error'}`,
          { cause: err instanceof Error ? err : undefined }
        );
      });

      // 3. Extract requested data
      const output: PdfResultData = {}; // Ensure specific type
      const totalPages = pdfDocument.numPages;

      if (include_metadata) {
        const metadata = await pdfDocument.getMetadata();
        // Cast to expected types
        // Assign only if the value exists to comply with exactOptionalPropertyTypes
        // Remove unnecessary optional chain as metadata is checked by include_metadata guard
        const infoData = metadata.info as PdfInfo | undefined;
        if (infoData !== undefined) {
          output.info = infoData;
        }
        // Remove unnecessary optional chains as metadata is checked by include_metadata guard
        // Remove unnecessary optional chain for metadata.metadata as getMetadata() should return object with metadata property if it exists
        const metadataObj = metadata.metadata;
        const metadataData = metadataObj.getAll() as PdfMetadata | undefined; // Remove optional chain here
        if (metadataData !== undefined) {
          output.metadata = metadataData;
        }
      }
      if (include_page_count) {
        output.num_pages = totalPages;
      }

      let pagesToProcess: number[] = [];
      // Determine pages to process based on *this source's* pages parameter or the global include_full_text flag
      if (targetPages) {
        // Pages specified for this source
        pagesToProcess = targetPages.filter((p) => p <= totalPages);
        const invalidPages = targetPages.filter((p) => p > totalPages);
        if (invalidPages.length > 0) {
          output.warnings = output.warnings || [];
          output.warnings.push(
            `Requested page numbers ${invalidPages.join(', ')} exceed total pages (${String(totalPages)}).` // Explicitly convert number to string
          );
        }
      } else if (include_full_text) {
        // No pages specified for source, check global flag
        pagesToProcess = Array.from({ length: totalPages }, (_, i) => i + 1);
      }

      // 4. Extract text content if needed
      const extractedPageTexts: { page: number; text: string }[] = [];
      if (pagesToProcess.length > 0) {
        for (const pageNum of pagesToProcess) {
          try {
            const page = await pdfDocument.getPage(pageNum);
            const textContent = await page.getTextContent();
            // Assuming item.str exists, use unknown and cast
            const pageText = textContent.items
              .map((item: unknown) => (item as { str: string }).str)
              .join(''); // Ensure type assertion
            extractedPageTexts.push({ page: pageNum, text: pageText });
          } catch (pageError: unknown) {
            // Use unknown type
            // Add type guard for error message
            const message = pageError instanceof Error ? pageError.message : String(pageError);
            console.warn(
              `[PDF Reader MCP] Error getting text content for page ${String(pageNum)} in ${sourceDescription}: ${message}` // Explicitly convert number to string
            );
            if (targetPages) {
              extractedPageTexts.push({ page: pageNum, text: `Error processing page: ${message}` });
            }
          }
        }
        extractedPageTexts.sort((a, b) => a.page - b.page);
      }

      // 5. Populate output text fields
      if (targetPages) {
        // If pages were specified for *this source*
        output.page_texts = extractedPageTexts;
        // Note: missing_pages calculation might be complex if some pages error out
      } else if (include_full_text) {
        // Only include full_text if pages were NOT specified for this source AND global flag is true
        output.full_text = extractedPageTexts.map((p) => p.text).join('\n\n');
      }

      individualResult = { ...individualResult, data: output, success: true }; // Nest data under 'data' key
    } catch (error) {
      // Use unknown type for error
      let errorMessage = `Failed to process PDF from ${sourceDescription}.`;
      if (error instanceof McpError) {
        // If it's already an McpError, use its message directly
        errorMessage = error.message;
      } else if (
        source.path &&
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        // Check for ENOENT specifically for path-based sources
        try {
          const safePath = resolvePath(source.path);
          errorMessage = `File not found at '${source.path}'. Resolved to: ${safePath}`;
        } catch {
          // Remove unused variable binding
          // Handle cases where resolvePath itself might fail (e.g., invalid chars)
          errorMessage = `File not found at '${source.path}', and path resolution also failed.`;
        }
      } else if (error instanceof Error) {
        // Generic Error
        errorMessage += ` Reason: ${error.message}`;
      } else {
        // Fallback for unknown error types
        // Use JSON.stringify for non-Error objects to get a more useful representation
        errorMessage += ` Unknown error: ${JSON.stringify(error)}`;
      }
      individualResult.error = errorMessage;
      individualResult.success = false;
      // Ensure data is not included on error
      delete individualResult.data; // Remove data property on error
    }
    results.push(individualResult);
  } // End loop over sources

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ results }, null, 2),
      },
    ],
  };
};

// Export the consolidated ToolDefinition
export const readPdfToolDefinition: ToolDefinition = {
  name: 'read_pdf',
  description:
    'Reads content/metadata from one or more PDFs (local/URL). Each source can specify pages to extract.',
  schema: ReadPdfArgsSchema,
  handler: handleReadPdfFunc,
};
