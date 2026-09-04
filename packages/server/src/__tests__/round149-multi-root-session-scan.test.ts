/**
 * Round 149: the session scanner walks more than one Claude config root.
 *
 * Claude Code keeps one config directory per Anthropic account. xian runs
 * Klatch/DinP under one and Piper Morgan under another, so PM's eleven
 * department heads — the corpus continuity #3 exists to demonstrate — live in
 * `~/.claude-pm/projects` while everything else lives in `~/.claude/projects`.
 * `getClaudeProjectsDir()` hardcoded the latter, so a browse returned every
 * project except the ones xian was waiting to see. Not an error, not an empty
 * list: silently the wrong directory (Janus, 2026-09-04).
 *
 * These tests pin the four things that make multi-root safe rather than merely
 * possible.
 *
 * 1. `CLAUDE_CONFIG_DIR` REPLACES, `KLATCH_EXTRA_SESSION_ROOTS` ADDS. The first
 *    is Claude Code's own variable and copying its semantics is the whole point
 *    of honoring it. The second is additive because a misconfigured extra root
 *    should add nothing, never make the user's existing sessions disappear.
 *
 * 2. ROOTS ARE DEDUPED BY REAL PATH. Naming the default root again, or reaching
 *    it through a symlink, must not double every session in Browse.
 *
 * 3. PROJECTS ARE MERGED BY PATH, NOT CONCATENATED. `ImportDialog.tsx` keys its
 *    project rows AND its expand/collapse Set on `projectPath`. Two groups with
 *    one path would give React duplicate keys and make expanding one row expand
 *    the other. Measured on this machine 2026-09-04, the two real roots collide
 *    on zero encoded names — so this is defence against a configuration away,
 *    and the reason it is defended is that the failure is silent.
 *
 * 4. THE SINGLE-ROOT PAYLOAD IS UNCHANGED. `sourceRoot` is omitted entirely
 *    when only one root is scanned. Everyone running Klatch today is in that
 *    case, and "this change is invisible unless you opt in" should be a
 *    property that a test can state, not a claim in a memo.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import './setup.js';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  getSessionRoots,
  getClaudeProjectsDir,
  scanClaudeCodeSessions,
  clearSessionFingerprintCache,
} from '../import/session-scanner.js';

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic { messages = { create: vi.fn() } },
}));
vi.mock('../claude/client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../claude/client.js')>();
  return { ...actual, streamClaude: vi.fn(), streamClaudeRoundtable: vi.fn() };
});

let tmp: string;
const savedEnv = {
  config: process.env.CLAUDE_CONFIG_DIR,
  extra: process.env.KLATCH_EXTRA_SESSION_ROOTS,
};

beforeEach(() => {
  clearSessionFingerprintCache();
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'klatch-r149-'));
  delete process.env.CLAUDE_CONFIG_DIR;
  delete process.env.KLATCH_EXTRA_SESSION_ROOTS;
});

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
  if (savedEnv.config === undefined) delete process.env.CLAUDE_CONFIG_DIR;
  else process.env.CLAUDE_CONFIG_DIR = savedEnv.config;
  if (savedEnv.extra === undefined) delete process.env.KLATCH_EXTRA_SESSION_ROOTS;
  else process.env.KLATCH_EXTRA_SESSION_ROOTS = savedEnv.extra;
});

/**
 * Build `<tmp>/<name>/projects/<encodedProject>/<sessionId>.jsonl`, i.e. a
 * config dir laid out the way Claude Code lays one out. Returns the config dir.
 */
function makeConfigDir(name: string, projects: Record<string, string[]>): string {
  const configDir = path.join(tmp, name);
  for (const [encoded, sessionIds] of Object.entries(projects)) {
    const dir = path.join(configDir, 'projects', encoded);
    fs.mkdirSync(dir, { recursive: true });
    for (const sessionId of sessionIds) {
      // Must clear 100 bytes or the scanner skips it as corrupt.
      const lines = [
        JSON.stringify({ type: 'user', sessionId, message: { role: 'user', content: `hello from ${sessionId} in ${name}` } }),
        JSON.stringify({ type: 'assistant', sessionId, message: { role: 'assistant', content: [{ type: 'text', text: 'ok' }] } }),
      ];
      fs.writeFileSync(path.join(dir, `${sessionId}.jsonl`), lines.join('\n') + '\n');
    }
  }
  return configDir;
}

