/**
 * Round 241 control — the corpus cast is resolved, not pinned.
 *
 * Run:  npx tsx scripts/probe-round241-a-corpus-cast-is-resolved-not-pinned.mts
 *
 * ## What this drives
 *
 * `scripts/lib/probe-corpus-sessions.mts`, which exists because Theseus (Round 240) found that
 * `probe-import-entity-binding.mts` — *"the acceptance test for the import confirm step"* —
 * named seven session files by UUID under `~/.claude/projects`. Four were already deleted; of
 * the three survivors one had under a day left, because that corpus is swept roughly 30 days
 * after each file's last append.
 *
 * ## Why this is a probe and not a vitest test
 *
 * It was a vitest test first, in `packages/server/src/__tests__/`, following the precedent of
 * `round85-marker-floor.test.ts` importing `scripts/lib/marker-floor.mjs`. `npm run typecheck`
 * rejected it, twice over:
 *
 * ```
 * TS5097: An import path can only end with a '.mts' extension when 'allowImportingTsExtensions'
 *         is enabled.
 * TS6059: File 'scripts/lib/probe-corpus-sessions.mts' is not under rootDir 'packages/server/src'.
 * ```
 *
 * The precedent held for `.mjs` helpers because tsc does not own them. It does not extend to a
 * `.mts` helper, and the codebase already reflects that split: `probe-outcome.mts` and
 * `probe-server-ownership.mts` are driven by control *probes*, not by the suite. Followed the
 * existing line rather than widening `packages/server/tsconfig.json` for a scripts-only file.
 *
 * **The cost is real and is not hidden:** these checks do not run in `npm test`, so they do not
 * catch a regression the way a suite test would. A root-level vitest project covering
 * `scripts/` would fix that for every `.mts` helper at once. Priced, not taken this fire —
 * it is new test infrastructure, not a repair to the thing Round 240 found.
 *
 * ## Why the negative cases outnumber the positive ones
 *
 * The module's whole contribution over the code it replaces is the *shape of its refusal*. The
 * old guard printed "this probe needs a machine with the live Claude Code corpus it was written
 * against" while standing on a machine holding 538 sessions; the real cause was four expired
 * files. A check that only asserted "it threw" would grade that defect green, so the refusal
 * arms assert the *reason* and assert that the insufficient-corpus message does not send the
 * reader off to find another machine.
 *
 * Every arm drives a **synthetic corpus built by this file**. Depending on the live corpus here
 * would reproduce, in the control, the exact defect the module removes from the probes.
 *
 * ## Two red capability runs, recorded (2026-09-20 WORK fire)
 *
 * 1. Collapse the two refusal reasons into one → **arm F3 fails**, as designed.
 * 2. Disable label widening (`width <= cap` → `width <= 1`) → **arm E2 fails**.
 *
 * (2) is the one worth recording. E2's first version asserted only *"labels are distinct and
 * both mention argus"* — and the broken build **passed it**, because the index fallback emits
 * `Argus1`/`Argus2`, which is distinct and does mention argus. A check a deliberately broken
 * implementation satisfies is not a check. E2 now asserts the distinguishing segment and
 * forbids the numeric fallback. Same shape as Theseus's Round 240 §4: the instrument's own
 * controls found the defect that inspection did not.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  resolveSessionCast,
  describeResolution,
  CorpusUnavailable,
  SESSION_RETENTION_DAYS,
} from './lib/probe-corpus-sessions.mts';
import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';

const KIB = 1024;
const results: ProbeVerdict[] = [];

function check(arm: string, name: string, pass: boolean, detail: string) {
  results.push({ arm, check: name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'} [${arm}] ${name} — ${detail}`);
}

/** Build a synthetic `projects/` tree. `spec` maps directory name -> file sizes in KiB. */
function buildCorpus(root: string, spec: Record<string, number[]>): string {
  const projects = path.join(root, 'projects');
  fs.mkdirSync(projects, { recursive: true });
  for (const [dir, sizes] of Object.entries(spec)) {
    const abs = path.join(projects, dir);
    fs.mkdirSync(abs, { recursive: true });
    sizes.forEach((kib, i) => {
      // File names are deliberately NOT in size order, so an arm asserting that the resolver
      // sorts by size cannot be satisfied by a resolver that just takes readdir order.
      const name = `${String.fromCharCode(122 - i)}${i}-session.jsonl`;
      fs.writeFileSync(path.join(abs, name), 'x'.repeat(kib * KIB));
    });
  }
  return projects;
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'klatch-round241-'));

