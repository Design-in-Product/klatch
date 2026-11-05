#!/usr/bin/env node
// unit-464redkey — grader for the REDUCTION ruling.
//
// Legs are registered in PRE-REGISTRATION.md as EXACT VALUES. A wrong figure must go RED, not pass.
// Every git invocation is pinned with `-C <toplevel>`; no pathspec is relative to cwd (v2.0 §6.1,
// written because two instruments of mine exited 0 on an empty listing). Figure readers REFUSE on
// an empty or unresolvable read rather than printing a zero as a measurement.
//
// Usage:  node grade-redkey.mjs                 normal drive
//         node grade-redkey.mjs --dead-pin      P7REFUSE: drive against an unresolvable rev
//         node grade-redkey.mjs --cripple-order P6CRIPORDER: file-wide --reverse instead of in-call

import { execFileSync } from 'node:child_process';

const ARGV = process.argv.slice(2);
const DEAD_PIN = ARGV.includes('--dead-pin');
const CRIPPLE_ORDER = ARGV.includes('--cripple-order');

const TOP = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const git = (args) => execFileSync('git', ['-C', TOP, ...args], { encoding: 'utf8' });

const refuse = (msg) => {
  console.log(`REFUSE: ${msg}`);
  process.exit(2);
};

// ---------------------------------------------------------------- pins, DERIVED not typed
const PATHS = {
  mine: 'docs/research/unit-464cons-2026-11-04/HAND-CONS.tsv',
  arm3: 'docs/research/unit-464addarm-2026-11-04/HAND-ARM3.tsv',
  consa: 'docs/research/unit-464acons-2026-11-04/HAND-CONS-A.tsv',
};

function addRev(path) {
  let out;
  try {
    out = git(['log', '--diff-filter=A', '--format=%H', '--', path]);
  } catch (e) {
    refuse(`git log failed for ${path}: ${e.message}`);
  }
  const revs = out.trim().split('\n').filter(Boolean);
  // newest-first listing: the ADD commit is the LAST entry, not the first.
  if (revs.length === 0) refuse(`no add-commit found for ${path} — empty listing is not a reading`);
  return revs[revs.length - 1];
}

const REVS = Object.fromEntries(Object.keys(PATHS).map((k) => [k, addRev(PATHS[k])]));
const SOURCE_PIN = DEAD_PIN ? '0000000000000000000000000000000000000000' : '0ae48068';

function showAt(rev, path) {
  let out;
  try {
    out = git(['show', `${rev}:${path}`]);
  } catch (e) {
    refuse(`cannot read ${path} at ${rev.slice(0, 8)} — ${String(e.message).split('\n')[0]}`);
  }
  if (!out || out.trim() === '') refuse(`${path} at ${rev.slice(0, 8)} read as EMPTY`);
  return out;
}

function table(key) {
  const rows = showAt(REVS[key], PATHS[key])
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('#'));
  if (rows.length < 2) refuse(`${PATHS[key]} has no data rows at its own add-commit`);
  const header = rows[0].split('\t');
  const data = rows.slice(1).map((r) => {
    const cells = r.split('\t');
    return Object.fromEntries(header.map((h, i) => [h.trim(), (cells[i] ?? '').trim()]));
  });
  return { header, data };
}

// ---------------------------------------------------------------- leg bookkeeping
const legs = [];
const leg = (id, verdict, claim, detail) => {
  legs.push({ id, verdict, claim, detail });
  console.log(`${verdict.padEnd(6)} ${id.padEnd(13)} ${claim}`);
  if (detail) console.log(`${' '.repeat(21)}${detail}`);
};
const exact = (id, got, want, claim) =>
  leg(id, got === want ? 'GREEN' : 'RED', claim, `registered exactly ${want} · measured ${got}`);

const setdiff = (a, b) => a.filter((x) => !b.includes(x));
const sortU = (a) => [...new Set(a)].sort();

// ---------------------------------------------------------------- the three tables
const MINE = table('mine');
const ARM3 = table('arm3');
const CONSA = table('consa');

console.log('=== unit-464redkey · grade-redkey.mjs ===');
console.log(`toplevel        ${TOP}`);
console.log(`source pin      ${SOURCE_PIN}${DEAD_PIN ? '   (DEAD PIN DRIVE)' : ''}`);
for (const k of Object.keys(PATHS)) console.log(`${k.padEnd(15)} ${REVS[k].slice(0, 8)}  ${PATHS[k]}`);
if (CRIPPLE_ORDER) console.log('MODE            --cripple-order  (file-wide --reverse)');
console.log('');

const myA = sortU(MINE.data.filter((r) => r.class === 'A').map((r) => r.site));
const hisA = sortU(ARM3.data.filter((r) => r.CLASS === 'A').map((r) => r.site_id));

