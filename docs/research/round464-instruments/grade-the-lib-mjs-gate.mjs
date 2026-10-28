#!/usr/bin/env node
// Grade the `scripts/lib/**/*.mjs` gate by making it FAIL, one cripple at a time.
//
// A gate that runs and cannot redden is worse than no gate: it reports `ok` forever and a later
// fire cites it as coverage. So this does not assert "typecheck:scripts exits 0" (that is the
// clean leg and proves nothing on its own). It asserts, per cripple, that the WIRED command
// — `npm run typecheck:scripts`, not a bare `tsc` — exits non-zero AND that the failure names
// the file and the error code the cripple was built to produce.
//
// Each cripple is written, measured, and restored, and the restore is verified byte-for-byte
// against the bytes read before the write. Nothing is left behind on any path, including a throw.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(new URL('../../..', import.meta.url).pathname);

/** Run the WIRED gate command, not a bare `tsc`: the wiring is half of what is being graded. */
function driveGate() {
  try {
    const out = execFileSync('npm', ['run', '--silent', 'typecheck:scripts'], {
      cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? -1, out: (e.stdout ?? '') + (e.stderr ?? '') };
  }
}

/**
 * Cripples. `anchor` must occur EXACTLY ONCE in the file — asserted, not hoped — so a cripple
 * cannot silently land somewhere other than where it is aimed, and cannot land twice.
 *
 * `wants` is the error CODE the cripple is built to produce, keyed positively rather than on
 * "exit non-zero": a cripple that reddened for some unrelated reason would otherwise pass and
 * the leg would be measuring the wrong thing.
 */
const CRIPPLES = [
  {
    name: 'implicit-any-param',
    file: 'scripts/lib/opaque-container.mjs',
    anchor: ' * @param {Buffer} buf\n */\nexport function classifyContainer(buf) {',
    with: ' */\nexport function classifyContainer(buf) {',
    wants: 'TS7006',
    why: 'removing one annotation must redden — this is the 98-row class',
  },
  {
    name: 'null-into-string-field',
    file: 'scripts/lib/recall-tap.mjs',
    anchor: "    /** @type {{frames: any[], status: string|null, reason: string|null, terminated: boolean}} */\n",
    with: '',
    wants: 'TS2322',
    why: 'the explicit `out` type is what lets `status = null` coexist with its initialiser',
  },
  // TWO cripples for one claim, because the first version of this leg keyed on `TS2339` and
  // FAILED: the tree reddened at exit 2 and my predicted code never appeared. TypeScript reports
  // a NEAR-MISS field name as TS2551 ("Did you mean 'edgeUnreachable'?") and only a name with no
  // close match as TS2339. So "a field that is not there must not resolve" has two spellings in
  // the compiler, and a single cripple keyed on either one grades half the claim while reading
  // like the whole of it. The honest reading is that the gate behaves BETTER than predicted and
  // my key was wrong — which is only visible because the leg was keyed on the code rather than
  // on "exit non-zero".
  {
    name: 'field-typo-near-miss',
    file: 'scripts/lib/recall-recogniser.mjs',
    anchor: 'rx(P.edgeUnreachable)',
    with: 'rx(P.edgeUnreachableTypo)',
    wants: 'TS2551',
    why: 'typing P off `recall.ts`: a one-word typo must not resolve to `undefined`',
  },
  {
    name: 'field-absent-no-near-miss',
    file: 'scripts/lib/recall-recogniser.mjs',
    anchor: 'rx(P.edgeUnreachable)',
    with: 'rx(P.zzzNotAFieldAtAll)',
    wants: 'TS2339',
    why: 'the same claim for a name the compiler cannot suggest a correction for',
  },
  {
    name: 'null-deref-the-gate-repaired',
    file: 'scripts/lib/recall-recogniser.mjs',
    anchor: '      .filter((m) => m !== null)\n      .map((m) => ({',
    with: '      .filter(Boolean)\n      .map((m) => ({',
    wants: 'TS18047',
    why: 'the `filter(Boolean)` this fire replaced must be rejected, not merely discouraged',
  },
];

const results = [];
let cleanCode = null;

/** `git status` over the gated tree, as a string to be compared with itself later. */
const workingState = () => execFileSync(
  'git', ['-C', REPO, 'status', '--porcelain', '--', 'scripts/lib'],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
).trim();

// The baseline is taken BEFORE any cripple and the restoration leg compares against IT, not
// against an empty string. The first version of this instrument asserted `git status` was EMPTY
// after the cripples and published a FALSE RED: it was reading this fire's own uncommitted work
// on two other lib files as cripple residue. "Nothing I left behind" and "nothing uncommitted"
// are different claims, and only the first one is this leg's business.
const BASELINE = workingState();

// The clean leg first, so a cripple that fails to redden cannot be excused by a tree that was
// already red.
{
  const r = driveGate();
  cleanCode = r.code;
  console.log(`clean                 exit=${r.code}`);
}

for (const c of CRIPPLES) {
  const abs = path.join(REPO, c.file);
  const original = fs.readFileSync(abs, 'utf8');
  const occurrences = original.split(c.anchor).length - 1;
  if (occurrences !== 1) {
    results.push({ ...c, ok: false, reason: `anchor occurs ${occurrences}×, not exactly 1` });
    console.log(`${c.name.padEnd(34)} REFUSED  anchor occurs ${occurrences}×, not 1 — not written`);
    continue;
  }
  let r;
  try {
    fs.writeFileSync(abs, original.split(c.anchor).join(c.with));
    r = driveGate();
  } finally {
    fs.writeFileSync(abs, original);
    const back = fs.readFileSync(abs, 'utf8');
    if (back !== original) {
      console.log(`FATAL: ${c.file} not restored byte-for-byte — stopping`);
      process.exit(3);
    }
  }
  const named = r.out.includes(c.file);
  const coded = r.out.includes(c.wants);
  const ok = r.code !== 0 && named && coded;
  results.push({ ...c, ok, code: r.code, named, coded });
  console.log(
    `${c.name.padEnd(34)} ${ok ? 'ok  ' : 'FAIL'} exit=${r.code} ` +
    `names-file=${named} has-${c.wants}=${coded}`
  );
}

// Restoration is asserted a second time, over the whole tree and by git rather than by this
// script's own bookkeeping: a script that both makes the mess and certifies the cleanup is the
// shape that has gone wrong on this project before.
const after = workingState();

const crippledRed = results.filter((r) => r.ok).length;
const legs = [
  ['G1-clean-is-green', cleanCode === 0, `clean exit=${cleanCode}`],
  ['G2-every-cripple-reddens', crippledRed === CRIPPLES.length,
    `${crippledRed}/${CRIPPLES.length} reddened at their own error code`],
  ['G3-tree-unchanged-by-me', after === BASELINE,
    after === BASELINE
      ? `identical to the pre-cripple baseline (${BASELINE.split('\n').filter(Boolean).length} file(s) already modified, left alone)`
      : `baseline[${BASELINE}] !== after[${after}]`],
  // A leg that cannot distinguish "every cripple reddened" from "every cripple was REFUSED
  // before it was written" would read `3/3 ok` over an empty set of writes. Count the writes.
  ['G4-no-cripple-refused', results.every((r) => r.reason === undefined),
    `${results.filter((r) => r.reason).length} refused for a bad anchor`],
];
for (const [n, pass, reason] of legs) console.log(`  ${pass ? 'ok  ' : 'FAIL'} ${n}  ${reason}`);

const red = legs.filter(([, pass]) => pass !== true).map(([n]) => n);
console.log(`VERDICT/1 ${red.length ? 'RED' : 'ok'} legs=${legs.length} red=[${red.join(',')}]`);
