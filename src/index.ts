#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { z } from 'zod'; // Import Zod
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from '@modelcontextprotocol/sdk/types.js';
// Import the aggregated tool definitions
import { allToolDefinitions } from './handlers/index.js';
// Removed incorrect import left over from partial diff

// --- Tool Names (Constants) ---
// Removed tool name constants, names are now in the definitions

// --- Server Setup ---

const server = new Server(
  {
    name: 'filesystem-mcp',
    version: '0.4.0', // Increment version for definition refactor
    description: 'MCP Server for filesystem operations relative to the project root.',
  },
  {
    capabilities: { tools: {} },
  }
);

// Helper function to convert Zod schema to JSON schema for MCP
// Use 'unknown' instead of 'any' for better type safety, although casting is still needed for the SDK
const generateInputSchema = (schema: z.ZodType<unknown>): object => {
  // Generate JSON Schema compatible with Claude (draft 2020-12)
  const jsonSchema = zodToJsonSchema(schema, {
    target: 'jsonSchema7',
    $refStrategy: 'none',
  });

  // Convert to 2020-12 format by updating the $schema field
  const result = { ...jsonSchema } as Record<string, unknown>;
  if ('$schema' in result && typeof result['$schema'] === 'string') {
    result['$schema'] = 'https://json-schema.org/draft/2020-12/schema#';
  }

  return result as unknown as object;
};

server.setRequestHandler(ListToolsRequestSchema, () => {
  // Removed unnecessary async
  // Removed log
  // Map the aggregated definitions to the format expected by the SDK
  const availableTools = allToolDefinitions.map((def) => ({
    name: def.name,
    description: def.description,
    inputSchema: generateInputSchema(def.schema), // Generate JSON schema from Zod schema
  }));
  return { tools: availableTools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // Use imported handlers
  // Find the tool definition by name and call its handler
  const toolDefinition = allToolDefinitions.find((def) => def.name === request.params.name);

  if (!toolDefinition) {
    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
  }

  // Call the handler associated with the found definition
  // The handler itself will perform Zod validation on the arguments
  return toolDefinition.handler(request.params.arguments);
});

// --- Server Start ---

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[Filesystem MCP] Server running on stdio');
}

main().catch((error: unknown) => {
  // Specify 'unknown' type for catch variable
  console.error('[Filesystem MCP] Server error:', error);
  process.exit(1);
});
