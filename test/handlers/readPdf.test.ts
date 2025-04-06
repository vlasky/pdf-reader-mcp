import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'; // Removed afterEach
// Removed unused import: import { readPdfToolDefinition } from '../../src/handlers/readPdf.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
// Removed unused import: import fs from 'node:fs/promises';
// Removed unused import: import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { resolvePath } from '../../src/utils/pathUtils.js'; // Removed PROJECT_ROOT

// Define a type for the expected structure after JSON.parse
type ExpectedResultType = { results: { source: string; success: boolean; data?: object; error?: string }[] };


// --- Mocking pdfjs-dist ---
// Define mocks that can be accessed and reset
// Removed unused variable: const mockGetTextContent = vi.fn();
const mockGetMetadata = vi.fn();
const mockGetPage = vi.fn();
const mockGetDocument = vi.fn();
const mockReadFile = vi.fn(); // Define mockReadFile externally

// Use vi.doMock - NOT HOISTED
vi.doMock('pdfjs-dist/legacy/build/pdf.mjs', () => {
  return {
    getDocument: mockGetDocument,
  };
});
// Correctly mock the named export 'readFile' from the 'node:fs/promises' module
// Mock the default export of 'node:fs/promises' which is an object
vi.doMock('node:fs/promises', () => {
  return {
    // Provide the default export object containing the mocked function
    default: {
      readFile: mockReadFile,
      // Add other fs.promises functions here if needed by the handler, e.g.:
      // stat: vi.fn(),
    },
    // Also mock the named export if it's somehow accessed directly (less likely)
    readFile: mockReadFile,
    __esModule: true, // Hint to Vitest this is an ES module mock
  };
});

// --- Mocking pathUtils (Optional, if needed for specific path scenarios) ---
// vi.mock('../../src/utils/pathUtils.js', () => ({
//     resolvePath: vi.fn((p) => require('path').resolve(PROJECT_ROOT, p)), // Basic mock
//     PROJECT_ROOT: '/mock/project/root' // Or use actual PROJECT_ROOT
// }));

// Dynamically import the handler *once* after mocks are defined
let handler: (args: unknown) => Promise<{ content: { type: string; text: string }[] }>; // Use specific type
beforeAll(async () => {
  const { readPdfToolDefinition: importedDefinition } = await import(
    '../../src/handlers/readPdf.js'
  );
  handler = importedDefinition.handler;
});

