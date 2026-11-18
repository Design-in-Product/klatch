import { defineConfig } from 'vitest/config';

/**
 * Deliberately outside npm test's include (`src/**\/*.test.ts` under
 * packages/server). This arm cannot move the 146-file standing figure and no
 * other seat's gate run can pick it up mid-fire.
 *
 * No setupFiles here, unlike unit-477's: this arm builds its own throwaway
 * :memory: handles per test, the same way migration.test.ts itself does.
 */
export default defineConfig({
  root: new URL('../../../', import.meta.url).pathname,
  test: {
    globals: true,
    environment: 'node',
    include: ['docs/research/unit-478migrationarm-2026-11-18/arm-*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    testTimeout: 15000,
  },
});
