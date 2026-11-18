import { defineConfig } from 'vitest/config';

/**
 * This unit's arm runs under its OWN config, deliberately.
 *
 * `packages/server/vitest.config.ts` has `include: ['src/**\/*.test.ts']`, so an
 * arm placed in this directory is outside `npm test`: it cannot move the
 * 146-file / 2287-test standing figure, and another seat's gate run cannot pick
 * it up mid-fire. (This morning I crippled a tracked module while two gate legs
 * were driving over it. Same hazard, avoided by placement this time.)
 *
 * `setupFiles` is the REAL `packages/server/src/__tests__/setup.ts`, not a copy:
 * the fixture handle under comparison has to be the one the 146 test files
 * actually run against. A re-typed fixture would be a third definition of the
 * schema inside a unit about there being two too many already.
 */
export default defineConfig({
  root: new URL('../../../', import.meta.url).pathname,
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./packages/server/src/__tests__/setup.ts'],
    include: ['docs/research/unit-477ddlcolumns-2026-11-18/arm-*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    testTimeout: 15000,
  },
});
