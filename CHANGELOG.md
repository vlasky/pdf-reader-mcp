# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup based on filesystem-mcp.
- Core `read_pdf` tool using `pdfjs-dist` library.
- Support for reading text, metadata, and page count.
- Support for local file paths and URLs.
- Support for processing multiple sources in one call with per-source page selection.
- Basic README and Memory Bank documentation.
- Dockerfile and .dockerignore.
- GitHub Actions workflow for publishing (initial version).