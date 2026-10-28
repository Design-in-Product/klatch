/**
 * Round 307 — the `.d.mts` guard three rounds have left unclaimed, split into the half that can be
 * built and the half that cannot, plus the premise underneath the open item that is false.
 *
 * ── The item, and where it came from ──────────────────────────────────────────
 *
 * Theseus's Round 306 §9 and Argus's Round 305 §5 both carry the same line, third round running:
 *
 *   > **Unclaimed by all three of us:** a guard over `.d.mts` **return types and parameter types**.
 *   > B2/B3 cover names and arity and are SWEPT; the arity half is the one that fails silently, and
 *   > return/parameter types are still ungraded.
 *
 * Taken here. The answer is asymmetric, and the premise in the second clause does not hold.
 *
 * ── THE FINDING, in three parts ───────────────────────────────────────────────
 *
 * **1. Return types ARE gradeable, and there is no drift.** Put the `.mjs` implementation into a
 * type program under `allowJs` — where `tsc` infers its types from the body — and ask for
 * assignability against the hand-written declaration resolved through its own `.d.mts`. Over the
 * **26** declared value exports of the **3** pairs: **0 DRIFT**. The declarations are accurate in
 * types as well as in names and arity. Accurate and, until this file, unguarded.
 *
 * The load-bearing direction is **impl → decl**, and it is load-bearing for two reasons, not one:
 * a declared RETURN narrower than the implementation delivers over-narrows the caller, and a
 * declared PARAMETER wider than the implementation accepts lets the caller pass something the
 * implementation cannot handle. Parameters are contravariant, so both arrive in the same direction.
 * The reverse direction (decl → impl) is NOT usable as a guard: it reds on 8 exports that are
 * correct, 6 of them on `readonly`, and `sweep-probes.d.mts`'s own docblock says the narrowing is
 * deliberate. Measured, then discarded, rather than assumed symmetric.
 *
 * **2. The parameter half is not gradeable this way, and the reason is one tag away.** An
 * unannotated parameter in a `.mjs` infers as `any`, and `any` satisfies any declared type in both
 * directions — so a green on a parameter type is vacuous. Of the **18** declared function
 * signatures, exactly **1** has parameters the instrument can grade: `explainTsxRequirement`, which
 * infers as `(err: unknown, selfUrl: string) => never` because `tsx-required.mjs` carries **3**
 * JSDoc tags above it — the only `@param`/`@returns` tags in all three implementations (0 in
 * `sweep-probes.mjs`, 0 in `strip-source.mjs`). So 17 of the 18 CONFORMS verdicts are green on
 * their return half and **vacuous on their parameter half**, and the price of making one real is
 * known rather than guessed: a JSDoc block on the implementation. Section D proves the vacuity by
 * declaring an absurd parameter type and watching the check stay green.
 *
 * **Amendment, 2026-10-28 (Round 467).** Every figure in the paragraph above is as of 2026-10-01 and
 * the population has since moved; the live figures are the `[MEAS]` arms A0, C3 and C4m, which is
 * where to read them. What changed: `scripts/lib/characterisation-markers.mjs` gained a `.d.mts`, so
 * the population is **4** pairs / 43 declared value exports / **30** signatures, not 3 / 26 / 18.
 * And the price named above was PAID — the 10/27 `scripts/lib/**\/*.mjs` typecheck gate annotated
 * nine lib modules, so **14** of the 27 readable signatures are now gradeable rather than 1. The
 * remaining 13 are every readable signature of `sweep-probes.mjs`, the one module here that is not
 * under `scripts/lib/` and so was never reached by that gate. The sentence "the only `@param`/
 * `@returns` tags in all three implementations" is still literally true of the BLOCK spelling and is
 * no longer the mechanism: see C4's own header for why the key is now per-signature and style-blind.
 *
 * **3. "The arity half is covered" is false for 4 of the 18 signatures.** `probe-round303` B3 is
 * SWEPT, reads `0 arity mismatches`, and is the arm all three of us have cited. Its loop keys on
 * `export declare const <name>: (` — so the **4** declarations in `tsx-required.d.mts` written as
 * `export declare function <name>(` are never reached. Its own B1 says so in the output and has
 * since the day it was written: **"26 declared names, 14 function signatures."** 26 names, 14
 * signatures, 18 declared functions; the gap is one spelling. Not a defect in the arm — a narrower
 * arm than the sentence we have each repeated about it. Arm C5 here is the known positive: an arity
 * mismatch injected into the `function` spelling, which B3's counter does not see and this file's
 * does.
 *
 * ── My first measurement reported a drift, and it was the instrument ──────────
 *
 * Run 1 reported `classify(...).state` as `string` where the declaration says `ProbeState`. Read as
 * a finding it is a declaration lying about a narrower type, which is the exact failure this round
 * exists to catch. It is not one: the implementation's three branches are `'PASS'`, `'BLOCKED'` and
 * `'RED'`, every one a member of the declared union, and the `string` is JS literal widening.
 *
 * Rather than leave that as a hand-read, the discrimination is mechanical (Section B3/B4): relax
 * every string-literal-union type alias in a scratch copy of the declaration to `string` and re-ask
 * the one failing direction. Green under the relaxed declaration means the red is **entirely
 * explained by literal widening**; still red means drift. Driven with a known positive (`classify`,
 * which flips) and a known **negative** (a minted pair whose declaration lies about a `number`,
 * which does not flip) — because a relaxation that laundered every lie would turn this guard off.
 *
 * `sweepExit` is the same inference behaviour in the opposite bucket: `(red || bad ? 1 : blocked ?
 * 2 : 0)` infers `0 | 1 | 2` against a declared `number`. One mechanism, two buckets, decided only
 * by which way the hand-writer chose to be precise.
 *
 * ── My own instrument's third state, found by driving it ──────────────────────
 *
 * The per-parameter `any` test reported that `sweepExit` and `explainTsxRequirement` had no `any`
 * parameters. For the second that is true and is the finding. For the first it was the instrument:
 * `Parameters<typeof fn>` resolves to **`never`** when the implementation's parameter is an
 * unannotated **destructuring pattern**, so every position reads "not any" — the reassuring answer
 * — on a function whose parameters it cannot see at all. Reduced to two lines (arm C4):
 *
 *     export const plain        = (a, b)      => …   ⇒ Parameters<> = [a?: any, b?: any]
 *     export const destructured = ({ a, b })  => …   ⇒ Parameters<> = never
 *
 * This fleet's standing rule is that a source-scanning regex fails by returning a smaller number.
 * A type-level detector fails by returning **coverage it does not have**, which is worse in the way
 * Theseus's Round 303 §"my first arity counter reported 4 mismatches" was worse: it arrives looking
 * like good news. Arm C2 is the gate that makes it impossible — `Parameters<>` must not be `never`
 * before any position is read, and the arm NAMES the functions where it is.
 *
 * And the reporter that was supposed to tell me all of this read `<cell>(` where `tsc` prints
 * `<cell>.mts(3,7)`, so it called three errored cells GREEN. The known positive caught it on the
 * first run, which is the only reason any number above is the right way up. Arm B0 is that known
 * positive, kept, so no later edit to the reader can quietly return all-green again.
 *
 * ── Arms ──────────────────────────────────────────────────────────────────────
 *
 * A — the population, resolved from disk: 3 pairs, 26 declared value exports, 18 declared function
 *     signatures, and the two declaration spellings counted separately because that split is finding 3.
 * B — the return-type grade. B0 is the reader's known positive (a cell that MUST read RED) before
 *     anything is measured; B1 the gate (0 drift, naming any export it finds); B2 the detector's
 *     known negative on a minted liar; B3/B4 the literal-widening discriminator with its own
 *     positive and negative, and the check that the relaxation is not a no-op.
 * C — the parameter half. C1 the `IsAny` self-test in both directions; C2 the `Parameters<> !==
 *     never` readability gate; C3 the population [MEAS]; C4a the annotation key's minted known
 *     positive; C4 the annotation correspondence, two-sided as a SET rather than a count; C4b that
 *     both JSDoc styles are live in the population; C4m the style census; C5 the two-line repro of
 *     the destructured third state; C6 the known positive for finding 3's 4-signature hole.
 *
 *     (The arm letters above were off by one against the code from this file's first commit until
 *     2026-10-28 — the list said C3 was the correspondence and C4 the repro, while the code had C3
 *     as a [MEAS], C4 the correspondence, C5 the repro and C6 the known positive. Corrected here
 *     rather than in the code, because every memo that cites an arm cites the code's letter.)
 * D — the vacuity, proven rather than argued: a declaration whose parameter type is absurd still
 *     passes the guard, because the implementation's parameter is `any`.
 * Z — discipline and the tree.
 *
 * Polarity: every population figure is a `[MEAS]`. The pins are properties — zero drift, the
 * readability gate, the JSDoc correspondence, and the fixture behaviours — each with an
 * other-answer fixture beside it, because "nothing drifted" is also what an instrument that
 * compares nothing reports.
 *
 * Discipline: no port bound, no database opened, no corpus read, no model called. Every subprocess
 * is `npx tsc` over a fixture tree under gitignored `.testdata/`, which emits nothing. The three
 * real implementations and their three declarations are COPIED into the fixture tree and read there;
 * nothing under `scripts/` or `packages/` is written.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { fingerprint } from './lib/tree-fingerprint.mts';
import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';

const SELF = fileURLToPath(import.meta.url);
const SCRIPTS = dirname(SELF);
const REPO = dirname(SCRIPTS);
const SCRATCH = join(REPO, '.testdata', 'r307-probe');

const results: ProbeVerdict[] = [];
let meas = 0;
const check = (id: string, claim: string, ok: boolean, detail: string): void => {
  results.push({ arm: id, check: claim, pass: ok, kind: 'regression' });
  console.log(`  [${id}] ${ok ? 'PASS' : 'FAIL'}  ${claim}`);
  console.log(`        ${detail}`);
};
const measure = (id: string, line: string): void => {
  meas += 1;
  console.log(`  [${id}] MEAS  ${line}`);
};

const read = (abs: string): string => readFileSync(abs, 'utf8');
const stripComments = (s: string): string => s.replace(/^\s*\/\/.*$/gm, '');

const TREE_AT_START = fingerprint(REPO, 'scripts');

/**
 * The pairs, resolved from disk rather than hand-typed: every `.mjs` under `scripts/` (one level of
 * nesting, which is all this tree has) that has a `.d.mts` sibling. `extra` is the implementation's
 * own in-tree import, which must travel into the fixture or the copy will not resolve.
 */
