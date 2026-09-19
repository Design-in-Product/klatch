/**
 * Round 235: the export corpus gets an isolation lever.
 *
 * Round 234 fixed the export scan to resolve the repo root from the module's own
 * location instead of the working directory. Correct fix — a session file
 * committed to `exports/sessions/` should be visible in Browse regardless of
 * where the server was launched from.
 *
 * It also removed something nobody had written down. A probe that relocates
 * `CLAUDE_CONFIG_DIR` to an empty temp root used to get a *completely* isolated
 * corpus: the session roots moved, and the export scan resolved to
 * `packages/server/exports/sessions`, a path that has never existed. So the
 * export corpus was empty by accident. Theseus (Round 234 §3) drove this and
 * verified there was no lever at all — `paths.ts` read no `process.env`,
 * `scanExportedSessions` had one call site handed `getProjectRoot()`, and the
 * three variables the scanner honors all feed the session-root side. His words:
 *
 *   > `CLAUDE_CONFIG_DIR` relocation was a complete corpus-isolation mechanism
 *   > only for as long as the export scan was broken.
 *
 * `KLATCH_EXPORT_ROOT` is the lever. These tests pin the four properties that
 * make it usable as one — and the last two are the ones a probe would otherwise
 * discover the hard way, by reporting isolation it did not have.
 *
 * 1. REPLACE, NOT ADD. Setting it moves the root; the repo's own
 *    `exports/sessions/` is then not scanned. Additive would be useless here —
 *    an isolating probe needs the default corpus *gone*, not supplemented. This
 *    is `CLAUDE_CONFIG_DIR`'s semantic, deliberately, and the opposite of
 *    `KLATCH_EXTRA_SESSION_ROOTS`.
 *
 * 2. SUPPRESSION IS RELOCATION. There is no separate disable flag: point it at a
 *    directory with no `exports/sessions/` and the scan returns null. One knob
 *    with one meaning, and a relocating probe already has a temp root to hand.
 *
 * 3. READ PER CALL. A probe sets the variable *after* importing the server. A
 *    value captured at module load would make the lever silently inert
 *    depending on import order — the exact failure mode this round exists to
 *    close.
 *
 * 4. A RELATIVE VALUE MUST NOT REACH FOR THE WORKING DIRECTORY. `path.resolve`
 *    on a relative override would reintroduce Round 233's defect through the
 *    override. It resolves against the project root instead, which is asserted
 *    here from a *different* working directory so the assertion can tell the two
 *    apart.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { getExportRoot, getProjectRoot } from '../paths.js';
import { scanExportedSessions } from '../import/session-scanner.js';

vi.mock('../claude/client.js', () => ({ streamClaude: vi.fn() }));

const SESSION_ID = 'aaaaaaaa-bbbb-cccc-dddd-000000000235';

function turn(sessionId: string, text: string): string {
  return [
    JSON.stringify({ type: 'user', sessionId, message: { role: 'user', content: text } }),
    JSON.stringify({ type: 'assistant', sessionId, message: { role: 'assistant', content: [{ type: 'text', text: 'ok' }] } }),
  ].join('\n');
}

/** A temp root laid out like the repo: `<root>/exports/sessions/<id>.jsonl`. */
function writeExportCorpus(root: string, sessionId = SESSION_ID): string {
  const dir = path.join(root, 'exports', 'sessions');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${sessionId}.jsonl`);
  // Over the scanner's 100-byte floor, or it is skipped and the test asserts nothing.
  fs.writeFileSync(file, turn(sessionId, 'a question long enough to clear the 100-byte floor in the scanner') + '\n');
  return file;
}

let tmp: string;
let cwdBefore: string;
const envBefore = {
  exportRoot: process.env.KLATCH_EXPORT_ROOT,
  configDir: process.env.CLAUDE_CONFIG_DIR,
  extraRoots: process.env.KLATCH_EXTRA_SESSION_ROOTS,
};

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'klatch-round235-'));
  cwdBefore = process.cwd();
});

afterEach(() => {
  process.chdir(cwdBefore);
  // Restore rather than delete: a `delete` would also clear a value the ambient
  // environment set, and these variables are real levers someone may be using.
  if (envBefore.exportRoot === undefined) delete process.env.KLATCH_EXPORT_ROOT;
  else process.env.KLATCH_EXPORT_ROOT = envBefore.exportRoot;
  if (envBefore.configDir === undefined) delete process.env.CLAUDE_CONFIG_DIR;
  else process.env.CLAUDE_CONFIG_DIR = envBefore.configDir;
  if (envBefore.extraRoots === undefined) delete process.env.KLATCH_EXTRA_SESSION_ROOTS;
  else process.env.KLATCH_EXTRA_SESSION_ROOTS = envBefore.extraRoots;
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('getExportRoot: the default is unchanged', () => {
  it('is the project root when KLATCH_EXPORT_ROOT is unset', () => {
    delete process.env.KLATCH_EXPORT_ROOT;
    expect(getExportRoot()).toBe(getProjectRoot());
  });

  it('is the project root when the variable is empty or whitespace', () => {
    // Same trim discipline as CLAUDE_CONFIG_DIR. `KLATCH_EXPORT_ROOT=` in a
    // shell script is far likelier to mean "I did not set this" than "scan the
    // filesystem root", and joining `exports/sessions` onto '' would look in
    // the working directory — the defect, again, via the override.
    for (const value of ['', '   ', '\t\n']) {
      process.env.KLATCH_EXPORT_ROOT = value;
      expect(getExportRoot()).toBe(getProjectRoot());
    }
  });
});

describe('getExportRoot: the override', () => {
  it('returns an absolute override unchanged', () => {
    process.env.KLATCH_EXPORT_ROOT = tmp;
    expect(getExportRoot()).toBe(tmp);
    expect(getExportRoot()).not.toBe(getProjectRoot());
  });

  it('is read on every call, not captured at module load', () => {
    // The property a probe depends on: this module was imported at the top of
    // this file, long before the variable was set. If the read were cached, the
    // lever would work only for a probe that set the variable before importing
    // the server, and would silently do nothing for every other one.
    delete process.env.KLATCH_EXPORT_ROOT;
    expect(getExportRoot()).toBe(getProjectRoot());

    process.env.KLATCH_EXPORT_ROOT = tmp;
    expect(getExportRoot()).toBe(tmp);

    const second = fs.mkdtempSync(path.join(os.tmpdir(), 'klatch-round235-b-'));
    try {
      process.env.KLATCH_EXPORT_ROOT = second;
      expect(getExportRoot()).toBe(second);
    } finally {
      fs.rmSync(second, { recursive: true, force: true });
    }

    delete process.env.KLATCH_EXPORT_ROOT;
    expect(getExportRoot()).toBe(getProjectRoot());
  });

  it('resolves a relative override against the project root, NOT the working directory', () => {
    // Asserted from a working directory that is not the project root, so the
    // two candidate answers are different strings and the assertion can fail.
    process.chdir(tmp);
    // macOS /var is a symlink to /private/var, so compare real paths.
    expect(fs.realpathSync(process.cwd())).not.toBe(fs.realpathSync(getProjectRoot()));

    process.env.KLATCH_EXPORT_ROOT = 'some/relative/root';

    expect(getExportRoot()).toBe(path.join(getProjectRoot(), 'some/relative/root'));
    expect(getExportRoot()).not.toBe(path.join(fs.realpathSync(process.cwd()), 'some/relative/root'));
  });
});

describe('the scanner honours the override: replace, not add', () => {
  it('returns only the overridden corpus, and the repo root is not also scanned', async () => {
    writeExportCorpus(tmp);
    process.env.KLATCH_EXPORT_ROOT = tmp;

    const result = await scanExportedSessions(getExportRoot());

    // Non-vacuous: this projectPath can only hold if the override was honoured.
    expect(result).not.toBeNull();
    expect(result!.projectPath).toBe(path.join(tmp, 'exports', 'sessions'));
    expect(result!.sessions).toHaveLength(1);
    expect(result!.sessions[0].sessionId).toBe(SESSION_ID);

    // And nothing from the repo's own export directory rode along. Guarded
    // against vacuity: if the repo has no exports to leak, say so rather than
    // asserting against an empty set.
    const realExports = path.join(getProjectRoot(), 'exports', 'sessions');
    const realFiles = fs.existsSync(realExports)
      ? fs.readdirSync(realExports).filter((f) => f.endsWith('.jsonl'))
      : [];
    expect(realFiles.length).toBeGreaterThan(0); // the repo ships at least one
    for (const f of realFiles) {
      expect(result!.sessions.map((s) => s.sessionId)).not.toContain(f.replace('.jsonl', ''));
    }
  });

  it('returns null when the overridden root has no exports/sessions — suppression is relocation', async () => {
    // No corpus written. This is how a probe gets an empty export corpus, and
    // it is why there is no separate KLATCH_DISABLE_EXPORT_SCAN.
    process.env.KLATCH_EXPORT_ROOT = tmp;
    expect(fs.existsSync(path.join(tmp, 'exports', 'sessions'))).toBe(false);

    expect(await scanExportedSessions(getExportRoot())).toBeNull();
  });
});

describe('at the wire: the browse endpoint returns the overridden corpus', () => {
  it('serves the temp export session and none of the repo’s', async () => {
    // Both levers, the way a relocating probe uses them: CLAUDE_CONFIG_DIR for
    // the session roots, KLATCH_EXPORT_ROOT for the export corpus. Before this
    // round the second half was unavailable and the repo's 3.86 MB export
    // arrived in the payload of every probe that thought it was isolated.
    const configDir = path.join(tmp, 'config');
    fs.mkdirSync(path.join(configDir, 'projects'), { recursive: true });
    process.env.CLAUDE_CONFIG_DIR = configDir;
    delete process.env.KLATCH_EXTRA_SESSION_ROOTS;

    writeExportCorpus(tmp);
    process.env.KLATCH_EXPORT_ROOT = tmp;

    const res = await createTestApp().request('/api/import/claude-code/sessions');
    expect(res.status).toBe(200);
    const body = await res.json() as {
      projects: { projectName: string; projectPath: string; sessions: { sessionId: string }[] }[];
    };

    const exported = body.projects.filter((p) => p.projectName === 'Exported sessions');
    expect(exported).toHaveLength(1);
    expect(exported[0].projectPath).toBe(path.join(tmp, 'exports', 'sessions'));
    expect(exported[0].sessions.map((s) => s.sessionId)).toEqual([SESSION_ID]);
  });
});
