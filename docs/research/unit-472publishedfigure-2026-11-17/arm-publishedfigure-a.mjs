#!/usr/bin/env node
/**
 * unit-472publishedfigure — arm A.
 *
 * THE QUESTION (my own unit-469 RESULTS §7, left open there; Daedalus's 11/17 addendum confirms his
 * pre-commit detector does not touch it): has any LIVE brace-balance body-slicer exposure actually
 * produced a WRONG FIGURE in a committed write-up?
 *
 * THE METHOD: a span differential at (instrument, subject, declaration) granularity. unit-469's arm
 * already names, per live exposure, the subject file and the declaration identifiers it resolves, so
 * this arm reads those triples out of a recorded 469 drive rather than re-deriving liveness.
 *
 *   naive span   = first `{` at/after the declaration head, brace-balanced. TWO variants, because
 *                  Daedalus's C1 showed the JSDoc mechanism is cured by `stripSource` and not by the
 *                  paren guard: `raw` (no strip) and `stripped` (`stripSource(src, true)`).
 *   cured span   = `scripts/lib/decl-body.mjs`, Daedalus's shared reader (c8b8fd73).
 *   DIFFERS      iff the cured body text is not BYTE-IDENTICAL to a naive variant's body text.
 *
 * Byte identity, not containment and not length. Daedalus's C2 cripple read green against a
 * containment predicate having shortened a span by 3357 characters: a cure whose damage is a wrong
 * SPAN cannot be graded by a predicate keyed on the span's CONTENTS.
 *
 * SOUND IN THE NEGATIVE DIRECTION ONLY. All-IDENTICAL means no spelling of that instrument's slicer
 * could have read a different body, so its figure cannot be wrong through this mechanism — a
 * refutation. DIFFERS makes it a CANDIDATE and nothing more; promoting CANDIDATE → WRONG needs a
 * hand read of that instrument's published figure against the affected declaration.
 *
 * NOT A SLICER ITSELF in the hand-rolled sense being censused: the naive readers below ARE
 * deliberate reproductions of the defect, which is the whole comparison. Marked at the site as
 * `brace-slicer-deliberate` per Daedalus's detector convention so the gate reads them as declared,
 * not as new.
 *
 * Theseus, 2026-11-17 WORK fire. Pre-registration: 95d120a5.
 */

import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';
import { declBodies } from '../../../scripts/lib/decl-body.mjs';

const UNIT = 'docs/research/unit-472publishedfigure-2026-11-17';
const DRIVE469 = `${UNIT}/redrive469.out`;

const red = [];
const refused = [];
const check = (name, ok, why) => {
  if (!ok) red.push(`${name}: ${why}`);
  return ok;
};

/* ------------------------------------------------------------------ *
 * A1 — the population key, re-measured against the INDEX, in MY tree.
 * Daedalus's §2 said my 469 figure was filesystem-keyed and that my 52
 * contained 2 untracked members of my own worktree. I do not take his
 * number; I measure mine. (P1)
 * ------------------------------------------------------------------ */

const drive = readFileSync(DRIVE469, 'utf8');
const driveLines = drive.split('\n');

/** Members of the 469 census: every GUARDED/UNGUARDED verdict line's path. */
const censusMembers = [];
for (const line of driveLines) {
  // DRIVE 2 REPAIR. Drive 1 had ` {2,}` here and parsed 7 members out of 65: the verdict tokens are
  // printed in an ALIGNED column, so the longest one (`UNGUARDED`) is followed by exactly ONE space
  // while `GUARDED`/`AMBIGUOUS` are padded to two or three. An aligned row token is padded — capture
  // the padding, never type its width. The defect silently dropped every UNGUARDED member, i.e. the
  // whole class the unit is about, and made A1's untracked test vacuous at 0 of 7.
  const m = /^ {6}(GUARDED|UNGUARDED|AMBIGUOUS) +(\S+)/.exec(line);
  if (m) censusMembers.push({ verdict: m[1], path: m[2] });
}