const scriptsFiles = (): string[] => {
  const out: string[] = [];
  for (const e of readdirSync(SCRIPTS, { withFileTypes: true })) {
    if (e.isDirectory()) for (const f of readdirSync(join(SCRIPTS, e.name))) out.push(`${e.name}/${f}`);
    else out.push(e.name);
  }
  return out.sort();
};
const FILES = scriptsFiles();
const PAIRS = FILES.filter((f) => f.endsWith('.mjs') && FILES.includes(f.replace(/\.mjs$/, '.d.mts'))).map((impl) => ({
  impl,
  decl: impl.replace(/\.mjs$/, '.d.mts'),
  base: impl.replace(/^.*\//, '').replace(/\.mjs$/, ''),
}));
/** `sweep-probes.mjs` imports one sibling; resolved by reading its specifiers, not by memory. */
const siblingImports = (impl: string): string[] => {
  const src = read(join(SCRIPTS, impl));
  const out: string[] = [];
  for (const m of src.matchAll(/^import[^'"]*['"](\.[^'"]+\.mjs)['"]/gm)) {
    const rel = join(dirname(impl), m[1]!).replace(/\\/g, '/');
    if (FILES.includes(rel)) out.push(rel);
  }
  return out;
};

/** Declared VALUE exports. `export type` / `export interface` are not values and cannot be assigned. */
const declaredValues = (src: string): string[] =>
  [...src.matchAll(/^export\s+declare\s+(?:const|function|let|var)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]!);
/** Declared FUNCTION exports, in BOTH spellings — the split that is finding 3. */
const declaredConstFns = (src: string): string[] =>
  [...src.matchAll(/^export\s+declare\s+const\s+([A-Za-z_$][\w$]*)\s*:\s*\(/gm)].map((m) => m[1]!);
const declaredFunctionFns = (src: string): string[] =>
  [...src.matchAll(/^export\s+declare\s+function\s+([A-Za-z_$][\w$]*)\s*\(/gm)].map((m) => m[1]!);

/** Every `export type X = 'a' | 'b';` widened to `string`. Returns the text and the names touched. */
const relax = (src: string): [string, string[]] => {
  const touched: string[] = [];
  const out = src.replace(
    /^(export\s+type\s+([A-Za-z_$][\w$]*)\s*=\s*)('[^']*'(?:\s*\|\s*'[^']*')*)(\s*;)/gm,
    (_m, head: string, name: string, _u: string, tail: string) => {
      touched.push(name);
      return `${head}string${tail}`;
    },
  );
  return [out, touched];
};

const IS_ANY = 'type IsAny<T> = 0 extends (1 & T) ? true : false;\n';

rmSync(SCRATCH, { recursive: true, force: true });
mkdirSync(SCRATCH, { recursive: true });

console.log('\nRound 307 — the return half is gradeable, the parameter half is `any`, and the arity check covers 14 of 18\n');

// ── Build one fixture program holding every cell, so a single `tsc` answers every question ───────
const CELLS: string[] = [];
const cell = (name: string, body: string): string => {
  writeFileSync(join(SCRATCH, name), body);
  CELLS.push(name);
  return name;
};

const REAL_CFG = JSON.parse(stripComments(read(join(SCRIPTS, 'tsconfig.json')))) as {
  compilerOptions: Record<string, unknown>;
};
writeFileSync(
  join(SCRATCH, 'tsconfig.json'),
  JSON.stringify(
    { compilerOptions: { ...REAL_CFG.compilerOptions, allowJs: true }, include: ['**/*.mts', '**/*.mjs'] },
    null,
    2,
  ),
);

const relaxTouched = new Map<string, string[]>();
const valueExports = new Map<string, string[]>();
const constFns = new Map<string, string[]>();
const functionFns = new Map<string, string[]>();

for (const p of PAIRS) {
  for (const f of [p.impl, ...siblingImports(p.impl)]) {
    mkdirSync(join(SCRATCH, dirname(f)), { recursive: true });
    copyFileSync(join(SCRIPTS, f), join(SCRATCH, f));
  }
  mkdirSync(join(SCRATCH, 'decl'), { recursive: true });
  const declSrc = read(join(SCRIPTS, p.decl));
  const [relaxedSrc, touched] = relax(declSrc);
  relaxTouched.set(p.base, touched);
  writeFileSync(join(SCRATCH, 'decl', `${p.base}.d.mts`), declSrc);
  writeFileSync(join(SCRATCH, 'decl', `${p.base}-relaxed.d.mts`), relaxedSrc);

  valueExports.set(p.base, declaredValues(declSrc));
  constFns.set(p.base, declaredConstFns(declSrc));
  functionFns.set(p.base, declaredFunctionFns(declSrc));

  const imp = `import * as impl from './${p.impl}';\n`;
  for (const n of valueExports.get(p.base)!) {
    cell(`i2d-${p.base}-${n}.mts`, `${imp}import * as decl from './decl/${p.base}.mjs';\nconst x: typeof decl.${n} = impl.${n};\nvoid x;\n`);
    cell(`d2i-${p.base}-${n}.mts`, `${imp}import * as decl from './decl/${p.base}.mjs';\nconst x: typeof impl.${n} = decl.${n};\nvoid x;\n`);
    cell(`rlx-${p.base}-${n}.mts`, `${imp}import * as decl from './decl/${p.base}-relaxed.mjs';\nconst x: typeof decl.${n} = impl.${n};\nvoid x;\n`);
  }
  for (const n of [...constFns.get(p.base)!, ...functionFns.get(p.base)!]) {
    // The readability gate first: GREEN only when `Parameters<>` is NOT `never`.
    cell(`readable-${p.base}-${n}.mts`, `${imp}${IS_ANY}type P = Parameters<typeof impl.${n}>;\nconst x: IsAny<P> extends true ? never : P = null as unknown as P;\nvoid x;\n`);
    cell(`neverparams-${p.base}-${n}.mts`, `${imp}type B = { __r307: 1 };\nconst x: B = null as unknown as Parameters<typeof impl.${n}>;\nvoid x;\n`);
    for (let i = 0; i < 6; i++) {
      cell(`any-${p.base}-${n}-p${i}.mts`, `${imp}${IS_ANY}type Q = Parameters<typeof impl.${n}>[${i}];\nconst x: IsAny<Q> = true;\nvoid x;\n`);
    }
  }
}

// ── B0: the reader's own known positive — a cell that MUST read RED ──────────────────────────────
cell('kp-must-be-red.mts', 'const x: number = "a string, so this cell must read RED";\nvoid x;\n');
cell('kp-must-be-green.mts', 'const x: number = 1;\nvoid x;\n');

// ── B2/B3: the minted liar, and the discriminator's known negative ───────────────────────────────
mkdirSync(join(SCRATCH, 'liar'), { recursive: true });
writeFileSync(join(SCRATCH, 'liar/impl.mjs'), 'export const f = (a) => ({ n: "not-a-number", s: "ok" });\n');
const LIAR_DECL = "export type Tag = 'a' | 'b';\nexport declare const f: (a: string) => { n: number; s: Tag };\n";
const [liarRelaxed, liarTouched] = relax(LIAR_DECL);
writeFileSync(join(SCRATCH, 'liar/strict.d.mts'), LIAR_DECL);
writeFileSync(join(SCRATCH, 'liar/relaxed.d.mts'), liarRelaxed);
cell('liar-strict.mts', "import * as impl from './liar/impl.mjs';\nimport * as decl from './liar/strict.mjs';\nconst x: typeof decl.f = impl.f;\nvoid x;\n");
cell('liar-relaxed.mts', "import * as impl from './liar/impl.mjs';\nimport * as decl from './liar/relaxed.mjs';\nconst x: typeof decl.f = impl.f;\nvoid x;\n");

// ── C1: the `IsAny` trick, proved in both directions before it measures anything ─────────────────
cell('isany-on-any.mts', `${IS_ANY}declare const a: any;\nconst x: IsAny<typeof a> = true;\nvoid x;\n`);
cell('isany-on-string.mts', `${IS_ANY}declare const s: string;\nconst x: IsAny<typeof s> = true;\nvoid x;\n`);

// ── C4: the two-line repro for the destructured-parameter third state ────────────────────────────
mkdirSync(join(SCRATCH, 'shapes'), { recursive: true });
writeFileSync(
  join(SCRATCH, 'shapes/impl.mjs'),
  'export const plain = (a, b) => (a ? 1 : 0);\nexport const destructured = ({ a, b }) => (a ? 1 : 0);\n',
);
cell('shape-plain-readable.mts', "import * as s from './shapes/impl.mjs';\ntype B = { __r307: 1 };\nconst x: B = null as unknown as Parameters<typeof s.plain>;\nvoid x;\n");
cell('shape-destructured-readable.mts', "import * as s from './shapes/impl.mjs';\ntype B = { __r307: 1 };\nconst x: B = null as unknown as Parameters<typeof s.destructured>;\nvoid x;\n");

// ── C5: the known positive for finding 3 — an arity mismatch in the `function` spelling ──────────
const TSX_DECL = read(join(SCRIPTS, 'lib/tsx-required.d.mts'));
const WIDENED = TSX_DECL.replace(
  'export declare function isTsResolutionFailure(err: unknown): boolean;',
  'export declare function isTsResolutionFailure(err: unknown, extra: number): boolean;',
);

// ── D: the vacuity fixture — an absurd declared parameter type over an `any` implementation ──────
mkdirSync(join(SCRATCH, 'vacuous'), { recursive: true });
writeFileSync(join(SCRATCH, 'vacuous/impl.mjs'), 'export const g = (a, b) => `${a}${b}`;\n');
writeFileSync(
  join(SCRATCH, 'vacuous/decl.d.mts'),
  'export declare const g: (a: { absurd: RegExp[] }, b: 17n) => string;\n',
);
cell('vacuous-absurd-params.mts', "import * as impl from './vacuous/impl.mjs';\nimport * as decl from './vacuous/decl.mjs';\nconst x: typeof decl.g = impl.g;\nvoid x;\n");
writeFileSync(join(SCRATCH, 'vacuous/decl-return.d.mts'), 'export declare const g: (a: unknown, b: unknown) => number;\n');
cell('vacuous-wrong-return.mts', "import * as impl from './vacuous/impl.mjs';\nimport * as decl from './vacuous/decl-return.mjs';\nconst x: typeof decl.g = impl.g;\nvoid x;\n");

// ── One compile, every answer ────────────────────────────────────────────────────────────────────
const tscRun = (cfgDir: string): { status: number | null; out: string } => {
  const r = spawnSync('npx', ['tsc', '-p', join(cfgDir, 'tsconfig.json')], {
    cwd: REPO,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return { status: r.status, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
};
const run = tscRun(SCRATCH);
/**
 * The cell→red reader. It must capture the `.mts` too: `tsc` prints `<cell>.mts(3,7): error …`, and
 * the first version of this read `<cell>(`, matched nothing, and called every errored cell GREEN.
 */
const RED = new Set<string>();
for (const line of run.out.split('\n')) {
  const m = line.match(/r307-probe[/\\]([A-Za-z0-9._-]+\.mts)\(/);
  if (m) RED.add(m[1]!);
}
const red = (name: string): boolean => RED.has(name);

// ── Section A: the population ───────────────────────────────────────────────────────────────────
console.log('── A. the declaration surface, resolved from disk ──');

const ALL_VALUES = PAIRS.flatMap((p) => valueExports.get(p.base)!.map((n) => `${p.base}::${n}`));
const ALL_CONST = PAIRS.flatMap((p) => constFns.get(p.base)!.map((n) => `${p.base}::${n}`));
const ALL_FUNCTION = PAIRS.flatMap((p) => functionFns.get(p.base)!.map((n) => `${p.base}::${n}`));

measure(
  'A0',
  `pairs ${PAIRS.length}: ${PAIRS.map((p) => p.impl).join(' · ')} — declared value exports ${ALL_VALUES.length} · ` +
    `declared function signatures ${ALL_CONST.length + ALL_FUNCTION.length} ` +
    `(spelling \`const X: (\` ${ALL_CONST.length} · spelling \`function X(\` ${ALL_FUNCTION.length})`,
);

check(
  'A1',
  'the pair set is resolved from disk and is not empty — so every figure below ranges over something',
  PAIRS.length >= 3 && ALL_VALUES.length >= 20 && ALL_CONST.length + ALL_FUNCTION.length >= 15,
  `${PAIRS.length} pairs · ${ALL_VALUES.length} value exports · ${ALL_CONST.length + ALL_FUNCTION.length} signatures. ` +
    'A [MEAS] not a pin: these grow when a module gains an export, and a pin here would redden as good news (round224 arm E).',
);

check(
  'A2',
  'the two declaration spellings are BOTH non-empty, which is what makes finding 3 a gap rather than a hypothetical',
  ALL_CONST.length > 0 && ALL_FUNCTION.length > 0,
  `\`const X: (\` ${ALL_CONST.length} — ${ALL_CONST.slice(0, 3).join(', ')}… · ` +
    `\`function X(\` ${ALL_FUNCTION.length} — ${ALL_FUNCTION.join(', ')}. ` +
    'probe-round303 B3 reaches the first spelling only.',
);

// ── Section B: the return-type grade ────────────────────────────────────────────────────────────
console.log('\n── B. the return-type grade, with the reader proved before it is believed ──');

check(
  'B0',
  'the cell→red reader is proved in BOTH directions before any verdict below is read: a cell that must be red reads RED, and one that must be green reads GREEN',
  red('kp-must-be-red.mts') && !red('kp-must-be-green.mts'),
  `kp-must-be-red ${red('kp-must-be-red.mts') ? 'RED' : 'GREEN'} · kp-must-be-green ${red('kp-must-be-green.mts') ? 'RED' : 'GREEN'}. ` +
    'The first version of this reader matched `<cell>(` where tsc prints `<cell>.mts(3,7)`, so it reported GREEN for three cells that had errored. This arm exists because that happened.',
);

type Verdict = 'CONFORMS' | 'DECL-WIDER' | 'LITERAL-WIDENING' | 'DRIFT';
const verdicts = new Map<string, Verdict>();
for (const p of PAIRS) {
  for (const n of valueExports.get(p.base)!) {
    const i2d = red(`i2d-${p.base}-${n}.mts`);
    const d2i = red(`d2i-${p.base}-${n}.mts`);
    const rlx = red(`rlx-${p.base}-${n}.mts`);
    const v: Verdict = !i2d ? (d2i ? 'DECL-WIDER' : 'CONFORMS') : rlx ? 'DRIFT' : 'LITERAL-WIDENING';
    verdicts.set(`${p.base}::${n}`, v);
  }
}
const of = (v: Verdict): string[] => [...verdicts].filter(([, x]) => x === v).map(([k]) => k).sort();

measure(
  'B1',
  `impl→decl over ${verdicts.size} declared value exports: CONFORMS ${of('CONFORMS').length} · ` +
    `DECL-WIDER ${of('DECL-WIDER').length} · LITERAL-WIDENING ${of('LITERAL-WIDENING').length} · DRIFT ${of('DRIFT').length}` +
    (of('LITERAL-WIDENING').length ? ` — widening: ${of('LITERAL-WIDENING').join(', ')}` : '') +
    (of('DECL-WIDER').length ? ` — wider: ${of('DECL-WIDER').join(', ')}` : ''),
);

check(
  'B2',
  'THE GATE: no declared export DRIFTS from its implementation — and the arm names any export it finds, so its red sends a reader to a file rather than to a number',
  of('DRIFT').length === 0,
  of('DRIFT').length === 0
    ? `0 of ${verdicts.size} drift. A gate, not a pin: it reddens when a human should look, and it cannot go red as good news.`
    : `DRIFT: ${of('DRIFT').join(' | ')}`,
);

check(
  'B3',
  'and B2 is not the green of an instrument that compares nothing: a minted declaration that lies about a `number` return is REJECTED by the same cell shape',
  red('liar-strict.mts'),
  `liar-strict ${red('liar-strict.mts') ? 'RED (correct)' : 'GREEN — the guard does not work'}: impl returns { n: string }, declaration says { n: number }.`,
);

const touchedAll = [...relaxTouched].flatMap(([b, t]) => t.map((x) => `${b}::${x}`));
check(
  'B4',
  'the literal-widening discriminator does its job in BOTH directions: it explains `classify` (red strictly, green relaxed) and it does NOT launder the liar (red either way)',
  verdicts.get('sweep-probes::classify') === 'LITERAL-WIDENING' &&
    red('liar-strict.mts') &&
    red('liar-relaxed.mts'),
  `classify: strict ${red('i2d-sweep-probes-classify.mts') ? 'RED' : 'GREEN'} → relaxed ${red('rlx-sweep-probes-classify.mts') ? 'RED' : 'GREEN'} · ` +
    `liar: strict ${red('liar-strict.mts') ? 'RED' : 'GREEN'} → relaxed ${red('liar-relaxed.mts') ? 'RED' : 'GREEN'}. ` +
    'The second half is the load-bearing one — a relaxation that turned the liar green would have switched this guard off while leaving it green.',
);

check(
  'B5',
  'and the relaxation is not a no-op: it rewrote a named alias, so B4’s relaxed green is a result rather than the same file compiled twice',
  touchedAll.length > 0 && liarTouched.length > 0,
  `relaxed aliases in the real declarations: ${touchedAll.join(', ') || 'NONE — B4 is meaningless'} · in the liar: ${liarTouched.join(', ')}`,
);

check(
  'B6',
  'the reverse direction is measured and REJECTED as a guard rather than assumed symmetric: it reds on exports that are correct, which is why only impl→decl is a gate',
  of('DECL-WIDER').length > 0,
  `DECL-WIDER ${of('DECL-WIDER').length}: ${of('DECL-WIDER').join(', ')}. ` +
    'sweep-probes.d.mts’s own docblock calls this narrowing deliberate; `readonly string[]` against an inferred `string[]` is the commonest case. A two-sided guard would redden on correct declarations.',
);

// ── Section C: the parameter half ───────────────────────────────────────────────────────────────
console.log('\n── C. the parameter half: what `any` costs, and the state the instrument could not see ──');

check(
  'C1',
  'the `IsAny` test is proved in both directions before it measures anything: it answers true for `any` and false for `string`',
  !red('isany-on-any.mts') && red('isany-on-string.mts'),
  `on any ${red('isany-on-any.mts') ? 'RED' : 'GREEN'} (want GREEN) · on string ${red('isany-on-string.mts') ? 'RED' : 'GREEN'} (want RED). ` +
    '`0 extends (1 & T)` is a trick; a silent mis-write of it would make every parameter look gradeable.',
);

const ALL_FNS = PAIRS.flatMap((p) => [...constFns.get(p.base)!, ...functionFns.get(p.base)!].map((n) => ({ base: p.base, n })));
const unreadable = ALL_FNS.filter((f) => !red(`neverparams-${f.base}-${f.n}.mts`)).map((f) => `${f.base}::${f.n}`);

/**
 * Restaged in Round 369 (Daedalus), from `['sweep-probes::sweepExit']` to a two-member set, when
 * `verdictLine` was extracted from `main()` in `sweep-probes.mjs` and reddened this arm — which is
 * the arm working, not the arm being wrong.
 *
 * The new member is the SAME class as the existing one, which is the distinction worth preserving:
 * `verdictLine`'s parameter is an unannotated destructuring pattern, exactly like `sweepExit`'s
 * directly above it in that file, so arm C4's two-line reduction already explains it. Nothing new
 * became unreadable for a new reason. The declared set is kept as a sorted SET rather than widened
 * to a count so that a THIRD member — or a member arriving by some other cause — still reddens.
 *
 * Restaged again in Round 372 (Theseus), to a three-member set, when `probeRowAnnotations` was
 * extracted from the same `main()` for the same reason one round later — the per-probe rows, so
 * that their key could be graded rather than re-implemented at the call site. Third member, same
 * class as the other two: an unannotated destructuring pattern in a `.mjs`, which C4's reduction
 * already covers. The sentence above — "a THIRD member still reddens" — is exactly what happened,
 * so it is left standing rather than re-worded; the set grew by the mechanism it declared, and the
 * next arrival reddens this arm again.
 */
const UNREADABLE_DECLARED = [
  'sweep-probes::probeRowAnnotations',
  'sweep-probes::sweepExit',
  'sweep-probes::verdictLine',
];

check(
  'C2',
  'THE GATE on my own instrument: `Parameters<typeof fn>` is read for every declared signature, and any function where it resolves to `never` is NAMED rather than silently counted as having typed parameters',
  unreadable.length === UNREADABLE_DECLARED.length &&
    [...unreadable].sort().every((n, i) => n === UNREADABLE_DECLARED[i]),
  `unreadable (Parameters<> = never): ${unreadable.length} — ${unreadable.join(', ') || 'none'}. ` +
    `Expected exactly [${UNREADABLE_DECLARED.join(', ')}], each an unannotated destructuring pattern (arm C4 reduces this to two lines). ` +
    'This arm is two-sided on purpose: a NEW unreadable function reddens it, and so does one of these becoming readable — because either event changes what the figures in B and C range over.',
);

const anyPositions = new Map<string, number[]>();
for (const f of ALL_FNS) {
  const hits: number[] = [];
  for (let i = 0; i < 6; i++) if (!red(`any-${f.base}-${f.n}-p${i}.mts`)) hits.push(i);
  anyPositions.set(`${f.base}::${f.n}`, hits);
}
const readable = ALL_FNS.map((f) => `${f.base}::${f.n}`).filter((k) => !unreadable.includes(k));
const gradeable = readable.filter((k) => (anyPositions.get(k) ?? []).length === 0);
const totalAny = [...anyPositions].reduce((a, [, v]) => a + v.length, 0);

measure(
  'C3',
  `declared signatures ${ALL_FNS.length} · readable ${readable.length} · parameter positions inferred as \`any\` ${totalAny} · ` +
    `signatures with NO \`any\` parameter — i.e. the only ones whose declared parameter types are graded by anything: ${gradeable.length} (${gradeable.join(', ') || 'none'})`,
);

/** The JSDoc tags in each implementation, block spelling only — kept as a [MEAS] because it is the
 *  figure the 10/27 memos quote, and because it is no longer the key. */
const jsdocTags = new Map<string, number>();
for (const p of PAIRS) {
  const src = read(join(SCRIPTS, p.impl));
  jsdocTags.set(p.base, (src.match(/@param\b|@returns\b/g) ?? []).length);
}

/**
 * ── C4, re-keyed in Round 467 (Daedalus) ──────────────────────────────────────
 *
 * Until 10/27 this arm pinned a MODULE-LEVEL correlation: the one gradeable signature sat in the one
 * module carrying `@param`/`@returns` blocks, and the zero-tag modules contributed zero gradeable
 * signatures. My own `scripts/lib/**\/*.mjs` typecheck gate (`87270c6f`) falsified it by annotating
 * nine lib modules with INLINE `/** @type {T} *\/` in the parameter list instead of block tags:
 * `gradeable.length` went 1 → 14, the `@param\b|@returns\b` count over `characterisation-markers`
 * and `strip-source` stayed at **0**, and this arm reddened. Argus routed it (10/27 memo) rather
 * than patching it; Theseus reproduced the red byte-for-byte and killed the other candidate repair —
 * scoping the pin to the three original modules by name cannot work, because **3 of the 13** newly
 * gradeable signatures are in `tsx-required`, which already carried 8 block tags and gained none, so
 * the correlation is falsified INSIDE a tag-carrying module.
 *
 * What survives is the mechanism the old arm was reaching for, which never depended on the style: a
 * parameter is gradeable exactly when the implementation annotates it. So the key is now
 * **per-signature and style-blind**, and the arm is SET equality in both directions rather than a
 * count — a signature that becomes gradeable without an annotation reddens it, and so does an
 * annotated signature that stays `any`. A count would have been green today by cancellation
 * (annotated 14, gradeable 14).
 *
 * **The live population cannot grade the per-signature half of that key, and that is why C4a is
 * minted rather than measured.** All four modules are uniformly annotated or uniformly bare —
 * `characterisation-markers` (inline, 8/8), `strip-source` (inline, 2/2), `tsx-required` (block,
 * 4/4), `sweep-probes` (nothing at all, 0 of 13 readable). So a key that read the WHOLE MODULE
 * source and credited every signature in it would publish the identical set equality here. The
 * per-signature slice is therefore proved on a minted source with a deliberately mixed module (C4a)
 * before any live figure is read, in the same shape as this file's B0 and C1 — and the one cripple
 * worth driving is the one that widens the span to the whole file, which C4a catches and C4 cannot.
 */
const escRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const IMPL_SRC = new Map(PAIRS.map((p) => [p.base, read(join(SCRIPTS, p.impl))] as const));

/**
 * The declaration anchor for one exported signature, in both spellings this tree uses. `null` means
 * the anchor was not found, which travels as a REFUSAL the arm reddens on — never as "unannotated".
 */
const anchorOf = (src: string, name: string): { index: number; openParen: number } | null => {
  for (const re of [
    new RegExp(`^export\\s+function\\s+${escRe(name)}\\s*\\(`, 'm'),
    new RegExp(`^export\\s+const\\s+${escRe(name)}\\s*=\\s*(?:async\\s*)?\\(`, 'm'),
  ]) {
    const m = re.exec(src);
    if (m) return { index: m.index, openParen: m.index + m[0].length - 1 };
  }
  return null;
};

/**
 * The signature's parameter list, sliced by a balanced-paren scan from its own `(` rather than by a
 * regex — a character class stops at the first delimiter, and these spans carry `(`, `)`, `{`, `}`
 * and `/** *\/` comments. `null` on an unfound anchor or an unbalanced scan: refuse, do not guess.
 */
const paramSpanOf = (src: string, name: string): string | null => {
  const a = anchorOf(src, name);
  if (!a) return null;
  let depth = 0;
  for (let i = a.openParen; i < src.length; i++) {
    const ch = src[i]!;
    if (ch === '(') depth += 1;
    else if (ch === ')') {
      depth -= 1;
      if (depth === 0) return src.slice(a.openParen + 1, i);
    }
  }
  return null;
};

/** The JSDoc block IMMEDIATELY above the declaration — contiguous, so a `@param` four declarations
 *  up cannot credit this one. `''` when there is no such block. */
const blockAboveOf = (src: string, name: string): string => {
  const a = anchorOf(src, name);
  if (!a) return '';
  return (/\/\*\*[\s\S]*?\*\/\s*$/.exec(src.slice(0, a.index)) ?? [''])[0];
};

type Annot = 'inline' | 'block' | 'both' | 'none';
/** `null` is the refusal, kept distinct from `'none'`: one means the key could not look, the other
 *  means it looked and found nothing. Collapsing them would make every unanchorable signature read
 *  as evidence for the claim. */
const annotationOf = (src: string, name: string): Annot | null => {
  const span = paramSpanOf(src, name);
  if (span === null) return null;
  const inline = /@type\b/.test(span);
  const block = /@param\b/.test(blockAboveOf(src, name));
  return inline && block ? 'both' : inline ? 'inline' : block ? 'block' : 'none';
};

// ── C4a: the key's own known positive, on a minted source, before any live figure is read ────────
const MINTED = [
  '/** @param {string} tagged */',
  'export function blockTagged(tagged) { return tagged; }',
  '',
  'export function inlineTagged(/** @type {string} */ typed) { return typed; }',
  '',
  'export function bare(loose) { return loose; }',
  '',
  'export const bareArrow = (also) => also;',
].join('\n');
const mintedSpanLeak = paramSpanOf(MINTED, 'bare');
check(
  'C4a',
  'THE KNOWN POSITIVE for the re-keyed C4: on a minted source holding all three states in ONE module, the annotation key answers `block`, `inline` and `none` per SIGNATURE — and it REFUSES on a name it cannot anchor rather than answering "unannotated"',
  annotationOf(MINTED, 'blockTagged') === 'block' &&
    annotationOf(MINTED, 'inlineTagged') === 'inline' &&
    annotationOf(MINTED, 'bare') === 'none' &&
    annotationOf(MINTED, 'bareArrow') === 'none' &&
    annotationOf(MINTED, 'noSuchFunction') === null &&
    mintedSpanLeak !== null &&
    !/@type\b|@param\b/.test(mintedSpanLeak),
  `blockTagged ${annotationOf(MINTED, 'blockTagged')} (want block) · inlineTagged ${annotationOf(MINTED, 'inlineTagged')} (want inline) · ` +
    `bare ${annotationOf(MINTED, 'bare')} · bareArrow ${annotationOf(MINTED, 'bareArrow')} (want none) · ` +
    `absent name ${String(annotationOf(MINTED, 'noSuchFunction'))} (want null, the refusal) · ` +
    `\`bare\`'s own span is ${JSON.stringify(mintedSpanLeak)} — it must not reach the annotations two declarations above it. ` +
    'This arm is minted and not measured on purpose: every real module in this tree is uniformly annotated or uniformly bare, so a key that credited a whole module would publish the same live set equality C4 does.',
);

const annot = new Map<string, Annot | null>(
  readable.map((k) => {
    const [b, n] = k.split('::') as [string, string];
    return [k, annotationOf(IMPL_SRC.get(b) ?? '', n)];
  }),
);
const unresolved = readable.filter((k) => annot.get(k) === null);
const spans = new Map(
  readable.map((k) => {
    const [b, n] = k.split('::') as [string, string];
    return [k, paramSpanOf(IMPL_SRC.get(b) ?? '', n)];
  }),
);
/** A zero-arity signature is gradeable by vacuity, not by annotation; it would break the
 *  correspondence for a reason that is not a defect, so it is NAMED rather than absorbed. */
const emptyParams = readable.filter((k) => (spans.get(k) ?? 'x').trim() === '');
/** The balanced scan running past its own declaration would silently widen every span. */
const overrunSpans = readable.filter((k) => /^\s*export\s/m.test(spans.get(k) ?? ''));
const annotatedSet = readable.filter((k) => {
  const a = annot.get(k);
  return a !== null && a !== 'none';
});
const sortedAnnotated = [...annotatedSet].sort();
const sortedGradeable = [...gradeable].sort();
const sameSet =
  sortedAnnotated.length === sortedGradeable.length && sortedAnnotated.every((k, i) => k === sortedGradeable[i]);
const onlyAnnotated = sortedAnnotated.filter((k) => !sortedGradeable.includes(k));
const onlyGradeable = sortedGradeable.filter((k) => !sortedAnnotated.includes(k));

check(
  'C4',
  'the parameter half is gradeable exactly where the IMPLEMENTATION annotates THAT signature, in either JSDoc style: the gradeable set and the annotated set are EQUAL as sets, both directions, over every readable signature — and a signature whose anchor or parameter span cannot be read is named rather than counted as unannotated',
  unresolved.length === 0 && emptyParams.length === 0 && overrunSpans.length === 0 && sameSet,
  `annotated ${sortedAnnotated.length} · gradeable ${sortedGradeable.length} · sets ${sameSet ? 'EQUAL' : 'DIFFER'}` +
    `${sameSet ? '' : ` — annotated-but-not-gradeable: ${onlyAnnotated.join(', ') || 'none'}; gradeable-but-not-annotated: ${onlyGradeable.join(', ') || 'none'}`}. ` +
    `Refused (no anchor / unbalanced span): ${unresolved.length} — ${unresolved.join(', ') || 'none'}. ` +
    `Zero-arity (gradeable by vacuity): ${emptyParams.length} — ${emptyParams.join(', ') || 'none'}. ` +
    `Span overran its declaration: ${overrunSpans.length} — ${overrunSpans.join(', ') || 'none'}. ` +
    `So ${readable.length - sortedGradeable.length} of ${readable.length} readable signatures have a declared parameter list that nothing checks, ` +
    'and the price of changing that is known rather than guessed, because it has now been paid nine times: an annotation on the implementation, in either style.',
);

check(
  'C4b',
  'and the style-blindness of C4’s key is EXERCISED by the live population rather than merely written: both JSDoc styles occur among the gradeable signatures, so neither branch of the key is dead code',
  annotatedSet.some((k) => annot.get(k) === 'inline' || annot.get(k) === 'both') &&
    annotatedSet.some((k) => annot.get(k) === 'block' || annot.get(k) === 'both'),
  `styles among the ${annotatedSet.length} annotated: ` +
    `inline ${annotatedSet.filter((k) => annot.get(k) === 'inline').length} · block ${annotatedSet.filter((k) => annot.get(k) === 'block').length} · ` +
    `both ${annotatedSet.filter((k) => annot.get(k) === 'both').length}. ` +
    'Two-sided with a stated reason: if one style stopped occurring, C4 would stay green while half its key went untested by anything but C4a’s minted source — which is a human’s call to make, not a silence.',
);

measure(
  'C4m',
  `annotation style per implementation — ` +
    `${PAIRS.map((p) => {
      const mine = readable.filter((k) => k.startsWith(`${p.base}::`));
      const styled = (s: Annot): number => mine.filter((k) => annot.get(k) === s).length;
      return `${p.base} ${mine.length} readable [inline ${styled('inline')} · block ${styled('block')} · both ${styled('both')} · none ${styled('none')}] block-tags ${jsdocTags.get(p.base) ?? 0}`;
    }).join(' · ')}. ` +
    'The block-tag counts are the figures Argus’s and Theseus’s 10/27 memos quote; they are kept printed and are no longer the key. ' +
    '`sweep-probes.mjs` is the one module here outside `scripts/lib/`, so the 10/27 gate never reached it — it carries 0 annotations and contributes 0 gradeable signatures, which is the whole of the remaining vacuity.',
);

check(
  'C5',
  'the destructured-parameter third state, reduced to two lines: an unannotated plain parameter list is readable, an unannotated DESTRUCTURING pattern makes `Parameters<>` resolve to `never`',
  red('shape-plain-readable.mts') && !red('shape-destructured-readable.mts'),
  `(a, b) => … ⇒ Parameters<> readable (${red('shape-plain-readable.mts') ? 'RED against the brand, as expected' : 'GREEN — it resolved to never, so the repro is wrong'}) · ` +
    `({ a, b }) => … ⇒ Parameters<> = ${!red('shape-destructured-readable.mts') ? 'never (assignable to the brand)' : 'readable — the repro no longer reproduces'}. ` +
    'A source-scanning regex fails by returning a smaller number; this fails by returning coverage it does not have, which arrives looking like good news.',
);

// ── C6: finding 3's known positive, driven as its own compile ────────────────────────────────────
const C5DIR = join(SCRATCH, 'arity-hole');
mkdirSync(C5DIR, { recursive: true });
writeFileSync(join(C5DIR, 'tsconfig.json'), read(join(SCRATCH, 'tsconfig.json')));
/** `probe-round303` B3's counter, reproduced locally — the `const X: (` key is quoted, not described. */
const R303_ARITY_KEY = /export declare const ([A-Za-z0-9_$]+)\s*:\s*\(/g;
const r303Reach = (declSrc: string): string[] => [...declSrc.matchAll(R303_ARITY_KEY)].map((m) => m[1]!);
const mineReach = (declSrc: string): string[] => [...declaredConstFns(declSrc), ...declaredFunctionFns(declSrc)];

check(
  'C6',
  'THE KNOWN POSITIVE for finding 3: an arity mismatch injected into the `function` spelling is invisible to probe-round303 B3’s key and visible to this file’s — proved by reaching for the mutated name in each, not by describing the regexes',
  !r303Reach(WIDENED).includes('isTsResolutionFailure') &&
    mineReach(WIDENED).includes('isTsResolutionFailure') &&
    r303Reach(WIDENED).length === 0 &&
    mineReach(WIDENED).length === 4,
  `mutated declaration: isTsResolutionFailure gains a second parameter. ` +
    `probe-round303 B3’s key reaches ${r303Reach(WIDENED).length} signature(s) in tsx-required.d.mts — ${r303Reach(WIDENED).join(', ') || 'none'}; ` +
    `this file’s reaches ${mineReach(WIDENED).length} — ${mineReach(WIDENED).join(', ')}. ` +
    'That arm is not defective; it is narrower than the sentence three memos have repeated about it. Its own B1 has printed "26 declared names, 14 function signatures" since the day it was written.',
);

// ── Section D: the vacuity, proven ──────────────────────────────────────────────────────────────
console.log('\n── D. what the green does NOT cover, proven rather than argued ──');

check(
  'D1',
  'a declaration whose PARAMETER types are absurd passes the guard, because the implementation’s parameters are `any` — this is the vacuity C4 measures, shown rather than asserted',
  !red('vacuous-absurd-params.mts'),
  `declared \`(a: { absurd: RegExp[] }, b: 17n) => string\` against \`(a, b) => \\\`\${a}\${b}\\\`\`: ` +
    `${red('vacuous-absurd-params.mts') ? 'RED — then the parameter half IS graded and C4 is wrong' : 'GREEN — the parameter half is not graded'}.`,
);

check(
  'D2',
  'and the same fixture’s RETURN type is NOT vacuous: declare the return wrong and the identical cell shape reds — so the guard is blind in exactly one half and awake in the other',
  red('vacuous-wrong-return.mts'),
  `same implementation, declared \`=> number\` instead of \`=> string\`: ${red('vacuous-wrong-return.mts') ? 'RED (correct)' : 'GREEN — then the guard grades nothing at all'}. ` +
    'D1 and D2 differ only in which half of the signature was falsified, which is the cleanest statement of what this round delivers.',
);

// ── Section Z ───────────────────────────────────────────────────────────────────────────────────
console.log('\n── Z. discipline ──');

measure('Z0', `one tsc over ${CELLS.length} fixture cells · tsc exit ${run.status} · ${RED.size} cells red`);

rmSync(SCRATCH, { recursive: true, force: true });

check(
  'Z1',
  'the population under scripts/ is byte-identical across this run — the three implementations and three declarations were COPIED into the fixture tree and read there, never written',
  fingerprint(REPO, 'scripts') === TREE_AT_START,
  'fingerprint of scripts/ taken before arm A0 and after the last fixture, compared as a delta rather than as a cleanliness claim about the fire’s tree (Theseus’s Round 303 Z1 shape).',
);

check(
  'Z2',
  'every fixture this probe minted lived under .testdata/, which is gitignored, and the tree is removed before this arm runs',
  !existsSync(SCRATCH) && /(^|\n)\.testdata\//.test(read(join(REPO, '.gitignore'))),
  `${SCRATCH.slice(REPO.length + 1)} absent at exit · .gitignore names .testdata/`,
);

measure(
  'Z3',
  'subprocesses: one `npx tsc` over a fixture config under .testdata/, which emits nothing. ' +
    'No port bound, no database opened, no corpus read, no model called, and nothing under packages/ executed.',
);

// The measurement count stays on its own line: `summariseAndExit` deliberately summarises only the
// hard checks, and the `[MEAS]` arms are not among them. Printing it here keeps the figure the
// hand-rolled tail carried without re-aggregating anything the module owns.
console.log(`\n${meas} measurements recorded (not regression checks).`);
summariseAndExit({ probeName: 'probe-round307', results });
