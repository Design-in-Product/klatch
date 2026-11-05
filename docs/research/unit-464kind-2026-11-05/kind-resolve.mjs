#!/usr/bin/env node
// unit-464kind — is the KIND term of v2.2 §2.1n actually ungradable, or was the reader lexical?
//
// Registered in PRE-REGISTRATION.md before this file existed. Two extensions over Daedalus's
// probe-kind, and nothing else:
//   (1) PROP  one-step local constant propagation for a bare-identifier pathspec
//   (2) QUANT quantified resolution of a single-interpolation template pathspec over the range
//             of concrete values the TREE admits at the pin
//
// DECLARED NON-INDEPENDENCE: scan.mjs is HIS, imported unchanged. My located population IS his
// located population and I inherit his scanner's blindness. See PRE-REGISTRATION §1.
//
// topLevelArgs/isLiteral/unquote are RE-IMPLEMENTED here, not imported (they are not exported from
// probe-kind.mjs). P1REPRO is therefore also an equivalence test of this re-implementation against
// his per-row table. If it disagrees on any row, the re-implementation is the suspect, not the tree.

import { execFileSync } from 'node:child_process';
import { scanParens, enclosingInvocation, ARM3_RE } from '../unit-464redkey-2026-11-05/scan.mjs';

const TOP = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const git = (args) => execFileSync('git', ['-C', TOP, ...args], { encoding: 'utf8' });

const argv = process.argv.slice(2);
const opt = (k, d) => {
  const hit = argv.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.slice(k.length + 3) : d;
};
const MODE = opt('mode', 'full');   // his | prop | full
const SCOPE = opt('scope', 'my7');  // my7 | tree | rounds
const PIN = opt('pin', '0ae48068');

if (!['his', 'prop', 'full'].includes(MODE)) { console.log(`REFUSE: unknown mode ${MODE}`); process.exit(2); }
if (!['my7', 'tree', 'rounds'].includes(SCOPE)) { console.log(`REFUSE: unknown scope ${SCOPE}`); process.exit(2); }
const PROP = MODE === 'prop' || MODE === 'full';
const QUANT = MODE === 'full';

// P7REFUSE: the pin is validated BEFORE any count is computed or printed. A reader that prints
// STRUCTURAL=0 CONTINGENT=0 UNRESOLVED=0 off an unreadable tree is green on P4QUANT's shape.
const refuse = (m) => { console.log(`REFUSE: ${m}`); process.exit(2); };
try { git(['rev-parse', '--verify', `${PIN}^{commit}`]); }
catch { refuse(`pin ${PIN} does not resolve to a commit in this repo — no figure is printed`); }

console.log(`=== kind-resolve  mode=${MODE} scope=${SCOPE} pin=${PIN} ===`);
console.log(`extensions: PROP=${PROP} QUANT=${QUANT}`);
console.log('');

