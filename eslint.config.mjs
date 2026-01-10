// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook';
import nextConfig from 'eslint-config-next';
import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

const eslintConfig = [
  ...nextConfig,
  ...coreWebVitals,
  ...typescript,
  {
    ignores: ['node_modules/**', '.next/**', 'dist/**', 'out/**', 'coverage/**', 'next-env.d.ts'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'prefer-arrow-callback': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
    },
  },
  {
    files: [
      '*.config.{js,cjs,mjs}',
      'jest.config.js',
      'postcss.config.mjs',
      'next.config.ts',
      'vitest.config.ts',
      'cypress.config.ts',
    ],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  ...storybook.configs['flat/recommended'],
];

export default eslintConfig;
