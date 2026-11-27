#!/usr/bin/env node
/**
 * unit-528 POST-HOC — two things the arm left undifferentiated, both found by reading its own
 * capture rather than by a new idea.
 *
 * 1. The arm's §6 printed one label, `REFUSED by the cure`, over 16 sites. That label FUSES
 *    MECHANISMS. KP2 PASSED on `bytes: src.length,` (want IDENT-IN-CODE, got IDENT-IN-CODE) — so
 *    the cure SELECTS that line and the CENSUS's region filter discards it. Calling that "refused
 *    by the cure" is false about the cure. This post-hoc splits the 16 into named mechanisms, with
 *    a fall-through bucket printed unconditionally so nothing is absorbed in silence.
 *
 * 2. The arm's BUF_DECL evidence detector reported 3 buffer-shaped declarations and P8 HIT on it.
 *    BUF_DECL was HAND-TYPED IN THE ARM AND NEVER GRADED. It gets a KP/KN set here, before its
 *    figure is used for anything.
 *
 * The cure, the published key, regionOf and the 28 are all re-derived from the same slices the arm
 * used; nothing is retyped from the capture except the SITE LIST, which is parsed out of
 * unit-526's own committed capture exactly as the arm did.
 */

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

process.chdir(execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim());

const SELF = 'docs/research/unit-528prefixform-2026-11-27/posthoc-four-mechanisms.mjs';
const ARM = 'docs/research/unit-528prefixform-2026-11-27/arm-prefixform.mjs';
const T_ARM = 'docs/research/unit-522lengthasbytes-2026-11-26/arm-lengthasbytes.mjs';
const T_PH = 'docs/research/unit-522lengthasbytes-2026-11-26/posthoc-which-133.mjs';
const U526_OUT = 'docs/research/unit-526fiftyeight-2026-11-26/captures/ARM.out';

const say = (...a) => console.log(...a);
const abort = (why) => { say(`\n  ABORT — ${why}`); process.exit(1); };
const V = [];
const gradeBool = (id, claim, got, want) => {
  const ok = got === want;
  V.push({ id, claim, verdict: ok ? 'HIT' : 'REFUTED' });
  say(`  ${ok ? 'HIT     ' : 'REFUTED '} ${id}  ${claim}`);
  say(`           registered ${want}   measured ${got}`);
};

function between(src, prefix, suffix, label) {
  const a = src.indexOf(prefix);
  if (a === -1) abort(`slice failed: prefix for ${label} not found`);
  if (src.indexOf(prefix, a + 1) !== -1) abort(`slice failed: prefix for ${label} occurs more than once`);
  const b = src.indexOf(suffix, a + prefix.length);
  if (b === -1) abort(`slice failed: suffix for ${label} not found`);
  return src.slice(a + prefix.length, b);
}
function compileLiteral(text, label) {
  const m = /^\/([\s\S]*)\/([a-z]*)$/.exec(text.trim());
  if (!m) abort(`slice failed: ${label} is not a regex literal`);
  return new RegExp(m[1], m[2]);
}

say('=== §1 SLICES — the cure out of THIS unit\'s own arm, the published key out of unit-522 ===\n');

const armSrc = readFileSync(ARM, 'utf8');
const tSrc = readFileSync(T_ARM, 'utf8');
const phSrc = readFileSync(T_PH, 'utf8');

const PREFIX_UNIT = compileLiteral(between(armSrc, 'const PREFIX_UNIT = ', ';\n', 'PREFIX_UNIT'), 'PREFIX_UNIT');
const UNIT_TAIL = compileLiteral(between(tSrc, 'const UNIT_TAIL = ', ';\n', 'UNIT_TAIL'), 'UNIT_TAIL');
const BUF_DECL = compileLiteral(between(armSrc, 'const BUF_DECL = ', ';\n', 'BUF_DECL'), 'BUF_DECL');
const regionFn = `function regionOf${between(phSrc, 'function regionOf', '\n}\n', 'regionOf')}\n}`;
const regionOf = new Function('stripSource', `${regionFn}; return regionOf;`)(stripSource);
say(`  PREFIX_UNIT (out of the arm, not retyped): ${PREFIX_UNIT}`);
say(`  UNIT_TAIL   (out of unit-522):             ${UNIT_TAIL}`);
say(`  BUF_DECL    (out of the arm — UNGRADED THERE, graded in §4 here): ${BUF_DECL}`);

/* ===================================================== §2 the 28, off unit-526's own capture */

