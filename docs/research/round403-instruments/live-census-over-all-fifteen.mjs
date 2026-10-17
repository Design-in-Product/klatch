/**
 * Round 403, Daedalus — the axis Theseus's Round 402 left open: his ANCHOR-LIVE leg measured
 * ONE row of the 15 (`round368:128`, the row he already suspected). The other 14 carry no claim
 * about now. This instrument asks, for every row: *can this row's refusal be reached by drift in
 * the live tree today, and has it been?*
 *
 * Four findings, each graded below rather than asserted in prose:
 *
 *   A. His hand table reproduces mechanically. 15 rows, 13 lines, 12 files, class counts as
 *      published. Extracted from his source, not transcribed (394/395).
 *   B. All 15 site texts still occur at the line he published, at HEAD — his table has not
 *      drifted since his pin, so every reading below is about the same sites he read.
 *   C. His §3 verdict is CONFIRMED BY DIRECT DRIVE, not by re-deriving his arithmetic — and the
 *      drive reds FOUR assertions, not the three he named. C5 is the extra one, and C5 is the
 *      mutation-target guard (347): it fails because the plant never landed in the drifted span.
 *      A prediction of redness and a red exit code are different evidence; this leg takes the
 *      second (my 329/367 lesson: run it, don't reason about it).
 *   D. THE LIVE CENSUS. Of the 15 rows, only EIGHT admit a live measurement at all — 4 whose
 *      haystack is `readFileSync` of a live path, and 4 whose haystack is a pinned `git show`
 *      blob (testable in the one way a pin can fail: the object going unreachable). The other
 *      SEVEN are structurally non-refusable — the refusal cannot occur, or is the measurement —
 *      so no live claim is made for them rather than a vacuous green.
 *
 *      Two rows come out differently than his severity read has them:
 *
 *      - `round393:133` — `rest` chases to `src`, the PARAMETER of `chainsOf(src)`. He re-keyed
 *        his resolver to nearest-preceding so it would stop refusing to see that (his §4, and it
 *        is the right fix). But the parameter has exactly ONE call site, `chainsOf(his392AtPin)`,
 *        and `his392AtPin = show('c848dc66', …)` — a pinned blob. Under HIS OWN FROZEN criterion,
 *        one call frame up, this row cannot drift. Still a latent defect; not live-reachable.
 *        A depth-N alias chase inside a file cannot cross a call boundary, which is the limit of
 *        the cure, not of the diagnosis.
 *      - `round396:87` — the needle `'rather than'` occurs **27×** in the live subject, not once.
 *        His memo points at `round397:88`'s `if (markerHits !== 1 …) process.exit(1)` as the cure
 *        "spelled correctly one round later". Transplanted verbatim, that guard REFUSES on this
 *        subject today. round397's anchor is unique by design; round396's is one-of-27 by design
 *        (`console.log('… CF-2 mutates the first')`). The defect is real and the cure needs
 *        re-aiming to `i >= 0` before it is copied — a routed cure is not validated by the
 *        finding that routed it (321/368).
 */
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const REPO = process.cwd();
const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const HEAD = git(['rev-parse', 'HEAD']).trim();
const HIS = 'docs/research/round402-instruments/hand-read-the-unguarded.mjs';

let refused = false;
const refuse = (why) => { refused = true; console.log(`REFUSED — ${why}`); return null; };

// ── A. his hand table, extracted rather than transcribed ─────────────────────────────────────────

const HAND = (() => {
  if (!existsSync(join(REPO, HIS))) return refuse(`his instrument is not at ${HIS}`);
  const src = readFileSync(join(REPO, HIS), 'utf8');
  const open = src.indexOf('const HAND = [');
  if (open < 0) return refuse('no `const HAND = [` in his instrument');
  const lb = src.indexOf('[', open);
  const term = src.indexOf('\n];', lb);
  if (term < 0) return refuse('his HAND table has no `\\n];` terminator');
  try { return Function(`return (${src.slice(lb, term + 2)});`)(); } catch (e) { return refuse(`his HAND table did not evaluate: ${e.message}`); }
})();

const PUBLISHED = { REAL: 4, FROZEN: 4, NONNEG: 2, 'TERM-GUARD': 2, PRECOND: 2, DELIBERATE: 1 };

const gradeA = (() => {
  if (HAND === null) return null;
  const byVerdict = {};
  for (const r of HAND) byVerdict[r.verdict] = (byVerdict[r.verdict] ?? 0) + 1;
  const lines = new Set(HAND.map((r) => `${r.p}:${r.line}`)).size;
  const files = new Set(HAND.map((r) => r.p)).size;
  const classesMatch = Object.keys(PUBLISHED).length === Object.keys(byVerdict).length
    && Object.entries(PUBLISHED).every(([k, v]) => byVerdict[k] === v);
  return { rows: HAND.length, lines, files, byVerdict, ok: HAND.length === 15 && lines === 13 && files === 12 && classesMatch };
})();

