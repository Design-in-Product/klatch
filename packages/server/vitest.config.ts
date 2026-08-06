import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.claude/**'],
    // round27b confirmed flaking at load, passing in isolation: MCP InMemoryTransport tests
    // need more headroom under full-suite load than the 5000ms default gives them.
    testTimeout: 15000,
  },
});