// A_HOLDS cell is read by its literal value; anything not recognised REFUSES rather than
// falling through to "not held" — a fall-through bucket absorbs every blindness.
// Literals derived from the cells HIS table actually holds at c21105db — not guessed from a
// vocabulary of plausible spellings. drive1 is kept as the recording of the guess failing: it
// REFUSED on "NO — FLIPS TO R" rather than bucketing it, which is the behaviour the guard exists
// for. The sets stay closed; a third spelling still refuses.
const HOLD_YES = new Set(['yes']);
const HOLD_NO = new Set(['NO — FLIPS TO R']);
const consaHold = new Map();
for (const r of CONSA.data) {
  const v = r.A_HOLDS;
  if (HOLD_YES.has(v)) consaHold.set(r.site_id, true);
  else if (HOLD_NO.has(v)) consaHold.set(r.site_id, false);
  else refuse(`HAND-CONS-A A_HOLDS cell for ${r.site_id} is ${JSON.stringify(v)} — not in either literal set`);
}

console.log(`-- my A set (${myA.length}) --`);
myA.forEach((s) => console.log('   ' + s));
console.log(`-- his A set (${hisA.length}) --`);
hisA.forEach((s) => console.log('   ' + s));
const flipped = [...consaHold.entries()].filter(([, held]) => !held).map(([s]) => s).sort();
console.log(`-- his rows that did NOT hold (${flipped.length}) --`);
flipped.forEach((s) => console.log('   ' + s));
console.log('');

// ---------------------------------------------------------------- P1 / P2 / P3 / P4
exact('P1MINE', myA.length, 7, 'my HAND-CONS.tsv class==A rows, read at its own add-commit');

const hisMinusMine = setdiff(hisA, myA);
const mineMinusHis = setdiff(myA, hisA);
leg(
  'P2SUBSET',
  hisA.length === 8 && hisMinusMine.length === 1 && mineMinusHis.length === 0 ? 'GREEN' : 'RED',
  'member lists, not tallies: mine is a strict subset of his 8',
  `|his|=${hisA.length} (want 8) · |his\\mine|=${hisMinusMine.length} (want 1) ` +
    `[${hisMinusMine.join(', ') || '-'}] · |mine\\his|=${mineMinusHis.length} (want 0) ` +
    `[${mineMinusHis.join(', ') || '-'}]`
);

const hisPostFlip = sortU(setdiff(hisA, flipped));
const symDiff = sortU([...setdiff(hisPostFlip, myA), ...setdiff(myA, hisPostFlip)]);
leg(
  'P3IDENT',
  symDiff.length === 0 ? 'GREEN' : 'RED',
  'his post-flip A set is IDENTICAL to my 7 — decides whether the routed item is a measurement',
  `|his post-flip|=${hisPostFlip.length} · symmetric difference = ${symDiff.length} ` +
    `[${symDiff.join(', ') || 'none'}]`
);
const ROUTED_ITEM_IS_CLOSED = symDiff.length === 0;

const mineInConsa = myA.filter((s) => consaHold.has(s));
const mineHeld = mineInConsa.filter((s) => consaHold.get(s));
const mineNotHeld = mineInConsa.filter((s) => !consaHold.get(s));
if (mineInConsa.length !== myA.length) {
  const missing = setdiff(myA, mineInConsa);
  leg('P4HELD', 'RED', 'DERIVATIVE: my 7 as recorded in HIS HAND-CONS-A.tsv',
    `${missing.length} of my rows have NO verdict in his table [${missing.join(', ')}] — ` +
    `these, and only these, are an open measurement for this seat`);
} else {
  leg(
    'P4HELD',
    mineHeld.length === 7 && mineNotHeld.length === 0 ? 'GREEN' : 'RED',
    'DERIVATIVE: my 7 as recorded in HIS HAND-CONS-A.tsv — his verdicts, not an independent read',
    `held ${mineHeld.length} (want 7) · not-held ${mineNotHeld.length} (want 0)` +
      (ROUTED_ITEM_IS_CLOSED
        ? '  ** DERIVATIVE GREEN: P3IDENT green, so this leg carries no independent information **'
        : '')
  );
}
console.log('');

// ---------------------------------------------------------------- P5ORDER: the one open measurement
// Scanner lives in scan.mjs with the full account of the two defects it replaces:
//   drive2 — the invocation was keyed on a fixed list of child-process identifiers, and these
//            instruments reach git through a local `git(...)` wrapper, so EVERY site refused.
//            That reader was narrower than the boundary model §3 registered.
//   probe-boundary.first.out — the paren scanner desynchronised on NESTED TEMPLATE LITERALS,
//            producing fictional pairs rather than missing ones. scan.mjs now reports an
//            unclean scan, and an unclean scan REFUSES here rather than being read.
import { scanParens, enclosingInvocation, ARM3_RE } from './scan.mjs';

