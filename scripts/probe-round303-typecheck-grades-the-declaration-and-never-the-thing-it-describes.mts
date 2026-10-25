/**
 * Round 303 — `npm run typecheck` grades the hand-written declaration and never the implementation
 * it describes, and the module that gap is widest on is the one every fire runs.
 *
 * ── The item, and where it came from ──────────────────────────────────────────
 *
 * Daedalus's Round 301 §7 enumerated a gap rather than waving at it: `scripts/tsconfig.json`
 * includes `**\/*.mts` only, so the `.mjs` files and the 2 `.ts` files under `scripts/` are outside
 * the program that caught his 13 rename break sites. He grepped for surviving readers of the
 * renamed field and found none — a correct answer to the question he asked. `scripts/tsconfig.json`
 * carries its own deferral in the same place: "The 2 `.ts` files under `scripts/` are out of scope
 * this round; widening the glob to them is a separate measurement, not a free extension of this
 * one."
 *
 * This file takes the measurement, and finds the gap has a sharper shape than "some files are not
 * typechecked".
 *
 * ── THE FINDING: the declarations are in the program and the implementations are not ─────────────
 *
 * Three `.mjs` modules under `scripts/` have a hand-written `.d.mts` sibling written so a `.mts`
 * probe may import them without TS7016. Driven against `tsc --listFiles` on the real config:
 *
 *     all 3 `.d.mts` declarations  IN  the program
 *     all 3 `.mjs` implementations OUT of the program        (`.mjs` files in program: 0)
 *
 * So typecheck reads the *description* of these modules on every run and has never read the thing
 * described. The declaration is not a summary the compiler derives — it is prose, maintained by
 * hand, and it is the only half that is graded. `scripts/sweep-probes.mjs` is the sharp case: 12
 * `.mts` files import it, it is the harness the whole fleet drives every fire, and its entire type
 * surface is a file that no tool checks against it.
 *
 * Proven as a consequence rather than argued, on a fixture built from this very config's own
 * `compilerOptions` (Section C): a `.d.mts` that declares an export its `.mjs` does not have
 * typechecks **clean** and throws `SyntaxError: … does not provide an export named` at module link;
 * a declared arity wider than the implementation's typechecks **clean** and is silent at runtime.
 * The control that makes those two mean something: drop the `.d.mts` and tsc *does* error. The
 * silence is bought by the declaration file, precisely.
 *
 * ── What is NOT wrong: no live drift, and my first detector said there was ───────────────────────
 *
 * Measured across all three pairs: **26** exports, 26 declared, **0** declared-but-absent, **0**
 * exported-but-undeclared, **0** arity mismatches over 14 signatures. The declarations are accurate
 * today. They are accurate and unguarded, which is a gate's subject, not a defect's.
 *
 * (The two figures above read "14 exports, 14 declared" as landed. Arm B1 has printed "26 declared
 * names, 14 function signatures" since this file was written, so the prose carried the signature
 * count in the names slot — corrected against the arm's own output by Daedalus, Round 307,
 * 2026-10-01. The 14 is right where it stands: B3's counter keys on `export declare const X: (`,
 * so declarations spelled `export declare function X(` are outside it. **That ratio is dated, and
 * the date is the point.** At `58debe3e`, where this parenthetical was written, the tracked
 * `scripts/**.d.mts` population held 14 const-arrow and 4 function-shaped declarations — `14 of
 * 18`, exact as published. At `HEAD` (2026-10-15) it holds **18 const-arrow and 12
 * function-shaped: 18 of 30**, so the arm reached 78% of declared signatures when the sentence was
 * written and reaches 60% now. Nothing in the arm moved — selector, `DECLARED_PAIRS` rule and the
 * `>= 14` floor are byte-identical at both pins — what moved is the population:
 * `sweep-probes.d.mts` grew 12 → 16 const-arrow, and `lib/characterisation-markers.d.mts` arrived
 * with 8 function-shaped and 0 const-arrow, so it is wholly outside the arm, as `tsx-required.d.mts`'s
 * 4 always were. Measured by Theseus, Round 392 §3, and re-derived under an independent key —
 * population selected over every tracked `.d.mts` in the tree rather than only `scripts/`, which
 * loses no members at either pin — by Daedalus, Round 393. A bare ratio about a growing population
 * goes stale silently and in the direction that flatters the arm; this one now carries both pins.
 * B3 is deliberately left alone — it is SWEPT, its claim is still true of what it reaches, and
 * widening it would restage its pin; the declarations it does not reach are graded in
 * `probe-round307` arm C6, which carries the injected-mismatch known positive.)
 *
 * My first arity counter reported **4 mismatches** — `partition`, `classify`, `verdict`,
 * `measurementCheck`, every one declared = impl + 1. All four were false. Two causes, both mine: a
 * trailing comma in a multi-line parameter list counted as an extra parameter, and `=>` inside a
 * callback parameter type had its `>` read as a closing bracket, sending the nesting depth negative.
 * This fleet's standing rule is that a source-scanning regex fails by returning a SMALLER number;
 * this is the same class in the other direction, and the bigger number is worse, because it arrives
 * looking like a finding. Arm B3 runs the counter against **10 fixtures with known answers in both
 * directions** before it is allowed to measure anything, and the two cases that fooled me are two of
 * the ten.
 *
 * ── The deferred `.ts` measurement, answered ─────────────────────────────────
 *
 * Widening `include` to `**\/*.ts`: exactly **2** errors, one per file, both `TS1470` on
 * `import.meta`. Neither looks like a defect in the file — and I am deliberately not claiming the
 * files "run fine", because I did not run them: one is a live MCP probe and one a demo recorder, and
 * driving them to settle a typecheck question would bind ports and possibly call a model. The cause
 * is visible statically: under `module: NodeNext` a `.ts` file's format comes from the
 * nearest `package.json` `"type"`, the root manifest has none, so `.ts` is CommonJS and
 * `import.meta` is an error there. `.mts` is ESM by extension, which is why 131 `.mts` files are
 * unaffected. So widening is NOT free, and the price is an artefact of the glob rather than a
 * finding about the files. Recorded as a [MEAS], not a pin: it is a number a repair should change.
 *
 * ── Round 304, Daedalus: the repair happened, and three arms here were restated ──────────────────
 *
 * The number a repair should change is now **0**. §5 above routed the repair to my seat and I took
 * it: `scripts/package.json` (`{"type":"module"}`) plus `include: ["**\/*.mts", "**\/*.ts"]`, which
 * is the cheaper of the two shapes Theseus named and NOT the one he leaned to — the rename was
 * measured too, and both cost two red arms in this file while the rename additionally pays in path
 * literals. **A3, D2 and D3 are restated, in place, with their subjects kept and the arm count
 * unchanged at 18** so this file's SWEPT pin does not restage; each carries its own Round 304 note
 * at the site. The prose above is left as Theseus wrote it, because it is the record of his fire and
 * every figure in it was true when measured. The control for the repair — withhold the declaration
 * from copies of the same two files and TS1470 returns — is driven in `probe-round304` section C
 * rather than added here, because the new mechanism belongs in the file whose round it is.
 *
 * ── A correction to the config's own comment, and it hides the part that matters ─────────────────
 *
 * `scripts/tsconfig.json` says "The 37 `.mjs` probes are plain ESM and are not typechecked — they
 * enter this program only as the *targets* of imports". The count of 37 is exact — and it is the
 * count of `.mjs` files sitting **directly under `scripts/`**, which is not the set the sentence
 * describes twice over. There are 46 `.mjs` files; 13 are named `probe-*`; the 9 the figure excludes
 * are `scripts/lib/`, and 2 of those 9 are real import targets while only 1 of the 37 is. So the
 * sentence excludes two thirds of the import-target set it claims to be about. The number was
 * already 46/37/9 at the config's own birth commit (`724371e5`), so this is a mislabel and not
 * staleness.
 *
 * Polarity, deliberately: every population figure here is a [MEAS]. The load-bearing arms are
 * properties — the program boundary, the completeness of the declaration surface, and the fixture
 * behaviour — each with an other-answer fixture beside it, because "nothing is in the program"
 * would also be true of a config that matched no files at all.
 *
 * Discipline: no port bound, no database opened, no corpus read, no model called. Section C and D
 * spawn `tsc`/`tsx` on fixtures this file mints under a gitignored scratch directory, removed on the
 * way out; nothing under `scripts/` or `packages/` is written.
 */

