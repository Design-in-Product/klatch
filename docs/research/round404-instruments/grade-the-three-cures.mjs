/**
 * Round 404, Theseus — grading MY OWN three cures, the ones I named in Round 402 §7 as "mine, no
 * blocker" and Daedalus confirmed in Round 403 as unrouted and unblocked.
 *
 * The cures: round368's unpinned live read (the one of the four REALs that had ALREADY FIRED),
 * round396's unguarded CF-2 mutation target, round393's unguarded `g(` terminator — plus the
 * SIBLING of the round393 row, same mechanism in the same directory, which is NOT in the census's
 * 15 because the census keys a window call to a `const <name> =` binding and that one is inline.
 *
 * Built against the lessons this family has paid for:
 *
 *   397 — a cure driven only in its own post-cure tree cannot catch what it moved. Leg S is a
 *         2 × 2: {old spelling, new spelling} × {pre-cure tree, post-cure tree}, 4 sites, 16 cells,
 *         with the pre-cure side read out of git at a recorded rev rather than remembered.
 *   369 — a source-text regex must not be the only guard on a figure. Leg B reads the four recorded
 *         drives and refuses if a drive has no summary line (356) rather than grading a truncated
 *         run; the direction of the move is asserted, not the presence of a comment.
 *   347 — assert your mutation target before mutating. Leg R drives each cure's REFUSAL path by
 *         substituting ONE literal in a temp copy, and each substitution asserts its anchor occurs
 *         exactly once first. A guard that has never fired is an unproven guard.
 *   403 §4 — every (rev, path) pair is ATTESTED: both literals must occur in the cured file's own
 *         source, so a transcription error fails as a transcription error.
 *   382/386 — every leg carries a control that must come back FALSE, and the controls vary the axis
 *         the leg could be vacuous on.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const REPO = fileURLToPath(new URL('../../..', import.meta.url));
const git = (a) => execFileSync('git', a, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
const live = (p) => readFileSync(join(REPO, p), 'utf8');
const show = (rev, p) => git(['show', `${rev}:${p}`]);

/** The tree these cures were written against: HEAD at the moment this fire opened. */
const PRE = '7e788af7';

