import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Vitest configuration options go here
    globals: true, // Optional: Use Vitest globals like describe, it, expect
    environment: 'node', // Specify the test environment
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html', 'lcov'], // Add lcov for badges/external tools
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'], // Only include files in src
      exclude: [
        // Exclude index/types or other non-testable files if needed
        'src/index.ts',
        'src/handlers/index.ts', // Usually just exports
        '**/*.d.ts',
      ],
      thresholds: {
        // Enforce 100% coverage
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
