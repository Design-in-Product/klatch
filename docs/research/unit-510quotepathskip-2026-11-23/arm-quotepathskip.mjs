/**
 * unit-510quotepathskip — arm.
 *
 * Grades the cure Theseus routed in (`unit-509` §5.3) **at the granularity of its own claim**. He
 * stated it as one flag, "`-z` with a NUL split, or `-c core.quotePath=false`" — two candidates
 * offered as interchangeable. This arm drives a ladder of four readers against six cells and
 * reports which rung actually closes which mechanism.
 *
 * CELLS (each a fresh synthetic repository; content byte-identical across all of them, so the
 * cells differ ONLY in the path):
 *   A-ASCII      tracked `src/ab.mjs`                        → control: proves content is a member
 *   A-SPACE      tracked `src/a b.mjs`      (ASCII space)    → his H1/H2/H4 refutation, re-driven
 *   A-NONASCII   tracked `src/aä.mjs`       (U+00E4)         → the routed defect
 *   A-DQUOTE     tracked `src/a"b.mjs`      (literal quote)  → separates candidate A from B
 *   A-UNLINKED   tracked `src/ab.mjs`, then unlinked         → second mechanism (`catch {continue}`)
 *   A-LEADSPACE  tracked ` src/a.mjs`       (leading space)  → POST-HOC: third mechanism (`.trim()`)
 *
 * READERS (produced by substitution on a COPY of the live gate inside the synthetic repo, so the
 * live gate is not edited until the arm has graded a winner):
 *   G0  as it stands on origin/main
 *   G1  + `-c core.quotePath=false`                       (his candidate B)
 *   G2  + `ls-files -z`, split on NUL, `.trim()` KEPT     (his candidate A, read literally)
 *   G3  + `ls-files -z`, split on NUL, `.trim()` DROPPED  (the complete cure)
 *
 * This file lives in the TRACKED tree, so the gate scans it. Its brace comparison is therefore
 * built from char codes rather than written as a literal: a literal `k === '{'` here would make
 * this arm a new UNGUARDED population member and redden the live gate from inside its own
 * measurement. (`a hygiene gate that walks its own directory reddens in every cell`.) Nothing
 * here is exempted by a marker; it is out of the population because it contains no such
 * comparison, which is the honest way to be out of it.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..', '..');
const GATE_REL = 'scripts/verify-decl-body-slicers.mjs';
const CAP = join(HERE, 'captures');
mkdirSync(CAP, { recursive: true });

const sha = (b) => createHash('sha256').update(b).digest('hex').slice(0, 8);
const must = (c, m) => { if (!c) { console.error(`arm: BLOCKED — ${m}`); process.exit(2); } };

/* ----------------------------------------------------------------- the fixture, brace-free here */
const OPEN = String.fromCharCode(123);
const CLOSE = String.fromCharCode(125);
const Q = String.fromCharCode(39);
const ch = (c) => `${Q}${c}${Q}`;

/** A hand-rolled unguarded brace-balance slicer: both braces compared, no paren/colon guard. */
const naiveSlicer = [
  '// unit-510 fixture, nothing declared at this site',
  'export function depth(s) {',
  '  let d = 0;',
  '  for (const k of s) {',
  `    if (k === ${ch(OPEN)}) d += 1;`,
  `    if (k === ${ch(CLOSE)}) d -= 1;`,
  '  }',
  '  return d;',
  '}',
  '',
].join('\n');

/* ------------------------------------------------- the live gate, and the substitution anchors */
const gateBytes = readFileSync(join(ROOT, GATE_REL));
const gateSrc = gateBytes.toString('utf8');
console.log(`gate under test: ${GATE_REL} sha ${sha(gateBytes)} (${gateBytes.length} bytes)`);