try {
  // ── Arm A: selection ────────────────────────────────────────────────
  {
    const projects = buildCorpus(path.join(tmp, 'select'), {
      '-Users-x-alpha': [200, 500, 300],
      '-Users-x-beta': [160, 590],
      '-Users-x-gamma': [400, 410],
    });
    const r = resolveSessionCast({ count: 3, sessionsPerDir: 2, projectsDir: projects });

    check('A', 'resolves N distinct directories', r.sources.length === 3 && new Set(r.sources.map((s) => s.dir)).size === 3,
      `sources=${r.sources.length} distinct=${new Set(r.sources.map((s) => s.dir)).size}`);
    check('A', 'takes sessionsPerDir from each', r.sources.every((s) => s.sessions.length === 2),
      r.sources.map((s) => `${s.label}:${s.sessions.length}`).join(' '));

    const alpha = r.sources.find((s) => s.dir === '-Users-x-alpha')!;
    const picked = alpha.sessions.map((s) => Math.round(s.sizeBytes / KIB));
    check('A', 'picks the largest in each directory, not readdir order', JSON.stringify(picked) === JSON.stringify([500, 300]),
      `alpha picked ${picked.join(',')} from 200,500,300`);
  }

  // ── Arm B: ranking ──────────────────────────────────────────────────
  {
    // `-private-tmp-captest` is alphabetically first and holds exactly the minimum — the shape
    // a probe's leftover scratch directory has. It must not displace a real working corpus.
    const projects = buildCorpus(path.join(tmp, 'rank'), {
      '-private-tmp-captest': [200],
      '-Users-x-zeta': [200, 210, 220, 230],
    });
    const r = resolveSessionCast({ count: 1, projectsDir: projects });
    check('B', 'ranks by in-band count, so a scratch directory loses to a working one',
      r.sources[0].dir === '-Users-x-zeta' && r.qualifyingDirs === 2,
      `chose ${r.sources[0].dir}, qualifying=${r.qualifyingDirs}`);
  }

  // ── Arm C: determinism ──────────────────────────────────────────────
  {
    const projects = buildCorpus(path.join(tmp, 'determinism'), {
      '-Users-x-one': [200, 300],
      '-Users-x-two': [200, 300],
      '-Users-x-three': [200, 300],
    });
    const a = resolveSessionCast({ count: 2, sessionsPerDir: 2, projectsDir: projects });
    const b = resolveSessionCast({ count: 2, sessionsPerDir: 2, projectsDir: projects });
    const shape = (r: typeof a) => JSON.stringify(r.sources.map((s) => [s.dir, s.sessions.map((x) => x.file)]));

    check('C', 'the same corpus resolves to the same cast', shape(a) === shape(b), shape(a));
    // All three tie on in-band count; the documented tiebreak is directory name ascending.
    check('C', 'the documented tiebreak is the one that runs',
      JSON.stringify(a.sources.map((s) => s.dir)) === JSON.stringify(['-Users-x-one', '-Users-x-three']),
      a.sources.map((s) => s.dir).join(' '));
  }

  // ── Arm D: size band, both directions ───────────────────────────────
  {
    const projects = buildCorpus(path.join(tmp, 'band'), {
      '-Users-x-tiny': [1, 2, 3],
      '-Users-x-huge': [900, 1000],
      '-Users-x-right': [200, 250],
    });
    const r = resolveSessionCast({ count: 1, sessionsPerDir: 2, projectsDir: projects });
    check('D', 'excludes files below AND above the band', r.qualifyingDirs === 1 && r.sources[0].dir === '-Users-x-right',
      `qualifying=${r.qualifyingDirs} chose=${r.sources[0].dir}`);
    // Out-of-band files still count toward the corpus total — that number is what lets a
    // refusal say "the corpus is present" instead of "wrong machine".
    check('D', 'out-of-band files still count toward the corpus total',
      r.totalSessions === 7 && r.totalDirs === 3, `totalSessions=${r.totalSessions} totalDirs=${r.totalDirs}`);
  }

  // ── Arm E: labels ───────────────────────────────────────────────────
  {
    const projects = buildCorpus(path.join(tmp, 'labels'), {
      '-Users-xian-Development-klatch-worktrees-argus': [200, 210],
      '-Users-xian-Development-cova': [200, 210],
    });
    const r = resolveSessionCast({ count: 2, projectsDir: projects });
    const got = r.sources.map((s) => s.label).sort();
    check('E1', 'derives a usable label from the trailing segment',
      JSON.stringify(got) === JSON.stringify(['Argus', 'Cova']), got.join(' '));
  }
  {
    // The caller that matters uses labels as entity names. Two directories ending in the same
    // segment would silently turn "N distinct entities" into N-1 and grade it a regression in
    // shipped code — a fabricated finding, produced by the instrument.
    const projects = buildCorpus(path.join(tmp, 'collide'), {
      '-Users-x-klatch-worktrees-argus': [200, 210],
      '-Users-x-other-worktrees-argus': [200, 210],
    });
    const labels = resolveSessionCast({ count: 2, projectsDir: projects }).sources.map((s) => s.label).sort();
    check('E2', 'widens colliding labels to the distinguishing segment (not a numeric fallback)',
      JSON.stringify(labels) === JSON.stringify(['KlatchWorktreesArgus', 'OtherWorktreesArgus'])
        && labels.every((l) => !/\d$/.test(l)),
      labels.join(' '));
  }

  // ── Arm F: refusal names the remedy that is actually available ──────
  {
    let reason = 'DID NOT THROW';
    let remedy = '';
    try {
      resolveSessionCast({ count: 1, projectsDir: path.join(tmp, 'nope', 'projects') });
    } catch (e) {
      if (e instanceof CorpusUnavailable) { reason = e.reason; remedy = e.remedy; }
    }
    check('F1', 'absent projects directory reports no-corpus',
      reason === 'no-corpus' && /a machine with/i.test(remedy), `reason=${reason}`);
  }
  {
    const projects = buildCorpus(path.join(tmp, 'empty'), { '-Users-x-empty': [] });
    let reason = 'DID NOT THROW';
    try { resolveSessionCast({ count: 1, projectsDir: projects }); }
    catch (e) { if (e instanceof CorpusUnavailable) reason = e.reason; }
    check('F2', 'present-but-empty directory reports no-corpus', reason === 'no-corpus', `reason=${reason}`);
  }
  {
    // THE case. A corpus is present and substantial; it simply does not meet the stated
    // properties. This is the shape that was misattributed for sixteen days.
    const projects = buildCorpus(path.join(tmp, 'insufficient'), {
      '-Users-x-a': [200, 210],
      '-Users-x-b': [200, 210],
      '-Users-x-small': [5, 5, 5, 5, 5, 5],
    });
    let err: CorpusUnavailable | null = null;
    try { resolveSessionCast({ count: 5, sessionsPerDir: 2, projectsDir: projects }); }
    catch (e) { if (e instanceof CorpusUnavailable) err = e; }

    check('F3', 'a present-but-insufficient corpus is NOT reported as a missing one',
      err?.reason === 'insufficient-corpus', `reason=${err?.reason ?? 'DID NOT THROW'}`);
    check('F3', 'the message states the corpus is present, with its size',
      !!err && /HAS a corpus/.test(err.observed) && err.observed.includes('10 sessions')
        && /only 2 .* and 5 are needed/.test(err.observed),
      err?.observed ?? '-');
    check('F3', 'the remedy does not send the reader to another machine',
      !!err && /do NOT read this as "wrong machine"/i.test(err.remedy), err?.remedy ?? '-');
  }
  {
    let ranges = 0;
    for (const opts of [{ count: 0 }, { count: 1, sessionsPerDir: 0 }]) {
      try { resolveSessionCast({ ...opts, projectsDir: '/nonexistent' } as any); }
      catch (e) { if (e instanceof RangeError) ranges++; }
    }
    check('F4', 'nonsensical requests are rejected before touching the filesystem', ranges === 2, `RangeErrors=${ranges}`);
  }

  // ── Arm G: the resolution is reported, not assumed ───────────────────
  {
    const projects = buildCorpus(path.join(tmp, 'describe'), { '-Users-x-delta': [200, 300] });
    const r = resolveSessionCast({ count: 1, sessionsPerDir: 2, projectsDir: projects });
    const text = describeResolution(r);

    check('G', 'names every chosen file and its directory',
      r.sources[0].sessions.every((s) => text.includes(s.file)) && text.includes('-Users-x-delta')
        && text.includes('by property, not by name'),
      `${text.split('\n').length} lines`);
    check('G', 'states remaining life as a lower bound',
      new RegExp(`>= ${SESSION_RETENTION_DAYS}\\.0 d of life left`).test(text), 'freshly written -> full horizon');
    // A wart these controls found: a file written microseconds ago carried an mtime
    // fractionally ahead of Date.now(), and the report read `last append -0.0 d ago`. Clock
    // granularity must not leak into the one output a reader is supposed to trust.
    check('G', 'clock granularity does not leak a negative age',
      !text.includes('-0.0 d ago') && r.sources[0].sessions.every((s) => s.mtimeAgeDays >= 0),
      r.sources[0].sessions.map((s) => s.mtimeAgeDays.toFixed(3)).join(' '));
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

summariseAndExit({ probeName: 'round241-a-corpus-cast-is-resolved-not-pinned', results });