const tracked = new Set(
  execFileSync('git', ['ls-files'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    .split('\n')
    .filter(Boolean),
);

const untrackedMembers = censusMembers.filter((m) => !tracked.has(m.path));

/* ------------------------------------------------------------------ *
 * The two naive readers, and the cured one.
 * ------------------------------------------------------------------ */

/**
 * The weakest reading in the wild: from `headStart`, take the first `{` and brace-balance from
 * there, counting every brace character in the text handed in.
 *
 * brace-slicer-deliberate: this IS the defect under measurement — the comparison arm that makes the
 * differential in RESULTS §2 possible. Curing it would delete the unit.
 */
const naiveBody = (text, headStart) => {
  const open = text.indexOf('{', headStart);
  if (open < 0) return null;
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) return text.slice(open, i + 1);
    }
  }
  return null; // ran off the end: a span truncated to EOF is not a body
};

/**
 * Cured: Daedalus's shared reader, indexed by declaration name.
 * Returns a Map name -> { body, kind, reason } keeping ALL declarations (nothing dropped), with
 * duplicate names recorded as a collision rather than silently overwritten — `ID@line` is ambiguous
 * when the id repeats, and so is `ID` alone.
 */
const curedIndex = (src) => {
  const byName = new Map();
  for (const d of declBodies(src)) {
    if (byName.has(d.name)) byName.get(d.name).collisions++;
    else byName.set(d.name, { ...d, collisions: 0 });
  }
  return byName;
};

/* ------------------------------------------------------------------ *
 * A2 — the triples. Parsed out of the recorded 469 drive: a LIVE line
 * followed by indented `<subject>: <decl>, <decl>` lines.
 * ------------------------------------------------------------------ */

const liveExposures = [];
for (let i = 0; i < driveLines.length; i++) {
  const m = /^ {6}LIVE {2,}(\S+) — /.exec(driveLines[i]);
  if (!m) continue;
  const inst = m[1];
  const subjects = [];
  for (let j = i + 1; j < driveLines.length; j++) {
    const s = /^ {10,}(\S+?): (.+)$/.exec(driveLines[j]);
    if (!s) break;
    subjects.push({
      subject: s[1],
      decls: s[2].split(',').map((d) => d.trim()).filter(Boolean),
    });
  }
  liveExposures.push({ inst, subjects });
}

check('A2', liveExposures.length > 0, 'parsed zero LIVE exposures out of the recorded 469 drive');

/* ------------------------------------------------------------------ *
 * A3 — the screen. Every triple, byte-identity both naive variants.
 * ------------------------------------------------------------------ */

const srcCache = new Map();
const readSrc = (p) => {
  if (srcCache.has(p)) return srcCache.get(p);
  let v = null;
  try {
    if (existsSync(p)) v = readFileSync(p, 'utf8');
  } catch {
    v = null;
  }
  srcCache.set(p, v);
  return v;
};

/** Screen one (subject, decl) pair. Never falls through to a clean reading. */
const screenPair = (subject, decl) => {
  const src = readSrc(subject);
  if (src === null) return { state: 'UNRESOLVED', reason: `subject unreadable: ${subject}` };

  const cured = curedIndex(src).get(decl);
  if (!cured) return { state: 'UNRESOLVED', reason: `cured reader does not locate decl ${decl}` };
  if (cured.collisions > 0)
    return { state: 'UNRESOLVED', reason: `decl name ${decl} repeats ${cured.collisions + 1}x in ${subject}` };
  if (cured.kind !== 'block')
    return { state: 'UNRESOLVED', reason: `cured reader kind=${cured.kind}${cured.reason ? ` (${cured.reason})` : ''} for ${decl}` };

  const stripped = stripSource(src, true);
  const vRaw = naiveBody(src, cured.headStart);
  const vStripped = naiveBody(stripped, cured.headStart);

  // A naive variant that returns null read NO body at all — that is a difference, not a match.
  const rawSame = vRaw !== null && vRaw === cured.body;
  // The stripped variant blanks comment/string CONTENT, so compare it against the cured body under
  // the same blanking. Comparing a blanked span to an unblanked one would differ for every file and
  // the key would saturate.
  const curedStrippedBody =
    cured.bodyStart !== null && cured.bodyEnd !== null
      ? stripped.slice(cured.bodyStart, cured.bodyEnd + 1)
      : null;
  const strippedSame = vStripped !== null && curedStrippedBody !== null && vStripped === curedStrippedBody;

  if (rawSame && strippedSame) return { state: 'IDENTICAL', reason: null };

  const parts = [];
  if (!rawSame)
    parts.push(`raw ${vRaw === null ? 'read no body' : `${vRaw.length} ch`} vs cured ${cured.body.length} ch`);
  if (!strippedSame)
    parts.push(
      `stripped ${vStripped === null ? 'read no body' : `${vStripped.length} ch`} vs cured ${curedStrippedBody === null ? 'n/a' : `${curedStrippedBody.length} ch`}`,
    );
  return { state: 'DIFFERS', reason: parts.join(' | ') };
};