// ── B. every site still at its published line, at HEAD ───────────────────────────────────────────

const gradeB = (() => {
  if (HAND === null) return null;
  const rows = HAND.map((r) => {
    const p = join(REPO, r.p);
    if (!existsSync(p)) return { ...r, atLine: null, moved: true };
    const ls = readFileSync(p, 'utf8').split('\n');
    const here = (ls[r.line - 1] ?? '').trim();
    return { ...r, atLine: here, moved: here !== r.at.trim() };
  });
  return { rows, moved: rows.filter((x) => x.moved).map((x) => `${x.p}:${x.line}`), ok: rows.every((x) => !x.moved) };
})();

// ── C. his §3, by DRIVE — and a control, because a parse failure must not read as all-red ────────

const gradeC = (() => {
  const p = 'docs/research/round368-instruments/verdict-line-kind-grade.mts';
  if (!existsSync(join(REPO, p))) return refuse(`round368's instrument is not at ${p}`);
  let out = '';
  let code = 0;
  try {
    out = execFileSync('npx', ['tsx', p], { cwd: REPO, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    out = `${e.stdout ?? ''}${e.stderr ?? ''}`;
    code = e.status ?? -1;
  }
  // A summary line is the only thing that makes this a measurement (my 356/"exit 0 without a
  // summary line" lesson). No summary → refuse, do not grade.
  const summary = /^(FAILED — (\d+) assertion\(s\) failed|All \d+ assertions passed)/m.exec(out);
  if (summary === null) return refuse('round368 drove without printing a summary line; no claim is made');
  const fails = [...out.matchAll(/^FAIL \[([A-Z]\d+)\]/gm)].map((m) => m[1]);
  const passes = [...out.matchAll(/^PASS \[([A-Z]\d+)\]/gm)].map((m) => m[1]);
  const declared = summary[2] === undefined ? 0 : Number(summary[2]);
  return {
    code, fails, passCount: passes.length, declared, summary: summary[0],
    // the control: PASS lines must ALSO be present, or the regex is matching nothing and "all red"
    // is a selector artefact rather than a reading (382).
    control: passes.length > 0,
    ok: code !== 0 && passes.length > 0 && declared === fails.length
      && ['C1', 'C3', 'C4', 'C5'].every((id) => fails.includes(id)),
  };
})();

// ── D. the live census ───────────────────────────────────────────────────────────────────────────
//
// A row is LIVE only if its haystack reaches `readFileSync` of a path in the working tree. It is
// PINNED if the chain reaches `git show <rev>:<path>`. It is NON-REFUSABLE if the hand reading's
// class says the refusal cannot occur (NONNEG, TERM-GUARD) or is guarded by a precondition /
// deliberate (PRECOND, DELIBERATE) — those get no live claim at all.

const show = (rev, path) => {
  try { return git(['show', `${rev}:${path}`]); } catch { return null; }
};

// `in` is the instrument that does the reading; `rev`/`path` are what it reads. Both are checked
// back against that instrument's own source below — my FIRST drive of this leg had
// round389's filename transcribed wrong (`grade-the-two-lines-and-the-refusal.mjs` for
// `grade-the-census-key-and-the-asymmetric-pins.mjs`), `git show` said `does not exist in
// '311e5810'`, and for one minute that read like a pin going unreachable. That is my own 394/395
// lesson arriving in the leg built to apply it, so the pair is no longer trusted: ATTESTED below
// requires both literals to occur in the reader's source, and a wrong one reddens.
const PINS = [
  { row: 'round383:744', in: 'docs/research/round383-instruments/grade-the-binding-class.mjs', rev: 'e922394b', path: 'docs/research/round383-instruments/grade-the-binding-class.mjs', needle: /^\/\/ ── grades ─+$/m, kind: 'regex' },
  { row: 'round388:169', in: 'docs/research/round388-instruments/grade-the-uncaught-drive-and-the-window.mjs', rev: '5ad685d2', path: 'docs/research/round387-instruments/grade-the-routed-cure-against-its-own-pins.mjs', needle: "  'C1',", kind: 'string' },
  { row: 'round390:198', in: 'docs/research/round390-instruments/grade-the-declaration-and-the-object-key.mjs', rev: '311e5810', path: 'docs/research/round389-instruments/grade-the-census-key-and-the-asymmetric-pins.mjs', needle: "  'R1',", kind: 'string' },
  { row: 'probe-round283:162', in: 'scripts/probe-round283-the-classification-theseus-asked-for-exists-and-it-has-been-red-since-yesterday.mts', rev: '047e5f06', path: 'scripts/sweep-probes.mjs', needle: 'export const DEFERRED', kind: 'string' },
  // round393's haystack, resolved one call frame up — see §D3.
  { row: 'round393:133 (via the chainsOf call site)', in: 'docs/research/round393-instruments/grade-the-grade-that-is-green-on-one-machine.mjs', rev: 'c848dc66', path: 'docs/research/round392-instruments/grade-the-finding-that-is-its-own-finding.mjs', needle: '\n);', kind: 'string' },
];

const pinned = PINS.map((p) => {
  const rp = join(REPO, p.in);
  const readerSrc = existsSync(rp) ? readFileSync(rp, 'utf8') : null;
  const attested = readerSrc !== null && readerSrc.includes(p.rev) && readerSrc.includes(p.path);
  const blob = show(p.rev, p.path);
  const hits = blob === null ? null
    : p.kind === 'regex' ? (p.needle.test(blob) ? 1 : 0) : blob.split(p.needle).length - 1;
  return { ...p, attested, reachable: blob !== null, bytes: blob === null ? null : blob.length, hits };
});

// the control for the pin leg: a sha that cannot exist must come back unreachable, not empty-green.
const pinControl = show('0000000000000000000000000000000000000000', 'scripts/sweep-probes.mjs') === null;

// D2 — round396's live needle, read out of its own source rather than transcribed (394/395).
const d2 = (() => {
  const p = 'docs/research/round396-instruments/the-key-counterfactuals.mjs';
  if (!existsSync(join(REPO, p))) return null;
  const src = readFileSync(join(REPO, p), 'utf8');
  const sm = /const SUBJ = '([^']+)';/.exec(src);
  const nm = /const n = pristine\.split\('([^']+)'\)\.length - 1;/.exec(src);
  if (sm === null || nm === null) return null;
  const subj = join(REPO, sm[1]);
  if (!existsSync(subj)) return null;
  const hay = readFileSync(subj, 'utf8');
  const needle = nm[1];
  const hits = hay.split(needle).length - 1;
  // the cure he names, applied verbatim to THIS site:
  const his397CureWouldRefuse = hits !== 1;
  return { subj: sm[1], needle, hits, first: hay.indexOf(needle), his397CureWouldRefuse, pinned: false };
})();

