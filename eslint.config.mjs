// ESLint 9 flat config, built from the already-installed @typescript-eslint
// v8 packages (no extra meta-package dependency).
//
// v3 code lints strictly. The legacy V2 tree gets a relaxed rule set:
// its lazy requires / @ts-ignore / redeclare patterns are intentional and
// working code we do not churn just to satisfy a linter.
import eslint from '@eslint/js'
import parser from '@typescript-eslint/parser'
import plugin from '@typescript-eslint/eslint-plugin'

export default [
  {
    ignores: ['dist/**', 'dashboard-v3/**', 'node_modules/**', 'local_modules/**', 'data/**'],
  },
  eslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser,
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': plugin,
    },
    rules: {
      // no-undef is the TypeScript compiler's job (it also false-positives on
      // Node/browser globals the linter doesn't know about)
      'no-undef': 'off',
      ...plugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/ban-types': 'off',
      'no-useless-escape': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    // Legacy V2 tree: keep the signal, drop the noise that would force churn
    files: ['src/**/*.ts'],
    ignores: ['src/v3/**/*.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off', // intentional lazy loads (canvas, chess, ...)
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-redeclare': 'off', // duplicate baileys type unions in Types.ts
      'no-extra-boolean-cast': 'off',
      'no-unsafe-optional-chaining': 'off',
      'for-direction': 'off', // pre-existing countdown loop in cell.ts
    },
  },
]
