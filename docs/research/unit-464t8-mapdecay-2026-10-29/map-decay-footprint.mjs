#!/usr/bin/env node
// map-decay-footprint.mjs — 2026-10-29 STOP fire, Daedalus.
//
// WHAT THIS GRADES, and why it is not the thing the cell grades.
//
// Theseus's 10-29 WORK memo §3 reported that two of the three cripple maps filed by
// `unit-464t8-2026-10-29` moved without anything in that unit being touched, because
// four legs and two predictions were added to the cell afterwards. His conclusion: a
// filed cripple map is complete only at its filing rev.
//
// This instrument measures the NEXT question, which his §3 does not answer: WHICH new
// members an arm reaches. The hypothesis, read off the source by hand first and written
// down before this ran:
//
//   an arm moves exactly those members whose INPUT SET intersects what the arm perturbs,
//   and VERDICT movement (entering/leaving red=/refused=/refuted=) is a STRICT SUBSET of
//   DETAIL movement (the member's own `detail:`/`expected=` line changing).
//
// The second half is the operational half. A map keyed on `red=`/`refused=`/`refuted=`
// alone — which is how every map in both seats' units is keyed — cannot see a member an
// arm demonstrably reaches but whose verdict is structurally unable to move: a `[MEAS]`
// leg has no verdict to move. So such a map under-reports an arm's footprint, and the
// under-report is invisible to a re-drive that compares only verdict sets.
//
// For a 6-member new-member population the hand reading is primary; this exists to GRADE
// the hand reading, not to replace it. Both keys are taken as PARAMETERS (argv) so every
// leg can be pointed at a counterfactual and graded for vacuity.
//
// Usage:
//   node map-decay-footprint.mjs <old-clean.out> <new-clean.out> <arm.out>...
//
// Exit 0 only if the known positive is 4/4 AND the gate neither fails nor refuses.

import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const argv = process.argv.slice(2).filter((a) => !a.startsWith('--cripple='));
if (argv.length < 3) {
  console.error('usage: map-decay-footprint.mjs <old-clean.out> <new-clean.out> <arm.out>...');
  process.exit(2);
}
const [OLD_CLEAN, NEW_CLEAN, ...ARMS] = argv;
const SELF_SOURCE = readFileSync(new URL(import.meta.url), 'utf8');

// ---------------------------------------------------------------------------
// Readers. Every reader takes TEXT, never a path, so the known positive below can
// drive them on synthetic recordings. `null` means REFUSED — the member was not
// found — and is never collapsed into `false`, because "did not move" and "could
// not be read" are the two answers a decay check must not confuse.
// ---------------------------------------------------------------------------

