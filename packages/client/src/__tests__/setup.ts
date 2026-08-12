import '@testing-library/jest-dom/vitest';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load ANTHROPIC_API_KEY (and friends) from the repo-root .env for AAXT
// rounds (R46-R50) that call the live API. This runs inside the vitest
// subprocess, not through the agent's own file-read tools, so it works
// unattended per xian's option-3 decision (2026-08-12).
//
// Walk up from cwd rather than resolving via `import.meta.url` — Vite
// rewrites that to a `/@fs/...` URL in this test context, which breaks a
// file-URL-based path resolution (Theseus, build note, 2026-08-11).
// Mirrors packages/server/src/index.ts's findEnv.
function findEnv(dir: string): string | undefined {
  const candidate = path.join(dir, '.env');
  if (fs.existsSync(candidate)) return candidate;
  const parent = path.dirname(dir);
  if (parent === dir) return undefined; // reached filesystem root
  return findEnv(parent);
}
// override: true for the same reason as the server's findEnv — Claude
// Code's own environment sets ANTHROPIC_API_KEY="" for its own auth
// resolution, and dotenv's default is to not overwrite existing vars. This
// only affects the vitest subprocess's own process.env, not the agent's.
dotenv.config({ path: findEnv(process.cwd()), override: true });

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = () => {};
