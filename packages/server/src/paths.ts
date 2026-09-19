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

/**
 * The root under which the export scan looks for `exports/sessions/`.
 *
 * **Why this override exists (Round 235).** Before the Round 234 fix, the export
 * scan was handed the working directory, so a probe that relocated
 * `CLAUDE_CONFIG_DIR` to an empty temp root got a completely isolated corpus for
 * free — the session roots moved, and the export scan resolved to
 * `packages/server/exports/sessions`, which has never existed. That fix was
 * right (the server should read the repo's exports), but it removed an isolation
 * property every relocating probe had been relying on and none had ever
 * asserted (Theseus, Round 234 §3). `CLAUDE_CONFIG_DIR` moves the session roots
 * and cannot touch the export corpus; there was no second lever.
 *
 * `KLATCH_EXPORT_ROOT` is that lever. **Replace semantics, matching
 * `CLAUDE_CONFIG_DIR`:** setting it moves this root, it does not add a second
 * one — so pointing it at a temp directory with no `exports/sessions/` is how a
 * probe gets an empty export corpus, and pointing it at a temp directory that
 * has one is how a probe gets a corpus it controls. There is deliberately no
 * separate disable flag: "suppress" and "relocate" are the same operation, and a
 * relocating probe already has a temp root to hand.
 *
 * **Read per call, not captured at module load.** `getProjectRoot()` is cached
 * because its answer cannot change during a process; this one can, because a
 * probe sets the variable after importing the server. A cached read would make
 * the lever work only when the variable was set before the first import — which
 * is the kind of ordering dependency that produces a probe reporting isolation
 * it does not have.
 *
 * **A relative value resolves against the project root, never the working
 * directory.** The working directory is not an input to this module; that is the
 * whole point of it. A relative override is a misconfiguration either way, but
 * resolving it against the repo root keeps the one defect this file exists to
 * prevent from re-entering through the override.
 *
 * Unset, empty, or whitespace: the project root, byte-identical to before.
 */
export function getExportRoot(): string {
  const configured = process.env.KLATCH_EXPORT_ROOT?.trim();
  if (!configured) return PROJECT_ROOT;
  return path.isAbsolute(configured) ? configured : path.resolve(PROJECT_ROOT, configured);
}
