# Tool: read_pdf

Reads content, metadata, or page count from one or more PDF files (local or URL).

## Input Schema (Zod)

```typescript
import { z } from 'zod';

const pageSpecifierSchema = z.union([
  z.array(z.number().int().positive()).min(1), // Array of positive integers
  z.string().min(1), // String for ranges like '1-3,5,7-'
]);

const sourceSchema = z
  .object({
    path: z.string().min(1).describe('Relative path to the local PDF file.').optional(),
    url: z.string().url().describe('URL of the PDF file.').optional(),
    pages: pageSpecifierSchema
      .optional()
      .describe(
        'Extract text only from specific pages (1-based) or ranges. Applies only to this source.'
      ),
  })
  .refine((data) => data.path || data.url, {
    message: 'Either path or url must be provided for each source.',
  });

export const readPdfArgumentsSchema = z.object({
  sources: z.array(sourceSchema).min(1).describe('An array of PDF sources to process.'),
  include_full_text: z
    .boolean()
    .default(false)
    .describe("Include full text (ignored if 'pages' is specified for a source)."),
  include_metadata: z.boolean().default(true).describe('Include metadata and info objects.'),
  include_page_count: z.boolean().default(true).describe('Include the total page count.'),
});

export type ReadPdfArguments = z.infer<typeof readPdfArgumentsSchema>;
```

## Input Parameters

- `sources` (Array\\<Object\\>): **Required.** An array of source objects to process.
  - Each `source` object requires _either_:
    - `path` (String): Relative path to a local PDF file within the project root.
    - `url` (String): A valid URL pointing to a PDF file.
  - Each `source` object can _optionally_ include:
    - `pages` (Array\\<Number\\> | String): Specifies pages to extract text from for _this source only_. Overrides `include_full_text` for this source.
      - **Array Format:** `[1, 3, 5]` (Extracts pages 1, 3, and 5).
      - **String Format:** `'1-3, 5, 7-'` (Extracts pages 1, 2, 3, 5, and 7 to the end). Ranges are inclusive. Order doesn't matter.
- `include_full_text` (Boolean): Optional, default `false`. If `true`, includes the full text content for any source _unless_ that source specifies `pages`.
- `include_metadata` (Boolean): Optional, default `true`. If `true`, includes the `info` and `metadata` objects from `pdfjs-dist`.
- `include_page_count` (Boolean): Optional, default `true`. If `true`, includes the total number of pages (`num_pages`).

## Output Structure

The tool returns an object containing a `results` array. Each element in the array corresponds to a source provided in the input `sources` array, maintaining the original order.

Each result object has the following structure:

```typescript
interface PdfSourceResult {
  source: string; // The original path or URL provided
  success: boolean; // True if processing this source succeeded
  error?: string; // Error message if success is false
  data?: {
    full_text?: string; // Included if include_full_text=true and pages not specified
    page_texts?: { page: number; text: string }[]; // Included if pages specified
    missing_pages?: number[]; // Pages requested but not found (out of bounds)
    info?: any; // Included if include_metadata=true (from pdfjs-dist)
    metadata?: any; // Included if include_metadata=true (from pdfjs-dist)
    num_pages?: number; // Included if include_page_count=true
    warnings?: string[]; // Non-critical warnings (e.g., page out of bounds)
  };
}

interface ReadPdfOutput {
  results: PdfSourceResult[];
}
```

**Important Notes:**

- Processing continues even if some sources encounter errors.
- The `info` and `metadata` objects directly reflect the output from the `pdfjs-dist` library.
- Page numbers are 1-based.
- If `pages` are specified for a source, `full_text` will _not_ be included for that source, even if `include_full_text` is true globally.
- If `pages` are specified, the `page_texts` array will contain the extracted text for the successfully processed requested pages.
- `warnings` might indicate issues like requested pages being outside the valid range of the document.
