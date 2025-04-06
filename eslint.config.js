import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier'; // Import prettier config

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Global ignores
    ignores: ['node_modules/', 'build/', 'eslint.config.js'],
  },
  {
    // Configuration for TypeScript files
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json', // Enable this for type-aware linting if needed later
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Add any project-specific rules here
      // Example:
      // '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn', // Example: Warn about 'any' type
    },
  },
  {
    // Configuration for JavaScript files (if any, e.g., config files)
    files: ['**/*.js'],
    // Add JS specific rules if needed
  },
  eslintConfigPrettier // Add prettier config last to override other formatting rules
);