const results = [];
for (const ex of liveExposures) {
  const pairs = [];
  for (const s of ex.subjects) {
    if (s.decls.length === 0) {
      // R2: a subject with no declaration names cannot be screened at the claim's granularity.
      pairs.push({ subject: s.subject, decl: null, state: 'UNRESOLVED', reason: 'R2: subject resolved with no declaration names' });
      continue;
    }
    for (const d of s.decls) pairs.push({ subject: s.subject, decl: d, ...screenPair(s.subject, d) });
  }
  const differs = pairs.filter((p) => p.state === 'DIFFERS');
  const unresolved = pairs.filter((p) => p.state === 'UNRESOLVED');
  const bucket =
    differs.length > 0 ? 'CANDIDATE' : pairs.length === 0 || unresolved.length === pairs.length ? 'UNRESOLVED' : 'CLEAN';
  results.push({ ...ex, pairs, differs, unresolved, bucket });
}

const byBucket = (b) => results.filter((r) => r.bucket === b);

/* ------------------------------------------------------------------ *
 * A4 / A5 — the known positives, both directions. A key returning 0
 * needs a known positive before the 0 is a finding.
 * ------------------------------------------------------------------ */

const KP_POS = { subject: 'packages/server/src/claude/client.ts', decl: 'assembleSystemPrompt' };
const kpPos = screenPair(KP_POS.subject, KP_POS.decl);
check('A4', kpPos.state === 'DIFFERS', `KP-A (brace-bearing return type, live corpus file) read ${kpPos.state}, not DIFFERS — ${kpPos.reason ?? 'no reason'}`);

/*
 * DRIVE 3. The planted fixture: one negative and one positive PER MECHANISM, on authored source
 * whose property I control. One known positive per shape is coverage of one axis, so all three
 * mechanisms are present rather than one standing in for the family.
 */
const FIXTURE = `${UNIT}/scratch/kp-fixture.mts`;
const FIXTURE_EXPECT = [
  ['kpNegativePlain', 'IDENTICAL'],
  ['kpPositiveReturnType', 'DIFFERS'],
  ['kpPositiveDestructured', 'DIFFERS'],
  ['kpPositiveObjectDefault', 'DIFFERS'],
];
const fixtureReads = [];
for (const [name, want] of FIXTURE_EXPECT) {
  const got = screenPair(FIXTURE, name);
  fixtureReads.push({ name, want, got });
  check('A5' + name, got.state === want, `fixture ${name} read ${got.state}, want ${want} — ${got.reason ?? 'no reason'}`);
}

// KP-B: a plain declaration with no brace-bearing return type and no braces in its parameter list.
// Resolved from the subject itself rather than hand-typed, so it cannot go stale against the file.
//
// DRIVE 2 REPAIR. Drive 1 selected on the STRIPPED reading and so picked `regexLiteralEnd` — whose
// parameter list carries JSDoc braces that are live in the RAW reading, the reading the naive raw
// variant uses. A negative must be negative under the reading the instrument applies, not under a
// reading that blanks the very construct that makes it positive. Daedalus's §4 had already named
// this exact file and declaration as "a fourth positive I had picked and called the negative"; I
// repeated it with his memo open, from the other side — he picked it by hand, I picked it with a
// selector keyed on the wrong text. The filter now runs over BOTH readings.
/*
 * Drive 2's corpus-resolved negative, kept as a reported reading rather than a leg. It found no
 * plain declaration in `strip-source.mjs` at all — true of that file, and the reason the negative
 * moved to the planted fixture above. Its drive-2 message said "subject unreadable", which was the
 * initialiser leaking: the subject read fine and the SELECTOR matched nothing. A refusal reason
 * that names the wrong cause sends the next reader to the wrong place.
 */
