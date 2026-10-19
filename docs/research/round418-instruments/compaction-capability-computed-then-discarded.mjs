/**
 * Round 418 — is `DiscoveredModel.capabilities.compaction` read by anything that
 * decides whether to send the compaction beta?
 *
 * Klatch's beta call site passes `betas: ['compact-2026-01-12']` and a
 * `context_management` edit. The gate on that branch is
 * `compactionEnabled = channel?.source !== 'native'` — channel provenance. The
 * question this instrument answers is whether the MODEL's own advertised
 * capability is consulted anywhere on that path.
 *
 * Population: tracked files at a stamped rev, selected with `git ls-tree` and
 * read with `git show`. NOT `git ls-files` and not the worktree — a staged or
 * dirty index moves an `ls-files` figure in both directions, so a figure keyed
 * on it is not recoverable from the rev it is stamped with (Round 416).
 *
 * Drive: node docs/research/round418-instruments/compaction-capability-computed-then-discarded.mjs [rev]
 */
import { execFileSync } from 'node:child_process';

const REV = process.argv[2] ?? 'HEAD';
const rev = execFileSync('git', ['rev-parse', REV], { encoding: 'utf8' }).trim();
console.log('REV STAMP:', rev, '(resolved from', JSON.stringify(REV) + ')');

const tracked = execFileSync('git', ['ls-tree', '-r', '--name-only', rev, '--', 'packages/'], { encoding: 'utf8' })
  .trim().split('\n').filter((p) => /\.(ts|tsx|mts|js|mjs)$/.test(p));
const isTest = (p) => /__tests__|\.test\.|\.spec\./.test(p);
const src = tracked.filter((p) => !isTest(p));
console.log('tracked packages/ source files at that rev:', tracked.length, '| non-test:', src.length, '| test:', tracked.length - src.length);

const read = (p) => execFileSync('git', ['show', `${rev}:${p}`], { encoding: 'utf8' });

// ------------------------------------------------------------------ the keys
// Three ROLES a mention of the capability can play. Keyed separately because a
// single `/compaction/` count cannot tell a write from a read, and a write is
// not evidence that anything consults it.
// Predicates, not bare regexes: my first WRITES key was
// `/compaction\s*:\s*(?!boolean)/`, which fires on `compaction: boolean;`
// because `\s*` backtracks to zero width and the lookahead then sees a space
// rather than the word. The role-separation control below caught it. A
// negative lookahead behind a quantified-whitespace atom does not exclude
// what it looks like it excludes.
const DECLARES_RE = /compaction\s*:\s*boolean\b/;
const READS_RE = /\.compaction\b(?!\s*:)/;                      // `x.capabilities.compaction` as a value
const KEYS = {
  DECLARES: (l) => DECLARES_RE.test(l),
  WRITES: (l) => /compaction\s*:/.test(l) && !DECLARES_RE.test(l), // `compaction: false` / `compaction: caps…`
  READS: (l) => READS_RE.test(l),
};

// CONTROLS — each key must fire on a driven line that carries the real shape,
// and must REFUSE the other two roles' shapes. A key that cannot separate the
// roles cannot support the claim "computed but never read".
const CTRL = {
  DECLARES: '    compaction: boolean;',
  WRITES: '      compaction: false,',
  READS: "    expect(opus.capabilities.compaction).toBe(true);",
};
let gate = true;
console.log('\n=== CONTROLS: each key fires on its own role and refuses the other two ===');
for (const [role, fn] of Object.entries(KEYS)) {
  const own = fn(CTRL[role]);
  const others = Object.entries(CTRL).filter(([r]) => r !== role).map(([r, line]) => [r, fn(line)]);
  const clean = own && others.every(([, fired]) => !fired);
  console.log(`  ${role.padEnd(9)} fires on own shape: ${own} | leaks onto: ${others.filter(([, f]) => f).map(([r]) => r).join(',') || 'none'} ${clean ? 'OK' : 'FAIL'}`);
  if (!clean) gate = false;
}
// And each control line must be a SLICE of a tracked file at this rev, not an
// analogy — otherwise the controls grade a string I invented.
console.log('\n=== CONTROLS are slices of the tree at this rev ===');
for (const [role, line] of Object.entries(CTRL)) {
  const where = tracked.filter((p) => read(p).split('\n').some((l) => l === line));
  console.log(`  ${role.padEnd(9)} occurs verbatim in ${where.length} tracked file(s): ${where.join(', ') || '<NONE — not a slice>'}`);
  if (where.length === 0) gate = false;
}
if (!gate) {
  console.log('\nVERDICT: REFUSED — a key or a control failed; not publishing a census from it.');
  process.exit(1);
}