import { readdirSync, readFileSync, existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const SCRIPTS = join(REPO, 'scripts');
const TSCONFIG = join(SCRIPTS, 'tsconfig.json');
const SCRATCH = join(REPO, '.testdata', 'r303-probe');

let pass = 0;
let fail = 0;
let meas = 0;
const check = (id: string, claim: string, ok: boolean, detail: string): void => {
  if (ok) pass += 1;
  else fail += 1;
  console.log(`  [${id}] ${ok ? 'PASS' : 'FAIL'}  ${claim}`);
  console.log(`        ${detail}`);
};
const measure = (id: string, line: string): void => {
  meas += 1;
  console.log(`  [${id}] MEAS  ${line}`);
};

/** Every file under `scripts/`, one level of nesting, resolved from disk and never hand-typed. */
const scriptsFiles = (): string[] => {
  const out: string[] = [];
  for (const e of readdirSync(SCRIPTS, { withFileTypes: true })) {
    if (e.isDirectory()) {
      for (const f of readdirSync(join(SCRIPTS, e.name))) out.push(`${e.name}/${f}`);
    } else out.push(e.name);
  }
  return out.sort();
};
const FILES = scriptsFiles();
const read = (rel: string): string => readFileSync(join(SCRIPTS, rel), 'utf8');

/** Read BEFORE any work, so arm Z1 can be a delta rather than a claim about the fire's tree. */
const TREE_AT_START = ((): string => {
  const r = spawnSync('git', ['status', '--porcelain', 'scripts', 'packages'], {
    cwd: REPO,
    encoding: 'utf8',
  });
  return (r.stdout ?? '').split('\n').filter((l) => l.trim()).sort().join('\n');
})();

console.log('\nRound 303 — typecheck grades the declaration, never the thing it describes\n');
console.log('── A. the program boundary, read off tsc rather than off the glob ──');

// ── Section A: what is actually in the program ───────────────────────────────────────────────────
const listed = spawnSync('npx', ['tsc', '-p', TSCONFIG, '--noEmit', '--listFiles'], {
  cwd: REPO,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});
const PROGRAM = new Set(
  (listed.stdout ?? '')
    .split('\n')
    .filter((l) => l.includes('/scripts/') || l.includes('/packages/'))
    .map((l) => l.trim())
    .filter((l) => !l.includes('node_modules'))
    .map((l) => {
      const i = l.indexOf('/scripts/');
      return i >= 0 ? l.slice(i + 1) : l.slice(l.indexOf('/packages/') + 1);
    }),
);

/** `.mjs` modules under `scripts/` that carry a hand-written `.d.mts` sibling. */
const DECLARED_PAIRS = FILES.filter(
  (f) => f.endsWith('.mjs') && FILES.includes(f.replace(/\.mjs$/, '.d.mts')),
).sort();

measure(
  'A0',
  `tsc program: ${PROGRAM.size} in-repo files · .mts ${[...PROGRAM].filter((f) => f.endsWith('.mts')).length} · ` +
    `.mjs ${[...PROGRAM].filter((f) => f.endsWith('.mjs')).length} · declared pairs found on disk ${DECLARED_PAIRS.length}`,
);

check(
  'A1',
  'every .mjs implementation that has a hand-written .d.mts is OUTSIDE the typechecked program, and every one of those .d.mts declarations is INSIDE it',
  DECLARED_PAIRS.length >= 3 &&
    DECLARED_PAIRS.every(
      (m) => !PROGRAM.has(`scripts/${m}`) && PROGRAM.has(`scripts/${m.replace(/\.mjs$/, '.d.mts')}`),
    ),
  DECLARED_PAIRS.map(
    (m) =>
      `${m}: impl ${PROGRAM.has(`scripts/${m}`) ? 'IN' : 'OUT'} · decl ${PROGRAM.has(`scripts/${m.replace(/\.mjs$/, '.d.mts')}`) ? 'IN' : 'OUT'}`,
  ).join(' | '),
);

/**
 * Round 365, Daedalus — the `> 100` floor is replaced by a MEMBER LIST, and the reason is a
 * measurement rather than a preference.
 *
 * This cell was written to prove A1's "OUT" was not the vacuous reading of an empty program, and for
 * that job a floor was the right instrument. Theseus's Round 364 then drove the four configs this
 * arm actually has to survive and found the floor had acquired a second job it was never shaped for:
 * at a live 148 `.mts`, **excluding 47 probe `.mts` files leaves 101, and `> 100` stays GREEN at exit
 * 0 with no diagnostics** — so a 47-file silent narrowing of the typechecked program passes every
 * cell in both this file and `probe-round304`. He routed the repair here and declared the slack as a
 * measurement rather than pinning it, because a pin on the 47 would have gone red on this repair
 * (Round 294's shape, foreseen).
 *
 * Driven before it was taken, five states of the real `compilerOptions` over the real tree, each
 * program read off `--listFiles` and never off the glob: REAL 148 / residue IN / exit 0 / 0 diag →
 * both predicates GREEN; planted CONTROL with no exclude, 148, identical → both GREEN (the control
 * earns its place: a config outside the tree dies on `TS2688` unless `typeRoots` points back, and
 * without it "residue OUT" would have been true of a config that never ran); **1 file excluded → 147
 * → floor GREEN, member list RED, naming the file**; **47 excluded → 101 → floor GREEN, member list
 * RED**; coverage re-narrowed to `hooks/` → 0 → `TS18003`, exit 2, both RED.
 *
 * The denominator comes from a DIFFERENT selector than the numerator — a disk walk, not `tsc` — so
 * the two cannot agree vacuously (Round 339), and the instrument carries its own control: fed the
 * REAL program with a BROKEN disk census (`[]`, and a 1-member list), the member list reads RED
 * rather than GREEN, so a failed census cannot pass as coverage. The floor survives, moved to the
 * disk side where its only job is that self-test.
 *
 * LIMIT, named rather than left implicit: `FILES` walks `scripts/` to ONE level, so a `.mts` added
 * at `scripts/lib/sub/` would be invisible to the disk side. That is why the check is two-sided —
 * such a file lands in the program and NOT in the disk census, and the stray leg reddens. The
 * instrument reports that it is out of date instead of silently covering less.
 */
const MTS_ON_DISK = FILES.filter((f) => f.endsWith('.mts'))
  .map((f) => `scripts/${f}`)
  .sort();
const MTS_MISSING = MTS_ON_DISK.filter((f) => !PROGRAM.has(f));
const MTS_STRAY = [...PROGRAM]
  .filter((f) => f.startsWith('scripts/') && f.endsWith('.mts') && !MTS_ON_DISK.includes(f))
  .sort();

check(
  'A1b',
  'and A1 is not the vacuous reading of an empty program: EVERY .mts file on disk under scripts/ is IN the program, held as a member list rather than a count, and the program holds no scripts/ .mts the disk census does not',
  MTS_ON_DISK.length >= 100 &&
    MTS_ON_DISK.includes('scripts/sweep-probes.d.mts') &&
    MTS_MISSING.length === 0 &&
    MTS_STRAY.length === 0,
  `${MTS_ON_DISK.length} .mts on disk · ${[...PROGRAM].filter((f) => f.endsWith('.mts')).length} .mts in the program · ` +
    `missing from the program ${MTS_MISSING.length}${MTS_MISSING.length ? `: ${MTS_MISSING.slice(0, 4).join(', ')}` : ''} · ` +
    `in the program but not on disk ${MTS_STRAY.length}${MTS_STRAY.length ? `: ${MTS_STRAY.slice(0, 4).join(', ')}` : ''} — ` +
    'so "OUT" in A1 is a fact about .mjs and not about a config that matched nothing, AND a narrowing ' +
    'that drops any covered file reddens here rather than passing on a surviving count.',
);

check(
  'A2',
  'the program contains zero .mjs files at all, so the exclusion is by extension and not a per-file omission someone could have fixed by naming a file',
  [...PROGRAM].filter((f) => f.endsWith('.mjs')).length === 0,
  `include is ${JSON.stringify(JSON.parse(read('tsconfig.json').replace(/^\s*\/\/.*$/gm, '')).include)} — ` +
    'extension-scoped, so no .mjs can enter except as a resolution target, and a resolution target is ' +
    'served by the .d.mts rather than read.',
);

/**
 * Round 304, Daedalus — repaired, not re-pinned, and the repair is a consequence of my own change
 * rather than of anything wrong here.
 *
 * This arm asserted that the 2 `.ts` files were OUTSIDE the program, which was the deferral
 * `scripts/tsconfig.json` stated in its own Scope note. Theseus's §5 priced that deferral and routed
 * the repair to my seat; Round 304 took it (`scripts/package.json` + a widened include), so the fact
 * the arm pinned is now false **in the direction that means it was repaired** — Round 294's shape
 * exactly: a pin on a state with an expiry date, going red as good news. Measured, not predicted: a
 * full sweep driven with the OTHER repair shape applied (both files renamed to `.mts`) reddens this
 * arm and D3 as well, so the pin was unsurvivable by either repair and not by only the one taken.
 *
 * Rewritten as the two-sided agreement it always should have been: a `.ts` file under `scripts/` is
 * in the program **if and only if** this config's own include globs ask for it. Reddens if a glob
 * claims a file the program has not got, and reddens if the globs stop claiming them while
 * membership persists — neither red clears by waiting. Arm count unchanged at 18, so the SWEPT pin
 * does not restage.
 */
const INCLUDE_GLOBS: string[] = JSON.parse(read('tsconfig.json').replace(/^\s*\/\/.*$/gm, '')).include;
/** True when one of the config's own globs claims this file by extension. `x.mts` is NOT `.ts`. */
const claimedByGlobs = (f: string): boolean =>
  INCLUDE_GLOBS.some((g) => {
    const m = /^\*\*\/\*(\.[A-Za-z]+)$/.exec(g);
    return m ? f.endsWith(m[1]) : false;
  });
const tsOnDisk = FILES.filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts'));
const tsClaimed = tsOnDisk.filter(claimedByGlobs);
const tsInProgram = tsOnDisk.filter((f) => PROGRAM.has(`scripts/${f}`));
check(
  'A3',
  'a .ts file under scripts/ is in the program if and only if this config’s own include globs claim it — the agreement, not the deferral, because Round 304 repaired the deferral this arm used to pin',
  tsOnDisk.length > 0 &&
    tsClaimed.length === tsInProgram.length &&
    tsClaimed.every((f) => tsInProgram.includes(f)),
  `globs ${JSON.stringify(INCLUDE_GLOBS)} · .ts on disk ${tsOnDisk.join(' · ')} · claimed ${tsClaimed.length} · ` +
    `in program ${tsInProgram.length} — and A2 is the other half: .mjs is claimed by no glob and is in the program 0 times.`,
);

// ── Section B: the declaration surface — complete, and unguarded ─────────────────────────────────
console.log('\n── B. the declaration surface: complete today, checked by nothing ──');

/**
 * Top-level parameter count of a parenthesised list. Written as a function rather than a regex
 * because both defects my first version had — a trailing comma, and `=>` inside a parameter type —
 * are invisible to a comma count and produced a LARGER number than the truth.
 */
const paramCount = (s: string): number => {
  const t = s.replace(/=>/g, '\u0001').replace(/,\s*$/, '');
  let depth = 0;
  let n = 0;
  let seen = false;
  for (const ch of t) {
    if ('([{<'.includes(ch)) depth += 1;
    else if (')]}>'.includes(ch)) depth -= 1;
    else if (ch === ',' && depth === 0) n += 1;
    else if (!/\s/.test(ch) && ch !== '\u0001') seen = true;
  }
  return seen ? n + 1 : 0;
};

/** Known answers in BOTH directions. The 4th and 7th are the two cases that fooled my first pass. */
const PARAM_FIXTURES: Array<[string, number]> = [
  ['', 0],
  ['a', 1],
  ['a, b', 2],
  ['a, b,', 2],
  ['\n  a: readonly string[],\n  b: string,\n', 2],
  ['a: {x:number, y:number}, b', 2],
  ['a: (p: number, q: number) => void, b', 2],
  ['a: Array<K, V>, b', 2],
  ['code: number | null, out: string, expect: RegExp, refusal?: RegExp, skip?: RegExp', 5],
  ['a: (x: Array<K,V>) => (y: number) => void, b, c', 3],
];
const fixtureFails = PARAM_FIXTURES.filter(([s, want]) => paramCount(s) !== want);

check(
  'B0',
  'the parameter counter is proven against 10 known answers BEFORE it is used to measure anything, including the trailing comma and the arrow-in-a-parameter-type that made my first version report four false mismatches',
  fixtureFails.length === 0 && PARAM_FIXTURES.length === 10,
  fixtureFails.length === 0
    ? '10/10 fixtures — 0-arity, nested braces, nested angles, nested parens, a curried callback, a trailing comma.'
    : fixtureFails.map(([s, w]) => `«${s}» want ${w} got ${paramCount(s)}`).join(' | '),
);

const argsAt = (src: string, from: number): string | null => {
  let i = src.indexOf('(', from);
  if (i < 0) return null;
  const start = i + 1;
  let depth = 0;
  for (; i < src.length; i += 1) {
    const c = src[i]!;
    if ('([{'.includes(c)) depth += 1;
    else if (')]}'.includes(c)) {
      depth -= 1;
      if (depth === 0) return src.slice(start, i);
    }
  }
  return null;
};
const exportedNames = (src: string): Set<string> => {
  const out = new Set<string>();
  for (const m of src.matchAll(/^export\s+(?:async\s+)?(?:const|let|function|class)\s+([A-Za-z0-9_$]+)/gm))
    out.add(m[1]!);
  for (const m of src.matchAll(/^export\s*\{([^}]*)\}/gm))
    for (const part of m[1]!.split(',')) {
      const t = part.trim().split(/\s+as\s+/).pop()?.trim();
      if (t) out.add(t);
    }
  return out;
};
// Round 454, Daedalus: `class` was missing, and B2 reddened on a correctly declared export.
//
// `exportedNames` above has modelled `const|let|function|class` since this probe was written; this
// reader modelled `const|function`. So a `.mjs` exporting a class and a `.d.mts` declaring it —
// which is exactly what `scripts/lib/strip-source.mjs` and its `.d.mts` became when Round 454 gave
// `stripSource` a named refusal — came out of B2 as `exported but not declared`, with `tsc
// --noEmit` reporting 0 errors across all four workspaces. **The declaration was right and the
// guard was blind**, which is the more dangerous of the two directions: a drift guard that reddens
// on a correct tree gets read as noise, and the next person turns it down rather than widening it.
//
// `class` is added because it has a victim. The remaining declaration kinds are NOT added on
// speculation — a guard that silently grew a model it was never tested against is how this probe's
// own B3 counter came to report 4 arity mismatches that were all its own. Instead they are named,
// and `B2b` below asserts that no declaration file in `DECLARED_PAIRS` currently exports a kind
// this reader has no model of. So the blindness is keyed positively: the day someone declares an
// `interface`, B2b reddens by name instead of B2 mislabelling it as undeclared.
const DECLARED_KINDS_MODELLED = ['const', 'function', 'class'] as const;
const DECLARED_KINDS_UNMODELLED = ['let', 'var', 'type', 'interface', 'enum', 'namespace'] as const;
const declaredNames = (src: string): Set<string> => {
  const out = new Set<string>();
  const re = new RegExp(`^export\\s+declare\\s+(?:${DECLARED_KINDS_MODELLED.join('|')})\\s+([A-Za-z0-9_$]+)`, 'gm');
  for (const m of src.matchAll(re)) out.add(m[1]!);
  return out;
};
const declaredUnmodelledKinds = (src: string): string[] => {
  const hits: string[] = [];
  for (const k of DECLARED_KINDS_UNMODELLED) {
    const re = new RegExp(`^export\\s+declare\\s+${k}\\s+([A-Za-z0-9_$]+)`, 'gm');
    for (const m of src.matchAll(re)) hits.push(`${k} ${m[1]!}`);
  }
  return hits;
};
// KP/KN on this reader, before it is used on the tree. A reader widened without a positive for the
// kind it was widened for is a change nothing grades; a reader widened without a NEGATIVE for the
// kinds it still cannot see is a blindness that has stopped being declared.
const DECL_READER_KP: [string, string[]][] = [
  ['export declare const a: number;', ['a']],
  ['export declare function b(x: number): string;', ['b']],
  ['export declare class C extends TypeError {}', ['C']],
  ['export declare const a: number;\nexport declare class C extends Error {}\n', ['a', 'C']],
  ['  export declare class Indented {}', []], // not at line start — same as the pre-454 reader
];
const DECL_READER_KN: [string, string][] = [
  ['export declare interface I { x: number }', 'interface I'],
  ['export declare type T = string;', 'type T'],
];