let failures = 0;
const pass = (id, label, detail) => console.log(`PASS [${id}] ${label}\n        ${detail}`);
const fail = (id, label, detail) => {
  failures += 1;
  console.log(`FAIL [${id}] ${label}\n        ${detail}`);
};
const check = (id, label, got, want, detail) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  (ok ? pass : fail)(id, label, `${detail} — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
};
const meas = (id, label, detail) => console.log(`MEAS [${id}] ${label}\n        ${detail}`);

const OUT = 'docs/research/round404-instruments';

// ── P — the round368 pin was MEASURED, not chosen ───────────────────────────
// A pin picked by eye is a transcription with extra steps. The claim written into the cured file is
// "`3664849a` is the newest rev at which both anchors resolve in order"; this leg is where that
// sentence comes from. Both anchor literals are read OUT OF the cured file rather than retyped
// (394/395 — a transcribed anchor is a different string from the one that runs).
const CURED_368 = 'docs/research/round368-instruments/verdict-line-kind-grade.mts';
const src368 = live(CURED_368);
const anchorOf = (label, re) => {
  const m = src368.match(re);
  if (!m) {
    console.error(`REFUSED: cannot read ${label} out of ${CURED_368}; every figure in leg P would be about a string this file does not contain.`);
    process.exit(1);
  }
  return m[1];
};
const A1 = anchorOf('anchor 1 (loopStart)', /const loopStart = SRC\.indexOf\('([^']+)'\)/);
const A2 = anchorOf('anchor 2 (verdictLog)', /const verdictLog = SRC\.indexOf\('([^']+)'\)/);
const PIN_368 = anchorOf('the pin', /const SUBJ_PIN = '([0-9a-f]+)'/);
const PATH_368 = anchorOf('the pinned path', /const SUBJ_PATH = '([^']+)'/);
meas('P', 'anchors and pin, read out of the cured file', `A1 ${JSON.stringify(A1)} · A2 ${JSON.stringify(A2)} · pin ${PIN_368} · path ${PATH_368}`);

const ordered = (src) => {
  const a = src.indexOf(A1);
  const b = src.indexOf(A2);
  return { a, b, ok: a >= 0 && b >= 0 && b > a };
};
const touching = git(['log', '--format=%h', '--', PATH_368]).trim().split('\n');
const resolving = [];
for (const r of touching) {
  let src;
  try {
    src = show(r, PATH_368);
  } catch {
    continue;
  }
  if (ordered(src).ok) resolving.push(r);
  if (resolving.length) break; // newest-first: the first hit is the answer
}
const newestResolving = resolving[0] ?? null;
meas('P', 'revs touching the subject, newest-first', `${touching.length} rev(s); newest at which both anchors resolve in order: ${newestResolving ?? 'NONE'}`);
check('P1', 'the pin in the cured file IS the newest rev at which both anchors resolve in order', newestResolving === PIN_368, true, `pin ${PIN_368}, measured ${newestResolving}`);

let pinBlob = null;
try {
  pinBlob = show(PIN_368, PATH_368);
} catch (e) {
  pinBlob = null;
}
check('P2', 'the pinned object is REACHABLE and its anchors resolve in order', pinBlob ? ordered(pinBlob).ok : 'UNREACHABLE', true, pinBlob ? `blob ${pinBlob.length} bytes, loopStart ${ordered(pinBlob).a}, verdictLog ${ordered(pinBlob).b}` : 'git show refused');
check('P3', 'CONTROL — the pin is strictly newer than nothing newer resolves: HEAD does NOT resolve', ordered(live(PATH_368)).ok, false, `at the live tree loopStart ${ordered(live(PATH_368)).a}, verdictLog ${ordered(live(PATH_368)).b} — this is the firing the cure repairs`);
check('P4', 'CONTROL — a needle that cannot occur finds nothing at the pin, so the scanner is not matching anything', pinBlob ? pinBlob.includes('for (const s of SWEPT_ZZ) {') : null, false, 'an impossible anchor must be absent');
check('P5', 'ATTESTED (403 §4) — the (rev, path) pair both occur in the cured file itself', src368.includes(`'${PIN_368}'`) && src368.includes(`'${PATH_368}'`), true, 'a transcribed pair fails as a transcription error, not as an unreachable blob');

// ── S — the 2 × 2: {old, new} spelling × {pre-cure, post-cure} tree ─────────
// 397's lesson, in the shape it was learned in: a counterfactual that only ever drives the CURED
// state cannot catch a claim that is wrong in the other one. Each site contributes four cells and
// all four must hold.
const SITES = [
  {
    id: 'round368',
    p: CURED_368,
    old: "const SRC = readFileSync(new URL('../../../scripts/sweep-probes.mjs', import.meta.url), 'utf8');",
    nw: "const SUBJ_PIN = '3664849a';",
  },
  {
    id: 'round396',
    p: 'docs/research/round396-instruments/the-key-counterfactuals.mjs',
    old: "const i = pristine.indexOf('rather than');\nreport('CF-2",
    nw: "REFUSED: CF-2's mutation target 'rather than' does not occur in",
  },
  {
    id: 'round393-named',
    p: 'docs/research/round393-instruments/grade-the-grade-that-is-green-on-one-machine.mjs',
    old: "const end = rest.indexOf('\\n);');\n    const body = rest.slice(0, end);",
    nw: "attribute a later grade's verdict to this one",
  },
  {
    id: 'round393-sibling',
    p: 'docs/research/round393-instruments/counterfactuals-for-the-p2-detector.mjs',
    old: "const body = rest.slice(0, rest.indexOf('\\n);'));",
    nw: 'the SIBLING of the census row',
  },
];
const SENTINEL = 'a string no file in this corpus contains \u2014 round404 control';
const cells = [];
for (const s of SITES) {
  const before = show(PRE, s.p);
  const after = live(s.p);
  const row = {
    id: s.id,
    oldInPre: before.includes(s.old),
    oldInPost: after.includes(s.old),
    newInPre: before.includes(s.nw),
    newInPost: after.includes(s.nw),
  };
  cells.push(row);
  meas('S', `${s.id}`, `old@pre ${row.oldInPre} · old@post ${row.oldInPost} · new@pre ${row.newInPre} · new@post ${row.newInPost}`);
}
check('S1', 'every site: the OLD spelling was PRESENT in the pre-cure tree', cells.map((c) => c.oldInPre), cells.map(() => true), `pre-cure tree ${PRE}`);
check('S2', 'every site: the OLD spelling is GONE in the post-cure tree', cells.map((c) => c.oldInPost), cells.map(() => false), 'the cure replaced it rather than annotating it');
check('S3', 'every site: the NEW spelling was ABSENT in the pre-cure tree', cells.map((c) => c.newInPre), cells.map(() => false), 'so the new text is this fire\u2019s, not something that was already there');
check('S4', 'every site: the NEW spelling is PRESENT in the post-cure tree', cells.map((c) => c.newInPost), cells.map(() => true), 'read live, not from the diff');
check('S5', 'CONTROL — a sentinel absent from every file reads absent in all four cells', SITES.map((s) => show(PRE, s.p).includes(SENTINEL) || live(s.p).includes(SENTINEL)), SITES.map(() => false), 'otherwise `includes` is answering true for anything');
check('S6', 'the pre-cure rev is the one named in this file and it is an ANCESTOR of the live tree', (() => {
  try {
    git(['merge-base', '--is-ancestor', PRE, 'HEAD']);
    return true;
  } catch {
    return false;
  }
})(), true, `PRE = ${PRE}`);

// ── B — the recorded drives moved in the direction claimed ──────────────────
// Read from the `.out` files written this fire. A drive with no summary line is REFUSED rather than
// graded (356): exit 0 with no verdict is not a measurement.
const readOut = (f) => {
  const p = join(REPO, OUT, f);
  if (!existsSync(p)) {
    console.error(`REFUSED: ${f} does not exist; leg B would be grading a drive that did not happen.`);
    process.exit(1);
  }
  const t = readFileSync(p, 'utf8');
  const m = t.match(/\[exit (-?\d+)\]/);
  if (!m) {
    console.error(`REFUSED: ${f} carries no \`[exit n]\` line; a truncated run must not be graded (356).`);
    process.exit(1);
  }
  return { text: t, exit: Number(m[1]) };
};
const pre368 = readOut('round368-precure.out');
const post368 = readOut('round368-postcure.out');
const failIds = (t) => [...t.matchAll(/^FAIL \[([^\]]+)\]/gm)].map((m) => m[1]);
const passCount = (t) => (t.match(/^PASS \[/gm) || []).length;
meas('B', 'round368, pre-cure vs post-cure', `pre exit ${pre368.exit}, ${passCount(pre368.text)} PASS, FAIL [${failIds(pre368.text).join(', ')}] · post exit ${post368.exit}, ${passCount(post368.text)} PASS, FAIL [${failIds(post368.text).join(', ')}]`);
check('B1', 'round368 was RED before the cure, on the four C assertions Daedalus drove in 403', [pre368.exit, failIds(pre368.text)], [1, ['C1', 'C3', 'C4', 'C5']], 'his drive and mine agree member-for-member, not just on the count (340)');
check('B2', 'round368 is GREEN after the cure, and the PASS lines are still there', [post368.exit, failIds(post368.text).length, passCount(post368.text) > passCount(pre368.text)], [0, 0, true], 'exit 0 with no PASS lines would be a selector matching nothing (382)');

const pre396 = readOut('round396-precure.out');
const post396 = readOut('round396-postcure.out');
const body396 = (o) => o.text.split('\n').filter((l) => l.startsWith('CONTROL') || l.startsWith('CF-') || l.trim().startsWith('NEW key:')).join('\n');
check('B3', 'round396: the cure moved NOTHING in the live reading — every CF line identical pre and post', body396(pre396) === body396(post396) && body396(post396).length > 0, true, `${body396(post396).split('\n').length} compared line(s); a guard on a refusal that does not occur must be a no-op today`);
check('B4', "round396: CF-2's recorded prediction-mismatch SURVIVES the cure", post396.text.includes('*** PREDICTED D1 RED ***'), true, 'this is the correction the silent failure would have masked — a corrupted subject would very likely print `D1 RED` and read AS PREDICTED');
const pre393 = readOut('round393-postcure.out');
const pre393s = readOut('round393-sibling-postcure.out');
check('B5', 'round393 and its sibling both still drive green after the cure', [pre393.exit, pre393s.exit], [0, 0], 'the guards are no-ops on a well-formed subject');

// ── R — each cure's REFUSAL path actually fires ─────────────────────────────
// A guard that has never fired is an unproven guard. Each counterfactual substitutes ONE literal in
// a temp copy beside the original (so relative imports resolve), asserts that literal occurs exactly
// once first (347), drives it, and asserts MY refusal text — not merely a non-zero exit, because a
// wrong-reason failure and a right-reason refusal are the same exit code.
const tmps = [];
const refusalLegSafe = (id, label, path, from, to, wantText) => {
  const src = live(path);
  const hits = src.split(from).length - 1;
  if (hits !== 1) {
    fail(id, label, `MUTATION TARGET NOT UNIQUE — ${JSON.stringify(from)} occurs ${hits}\u00d7 in ${path} (347)`);
    return;
  }
  const tmp = path.replace(/\/([^/]+)$/, '/.round404-cf-$1');
  const abs = join(REPO, tmp);
  tmps.push(abs);
  writeFileSync(abs, src.replace(from, to));
  let out = '';
  let status = 0;
  try {
    out = execFileSync('npx', ['tsx', tmp], { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28, timeout: 180000 });
  } catch (e) {
    status = e.status ?? 'threw';
    out = `${e.stdout ?? ''}${e.stderr ?? ''}`;
  }
  const right = out.includes(wantText);
  check(id, label, [status !== 0, right], [true, true], `exit ${status}; refusal text ${right ? 'found' : `NOT FOUND, got ${JSON.stringify(out.slice(-240))}`}`);
};

try {
  refusalLegSafe(
    'R1',
    'round368: pinned at a rev where the anchor does NOT resolve, the cure refuses instead of slicing a garbage span',
    CURED_368,
    "const SUBJ_PIN = '3664849a';",
    "const SUBJ_PIN = 'ecf091ba';",
    "REFUSED: section C's anchors do not resolve in order",
  );
  refusalLegSafe(
    'R2',
    'round396: with the mutation target absent from the subject, CF-2 refuses instead of corrupting it',
    'docs/research/round396-instruments/the-key-counterfactuals.mjs',
    "const i = pristine.indexOf('rather than');",
    "const i = pristine.indexOf('a phrase the subject does not contain');",
    "REFUSED: CF-2's mutation target",
  );
  refusalLegSafe(
    'R3',
    'round393: with no `g(` terminator findable, the parser refuses instead of failing wide',
    'docs/research/round393-instruments/grade-the-grade-that-is-green-on-one-machine.mjs',
    "const end = rest.indexOf('\\n);');",
    "const end = rest.indexOf('\\nZZZ);');",
    'REFUSED: the `g(` call named',
  );
} finally {
  for (const t of tmps) rmSync(t, { force: true });
  const leaked = tmps.filter((t) => existsSync(t));
  check('R4', 'CONTROL — every counterfactual copy is removed on every exit path', leaked, [], `${tmps.length} temp file(s) written and removed`);
}

// ── M — the mechanism, not just the reported instance ───────────────────────
// The sibling I cured above is the same defect as the census row, in the same directory, and it is
// not in the 15 — because the census keys a window call to a `const <name> =` binding and this one
// is INLINE in the `slice` argument, with no name to key. This leg counts that spelling corpus-wide.
// It is narrow on purpose and published as narrow: ONE spelling (`slice(` with an `indexOf(` inside
// its argument list, no intervening binding), not a general census of inline window calls.
const files = git(['ls-files', 'docs/research', 'scripts']).trim().split('\n').filter((f) => /\.(mjs|mts|ts|js)$/.test(f));
const INLINE = /\.slice\(\s*0\s*,\s*[A-Za-z0-9_$.]+\.(?:indexOf|lastIndexOf)\(/g;
const inlineHits = [];
for (const f of files) {
  const t = live(f);
  for (const m of t.matchAll(INLINE)) {
    inlineHits.push(`${f}:${t.slice(0, m.index).split('\n').length}`);
  }
}
meas('M', 'inline (unnamed) window calls of the cured spelling, live tree', `${inlineHits.length} site(s) in ${new Set(inlineHits.map((h) => h.split(':')[0])).size} file(s)${inlineHits.length ? `: ${inlineHits.join(', ')}` : ''}`);
const siblingPre = show(PRE, 'docs/research/round393-instruments/counterfactuals-for-the-p2-detector.mjs');
check('M1', 'KNOWN POSITIVE — the detector finds the sibling I cured, read out of the PRE-cure blob', (siblingPre.match(INLINE) || []).length, 1, 'the KP has to be the pre-cure text, because the cure removed the live one (the only form that carries the property)');
check('M2', 'CONTROL — the same detector finds nothing in a string with the binding form instead', ('const end = x.indexOf("y");\nconst b = x.slice(0, end);'.match(INLINE) || []).length, 0, 'the named form is the census\u2019s population, not this one');
// M3 as first written was `inlineHits.length === 0` — "the live tree carries ZERO of this spelling
// after the cure" — and it came back 6. The expectation was written before the detector drove,
// which is the only reason the number surfaced at all (383/386), and the honest move is to re-aim
// it rather than relax it: what the cure can be held to is the files it touched. The other 6 are a
// finding, published below and routed, not swept into a green.
const CURED_FILES = SITES.map((s) => s.p);
check('M3', 'the files this fire cured carry ZERO of the inline spelling', inlineHits.filter((h) => CURED_FILES.includes(h.split(':')[0])), [], 'the cure is complete over its own scope');

// M4 — the load-bearing half of the finding: this class is invisible to the census's key, and the
// evidence is that it does not live in the census's files at all.
const hand = show(PRE, 'docs/research/round402-instruments/hand-read-the-unguarded.mjs');
const CENSUS_FILES = new Set([...hand.matchAll(/^    p: '([^']+)',$/gm)].map((m) => m[1]));
const inlineFiles = [...new Set(inlineHits.map((h) => h.split(':')[0]))];
meas('M', "the census's own population, parsed out of round402's hand table", `${CENSUS_FILES.size} distinct file(s) across the 15 rows`);
check('M4', 'CONTROL — the parse really found the census population (a file known to be in it reads IN)', CENSUS_FILES.has('docs/research/round393-instruments/grade-the-grade-that-is-green-on-one-machine.mjs'), true, 'otherwise an empty set would make M5 vacuously true');
check('M5', 'every inline site sits in a file the 15 never names — the class is invisible to the key, not merely unlisted', inlineFiles.filter((f) => CENSUS_FILES.has(f)), [], `${inlineFiles.length} file(s) carrying the inline form: ${inlineFiles.join(', ')}`);
meas('M', 'OPEN AND ROUTED — inline window calls outside the cured scope', `${inlineHits.length} site(s): ${inlineHits.filter((h) => !CURED_FILES.includes(h.split(':')[0])).join(', ')} — unread by eye this fire; each needs the same REAL/NONNEG/FROZEN read the 15 got before any of them is called a defect`);

// ── Verdict ─────────────────────────────────────────────────────────────────
const word = failures === 0 ? 'ALL CURES GRADED GREEN' : 'CURE GRADING FAILED';
console.log(`\n${word} — ${failures} assertion(s) failed. Legs: P (pin measured), S (2\u00d72 old/new \u00d7 pre/post), B (drive direction), R (refusals fire), M (mechanism census).`);
process.exit(failures === 0 ? 0 : 1);