// ------------------------------------------------------------------ census
const rows = [];
for (const p of tracked) {
  const lines = read(p).split('\n');
  lines.forEach((l, i) => {
    for (const [role, fn] of Object.entries(KEYS)) {
      if (fn(l)) rows.push({ p, n: i + 1, role, l: l.trim(), test: isTest(p) });
    }
  });
}
console.log('\n=== CENSUS of capabilities.compaction, by role ===');
for (const role of Object.keys(KEYS)) {
  const all = rows.filter((r) => r.role === role);
  const prod = all.filter((r) => !r.test);
  console.log(`\n${role}: ${all.length} total | ${prod.length} in NON-TEST source | ${all.length - prod.length} in tests`);
  for (const r of all) console.log(`   ${r.test ? 'test' : 'SRC '} ${r.p}:${r.n}  ${r.l.slice(0, 115)}`);
}

const prodReads = rows.filter((r) => r.role === 'READS' && !r.test);
const prodWrites = rows.filter((r) => r.role === 'WRITES' && !r.test);

// ----------------------------------------------- what actually gates the beta
const CLIENT = 'packages/server/src/claude/client.ts';
const cl = read(CLIENT).split('\n');
const gateLines = cl.map((l, i) => ({ n: i + 1, l })).filter((x) => /const compactionEnabled\s*=/.test(x.l));
const betaBranch = cl.map((l, i) => ({ n: i + 1, l })).filter((x) => /if \(options\?\.compactionEnabled\)/.test(x.l));
const betaParam = cl.map((l, i) => ({ n: i + 1, l })).filter((x) => /betas:\s*\[/.test(x.l));
console.log('\n=== what gates the beta call, at this rev ===');
for (const x of [...gateLines, ...betaBranch, ...betaParam]) console.log(`   ${CLIENT}:${x.n}  ${x.l.trim().slice(0, 115)}`);
const gateMentionsCapability = [...gateLines, ...betaBranch].some((x) => /compaction\b/.test(x.l) && /capabilit|\.compaction/.test(x.l));
console.log('   does any gate expression consult a model capability?', gateMentionsCapability);

// CONTROL for this leg: the key that found the gate must be able to MISS, so
// prove it refuses a crippled variant rather than matching anything.
console.log('   CONTROL — gate key refuses a near-miss line:',
  /const compactionEnabled\s*=/.test('  const compactionDisabled = true;') === false);

console.log('\nSUMMARY:',
  `rev ${rev.slice(0, 8)} |`,
  `capabilities.compaction DECLARED ${rows.filter((r) => r.role === 'DECLARES').length}×,`,
  `WRITTEN ${prodWrites.length}× in non-test source,`,
  `READ ${prodReads.length}× in non-test source |`,
  `beta gate expressions found: ${gateLines.length}, none consulting capability: ${!gateMentionsCapability}`);
console.log(prodReads.length === 0
  ? 'VERDICT: COMPUTED AND DISCARDED — the capability is written in non-test source and read nowhere in it.'
  : `VERDICT: READ ${prodReads.length}× in product source — the "discarded" claim does NOT hold.`);