// Sliced, never typed: if the gate's read site moves, this arm must BLOCK rather than silently
// grade an unsubstituted copy as a cure. Every reader below asserts its own substitution landed.
const LS_ANCHOR = "execFileSync('git', ['-C', ROOT, 'ls-files'], { encoding: 'utf8' })";
const SPLIT_ANCHOR = ".split('\\n').map((l) => l.trim()).filter(Boolean);";
must(gateSrc.includes(LS_ANCHOR), `ls-files anchor not found: ${LS_ANCHOR}`);
must(gateSrc.includes(SPLIT_ANCHOR), `split anchor not found: ${SPLIT_ANCHOR}`);
must(gateSrc.split(LS_ANCHOR).length === 2, 'ls-files anchor is not unique');
must(gateSrc.split(SPLIT_ANCHOR).length === 2, 'split anchor is not unique');

const NUL = String.fromCharCode(0);
const READERS = {
  G0: (s) => s,
  G1: (s) => s.replace(LS_ANCHOR,
    "execFileSync('git', ['-C', ROOT, '-c', 'core.quotePath=false', 'ls-files'], { encoding: 'utf8' })"),
  G2: (s) => s
    .replace(LS_ANCHOR, "execFileSync('git', ['-C', ROOT, 'ls-files', '-z'], { encoding: 'utf8' })")
    .replace(SPLIT_ANCHOR, ".split('\\0').map((l) => l.trim()).filter(Boolean);"),
  G3: (s) => s
    .replace(LS_ANCHOR, "execFileSync('git', ['-C', ROOT, 'ls-files', '-z'], { encoding: 'utf8' })")
    .replace(SPLIT_ANCHOR, ".split('\\0').filter(Boolean);"),
};
// Each substituted reader must actually DIFFER from G0, or the arm is grading G0 four times and
// reporting three cures. (`a declared cripple no hook reads runs clean`.)
for (const [name, fn] of Object.entries(READERS)) {
  const out = fn(gateSrc);
  if (name === 'G0') must(out === gateSrc, 'G0 must be the gate verbatim');
  else must(out !== gateSrc, `${name} substitution did not change the source`);
}
console.log(`readers: ${Object.keys(READERS).join(' ')} — every substitution verified to differ from G0`);

/* ------------------------------------------------------------------------------------- the cells */
const CELLS = {
  'A-ASCII': { rel: 'src/ab.mjs' },
  'A-SPACE': { rel: `src/a${String.fromCharCode(32)}b.mjs` },
  'A-NONASCII': { rel: `src/a${String.fromCharCode(0xe4)}.mjs` },
  'A-DQUOTE': { rel: `src/a${String.fromCharCode(34)}b.mjs` },
  'A-UNLINKED': { rel: 'src/ab.mjs', unlink: true },
  'A-LEADSPACE': { rel: `${String.fromCharCode(32)}src/a.mjs`, posthoc: true },
};

function buildRepo(cell, readerName) {
  const SYN = mkdtempSync(join(tmpdir(), 'u510-'));
  execFileSync('git', ['-C', SYN, 'init', '-q']);
  // The index is what `ls-files` reads, so `add` is enough; no commit, no identity needed.
  mkdirSync(join(SYN, 'scripts'), { recursive: true });
  writeFileSync(join(SYN, GATE_REL), READERS[readerName](gateSrc));
  cpSync(join(ROOT, 'scripts', 'lib'), join(SYN, 'scripts', 'lib'), { recursive: true });
  writeFileSync(join(SYN, 'scripts', 'decl-body-slicers.baseline'),
    '# unit-510: deliberately empty baseline, so any member reddens\n');

  const target = join(SYN, cell.rel);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, naiveSlicer);
  // A cell that cannot be built is not a cell that passed (pre-registered limit 3).
  must(existsSync(target), `UNCREATABLE: ${cell.rel}`);
  execFileSync('git', ['-C', SYN, 'add', '--', cell.rel]);
  const indexed = execFileSync('git', ['-C', SYN, 'ls-files', '-z'], { encoding: 'utf8' })
    .split(NUL).filter(Boolean);
  must(indexed.length === 1, `expected exactly 1 indexed path, got ${indexed.length}`);
  if (cell.unlink) {
    rmSync(target);
    must(!existsSync(target), 'unlink did not remove the worktree file');
  }
  return { SYN, indexedRaw: indexed[0] };
}