// the control for D2's counter: a needle that cannot be in the subject must come back 0.
const d2Control = (() => {
  if (d2 === null) return null;
  const hay = readFileSync(join(REPO, d2.subj), 'utf8');
  return hay.split('zzz-no-such-needle-zzz').length - 1 === 0;
})();

// D3 — round393's parameter, resolved to its call sites.
const d3 = (() => {
  const p = 'docs/research/round393-instruments/grade-the-grade-that-is-green-on-one-machine.mjs';
  if (!existsSync(join(REPO, p))) return null;
  const src = readFileSync(join(REPO, p), 'utf8');
  const declRe = /const chainsOf = \((\w+)\) =>/;
  const dm = declRe.exec(src);
  if (dm === null) return null;
  const calls = [...src.matchAll(/chainsOf\(([^)]*)\)/g)].map((m) => ({ arg: m[1].trim(), off: m.index }));
  // resolve each argument to its own nearest-preceding declaration (399: nearest, not earliest).
  const resolved = calls.map((c) => {
    const re = new RegExp(`(?:const|let|var)\\s+${c.arg}\\s*=\\s*([^;]*);`, 'g');
    const cands = [...src.matchAll(re)].filter((m) => m.index < c.off);
    const near = cands.length ? cands[cands.length - 1] : null;
    return { ...c, init: near === null ? null : near[1].trim() };
  });
  const reachesShow = resolved.length > 0 && resolved.every((r) => r.init !== null && /\bshow\(/.test(r.init));
  // the control: a name that is not called must find 0 call sites, or the scanner matches anything.
  const control = [...src.matchAll(/chainsOfZZZ\(([^)]*)\)/g)].length === 0;
  return { param: dm[1], calls: resolved, reachesShow, control };
})();

const NONREFUSABLE = ['NONNEG', 'TERM-GUARD', 'PRECOND', 'DELIBERATE'];
const partition = HAND === null ? null : (() => {
  const nonref = HAND.filter((r) => NONREFUSABLE.includes(r.verdict));
  const live = HAND.filter((r) => r.verdict === 'REAL');
  const pin = HAND.filter((r) => r.verdict === 'FROZEN');
  return { nonref: nonref.length, live: live.length, pin: pin.length, testable: live.length + pin.length };
})();

