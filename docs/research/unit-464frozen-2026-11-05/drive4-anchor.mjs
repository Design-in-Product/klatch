// unit-464frozen — drive4: the four arms registered in ADDENDUM.md, at conjunct level.
//
//   node docs/research/unit-464frozen-2026-11-05/drive4-anchor.mjs      (from the repo root)
//
// Same harness as drive1: a same-depth copy per arm, one mutation, cwd = arm root, A0 of drive1 is
// the matched baseline these inherit. The RED SET is `{GENTRY}` for three of the four arms, so the
// graded cell here is the leg's own `FAILED:` list and its `SPAN:` clause, not just the verdict.
// [[feedback_a_saturated_verdict_hides_a_reason_level_cause]]
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const PREC = 'docs/research/unit-464prec-2026-11-03/';
const ORDER = 'docs/research/unit-464order-2026-11-02/';
const CONV = 'docs/research/LEG-CLASS-CONVENTION.md';
const SUBJECT = PREC + 'grade-entry-v15.mjs';
const SCRATCH = 'docs/research/unit-464frozen-2026-11-05/.arms4';
const FILES = [
  SUBJECT, CONV, ORDER + 'HAND-AXES-13.tsv',
  PREC + 'drive5.prec.out', PREC + 'drive6.cripple-preckey.out', PREC + 'drive7.cripple-hkonly.out',
  PREC + 'drive6.delta-vs-drive5.txt', PREC + 'drive7.delta-vs-drive5.txt',
];
const g = (a) => execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const top = g(['rev-parse', '--show-toplevel']);
if (resolve(top) !== resolve(process.cwd())) { console.log(`REFUSE — cwd is not ${top}`); process.exit(2); }
console.log(`subject rev (HEAD) ${g(['rev-parse', 'HEAD'])} · subject blob ${g(['rev-parse', `HEAD:${SUBJECT}`]).slice(0, 12)}`);

const HEAD_RE = /^### 2\.1g /m;
const PARTB_RE = /^## Part B — the/m;
const bodyDigit = (t) => {
  const i = t.indexOf('### 2.1g');
  if (i < 0) throw new Error('### 2.1g absent');
  const nl = t.indexOf('\n', i);
  if (nl < 0) throw new Error('entry heading has no body');
  const d = t.slice(nl).search(/[0-9]/) + nl;
  const ch = t[d] === '9' ? '8' : String(Number(t[d]) + 1);
  console.log(`   (A8FIGURE: first digit of the entry BODY at byte ${d} = "${t[d]}" -> "${ch}")`);
  return t.slice(0, d) + ch + t.slice(d + 1);
};
const rename = (t) => {
  if (!HEAD_RE.test(t)) throw new Error('line-start heading absent');
  return t.replace(HEAD_RE, '### 2.1G ');
};
const dropTail = (t) => {
  const m = t.match(PARTB_RE);
  if (!m) throw new Error('Part B absent');
  console.log(`   (tail dropped at byte ${m.index}, ${t.length - m.index} bytes removed)`);
  return t.slice(0, m.index);
};

const ARMS = [
  ['A8FIGURE', bodyDigit, { red: ['GENTRY'], failed: ['FROZEN'] }],
  ['A9RENAME', rename, { red: ['GENTRY'], failed: ['SHAPE', 'FROZEN'], spanHas: '5106 bytes', spanLacks: 'start anchor absent' }],
  ['A10TAILONLY', dropTail, { red: [], failed: [] }],
  ['A11BOTH', (t) => dropTail(rename(t)), { red: ['GENTRY'], spanHas: 'start anchor absent' }],
];

