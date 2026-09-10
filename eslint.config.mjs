import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {ignores: ['dist', 'node_modules', 'coverage', 'scripts/build-data/.cache']},
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
    },
  },
  {files: ['**/*.cjs'], languageOptions: {sourceType: 'commonjs'}},
  {
    // Examples are runnable scripts: `console` is their whole output channel,
    // and the CommonJS proof (05-commonjs.cjs) needs `require` by definition.
    files: ['examples/**'],
    languageOptions: {
      globals: {console: 'readonly', require: 'readonly', module: 'readonly'},
    },
    rules: {'@typescript-eslint/no-require-imports': 'off'},
  }
);