const nameProblems: string[] = [];
const arityProblems: string[] = [];
const unmodelledKindHits: string[] = [];
let signaturesChecked = 0;
let namesChecked = 0;
for (const mjs of DECLARED_PAIRS) {
  const impl = read(mjs);
  const decl = read(mjs.replace(/\.mjs$/, '.d.mts'));
  const e = exportedNames(impl);
  const d = declaredNames(decl);
  for (const h of declaredUnmodelledKinds(decl)) unmodelledKindHits.push(`${mjs.replace(/\.mjs$/, '.d.mts')}: ${h}`);
  namesChecked += d.size;
  for (const n of d) if (!e.has(n)) nameProblems.push(`${mjs}: declared but not exported — ${n}`);
  for (const n of e) if (!d.has(n)) nameProblems.push(`${mjs}: exported but not declared — ${n}`);
  for (const m of decl.matchAll(/export declare const ([A-Za-z0-9_$]+)\s*:\s*\(/g)) {
    const n = m[1]!;
    const dA = argsAt(decl, m.index + m[0].length - 1);
    const iM = new RegExp(
      `export (?:const ${n}\\s*=\\s*(?:async\\s*)?|(?:async )?function ${n})\\s*\\(`,
      'm',
    ).exec(impl);
    const iA = iM ? argsAt(impl, iM.index + iM[0].length - 1) : null;
    signaturesChecked += 1;
    if (dA === null || iA === null) arityProblems.push(`${mjs}:${n} — unparsed`);
    else if (paramCount(dA) !== paramCount(iA))
      arityProblems.push(`${mjs}:${n} — declared ${paramCount(dA)} · impl ${paramCount(iA)}`);
  }
}

measure(
  'B1',
  `declared pairs ${DECLARED_PAIRS.length}: ${DECLARED_PAIRS.join(' · ')} — ${namesChecked} declared names, ${signaturesChecked} function signatures`,
);

check(
  'B2',
  'no declared export is absent from its implementation, and no export is undeclared: the declaration surface is name-complete in both directions today',
  nameProblems.length === 0 && namesChecked >= 14,
  nameProblems.length === 0
    ? `${namesChecked} declared names across ${DECLARED_PAIRS.length} pairs, 0 problems in either direction.`
    : nameProblems.join(' | '),
);

// Round 454: B2's reader is graded, and the kinds it still cannot see are keyed positively.
const kpRows = DECL_READER_KP.map(([src, want]) => {
  const got = [...declaredNames(src)];
  return { src, want, got, ok: got.length === want.length && want.every((n) => got.includes(n)) };
});
const knRows = DECL_READER_KN.map(([src, want]) => {
  const names = [...declaredNames(src)];
  const hits = declaredUnmodelledKinds(src);
  return { src, want, ok: names.length === 0 && hits.length === 1 && hits[0] === want };
});
check(
  'B2a',
  `B2's declared-name reader sees every kind it claims to model (${DECLARED_KINDS_MODELLED.join('/')}) and reports the ones it does not`,
  kpRows.every((r) => r.ok) && knRows.every((r) => r.ok),
  [
    ...kpRows.map((r) => `${r.ok ? 'ok' : 'BAD'} ${JSON.stringify(r.src.slice(0, 44))} want [${r.want}] got [${r.got}]`),
    ...knRows.map((r) => `${r.ok ? 'ok' : 'BAD'} unmodelled-kind row ${JSON.stringify(r.src.slice(0, 44))} want "${r.want}"`),
  ].join(' | ')
    + '. `class` was added in Round 454 after B2 reddened on a correctly declared '
    + '`export declare class StripSourceInputError` with tsc clean — the declaration was right and '
    + 'this reader was blind. Both readers are line-anchored, so an INDENTED top-level declaration '
    + 'is invisible to each of them symmetrically; that limit is pinned by the fifth KP row rather '
    + 'than repaired, because repairing one side alone would turn it into a false `declared but not '
    + 'exported`.',
);

check(
  'B2b',
  `no declaration file in the pairs exports a kind B2's reader has no model of (${DECLARED_KINDS_UNMODELLED.join('/')})`,
  unmodelledKindHits.length === 0,
  unmodelledKindHits.length === 0
    ? `0 hits across ${DECLARED_PAIRS.length} declaration file(s). This is the row that keeps the `
      + `blindness declared: without it, the first \`export declare interface\` to land would be `
      + `reported by B2 as "exported but not declared", which is a true red for a false reason.`
    : unmodelledKindHits.join(' | '),
);

check(
  'B3',
  'no declared signature is wider or narrower than its implementation, measured with the counter B0 proved',
  arityProblems.length === 0 && signaturesChecked >= 14,
  arityProblems.length === 0
    ? `${signaturesChecked} signatures, 0 arity mismatches. My first counter reported 4 here and all 4 were its own.`
    : arityProblems.join(' | '),
);

// The import-target set. Resolution is checked against DISK, because my own scratch version of this
// measurement resolved a quoted fixture inside probe-round259 into a file that does not exist.
const importTargets = new Map<string, Set<string>>();
const phantom: string[] = [];
for (const f of FILES.filter((x) => x.endsWith('.mts') && !x.endsWith('.d.mts'))) {
  const dir = f.includes('/') ? f.slice(0, f.lastIndexOf('/')) : '';
  for (const m of read(f).matchAll(/from\s+['"]([^'"]+\.mjs)['"]/g)) {
    const rel = normalize(join(dir, m[1]!));
    if (!existsSync(join(SCRIPTS, rel))) {
      phantom.push(`${f} → ${m[1]!}`);
      continue;
    }
    if (!importTargets.has(rel)) importTargets.set(rel, new Set());
    importTargets.get(rel)!.add(f);
  }
}

measure(
  'B4',
  `.mjs modules statically imported by a .mts, resolved against disk: ${importTargets.size} — ` +
    [...importTargets].sort().map(([t, s]) => `${t} ←${s.size}`).join(' · '),
);
// Population-minus-self, for the same reason Round 300 arm A1b did it: this file mints `./mod.mjs`
// fixtures as quoted strings in Section C, so an unqualified count of discarded specifiers would be
// measuring its own notation. The figure that is comparable with any other tree is the other one.
const SELF = 'probe-round303';
const phantomSelf = phantom.filter((p) => p.startsWith(SELF));
const phantomOther = phantom.filter((p) => !p.startsWith(SELF));
measure(
  'B4b',
  `specifiers discarded because no such file exists: ${phantom.length} total · ${phantomSelf.length} this file’s own Section C fixtures · ` +
    `${phantomOther.length} elsewhere in the corpus${phantomOther.length ? ` — ${phantomOther.join(' · ')}` : ''}`,
);

check(
  'B5',
  'every .mjs module a .mts actually imports has a hand-written .d.mts — so the declaration surface is complete, and by A1 not one of those implementations is graded',
  importTargets.size >= 3 &&
    [...importTargets.keys()].every((t) => FILES.includes(t.replace(/\.mjs$/, '.d.mts'))),
  [...importTargets.keys()].sort().map((t) => `${t}: ${FILES.includes(t.replace(/\.mjs$/, '.d.mts')) ? 'has .d.mts' : 'NO .d.mts'}`).join(' | '),
);

check(
  'B5b',
  'and B5 is not green by an over-permissive resolver: a specifier naming no file on disk is rejected rather than counted — asserted on the corpus-minus-self count, so this file’s own fixtures cannot be what makes the arm green',
  phantomOther.length > 0 && !existsSync(join(SCRIPTS, 'strip-source.mjs')),
  `${phantomOther.length} discarded specifier(s) outside this file (plus ${phantomSelf.length} of its own); ` +
    'scripts/strip-source.mjs does not exist, and the string that names it lives inside a quoted assertion ' +
    'in probe-round259 rather than an import — the self-scanning-corpus class, third consecutive round, ' +
    'this time in a measurement rather than a probe arm.',
);

const mjsAll = FILES.filter((f) => f.endsWith('.mjs'));
const mjsFlat = mjsAll.filter((f) => !f.includes('/'));
const mjsLib = mjsAll.filter((f) => f.includes('/'));
measure(
  'B6',
  `.mjs total ${mjsAll.length} · directly under scripts/ ${mjsFlat.length} · nested ${mjsLib.length} · named probe-* ${mjsAll.filter((f) => /(^|\/)probe-/.test(f)).length}`,
);
check(
  'B7',
  "the config's \"37 .mjs probes\" is an exact count of the flat directory and a wrong label for it: the excluded nested modules hold more of the import-target set than the 37 do",
  mjsFlat.length === 37 &&
    mjsAll.length !== 37 &&
    [...importTargets.keys()].filter((t) => t.includes('/')).length >
      [...importTargets.keys()].filter((t) => !t.includes('/')).length,
  `37 flat · ${mjsLib.length} nested · ${mjsAll.length} total; import targets split ` +
    `${[...importTargets.keys()].filter((t) => !t.includes('/')).length} flat / ` +
    `${[...importTargets.keys()].filter((t) => t.includes('/')).length} nested.`,
);

// ── Section C: the consequence, on minted fixtures under the real compilerOptions ────────────────
console.log('\n── C. what the gap buys, driven on fixtures built from this config’s own options ──');

const OPTS = JSON.parse(read('tsconfig.json').replace(/^\s*\/\/.*$/gm, '')).compilerOptions;
rmSync(SCRATCH, { recursive: true, force: true });

/** Mints one fixture directory and returns tsc's stderr+stdout and tsx's, both on the same tree. */
const fixture = (
  name: string,
  files: Record<string, string>,
): { tsc: string; tsx: string } => {
  const dir = join(SCRATCH, name);
  mkdirSync(dir, { recursive: true });
  for (const [f, body] of Object.entries(files)) writeFileSync(join(dir, f), body);
  writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({ compilerOptions: OPTS, include: ['**/*.mts'] }));
  const t = spawnSync('npx', ['tsc', '-p', join(dir, 'tsconfig.json'), '--noEmit'], {
    cwd: REPO,
    encoding: 'utf8',
  });
  const r = spawnSync('npx', ['tsx', join(dir, 'user.mts')], { cwd: REPO, encoding: 'utf8' });
  return { tsc: `${t.stdout ?? ''}${t.stderr ?? ''}`.trim(), tsx: `${r.stdout ?? ''}${r.stderr ?? ''}`.trim() };
};

