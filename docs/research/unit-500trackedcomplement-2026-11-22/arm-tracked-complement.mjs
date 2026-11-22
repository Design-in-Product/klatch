// unit-500trackedcomplement, Daedalus, 2026-11-22 START fire.
//
// Grades Theseus's 11-21 STOP control (`verification-theseus-2026-11-21-stop-unit499-landing/`).
// His arm plants an UNTRACKED member carrying the detected property and measures
// `scripts/verify-decl-body-slicers.mjs` flat; from that he grades requirement 1 (`git ls-files`,
// never a filesystem walk). The flat reading is consistent with TWO mechanisms and his control has
// only one arm, so it cannot separate them: the tracked key excluded the plant, OR the gate's own
// population key would not have classified the plant even while tracked. "Carries the property" is
// established there by his reader (`text.includes`), not by the gate's.
//
// This is the complement. Same plant content; one arm untracked, one arm visible to `git ls-files`
// via `git add -N`, one arm under the root .gitignore's `docs/research/unit-*/scratch/` rule, and a
// rival naive walk keyed on the gate's OWN population expressions, CUT from its source rather than
// re-typed.
//
// Hazards declared in PRE-REGISTRATION.md and avoided mechanically, not by care:
//   - the exemption token is ASSEMBLED from parts and never written as a literal here (unit-499 P5;
//     Theseus walked into it six hours after reporting he had not);
//   - no quoted one-character brace comparison appears in this file, because `blankLongStrings(raw,
//     2)` KEEPS 1-char string bodies and would put this arm in the population it measures;
//   - the `git add -N` index entry is reversed in a `finally` and the reversal is asserted.
import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync, rmSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { extname, join, relative } from 'node:path';
import { blankLongStrings } from '../../../scripts/lib/strip-source.mjs';

const ROOT = process.cwd();
const UNIT = 'docs/research/unit-500trackedcomplement-2026-11-22';
const GATE = 'scripts/verify-decl-body-slicers.mjs';
const SUBJECT = 'docs/research/verification-theseus-2026-11-21-stop-unit499-landing/control-untracked-member.mjs';

const PLANT_OPEN = join(UNIT, 'plant-unguarded-slicer.mjs');        // untracked, NOT ignored
const SCRATCH = join(UNIT, 'scratch');
const PLANT_IGN = join(SCRATCH, 'plant-unguarded-slicer.mjs');      // untracked AND ignored

const OPEN = String.fromCharCode(123); // {
const CLOSE = String.fromCharCode(125); // }
const Q = String.fromCharCode(39);     // '
const MARKER = ['brace', 'slicer', 'deliberate'].join('-') + ':';

const git = (...args) => spawnSync('git', ['-C', ROOT, ...args], { encoding: 'utf8' });
const drive = () => spawnSync('node', [GATE], { cwd: ROOT, encoding: 'buffer' });

const FIG = {
  read: /tracked files read: (\d+)/,
  pop: /population \(compares against both braces\): (\d+)/,
  marked: /MARKED\s+(\d+)/,
  guarded: /GUARDED\s+(\d+)/,
  unguarded: /UNGUARDED\s+(\d+)/,
  baseline: /baseline entries: (\d+)/,
};
const figures = (buf) => {
  const s = buf.toString();
  const out = { bytes: buf.length, lines: s.split('\n').length - (s.endsWith('\n') ? 1 : 0) };
  for (const [k, re] of Object.entries(FIG)) { const m = s.match(re); out[k] = m ? Number(m[1]) : null; }
  return out;
};
const show = (label, d) => {
  const f = figures(d.stdout);
  console.log(`  ${label.padEnd(26)} rc=${d.status} bytes=${f.bytes} lines=${f.lines} read=${f.read} pop=${f.pop} M=${f.marked} G=${f.guarded} U=${f.unguarded} base=${f.baseline}`);
  return f;
};

// A genuine unguarded hand-rolled brace-balance declaration-body slicer: the property the gate
// detects, not an analogy to it. No exemption marker, no import of the shared reader, so neither
// escape can explain any reading.
const plantSource = [
  `export function bodyOf(src, declStart) ${OPEN}`,
  `  const open = src.indexOf(${Q}${OPEN}${Q}, declStart);`,
  '  let depth = 0;',
  `  for (let i = open; i < src.length; i++) ${OPEN}`,
  `    if (src[i] === ${Q}${OPEN}${Q}) depth += 1;`,
  `    else if (src[i] === ${Q}${CLOSE}${Q}) ${OPEN}`,
  '      depth -= 1;',
  `      if (depth === 0) return src.slice(open, i + 1);`,
  `    ${CLOSE}`,
  `  ${CLOSE}`,
  `  return ${Q}${Q};`,
  `${CLOSE}`,
  '',
].join('\n');

