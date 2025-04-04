// Import only the consolidated PDF tool definition
import { readPdfToolDefinition } from './readPdf.js';

// Define the structure for a tool definition (used internally and for index.ts)
// We need Zod here to define the schema type correctly
import { z } from 'zod';
export interface ToolDefinition {
    name: string;
    description: string;
    schema: z.ZodType<any, any, any>; // Use Zod schema type
    handler: (args: unknown) => Promise<any>; // Handler function type
}

// Aggregate only the consolidated PDF tool definition
export const allToolDefinitions: ToolDefinition[] = [
    readPdfToolDefinition,
];