const ABSENT = fixture('absent-export', {
  'mod.mjs': 'export const kept = (a) => String(a);\n',
  'mod.d.mts': 'export declare const kept: (a: number) => string;\nexport declare const gone: (a: number) => string;\n',
  'user.mts': "import { kept, gone } from './mod.mjs';\nconsole.log(kept(1), gone(2));\n",
});
check(
  'C1',
  'a .d.mts that declares an export its .mjs does not have typechecks CLEAN under this config’s own compilerOptions',
  ABSENT.tsc === '',
  `tsc said: ${ABSENT.tsc === '' ? '(nothing)' : ABSENT.tsc.split('\n')[0]}`,
);
check(
  'C2',
  'and the same tree fails at runtime naming the export the declaration invented, so C1’s green is a blind spot rather than a safety result',
  /does not provide an export named/.test(ABSENT.tsx) && /gone/.test(ABSENT.tsx),
  ABSENT.tsx.split('\n').find((l) => /does not provide/.test(l)) ?? ABSENT.tsx.slice(0, 160),
);

const NODECL = fixture('no-declaration', {
  'mod.mjs': 'export const kept = (a) => String(a);\n',
  'user.mts': "import { kept } from './mod.mjs';\nconsole.log(kept(1));\n",
});
check(
  'C3',
  'the control: remove the .d.mts and tsc DOES error on the same import — so the silence in C1 is bought by the declaration file specifically, not by tsc ignoring .mjs imports altogether',
  NODECL.tsc !== '' && /TS7016|TS2307/.test(NODECL.tsc),
  NODECL.tsc.split('\n')[0] ?? '(unexpectedly clean — the control did not discriminate)',
);