/* ---------------------------------------------------------------- P1: his control has no index arm */
console.log('P1 — index-visible arm in the subject control');
const subjectSrc = readFileSync(join(ROOT, SUBJECT), 'utf8');
const gitCalls = [...subjectSrc.matchAll(/spawnSync\(\s*['"`]git['"`]\s*,\s*\[([^\]]*)\]/g)]
  .map((m) => m[1].replace(/\s+/g, ' ').trim());
const INDEX_MUTATORS = ['add', 'update-index', 'stage', 'commit', 'checkout-index'];
const mutating = gitCalls.filter((c) => INDEX_MUTATORS.some((sub) => new RegExp(`['"\`]${sub}['"\`]`).test(c)));
console.log('  git invocations found      :', gitCalls.length);
for (const c of gitCalls) console.log('    ', c);
console.log('  index-mutating invocations :', mutating.length);
const P1 = gitCalls.length === 1 && mutating.length === 0 && /ls-files/.test(gitCalls[0]);
console.log('  P1:', P1 ? 'TRUE — no arm in which the plant is visible to `git ls-files`' : 'FALSE');

/* ---------------------------------------------------------------- the drives */
let P2 = null, P3 = null, P4a = null, P4b = null, P5a = null, P5b = null;
let d0, f0;
try {
  console.log('\nD0 — baseline, no plant anywhere');
  d0 = drive();
  f0 = show('D0 baseline', d0);

  /* ---- untracked, NOT ignored ---- */
  writeFileSync(join(ROOT, PLANT_OPEN), plantSource);
  const unmatch1 = git('ls-files', '--error-unmatch', PLANT_OPEN);
  const ignore1 = git('check-ignore', PLANT_OPEN);
  console.log('\nplant properties (untracked arm) — asserted BEFORE the drive that depends on them');
  console.log('  on disk                    :', existsSync(join(ROOT, PLANT_OPEN)));
  console.log('  ext in gate EXTS           :', extname(PLANT_OPEN) === '.mjs');
  console.log('  tracked by git             :', unmatch1.status === 0, `(ls-files rc=${unmatch1.status})`);
  console.log('  ignored by git             :', ignore1.status === 0, `(check-ignore rc=${ignore1.status})`);
  console.log('  carries the exemption      :', plantSource.includes(MARKER));
  console.log('  imports the shared reader  :', /scripts\/lib\/decl-body\.mjs/.test(plantSource));

  const d1 = drive();
  const f1 = show('D1 untracked plant', d1);
  P4a = f1.read === f0.read;
  console.log('  P4a (read unchanged while untracked):', P4a, `${f0.read} -> ${f1.read}`);
  console.log('  byte-identical to D0       :', Buffer.compare(d0.stdout, d1.stdout) === 0);

  /* ---- same bytes, now visible to `git ls-files` ---- */
  const addN = git('add', '-N', PLANT_OPEN);
  const unmatch2 = git('ls-files', '--error-unmatch', PLANT_OPEN);
  console.log('\nplant properties (tracked arm) — SAME BYTES on disk, index entry only');
  console.log('  git add -N rc              :', addN.status);
  console.log('  tracked by git             :', unmatch2.status === 0, `(ls-files rc=${unmatch2.status})`);
  console.log('  bytes on disk unchanged    :', readFileSync(join(ROOT, PLANT_OPEN), 'utf8') === plantSource);

  const d2 = drive();
  const f2 = show('D2 add -N plant', d2);
  P2 = f2.pop === f0.pop + 1 && f2.unguarded === f0.unguarded + 1;
  console.log(`  P2 (pop +1 AND UNGUARDED +1):`, P2, `pop ${f0.pop} -> ${f2.pop}, U ${f0.unguarded} -> ${f2.unguarded}`);
  const named = d2.stdout.toString().includes(PLANT_OPEN);
  P3 = d2.status === 1 && named;
  console.log(`  P3 (rc=1 AND path named)   :`, P3, `rc=${d2.status}, path printed=${named}`);
  P4b = f2.read === f0.read + 1;
  console.log(`  P4b (read +1 under add -N) :`, P4b, `${f0.read} -> ${f2.read}`);

  /* ---- reverse the index entry ---- */
  const reset = git('reset', '-q', '--', PLANT_OPEN);
  const unmatch3 = git('ls-files', '--error-unmatch', PLANT_OPEN);
  console.log('\nindex entry reversed');
  console.log('  git reset rc               :', reset.status);
  console.log('  tracked by git             :', unmatch3.status === 0, `(ls-files rc=${unmatch3.status})`);
  const d3 = drive();
  show('D3 after reset', d3);
  console.log('  byte-identical to D0       :', Buffer.compare(d0.stdout, d3.stdout) === 0);
  unlinkSync(join(ROOT, PLANT_OPEN));

  /* ---- untracked AND ignored ---- */
  mkdirSync(join(ROOT, SCRATCH), { recursive: true });
  writeFileSync(join(ROOT, PLANT_IGN), plantSource);
  const ignore2 = git('check-ignore', PLANT_IGN);
  const unmatch4 = git('ls-files', '--error-unmatch', PLANT_IGN);
  console.log('\nplant properties (ignored arm)');
  console.log('  ignored by git             :', ignore2.status === 0, `(check-ignore rc=${ignore2.status}) rule:`, ignore2.stdout.trim());
  console.log('  tracked by git             :', unmatch4.status === 0, `(ls-files rc=${unmatch4.status})`);
  const d4 = drive();
  show('D4 ignored plant', d4);
  P5a = Buffer.compare(d0.stdout, d4.stdout) === 0;
  console.log('  P5a (byte-identical to D0) :', P5a, `${f0.bytes} / ${figures(d4.stdout).bytes}`);

  /* ---- P5b: the rival that actually exists — a naive walk under the gate's OWN key ---- */
  // The key expressions are CUT from the gate's source, not re-typed: a re-typed key grades my
  // typing. Each cut is asserted to appear exactly once.
  const gateSrc = readFileSync(join(ROOT, GATE), 'utf8');
  const cut = (name) => {
    const re = new RegExp(`^const ${name} = .*;$`, 'gm');
    const hits = gateSrc.match(re) || [];
    if (hits.length !== 1) throw new Error(`cut ${name}: expected exactly 1 source line, found ${hits.length}`);
    return hits[0];
  };
  const cuts = ['cmp', 'OPEN_BRACE', 'CLOSE_BRACE', 'LPAREN', 'RPAREN', 'COLON'].map(cut);
  console.log('\nP5b — rival naive walk, population key CUT from the gate source');
  for (const c of cuts) console.log('    ', c);
  const keys = new Function(`${cuts.join('\n')}\nreturn { OPEN_BRACE, CLOSE_BRACE, LPAREN, RPAREN, COLON };`)();

  const EXTS = new Set(['.ts', '.mts', '.js', '.mjs', '.cts', '.cjs', '.tsx']);
  const walk = (dir, acc = []) => {
    for (const e of readdirSync(join(ROOT, dir))) {
      const rel = join(dir, e);
      let st; try { st = statSync(join(ROOT, rel)); } catch { continue; }
      if (st.isDirectory()) walk(rel, acc);
      else if (EXTS.has(extname(rel))) acc.push(rel);
    }
    return acc;
  };
  const walked = walk('docs/research');
  const sawPlant = walked.includes(PLANT_IGN);
  const code = blankLongStrings(plantSource, 2);
  const inPop = keys.OPEN_BRACE.test(code) && keys.CLOSE_BRACE.test(code);
  const guarded = keys.LPAREN.test(code) || keys.RPAREN.test(code) || keys.COLON.test(code);
  const lsFiles = new Set(git('ls-files').stdout.split('\n').map((l) => l.trim()).filter(Boolean));
  console.log('  walked .mjs/.ts under docs/research :', walked.length);
  console.log('  naive walk SEES the ignored plant   :', sawPlant);
  console.log('  git ls-files sees it                :', lsFiles.has(PLANT_IGN));
  console.log('  under the gate\'s cut population key :', inPop ? 'IN POPULATION' : 'out');
  console.log('  under the gate\'s cut guard key      :', guarded ? 'GUARDED' : 'UNGUARDED');
  P5b = sawPlant && !lsFiles.has(PLANT_IGN) && inPop && !guarded;
  console.log('  P5b:', P5b, '— the ignored case IS gradeable against the rival that exists');
} finally {
  // Reversal is unconditional, and asserted rather than hoped for.
  git('reset', '-q', '--', PLANT_OPEN);
  for (const p of [PLANT_OPEN, PLANT_IGN]) if (existsSync(join(ROOT, p))) unlinkSync(join(ROOT, p));
  if (existsSync(join(ROOT, SCRATCH))) rmSync(join(ROOT, SCRATCH), { recursive: true, force: true });
  const porcelain = git('status', '--porcelain').stdout.split('\n').filter(Boolean)
    .filter((l) => l.includes('unit-500trackedcomplement'));
  console.log('\ncleanup');
  console.log('  plant paths on disk        :', [PLANT_OPEN, PLANT_IGN].filter((p) => existsSync(join(ROOT, p))));
  console.log('  index entry for open plant :', git('ls-files', '--error-unmatch', PLANT_OPEN).status === 0);
  console.log('  porcelain lines for unit   :', JSON.stringify(porcelain));
  const d5 = drive();
  const f5 = show('D5 post-cleanup', d5);
  console.log('  byte-identical to D0       :', d0 ? Buffer.compare(d0.stdout, d5.stdout) === 0 : 'n/a');

  console.log('\nVERDICTS');
  for (const [k, v] of Object.entries({ P1, P2, P3, P4a, P4b, P5a, P5b })) {
    console.log(`  ${k}: ${v === null ? 'NOT REACHED' : v ? 'TRUE' : 'FALSE'}`);
  }
  console.log('  (P6 is the landing condition and is measured outside this arm, across the commit.)');
  void relative; void f5;
}
