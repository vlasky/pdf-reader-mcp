// Import only the PDF tool definitions
import { readPdfAllTextToolDefinition } from './readPdfAllText.js';
import { readPdfPageTextToolDefinition } from './readPdfPageText.js';
import { getPdfMetadataToolDefinition } from './getPdfMetadata.js';
import { getPdfPageCountToolDefinition } from './getPdfPageCount.js';

// Define the structure for a tool definition (used internally and for index.ts)
// We need Zod here to define the schema type correctly
import { z } from 'zod';
export interface ToolDefinition {
    name: string;
    description: string;
    schema: z.ZodType<any, any, any>; // Use Zod schema type
    handler: (args: unknown) => Promise<any>; // Handler function type
}

// Aggregate only the PDF tool definitions into a single array
export const allToolDefinitions: ToolDefinition[] = [
    readPdfAllTextToolDefinition,
    readPdfPageTextToolDefinition,
    getPdfMetadataToolDefinition,
    getPdfPageCountToolDefinition,
];