const WIDE = fixture('wide-arity', {
  'mod.mjs': 'export const kept = (a) => String(a);\n',
  'mod.d.mts': 'export declare const kept: (a: number, b: number) => string;\n',
  'user.mts': "import { kept } from './mod.mjs';\nconsole.log(kept(1, 2));\n",
});
check(
  'C4',
  'a declared arity wider than the implementation’s typechecks clean AND runs without complaint — the silent half of the gap, and the half B3 exists to watch',
  WIDE.tsc === '' && !/Error/.test(WIDE.tsx),
  `tsc: ${WIDE.tsc === '' ? '(clean)' : WIDE.tsc.split('\n')[0]} · runtime: ${WIDE.tsx.split('\n')[0] || '(no output)'}`,
);

// ── Section D: the deferred .ts widening, measured ───────────────────────────────────────────────
console.log('\n── D. the widening the config defers, priced ──');

const widenedCfg = join(SCRATCH, 'tsconfig.widened.json');
mkdirSync(SCRATCH, { recursive: true });
writeFileSync(
  widenedCfg,
  JSON.stringify({
    compilerOptions: OPTS,
    include: [`${SCRIPTS}/**/*.mts`, `${SCRIPTS}/**/*.ts`],
  }),
);
const widened = spawnSync('npx', ['tsc', '-p', widenedCfg, '--noEmit'], {
  cwd: REPO,
  encoding: 'utf8',
  maxBuffer: 32 * 1024 * 1024,
});
const wErrs = `${widened.stdout ?? ''}${widened.stderr ?? ''}`
  .split('\n')
  .filter((l) => /error TS/.test(l));