rmSync(SCRATCH, { recursive: true, force: true });
mkdirSync(SCRATCH, { recursive: true });
writeFileSync(`${SCRATCH}/.gitignore`, '*\n');
const rows = [];
for (const [arm, mut, expect] of ARMS) {
  const root = `${SCRATCH}/${arm}`;
  for (const d of [PREC, ORDER, 'docs/research/']) mkdirSync(`${root}/${d}`, { recursive: true });
  for (const f of FILES) writeFileSync(`${root}/${f}`, readFileSync(f));
  console.log('');
  console.log(`== ${arm}  ${CONV}`);
  const before = readFileSync(`${root}/${CONV}`, 'utf8');
  let after;
  try { after = mut(before); } catch (e) { console.log(`   MUTATION REFUSED: ${e.message}`); rows.push([arm, 'REFUSED', expect, null, '']); continue; }
  if (after === before) { console.log('   MUTATION NO-OP — arm abandoned'); rows.push([arm, 'NOOP', expect, null, '']); continue; }
  writeFileSync(`${root}/${CONV}`, after);
  console.log(`   landed: ${before.length} -> ${after.length} bytes`);
  console.log(`   anchor occurrences in the arm's copy: literal ${[...after.matchAll(/### 2\.1g/g)].length} · line-start headings ${[...after.matchAll(/^### 2\.1g/gm)].length}`);
  let out = '', err = '', status = 0;
  try {
    out = execFileSync(process.execPath, [resolve(root, SUBJECT)], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28 });
  } catch (e) { out = e.stdout ?? ''; err = e.stderr ?? ''; status = e.status ?? -1; }
  const verdicts = [...out.matchAll(/^ {3}(ok|RED) +(G[A-Z0-9]+) /gm)].map((m) => [m[2], m[1]]);
  const red = verdicts.filter(([, v]) => v === 'RED').map(([n]) => n);
  const gentry = (out.match(/^ {3}(?:ok|RED) +GENTRY +(.*)$/m) ?? ['', ''])[1];
  const failed = (gentry.match(/FAILED: (.*)$/) ?? ['', ''])[1].split(', ').filter(Boolean);
  const spanClause = (gentry.match(/SPAN: ([^·]*)/) ?? ['', ''])[1].trim();
  if (verdicts.length !== 6) { console.log(`   REFUSED — ${verdicts.length} leg lines · stderr ${err.slice(0, 200)}`); rows.push([arm, 'REFUSED', expect, red, '']); continue; }
  console.log(`   exit ${status} · ${(out.match(/^(GREEN|RED) — .*$/m) ?? [''])[0]}`);
  console.log(`   GENTRY SPAN:   ${spanClause}`);
  console.log(`   GENTRY FAILED: ${failed.length ? failed.join(', ') : '(none)'}`);
  console.log(`   GENTRY note:   ${gentry}`);
  rows.push([arm, 'GRADED', expect, red, gentry, failed, spanClause]);
}

console.log('');
console.log('== MATRIX — registered cell vs measured (conjunct level)');
const eq = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
let hit = 0;
for (const [arm, kind, expect, red, , failed, spanClause] of rows) {
  const checks = [];
  if (kind !== 'GRADED') checks.push([`graded`, false]);
  else {
    checks.push([`red=${expect.red.length ? `{${expect.red.join(',')}}` : '∅'}`, eq(expect.red, red)]);
    if (expect.failed) checks.push([`FAILED=${expect.failed.length ? expect.failed.join('+') : '(none)'}`, eq(expect.failed, failed ?? [])]);
    if (expect.spanHas) checks.push([`SPAN has "${expect.spanHas}"`, (spanClause ?? '').includes(expect.spanHas)]);
    if (expect.spanLacks) checks.push([`SPAN lacks "${expect.spanLacks}"`, !(spanClause ?? '').includes(expect.spanLacks)]);
  }
  const ok = checks.every(([, c]) => c);
  if (ok) hit += 1;
  console.log(`   ${ok ? 'HIT ' : 'MISS'} ${arm.padEnd(12)} ${checks.map(([n, c]) => `${c ? '✓' : '✗'} ${n}`).join(' · ')}`);
  if (kind === 'GRADED' && !ok) console.log(`        measured: red ${red.length ? `{${red.join(',')}}` : '∅'} · FAILED ${(failed ?? []).join('+') || '(none)'} · SPAN "${spanClause}"`);
}
console.log('');
console.log(`${hit} of ${rows.length} arms hit their registered cell`);
