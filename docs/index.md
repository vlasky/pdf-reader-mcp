---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "PDF Reader MCP Server"
  text: "Unlock PDF Content for Your AI Agents"
  tagline: Securely extract text, metadata, and page information from PDF documents directly within your project context. Empower your AI with seamless PDF understanding.
  # image: # Removed placeholder logo reference
  #   src: /logo.svg
  #   alt: PDF Reader MCP Logo
  actions:
    - theme: brand
      text: Get Started Guide
      link: /guide/
    - theme: alt
      text: View on GitHub
      link: https://github.com/shtse8/pdf-reader-mcp

features:
  - title: 🛡️ Secure by Design
    icon: 🛡️
    details: Operates strictly within the defined project root. Uses validated relative paths, preventing unauthorized file access. Essential for user trust.
  - title: 🔧 Powerful `read_pdf` Tool
    icon: 🔧
    details: A single, flexible MCP tool handles diverse needs – full text, specific pages, metadata, page counts – from local files or URLs. Simplifies agent logic.
  - title: 🚀 Effortless Integration
    icon: 🚀
    details: Integrate quickly using `npx` or the provided Docker image within your existing MCP host environment. Minimal setup required.
  - title: ✅ Robust & Reliable
    icon: ✅
    details: Built with TypeScript's strict type checking, rigorous ESLint rules, comprehensive testing (~95% coverage), and Zod schema validation for dependable operation.
  - title: ⚡ Efficient Processing
    icon: ⚡
    details: Leverages the battle-tested `pdfjs-dist` library for efficient PDF parsing, minimizing processing overhead.
  - title: 🌐 URL & Local File Support
    icon: 🌐
    details: Seamlessly process PDFs stored locally within your project or fetch them directly from public web URLs.
---

## The Problem: PDFs are Black Boxes for AI

AI agents often encounter crucial information trapped within PDF documents – reports, invoices, manuals, research papers. Directly feeding binary PDF data is impractical, and relying on external, potentially insecure tools for every interaction is inefficient and risky.

## The Solution: A Secure MCP Bridge

The **PDF Reader MCP Server** acts as a secure and specialized bridge. It runs as a controlled process within your project's context, exposing a dedicated Model Context Protocol (MCP) tool (`read_pdf`) that allows your AI agent to:

*   Request **full text content**.
*   Extract text from **specific pages or ranges**.
*   Retrieve standard **metadata** (author, title, etc.).
*   Get the total **page count**.

All operations are performed **safely within the project boundaries**, ensuring data privacy and security.

## Core Philosophy

This server is built upon principles of **security, simplicity, and reliability**. We prioritize clear code, minimal dependencies, strict quality checks, and a seamless developer experience.

[Learn more about our Development Principles](./principles.md)

## Performance & Quality

*(Section to be added later - showcasing benchmark results and test coverage details, as per Guideline #9)*

## Get Started Now!

Ready to empower your AI? Head over to the **[Get Started Guide](./guide/)** to learn how to integrate and utilize the `read_pdf` tool in minutes.
