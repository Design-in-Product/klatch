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
 * Measured across all three pairs: 14 exports, 14 declared, **0** declared-but-absent, **0**
 * exported-but-undeclared, **0** arity mismatches over 14 signatures. The declarations are accurate
 * today. They are accurate and unguarded, which is a gate's subject, not a defect's.
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

check(
  'A1b',
  'and A1 is not the vacuous reading of an empty program: the .mts files this config exists to cover ARE in it',
  [...PROGRAM].filter((f) => f.endsWith('.mts')).length > 100 && PROGRAM.has('scripts/sweep-probes.d.mts'),
  `${[...PROGRAM].filter((f) => f.endsWith('.mts')).length} .mts files in the program, so "OUT" in A1 is a fact about ` +
    '.mjs and not about a config that matched nothing.',
);

check(
  'A2',
  'the program contains zero .mjs files at all, so the exclusion is by extension and not a per-file omission someone could have fixed by naming a file',
  [...PROGRAM].filter((f) => f.endsWith('.mjs')).length === 0,
  `include is ${JSON.stringify(JSON.parse(read('tsconfig.json').replace(/^\s*\/\/.*$/gm, '')).include)} — ` +
    'extension-scoped, so no .mjs can enter except as a resolution target, and a resolution target is ' +
    'served by the .d.mts rather than read.',
);

check(
  'A3',
  'the 2 .ts files under scripts/ are outside the program too, which is the deferral the config states in its own Scope note',
  FILES.filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts')).length === 2 &&
    FILES.filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts')).every((f) => !PROGRAM.has(`scripts/${f}`)),
  FILES.filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts')).join(' · ') +
    ' — both absent from the program; the 23 package .ts files present are pulled in transitively as import targets.',
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
const declaredNames = (src: string): Set<string> => {
  const out = new Set<string>();
  for (const m of src.matchAll(/^export\s+declare\s+(?:const|function)\s+([A-Za-z0-9_$]+)/gm)) out.add(m[1]!);
  return out;
};

const nameProblems: string[] = [];
const arityProblems: string[] = [];
let signaturesChecked = 0;
let namesChecked = 0;
for (const mjs of DECLARED_PAIRS) {
  const impl = read(mjs);
  const decl = read(mjs.replace(/\.mjs$/, '.d.mts'));
  const e = exportedNames(impl);
  const d = declaredNames(decl);
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

measure('D1', `widening include to **/*.ts: ${wErrs.length} error line(s) — ${[...new Set(wErrs.map((l) => (l.match(/error (TS\d+)/) ?? [, '?'])[1]))].join(',')}`);
for (const e of wErrs.slice(0, 4)) measure('D1b', e.replace(REPO, '.').trim());

check(
  'D2',
  'the widening price is an artefact of the extension rule and not a defect in the files: the root manifest declares no "type", so under NodeNext a .ts file is CommonJS and import.meta is an error there, while .mts is ESM by extension',
  JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8')).type === undefined &&
    !existsSync(join(SCRIPTS, 'package.json')) &&
    wErrs.every((l) => /TS1470/.test(l)),
  `root package.json "type": absent · scripts/package.json: absent · every widening error is TS1470 ` +
    `(${wErrs.length} of ${wErrs.length}), which is the import.meta-under-CommonJS diagnostic.`,
);

// NOT driven: neither .ts file is executed. `aaxt-mcp-live-probe.ts` and `record-demo.ts` are a live
// MCP probe and a demo recorder; running them to see whether they "work under tsx" would bind ports
// and could call a model, which is not a price this arm is worth. So D3 asserts only what a static
// read can carry, and the header does not claim the files run clean.
const tsFiles = FILES.filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts'));
check(
  'D3',
  'and TS1470 is reporting something real rather than a phantom: both .ts files do use import.meta, and the diagnostic is about the module format the glob would put them in, not about a construct they lack',
  tsFiles.length === 2 &&
    tsFiles.every((f) => /import\.meta/.test(read(f))) &&
    wErrs.length === tsFiles.length,
  tsFiles.map((f) => `${f}: import.meta present`).join(' · ') +
    ` — one error per file, ${wErrs.length} of ${tsFiles.length}, so no file is doubly counted and none is silent.`,
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
