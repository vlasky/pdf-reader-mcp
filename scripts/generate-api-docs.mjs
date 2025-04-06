import { Application, TSConfigReader, TypeDocReader } from 'typedoc';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

async function main() {
  const outputDir = 'docs/api';
  const app = new Application();

  // If you are using typedoc-plugin-markdown, configure it here
  app.options.addReader(new TypeDocReader());
  app.options.addReader(new TSConfigReader());

  app.bootstrap({
    entryPoints: ['src/index.ts'],
    tsconfig: 'tsconfig.json',
    plugin: ['typedoc-plugin-markdown'], // Use the markdown plugin
    out: outputDir, // Output directory for markdown files
    readme: 'none', // Don't generate a top-level README in the API dir
    githubPages: false, // We are using VitePress, not GitHub Pages directly for API docs
    entryDocument: 'index.md', // Name of the main API entry file
    hideBreadcrumbs: true,
    hideInPageTOC: true,
  });

  const project = app.convert();

  if (project) {
    console.log(`Generating API documentation in ${outputDir}...`);
    await app.generateDocs(project, outputDir);
    console.log('API documentation generated successfully.');

    // Optional: Create a simple index.md if the plugin doesn't
    try {
      await mkdir(outputDir, { recursive: true });
      await writeFile(path.join(outputDir, 'index.md'), '# API Reference\\n\\nBrowse the API documentation using the sidebar.', 'utf-8');
    } catch (e) { /* Ignore if exists */ }

  } else {
    console.error('Failed to convert project.');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Error generating API docs:', error);
  process.exit(1);
});