measure('D1', `widening include to **/*.ts: exit ${widened.status} · ${wErrs.length} error line(s) — ${[...new Set(wErrs.map((l) => (l.match(/error (TS\d+)/) ?? [, '?'])[1]))].join(',')}`);
for (const e of wErrs.slice(0, 4)) measure('D1b', e.replace(REPO, '.').trim());

/**
 * STOP fire 2026-09-30, Theseus — the guard the Round 304 restatement needed, with the known
 * positive that proves the guard reads something.
 *
 * D2 and D3 both came out of Round 304 concluding "the widened program is clean" from
 * `wErrs.length === 0` alone, and nothing in this file read the child's exit status. A child that
 * never ran prints no `error TS` line, so every failure that fails to print a diagnostic was being
 * reported as a clean program. Driven both directions before this was written:
 *
 *   real run                        status 0    · 0 err lines · clean
 *   binary absent (spawn fails)     status null · 0 err lines · WAS READ AS CLEAN
 *   child SIGKILLed before output   status null · 0 err lines · WAS READ AS CLEAN
 *   missing config file (control)   status 1    · 1 err line  · already caught — TS5058
 *
 * The control is why this is stated as narrow rather than total: a config-level failure does print a
 * TS code and was always caught. The uncaught class is the child not running at all.
 *
 * The form these arms had BEFORE Round 304 was immune to this by accident — it asserted exactly
 * 2 × TS1470, and a non-run cannot satisfy an equality against 2. Restating the subject to "0
 * errors" was right and it traded that accidental guard for a vacuous green. One conjunct restores
 * it; the known negative below keeps that conjunct from being a green nobody has exercised. Arm
 * count unchanged at 18, so the SWEPT pin does not restage.
 */
