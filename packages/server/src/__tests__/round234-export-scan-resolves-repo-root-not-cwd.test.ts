import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { findProjectRoot, getProjectRoot } from '../paths.js';

/**
 * Round 233 (Theseus) found that a session file committed to `exports/sessions/`
 * was invisible in Browse: `routes/import.ts` handed `scanExportedSessions` the
 * working directory, and the server is launched as `npm run dev -w
 * packages/server`, so the scan looked in `packages/server/exports/sessions` —
 * a path that has never existed. Same binary, same corpus, same port; only the
 * launch directory differed, 0 of 1 exported sessions vs. 1 of 1.
 *
 * It survived from v0.8.7 because the two existing tests of that function are
 * both structurally blind to it: `session-scanner.test.ts` mocks the function
 * out and never inspects the argument, and `round147-fingerprint-cache.test.ts`
 * passes a temp directory. Both are good tests. Neither reads the working
 * directory, so neither could see a working-directory defect.
 *
 * These tests close that gap from the side the defect actually lived on: what
 * the route passes, not what the scanner does with it.
 */

// Mocked so the assertion is about the argument the route computes, not about
// whatever happens to be on disk under the real repo root.
const scanExportedSessions = vi.fn().mockResolvedValue(null);
vi.mock('../import/session-scanner.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../import/session-scanner.js')>();
  return { ...actual, scanExportedSessions: (...args: unknown[]) => scanExportedSessions(...args) };
});

vi.mock('../claude/client.js', () => ({ streamClaude: vi.fn() }));

/**
 * The repo root found independently of `paths.ts`, so the assertions below are
 * not the implementation agreeing with itself. Walks up from this test file for
 * the package.json that declares workspaces — the same definition, reached by a
 * separate traversal.
 */
function repoRootByIndependentWalk(): string {
  let dir = path.dirname(new URL(import.meta.url).pathname);
  for (;;) {
    const pkg = path.join(dir, 'package.json');
    if (fs.existsSync(pkg)) {
      const json = JSON.parse(fs.readFileSync(pkg, 'utf8'));
      if (json.workspaces) return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error('no workspace root above the test file');
    dir = parent;
  }
}

describe('findProjectRoot resolves the monorepo root from any starting point inside it', () => {
  const root = repoRootByIndependentWalk();

  // Includes `packages/server` explicitly: that is the working directory the
  // shipped launch layout actually produces, so it is the case the defect was.
  const startingPoints = [
    ['the repo root itself', root],
    ['packages/server (the shipped launch directory)', path.join(root, 'packages', 'server')],
    ['packages/server/src/routes (a module location)', path.join(root, 'packages', 'server', 'src', 'routes')],
    ['packages/client', path.join(root, 'packages', 'client')],
  ] as const;

  for (const [label, start] of startingPoints) {
    it(`agrees from ${label}`, () => {
      expect(findProjectRoot(start)).toBe(root);
    });
  }

  it('getProjectRoot() is the repo root, not the server package', () => {
    expect(getProjectRoot()).toBe(root);
    expect(getProjectRoot()).not.toBe(path.join(root, 'packages', 'server'));
  });

  it('the repo root is where exports/sessions would be looked for', () => {
    // Stated positively so it holds whether or not the directory is populated:
    // the claim is about which path the scan resolves, not about its contents.
    expect(path.join(getProjectRoot(), 'exports', 'sessions'))
      .toBe(path.join(root, 'exports', 'sessions'));
  });
});

describe('GET /api/import/claude-code/sessions passes the repo root to the export scan', () => {
  let tmpDir: string;
  let origHomedir: typeof os.homedir;

  beforeEach(() => {
    scanExportedSessions.mockClear();
    // An empty ~/.claude/projects, so the only scan under test is the export one.
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'klatch-round234-'));
    fs.mkdirSync(path.join(tmpDir, '.claude', 'projects'), { recursive: true });
    origHomedir = os.homedir;
    (os as any).homedir = () => tmpDir;
  });

  afterEach(() => {
    (os as any).homedir = origHomedir;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('hands it the monorepo root', async () => {
    const res = await createTestApp().request('/api/import/claude-code/sessions');
    expect(res.status).toBe(200);

    expect(scanExportedSessions).toHaveBeenCalledTimes(1);
    expect(scanExportedSessions).toHaveBeenCalledWith(repoRootByIndependentWalk());
  });

  it('does not resolve the scan against the working directory', async () => {
    // Driven rather than asserted about the ambient cwd: vitest for this
    // workspace runs with cwd `packages/server`, but a run started elsewhere
    // would make a bare `not.toBe(process.cwd())` vacuously true. Changing the
    // working directory and re-requesting makes the independence observable
    // either way.
    const root = repoRootByIndependentWalk();
    const origCwd = process.cwd();
    try {
      process.chdir(os.tmpdir());
      const res = await createTestApp().request('/api/import/claude-code/sessions');
      expect(res.status).toBe(200);

      const arg = scanExportedSessions.mock.calls.at(-1)?.[0];
      expect(arg).toBe(root);
      // The discriminator: cwd really was somewhere else for that call, so the
      // assertion above is not agreement by coincidence.
      expect(path.resolve(process.cwd())).not.toBe(root);
    } finally {
      process.chdir(origCwd);
    }
  });
});
