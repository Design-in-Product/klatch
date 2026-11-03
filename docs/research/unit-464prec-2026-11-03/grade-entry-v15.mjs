// unit-464prec — does the v1.5 entry say what the recordings say?
//
// This is a GATE on the prose, not a pin: it reads the LIVE §2.1g / MEASURED-BLOCK-V15 text and the
// FROZEN drive recordings, and reddens if someone edits a figure in the entry without re-driving.
// That asymmetry is deliberate and is why the legs name which side is which.
// [[feedback_prose_written_beside_its_own_cure_needs_a_pin]]
//
//   node docs/research/unit-464prec-2026-11-03/grade-entry-v15.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const D = 'docs/research/unit-464prec-2026-11-03/';
const DOC = 'docs/research/LEG-CLASS-CONVENTION.md';
const AXES = 'docs/research/unit-464order-2026-11-02/HAND-AXES-13.tsv';
const PIN = '5ba1af7369e97a3abade0cbd5be4e542e0668971';
const legs = [];
const check = (n, ok, note) => { legs.push({ n, ok, note }); return ok; };
const g = (a) => execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28 }).trim();
const rd = (p) => readFileSync(p, 'utf8');

// The .tsv is corrected FORWARD in the document and left byte-identical on disk. By hash, both ways.
const axesPin = g(['rev-parse', `${PIN}:${AXES}`]);
const axesLive = g(['hash-object', AXES]);
check('GTSVFROZEN', axesPin === axesLive,
  `HAND-AXES-13.tsv is byte-identical at the pin (${axesPin.slice(0, 8)}) and in the worktree ` +
  `(${axesLive.slice(0, 8)}) — the @194 why cell is corrected in the document, not retro-edited`);

const doc = rd(DOC);
const entry = doc.slice(doc.indexOf('### 2.1g'), doc.indexOf('### 2.1a'));
check('GENTRY', entry.length > 2000 && /MEASURED-BLOCK-V15/.test(entry) && /^\*\*v1\.5, 2026-11-03\.\*\*/m.test(doc),
  `§2.1g is ${entry.length} bytes, carries its MEASURED-BLOCK, and the document header announces v1.5`);

// Every figure the entry publishes, against the recording it came from.
const base = rd(D + 'drive5.prec.out');
const hk = rd(D + 'drive7.delta-vs-drive5.txt');
const pk = rd(D + 'drive6.delta-vs-drive5.txt');
const CLAIMS = [
  ['RED at 19 of 20', () => /RED — 19 of 20 legs ok/.test(base)],
  ['multi-figure 4 of 5', () => /multi-figure rows 4 of 5/.test(base)],
  ['the single-figure row is G0@79', () => /single-figure \[G0@79\]/.test(base)],
  ['35 conjuncts', () => /all 35 per-conjunct axis-B values/.test(base)],
  ['selector reached 0 of 35', () => /selector 0 —/.test(base)],
  ['conjunctive x immovable 1 -> 5', () => /\(1 -> 5 members\)/.test(base)],
  ['occupancy 6 -> 6, count does not move', () => /6 with row-level axis B, 6 with per-conjunct axis B — the occupancy count does NOT move/.test(base)],
  ['history-keyed cell still empty', () => /conjunctive × history-keyed stays EMPTY/.test(base)],
  ['POST-decides refuted 0, undefined 2', () => /POST-decides is refuted by 0 of the 5 rows and UNDEFINED on 2/.test(base)],
  ['two rules survive, three without @194', () => /with the sample at 5: 2 .*dropping GCTRLPRE@194: 3 /.test(base)],
  ['@194 why says five, span splits to 7', () => /says "five conjuncts"; the span at the pin splits to 7 \(6 inside ctrlPinned \+ 1 beside it\)/.test(base)],
  ['coincides on 3 of 4, exception @194', () => /coincides with the PRE\/POST state label on 3 of 4 multi-figure rows; the one that does not is GCTRLPRE@194/.test(base)],
];
const failed = CLAIMS.filter(([, f]) => !f()).map(([n]) => n);
check('GCLAIMS', failed.length === 0,
  `${CLAIMS.length - failed.length} of ${CLAIMS.length} published figures found verbatim in drive5's ` +
  `recording${failed.length ? ` — MISSING: ${failed.join(' · ')}` : ''}`);

// The two cripple claims, read off the deltas rather than off my sentence about them.
const hkLines = hk.split('\n').filter((l) => /^[<>]/.test(l));
const hkVerdicts = hkLines.filter((l) => /^[<>]\s+(ok|RED)\s/.test(l) && !/GP3ORDER/.test(l));
const hkFlip = hkLines.filter((l) => /legs ok$/.test(l));
check('GHKNOOP', hkLines.length === 4 && hkVerdicts.length === 0 && hkFlip.length === 0,
  `history-keyed demoted only: ${hkLines.length} changed lines (2 pairs), ${hkVerdicts.length} legs other than ` +
  `GP3ORDER's own echo, ${hkFlip.length} summary-line changes — and GP3ORDER's two lines differ only in the ` +
  `echoed ORDER, both still ok with "0 departures of 5"`);
check('GHKECHO',
  (hk.match(/0 departures of 5/g) ?? []).length === 2 && /ORDER \[movable > immovable > history-keyed\]/.test(hk),
  `both sides of GP3ORDER's changed line read "0 departures of 5" under the demoted order — the figure ` +
  `does not move, so nothing in this unit reads history-keyed > movable`);
// Flips are counted by joining the two recordings ON THE LEG NAME. drive8's first form counted
// `>`-side lines beginning with RED, which reported 5: it absorbed GP4UNIQUE (red on BOTH sides, so
// not a flip) and the summary line. A verdict change is a disagreement between two keyed reads, not
// a count of red-looking lines on one side. [[feedback_compare_member_lists_not_counts]]
const verdicts = (f) => Object.fromEntries(rd(D + f).split('\n')
  .map((l) => l.match(/^ {3}(ok|RED) +(G[A-Z0-9]+) /)).filter(Boolean).map((m) => [m[2], m[1]]));
const vBase = verdicts('drive5.prec.out');
const flips = (other) => Object.keys(vBase).filter((k) => vBase[k] !== verdicts(other)[k]);
const pkFlip = flips('drive6.cripple-preckey.out');
const hkFlipNamed = flips('drive7.cripple-hkonly.out');
check('GPKREACHED',
  Object.keys(vBase).length === 20 && pkFlip.length === 3 && hkFlipNamed.length === 0
  && pk.split('\n').filter((l) => /^[<>]/.test(l)).length === 26,
  `20 named legs · full reversal flips 3 [${pkFlip.join(', ')}] over 26 changed lines · ` +
  `history-keyed demoted flips ${hkFlipNamed.length} — the legs DO read the order, so GHKNOOP is a ` +
  `measured no-op and not a dead switch`);

for (const l of legs) console.log(`   ${l.ok ? 'ok  ' : 'RED '} ${l.n.padEnd(12)} ${l.note}`);
const ok = legs.every((l) => l.ok);
console.log('');
console.log(`${ok ? 'GREEN' : 'RED'} — ${legs.filter((l) => l.ok).length} of ${legs.length} legs ok`);
process.exit(ok ? 0 : 1);