const kpNegSrc = readSrc('scripts/lib/strip-source.mjs');
let kpNegName = null;
let kpNegWhy = kpNegSrc === null ? 'subject unreadable' : 'selector matched no plain declaration in this file';
if (kpNegSrc) {
  const strippedKp = stripSource(kpNegSrc, true);
  for (const d of declBodies(kpNegSrc)) {
    if (d.kind !== 'block') continue;
    const regions = [
      kpNegSrc.slice(d.parenOpen, d.parenClose + 1),
      kpNegSrc.slice(d.parenClose + 1, d.bodyStart),
      strippedKp.slice(d.parenOpen, d.parenClose + 1),
      strippedKp.slice(d.parenClose + 1, d.bodyStart),
    ];
    if (regions.some((r) => r.includes('{'))) continue; // not a negative under SOME reading
    kpNegName = d.name;
    kpNegWhy = screenPair('scripts/lib/strip-source.mjs', d.name).state;
    break;
  }
}

/* ------------------------------------------------------------------ *
 * A6 — the screen must not be saturated in either direction. Zero in
 * one class of a split is evidence about reachability before it is
 * evidence about the tree.
 * ------------------------------------------------------------------ */

const allPairs = results.flatMap((r) => r.pairs);
const nIdentical = allPairs.filter((p) => p.state === 'IDENTICAL').length;
const nDiffers = allPairs.filter((p) => p.state === 'DIFFERS').length;

/*
 * DRIVE 2 REPAIR, and the unit's structural finding.
 *
 * Drive 1 read 0 IDENTICAL of 104 resolved triples and A6a fired "saturated DIFFERS, grades
 * nothing". The cause is not the tree and not the readers: unit-469's LIVE verdict means
 * "N of M resolved subjects CARRY A BRACED PARAMETER LIST". Its printed subject lines are the
 * subjects that matched, so the triple population I parsed out of it is the OUTPUT OF A SELECTOR
 * ALREADY KEYED ON THE DEFECT'S PRESENCE. Every member differs by construction; IDENTICAL was
 * unreachable, so the screen could not narrow anything and a CANDIDATE rate of 41/46 measured my
 * own input filter rather than the corpus.
 *
 * So A6a is no longer asserted over the 469-derived population — saturation there is EXPECTED and
 * is reported as the finding. It is asserted over a CONTROL population instead: every block
 * declaration in each affected subject file. That population is not selected on the defect, so it
 * carries both classes, and it supplies the denominator the 469-derived one cannot.
 */
const controlSubjects = [...new Set(allPairs.map((p) => p.subject))].sort();
const controlPairs = [];
for (const s of controlSubjects) {
  const src = readSrc(s);
  if (src === null) continue;
  for (const d of declBodies(src)) {
    if (d.kind !== 'block') continue;
    controlPairs.push({ subject: s, decl: d.name, ...screenPair(s, d.name) });
  }
}
const cIdentical = controlPairs.filter((p) => p.state === 'IDENTICAL').length;
const cDiffers = controlPairs.filter((p) => p.state === 'DIFFERS').length;
const cUnresolved = controlPairs.filter((p) => p.state === 'UNRESOLVED').length;

check('A6a', cIdentical > 0, `control population reads 0 IDENTICAL of ${controlPairs.length} — the screen cannot produce a match and grades nothing`);
check('A6b', cDiffers > 0, `control population reads 0 DIFFERS of ${controlPairs.length} — the screen cannot produce a difference (check the readers before the tree)`);
check(
  'A6c',
  nIdentical === 0,
  `the 469-derived population read ${nIdentical} IDENTICAL — expected 0, because its selector keyed on the defect's presence. A non-zero reading means I have mis-parsed which subject lines 469 prints.`,
);

/* ------------------------------------------------------------------ *
 * A7 — the refusals, declared and fired rather than printed away.
 * ------------------------------------------------------------------ */

const unresolvedPairs = allPairs.filter((p) => p.state === 'UNRESOLVED');
if (unresolvedPairs.length > 0)
  refused.push(
    `UNRESOLVED for ${unresolvedPairs.length} triple(s) across ${byBucket('UNRESOLVED').length} wholly-unresolved exposure(s) — named below, NOT counted clean`,
  );
if (untrackedMembers.length > 0)
  refused.push(`${untrackedMembers.length} of the 469 census's ${censusMembers.length} members are UNTRACKED in this worktree — the 469 figure is worktree-local`);

