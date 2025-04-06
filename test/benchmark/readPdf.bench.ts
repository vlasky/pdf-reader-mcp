import { describe, bench, vi } from 'vitest';
import { handleReadPdfFunc } from '../../src/handlers/readPdf'; // Adjust path as needed
import path from 'node:path';
import fs from 'node:fs/promises';

// Mock the project root - Vitest runs from the project root by default
const PROJECT_ROOT = process.cwd();
const SAMPLE_PDF_PATH = 'test/fixtures/sample.pdf'; // Relative path to test PDF

// Pre-check if the sample PDF exists to avoid errors during benchmark setup
let pdfExists = false;
try {
  await fs.access(path.resolve(PROJECT_ROOT, SAMPLE_PDF_PATH));
  pdfExists = true;
} catch (error) {
  console.warn(
    `Warning: Sample PDF not found at ${SAMPLE_PDF_PATH}. Benchmarks requiring it will be skipped.`
  );
}

describe('read_pdf Handler Benchmarks', () => {
  // Benchmark getting only metadata and page count
  bench(
    'Get Metadata & Page Count',
    async () => {
      if (!pdfExists) return; // Skip if PDF doesn't exist
      await handleReadPdfFunc({
        sources: [{ path: SAMPLE_PDF_PATH }],
        include_metadata: true,
        include_page_count: true,
        include_full_text: false,
      });
    },
    { time: 1000 }
  ); // Run for 1 second

  // Benchmark getting full text
  bench(
    'Get Full Text',
    async () => {
      if (!pdfExists) return;
      await handleReadPdfFunc({
        sources: [{ path: SAMPLE_PDF_PATH }],
        include_metadata: false,
        include_page_count: false,
        include_full_text: true,
      });
    },
    { time: 1000 }
  );

  // Benchmark getting specific pages (e.g., page 1)
  bench(
    'Get Specific Page (Page 1)',
    async () => {
      if (!pdfExists) return;
      await handleReadPdfFunc({
        sources: [{ path: SAMPLE_PDF_PATH, pages: [1] }],
        include_metadata: false,
        include_page_count: false,
        include_full_text: false, // Should be ignored when pages is set
      });
    },
    { time: 1000 }
  );

  // Benchmark getting multiple specific pages (e.g., pages 1 & 2)
  bench(
    'Get Specific Pages (Pages 1 & 2)',
    async () => {
      if (!pdfExists) return;
      // Assuming sample.pdf has at least 2 pages
      await handleReadPdfFunc({
        sources: [{ path: SAMPLE_PDF_PATH, pages: [1, 2] }],
        include_metadata: false,
        include_page_count: false,
      });
    },
    { time: 1000 }
  );

  // Benchmark handling a non-existent file (error path)
  bench(
    'Handle Non-Existent File',
    async () => {
      await handleReadPdfFunc({
        sources: [{ path: 'non/existent/file.pdf' }],
        include_metadata: true,
        include_page_count: true,
      });
    },
    { time: 1000 }
  );

  // Add more benchmarks as needed (e.g., larger PDFs, URL sources if feasible in benchmark)
});
