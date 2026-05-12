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
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
});
