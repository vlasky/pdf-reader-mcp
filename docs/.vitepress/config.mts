// docs/.vitepress/config.mts
import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'en-US',
  title: 'PDF Reader MCP Server',
  description: 'An MCP server providing tools to read PDF files.',
  base: '/pdf-reader-mcp/', // Base URL for GitHub Pages deployment

  // Theme related configurations.
  // https://vitepress.dev/reference/default-theme-config
  themeConfig: {
    // logo: '/logo.svg', // Removed placeholder logo reference
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'Principles', link: '/principles' },
      { text: 'Testing', link: '/testing' },
      { text: 'Performance', link: '/performance' },
      { text: 'Contributing', link: '/contributing' }, // Link to root CONTRIBUTING.md
      { text: 'Changelog', link: '/changelog' }, // Link to root CHANGELOG.md
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Installation & Setup', link: '/guide/#installation-setup' },
            { text: 'Usage (`read_pdf` Tool)', link: '/guide/#basic-usage-the-read-pdf-tool' },
            // Add more guide pages later
          ],
        },
      ],
      // Add sidebar for other sections if needed, or keep it simple
      // Example: Link top-level pages directly if sidebar isn't complex
      '/': [
        { text: 'Guide', link: '/guide/' },
        { text: 'Principles', link: '/principles' },
        { text: 'Testing', link: '/testing' },
        { text: 'Performance', link: '/performance' },
        { text: 'Contributing', link: '/contributing' },
        { text: 'Changelog', link: '/changelog' },
        { text: 'License', link: '/license' },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/shtse8/pdf-reader-mcp' }],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present shtse8',
    },

    // Optional: Add search, edit links etc.
    // search: { provider: 'local' },
    // editLink: {
    //   pattern: 'https://github.com/shtse8/pdf-reader-mcp/edit/main/docs/:path',
    //   text: 'Edit this page on GitHub'
    // }
  },

  // Ensure clean URLs
  cleanUrls: true,

  // Markdown configuration
  markdown: {
    // options for markdown-it-anchor
    // anchor: { permalink: anchor.permalink.headerLink() },

    // options for markdown-it-toc
    // toc: { level: [1, 2] },

    // Enable line numbers
    lineNumbers: true,
  },
});