describe('read_pdf Tool Handler', () => {
  beforeEach(() => {
    // No longer needs to be async
    // Reset mocks before each test
    vi.resetAllMocks();

    // Reset fs mock
    // Reset fs mock implementation
    mockReadFile.mockResolvedValue(Buffer.from('mock pdf content')); // Reset the external mock directly

    // Reset pdfjs mocks using the functions defined outside the factory
    // Reset pdfjs mocks
    const mockDocumentAPI = {
      numPages: 3,
      getMetadata: mockGetMetadata,
      getPage: mockGetPage,
    };
    const mockLoadingTaskAPI = { promise: Promise.resolve(mockDocumentAPI) };
    mockGetDocument.mockReturnValue(mockLoadingTaskAPI); // Set default return value
    mockGetMetadata.mockResolvedValue({
      info: { PDFFormatVersion: '1.7', Title: 'Mock PDF' },
      metadata: {
        _metadataMap: new Map([['dc:format', 'application/pdf']]),
        get(key: string) {
          return this._metadataMap.get(key);
        },
        has(key: string) {
          return this._metadataMap.has(key);
        },
        getAll() {
          return Object.fromEntries(this._metadataMap);
        },
      },
    });
    // Set default implementation for getPage in beforeEach
    // eslint-disable-next-line @typescript-eslint/require-await
    mockGetPage.mockImplementation(async (pageNum: number) => {
      // Use the numPages from the mockDocumentAPI defined *within this beforeEach scope*
      // DO NOT call mockGetDocument() again here.
      if (pageNum > 0 && pageNum <= mockDocumentAPI.numPages) {
        // Use mockDocumentAPI directly
        return {
          getTextContent: vi
            .fn()
            .mockResolvedValueOnce({ items: [{ str: `Mock page text ${pageNum}` }] }),
        };
      }
      throw new Error(`Mock getPage error: Invalid page number ${pageNum}`);
    });
  });

  // --- Test Cases Start Here ---

  it('should successfully read full text, metadata, and page count for a local file', async () => {
    const args = {
      sources: [{ path: 'test.pdf' }],
      include_full_text: true,
      include_metadata: true,
      include_page_count: true,
    };

    // Handler is now available via closure from beforeAll
    const result = await handler(args);
    const expectedData = {
      results: [
        {
          source: 'test.pdf',
          success: true,
          data: {
            info: { PDFFormatVersion: '1.7', Title: 'Mock PDF' },
            metadata: { 'dc:format': 'application/pdf' },
            num_pages: 3,
            full_text: 'Mock page text 1\n\nMock page text 2\n\nMock page text 3',
          },
        },
      ],
    };

    expect(mockReadFile).toHaveBeenCalledWith(resolvePath('test.pdf'));
    expect(mockGetDocument).toHaveBeenCalledWith(Buffer.from('mock pdf content'));
    expect(mockGetMetadata).toHaveBeenCalled();
    expect(mockGetPage).toHaveBeenCalledTimes(3); // Called for pages 1, 2, 3
    expect(result.content[0].type).toBe('text');
    expect(JSON.parse(result.content[0].text) as ExpectedResultType).toEqual(expectedData);
  });

  it('should successfully read specific pages for a local file', async () => {
    const args = {
      sources: [{ path: 'test.pdf', pages: [1, 3] }],
      // include_full_text: false, // Should be ignored when pages is specified
      include_metadata: false,
      include_page_count: true,
    };

    // Handler is now available via closure from beforeAll
    const result = await handler(args);
    const expectedData = {
      results: [
        {
          source: 'test.pdf',
          success: true,
          data: {
            num_pages: 3,
            page_texts: [
              { page: 1, text: 'Mock page text 1' },
              { page: 3, text: 'Mock page text 3' },
            ],
          },
        },
      ],
    };
    expect(mockGetPage).toHaveBeenCalledTimes(2);
    expect(mockGetPage).toHaveBeenCalledWith(1);
    expect(mockGetPage).toHaveBeenCalledWith(3);

    expect(mockReadFile).toHaveBeenCalledWith(resolvePath('test.pdf'));
    expect(mockGetDocument).toHaveBeenCalledWith(Buffer.from('mock pdf content'));
    expect(mockGetMetadata).not.toHaveBeenCalled();
    expect(mockGetPage).toHaveBeenCalledTimes(2); // Called for pages 1, 3
    expect(mockGetPage).toHaveBeenCalledWith(1);
    expect(mockGetPage).toHaveBeenCalledWith(3);
    expect(result.content[0].type).toBe('text');
    expect(JSON.parse(result.content[0].text) as ExpectedResultType).toEqual(expectedData);
  });

  it('should successfully read specific pages using string range', async () => {
    const args = {
      sources: [{ path: 'test.pdf', pages: '1,3-3' }], // Range includes 1 and 3
      include_page_count: true,
    };

    // Handler is now available via closure from beforeAll
    const result = await handler(args);
    const expectedData = {
      results: [
        {
          source: 'test.pdf',
          success: true,
          data: {
            // Add expected default metadata/info since include_metadata defaults to true
            info: { PDFFormatVersion: '1.7', Title: 'Mock PDF' },
            metadata: { 'dc:format': 'application/pdf' },
            num_pages: 3,
            page_texts: [
              { page: 1, text: 'Mock page text 1' },
              { page: 3, text: 'Mock page text 3' },
            ],
          },
        },
      ],
    };
    expect(JSON.parse(result.content[0].text) as ExpectedResultType).toEqual(expectedData);
  });

  it('should successfully read metadata only for a URL', async () => {
    const testUrl = 'http://example.com/test.pdf';
    const args = {
      sources: [{ url: testUrl }],
      include_full_text: false,
      include_metadata: true,
      include_page_count: false,
    };

    // Handler is now available via closure from beforeAll
    const result = await handler(args);
    const expectedData = {
      results: [
        {
          source: testUrl,
          success: true,
          data: {
            info: { PDFFormatVersion: '1.7', Title: 'Mock PDF' },
            metadata: { 'dc:format': 'application/pdf' },
          },
        },
      ],
    };

    expect(mockReadFile).not.toHaveBeenCalled();
    expect(mockGetDocument).toHaveBeenCalledWith({ url: testUrl });
    expect(mockGetMetadata).toHaveBeenCalled();
    expect(mockGetPage).not.toHaveBeenCalled();
    expect(result.content[0].type).toBe('text');
    expect(JSON.parse(result.content[0].text) as ExpectedResultType).toEqual(expectedData);
  });

  it('should handle multiple sources with different options', async () => {
    const urlSource = 'http://example.com/another.pdf';
    const args = {
      sources: [
        { path: 'local.pdf', pages: [1] },
        { url: urlSource }, // Ensure no extra keys like include_full_text here
      ],
      include_full_text: true, // Global flag
      include_metadata: true,
      include_page_count: true,
    };

    // Mock different page count and getPage for the second PDF
    // eslint-disable-next-line @typescript-eslint/require-await
    const secondMockGetPage = vi.fn().mockImplementation(async (pageNum: number) => {
      if (pageNum > 0 && pageNum <= 2) {
        // Hardcoded numPages for second mock
        return {
          getTextContent: vi
            .fn()
            .mockResolvedValueOnce({ items: [{ str: `URL Mock page text ${pageNum}` }] }),
        };
      }
      throw new Error(`Mock getPage error: Invalid page number ${pageNum}`);
    });
    const secondMockDocumentAPI = {
      numPages: 2,
      getMetadata: mockGetMetadata, // Can reuse the same metadata mock or create a new one
      getPage: secondMockGetPage,
    };
    const secondLoadingTaskAPI = { promise: Promise.resolve(secondMockDocumentAPI) };

    // Reset getDocument mock specifically for this test to set the sequence
    mockGetDocument.mockReset();
    // Recreate the default document structure locally as it's cleared by reset
    // We need the default mock document structure for the first call
    const defaultMockDocumentAPI = {
      numPages: 3,
      getMetadata: mockGetMetadata,
      getPage: mockGetPage,
    };
    const defaultLoadingTask = { promise: Promise.resolve(defaultMockDocumentAPI) };
    mockGetDocument
      .mockReturnValueOnce(defaultLoadingTask) // For first source (local.pdf)
      .mockReturnValueOnce(secondLoadingTaskAPI); // For second source (urlSource)

    // Handler is now available via closure from beforeAll
    const result = await handler(args);
    const expectedData = {
      results: [
        {
          // Result for local.pdf
          source: 'local.pdf',
          success: true,
          data: {
            info: { PDFFormatVersion: '1.7', Title: 'Mock PDF' },
            metadata: { 'dc:format': 'application/pdf' },
            num_pages: 3,
            page_texts: [{ page: 1, text: 'Mock page text 1' }],
          },
        },
        {
          // Result for another.pdf
          source: urlSource,
          success: true,
          data: {
            info: { PDFFormatVersion: '1.7', Title: 'Mock PDF' },
            metadata: { 'dc:format': 'application/pdf' },
            num_pages: 2,
            full_text: 'URL Mock page text 1\n\nURL Mock page text 2', // Full text because no pages specified for *this source*
          },
        },
      ],
    };

    expect(mockReadFile).toHaveBeenCalledOnce();
    expect(mockReadFile).toHaveBeenCalledWith(resolvePath('local.pdf'));
    expect(mockGetDocument).toHaveBeenCalledTimes(2);
    expect(mockGetDocument).toHaveBeenCalledWith(Buffer.from('mock pdf content'));
    expect(mockGetDocument).toHaveBeenCalledWith({ url: urlSource });
    // Check calls for the *correct* mock instances
    expect(mockGetPage).toHaveBeenCalledTimes(1); // Called once for the first source (local.pdf)
    expect(secondMockGetPage).toHaveBeenCalledTimes(2); // Called twice for the second source (urlSource)
    expect(JSON.parse(result.content[0].text) as ExpectedResultType).toEqual(expectedData);
  });

  // --- Error Handling Tests ---

  it('should return error if local file not found', async () => {
    const error = new Error('Mock ENOENT') as NodeJS.ErrnoException;
    error.code = 'ENOENT';
    mockReadFile.mockRejectedValue(error); // Reset the external mock directly

    const args = { sources: [{ path: 'nonexistent.pdf' }] };
    // Handler is now available via closure from beforeAll
    const result = await handler(args);
    const expectedData = {
      results: [
        {
          source: 'nonexistent.pdf',
          success: false,
          error: `File not found at 'nonexistent.pdf'. Resolved to: ${resolvePath('nonexistent.pdf')}`,
        },
      ],
    };
    expect(JSON.parse(result.content[0].text) as ExpectedResultType).toEqual(expectedData);
  });

  it('should return error if pdfjs fails to load document', async () => {
    const loadError = new Error('Mock PDF loading failed');
    // Modify the mock setup *for this specific test*
    const failingLoadingTask = { promise: Promise.reject(loadError) };
    mockGetDocument.mockReturnValue(failingLoadingTask);

    const args = { sources: [{ path: 'bad.pdf' }] };

    // Handler is now available via closure from beforeAll
    const result = await handler(args);
    // Cast the parsed result to avoid unsafe access errors
    const parsedResult = JSON.parse(result.content[0].text) as ExpectedResultType;
    expect(parsedResult.results[0].success).toBe(false);
    // Match the actual error format returned by the handler (includes McpError code/prefix)
    expect(parsedResult.results[0].error).toBe(
      `MCP error -32600: Failed to load PDF document. Reason: ${loadError.message}`
    );
  });

  it('should throw McpError for invalid input arguments (Zod error)', async () => {
    const args = { sources: [{ path: 'test.pdf' }], include_full_text: 'yes' }; // Invalid type
    // Handler is now available via closure from beforeAll

    await expect(handler(args)).rejects.toThrow(McpError);
    await expect(handler(args)).rejects.toThrow(
      /Invalid arguments: include_full_text \(Expected boolean, received string\)/
    );
    await expect(handler(args)).rejects.toHaveProperty('code', ErrorCode.InvalidParams);
  });

  it('should throw McpError for invalid page specification string', async () => {
    const args = { sources: [{ path: 'test.pdf', pages: '1,abc,3' }] };
    // Handler is now available via closure from beforeAll

    // Expect the Zod refinement error message from the schema, as reported by Vitest
    await expect(handler(args)).rejects.toThrow(McpError);
    await expect(handler(args)).rejects.toThrow(
      /Invalid arguments: sources.0.pages \(Page string must contain only numbers, commas, and hyphens.\)/
    );
    await expect(handler(args)).rejects.toHaveProperty('code', ErrorCode.InvalidParams);
  });

  it('should throw McpError for invalid page specification array (non-positive - Zod)', async () => {
    // Updated description
    const args = { sources: [{ path: 'test.pdf', pages: [1, 0, 3] }] }; // Page 0 is invalid
    // Handler is now available via closure from beforeAll
    // Expect the Zod array item validation error message, as reported by Vitest
    await expect(handler(args)).rejects.toThrow(McpError);
    await expect(handler(args)).rejects.toThrow(
      /Invalid arguments: sources.0.pages.1 \(Number must be greater than 0\)/
    );
    await expect(handler(args)).rejects.toHaveProperty('code', ErrorCode.InvalidParams);
  });

  it('should include warnings for requested pages exceeding total pages', async () => {
    const args = {
      sources: [{ path: 'test.pdf', pages: [1, 4, 5] }], // Mock total pages is 3
      include_page_count: true,
    };

    // Handler is now available via closure from beforeAll
    const result = await handler(args);
    const expectedData = {
      results: [
        {
          source: 'test.pdf',
          success: true,
          data: {
            // Add expected default metadata/info
            info: { PDFFormatVersion: '1.7', Title: 'Mock PDF' },
            metadata: { 'dc:format': 'application/pdf' },
            num_pages: 3,
            page_texts: [{ page: 1, text: 'Mock page text 1' }],
            warnings: ['Requested page numbers 4, 5 exceed total pages (3).'],
          },
        },
      ],
    };
    expect(mockGetPage).toHaveBeenCalledTimes(1); // Only called for page 1
    expect(mockGetPage).toHaveBeenCalledWith(1);
    expect(JSON.parse(result.content[0].text) as ExpectedResultType).toEqual(expectedData);
  });

  it('should handle errors during page processing gracefully when specific pages are requested', async () => {
    // Make mockGetPage for page 2 throw an error
    // eslint-disable-next-line @typescript-eslint/require-await
    mockGetPage.mockImplementation(async (pageNum: number) => {
      if (pageNum === 1)
        return {
          getTextContent: vi.fn().mockResolvedValueOnce({ items: [{ str: `Mock page text 1` }] }),
        };
      if (pageNum === 2) throw new Error('Failed to get page 2'); // Error for page 2
      if (pageNum === 3)
        return {
          getTextContent: vi.fn().mockResolvedValueOnce({ items: [{ str: `Mock page text 3` }] }),
        };
      // Assuming numPages is 3 for this mock setup in beforeEach
      throw new Error(`Mock getPage error: Invalid page number ${pageNum}`);
    });

    const args = {
      sources: [{ path: 'test.pdf', pages: [1, 2, 3] }],
    };

    // Handler is now available via closure from beforeAll
    const result = await handler(args);
    const expectedData = {
      results: [
        {
          source: 'test.pdf',
          success: true, // Overall source processing might succeed even if a page fails
          data: {
            // Add expected default metadata/info
            info: { PDFFormatVersion: '1.7', Title: 'Mock PDF' },
            metadata: { 'dc:format': 'application/pdf' },
            num_pages: 3, // include_page_count defaults to true
            page_texts: [
              { page: 1, text: 'Mock page text 1' },
              { page: 2, text: 'Error processing page: Failed to get page 2' },
              { page: 3, text: 'Mock page text 3' },
            ],
          },
        },
      ],
    };
    expect(mockGetPage).toHaveBeenCalledTimes(3);
    expect(JSON.parse(result.content[0].text) as ExpectedResultType).toEqual(expectedData);
  });
});