console.log('-- P5ORDER: ordering flag per site, off the subject source at the pin --');
const orderRows = [];
for (const site of myA) {
  const [rel, nth] = site.split('#');
  const path = `docs/research/${rel}`;
  const src = showAt(SOURCE_PIN, path);
  ARM3_RE.lastIndex = 0;
  const matches = [...src.matchAll(ARM3_RE)];
  const n = Number(nth);
  if (!Number.isInteger(n) || n < 1) refuse(`site key ${site} has no usable #n ordinal`);
  if (matches.length < n) {
    refuse(`${path} at ${SOURCE_PIN.slice(0, 8)} holds ${matches.length} arm-[3] matches, need #${n}`);
  }
  const m = matches[n - 1];
  const mStart = m.index;
  const mEnd = m.index + m[0].length;

  // BOTH readers are computed on every row, in one process, so the cripple comparison is a
  // measurement rather than a thing I compare by eye across two recordings.
  const scan = scanParens(src);
  if (!scan.clean) {
    refuse(`${site}: lexical scan of ${path} ended UNCLEAN ` +
      `(lex residue ${scan.residue.lex}, unclosed parens ${scan.residue.unclosedParens}) — ` +
      `the pair table is fiction past the desync point and will not be read`);
  }
  const inv = enclosingInvocation(scan.pairs, src, mStart, mEnd);
  if (!inv) {
    refuse(`${site}: no enclosing invocation located for the arm-[3] match — refusing the row ` +
      `rather than reading it as "no --reverse"`);
  }
  const liveReverse = /--reverse/.test(inv.text);
  const cripReverse = /--reverse/.test(src);
  const scope = `${inv.name}(...) span ${inv.start}..${inv.end} (${inv.end - inv.start + 1}b)`;
  const hasReverse = CRIPPLE_ORDER ? cripReverse : liveReverse;

  orderRows.push({ site, hasReverse, liveReverse, cripReverse, scope, matches: matches.length });
  console.log(`   live=${liveReverse ? 'REVERSE' : 'no-rev '} crip=${cripReverse ? 'REVERSE' : 'no-rev '}  ${site}`);
  console.log(`              arm-[3] matches in file: ${matches.length}, took #${n} · ${scope}`);
}

const withRev = orderRows.filter((r) => r.hasReverse).length;
const withoutRev = orderRows.length - withRev;
console.log('');
const orderId = CRIPPLE_ORDER ? 'P5ORDER-CRIP' : 'P5ORDER';
leg(
  orderId,
  withRev === 6 && withoutRev === 1 ? 'GREEN' : 'RED',
  'ordering flag over my 7, read inside the selection\'s own git invocation at the pin',
  `--reverse ${withRev} (registered exactly 6) · without ${withoutRev} (registered exactly 1)` +
    (withoutRev > 0
      ? `  [no-rev: ${orderRows.filter((r) => !r.hasReverse).map((r) => r.site).join(', ')}]`
      : '')
);

// P6CRIPORDER — the cripple must FLIP at least one row, or P5ORDER's boundary model is
// unexercised and its figure is not evidence for the model. Member lists, not counts: two
// readers can agree on a tally while disagreeing on which rows.
const liveSet = sortU(orderRows.filter((r) => r.liveReverse).map((r) => r.site));
const cripSet = sortU(orderRows.filter((r) => r.cripReverse).map((r) => r.site));
const flips = sortU([...setdiff(liveSet, cripSet), ...setdiff(cripSet, liveSet)]);
leg(
  'P6CRIPORDER',
  flips.length >= 1 ? 'GREEN' : 'RED',
  'the crippled file-wide ordering reader must FLIP at least one row',
  `live --reverse ${liveSet.length} · crippled --reverse ${cripSet.length} · ` +
    `rows on which they DISAGREE: ${flips.length} [${flips.join(', ') || 'none'}]` +
    (flips.length === 0
      ? '  ** CRIPPLE DEAD: P5ORDER\'s in-call boundary model is UNEXERCISED on this population — ' +
        'the same 6/1 falls out of a reader that ignores the boundary entirely **'
      : '')
);

console.log('');
console.log('=== SUMMARY ===');
const g = legs.filter((l) => l.verdict === 'GREEN').length;
const r = legs.filter((l) => l.verdict === 'RED').length;
console.log(`${legs.length} legs · ${g} GREEN · ${r} RED`);
console.log(`ROUTED-ITEM-CLOSED-BY-HIS-TABLE: ${ROUTED_ITEM_IS_CLOSED}`);
console.log(`ORDER-COUNTS: reverse=${withRev} no-reverse=${withoutRev} mode=${CRIPPLE_ORDER ? 'crippled' : 'live'}`);
