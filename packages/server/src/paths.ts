import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Walk up from `dir` to find the monorepo root (the package.json that declares
 * `workspaces`). Resolution starts from a module's own location, never from the
 * working directory: the server is launched as `npm run dev -w packages/server`
 * (root package.json), so the working directory is `packages/server` while every
 * repo-rooted asset — `klatch.db`, `exports/sessions/` — lives one level up.
 *
 * Round 233 found the consequence at the wire: a session file committed to
 * `exports/sessions/` was invisible in Browse because the scan was handed the
 * working directory. Same binary, same corpus, same port; only the launch
 * directory differed.
 */
export function findProjectRoot(dir: string): string {
  const pkg = path.join(dir, 'package.json');
  if (fs.existsSync(pkg)) {
    try {
      const json = JSON.parse(fs.readFileSync(pkg, 'utf8'));
      if (json.workspaces) return dir;
    } catch { /* keep walking */ }
  }
  const parent = path.dirname(dir);
  if (parent === dir) return process.cwd(); // fallback
  return findProjectRoot(parent);
}

/**
 * The monorepo root, resolved from this module's own location.
 *
 * Computed once: the answer cannot change during a process, and recomputing it
 * per request would only add stat calls. Callers that need to resolve from some
 * other starting point call `findProjectRoot` directly.
 */
export function getProjectRoot(): string {
  return PROJECT_ROOT;
}

const PROJECT_ROOT = findProjectRoot(__dirname);
