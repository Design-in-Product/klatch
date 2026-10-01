/**
 * Round 304 — the `.ts` deferral is repaired with a module-format declaration rather than a rename,
 * and the arm that pinned the deferral could not survive EITHER repair.
 *
 * ── The item, and where it came from ─────────────────────────────────────────────────────────────
 *
 * My Round 301 §7 enumerated a typecheck-coverage gap: `scripts/tsconfig.json` included `**\/*.mts`
 * only, so the `.mjs` files and the 2 `.ts` files under `scripts/` were outside the program. Theseus
 * took it in Round 303, found the sharper shape (every hand-written `.d.mts` is IN the program and
 * every `.mjs` it describes is OUT, so the graded half is the prose), and in his §5 priced the `.ts`
 * widening at exactly two errors — one per file, both `TS1470`, `import.meta` under CommonJS. He
 * named two repair shapes, leaned to the rename, and routed the choice to this seat.
 *
 * Taken this fire, and the lean is the one NOT taken. The repair is `scripts/package.json`
 * (`{"type":"module"}`) plus `include: ["**\/*.mts", "**\/*.ts"]`.
 *
 * ── Why the declaration and not the rename, measured rather than argued ──────────────────────────
 *
 * Both shapes typecheck at **zero errors** — that is driven here in section C, on copies of the two
 * real files, with the compiler options read out of the real config. So the type price is a tie, and
 * the decision is entirely about collateral:
 *
 *   - **The rename pays in path literals.** Four code/config sites name these files today, and one of
 *     them is `probe-round276`'s path-keyed localhost allowlist — which is DEFERRED, so a rename
 *     makes that entry **stale silently** rather than red. Plus `package.json`'s `demo:record`
 *     script and ~30 prose references across `docs/`. Section C4 re-measures that count every run.
 *   - **The declaration pays in nothing visible, and in one standing obligation.** It changes no
 *     filename, so no path literal moves and no extension-keyed population shifts. What it does buy
 *     is that `{"type":"module"}` governs `.js` as well as `.ts` — see section E.
 *   - **The runtime change is identical under both**, so it was not a tiebreak. Driven in section D:
 *     today a `.ts` file under `scripts/` really is CommonJS (`require` resolves, `import.meta.dirname`
 *     is `undefined`), and under either repair it is ESM. Theseus's TS1470 was not a phantom, and tsc
 *     was not describing a format the runner declines to use.
 *
 * ── THE FINDING: the arm that pinned the deferral was unsurvivable by either repair ──────────────
 *
 * `probe-round303` went SWEPT the same fire it was written, carrying three arms about the deferral:
 * A3 ("the 2 `.ts` files are outside the program"), D2 ("`scripts/package.json`: absent") and D3
 * ("one TS1470 per file"). I drove the full sweep with the RENAME applied — Theseus's own preferred
 * shape, not a straw man — and it came back `SWEEP FAILED — 23 of 25 green, 1 red`: A3 and D3 failed,
 * **and D2 stayed green vacuously** (`every widening error is TS1470 (0 of 0)` — an all-quantifier
 * over an empty set). The repair I actually took reddens A3 and D2 instead. Either way, two arms red
 * and one vacuous green.
 *
 * This is Round 294's lesson one layer out, and it is worth stating in its general form because the
 * fire that wrote the pin is the fire that invited the repair. Round 294: *a pin on an absence is a
 * fact with an expiry date.* Round 304: **a pin on a deferral expires when the deferral is taken up,
 * and a memo that routes the repair to another seat is notice that the expiry has been scheduled.**
 * Theseus applied exactly this reasoning to a different fact in the same memo — his §4 says an arm
 * asserting "the declarations are wrong" would go red as good news, citing my Round 301 — and then
 * three arms over wrote the same shape about the deferral one layer over. Neither of us saw it.
 *
 * So A3, D2 and D3 are **restated in place in his file**, subjects kept, arm count unchanged at 18
 * so the SWEPT pin does not restage. A3 becomes the two-sided agreement it should have been: a `.ts`
 * file is in the program **iff** the config's own globs claim it — which reddens if the globs widen
 * and membership does not follow, and reddens if the globs are re-narrowed while membership persists.
 * That is an arm no repair of this deferral can falsify, in either direction. Editing another seat's
 * swept arms is not something I do lightly; the alternative was leaving the every-fire gate red for
 * everyone, and the memo says so and offers the revert.
 *
 * ── What this probe holds ────────────────────────────────────────────────────────────────────────
 *
 * A — the repair, read off `tsc --listFiles` and off the config's own globs, never off the glob alone.
 * B — the declaration is a module-format declaration and nothing else: not a package, not a
 *     workspace, no reach into `packages/`.
 * C — the mechanism, driven both directions on copies of the two real files: with the real
 *     declaration beside them, clean; with it withheld, TS1470 returns 2 of 2. This is the control
 *     for `probe-round303` D2, deliberately sited here rather than added to his file.
 * D — the runtime format consequence, driven, and the constructs it would have broken if either file
 *     had used them.
 * E — the obligation the declaration creates: it governs `.js` too, there are none under `scripts/`
 *     today, and the arm reddens the moment one appears. A pin on an absence — the good kind, and
 *     section E says why this one is not round224 arm E.
 *
 * Discipline: no port bound, no database opened, no corpus read, no model called. Every subprocess
 * is `npx tsc` or `npx tsx` over a fixture under gitignored `.testdata/`, or `tsc -p` over the real
 * `scripts/tsconfig.json`, which emits nothing.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { fingerprint } from './lib/tree-fingerprint.mts';

const SELF = fileURLToPath(import.meta.url);
const SCRIPTS = dirname(SELF);
const REPO = dirname(SCRIPTS);
const SCRATCH = join(REPO, '.testdata', 'r304-probe');
const TSCONFIG = join(SCRIPTS, 'tsconfig.json');
const TS_FILES = ['aaxt-mcp-live-probe.ts', 'record-demo.ts'] as const;

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

const read = (abs: string): string => readFileSync(abs, 'utf8');
const stripComments = (s: string): string => s.replace(/^\s*\/\/.*$/gm, '');
const CFG = JSON.parse(stripComments(read(TSCONFIG))) as {
  compilerOptions: Record<string, unknown>;
  include: string[];
};

/** Every file under `scripts/`, to one level of nesting, resolved from disk and never hand-typed. */
const scriptsFiles = (): string[] => {
  const out: string[] = [];
  for (const e of readdirSync(SCRIPTS, { withFileTypes: true })) {
    if (e.isDirectory()) for (const f of readdirSync(join(SCRIPTS, e.name))) out.push(`${e.name}/${f}`);
    else out.push(e.name);
  }
  return out.sort();
};
const FILES = scriptsFiles();