/** The four verdict sets off the VERDICT line. `null` if there is no verdict line. */
const verdictSets = (text) => {
  const line = text.split('\n').find((l) => /^VERDICT\//.test(l));
  if (line === undefined) return null;
  const grab = (key) => {
    const m = line.match(new RegExp(`${key}=\\[([^\\]]*)\\]`));
    if (m === null) return null;
    return m[1] === '' ? [] : m[1].split(',');
  };
  const sets = { red: grab('red'), refused: grab('refused'), refuted: grab('refuted') };
  if (Object.values(sets).some((v) => v === null)) return null;
  return sets;
};

/** Which verdict sets a member sits in, as a sorted label. `null` propagates. */
const verdictPosition = (text, id) => {
  const s = verdictSets(text);
  if (s === null) return null;
  return Object.keys(s).filter((k) => s[k].includes(id)).sort().join('+') || 'none';
};

// The status labels, DERIVED from the cell's own branch literals rather than guessed:
// `grade-the-stop-condition.mjs:1678` prints a leg as one of `MEAS`, `REF `, ` ok `,
// `RED `, and `:1684` prints a prediction as one of `PREF`, `LAND`, `REFU`. Each is
// exactly four characters and is followed by ` ${id}:`.
//
// The first version of this reader listed six of the seven and omitted `REF `, so it was
// blind to every REFUSED leg and returned a member count one SMALLER than the cell's own
// — and `GDELTA` below stayed green anyway, because the blindness cancelled in a
// difference of two counts taken with the same blind reader. `GABS` exists because of
// that: a delta gate over a shared denominator agrees vacuously.
//
// `labels-miss-refused` reinstates that exact blindness on demand, so `GABS` is graded by
// a drive rather than by this paragraph. Dispatch is by a `--cripple=<name>` argv flag, and
// the name is asserted below to have a dispatch site in this file's own source — a declared
// cripple that nothing reads runs a CLEAN arm, and a control driven under it comes back
// clean and reads as "the instrument survived the cripple".
const CRIPPLES = ['labels-miss-refused'];
const crippleFlag = process.argv.slice(2).find((a) => a.startsWith('--cripple='));
const CRIPPLE = crippleFlag === undefined ? null : crippleFlag.slice('--cripple='.length);
if (CRIPPLE !== null && !CRIPPLES.includes(CRIPPLE)) {
  console.error(`unknown cripple ${JSON.stringify(CRIPPLE)}; known: ${CRIPPLES.join(',')}`);
  process.exit(2);
}
const ALL_STATUS_LABELS = ['MEAS', 'REF ', ' ok ', 'RED ', 'PREF', 'LAND', 'REFU'];
const STATUS_LABELS =
  CRIPPLE === 'labels-miss-refused'
    ? ALL_STATUS_LABELS.filter((s) => s !== 'REF ')
    : ALL_STATUS_LABELS;
const headRe = (id) =>
  new RegExp(`^(?:${STATUS_LABELS.map((s) => s.replace(/ /g, '\\u0020')).join('|')}) ${id}:`);

/**
 * A member's own detail line. Legs print `      detail: ...` after their verdict line;
 * predictions print `      expected=... actual=...`. Returns `null` when the member's
 * verdict line is absent — the refusal — and `''` only when the line is present with
 * no following detail, which is a different state and stays distinguishable.
 */
const memberDetail = (text, id) => {
  const L = text.split('\n');
  const head = headRe(id);
  const i = L.findIndex((l) => head.test(l));
  if (i === -1) return null;
  const parts = [];
  for (let j = i + 1; j < L.length; j += 1) {
    if (/^\s{6}(?:detail:|expected=)/.test(L[j])) parts.push(L[j].trim());
    else break;
  }
  return parts.join('\n');
};

/** Every member id a recording declares, legs and predictions alike. */
const memberIds = (text) => {
  const out = [];
  const any = headRe('([A-Za-z0-9]+)');
  for (const l of text.split('\n')) {
    const m = l.match(any);
    if (m !== null) out.push(m[1]);
  }
  return [...new Set(out)];
};

// ---------------------------------------------------------------------------
// KP — KNOWN POSITIVE on synthetic recordings, driven BEFORE the real matrix.
// Four rows, one per answer the gate must be able to give. The row that matters is
// `verdict-moves-detail-frozen`: it carries the property the gate exists to detect, and
// if the gate cannot report it the matrix below is decoration. `member-absent` is the
// control that separates a refusal from a `false`.
// ---------------------------------------------------------------------------
const synth = (verdictLine, memberLine, detailLine) =>
  ['--- LEGS ---', memberLine, `      detail: ${detailLine}`, '', verdictLine].join('\n');

const V_OK = 'VERDICT/0 GREEN legs=2 red=[] refused=[] preds=0 refuted=[] prefused=[]';
const V_RED = 'VERDICT/1 RED legs=2 red=[XX] refused=[] preds=0 refuted=[] prefused=[]';
const CLEAN_SYNTH = synth(V_OK, ' ok  XX: a synthetic member', 'n=1 figure=2');

/** The property under test, for one member across one (clean, arm) pair. */
const footprint = (cleanText, armText, id) => {
  const cPos = verdictPosition(cleanText, id);
  const aPos = verdictPosition(armText, id);
  const cDet = memberDetail(cleanText, id);
  const aDet = memberDetail(armText, id);
  if (cPos === null || aPos === null || cDet === null || aDet === null) {
    return { verdictMoved: null, detailMoved: null, refused: true };
  }
  return { verdictMoved: cPos !== aPos, detailMoved: cDet !== aDet, refused: false };
};

const kpRows = [
  {
    // The arm flips the member's verdict while its detail line is byte-identical. This
    // is the shape a verdict-only map cannot distinguish from a real finding, and the
    // gate must call it a violation.
    name: 'verdict-moves-detail-frozen',
    got: (() => {
      const f = footprint(CLEAN_SYNTH, synth(V_RED, 'RED  XX: a synthetic member', 'n=1 figure=2'), 'XX');
      return f.refused === false && f.verdictMoved === true && f.detailMoved === false;
    })(),
    want: true,
  },
  {
    name: 'both-move',
    got: (() => {
      const f = footprint(CLEAN_SYNTH, synth(V_RED, 'RED  XX: a synthetic member', 'n=1 figure=9'), 'XX');
      return f.refused === false && f.verdictMoved === true && f.detailMoved === true;
    })(),
    want: true,
  },
  {
    // Detail moves, verdict cannot. The MEAS shape — the one a verdict-only map misses.
    name: 'detail-only',
    got: (() => {
      const f = footprint(CLEAN_SYNTH, synth(V_OK, ' ok  XX: a synthetic member', 'n=1 figure=9'), 'XX');
      return f.refused === false && f.verdictMoved === false && f.detailMoved === true;
    })(),
    want: true,
  },
  {
    // CONTROL: the member is absent from the arm recording. Must REFUSE, not answer
    // `false`. A reader that returns `false` here grades every unrunnable arm as clean.
    name: 'member-absent-refuses',
    got: (() => {
      const f = footprint(CLEAN_SYNTH, [V_OK].join('\n'), 'XX');
      return f.refused === true && f.verdictMoved === null && f.detailMoved === null;
    })(),
    want: true,
  },
  {
    // Every one of the seven printed labels is read, `REF ` included — the one the first
    // version of this reader omitted. Paired with a CONTROL label that is NOT printed by
    // the cell and must NOT be read, because a matcher loose enough to find all seven by
    // accident would pass the first half of this row on its own.
    // Keyed on ALL_STATUS_LABELS, never on STATUS_LABELS: a row that builds its fixture
    // from the same list the reader uses tests the crippled list against itself and is
    // green under the cripple it exists to catch.
    name: 'all-seven-labels-read-control-rejected',
    got: (() => {
      const lines = ALL_STATUS_LABELS.map((s, i) => `${s} L${i}: synthetic`);
      lines.push('XXXX L99: synthetic control label the cell never prints');
      const found = memberIds(lines.join('\n'));
      const wantFound = ALL_STATUS_LABELS.map((_, i) => `L${i}`);
      return wantFound.every((x) => found.includes(x))
        && found.includes('L99') === false
        && found.length === ALL_STATUS_LABELS.length;
    })(),
    want: true,
  },
];
// GHOOK — every declared cripple is read somewhere in this file's own source. Keyed on the
// dispatch shape, not on a mention: a name appearing only in comments satisfies a mention
// count while nothing reads it. Carries a control name known to be absent, which must come
// back missing, because a gate that can only report zero cannot be told from one that has
// stopped seeing.
const dispatchSites = (name) => SELF_SOURCE.split(`CRIPPLE === '${name}'`).length - 1;
const HOOK_CONTROL = 'zz-control-name-with-no-hook';
const crippleNoHook = CRIPPLES.filter((c) => dispatchSites(c) === 0);
const hookControlDetected = dispatchSites(HOOK_CONTROL) === 0;
const hookOk = crippleNoHook.length === 0 && hookControlDetected;
console.log(`GHOOK  ${hookOk ? 'ok  ' : 'RED '}every declared cripple has a dispatch site: `
  + `declared=${CRIPPLES.length} withoutHook=[${crippleNoHook.join(',')}] `
  + CRIPPLES.map((c) => `${c}:${dispatchSites(c)}`).join(' ')
  + ` control(${HOOK_CONTROL})=${dispatchSites(HOOK_CONTROL)} detected=${hookControlDetected}`);
console.log(`CRIPPLE ${CRIPPLE ?? 'none'}`);

const kpMisses = kpRows.filter((r) => r.got !== r.want).map((r) => r.name);
console.log(`KP  ${kpMisses.length === 0 ? 'ok  ' : 'RED '}footprint reader: `
  + kpRows.map((r) => `${r.name}=${r.got}`).join(' ')
  + ` misses=[${kpMisses.join(',')}] rows=${kpRows.length}`);

// ---------------------------------------------------------------------------
// The new-member population, SLICED from the two clean recordings rather than typed.
// ---------------------------------------------------------------------------
const oldClean = readFileSync(OLD_CLEAN, 'utf8');
const newClean = readFileSync(NEW_CLEAN, 'utf8');
const oldIds = memberIds(oldClean);
const newIds = memberIds(newClean);
const NEW_MEMBERS = newIds.filter((x) => !oldIds.includes(x));

console.log(`POP old=${basename(OLD_CLEAN)}(${oldIds.length}) new=${basename(NEW_CLEAN)}(${newIds.length}) `
  + `added=${NEW_MEMBERS.length} [${NEW_MEMBERS.join(',')}] `
  + `removed=[${oldIds.filter((x) => !newIds.includes(x)).join(',')}]`);

const cellCounts = (text) => {
  const line = text.split('\n').find((l) => /^VERDICT\//.test(l));
  if (line === undefined) return null;
  const legs = line.match(/legs=(\d+)/);
  const preds = line.match(/preds=(\d+)/);
  return legs === null || preds === null ? null : { legs: +legs[1], preds: +preds[1] };
};
const oldCounts = cellCounts(oldClean);
const newCounts = cellCounts(newClean);
const cellDelta =
  oldCounts === null || newCounts === null
    ? null
    : newCounts.legs - oldCounts.legs + (newCounts.preds - oldCounts.preds);
const deltaAgrees = cellDelta === null ? null : cellDelta === NEW_MEMBERS.length;
console.log(`GDELTA ${deltaAgrees === true ? 'ok  ' : deltaAgrees === null ? 'REFU' : 'RED '}`
  + `this reader's added-member count against the cell's own legs=/preds= delta: `
  + `cell=${cellDelta} reader=${NEW_MEMBERS.length} `
  + `(old legs=${oldCounts?.legs} preds=${oldCounts?.preds} -> new legs=${newCounts?.legs} preds=${newCounts?.preds})`);

// GABS — the gate GDELTA cannot be: the reader's ABSOLUTE member count against the cell's
// own `legs=`+`preds=` in EACH recording. A reader blind to one printed label is off by a
// constant in both recordings, so the delta still agrees and `GDELTA` still says `ok`.
// That is exactly what happened to the first version of this file. Any label the cell adds
// later lands here as a RED instead of silently shrinking the population.
const absRows = [
  { name: basename(OLD_CLEAN), reader: oldIds.length, cell: oldCounts === null ? null : oldCounts.legs + oldCounts.preds },
  { name: basename(NEW_CLEAN), reader: newIds.length, cell: newCounts === null ? null : newCounts.legs + newCounts.preds },
];
const absMisses = absRows.filter((r) => r.cell === null || r.cell !== r.reader);
console.log(`GABS   ${absRows.some((r) => r.cell === null) ? 'REFU' : absMisses.length === 0 ? 'ok  ' : 'RED '}`
  + `this reader's ABSOLUTE member count against the cell's own legs=+preds=, per recording: `
  + absRows.map((r) => `${r.name}:reader=${r.reader}/cell=${r.cell}`).join(' ')
  + ` misses=[${absMisses.map((r) => r.name).join(',')}] labels=${STATUS_LABELS.length}`);

// ---------------------------------------------------------------------------
// The matrix.
// ---------------------------------------------------------------------------
const rows = [];
for (const armPath of ARMS) {
  const armText = readFileSync(armPath, 'utf8');
  for (const id of NEW_MEMBERS) {
    rows.push({ arm: basename(armPath), id, ...footprint(newClean, armText, id) });
  }
}

console.log('');
console.log('--- FOOTPRINT MATRIX (new members x arms) ---');
for (const armPath of ARMS) {
  const arm = basename(armPath);
  const mine = rows.filter((r) => r.arm === arm);
  console.log(`  ${arm}`);
  for (const r of mine) {
    const v = r.refused ? 'REFUSED' : r.verdictMoved ? 'MOVED' : '-';
    const d = r.refused ? 'REFUSED' : r.detailMoved ? 'MOVED' : '-';
    console.log(`    ${r.id.padEnd(12)} verdict=${v.padEnd(8)} detail=${d}`);
  }
}

// GATE: verdict movement is a strict subset of detail movement. A member whose verdict
// moves while its detail is frozen would mean the arm reaches the verdict through a path
// the member does not report — which is the one shape that makes a verdict-only map
// safe, and it is not what the code does.
const violations = rows.filter((r) => r.refused === false && r.verdictMoved === true && r.detailMoved === false);
const refusals = rows.filter((r) => r.refused === true);
const verdictMovers = rows.filter((r) => r.verdictMoved === true);
const detailMovers = rows.filter((r) => r.detailMoved === true);

// The gate REFUSES rather than printing ok when no verdict moved anywhere: a subset
// claim over an empty partition is vacuously true and tells the next fire nothing.
const gateVacuous = verdictMovers.length === 0;
const gateState = refusals.length > 0 || gateVacuous
  ? 'REFU'
  : violations.length === 0 ? 'ok  ' : 'RED ';
console.log('');
console.log(`GSUBSET ${gateState}verdict movement is a subset of detail movement: `
  + `cells=${rows.length} verdictMoved=${verdictMovers.length} detailMoved=${detailMovers.length} `
  + `violations=[${violations.map((r) => `${r.arm}/${r.id}`).join(',')}] `
  + `refusedCells=${refusals.length} vacuous=${gateVacuous}`);

// MEAS: the under-report. Members an arm demonstrably reaches that a verdict-only map
// cannot name. This is the figure the finding is about; it asserts nothing.
const underReported = detailMovers.filter((r) => r.verdictMoved === false);
console.log(`MEAS   under-reported by a verdict-only map: ${underReported.length} of `
  + `${detailMovers.length} reached cells `
  + `[${underReported.map((r) => `${r.arm}/${r.id}`).join(',')}]`);

const ok = kpMisses.length === 0 && gateState === 'ok  ' && deltaAgrees === true
  && absMisses.length === 0 && hookOk;
console.log('');
console.log(`VERDICT/${ok ? 0 : 1} ${ok ? 'GREEN' : 'NOT-GREEN'} kpMisses=${kpMisses.length} `
  + `gate=${gateState.trim()} violations=${violations.length} refusedCells=${refusals.length} `
  + `gdelta=${deltaAgrees} gabsMisses=${absMisses.length}`);
process.exit(ok ? 0 : 1);