const num = (text, label) => {
  const m = text.match(new RegExp(`${label}[^\\n]*?(\\d+)`));
  return m ? Number(m[1]) : null;
};

const rows = [];
for (const readerName of Object.keys(READERS)) {
  for (const [cellName, cell] of Object.entries(CELLS)) {
    const { SYN, indexedRaw } = buildRepo(cell, readerName);
    const r = spawnSync('node', [join(SYN, GATE_REL)], { encoding: 'utf8' });
    const out = r.stdout ?? '';
    const err = r.stderr ?? '';
    const tag = `${readerName}-${cellName}`;
    writeFileSync(join(CAP, `${tag}.out`), out);
    writeFileSync(join(CAP, `${tag}.err`), err);
    rows.push({
      reader: readerName,
      cell: cellName,
      posthoc: Boolean(cell.posthoc),
      rc: r.status,
      read: num(out, 'tracked files read:'),
      pop: num(out, 'population \\(compares against both braces\\):'),
      unguarded: num(out, 'UNGUARDED'),
      ok: out.includes('DECL-BODY SLICERS OK'),
      // What git handed the reader, captured rather than asserted.
      quotedByGit: indexedRaw !== cell.rel ? 'differs' : 'verbatim',
    });
    rmSync(SYN, { recursive: true, force: true });
  }
}

/* -------------------------------------------------------------------------------------- report */
const W = { reader: 6, cell: 12 };
console.log('');
console.log(`${'reader'.padEnd(W.reader)}${'cell'.padEnd(W.cell)}  rc  read  pop  UNG  OK     git`);
for (const r of rows) {
  console.log(
    `${r.reader.padEnd(W.reader)}${r.cell.padEnd(W.cell)}`
    + `  ${String(r.rc).padStart(2)}`
    + `  ${String(r.read).padStart(4)}`
    + `  ${String(r.pop).padStart(3)}`
    + `  ${String(r.unguarded).padStart(3)}`
    + `  ${r.ok ? 'OK   ' : 'RED  '}`
    + `  ${r.quotedByGit}${r.posthoc ? '   [post-hoc]' : ''}`,
  );
}

// A cell is SEEN by a reader when the member reddens it. Stated as the predicate, derived from the
// captured branch literals rather than from a hand-typed expectation.
const seen = (r) => r.rc === 1 && r.pop === 1 && r.unguarded === 1 && !r.ok;
const blind = (r) => r.rc === 0 && r.pop === 0 && r.ok;
console.log('');
for (const readerName of Object.keys(READERS)) {
  const mine = rows.filter((r) => r.reader === readerName);
  const s = mine.filter(seen).map((r) => r.cell);
  const b = mine.filter(blind).map((r) => r.cell);
  const other = mine.filter((r) => !seen(r) && !blind(r)).map((r) => `${r.cell}(rc${r.rc},read${r.read},pop${r.pop})`);
  console.log(`${readerName}: sees ${s.length}/${mine.length} [${s.join(' ')}]  blind [${b.join(' ')}]`
    + (other.length ? `  neither [${other.join(' ')}]` : ''));
}

// The figure that is misnamed: `tracked files read` on a cell where nothing was read.
const misnamed = rows.filter((r) => r.read === 1 && r.pop === 0);
console.log('');
console.log(`cells reporting "tracked files read: 1" with population 0 (the figure claims a read that`
  + ` did not happen): ${misnamed.length}`);
for (const r of misnamed) console.log(`      ${r.reader} ${r.cell}  rc ${r.rc}  OK=${r.ok}`);

writeFileSync(join(CAP, 'arm-quotepathskip.json'), `${JSON.stringify({ rows }, null, 2)}\n`);
console.log('');
console.log(`captures: ${rows.length * 2} cell files + arm-quotepathskip.json`);
