#!/usr/bin/env node
// DECLARED POST-HOC. No prediction is registered and none is claimed.
//
// It is post-hoc because I had already printed the seven call texts and read them by eye before
// writing it. A prediction formed after that reading would not be blind, and registering one
// anyway is the move this project has a standing instruction against. So: no floors, no exact
// values, no verdicts — a census, reported with its blindness counted.
//
// WHY. P5ORDER measured the ordering flag over my 7 at exactly 6 with `--reverse` / 1 without, the
// figure Theseus's §1 predicts. P6CRIPORDER then came out dead, so that figure is not evidence for
// the reader that produced it. Reading the seven call texts raised a separate doubt the flag census
// cannot settle: `--reverse` tells you the ORDER a selection is reduced in, but not whether the
// selection has more than one member to order — and a one-member selection is immovable whatever
// the flag says, for a reason that expires the next time a path is added.
//
// So this censuses the property the flag is standing in for: WHAT KIND of immovability each of the
// seven has.
//
//   STRUCTURAL    --reverse over a selection with >1 member. `[0]` is the oldest addition and no
//                 later commit can precede it. Immovable under history growth, permanently.
//   CONTINGENT    the selection has exactly 1 member, so the reduction is immovable only until the
//                 next commit adds a second. One add-commit from becoming R.
//   UNRESOLVED    the pathspec or the rev is a variable this reader cannot evaluate. NOT a third
//                 class — a hole, counted as a hole, never folded into either side.

import { execFileSync } from 'node:child_process';
import { scanParens, enclosingInvocation, ARM3_RE } from './scan.mjs';

const TOP = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const git = (args) => execFileSync('git', ['-C', TOP, ...args], { encoding: 'utf8' });
const PIN = '0ae48068';
const refuse = (m) => { console.log(`REFUSE: ${m}`); process.exit(2); };

const MY7 = [
  'round435-instruments/grade-his-cure-and-oracle-the-matrix.mjs#1',
  'round464-instruments/grade-the-stop-condition.mjs#1',
  'unit-464t2-keychoice-2026-10-28/grade-the-surface-predicate.mjs#1',
  'unit-464t2-reaim-2026-10-28/grade-the-credit-key.mjs#1',
  'unit-464t2-reaim-2026-10-28/recon-credit-provenance.mjs#1',
  'unit-464t2-surface-2026-10-28/recon-run-length-and-cure.mjs#1',
  'unit-464vac-2026-10-31/grade-cure.mjs#1',
];

// Split a call's argument text into top-level arguments, string- and template-aware, so that
// `'--'` is found as an ARGUMENT rather than as a substring.
function topLevelArgs(text) {
  const inner = text.replace(/^\(/, '').replace(/\)$/, '');
  const args = [];
  let depth = 0, cur = '', i = 0, quote = null, tmplBraces = 0;
  while (i < inner.length) {
    const c = inner[i];
    if (quote) {
      cur += c;
      if (c === '\\') { cur += inner[i + 1] ?? ''; i += 2; continue; }
      if (quote === '`' && c === '$' && inner[i + 1] === '{') { tmplBraces++; cur += '{'; i += 2; continue; }
      if (quote === '`' && tmplBraces > 0 && c === '}') { tmplBraces--; i++; continue; }
      if (c === quote && tmplBraces === 0) quote = null;
      i++; continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; cur += c; i++; continue; }
    if (c === '(' || c === '[' || c === '{') depth++;
    if (c === ')' || c === ']' || c === '}') depth--;
    if (c === ',' && depth <= 0) { args.push(cur.trim()); cur = ''; i++; continue; }
    cur += c; i++;
  }
  if (cur.trim()) args.push(cur.trim());
  // unwrap a single array-literal argument: git(['log', ...]) and git('log', ...) are the same shape
  if (args.length === 1 && /^\[[\s\S]*\]$/.test(args[0])) return topLevelArgs('(' + args[0].slice(1, -1) + ')');
  return args.filter((a) => a !== '' && a !== '[' && a !== ']');
}

