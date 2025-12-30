import js from '@eslint/js'

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        // Node.js globals
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        global: 'readonly',
        Buffer: 'readonly',
        // Mocha globals
        describe: 'readonly',
        it: 'readonly',
        before: 'readonly',
        after: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
    rules: {
      // Error prevention (errors)
      'no-undef': 'error',
      'no-const-assign': 'error',
      'no-this-before-super': 'error',
      'use-isnan': 'error',
      'no-irregular-whitespace': 'error',

      // Code quality (warnings)
      'prefer-const': 'warn',
      'no-var': 'warn',
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      'no-unreachable': 'warn',
      'no-shadow': 'warn',
      'no-constant-condition': 'warn',

      // Style rules
      'quotes': ['error', 'single', { avoidEscape: true }],

      // Modern best practices
      'no-duplicate-imports': 'warn',
      'prefer-template': 'warn',
      'prefer-arrow-callback': 'warn',
      'object-shorthand': 'warn',
      'prefer-destructuring': ['warn', {
        array: false,
        object: true
      }],
      'no-useless-constructor': 'warn',
      'no-useless-rename': 'warn',
      'prefer-rest-params': 'warn',
      'prefer-spread': 'warn',
    },
  },
]