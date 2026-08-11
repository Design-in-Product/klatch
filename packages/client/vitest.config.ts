import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/.claude/**'],
    // Serial execution for client tests. React+jsdom files contended the
    // 5000ms default testTimeout under default parallelism — Argus's 5/11
    // sweep saw ~14 tests / 5 files flaking at ~8% rate (full memo:
    // `docs/mail/argus-to-daedalus-rate-limit-headroom-and-test-flake-2026-05-11.md`).
    // Picked singleThread over raising testTimeout (cop-out) or splitting
    // heavy files (more work). Wall time hit is acceptable for a
    // single-developer local tool; revisit if 1.0+ suite gets slow.
    //
    // Vitest 4 removed `test.poolOptions` (pool rework); the nested
    // `threads.singleThread` is now the top-level `fileParallelism: false`.
    // Flagged by Theseus, 8/10 as a harmless deprecation warning. It was not
    // harmless: verified in vitest@4.0.18's own source
    // (`dist/chunks/coverage.*.js`) that the only handling left is
    // `logger.deprecate(...)` — the option is read for the warning and
    // otherwise dropped. So from the Vitest 4 bump until this fix, the
    // serialization below was not in effect and the suite ran parallel,
    // i.e. back at the flake exposure the comment above says we fixed.
    pool: 'threads',
    fileParallelism: false,
  },
});
