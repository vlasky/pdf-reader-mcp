import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier'; // Import prettier config

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended, // Basic recommended rules - Apply broadly
  {
    // Global ignores
    ignores: ['node_modules/', 'build/', 'eslint.config.js'],
  },
  // Configuration specific to TypeScript files, including type-aware rules
  ...tseslint.config({
    files: ['**/*.ts'],
    extends: [
      ...tseslint.configs.strictTypeChecked, // Apply strictest type-aware rules ONLY to TS files
      // Consider adding tseslint.configs.stylisticTypeChecked for style rules that need types
    ],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // You can override rules from recommendedTypeChecked here if needed
      // Example: Allow 'any' type if necessary (use with caution)
      // '@typescript-eslint/no-explicit-any': 'off',

      // Example: Relax rule about floating promises if needed for specific cases
      // '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true }],

      // Keep existing specific rules or add new ones
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Keep warning for unused vars
      '@typescript-eslint/no-explicit-any': 'warn', // Keep warning for explicit any
    },
  }),
  {
    // Configuration for JavaScript files (CommonJS like config files)
    files: ['**/*.js', '**/*.cjs'], // Include .cjs files
    languageOptions: {
      globals: {
        module: 'readonly', // Define CommonJS globals
        require: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
      },
    },
    rules: {
      // Add JS/CJS specific rules if needed
      '@typescript-eslint/no-var-requires': 'off', // Allow require in CJS if needed
    },
  },
  eslintConfigPrettier // Add prettier config last to override other formatting rules
);
