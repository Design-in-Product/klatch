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
    // Serial execution for client tests. React+jsdom files contended the 5000ms
    // default testTimeout under default parallelism — Argus's 5/11 sweep saw ~14
    // tests / 5 files flaking at ~8% (`docs/mail/argus-to-daedalus-rate-limit-headroom-and-test-flake-2026-05-11.md`).
    // singleThread fixed the *parallelism* flake but NOT load-sensitivity: under
    // machine load, heavy userEvent files (ImportDialog, SidebarRedesign,
    // ExportReviewPanel, …) still independently exceed 5000ms and time out
    // (confirmed 2026-06-22 under reproduced load — multiple files, not a few
    // tests). So testTimeout: 15000 is the right-sized COMPLEMENT to singleThread,
    // not the "raise-instead-of-investigate" cop-out the old comment warned about —
    // the investigation showed it's suite-wide. singleThread still prevents the
    // parallelism flake; the timeout absorbs serial-render slack under load.
    testTimeout: 15000,
    // vitest 4 migration: poolOptions.threads.singleThread → maxWorkers: 1.
    // Serial execution is required — React+jsdom files contend under parallelism
    // (8% flake rate at default concurrency, confirmed 5/11 + 6/22).
    // isolate:true (default) is intentionally kept: each file gets a fresh module
    // registry. The migration guide's isolate:false is only for tests that
    // intentionally share module state, which these do not.
    maxWorkers: 1,
  },
});