const u526Out = readFileSync(U526_OUT, 'utf8');
const blockStart = u526Out.indexOf("P11 cause — arm-C-only sites where the unit token PRECEDES");
if (blockStart === -1) abort("unit-526's P11 block not found");
const declared = Number(u526Out.slice(blockStart).match(/: (\d+)/)?.[1] ?? NaN);
const blockEnd = u526Out.indexOf('\n\n', blockStart);
const the28 = [];
for (const l of u526Out.slice(blockStart, blockEnd).split('\n').slice(1)) {
  const m = l.match(/^\s{6}(\S+):(\d+)$/);
  if (m) the28.push({ p: m[1], n: Number(m[2]) });
}
if (the28.length !== declared) abort(`recovered ${the28.length}, unit-526 declared ${declared}`);

/* ===================================================== §3 THE FOUR MECHANISMS */

say(`\n=== §3 THE ${declared} SITES, SPLIT BY MECHANISM — a fall-through bucket printed unconditionally ===\n`);

/** Which mechanism keeps this site out of the cured census? Ordered; OTHER is the fall-through. */
function mechanismOf(p, n) {
  const src = readFileSync(p, 'utf8');
  const lines = src.split('\n');
  const line = lines[n - 1] ?? '';
  let off = 0;
  for (let k = 0; k < n - 1; k++) off += lines[k].length + 1;

  /* every `.length` on the line, so a multi-member line is handled per occurrence */
  const results = [];
  let i = line.indexOf('.length');
  while (i !== -1) {
    const head = line.slice(0, i);
    const headCut = head.slice(head.lastIndexOf('}') + 1);
    const after = i + '.length'.length;
    const rawTail = line.slice(after);
    const cut = rawTail.indexOf('${');
    const labelTail = cut === -1 ? rawTail : rawTail.slice(0, cut);

    const pubHit = UNIT_TAIL.test(labelTail);
    const preHit = headCut.match(PREFIX_UNIT);
    const headHit = head.match(PREFIX_UNIT);

    let mech, region = null;
    if (pubHit) {
      mech = 'A-ALREADY-PUBLISHED';
    } else if (preHit) {
      const tokAt = off + head.length - headCut.length + preHit.index + preHit[0].indexOf(preHit[1]);
      region = regionOf(src, tokAt);
      mech = region === 'LABEL-IN-STRING' ? 'B-CURED-ADDS-IT' : `C-REGION-FILTER(${region})`;
    } else if (headHit) {
      mech = 'D-BRACE-CUT';
    } else if (/bytes|byte/i.test(headCut)) {
      /* REPAIRED AFTER DRIVE 1, WHICH PUT 3 OF F'S MEMBERS IN E AND LEFT F VACUOUSLY 0.
       * Drive 1 asked `\b(?:B|b)ytes?(?=[A-Za-z0-9_])`, and the optional `s` let `byte` match the
       * PREFIX of `bytes` while the lookahead saw that very `s` — so `bytes attributable` read as
       * glued. Driven, not reasoned: `/(?:[A-Za-z0-9_])(?:B|b)ytes?\b|\b(?:B|b)ytes?(?=[A-Za-z0-9_])/`
       * returns "byte" on `bytes attributable…`, `(own bytes match…` and `(raw/comments/bytes)…`.
       * An undifferentiated match fusing two mechanisms, one level down from the one §3 was built
       * to split — and F reading 0 is what exposed it, which is why empty buckets are printed.
       *
       * Repaired by reading MAXIMAL identifier-ish runs containing the token and asking whether any
       * occurrence stands ALONE. If every occurrence is embedded in a longer identifier, the token
       * is glued; otherwise a bare token is present and something else refused the site. */
      const runs = headCut.match(/[A-Za-z0-9_]*(?:bytes|byte)[A-Za-z0-9_]*/gi) ?? [];
      const standsAlone = runs.some((r) => /^(?:bytes|byte)$/i.test(r));
      mech = standsAlone ? 'F-SEPARATOR-OR-SUBJECT-CLASS' : 'E-TOKEN-GLUED-TO-IDENTIFIER';
      if (runs.length === 0) mech = 'G-NO-TOKEN-IN-HEAD-AT-ALL';
    } else {
      mech = 'G-NO-TOKEN-IN-HEAD-AT-ALL';
    }
    results.push({ idx: i, mech, region, line });
    i = line.indexOf('.length', i + 1);
  }
  return results;
}

/* The E/F discriminator gets its own gate, because drive 1 published it ungraded and it was wrong.
 * `glued` is the same expression `mechanismOf` uses, lifted here so the gate tests the live one. */