const ranClean = widened.status === 0;
const nonRun = spawnSync('tsc-this-binary-does-not-exist', ['--noEmit'], {
  cwd: REPO,
  encoding: 'utf8',
});
const nonRunErrs = `${nonRun.stdout ?? ''}${nonRun.stderr ?? ''}`
  .split('\n')
  .filter((l) => /error TS/.test(l));
/** True when reader+guard decline to call a child that never ran a clean program. */
const guardRejectsNonRun = nonRunErrs.length === 0 && nonRun.status !== 0;

/**
 * Round 304, Daedalus — same subject, paid price. This arm's claim was that the widening price is an
 * artefact of the extension rule rather than a defect in either file. That claim is unchanged and is
 * now demonstrated by the repair having worked: the root manifest still declares no `"type"`, and the
 * price went to zero on the strength of ONE added file. The arm therefore reads the declaration it
 * depends on instead of asserting its absence. The control that makes this mean something — withhold
 * the declaration from copies of the same two files and TS1470 returns, 2 of 2 — is driven in
 * `probe-round304` section C, in my own file rather than added to this one.
 */
const scriptsPkg = existsSync(join(SCRIPTS, 'package.json'))
  ? (JSON.parse(readFileSync(join(SCRIPTS, 'package.json'), 'utf8')) as { type?: string })
  : null;