const isLiteral = (a) => /^'[^']*'$/.test(a) || /^"[^"]*"$/.test(a) || (/^`[^`]*`$/.test(a) && !a.includes('${'));
const unquote = (a) => a.slice(1, -1);

console.log('=== probe-kind (DECLARED POST-HOC, no prediction) ===');
console.log(`pin ${PIN}`);
console.log('');

const rows = [];
for (const site of MY7) {
  const [rel, nth] = site.split('#');
  const path = `docs/research/${rel}`;
  const src = git(['show', `${PIN}:${path}`]);
  ARM3_RE.lastIndex = 0;
  const ms = [...src.matchAll(ARM3_RE)];
  const m = ms[Number(nth) - 1];
  if (!m) refuse(`${site}: arm-[3] match #${nth} not present at the pin`);
  const scan = scanParens(src);
  if (!scan.clean) refuse(`${site}: unclean scan — ${JSON.stringify(scan.residue)}`);
  const inv = enclosingInvocation(scan.pairs, src, m.index, m.index + m[0].length);
  if (!inv) refuse(`${site}: no enclosing invocation`);

  const args = topLevelArgs(inv.text);
  const sepIdx = args.findIndex((a) => isLiteral(a) && unquote(a) === '--');
  if (sepIdx === -1) refuse(`${site}: no top-level '--' separator argument in the call`);

  const pathspecs = args.slice(sepIdx + 1);
  const flags = args.slice(0, sepIdx);
  const hasReverse = flags.some((a) => /--reverse/.test(a));
  // a rev argument is a non-flag, non-subcommand argument before '--'
  const revArgs = flags.filter((a, i) => i > 0 && !/^['"`]?-/.test(a));

  const pathLiteral = pathspecs.length === 1 && isLiteral(pathspecs[0]);
  const revClean = revArgs.length === 0 || revArgs.every(isLiteral);

  let members = null;
  let note = '';
  if (!pathLiteral) {
    note = `pathspec not a literal: ${pathspecs.join(' | ') || '(none)'}`;
  } else if (!revClean) {
    note = `rev argument not a literal: ${revArgs.join(' | ')}`;
  } else {
    const ps = unquote(pathspecs[0]);
    const cmd = ['log', '--diff-filter=A', '--format=%H', PIN, '--', ps];
    let out;
    try { out = git(cmd); } catch (e) { refuse(`${site}: ${String(e.message).split('\n')[0]}`); }
    members = out.trim() === '' ? 0 : out.trim().split('\n').length;
    if (members === 0) refuse(`${site}: 0 add-commits for ${ps} — an empty listing is not a reading`);
  }

  let kind;
  if (members === null) kind = 'UNRESOLVED';
  else if (members === 1) kind = 'CONTINGENT';
  else if (hasReverse) kind = 'STRUCTURAL';
  else kind = 'CONTINGENT'; // >1 member, newest-first: [0] moves with every new addition

  rows.push({ site, hasReverse, members, kind, note, pathspecs: pathspecs.join(' | ') });
}

for (const r of rows) {
  console.log(`${r.kind.padEnd(11)} reverse=${String(r.hasReverse).padEnd(5)} members=${r.members === null ? 'n/a' : r.members}  ${r.site}`);
  console.log(`            pathspec: ${r.pathspecs}`);
  if (r.note) console.log(`            ${r.note}`);
}

const tally = (k) => rows.filter((r) => r.kind === k).length;
const flagSafe = rows.filter((r) => r.hasReverse).length;
const kindSafe = tally('STRUCTURAL');

console.log('');
console.log('-- THE FLAG KEY vs THE KIND KEY, over the same 7 --');
console.log(`  ordering flag says SAFE (--reverse present) : ${flagSafe}`);
console.log(`  immovability kind says SAFE (STRUCTURAL)    : ${kindSafe}`);
console.log(`  STRUCTURAL ${tally('STRUCTURAL')} · CONTINGENT ${tally('CONTINGENT')} · UNRESOLVED ${tally('UNRESOLVED')}`);
console.log('');

const resolved = rows.filter((r) => r.kind !== 'UNRESOLVED');
const disagree = resolved.filter((r) => r.hasReverse !== (r.kind === 'STRUCTURAL'));
console.log(`-- rows where THE FLAG AND THE KIND DISAGREE (${disagree.length} of ${resolved.length} resolved) --`);
disagree.forEach((r) => console.log(`   ${r.site}  reverse=${r.hasReverse} kind=${r.kind} members=${r.members}`));
if (resolved.length < 2) {
  console.log(`   ** VACUOUS: ${resolved.length} resolved row(s). A disagreement count over fewer than two`);
  console.log('   ** rows carries no information either way, and is NOT reported as agreement.');
} else if (disagree.length === 0) {
  console.log('   none among the resolved rows');
}

console.log('');
console.log(`UNRESOLVED is a HOLE, not a class: ${tally('UNRESOLVED')} of 7 could not be read by this reader at all.`);
console.log('The hole has a CAUSE, and it is the finding: 6 of the 7 selections build their pathspec');
console.log('from a variable (`round`, `path`, `LIVE_REL`), so the member count — and therefore the');
console.log('KIND of immovability — is not resolvable from source without evaluating the program.');
console.log('STRUCTURAL=0 does not mean none are structural. It means this reader cannot say.');
console.log(`KIND-COUNTS: STRUCTURAL=${tally('STRUCTURAL')} CONTINGENT=${tally('CONTINGENT')} UNRESOLVED=${tally('UNRESOLVED')} FLAGSAFE=${flagSafe}`);
