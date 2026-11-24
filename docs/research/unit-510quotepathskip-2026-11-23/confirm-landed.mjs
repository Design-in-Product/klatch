/**
 * unit-510 — confirmation leg: the LANDED file, against a member.
 *
 * Why this exists as its own leg. The arm graded `G3` as a **substituted copy** of the gate inside
 * a synthetic repository, and `LIVE-PRE-CURE` / `LIVE-POST-CURE` graded the **landed** file against
 * the **live tree, which contains no member** (0 of the 8 quoted paths carry a code extension —
 * that is the whole reason the cure was free). So between them, nothing had yet driven *the file
 * that ships* against *a path that triggers the defect*. A cure verified only as a copy, plus a
 * landed file verified only where the defect cannot fire, is two green legs and an untested cure.
 *
 * This leg copies the gate **as it now stands on disk** — no substitution of any kind — into a
 * synthetic repository and drives it against the three cells the cure claims to close plus the two
 * controls and the one cell it explicitly does not close.
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
const NUL = String.fromCharCode(0);
const sha = (b) => createHash('sha256').update(b).digest('hex').slice(0, 8);
const must = (c, m) => { if (!c) { console.error(`confirm: BLOCKED — ${m}`); process.exit(2); } };

const gateBytes = readFileSync(join(ROOT, GATE_REL));
console.log(`landed gate: ${GATE_REL} sha ${sha(gateBytes)} (${gateBytes.length} bytes) — copied verbatim, no substitution`);

// Assert the landed file really is the cured reader, by slicing its own source rather than
// trusting that an edit happened. A confirmation leg that would pass on the uncured file is not a
// confirmation of anything.
const src = gateBytes.toString('utf8');
must(src.includes("'ls-files', '-z'"), 'landed gate does not carry the -z flag');
must(src.includes(".split('\\0').filter(Boolean);"), 'landed gate does not carry the NUL split');
must(!src.includes(".split('\\n').map((l) => l.trim()).filter(Boolean);"), 'landed gate still carries the trimming newline split');
console.log('landed gate verified by source slice: -z present, NUL split present, trimming split absent');

const OPEN = String.fromCharCode(123);
const CLOSE = String.fromCharCode(125);
const Q = String.fromCharCode(39);
const ch = (c) => `${Q}${c}${Q}`;
const naiveSlicer = [
  '// unit-510 confirmation fixture, nothing declared at this site',
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

const CELLS = [
  { name: 'A-ASCII', rel: 'src/ab.mjs', expect: 'RED' },
  { name: 'A-SPACE', rel: `src/a${String.fromCharCode(32)}b.mjs`, expect: 'RED' },
  { name: 'A-NONASCII', rel: `src/a${String.fromCharCode(0xe4)}.mjs`, expect: 'RED' },
  { name: 'A-DQUOTE', rel: `src/a${String.fromCharCode(34)}b.mjs`, expect: 'RED' },
  { name: 'A-LEADSPACE', rel: `${String.fromCharCode(32)}src/a.mjs`, expect: 'RED' },
  { name: 'A-UNLINKED', rel: 'src/ab.mjs', unlink: true, expect: 'OK (not cured, by declared limit)' },
];

const num = (text, label) => {
  const m = text.match(new RegExp(`${label}[^\\n]*?(\\d+)`));
  return m ? Number(m[1]) : null;
};

console.log('');
console.log(`${'cell'.padEnd(12)}  rc  read  pop  UNG  verdict  expected`);
const rows = [];
for (const cell of CELLS) {
  const SYN = mkdtempSync(join(tmpdir(), 'u510c-'));
  execFileSync('git', ['-C', SYN, 'init', '-q']);
  mkdirSync(join(SYN, 'scripts'), { recursive: true });
  cpSync(join(ROOT, GATE_REL), join(SYN, GATE_REL));
  cpSync(join(ROOT, 'scripts', 'lib'), join(SYN, 'scripts', 'lib'), { recursive: true });
  writeFileSync(join(SYN, 'scripts', 'decl-body-slicers.baseline'),
    '# unit-510 confirmation: deliberately empty baseline\n');
  const target = join(SYN, cell.rel);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, naiveSlicer);
  must(existsSync(target), `UNCREATABLE: ${cell.rel}`);
  execFileSync('git', ['-C', SYN, 'add', '--', cell.rel]);
  const indexed = execFileSync('git', ['-C', SYN, 'ls-files', '-z'], { encoding: 'utf8' })
    .split(NUL).filter(Boolean);
  must(indexed.length === 1, `expected 1 indexed path, got ${indexed.length}`);
  if (cell.unlink) rmSync(target);

  const r = spawnSync('node', [join(SYN, GATE_REL)], { encoding: 'utf8' });
  const out = r.stdout ?? '';
  writeFileSync(join(CAP, `LANDED-${cell.name}.out`), out);
  writeFileSync(join(CAP, `LANDED-${cell.name}.err`), r.stderr ?? '');
  const row = {
    cell: cell.name,
    rc: r.status,
    read: num(out, 'tracked files read:'),
    pop: num(out, 'population \\(compares against both braces\\):'),
    unguarded: num(out, 'UNGUARDED'),
    ok: out.includes('DECL-BODY SLICERS OK'),
    expect: cell.expect,
  };
  rows.push(row);
  console.log(
    `${row.cell.padEnd(12)}  ${String(row.rc).padStart(2)}  ${String(row.read).padStart(4)}`
    + `  ${String(row.pop).padStart(3)}  ${String(row.unguarded).padStart(3)}`
    + `  ${row.ok ? 'OK     ' : 'RED    '}  ${row.expect}`,
  );
  rmSync(SYN, { recursive: true, force: true });
}

const reddens = rows.filter((r) => r.rc === 1 && r.pop === 1 && r.unguarded === 1 && !r.ok);
const greens = rows.filter((r) => r.rc === 0 && r.pop === 0 && r.ok);
console.log('');
console.log(`LANDED gate: reddens ${reddens.length}/6 [${reddens.map((r) => r.cell).join(' ')}]`);
console.log(`             green   ${greens.length}/6 [${greens.map((r) => r.cell).join(' ')}]`);
const pass = reddens.length === 5 && greens.length === 1 && greens[0].cell === 'A-UNLINKED';
console.log('');
console.log(pass
  ? 'CONFIRMED — the landed file, driven as itself, reddens all five path-shaped cells and is green on'
    + ' exactly the one cell this unit declared it does not close.'
  : 'NOT CONFIRMED — the landed file does not match the arm\'s G3 reading. See the rows above.');
writeFileSync(join(CAP, 'confirm-landed.json'), `${JSON.stringify({ gateSha: sha(gateBytes), rows, pass }, null, 2)}\n`);
process.exit(pass ? 0 : 1);
