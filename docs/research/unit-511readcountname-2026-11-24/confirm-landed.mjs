/**
 * unit-511 confirmation leg — **grade the LANDED file against a member, in a repo that has one.**
 *
 * The live tree contains **zero** unreadable tracked code files, so the live drive cannot tell a
 * working cure from a no-op: it reports `0 unreadable` either way. `unit-510` §3's lesson, which
 * this seat wrote eight lines after shipping the gap it names — *between an arm grading a
 * substituted copy and a live drive against a tree with no member, nothing had driven the file that
 * ships against a path that triggers the defect.* So this leg copies the gate **verbatim, no
 * substitution**, into a synthetic repo that HAS the member.
 *
 * **P7, registered before this file existed: the leg must be unable to pass on an uncured file.**
 * It therefore slices the cured state out of the gate's **own source** first — `filesRead += 1` in
 * the loop and `tracked files read: ${filesRead}` at the emit — and refuses if either is missing.
 * A silently-uncopied cure reddens the leg instead of greening it.
 *
 * Cells differ **only** in whether the member is linked into the worktree:
 *   `A-PRESENT`  — member staged AND on disk. Control: the cure must not cry wolf.
 *   `A-UNLINKED` — member staged, then removed from the worktree. The defect's cell.
 *
 * **No `brace-slicer-deliberate:` marker, and that is the stronger claim**: the fixture member below
 * contains a brace comparison **built from char codes**, so this file never holds the literal and
 * does not become a new `UNGUARDED` member of the gate it measures — there is nothing here for a
 * marker to exempt, and a marker on an out-of-population file only joins the reported dead-marker
 * list.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const CAPS = join(HERE, 'captures');
mkdirSync(CAPS, { recursive: true });
const PRE_REG_COMMIT = '7ae1eb18';
const GATE_REL = 'scripts/verify-decl-body-slicers.mjs';

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const sha8 = (b) => createHash('sha256').update(b).digest('hex').slice(0, 8);

/* ---------------------------------------------- P7: the pre-flight that makes failure possible */
const curedSrc = readFileSync(join(ROOT, GATE_REL), 'utf8');
const uncuredSrc = execFileSync('git', ['-C', ROOT, 'show', `${PRE_REG_COMMIT}:${GATE_REL}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const CURE_MARKS = ['filesRead += 1', 'tracked files read: ${filesRead}', 'unreadableFiles.length} unreadable'];
const curedHas = CURE_MARKS.filter((m) => curedSrc.includes(m));
const uncuredHas = CURE_MARKS.filter((m) => uncuredSrc.includes(m));
say(`unit-511 confirmation leg — landed gate ${sha8(curedSrc)} / ${Buffer.byteLength(curedSrc)} B`);
say('');
say('§0  P7 pre-flight — the cured state is SLICED out of the subject, not assumed');
say(`  cure marks present in the LANDED file:   ${curedHas.length} of ${CURE_MARKS.length}  ${JSON.stringify(curedHas)}`);
say(`  cure marks present in ${PRE_REG_COMMIT} (uncured): ${uncuredHas.length} of ${CURE_MARKS.length}`);
if (curedHas.length !== CURE_MARKS.length || uncuredHas.length !== 0) {
  say('  REFUSED — the subject is not in the state this leg is written to grade.');
  writeFileSync(join(CAPS, 'CONFIRM-LANDED.out'), `${out.join('\n')}\n`);
  process.exit(2);
}
say('  OK — the landed file carries all three and the pre-reg file carries none, so this leg');
say('  cannot pass on an uncured copy.');
say('');

/* ---------------------------------------------- the fixture member */
// An unguarded hand-rolled brace-balance body slicer: exactly what the gate's population key looks
// for. Written from char codes so THIS file is not one.
const OB = String.fromCharCode(123);
const CB = String.fromCharCode(125);
const Q = String.fromCharCode(39);
const member = [
  'export const sliceBody = (src, from) => {',
  '  let d = 0;',
  '  for (let i = from; i < src.length; i += 1) {',
  `    if (src[i] === ${Q}${OB}${Q}) d += 1;`,
  `    if (src[i] === ${Q}${CB}${Q}) { d -= 1; if (d === 0) return src.slice(from, i + 1); }`,
  '  }',
  '  return null;',
  '};',
  '',
].join('\n');

const git = (dir, ...args) => execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8' });
const buildCell = (gateSrc, unlink) => {
  const dir = mkdtempSync(join(tmpdir(), 'u511-'));
  git(dir, 'init', '-q');
  git(dir, 'config', 'user.email', 'leg@example.invalid');
  git(dir, 'config', 'user.name', 'unit-511 leg');
  mkdirSync(join(dir, 'scripts', 'lib'), { recursive: true });
  mkdirSync(join(dir, 'src'), { recursive: true });
  writeFileSync(join(dir, GATE_REL), gateSrc);                       // verbatim, no substitution
  cpSync(join(ROOT, 'scripts', 'lib', 'strip-source.mjs'), join(dir, 'scripts', 'lib', 'strip-source.mjs'));
  writeFileSync(join(dir, 'scripts', 'decl-body-slicers.baseline'), '');  // empty: any member is NEW
  writeFileSync(join(dir, 'src', 'a.mjs'), member);
  git(dir, 'add', '-A');
  if (unlink) rmSync(join(dir, 'src', 'a.mjs'));
  const r = spawnSync('node', [join(dir, GATE_REL)], { cwd: dir, encoding: 'utf8' });
  const text = `${r.stdout}${r.stderr}`;
  const num = (label) => {
    const m = text.match(new RegExp(`${label}[^0-9]*([0-9]+)`));
    return m ? Number(m[1]) : null;
  };
  // **REPAIRED MID-FIRE, and the repair moved a graded cell from HIT to REFUTED** — see RESULTS §5.
  // The cured line reads `of 1080 tracked code file(s) in scope, 1 excluded …`, so the figure sits
  // to the LEFT of the phrase. `num()` captures to the RIGHT, so it returned the *self-excluded*
  // count and P6.d was green on my own extraction bug. A figure's position relative to its label is
  // part of the reader, not a detail.
  const numLeft = (phrase) => {
    const m = text.match(new RegExp(`([0-9]+) ${phrase}`));
    return m ? Number(m[1]) : null;
  };
  const res = {
    rc: r.status,
    read: num('tracked files read'),
    inScope: numLeft('tracked code file\\(s\\) in scope'),
    unreadable: (text.match(/([0-9]+) unreadable/) || [])[1] ?? null,
    pop: num('population \\(compares against both braces\\)'),
    namesMember: text.includes('src/a.mjs'),
    namesUnreadable: text.includes('UNREADABLE —'),
  };
  rmSync(dir, { recursive: true, force: true });
  return res;
};

const cells = [
  ['G0_uncured', 'A-PRESENT', uncuredSrc, false],
  ['G0_uncured', 'A-UNLINKED', uncuredSrc, true],
  ['G1_landed', 'A-PRESENT', curedSrc, false],
  ['G1_landed', 'A-UNLINKED', curedSrc, true],
];
const rows = cells.map(([gate, cell, src, unlink]) => ({ gate, cell, ...buildCell(src, unlink) }));

say('§1  four cells — gate × whether the member is linked. Cells differ ONLY in that.');
say('  gate        cell         rc  read  inScope  unreadable  pop  names member  names UNREADABLE');
for (const r of rows) {
  say(`  ${r.gate.padEnd(11)} ${r.cell.padEnd(12)} ${String(r.rc).padStart(2)}  ${String(r.read).padStart(4)}  ${String(r.inScope).padStart(7)}  ${String(r.unreadable).padStart(10)}  ${String(r.pop).padStart(3)}  ${String(r.namesMember).padEnd(12)}  ${r.namesUnreadable}`);
}
say('');

/* ---------------------------------------------- the graded claims */
const get = (g, c) => rows.find((r) => r.gate === g && r.cell === c);
const checks = [
  ['P6.a uncured A-UNLINKED reports a read that did not happen (read 1, pop 0, rc 0)',
    get('G0_uncured', 'A-UNLINKED').read === 1 && get('G0_uncured', 'A-UNLINKED').pop === 0 && get('G0_uncured', 'A-UNLINKED').rc === 0],
  ['P6.b cured A-UNLINKED reports read 0',
    get('G1_landed', 'A-UNLINKED').read === 0],
  ['P6.c cured A-UNLINKED reports 1 unreadable and NAMES it',
    get('G1_landed', 'A-UNLINKED').unreadable === '1' && get('G1_landed', 'A-UNLINKED').namesUnreadable],
  ['P6.d cured A-UNLINKED keeps the in-scope figure at 1, so the drop is self-explaining',
    get('G1_landed', 'A-UNLINKED').inScope === 1],
  ['P6.e control — cured A-PRESENT reports read 1, 0 unreadable, and does NOT print the class',
    get('G1_landed', 'A-PRESENT').read === 1 && get('G1_landed', 'A-PRESENT').unreadable === '0' && !get('G1_landed', 'A-PRESENT').namesUnreadable],
  ['P6.f control — cured A-PRESENT still reddens on the member (rc 1, member named)',
    get('G1_landed', 'A-PRESENT').rc === 1 && get('G1_landed', 'A-PRESENT').namesMember],
  ['P6.g separation — the two gates DIFFER on A-UNLINKED (otherwise the cure does nothing)',
    get('G0_uncured', 'A-UNLINKED').read !== get('G1_landed', 'A-UNLINKED').read],
  ['P6.h sameness — the two gates AGREE on read/pop/rc for A-PRESENT (the cure moves only the gap)',
    get('G0_uncured', 'A-PRESENT').read === get('G1_landed', 'A-PRESENT').read
      && get('G0_uncured', 'A-PRESENT').pop === get('G1_landed', 'A-PRESENT').pop
      && get('G0_uncured', 'A-PRESENT').rc === get('G1_landed', 'A-PRESENT').rc],
];
say('§2  graded');
let hit = 0;
for (const [name, ok] of checks) {
  if (ok) hit += 1;
  say(`  ${ok ? 'HIT ' : 'MISS'} ${name}`);
}
say('');
say(`  ${hit} of ${checks.length} hit`);
say('');
say('§3  what this leg does NOT establish, named rather than implied');
say('  - The verdict does not flip in these cells: the member keeps the gate red on A-PRESENT, and');
say('    on A-UNLINKED the population is empty either way, so rc is the SAME under both gates.');
say('    Read these rows on rc alone and the cure looks like a no-op. The figures are the subject.');
say('  - Nothing here re-grades the path-quoting cure of unit-510; the member name is plain ASCII.');

writeFileSync(join(CAPS, 'CONFIRM-LANDED.out'), `${out.join('\n')}\n`);
writeFileSync(join(CAPS, 'CONFIRM-LANDED.json'), `${JSON.stringify({ gateSha: sha8(curedSrc), bytes: Buffer.byteLength(curedSrc), rows, checks: checks.map(([n, ok]) => ({ n, ok })), hit, total: checks.length }, null, 2)}\n`);