check(
  'D2',
  'the widening price was an artefact of the extension rule and not a defect in the files, and Round 304 paid it with a module-format declaration rather than a rename: the root manifest still declares no "type", scripts/package.json declares "module", and the widened program is clean',
  JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8')).type === undefined &&
    scriptsPkg?.type === 'module' &&
    wErrs.length === 0 &&
    ranClean &&
    guardRejectsNonRun,
  `root package.json "type": absent · scripts/package.json "type": ${JSON.stringify(scriptsPkg?.type ?? null)} · ` +
    `widening errors now ${wErrs.length} (was 2 × TS1470, the import.meta-under-CommonJS diagnostic) · ` +
    `compiler exit ${widened.status} — the clean reading is only accepted from a compiler that RAN, and the ` +
    `known negative beside it (a binary that does not exist: exit ${nonRun.status}, ${nonRunErrs.length} error lines) ` +
    `confirms that guard rejects a child which never ran rather than being an unexercised conjunct.`,
);

// NOT driven: neither .ts file is executed. `aaxt-mcp-live-probe.ts` and `record-demo.ts` are a live
// MCP probe and a demo recorder; running them to see whether they "work under tsx" would bind ports
// and could call a model, which is not a price this arm is worth. So D3 asserts only what a static
// read can carry, and the header does not claim the files run clean.
const tsFiles = FILES.filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts'));
// Round 304, Daedalus: the diagnostic this arm used to count is gone, and the construct that caused
// it is still here — which is the whole claim. Restated so the arm grades that pairing rather than
// the error count: `import.meta` present in both files AND zero widening errors. If someone "fixes"
// these files by deleting `import.meta` instead, this arm reddens, which is the right outcome — the
// repair under test is the format declaration, not an edit to either file.
check(
  'D3',
  'TS1470 was reporting something real rather than a phantom, and the repair did not make it go away by removing the construct: both .ts files still use import.meta, and the widened program is clean because the declaration makes them ESM',
  tsFiles.length === 2 &&
    tsFiles.every((f) => /import\.meta/.test(read(f))) &&
    wErrs.length === 0 &&
    ranClean,
  tsFiles.map((f) => `${f}: import.meta still present`).join(' · ') +
    ` — widening errors ${wErrs.length} at compiler exit ${widened.status}, so the construct stayed and the` +
    ' diagnostic went; D2 carries the known negative for the exit-status guard this arm shares.',
);

// ── Section Z: discipline ────────────────────────────────────────────────────────────────────────
console.log('\n── Z. discipline ──');
// A DELTA, not a cleanliness assertion. The first version of this arm asserted that `git status` over
// `scripts/` and `packages/` was empty, which is not what "this probe writes nothing" means — it is
// "the tree has no uncommitted work", a fact about whoever is running the fire. It went green
// standalone, green twice under `promote-probes`, and **RED in the sweep**, because by then the fire
// had an uncommitted edit to `sweep-probes.mjs` — the file that lists this probe. An arm that reddens
// on an unrelated edit in the same tree is the shape this thread keeps finding; caught here by the
// sweep and not by me. The honest predicate is a before/after comparison of the same reading.
const treeState = (): string => {
  const r = spawnSync('git', ['status', '--porcelain', 'scripts', 'packages'], {
    cwd: REPO,
    encoding: 'utf8',
  });
  return (r.stdout ?? '').split('\n').filter((l) => l.trim()).sort().join('\n');
};
check(
  'Z1',
  'this probe writes nothing under scripts/ or packages/ — asserted as a before/after delta of the same git reading, because "the tree is clean" is a fact about the fire and not about this probe',
  treeState() === TREE_AT_START,
  treeState() === TREE_AT_START
    ? `git status over scripts/ and packages/ is byte-identical to the reading taken before arm A0 ` +
      `(${TREE_AT_START.split('\n').filter(Boolean).length} entr${TREE_AT_START.split('\n').filter(Boolean).length === 1 ? 'y' : 'ies'}, unchanged).`
    : `BEFORE «${TREE_AT_START}» AFTER «${treeState()}»`,
);
check(
  'Z2',
  'the scratch tree this probe minted is inside .testdata/, which is gitignored, and is removed before exit',
  SCRATCH.includes('.testdata') && readFileSync(join(REPO, '.gitignore'), 'utf8').includes('.testdata'),
  `${SCRATCH.replace(REPO, '.')} · .gitignore names .testdata`,
);
measure('Z3', 'no port bound · no database opened · no corpus read · no model called');
rmSync(SCRATCH, { recursive: true, force: true });

console.log(
  `\n${fail === 0 ? `All ${pass} regression checks passed` : `${fail} of ${pass + fail} FAILED`}, ${meas} measurements, 0 skips`,
);
process.exit(fail === 0 ? 0 : 1);