/** Pin an exact mtime so ordering assertions are deterministic. */
function setMtime(configDir: string, encoded: string, sessionId: string, iso: string): void {
  const p = path.join(configDir, 'projects', encoded, `${sessionId}.jsonl`);
  const t = new Date(iso);
  fs.utimesSync(p, t, t);
}

describe('Round 149 — root resolution', () => {
  it('defaults to ~/.claude/projects and nothing else', () => {
    expect(getSessionRoots()).toEqual([path.join(os.homedir(), '.claude', 'projects')]);
  });

  it('CLAUDE_CONFIG_DIR replaces the default root rather than adding to it', () => {
    // This is Claude Code's own semantics. If it added instead, a user who had
    // relocated their config would get their old root back, which is exactly
    // what relocating was meant to stop.
    process.env.CLAUDE_CONFIG_DIR = path.join(tmp, 'relocated');

    const roots = getSessionRoots();
    expect(roots).toEqual([path.join(tmp, 'relocated', 'projects')]);
    expect(roots).not.toContain(path.join(os.homedir(), '.claude', 'projects'));
    expect(getClaudeProjectsDir()).toBe(path.join(tmp, 'relocated', 'projects'));
  });

  it('KLATCH_EXTRA_SESSION_ROOTS is additive and preserves order', () => {
    process.env.KLATCH_EXTRA_SESSION_ROOTS =
      [path.join(tmp, 'pm'), path.join(tmp, 'other')].join(path.delimiter);

    expect(getSessionRoots()).toEqual([
      path.join(os.homedir(), '.claude', 'projects'),
      path.join(tmp, 'pm', 'projects'),
      path.join(tmp, 'other', 'projects'),
    ]);
  });

  it('expands a leading ~/ — .env is read by dotenv, not by a shell', () => {
    process.env.KLATCH_EXTRA_SESSION_ROOTS = '~/.claude-pm';

    expect(getSessionRoots()[1]).toBe(path.join(os.homedir(), '.claude-pm', 'projects'));
  });

  it('accepts a path that already ends in projects without appending a second one', () => {
    process.env.KLATCH_EXTRA_SESSION_ROOTS = path.join(tmp, 'pm', 'projects');

    expect(getSessionRoots()[1]).toBe(path.join(tmp, 'pm', 'projects'));
  });

  it('ignores empty and whitespace-only entries', () => {
    process.env.KLATCH_EXTRA_SESSION_ROOTS =
      `${path.delimiter}  ${path.delimiter}${path.join(tmp, 'pm')}${path.delimiter}`;

    expect(getSessionRoots()).toHaveLength(2);
    expect(getSessionRoots()[1]).toBe(path.join(tmp, 'pm', 'projects'));
  });

  it('dedupes a root named twice', () => {
    const pm = path.join(tmp, 'pm');
    process.env.KLATCH_EXTRA_SESSION_ROOTS = [pm, pm].join(path.delimiter);

    expect(getSessionRoots()).toEqual([
      path.join(os.homedir(), '.claude', 'projects'),
      path.join(pm, 'projects'),
    ]);
  });

  it('dedupes a root reached through a symlink — same corpus, would otherwise double every session', () => {
    const real = makeConfigDir('real', { '-tmp-alpha': ['s1'] });
    const link = path.join(tmp, 'linked');
    fs.symlinkSync(real, link, 'dir');

    process.env.CLAUDE_CONFIG_DIR = real;
    process.env.KLATCH_EXTRA_SESSION_ROOTS = link;

    expect(getSessionRoots()).toEqual([path.join(real, 'projects')]);
  });
});