const glued = (headCut) => {
  const runs = headCut.match(/[A-Za-z0-9_]*(?:bytes|byte)[A-Za-z0-9_]*/gi) ?? [];
  return runs.length === 0 ? 'NO-TOKEN' : runs.some((r) => /^(?:bytes|byte)$/i.test(r)) ? 'STANDS-ALONE' : 'GLUED';
};
say('\n  E/F DISCRIMINATOR GATE — the sub-key drive 1 published ungraded:\n');
const efKps = [
  { id: 'EF1', want: 'GLUED', s: "stderrBytes=${(child.stderr ?? '')", note: 'camelCase — the only truly glued shape in the 28' },
  { id: 'EF2', want: 'GLUED', s: 'stdout_bytes=${(r.stdout ?? ', note: 'snake_case — glued by an underscore' },
  { id: 'EF3', want: 'STANDS-ALONE', s: 'bytes attributable to the WIDENING: ${wide.stdout', note: 'DRIVE 1 CALLED THIS GLUED. A bare token, refused for the subject class.' },
  { id: 'EF4', want: 'STANDS-ALONE', s: '(own bytes match inside a live partition row): ${inPop', note: 'drive 1 called this glued too' },
  { id: 'EF5', want: 'STANDS-ALONE', s: '(raw/comments/bytes) that moved:  ${upstreamMoved', note: 'and this; a bare token with no separator after it' },
  { id: 'EF6', want: 'NO-TOKEN', s: 'say(`rows ${xs', note: 'no token at all' },
];
let efPass = 0;
for (const k of efKps) {
  const got = glued(k.s);
  const ok = got === k.want;
  if (ok) efPass += 1;
  say(`    ${ok ? 'PASS' : 'FAIL'}  ${k.id}  want ${k.want.padEnd(12)} got ${got.padEnd(12)}  ${k.note}`);
}
say(`\n    E/F discriminator: ${efPass} of ${efKps.length}`);
gradeBool('PH0', 'the E/F discriminator passes its own gate — the gate drive 1 did not have', efPass === efKps.length, true);
if (efPass !== efKps.length) abort('the E/F sub-key fails its own gate; the §3 split is not published off it.');

const BUCKETS = ['A-ALREADY-PUBLISHED', 'B-CURED-ADDS-IT', 'C-REGION-FILTER', 'D-BRACE-CUT',
  'E-TOKEN-GLUED-TO-IDENTIFIER', 'F-SEPARATOR-OR-SUBJECT-CLASS', 'G-NO-TOKEN-IN-HEAD-AT-ALL'];
const tally = Object.fromEntries(BUCKETS.map((b) => [b, []]));

for (const s of the28) {
  const rs = mechanismOf(s.p, s.n);
  /* the site's verdict is the BEST outcome among that line's `.length` occurrences, because
   * unit-526's list is keyed `path:line` and a line can carry several members */
  const order = (m) => BUCKETS.findIndex((b) => m.startsWith(b));
  const best = rs.slice().sort((a, b) => order(a.mech) - order(b.mech))[0];
  const bucket = BUCKETS.find((b) => best.mech.startsWith(b));
  tally[bucket].push({ ...s, mech: best.mech, line: best.line.trim(), occurrences: rs.length });
}

let total = 0;
for (const b of BUCKETS) {
  const rows = tally[b];
  total += rows.length;
  say(`  ${b.padEnd(30)} ${String(rows.length).padStart(2)}`);
  for (const r of rows) {
    say(`      ${r.p}:${r.n}${r.occurrences > 1 ? `  (${r.occurrences} .length occurrences on the line)` : ''}   ${r.mech}`);
    say(`        ${r.line.slice(0, 190)}`);
  }
  if (rows.length === 0) say('      (empty — printed anyway, so an empty bucket is a measurement and not a silence)');
}
say(`\n  partition check: ${total} of ${declared} — ${total === declared ? 'EVERY site is in exactly one bucket' : 'PARTITION BROKEN'}`);
gradeBool('PH1', `the ${declared} partition cleanly across the named mechanisms`, total === declared, true);
gradeBool('PH2', 'the cure adds a MINORITY of the 28 — the single-mechanism story in the arm is wrong',
  tally['B-CURED-ADDS-IT'].length < declared / 2, true);
gradeBool('PH3', "the arm's single label `REFUSED by the cure` covered more than one mechanism",
  BUCKETS.filter((b) => b !== 'A-ALREADY-PUBLISHED' && b !== 'B-CURED-ADDS-IT' && tally[b].length > 0).length > 1, true);

/* ===================================================== §4 BUF_DECL gets the gate it never had */

say('\n=== §4 THE ARM\'S OWN EVIDENCE DETECTOR, GRADED — P8 rested on this and it was never tested ===\n');