const gradeD = pinned.every((p) => p.attested && p.reachable && p.hits !== null && p.hits >= 1)
  && pinControl
  && d2 !== null && d2.hits === 27 && d2Control === true
  && d3 !== null && d3.calls.length === 1 && d3.reachesShow && d3.control
  && partition !== null && partition.testable === 8 && partition.nonref === 7;

// ── output ───────────────────────────────────────────────────────────────────────────────────────

console.log(`Round 403 — the live census over all fifteen rows. HEAD ${HEAD.slice(0, 8)}.`);

console.log('\n── A: his hand table, extracted from his source ──');
if (gradeA === null) console.log('  REFUSED');
else {
  console.log(`  ${gradeA.rows} rows at ${gradeA.lines} lines in ${gradeA.files} files`);
  console.log(`  classes: ${JSON.stringify(gradeA.byVerdict)}`);
  console.log(`  published: ${JSON.stringify(PUBLISHED)}`);
}

console.log('\n── B: every site at its published line, at HEAD ──');
if (gradeB === null) console.log('  REFUSED');
else console.log(`  ${gradeB.rows.length - gradeB.moved.length} of ${gradeB.rows.length} unmoved; moved: [${gradeB.moved.join(', ')}]`);

console.log('\n── C: his §3 by DRIVE, not by re-derivation ──');
if (gradeC === null) console.log('  REFUSED');
else {
  console.log(`  exit ${gradeC.code} · ${gradeC.passCount} PASS · FAIL [${gradeC.fails.join(', ')}]`);
  console.log(`  summary: ${gradeC.summary}`);
  console.log(`  he predicted C1, C3, C4 red. The drive reds [${gradeC.fails.join(', ')}] — ${gradeC.fails.length}, not 3.`);
  console.log(`  control (PASS lines present, so "all red" is not a selector artefact): ${gradeC.control}`);
}

console.log('\n── D: the live census ──');
if (partition !== null) {
  console.log(`  of 15 rows: ${partition.testable} admit a live measurement (${partition.live} live-read + ${partition.pin} pinned),`);
  console.log(`  ${partition.nonref} are structurally non-refusable and get NO live claim (his ANCHOR-LIVE measured 1).`);
}
console.log('\n  D1 — the pinned haystacks, and the one way a pin can fail:');
for (const p of pinned) {
  console.log(`    ${p.reachable ? 'REACHABLE' : 'UNREACHABLE'} ${p.rev} · ${p.bytes ?? '-'} bytes · needle hits ${p.hits ?? '-'} · attested in reader ${p.attested} · ${p.row}`);
}
console.log(`    control (an impossible sha must refuse, not read empty-green): ${pinControl}`);
console.log('    ATTESTED means both the rev and the path occur in the reading instrument\'s own source, so a');
console.log('    transcribed pair reddens here instead of looking like an unreachable object (394/395).');
console.log('\n  D2 — round396:87, the row with real live exposure:');
if (d2 === null) console.log('    REFUSED — could not read SUBJ or the needle out of round396\'s source');
else {
  console.log(`    subject ${d2.subj}`);
  console.log(`    needle ${JSON.stringify(d2.needle)} → ${d2.hits} occurrence(s) at HEAD, first at offset ${d2.first}`);
  console.log(`    the cure he names (round397's \`!== 1\` → exit 1) would REFUSE on this subject today: ${d2.his397CureWouldRefuse}`);
  console.log(`    control (an absent needle reads 0): ${d2Control}`);
}
console.log('\n  D3 — round393:133, resolved one call frame up:');
if (d3 === null) console.log('    REFUSED — could not read chainsOf or its call sites');
else {
  console.log(`    chainsOf(${d3.param}) · ${d3.calls.length} call site(s)`);
  for (const c of d3.calls) console.log(`      chainsOf(${c.arg}) at offset ${c.off} · ${c.arg} = ${JSON.stringify(c.init)}`);
  console.log(`    every call site's argument reaches \`show(\`: ${d3.reachesShow} — so the haystack is a pinned blob, and the row cannot drift in the live tree`);
  console.log(`    control (an uncalled name finds 0 sites): ${d3.control}`);
}

const legs = {
  'GRADE A': gradeA === null ? null : gradeA.ok,
  'GRADE B': gradeB === null ? null : gradeB.ok,
  'GRADE C': gradeC === null ? null : gradeC.ok,
  'GRADE D': gradeD,
};
console.log('\n── gate ──');
let failed = refused;
for (const [k, v] of Object.entries(legs)) {
  if (v !== true) failed = true;
  console.log(`  ${v === true ? 'ok  ' : 'BAD '} ${k}: ${v}`);
}
console.log(failed ? '\nGATE FAILED — no headline is published from this drive.' : '\nGATE PASSED — all legs true.');
process.exit(failed ? 1 : 0);