// --- his argument model, re-implemented -------------------------------------------------------
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
  if (args.length === 1 && /^\[[\s\S]*\]$/.test(args[0])) return topLevelArgs('(' + args[0].slice(1, -1) + ')');
  return args.filter((a) => a !== '' && a !== '[' && a !== ']');
}
const isLiteral = (a) => /^'[^']*'$/.test(a) || /^"[^"]*"$/.test(a) || (/^`[^`]*`$/.test(a) && !a.includes('${'));
const unquote = (a) => a.slice(1, -1);
const IDENT = /^[A-Za-z_$][\w$]*$/;

// --- extension (1): one-step local constant propagation ---------------------------------------
// Nearest PRECEDING `const <id> = <expr>;` in the same file. One step. No fixpoint, no cross-file.
function propagate(expr, src, beforeIdx) {
  if (!IDENT.test(expr)) return { expr, propagated: false, from: null };
  const re = new RegExp(`\\bconst\\s+${expr.replace(/\$/g, '\\$')}\\s*=\\s*([^;\\n]+);`, 'g');
  let best = null;
  for (const m of src.matchAll(re)) {
    if (m.index < beforeIdx) best = m;        // nearest preceding wins
  }
  if (!best) return { expr, propagated: false, from: null };
  return { expr: best[1].trim(), propagated: true, from: `const ${expr} = ${best[1].trim()}` };
}

// --- extension (2): quantified resolution over the range the tree admits -----------------------
// A template with EXACTLY ONE interpolation becomes prefix + ${...} + suffix. Enumerate every
// concrete first-level directory at the pin that matches prefix/suffix, and price each one.
const ONE_INTERP = /^`([^`$]*)\$\{[^}]*\}([^`$]*)`$/;
const roundCache = new Map();

function quantify(expr) {
  const m = expr.match(ONE_INTERP);
  if (!m) return { ok: false, why: 'not a single-interpolation template' };
  const [, prefix, suffix] = m;
  const key = `${prefix}\u0000${suffix}`;
  if (roundCache.has(key)) return roundCache.get(key);

  // first-level trees under the longest static directory of the prefix
  const dir = prefix.replace(/[^/]*$/, '').replace(/\/$/, '');
  if (dir === '') { const r = { ok: false, why: 'no static directory in the prefix' }; roundCache.set(key, r); return r; }
  let listing;
  try { listing = git(['ls-tree', '--name-only', `${PIN}:${dir}`]); }
  catch (e) { const r = { ok: false, why: `ls-tree ${dir} failed: ${String(e.message).split('\n')[0]}` }; roundCache.set(key, r); return r; }
  const entries = listing.split('\n').filter((l) => l.trim() !== '');
  if (entries.length === 0) { const r = { ok: false, why: `empty listing for ${dir} is not a reading` }; roundCache.set(key, r); return r; }

  const pfxTail = prefix.slice(dir.length + 1);          // e.g. "round"
  const sfx = suffix.replace(/\/$/, '');                 // e.g. "-instruments"
  const cand = entries.filter((e) => e.startsWith(pfxTail) && e.endsWith(sfx) && e.length > pfxTail.length + sfx.length);
  if (cand.length === 0) { const r = { ok: false, why: `0 concrete instantiations of ${prefix}\${}${suffix}` }; roundCache.set(key, r); return r; }

  const counts = [];
  for (const c of cand) {
    const ps = `${dir}/${c}${suffix.endsWith('/') ? '/' : ''}`;
    let out;
    try { out = git(['log', '--diff-filter=A', '--format=%H', PIN, '--', ps]); }
    catch (e) { const r = { ok: false, why: `log refused for ${ps}: ${String(e.message).split('\n')[0]}` }; roundCache.set(key, r); return r; }
    const t = out.trim();
    counts.push({ inst: c, members: t === '' ? 0 : t.split('\n').length });
  }
  const zero = counts.filter((c) => c.members === 0).length;
  if (zero === counts.length) { const r = { ok: false, why: 'every instantiation returned 0 add-commits — not a reading' }; roundCache.set(key, r); return r; }
  const r = { ok: true, pattern: `${prefix}\${}${suffix}`, counts, zeroes: zero };
  roundCache.set(key, r);
  return r;
}

// his kind rule, unchanged
const kindOf = (members, hasReverse) =>
  members === null ? 'UNRESOLVED' : members === 1 ? 'CONTINGENT' : hasReverse ? 'STRUCTURAL' : 'CONTINGENT';

// --- classify one arm-[3] site ----------------------------------------------------------------
// Every outcome gets its OWN bucket. No fall-through terminal bucket: a bucket reached by
// fall-through absorbs every blindness in the reader above it.
function classify(f, src, m, nth, scan) {
  const site = `${f.replace(/^docs\/research\//, '')}#${nth}`;
  const base = { site, bucket: null, kind: null, members: null, hasReverse: null, pathspec: '', note: '' };
  if (!scan.clean) return { ...base, bucket: 'UNSCANNABLE', note: JSON.stringify(scan.residue) };
  const inv = enclosingInvocation(scan.pairs, src, m.index, m.index + m[0].length);
  if (!inv) return { ...base, bucket: 'NOT-LOCATED' };

  const args = topLevelArgs(inv.text);
  const sepIdx = args.findIndex((a) => isLiteral(a) && unquote(a) === '--');
  if (sepIdx === -1) return { ...base, bucket: 'NO-SEP', note: `${args.length} top-level args, no '--'` };

  const pathspecs = args.slice(sepIdx + 1);
  const flags = args.slice(0, sepIdx);
  const hasReverse = flags.some((a) => /--reverse/.test(a));
  const revArgs = flags.filter((a, i) => i > 0 && !/^['"`]?-/.test(a));
  const revClean = revArgs.length === 0 || revArgs.every(isLiteral);
  const out = { ...base, hasReverse, pathspec: pathspecs.join(' | ') };

  if (pathspecs.length === 0) return { ...out, bucket: 'NO-PATHSPEC' };
  if (pathspecs.length > 1) return { ...out, bucket: 'MULTI-PATHSPEC', kind: 'UNRESOLVED' };

  let ps = pathspecs[0];
  if (PROP && !isLiteral(ps)) {
    const p = propagate(ps, src, m.index);
    if (p.propagated) { out.note = `PROP: ${p.from}`; ps = p.expr; out.pathspec = `${pathspecs[0]} -> ${ps}`; }
  }

  if (isLiteral(ps)) {
    if (!revClean) return { ...out, bucket: 'LITERAL-REV-VAR', kind: 'UNRESOLVED', note: `rev not a literal: ${revArgs.join(' | ')}` };
    let o;
    try { o = git(['log', '--diff-filter=A', '--format=%H', PIN, '--', unquote(ps)]); }
    catch (e) { return { ...out, bucket: 'LITERAL-LOG-REFUSED', kind: 'UNRESOLVED', note: String(e.message).split('\n')[0] }; }
    const t = o.trim();
    const members = t === '' ? 0 : t.split('\n').length;
    if (members === 0) return { ...out, bucket: 'LITERAL-ZERO', kind: 'UNRESOLVED', note: 'empty listing is not a reading' };
    return { ...out, bucket: 'LITERAL', members, kind: kindOf(members, hasReverse) };
  }

  const isTmpl = /^`/.test(ps) && ps.includes('${');
  if (QUANT && isTmpl) {
    const q = quantify(ps);
    if (q.ok) {
      const kinds = new Set(q.counts.filter((c) => c.members > 0).map((c) => kindOf(c.members, hasReverse)));
      const ms = q.counts.filter((c) => c.members > 0).map((c) => c.members);
      return {
        ...out,
        bucket: 'QUANT',
        kind: kinds.size === 1 ? [...kinds][0] : 'KIND-NOT-CONSTANT',
        members: `[${Math.min(...ms)}..${Math.max(...ms)}]`,
        note: `${q.counts.length} instantiations · distinct member counts ${new Set(ms).size} · members==1 in ${ms.filter((x) => x === 1).length} · kinds {${[...kinds].join(',')}}`,
        quant: q,
      };
    }
    return { ...out, bucket: 'QUANT-REFUSED', kind: 'UNRESOLVED', note: q.why };
  }
  return { ...out, bucket: isTmpl ? 'NON-LITERAL-TEMPLATE' : IDENT.test(ps) ? 'NON-LITERAL-IDENT' : 'NON-LITERAL-OTHER', kind: 'UNRESOLVED' };
}

const MY7 = [
  'round435-instruments/grade-his-cure-and-oracle-the-matrix.mjs#1',
  'round464-instruments/grade-the-stop-condition.mjs#1',
  'unit-464t2-keychoice-2026-10-28/grade-the-surface-predicate.mjs#1',
  'unit-464t2-reaim-2026-10-28/grade-the-credit-key.mjs#1',
  'unit-464t2-reaim-2026-10-28/recon-credit-provenance.mjs#1',
  'unit-464t2-surface-2026-10-28/recon-run-length-and-cure.mjs#1',
  'unit-464vac-2026-10-31/grade-cure.mjs#1',
];

const rows = [];
if (SCOPE === 'my7') {
  for (const site of MY7) {
    const [rel, nth] = site.split('#');
    const f = `docs/research/${rel}`;
    let src;
    try { src = git(['show', `${PIN}:${f}`]); } catch (e) { refuse(`${site}: ${String(e.message).split('\n')[0]}`); }
    ARM3_RE.lastIndex = 0;
    const ms = [...src.matchAll(ARM3_RE)];
    const m = ms[Number(nth) - 1];
    if (!m) refuse(`${site}: arm-[3] match #${nth} not present at the pin`);
    rows.push(classify(f, src, m, Number(nth), scanParens(src)));
  }
} else if (SCOPE === 'tree' || SCOPE === 'rounds') {
  let files;
  try { files = git(['ls-tree', '-r', '--name-only', PIN, 'docs/research']).split('\n').filter((f) => f.endsWith('.mjs')); }
  catch (e) { refuse(`ls-tree failed: ${String(e.message).split('\n')[0]}`); }
  if (files.length === 0) refuse('0 .mjs files under docs/research — an empty listing is not a reading');
  console.log(`.mjs files under docs/research at the pin: ${files.length}`);
  let showFailed = 0;
  for (const f of files) {
    let src;
    // NOT a silent `catch { continue }`: a dropped file is counted and reported.
    try { src = git(['show', `${PIN}:${f}`]); } catch { showFailed++; continue; }
    ARM3_RE.lastIndex = 0;
    const ms = [...src.matchAll(ARM3_RE)];
    if (ms.length === 0) continue;
    const scan = scanParens(src);
    ms.forEach((m, i) => rows.push(classify(f, src, m, i + 1, scan)));
  }
  if (showFailed > 0) console.log(`!! git show failed on ${showFailed} file(s) — counted, not dropped silently`);
  console.log('');
}

// --- reporting ---------------------------------------------------------------------------------
if (SCOPE === 'rounds') {
  // P4QUANT: the quantified range itself, priced once and printed in full.
  const q = quantify('`docs/research/round${round}-instruments/`');
  if (!q.ok) refuse(`quantification refused: ${q.why}`);
  const ms = q.counts.map((c) => c.members);
  const live = ms.filter((x) => x > 0);
  const dist = [...new Set(live)].sort((a, b) => a - b);
  const hist = new Map();
  for (const x of live) hist.set(x, (hist.get(x) ?? 0) + 1);
  console.log(`-- P4QUANT: ${q.pattern} quantified over the range the tree admits at ${PIN} --`);
  console.log(`  rounds enumerable at the pin      : ${q.counts.length}`);
  console.log(`  instantiations with 0 add-commits : ${q.zeroes}  (excluded from the kind range)`);
  console.log(`  distinct member counts observed   : ${dist.length}   ${JSON.stringify(dist)}`);
  console.log(`  rounds with members == 1          : ${live.filter((x) => x === 1).length} of ${live.length}  (${((live.filter((x) => x === 1).length / live.length) * 100).toFixed(1)}%)`);
  console.log(`  member-count histogram            : ${[...hist.entries()].sort((a, b) => a[0] - b[0]).map(([k, v]) => `${k}:${v}`).join(' ')}`);
  console.log('');
  for (const rev of [true, false]) {
    const kinds = new Set(live.map((x) => kindOf(x, rev)));
    console.log(`  under hasReverse=${String(rev).padEnd(5)} the kind over the range is : {${[...kinds].join(', ')}}  ${kinds.size === 1 ? 'CONSTANT' : 'NOT CONSTANT'}`);
  }
  console.log('');
  console.log(`QUANT-ROUNDS: enumerable=${q.counts.length} zeroes=${q.zeroes} distinct=${dist.length} ones=${live.filter((x) => x === 1).length} live=${live.length}`);
} else {
  const tally = (key) => {
    const m = new Map();
    for (const r of rows) m.set(r[key] ?? '(null)', (m.get(r[key] ?? '(null)') ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  if (SCOPE === 'my7') {
    for (const r of rows) {
      console.log(`${String(r.kind).padEnd(17)} reverse=${String(r.hasReverse).padEnd(5)} members=${r.members ?? 'n/a'}  bucket=${r.bucket}`);
      console.log(`    ${r.site}`);
      console.log(`    pathspec: ${r.pathspec}`);
      if (r.note) console.log(`    ${r.note}`);
    }
    console.log('');
  }
  console.log('-- bucket census (every outcome has its own bucket; none is a fall-through) --');
  for (const [k, v] of tally('bucket')) console.log(`  ${String(v).padStart(4)}  ${k}`);
  console.log('');
  console.log('-- kind census --');
  for (const [k, v] of tally('kind')) console.log(`  ${String(v).padStart(4)}  ${k}`);
  console.log('');

  // P5CELL: the cross-tab, with its MARGINS printed beside it. An empty cell in a small-margin
  // column is forced by arithmetic; the margin is what says whether the cell carries anything.
  const located = rows.filter((r) => r.bucket !== 'UNSCANNABLE' && r.bucket !== 'NOT-LOCATED');
  const resolvable = (r) => r.bucket === 'LITERAL' || r.bucket === 'QUANT';
  const cell = (rev, res) => located.filter((r) => r.hasReverse === rev && resolvable(r) === res);
  console.log(`-- P5CELL cross-tab over LOCATED sites (${located.length}) --`);
  console.log('                       pathspec RESOLVABLE   pathspec NOT          margin');
  for (const rev of [true, false]) {
    const a = cell(rev, true).length, b = cell(rev, false).length;
    console.log(`  --reverse ${rev ? 'PRESENT' : 'ABSENT '}        ${String(a).padStart(10)}   ${String(b).padStart(13)}   ${String(a + b).padStart(6)}`);
  }
  const colA = located.filter((r) => resolvable(r)).length;
  const colB = located.length - colA;
  console.log(`  margin                ${String(colA).padStart(10)}   ${String(colB).padStart(13)}   ${String(located.length).padStart(6)}`);
  const absMargin = cell(false, true).length + cell(false, false).length;
  const theCell = cell(false, false).length;
  console.log('');
  console.log(`  the registered cell (flag ABSENT x NOT resolvable) = ${theCell}`);
  console.log(`  flag-ABSENT margin = ${absMargin}  ->  ${absMargin < 4 ? '** FORCED: margin < 4, this cell carries nothing **' : 'NOT forced (margin >= 4)'}`);
  if (theCell > 0) {
    console.log('  rows in that cell:');
    for (const r of cell(false, false)) console.log(`    ${r.site}  bucket=${r.bucket}  pathspec: ${r.pathspec}`);
  }
  console.log('');
  const notConst = rows.filter((r) => r.kind === 'KIND-NOT-CONSTANT');
  console.log(`-- KIND-NOT-CONSTANT sites: ${notConst.length} --`);
  for (const r of notConst.slice(0, 12)) console.log(`  ${r.site}  ${r.note}`);
  console.log('');
  // machine-readable, for the join in join-rows.mjs
  console.log(`SUMMARY: mode=${MODE} scope=${SCOPE} rows=${rows.length} located=${located.length} cell=${theCell} absMargin=${absMargin} notconst=${notConst.length}`);
  console.log('ROWS-BEGIN');
  for (const r of rows) console.log(`ROW\t${r.site}\t${r.bucket}\t${r.kind}\t${r.hasReverse}\t${r.members ?? ''}`);
  console.log('ROWS-END');
}