const bufKps = [
  { id: 'BK1', want: true, note: 'readFileSync with NO encoding — a real Buffer', line: "const before = readFileSync(join(CAP, 'd4-clean-after-reset.out'));" },
  { id: 'BK2', want: true, note: 'Buffer.from — a real Buffer', line: 'const b = Buffer.from(s, "utf8");' },
  { id: 'BN1', want: false, note: "readFileSync WITH 'utf8' and NO nested call — a string", line: "const s = readFileSync(PATH, 'utf8');" },
  { id: 'BN2', want: false, note: "readFileSync WITH 'utf8' BEHIND A NESTED CALL — a string, and this is the shape in the 28", line: "const sliceText = readFileSync(join(REPO, SLICE), 'utf8');" },
  { id: 'BN3', want: false, note: 'a plain string assignment', line: 'const t = other.slice(a, b);' },
];
for (const k of bufKps) {
  k.got = BUF_DECL.test(k.line);
  k.ok = k.got === k.want;
  say(`  ${k.ok ? 'PASS' : 'FAIL'}  ${k.id}  want ${String(k.want).padEnd(5)} got ${String(k.got).padEnd(5)}  ${k.note}`);
  say(`        ${k.line}`);
}
const bufPass = bufKps.filter((k) => k.ok).length;
say(`\n  BUF_DECL: ${bufPass} of ${bufKps.length}`);
gradeBool('PH4', "BUF_DECL passes its own KP/KN set — i.e. P8's figure of 3 may be used as stated",
  bufPass === bufKps.length, true);

/* The repaired detector, and the figure recomputed under it. */
const BUF_DECL_FIXED = /readFileSync\((?![\s\S]*?['"](?:utf-?8|ascii|latin1|hex|base64)['"])[^;]*\)|Buffer\.(?:from|alloc|concat)\(|encoding:\s*['"]buffer['"]/;
say(`\n  REPAIRED: ${BUF_DECL_FIXED}`);
for (const k of bufKps) {
  const got = BUF_DECL_FIXED.test(k.line);
  say(`  ${got === k.want ? 'PASS' : 'FAIL'}  ${k.id}  want ${String(k.want).padEnd(5)} got ${String(got).padEnd(5)}  (repaired)`);
}
const fixedOk = bufKps.every((k) => BUF_DECL_FIXED.test(k.line) === k.want);
gradeBool('PH5', 'the REPAIRED detector passes all five', fixedOk, true);

/* Recount the 28's buffer-shaped declarations under both detectors. */
const SUBJ = /([A-Za-z_$][\w$]*(?:\??\.[A-Za-z_$][\w$]*|\[[^\]]*\])*)$/;
const counts = { old: [], fixed: [] };
for (const s of the28) {
  const src = readFileSync(s.p, 'utf8');
  const lines = src.split('\n');
  const line = lines[s.n - 1] ?? '';
  const i = line.indexOf('.length');
  const subj = i === -1 ? null : (line.slice(0, i).match(SUBJ)?.[1] ?? null);
  const root = subj ? subj.split(/[.?[]/)[0] : null;
  if (!root) continue;
  const declRe = new RegExp(`(?:const|let|var)\\s+(?:\\{[^}]*\\b${root}\\b[^}]*\\}|\\[[^\\]]*\\b${root}\\b[^\\]]*\\]|${root})\\b|\\b${root}\\s*=[^=]`);
  const decls = [];
  lines.forEach((l, k) => { if (k + 1 !== s.n && declRe.test(l)) decls.push(l.trim()); });
  const cap = decls.slice(0, 4);
  if (cap.some((d) => BUF_DECL.test(d))) counts.old.push(`${s.p}:${s.n}`);
  if (cap.some((d) => BUF_DECL_FIXED.test(d))) counts.fixed.push(`${s.p}:${s.n}`);
}
say(`\n  of the ${declared}, buffer-shaped declaration elsewhere in the file:`);
say(`      under the ARM's detector:     ${counts.old.length}   ${counts.old.join(', ')}`);
say(`      under the REPAIRED detector:  ${counts.fixed.length}   ${counts.fixed.join(', ')}`);
gradeBool('PH6', "P8's claim survives the repair — at least one of the 28 is a Buffer declared on another line",
  counts.fixed.length >= 1, true);
gradeBool('PH7', "the ARM's detector OVER-reported, so P8's supporting count was inflated",
  counts.old.length > counts.fixed.length, true);

/* ===================================================== §5 grading */

say('\n=== §5 POST-HOC GRADING ===\n');
for (const v of V) say(`  ${v.verdict.padEnd(8)} ${v.id.padEnd(5)} ${v.claim}`);
say(`\n  ${V.filter((v) => v.verdict === 'HIT').length} HIT / ${V.filter((v) => v.verdict === 'REFUTED').length} REFUTED of ${V.length}`);
say(`\n  SELF: ${SELF}`);
