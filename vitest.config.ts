import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Vitest configuration options go here
    globals: true, // Optional: Use Vitest globals like describe, it, expect
    environment: 'node', // Specify the test environment
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html'], // Coverage reporters
      reportsDirectory: './coverage', // Directory for coverage reports
    },
  },
})