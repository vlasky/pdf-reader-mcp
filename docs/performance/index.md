# Performance

Performance is an important consideration for the PDF Reader MCP Server, especially when dealing with large or complex PDF documents.

## Benchmarking Goals

Formal benchmarks are planned to measure:

- **Parsing Time:** Time taken to load and parse PDFs of varying sizes (e.g., 1 page, 10 pages, 100 pages, 1000 pages).
- **Text Extraction Speed:** Time taken to extract full text vs. specific pages.
- **Metadata Extraction Speed:** Time taken to retrieve metadata and page count.
- **Memory Usage:** Peak memory consumption during processing of different PDF sizes.
- **URL vs. Local File:** Performance difference between processing local files and downloading/processing from URLs.

## Current Status

Currently, no formal benchmarks have been run. Performance is expected to be largely dependent on the underlying `pdfjs-dist` library and the complexity/size of the input PDF files.

Results will be published here once testing is complete.
