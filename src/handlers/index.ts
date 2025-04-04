import { listFilesToolDefinition } from './listFiles.js';
import { statItemsToolDefinition } from './statItems.js';
import { readContentToolDefinition } from './readContent.js';
import { writeContentToolDefinition } from './writeContent.js';
import { deleteItemsToolDefinition } from './deleteItems.js';
import { createDirectoriesToolDefinition } from './createDirectories.js';
import { chmodItemsToolDefinition } from './chmodItems.js';
import { chownItemsToolDefinition } from './chownItems.js';
import { moveItemsToolDefinition } from './moveItems.js';
import { copyItemsToolDefinition } from './copyItems.js';
import { searchFilesToolDefinition } from './searchFiles.js';
import { replaceContentToolDefinition } from './replaceContent.js';
import { editFileDefinition } from './editFile.js';
import { readPdfAllTextToolDefinition } from './readPdfAllText.js';
import { readPdfPageTextToolDefinition } from './readPdfPageText.js';
import { getPdfMetadataToolDefinition } from './getPdfMetadata.js';
import { getPdfPageCountToolDefinition } from './getPdfPageCount.js'; // Import the page count tool definition
// Define the structure for a tool definition (used internally and for index.ts)
// We need Zod here to define the schema type correctly
import { z } from 'zod';
export interface ToolDefinition {
    name: string;
    description: string;
    schema: z.ZodType<any, any, any>; // Use Zod schema type
    handler: (args: unknown) => Promise<any>; // Handler function type
}

// Aggregate all tool definitions into a single array
export const allToolDefinitions: ToolDefinition[] = [
    listFilesToolDefinition,
    statItemsToolDefinition,
    readContentToolDefinition,
    writeContentToolDefinition,
    deleteItemsToolDefinition,
    createDirectoriesToolDefinition,
    chmodItemsToolDefinition,
    chownItemsToolDefinition,
    moveItemsToolDefinition,
    copyItemsToolDefinition,
    searchFilesToolDefinition,
    replaceContentToolDefinition,
    editFileDefinition,
    readPdfAllTextToolDefinition,
    readPdfPageTextToolDefinition,
    getPdfMetadataToolDefinition,
    getPdfPageCountToolDefinition, // Add the page count definition
];