const TREE_AT_START = fingerprint(REPO, 'scripts');

rmSync(SCRATCH, { recursive: true, force: true });
mkdirSync(SCRATCH, { recursive: true });

console.log('\nRound 304 — the deferral is repaired with a declaration, and the arm that pinned it could not survive either repair\n');

// ── Section A: the program boundary after the widening ───────────────────────────────────────────
console.log('── A. the widened program, read off tsc and off the config’s own globs ──');

const listFiles = (cfg: string): Set<string> => {
  const r = spawnSync('npx', ['tsc', '-p', cfg, '--noEmit', '--listFiles'], {
    cwd: REPO,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return new Set(
    `${r.stdout ?? ''}`
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith(REPO) && !l.includes('node_modules'))
      .map((l) => l.slice(REPO.length + 1)),
  );
};
const PROGRAM = listFiles(TSCONFIG);

measure(
  'A0',
  `tsc program over the real config: ${PROGRAM.size} in-repo files · ` +
    `.mts ${[...PROGRAM].filter((f) => f.endsWith('.mts')).length} · ` +
    `.ts under scripts/ ${[...PROGRAM].filter((f) => f.startsWith('scripts/') && f.endsWith('.ts') && !f.endsWith('.d.ts')).length} · ` +
    `.mjs ${[...PROGRAM].filter((f) => f.endsWith('.mjs')).length} · include ${JSON.stringify(CFG.include)}`,
);

const tsOnDisk = FILES.filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts'));
check(
  'A1',
  'both .ts files under scripts/ are now INSIDE the typechecked program, named rather than counted',
  tsOnDisk.length === TS_FILES.length &&
    TS_FILES.every((f) => tsOnDisk.includes(f)) &&
    TS_FILES.every((f) => PROGRAM.has(`scripts/${f}`)),
  TS_FILES.map((f) => `${f}: ${PROGRAM.has(`scripts/${f}`) ? 'IN' : 'OUT'}`).join(' · ') +
    ` — this is the state probe-round303 A3 pinned the negation of, and it is why that arm was restated rather than left to redden.`,
);

check(
  'A1b',
  'and A1 is a fact about .ts rather than about an over-wide program: the widening did not admit a single .mjs, so the extension boundary still holds where Round 303 found it',
  [...PROGRAM].filter((f) => f.endsWith('.mjs')).length === 0 &&
    [...PROGRAM].filter((f) => f.endsWith('.mts')).length > 100 &&
    PROGRAM.has('scripts/sweep-probes.d.mts'),
  `.mjs in program 0 · .mts in program ${[...PROGRAM].filter((f) => f.endsWith('.mts')).length} · ` +
    'sweep-probes.d.mts present — Theseus’s Round 303 A1b shape, reused so "IN" and "OUT" are both load-bearing here.',
);

const realTsc = spawnSync('npx', ['tsc', '-p', TSCONFIG, '--noEmit'], { cwd: REPO, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const realErrs = `${realTsc.stdout ?? ''}${realTsc.stderr ?? ''}`.split('\n').filter((l) => /error TS/.test(l));
check(
  'A2',
  'the widened config is driven here rather than reasoned about: tsc over the real scripts/tsconfig.json exits 0 with no diagnostics',
  realTsc.status === 0 && realErrs.length === 0,
  `exit ${realTsc.status} · ${realErrs.length} diagnostic line(s)${realErrs.length ? `: ${realErrs[0]?.trim()}` : ''} — ` +
    'this is the same invocation `npm run typecheck:scripts` makes, so the gate and this arm cannot disagree.',
);

/**
 * The config's prose and its globs have to agree, because the prose is the half a reader trusts and
 * Round 303 §6 found a sentence in this very file that was a correct count of the wrong population.
 * Checked in both directions: the deferral sentence must be gone now that the deferral is taken, and
 * every extension the globs claim must be named in the note.
 */
const cfgText = read(TSCONFIG);
check(
  'A3',
  'the config’s own Scope note agrees with its own globs: the deferral sentence is gone, and every extension the include globs claim is named in the note',
  !/out of scope this round/.test(cfgText) &&
    CFG.include.length === 2 &&
    CFG.include.every((g) => /^\*\*\/\*\.[A-Za-z]+$/.test(g)) &&
    CFG.include.every((g) => cfgText.includes(g.replace('**/*', ''))),
  `globs ${JSON.stringify(CFG.include)} · deferral sentence present: ${/out of scope this round/.test(cfgText)} · ` +
    'both extensions named in the Scope note. A re-narrowing that leaves the note behind reddens here.',
);

// ── Section B: the declaration is a format declaration and nothing else ──────────────────────────
console.log('\n── B. what scripts/package.json is, and what it is not ──');

const PKG_PATH = join(SCRIPTS, 'package.json');
const pkgRaw = existsSync(PKG_PATH) ? read(PKG_PATH) : '';
const pkg = pkgRaw ? (JSON.parse(pkgRaw) as Record<string, unknown>) : null;
const rootPkg = JSON.parse(read(join(REPO, 'package.json'))) as Record<string, unknown>;

check(
  'B1',
  'scripts/package.json exists and declares the module format and nothing else: "type":"module" plus an explanatory comment key, and no name, version, dependencies, scripts or workspaces',
  pkg !== null &&
    pkg.type === 'module' &&
    Object.keys(pkg).sort().join(',') === '//,type' &&
    typeof pkg['//'] === 'string' &&
    (pkg['//'] as string).includes('tsconfig.json'),
  `keys ${pkg ? Object.keys(pkg).sort().join(',') : '(absent)'} · type ${JSON.stringify(pkg?.type ?? null)} — ` +
    'the "//" key carries the rationale, because JSON cannot hold a comment and a bare {"type":"module"} with no explanation is the kind of file a future reader deletes.',
);

const workspaces = (rootPkg.workspaces as string[] | undefined) ?? [];
check(
  'B2',
  'it is not a workspace and does not become one: the root manifest’s workspace globs are packages/* only, and none of them matches scripts',
  workspaces.length > 0 &&
    workspaces.every((w) => w.startsWith('packages/')) &&
    !workspaces.some((w) => w === 'scripts' || w === 'scripts/*' || w === '*'),
  `root workspaces ${JSON.stringify(workspaces)} — npm installs nothing here and links nothing here; the file is read by node and tsc for its "type" and by nothing else.`,
);

check(
  'B3',
  'and its reach cannot extend to product code: the root manifest still declares no "type", and scripts/ is a sibling of packages/ rather than an ancestor, so the nearest-package.json lookup from any product file never sees this file',
  rootPkg.type === undefined &&
    existsSync(join(REPO, 'packages')) &&
    !existsSync(join(SCRIPTS, 'packages')),
  'root package.json "type": absent · packages/ is a sibling of scripts/ — the blast radius is the directory this file sits in, by the resolution rule rather than by intention.',
);

// ── Section C: the mechanism, driven both directions on the two real files ───────────────────────
console.log('\n── C. the control: the silence is bought by the declaration, and the rename buys it too ──');

/** Mint a cell: copies of the two REAL `.ts` files, optionally beside a copy of the REAL declaration. */
const cell = (
  name: string,
  { ext, withDeclaration }: { ext: '.ts' | '.mts'; withDeclaration: boolean },
): { errs: string[]; codes: string[]; rc: number | null } => {
  const dir = join(SCRATCH, name);
  mkdirSync(dir, { recursive: true });
  for (const f of TS_FILES) copyFileSync(join(SCRIPTS, f), join(dir, ext === '.ts' ? f : f.replace(/\.ts$/, ext)));
  if (withDeclaration) copyFileSync(PKG_PATH, join(dir, 'package.json'));
  writeFileSync(
    join(dir, 'tsconfig.json'),
    JSON.stringify({ compilerOptions: CFG.compilerOptions, include: [`*${ext}`] }),
  );
  const r = spawnSync('npx', ['tsc', '-p', join(dir, 'tsconfig.json'), '--noEmit'], {
    cwd: REPO,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  const errs = `${r.stdout ?? ''}${r.stderr ?? ''}`.split('\n').filter((l) => /error TS/.test(l));
  return { errs, codes: [...new Set(errs.map((l) => (/error (TS\d+)/.exec(l) ?? [, '?'])[1] as string))].sort(), rc: r.status };
};

const withDecl = cell('with-declaration', { ext: '.ts', withDeclaration: true });
const noDecl = cell('no-declaration', { ext: '.ts', withDeclaration: false });
const renamed = cell('renamed-mts', { ext: '.mts', withDeclaration: false });

check(
  'C1',
  'with a copy of the real scripts/package.json beside them, copies of the two real .ts files typecheck clean under the real compilerOptions',
  withDecl.rc === 0 && withDecl.errs.length === 0,
  `rc ${withDecl.rc} · ${withDecl.errs.length} error(s) — the compilerOptions and the declaration are both copied from the live files, never retyped, so this cell is the real program relocated.`,
);

check(
  'C2',
  'and the silence is bought by the declaration specifically: withhold it from the same two copies and TS1470 returns, exactly one per file — this is the control probe-round303 D2 needs and the figure Theseus priced in his §5',
  noDecl.errs.length === TS_FILES.length && noDecl.codes.join(',') === 'TS1470',
  `rc ${noDecl.rc} · ${noDecl.errs.length} error(s) · codes ${noDecl.codes.join(',') || 'none'} — ` +
    'without this cell, C1 would be a green that cannot distinguish "the declaration works" from "these files were always fine".',
);

check(
  'C3',
  'the repair shape I did NOT take also typechecks clean: the same bytes as .mts, with no declaration anywhere — so the type price was a tie and the decision was made on collateral, not on types',
  renamed.rc === 0 && renamed.errs.length === 0,
  `rc ${renamed.rc} · ${renamed.errs.length} error(s) — Theseus leaned to this shape in his Round 303 §5, and nothing here contradicts the lean on its own terms.`,
);

/**
 * The collateral the decision actually turned on, re-measured live every run rather than quoted from
 * the memo. A rename has to edit every path literal that names these files; the count is a number a
 * later rename would have to pay, so it is a [MEAS] and not a pin.
 */
const CODE_EXT = new Set(['.mts', '.mjs', '.ts', '.tsx', '.json', '.sh', '.yml', '.yaml']);
const pathLiteralSites: string[] = [];
const walk = (dir: string, out: string[] = []): string[] => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '.testdata', 'dist', 'build'].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile()) out.push(p);
  }
  return out;
};
const repoFiles = walk(REPO);
for (const p of repoFiles) {
  const rel = p.slice(REPO.length + 1);
  if (![...CODE_EXT].some((x) => rel.endsWith(x))) continue;
  const text = read(p);
  for (const f of TS_FILES) {
    if (text.includes(f)) pathLiteralSites.push(`${rel} → ${f}`);
  }
}
measure('C4', `path literals a rename would have to follow, in code/config only: ${pathLiteralSites.length}`);
for (const s of pathLiteralSites) measure('C4b', s);
check(
  'C4c',
  'and one of those sites is path-KEYED rather than merely path-naming, which is why the rename’s collateral is partly invisible: probe-round276’s localhost allowlist keys on scripts/record-demo.ts and is DEFERRED, so a rename stales that entry silently instead of reddening it',
  /\{ file: 'scripts\/record-demo\.ts'/.test(read(join(SCRIPTS, 'probe-round276-the-address-census-and-the-sentinel-that-hid-its-own-file.mts'))),
  'probe-round276 keys its classified-site allowlist on the path string. A DEFERRED probe is not driven by the sweep, so the stale entry would wait there until someone read it — the worst of the three outcomes available (red, stale, or nothing).',
);

// ── Section D: the runtime format consequence, driven ────────────────────────────────────────────
console.log('\n── D. what the declaration does at runtime, and what it would have broken ──');

const FIXTURE_BODIES = {
  'requires.ts': "declare const require: (s: string) => unknown;\nconsole.log('require=' + typeof require('path'));\n",
  'metadir.ts': "console.log('dirname=' + (import.meta.dirname ?? 'undefined'));\n",
};
/**
 * Read the two streams SEPARATELY, which is the repair for this arm's own first defect. The first
 * version searched `stdout + stderr` for the first line matching `/require=|dirname=|Error/` — and a
 * node stack trace quotes the offending source line, which in these fixtures *contains* `require=`.
 * So under the declaration, where the fixture is supposed to fail, the picker returned the echoed
 * source instead of the ReferenceError and D1 went red on a correct run. Round 246's shape again: a
 * scanner whose corpus contains its own notation. Streams are a fixed structural position; "the
 * first interesting-looking line" is a search.
 */
const runFixtures = (name: string, withDeclaration: boolean): Record<string, string> => {
  const dir = join(SCRATCH, name);
  mkdirSync(dir, { recursive: true });
  if (withDeclaration) copyFileSync(PKG_PATH, join(dir, 'package.json'));
  const out: Record<string, string> = {};
  for (const [f, src] of Object.entries(FIXTURE_BODIES)) {
    writeFileSync(join(dir, f), src);
    const r = spawnSync('npx', ['tsx', join(dir, f)], { cwd: REPO, encoding: 'utf8' });
    const printed = `${r.stdout ?? ''}`.split('\n').find((l) => /^(require|dirname)=/.test(l.trim()));
    const thrown = `${r.stderr ?? ''}`.split('\n').find((l) => /^[A-Za-z]*Error\b/.test(l.trim()));
    out[f] = (printed ?? thrown ?? '(no output)').trim().slice(0, 120);
  }
  return out;
};
const esm = runFixtures('fmt-with-declaration', true);
const cjs = runFixtures('fmt-without-declaration', false);

check(
  'D1',
  'under the declaration a .ts file really is ESM: require is not defined and import.meta.dirname resolves',
  /require is not defined/.test(esm['requires.ts'] ?? '') && /dirname=\//.test(esm['metadir.ts'] ?? ''),
  `require → ${esm['requires.ts']} · import.meta → ${esm['metadir.ts']}`,
);

check(
  'D2',
  'and without it the same two bodies are CommonJS: require resolves and import.meta.dirname is undefined — so Theseus’s TS1470 was describing the format the runner actually used, not a format tsc invented',
  /require=object/.test(cjs['requires.ts'] ?? '') && /dirname=undefined/.test(cjs['metadir.ts'] ?? ''),
  `require → ${cjs['requires.ts']} · import.meta → ${cjs['metadir.ts']} — I had expected tsc and tsx to disagree here and they do not; the diagnostic was accurate about today.`,
);

const CJS_ONLY = /\brequire\s*\(|\bmodule\.exports\b|\bexports\.[A-Za-z_]/;
check(
  'D3',
  'neither real .ts file uses a CommonJS-only construct, so nothing in them depended on the format that just changed',
  TS_FILES.every((f) => !CJS_ONLY.test(read(join(SCRIPTS, f)))),
  TS_FILES.map((f) => `${f}: no require()/module.exports/exports.x`).join(' · '),
);
check(
  'D3b',
  'and D3’s detector is not blind: the same pattern fires on each of the three constructs it claims to catch',
  ["const p = require('path');", 'module.exports = x;', 'exports.foo = 1;'].every((s) => CJS_ONLY.test(s)) &&
    !CJS_ONLY.test("import path from 'path';"),
  'three known positives and one known negative — a detector that returns a smaller number is this fleet’s standing failure mode, and an emptiness claim is exactly where it hides.',
);

const recordDemo = read(join(SCRIPTS, 'record-demo.ts'));
check(
  'D4',
  'the one line whose behaviour this repair changed is named rather than left implied: record-demo.ts’s dirname expression tries import.meta.dirname FIRST, so under the declaration it takes that branch and the `|| __dirname` fallback becomes dead rather than load-bearing',
  /import\.meta\.dirname\s*\|\|\s*__dirname/.test(recordDemo) && /dirname=undefined/.test(cjs['metadir.ts'] ?? ''),
  'before this fire the fallback was the branch actually taken (D2 measures import.meta.dirname as undefined under CommonJS); now it is unreachable, and `__dirname` would be a ReferenceError if it ever were reached. Not driven: the file itself is a Playwright demo recorder, so this is a read of the expression and of the format, not a claim that the recorder runs.',
);

// ── Section E: the obligation the declaration creates ────────────────────────────────────────────
console.log('\n── E. the standing obligation: "type":"module" governs .js too ──');

const jsUnderScripts = FILES.filter((f) => f.endsWith('.js'));
check(
  'E1',
  'there is no .js file under scripts/, which is the extension this declaration silently re-formats — the arm reddens the moment one appears, which is exactly when someone has to decide ESM or rename',
  jsUnderScripts.length === 0,
  `0 of ${FILES.length} files under scripts/ are .js (extensions present: ` +
    `${[...new Set(FILES.map((f) => (/\.[A-Za-z]+$/.exec(f) ?? ['(none)'])[0]))].sort().join(' ')}). ` +
    'A pin on an absence, and round224 arm E is the reason to say why this one is the good kind: it does not expire because someone fixed something elsewhere — the only thing that reddens it is the event it exists to catch.',
);
check(
  'E2',
  'and E1 is not green because the walk cannot see a .js at all: the same function finds a planted one',
  ((): boolean => {
    const dir = join(SCRATCH, 'planted');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'planted.js'), 'console.log(1);\n');
    return readdirSync(dir).filter((f) => f.endsWith('.js')).length === 1;
  })(),
  'planted .js found by the same extension predicate E1 uses, under .testdata/ rather than under scripts/ — minting a file inside scripts/ would mutate the population the census and this probe both read.',
);

/**
 * The `.mjs` cells, and this arm's own first defect is worth keeping in view: the fixture body was
 * copied from the `.ts` cell above, `declare const require: …` and all — TypeScript syntax in a file
 * run by plain `node`. Both cells died with `SyntaxError: Unexpected token 'const'`, which satisfied
 * an "identical behaviour" assertion **without either cell reaching the construct under test**. The
 * arm was green-equivalent for the wrong reason, i.e. the vacuity shape, and it only showed as a red
 * because the assertion named the expected message rather than only the equality.
 */
const mjsCell = ((): { withDecl: string; without: string } => {
  const body = "console.log('require=' + typeof require('path'));\n";
  const out: Record<string, string> = {};
  for (const [name, decl] of [['mjs-with-declaration', true], ['mjs-without-declaration', false]] as const) {
    const dir = join(SCRATCH, name);
    mkdirSync(dir, { recursive: true });
    if (decl) copyFileSync(PKG_PATH, join(dir, 'package.json'));
    writeFileSync(join(dir, 'probe.mjs'), body);
    const r = spawnSync('node', [join(dir, 'probe.mjs')], { cwd: REPO, encoding: 'utf8' });
    const printed = `${r.stdout ?? ''}`.split('\n').find((l) => /^require=/.test(l.trim()));
    const thrown = `${r.stderr ?? ''}`.split('\n').find((l) => /^[A-Za-z]*Error\b/.test(l.trim()));
    out[name] = (printed ?? thrown ?? '(no output)').trim().slice(0, 90);
  }
  return { withDecl: out['mjs-with-declaration'] ?? '', without: out['mjs-without-declaration'] ?? '' };
})();
check(
  'E3',
  'the existing population is untouched by construction rather than by luck: a .mjs file is ESM with and without the declaration beside it, with the same diagnostic both times, because extension beats "type"',
  /require is not defined/.test(mjsCell.withDecl) &&
    /require is not defined/.test(mjsCell.without) &&
    mjsCell.withDecl === mjsCell.without,
  `with declaration → ${mjsCell.withDecl} · without → ${mjsCell.without} — identical AND for the stated reason, which is why no .mjs or .mts under scripts/ had to be looked at one by one.`,
);

// ── Section Z: this probe’s own discipline ───────────────────────────────────────────────────────
console.log('\n── Z. discipline ──');

rmSync(SCRATCH, { recursive: true, force: true });
check(
  'Z1',
  'the population under scripts/ is byte-identical across this run — nothing was minted, copied or removed inside the directory this probe reads',
  fingerprint(REPO, 'scripts') === TREE_AT_START,
  'fingerprint of scripts/ taken before arm A0 and after the last fixture, compared as a delta rather than as a cleanliness claim about the fire’s tree — Theseus’s Round 303 Z1 repair, which his own sweep caught and which held when my rename experiment gave it a genuinely dirty tree to read.',
);
check(
  'Z2',
  'every fixture this probe minted lived under .testdata/, which is gitignored, and the tree is removed before this arm runs',
  !existsSync(SCRATCH) && /(^|\n)\.testdata\//.test(read(join(REPO, '.gitignore'))),
  `${SCRATCH.slice(REPO.length + 1)} absent at exit · .gitignore names .testdata/`,
);
measure(
  'Z3',
  'subprocesses: npx tsc over the real scripts/tsconfig.json and over 3 fixture configs; npx tsx over 4 fixture files; npx node over 2 fixture files. ' +
    'No port bound, no database opened, no corpus read, no model called, and nothing under packages/ executed.',
);

console.log(
  `\n${fail === 0 ? `All ${pass} regression checks passed` : `${fail} of ${pass + fail} FAILED`}, ${meas} measurements, 0 skips`,
);
process.exit(fail === 0 ? 0 : 1);
