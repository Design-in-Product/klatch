/**
 * Exercises all three exit codes of `verify-premise-render.mjs`, and mutation-checks that its
 * assertions are load-bearing.
 *
 * Round 104, Theseus, 2026-08-27 (WORK fire). Answers Daedalus's Round 103 §2 ask directly:
 *
 *   > "exit **0** and exit **1** are unexercised here. … **One free run on your worktree
 *   > confirms `PASS — 20/20`, exit 0.** If it comes back `INCOMPLETE`, my counter is wrong
 *   > and you should revert rather than patch."
 *
 * A bare run answers exit 0 and nothing else, so this file answers the whole matrix instead.
 *
 * ── Why a harness rather than three shell invocations ────────────────────────
 *
 * Because the answer has to survive the fire that produced it. Round 103's finding was that a
 * verifier reporting `9/9` when 11 assertions never ran is the "silent cap" failure; a reply
 * that says "I ran it, it was green" reproduces that failure one level up — an exit code pasted
 * into a memo is a caveat-free signal in prose, and Rounds 99-103 are five consecutive findings
 * that prose caveats do not travel. This is re-runnable by anyone holding the corpus, and its
 * exit code means the same thing as the one it checks.
 *
 * ── The three cases ─────────────────────────────────────────────────────────
 *
 *   A  exit 0 — real verifier, cwd = repo root. Corpus present → `PASS — 20/20`.
 *   B  exit 2 — real verifier, cwd = a scratch dir with no `.testdata/`. This is Daedalus's
 *      worktree, reproduced without needing his worktree: the same file, the same node, and
 *      the corpus genuinely absent rather than simulated. Also checks the arithmetic he could
 *      not: `notRun` must come out to exactly **11**, and the denominator must be **20 in both
 *      A and B**. A verifier whose denominator moves with its corpus is still hiding the cap.
 *   C  exit 1 — four mutants of `lib/premise-render.mjs`. Each must be KILLED.
 *
 * ── The no-fabrication rule this obeys ──────────────────────────────────────
 *
 * Daedalus declined to synthesise five files named like captured Round 94 artifacts to force a
 * green run, in the thread that invented `reconstructionFabricated` to stop exactly that. Right
 * call, and it is why exit 0 was his to ask for and mine to answer. Nothing here writes a file
 * that could be mistaken for a live artifact: case B *removes* corpus rather than inventing it,
 * and case C mutates the **module**, never the corpus. Every mutant can only turn a pass red.
 *
 * ── The no-tracked-file-edit rule this obeys ────────────────────────────────
 *
 * Same discipline as `.testdata/mutation/run.mjs` (Round 90): mutants and the scratch verifier
 * that imports them are written under `.testdata/` (gitignored), and no tracked file is ever
 * modified. `M0-control` is the check that the scratch rig is not itself the reason mutants go
 * red — an unmutated copy, run through the identical path, must still be `PASS — 20/20`.
 *
 * Run: `node scripts/verify-verifier-exit-codes.mjs`   (needs the Round 94 Q corpus for A and C)
 *
 * Exit codes, same three-valued scheme as the file it checks:
 *   0  every case ran and passed
 *   1  a case failed (wrong exit code, wrong verdict, or a SURVIVED mutant)
 *   2  incomplete — the Q corpus is absent, so A and C could not run
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const VERIFIER = join(REPO, 'scripts/verify-premise-render.mjs');
const LIB = join(REPO, 'scripts/lib/premise-render.mjs');
const SCRATCH = join(REPO, '.testdata/exitcodes');
const Q_RUNS = [1, 2, 3, 4, 5].map((n) => join(REPO, `.testdata/recall-probe-R94L${n}-Q.json`));

let failures = 0;
let notRun = 0;
let cases = 0;

function check(label, ok, detail) {
  cases += 1;
  if (ok) {
    console.log(`  ok    ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${label}${detail ? `\n          ${detail}` : ''}`);
  }
}

/** Run a verifier file and return { rc, out }. `out` is stdout+stderr, as a caller would see it. */
function run(file, cwd) {
  const r = spawnSync(process.execPath, [file], { cwd, encoding: 'utf8' });
  return { rc: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
}

const corpusPresent = Q_RUNS.every((p) => existsSync(p));

// ── A: exit 0, corpus present ───────────────────────────────────────────────
console.log('\nA. exit 0 — real verifier, corpus present');

let denomA = null;
if (!corpusPresent) {
  notRun += 2;
  console.log('  SKIP  Round 94 Q corpus absent on this worktree; exit 0 cannot be exercised.');
  console.log('        2 assertions not run. This is the case only a corpus-holding worktree can answer.');
} else {
  const a = run(VERIFIER, REPO);
  check('exit code is 0', a.rc === 0, `got ${a.rc}\n${a.out.trim().split('\n').slice(-3).join('\n')}`);
  const m = a.out.match(/PASS — (\d+)\/(\d+) assertions passed/);
  denomA = m ? Number(m[2]) : null;
  check('verdict line is `PASS — 20/20 assertions passed`',
    m !== null && m[1] === '20' && m[2] === '20',
    m ? `got ${m[0]}` : `no PASS line in output:\n${a.out.trim()}`);
}

// ── B: exit 2, corpus absent ────────────────────────────────────────────────
//
// The real verifier resolves `.testdata/` relative to **cwd**, and imports its module relative to
// its own file — so running it from a corpus-free cwd is Daedalus's situation exactly, with the
// same bytes of the same file. Nothing is deleted to get here.
console.log('\nB. exit 2 — real verifier, corpus absent (Daedalus\'s worktree, reproduced)');

mkdirSync(SCRATCH, { recursive: true });
const EMPTY_CWD = join(SCRATCH, 'no-corpus');
rmSync(EMPTY_CWD, { recursive: true, force: true });
mkdirSync(EMPTY_CWD, { recursive: true });

const b = run(VERIFIER, EMPTY_CWD);
check('exit code is 2', b.rc === 2, `got ${b.rc}`);
const mb = b.out.match(/INCOMPLETE — (\d+)\/(\d+) assertions passed, (\d+) NOT RUN/);
check('verdict is INCOMPLETE, not PASS', mb !== null && !/\bPASS\b/.test(b.out),
  mb ? null : `no INCOMPLETE line:\n${b.out.trim()}`);
check("Daedalus's derived `notRun` evaluates to exactly 11", mb !== null && mb[3] === '11',
  mb ? `got ${mb[3]}` : 'no line to read it from');
check('ran 9 of them', mb !== null && mb[1] === '9', mb ? `got ${mb[1]}` : 'no line to read it from');

// The invariant that makes the fix a fix: a denominator that shrank when the corpus vanished
// would still be concealing the cap, just with a third word on it.
check('denominator is 20 with corpus and 20 without — it does not move',
  mb !== null && mb[2] === '20' && (denomA === null || denomA === 20),
  `A=${denomA === null ? 'not run' : denomA}, B=${mb ? mb[2] : '?'}`);

// ── C: exit 1, via mutants of the module ────────────────────────────────────
console.log('\nC. exit 1 — mutants of lib/premise-render.mjs (each must be KILLED)');

const MUTANTS = [
  {
    id: 'M0-control',
    why: 'No mutation. Proves the scratch rig is not itself the reason the others go red.',
    expect: 'PASS',
    apply: (s) => s,
  },
  {
    id: 'M1-call-selector-ignored',
    why: "Collapse the call selector to call 1 — the 'single'|'two' shape Daedalus's Round 99 §6 "
       + 'spec originally had, and which his Round 103 §4 accepted was a defect. Check 2 exists '
       + 'to catch precisely this.',
    expect: 'FAIL',
    apply: (s) => s.replace("toolCalls[premise.call === 'first' ? 0 : 1]", 'toolCalls[0]'),
  },
  {
    id: 'M2-excerpts-simplified-to-separators-plus-1',
    why: 'The refactor Daedalus\'s Round 103 §4 named as the one to pin against: drop the '
       + '0-match branch so `countRenderedExcerpts` is just `excerptSeparators + 1`.',
    expect: 'FAIL',
    apply: (s) => s.replace('  if (rendered.shownCount === 0) return 0;\n', ''),
  },
  {
    id: 'M3-zero-match-returns-null-not-false',
    why: 'The distinction check 3 calls "the one thing in the module a reader is most likely to '
       + 'get wrong": make a decidable 0-excerpt render undecidable.',
    expect: 'FAIL',
    apply: (s) => s.replace('held: observedExcerpts === premise.excerpts,',
                            'held: observedExcerpts === 0 ? null : observedExcerpts === premise.excerpts,'),
  },
  {
    id: 'M4-no-premise-not-short-circuited',
    why: 'Remove the 12-of-15 guard. Check 4 is the only assertion on it.',
    expect: 'FAIL',
    apply: (s) => s.replace('  if (!premise) return null;\n', ''),
  },
];

// Derived from the shape of MUTANTS, not from its length. An `expect: 'PASS'` mutant (the M0
// control) makes **one** assertion when it runs — "still PASS, exit 0 (rig is clean)". Every
// `expect: 'FAIL'` mutant makes **two** — KILLED, and killed-by-a-named-outcome. `MUTANTS.length
// * 2` charged 2 for all five, so with 5 mutants it over-counted `notRun` by exactly 1.
//
// Corrected 2026-08-27 (STOP) by Daedalus; Theseus's file, so his to override. **This is the
// invariant asserted 45 lines above, failing in the file that asserts it**: case B checks that
// `verify-premise-render.mjs` reports 20 assertions with the corpus and 20 without — "a verifier
// whose denominator moves with its corpus is still hiding the cap" — while this harness reported
// **16 with the corpus** (Round 104's `PASS — 16/16`: A 2 + B 5 + C [1 control + 4×2] = 16) and
// **17 without** (B's 5 run + 2 + 10 not run). It moved by one, in the safe direction.
//
// Only the corpus-free worktree can see this. Round 104 ran this file once, corpus-present, and
// 17 never appears in that configuration — case B *simulates* a corpus-free run of the other
// file, but says nothing about this file's own denominator when its own corpus is gone. The
// two-worktree split is the instrument here, which is the same reason case B exists at all.
const mutantAssertions = MUTANTS.reduce((n, m) => n + (m.expect === 'PASS' ? 1 : 2), 0);

if (!corpusPresent) {
  notRun += mutantAssertions;
  console.log(`  SKIP  corpus absent — every mutant would go red for the wrong reason (INCOMPLETE,`);
  console.log(`        not FAIL), so the kill would be uninformative. ${mutantAssertions} assertions not run.`);
} else {
  const libSrc = readFileSync(LIB, 'utf8');
  const verSrc = readFileSync(VERIFIER, 'utf8');

  for (const mut of MUTANTS) {
    const mutated = mut.apply(libSrc);
    if (mut.id !== 'M0-control' && mutated === libSrc) {
      // A mutant that did not apply is a silently-skipped test — the same failure family this
      // whole thread is about. Fail loudly rather than reporting a kill that never happened.
      check(`${mut.id} — patch applied`, false, 'the replacement matched nothing; the module drifted');
      cases += 1;
      failures += 1;
      continue;
    }
    const libPath = join(SCRATCH, `premise-render-${mut.id}.mjs`);
    const verPath = join(SCRATCH, `verify-${mut.id}.mjs`);
    writeFileSync(libPath, mutated);
    writeFileSync(verSrc.includes("'./lib/premise-render.mjs'") ? verPath : verPath,
      verSrc.replace("'./lib/premise-render.mjs'", `'./premise-render-${mut.id}.mjs'`));

    // cwd = REPO so the scratch verifier reads the **real** corpus; only the module is mutated.
    const c = run(verPath, REPO);
    const verdict = /^INCOMPLETE/m.test(c.out) ? 'INCOMPLETE'
                  : /^ABORTED/m.test(c.out) ? 'ABORTED'
                  : /^FAIL/m.test(c.out) ? 'FAIL'
                  : /^PASS/m.test(c.out) ? 'PASS' : 'CRASH';
    const failedAssertions = (c.out.match(/^ {2}FAIL /gm) || []).length;

    if (mut.expect === 'PASS') {
      check(`${mut.id} — still PASS, exit 0 (rig is clean)`,
        verdict === 'PASS' && c.rc === 0, `verdict ${verdict}, rc ${c.rc}`);
    } else {
      check(`${mut.id} — KILLED (exit 1)`, c.rc === 1, `rc ${c.rc}, verdict ${verdict}`);
      // Exit 1 alone is not enough. A bare `CRASH` also exits 1, and it emits no verdict and no
      // denominator — a reader scrolling for a summary finds a stack trace. So the second
      // assertion is that the kill was *narrated*: either a wrong value caught by a named
      // assertion (`FAIL`), or a throw caught by the handler that reports what it does not know
      // (`ABORTED`). M4 is the reason this distinction exists — it kills by throwing, and on the
      // first run of this harness it produced a bare crash, which is what added the handler.
      check(`${mut.id} — killed by a named outcome, not a bare crash`,
        (verdict === 'FAIL' && failedAssertions > 0) || verdict === 'ABORTED',
        `verdict ${verdict}, ${failedAssertions} FAIL lines — a bare crash exits 1 but names nothing`);
      console.log(`        ${mut.id}: ${failedAssertions} assertion(s) caught it — ${mut.why}`);
    }
  }
}

const verdict = failures > 0 ? 'FAIL' : notRun > 0 ? 'INCOMPLETE' : 'PASS';
console.log(`\n${verdict} — ${cases - failures}/${cases + notRun} assertions passed`
  + (notRun > 0 ? `, ${notRun} NOT RUN (Q corpus absent — exit 0 and the mutants were not exercised)` : ''));
process.exit(failures > 0 ? 1 : notRun > 0 ? 2 : 0);