describe('Round 149 — scanning more than one root', () => {
  it('returns sessions from both roots', async () => {
    const main = makeConfigDir('main', { '-tmp-klatch': ['k1', 'k2'] });
    const pm = makeConfigDir('pm', { '-tmp-piper': ['p1'] });
    process.env.CLAUDE_CONFIG_DIR = main;
    process.env.KLATCH_EXTRA_SESSION_ROOTS = pm;

    const projects = await scanClaudeCodeSessions();

    expect(projects.map((p) => p.projectName)).toEqual(['klatch', 'piper']);
    expect(projects.find((p) => p.projectName === 'klatch')!.sessions).toHaveLength(2);
    expect(projects.find((p) => p.projectName === 'piper')!.sessions).toHaveLength(1);
  });

  it('a root that does not exist is skipped and does not suppress the roots that do', async () => {
    const main = makeConfigDir('main', { '-tmp-klatch': ['k1'] });
    process.env.CLAUDE_CONFIG_DIR = main;
    process.env.KLATCH_EXTRA_SESSION_ROOTS = path.join(tmp, 'typo-nothing-here');

    const projects = await scanClaudeCodeSessions();

    expect(projects).toHaveLength(1);
    expect(projects[0].sessions).toHaveLength(1);
  });

  it('merges one project seen under two roots into a single group, ordered as one list', async () => {
    // The React-key defect: ImportDialog keys rows and expand-state on
    // projectPath, so two groups with one path is a real UI bug, not a cosmetic
    // one. Zero collisions exist on xian's machine today; one config change away.
    const main = makeConfigDir('main', { '-tmp-shared': ['older'] });
    const pm = makeConfigDir('pm', { '-tmp-shared': ['newest', 'middle'] });
    setMtime(main, '-tmp-shared', 'older', '2026-01-01T00:00:00Z');
    setMtime(pm, '-tmp-shared', 'middle', '2026-02-01T00:00:00Z');
    setMtime(pm, '-tmp-shared', 'newest', '2026-03-01T00:00:00Z');
    process.env.CLAUDE_CONFIG_DIR = main;
    process.env.KLATCH_EXTRA_SESSION_ROOTS = pm;

    const projects = await scanClaudeCodeSessions();

    expect(projects).toHaveLength(1);
    expect(projects[0].projectPath).toBe('/tmp/shared');
    // Newest-first ACROSS roots — not root-by-root, which is what appending
    // pre-sorted lists would have produced.
    expect(projects[0].sessions.map((s) => s.sessionId)).toEqual(['newest', 'middle', 'older']);
  });

  it('within a merged group the same sessionId appears once, first root winning', async () => {
    // sessionId is the import identity (source_metadata.originalSessionId), so
    // two entries carrying it are the same conversation and offering both is a
    // choice with no difference.
    const main = makeConfigDir('main', { '-tmp-shared': ['dupe'] });
    const pm = makeConfigDir('pm', { '-tmp-shared': ['dupe'] });
    process.env.CLAUDE_CONFIG_DIR = main;
    process.env.KLATCH_EXTRA_SESSION_ROOTS = pm;

    const projects = await scanClaudeCodeSessions();

    expect(projects[0].sessions).toHaveLength(1);
    expect(projects[0].sessions[0].path).toBe(
      path.join(main, 'projects', '-tmp-shared', 'dupe.jsonl'),
    );
  });

  it('the same sessionId under DIFFERENT projects is kept — dedup is per merged group', async () => {
    // Deliberately narrow. A cross-project global dedup would silently drop a
    // session from Browse based on a UUID collision we have never observed, and
    // the merge is the only place the ambiguity is actually created.
    const main = makeConfigDir('main', { '-tmp-alpha': ['same-id'] });
    const pm = makeConfigDir('pm', { '-tmp-beta': ['same-id'] });
    process.env.CLAUDE_CONFIG_DIR = main;
    process.env.KLATCH_EXTRA_SESSION_ROOTS = pm;

    const projects = await scanClaudeCodeSessions();

    expect(projects).toHaveLength(2);
    expect(projects.flatMap((p) => p.sessions)).toHaveLength(2);
  });
});

describe('Round 149 — sourceRoot', () => {
  it('is stamped per session when more than one root is scanned', async () => {
    const main = makeConfigDir('main', { '-tmp-klatch': ['k1'] });
    const pm = makeConfigDir('pm', { '-tmp-piper': ['p1'] });
    process.env.CLAUDE_CONFIG_DIR = main;
    process.env.KLATCH_EXTRA_SESSION_ROOTS = pm;

    const projects = await scanClaudeCodeSessions();

    expect(projects.find((p) => p.projectName === 'klatch')!.sessions[0].sourceRoot)
      .toBe(path.join(main, 'projects'));
    expect(projects.find((p) => p.projectName === 'piper')!.sessions[0].sourceRoot)
      .toBe(path.join(pm, 'projects'));
  });

  it('is absent entirely in the single-root case, so today\'s payload is unchanged', async () => {
    const main = makeConfigDir('main', { '-tmp-klatch': ['k1'] });
    process.env.CLAUDE_CONFIG_DIR = main;

    const projects = await scanClaudeCodeSessions();

    const session = projects[0].sessions[0];
    expect(session.sourceRoot).toBeUndefined();
    // Not merely undefined — the key is not present, so JSON.stringify emits
    // byte-identical output to the pre-multi-root scanner.
    expect(Object.keys(session)).not.toContain('sourceRoot');
  });
});