/* ------------------------------------------------------------------ *
 * Report.
 * ------------------------------------------------------------------ */

const out = [];
out.push('unit-472publishedfigure arm A');
out.push(`  469 drive read: ${DRIVE469}`);
out.push(`  469 census members (GUARDED+UNGUARDED+AMBIGUOUS): ${censusMembers.length}`);
out.push(`  of those, UNTRACKED in this worktree (git ls-files): ${untrackedMembers.length}`);
for (const m of untrackedMembers) out.push(`      UNTRACKED ${m.verdict.padEnd(9)} ${m.path}`);
out.push(`  TRACKED census members: ${censusMembers.length - untrackedMembers.length}`);
out.push('');
out.push(`  LIVE exposures screened: ${results.length}`);
out.push(`  469-derived triples: ${allPairs.length}  (IDENTICAL ${nIdentical} · DIFFERS ${nDiffers} · UNRESOLVED ${unresolvedPairs.length})`);
out.push(`      ^ this population is the OUTPUT of 469's "carries a braced parameter list" selector.`);
out.push(`        IDENTICAL is unreachable in it by construction; its CANDIDATE rate measures the`);
out.push(`        input filter, not the corpus. The control population below is the denominator.`);
out.push('');
out.push(`  CONTROL population — every block declaration in the ${controlSubjects.length} subject file(s) these`);
out.push(`  instruments read, NOT selected on the defect: ${controlPairs.length} declarations`);
out.push(`      IDENTICAL  ${cIdentical}`);
out.push(`      DIFFERS    ${cDiffers}`);
out.push(`      UNRESOLVED ${cUnresolved}`);
out.push('');
out.push(`  CLEAN       ${byBucket('CLEAN').length}   (every resolved triple byte-identical — refuted mechanically)`);
out.push(`  CANDIDATE   ${byBucket('CANDIDATE').length}   (≥1 triple DIFFERS — needs the hand read, NOT yet wrong)`);
out.push(`  UNRESOLVED  ${byBucket('UNRESOLVED').length}   (no triple resolved — a refusal, NOT clean)`);
out.push('');

out.push('  --- CANDIDATE, with the affected declaration(s) ---');
for (const r of byBucket('CANDIDATE')) {
  out.push(`      CANDIDATE ${r.inst}`);
  for (const p of r.differs) out.push(`                  DIFFERS  ${p.subject}: ${p.decl} — ${p.reason}`);
}
out.push('');
out.push('  --- UNRESOLVED triples (every one, named) ---');
for (const p of unresolvedPairs) out.push(`      UNRESOLVED ${p.subject}: ${p.decl ?? '<no decl>'} — ${p.reason}`);
out.push('');
out.push('  --- CLEAN ---');
for (const r of byBucket('CLEAN')) out.push(`      CLEAN     ${r.inst}  (${r.pairs.filter((p) => p.state === 'IDENTICAL').length} identical, ${r.unresolved.length} unresolved)`);
out.push('');

out.push(`  KP-A corpus positive  ${KP_POS.subject}: ${KP_POS.decl} → ${kpPos.state}  ${kpPos.reason ?? ''}`);
for (const f of fixtureReads)
  out.push(`  KP fixture  ${f.name.padEnd(24)} want ${f.want.padEnd(9)} got ${f.got.state.padEnd(9)} ${f.got.reason ?? ''}`);
out.push(`  (reported, not a leg) strip-source.mjs plain-declaration selector → ${kpNegName ?? '<no match>'}: ${kpNegWhy}`);
out.push('');

const affectedSubjects = [...new Set(allPairs.filter((p) => p.state === 'DIFFERS').map((p) => p.subject))].sort();
out.push(`  subjects carrying ≥1 DIFFERS declaration: ${affectedSubjects.length}`);
for (const s of affectedSubjects) out.push(`      AFFECTED ${s}`);

console.log(out.join('\n'));
console.log('');
console.log(`${red.length === 0 ? 'ok' : 'RED'} legs=${red.length} red=[${red.join(' | ')}] refused=[${refused.join(' | ')}]`);
console.log(`RATE: ${byBucket('CANDIDATE').length}/${results.length} live exposures are CANDIDATE; ${byBucket('CLEAN').length} refuted mechanically; ${byBucket('UNRESOLVED').length} refused`);
process.exit(red.length === 0 ? 0 : 1);
