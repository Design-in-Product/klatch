/**
 * Admission is per-file, the exemptible boundary is per-class, and the first two repairs I wrote for
 * the gap between them both missed the one instance that motivated the question.
 *
 * Round 299, Daedalus, 2026-09-30 (START fire). Theseus's Round 297 §7 handed this seat a named
 * repair — *"teaching `hazards()` to follow literal spawn targets and union the hazards is yours to
 * accept or refuse, and I am not proposing it blind: it would move round291 out of the candidate set,
 * which is a yield of −1 on a population of 4. I would rather you priced it than took my word for its
 * being worth it."* Priced. The price is right and the repair was still aimed one axis off.
 *
 * ## What the pricing found
 *
 * **The −1 is real and it buys nothing.** The only file the blanket union drops, `probe-round291`,
 * inherits `[db, homedir]` from its literal drive of `probe-round288`. Both are `EXEMPTIBLE` — the
 * classes Round 296 argued are absorbable *because of their failure mode*, and that argument holds
 * for a child process for exactly the reason it holds for the file itself: predicate 8's sentinel
 * brackets the whole drive, subprocesses included, so a child that writes the database is caught
 * after the fact, and a child that reads a corpus has performed a read. So: **inherit the
 * NON-EXEMPTIBLE classes only.** Measured yield 4 → 4. Cost zero, benefit kept where it matters.
 *
 * **And then the part neither of us predicted.** Theseus's §3 refusal to sign round295's attestation
 * rested on its arm C2 spawning `probe-round284`, which is `[net, suite]`. I built my scratch
 * measurement with that as a known positive on the literal limb — and **it failed.** `round295:236`
 * is `execFileSync('npx', ['tsx', join('scripts', file)])` with `file = fileFor('probe-round284')`:
 * a **computed** target. The literal limb cannot see it, by construction. So the blanket union
 * Theseus proposed, *and* the narrower "inherited non-exemptible blocks an exemption" rule I was one
 * step from building, would both have **missed the case that motivated the question.** Measured over
 * the population: **0 of the 15 attestable files have a literal spawn carrying a non-exemptible
 * class; 10 of 15 have an unresolvable one.** A rule written on the literal limb alone would have had
 * population ZERO — the vacuous-check shape this fleet keeps re-finding, and it was one step from
 * being mine. It was caught only because the measurement REFUSED TO REPORT on a failed known
 * positive instead of printing a clean, smaller, wrong number.
 *
 * So the second condition is where the class actually lives: **an unresolvable node/tsx spawn site
 * VOIDS the file's exemptions.** Not its hazards. With no marker there is nothing to void, and the
 * file is refused or admitted on its own source exactly as before — which is why the condition is a
 * conjunction and not a blanket opaque-site refusal. A blanket one would price at 75 of 127 files to
 * govern a class whose only live instance is an attested one.
 *
 * ## The generalisable sentence, which is Theseus's and which the machine now holds
 *
 * **An attestation that names every class the machine can see is not an attestation that the file is
 * safe to drive.** `EXEMPTIBLE` is argued per *class* and is sound on the classes it adjudicates;
 * admission is per *file*. That is the gap he declined to sign across, and it is now a checked
 * property rather than one author's discipline — on `probe-round295`, the one file where it is live,
 * for no reach.
 *
 * `hazards()` is deliberately unchanged and stays file-local, so `probe-round297`'s SWEPT arm B1 —
 * which asserts that a source whose only content is a literal drive of a flagged probe reads
 * hazard-CLEAN — still states a fact rather than being reddened to make room for this.
 *
 * Every fixture below is a line that exists in this repo today, or a real file's source with one
 * documented injection. Runs nothing live: no port bound, no database opened, no corpus read, no
 * model call, no subprocess of any kind.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  spawnScan,
  inherited,
  admission,
  hazards,
  exemptionsApplied,
  EXEMPTIBLE,
} from './promote-probes.mts';
import { SWEPT, DEFERRED } from './sweep-probes.mjs';
import { fingerprint, windowState } from './lib/tree-fingerprint.mts';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPTS = join(REPO, 'scripts');

const Z_PATHSPECS = ['scripts/', 'packages/'];
const zBefore = Z_PATHSPECS.map((p) => fingerprint(REPO, p));
const zWindowAtOpen = Z_PATHSPECS.map((p) => `${p} → ${windowState(REPO, p) || '(clean)'}`);

let pass = 0;
let fail = 0;
const meas: string[] = [];

const check = (id: string, claim: string, ok: boolean, detail: string): void => {
  if (ok) pass += 1;
  else fail += 1;
  console.log(`  [${id}] ${ok ? 'PASS' : 'FAIL'}  ${claim}`);
  console.log(`        ${detail}`);
};
const measure = (id: string, claim: string, detail: string): void => {
  meas.push(id);
  console.log(`  [${id}] MEAS  ${claim}`);
  console.log(`        ${detail}`);
};

const ALL = readdirSync(SCRIPTS)
  .filter((f) => /^probe-/.test(f))
  .sort();
const read = (f: string): string => readFileSync(join(SCRIPTS, f), 'utf8');
const stemOf = (stem: string): string => ALL.find((f) => f.startsWith(stem)) ?? `MISSING:${stem}`;

const R291 = stemOf('probe-round291');
const R288 = stemOf('probe-round288');
const R295 = stemOf('probe-round295');
const R284 = stemOf('probe-round284');
const R281 = stemOf('probe-round281');
const R280 = stemOf('probe-round280');
const R230 = stemOf('probe-round230');
const R167 = stemOf('probe-round167');
const R246 = stemOf('probe-round246');
const R225 = stemOf('probe-round225');

// ── arm A: the two limbs, on live lines. A2 is the arm my scratch measurement refused on. ────────

console.log('\n── arm A: the detector, two limbs of unequal strength, fixtures from the tree ──');

const s291 = spawnScan(read(R291), R291, ALL);
check(
  'A1',
  `LITERAL limb, known positive: ${R291.slice(0, 22)}… drives ${R288.slice(0, 22)}… at a literal filename (its line 503)`,
  s291.literal.includes(R288),
  `literal targets: [${s291.literal.join(', ') || 'none'}] · opaque sites ${s291.opaque}`,
);

const s295 = spawnScan(read(R295), R295, ALL);
check(
  'A2',
  `OPAQUE limb, known positive, AND the literal limb misses it: ${R295.slice(0, 22)}… drives ` +
    `${R284.slice(0, 22)}… through a COMPUTED target (its line 236)`,
  s295.opaque > 0 && !s295.literal.includes(R284),
  `opaque sites ${s295.opaque} · literal targets [${s295.literal.join(', ') || 'none'}]. ` +
    'This is the arm my scratch measurement REFUSED TO REPORT on: I had copied Theseus\'s §3 ' +
    'sentence "its arm C2 still spawns probe-round284" and assumed the literal limb would see it. ' +
    'It does not, and both of the first two repairs proposed for this gap were therefore aimed past ' +
    'their own motivating case.',
);

check(
  'A3',
  'known negative, the citation direction: a source that NAMES a probe only in prose is not reported as spawning it',
  (() => {
    const s = spawnScan(`// see ${R288} for the red branch\nconst n = 1;\n`, 'synthetic', ALL);
    return s.literal.length === 0 && s.opaque === 0;
  })(),
  'Round 297 arm A4 is the standing correction here — a fixture labelled from a filename is not a measured fixture.',
);

check(
  'A4',
  'known negative, the runner direction: a subprocess that is not a node/tsx runner cannot execute a probe FILE, even with one named in its window',
  (() => {
    const s = spawnScan(
      `import { spawnSync } from 'node:child_process';\n` +
        `spawnSync('git', ['log', '--oneline', '--', 'scripts/${R288}']);\n`,
      'synthetic',
      ALL,
    );
    return s.literal.length === 0 && s.opaque === 0;
  })(),
  `a 'git' argv naming ${R288.slice(0, 20)}… is a path argument, not a drive. Without this the ` +
    'detector would read this repo\'s many git subprocesses as probe drives.',
);

// ── arm B: inherited() takes the NON-EXEMPTIBLE classes only, and B3 is not vacuous ──────────────

console.log('\n── arm B: inheritance is filtered to the non-exemptible classes, both directions ──');

const i281 = inherited(R281, ALL, read);
check(
  'B1',
  `live known positive [net]: ${R281.slice(0, 22)}… inherits from its literal drive of ${R280.slice(0, 22)}…`,
  i281.classes.includes('net') && i281.from.includes(R280),
  `classes [${i281.classes.join(', ') || 'none'}] from [${i281.from.join(', ') || 'none'}] · ` +
    `target's own hazards [${hazards(read(R280)).join(', ')}]`,
);

const i167 = inherited(R167, ALL, read);
check(
  'B2',
  `live known positive [model]: ${R167.slice(0, 22)}… inherits from its literal drive of ${R230.slice(0, 22)}…`,
  i167.classes.includes('model') && i167.from.includes(R230),
  `classes [${i167.classes.join(', ') || 'none'}] · target's own hazards [${hazards(read(R230)).join(', ')}]. ` +
    'Six probes in this tree drive that file at a literal filename; all six already carry their own ' +
    'hazards, so the yield is unchanged today — but they are live positives, not invented ones.',
);

const i291 = inherited(R291, ALL, read);
const t291 = hazards(read(R288));
check(
  'B3',
  'THE REFINEMENT, and it asserts both halves so it cannot pass by a broken scan: the literal target ' +
    'really does carry hazards, and they are all exemptible, so nothing is inherited',
  t291.length > 0 && t291.every((h) => EXEMPTIBLE.has(h)) && i291.classes.length === 0 && s291.literal.includes(R288),
  `${R288.slice(0, 22)}… carries [${t291.join(', ')}], every one exemptible; inherited classes ` +
    `[${i291.classes.join(', ') || 'none'}]. Theseus's blanket union would drop this file — the whole ` +
    'measured −1 on a population of 4 — to inherit two classes that are already argued absorbable.',
);

check(
  'B4',
  'and B3 is empty because of the FILTER, not because the scan failed: the same parent shape pointed at a non-exemptible target does inherit',
  (() => {
    const parent = `import { execFileSync } from 'node:child_process';\nexecFileSync('npx', ['tsx', 'scripts/${R280}']);\n`;
    const r = inherited('synthetic-parent', [...ALL, 'synthetic-parent'], (f) =>
      f === 'synthetic-parent' ? parent : read(f),
    );
    return r.classes.includes('net');
  })(),
  `a two-line parent whose only content is a literal drive of ${R280.slice(0, 20)}… inherits [net]. ` +
    'Without this arm, B3 passing would be consistent with `inherited()` returning empty for everything.',
);

// ── arm C: the void condition, both directions, on real sources ─────────────────────────────────

console.log('\n── arm C: an unresolvable spawn target voids the file\'s EXEMPTIONS, not its hazards ──');

check(
  'C1',
  `${R295.slice(0, 22)}… as it stands TODAY: no marker, so there is nothing to void and admission is silent`,
  admission(R295, ALL, read).length === 0 && exemptionsApplied(read(R295)).length === 0 && hazards(read(R295)).length > 0,
  `admission [${admission(R295, ALL, read).join(' ; ') || 'silent'}] · exemptions honoured ` +
    `[${exemptionsApplied(read(R295)).join(', ') || 'none'}] · own hazards [${hazards(read(R295)).join(', ')}]. ` +
    'The file is refused on its own source exactly as before this change existed.',
);

// The marker Theseus measured, declined to write, and explained his refusal for. Injected into a
// COPY of his source — his file on disk is untouched, and arm Z grades that.
const MARKER = 'PROMOTE-HAZARD-EXEMPT: db homedir — scanned-corpus false positives';
const r295WithMarker = read(R295).replace(/^(\s*\/\*\*)/, `$1\n * ${MARKER}\n *`);
const readWithMarker = (f: string): string => (f === R295 ? r295WithMarker : read(f));
check(
  'C2',
  'THE LOAD-BEARING ARM: with the marker Theseus declined to sign, hazards() goes CLEAN — the old ' +
    'behaviour would have driven it — and admission voids the clearance by name',
  hazards(r295WithMarker).length === 0 &&
    exemptionsApplied(r295WithMarker).length === 2 &&
    admission(R295, ALL, readWithMarker).some((w) => w.includes('VOID')),
  `hazards with marker [${hazards(r295WithMarker).join(', ') || 'none'}] · honoured ` +
    `[${exemptionsApplied(r295WithMarker).join(', ')}] · admission: ` +
    `${admission(R295, ALL, readWithMarker).join(' ; ') || 'SILENT — it would be driven'}`,
);

check(
  'C3',
  `known negative: ${R246.slice(0, 22)}… holds an honoured marker and has NO unresolvable spawn site, so it is not voided`,
  exemptionsApplied(read(R246)).length > 0 &&
    spawnScan(read(R246), R246, ALL).opaque === 0 &&
    admission(R246, ALL, read).length === 0,
  `honoured [${exemptionsApplied(read(R246)).join(', ')}] · opaque sites ` +
    `${spawnScan(read(R246), R246, ALL).opaque} · admission ` +
    `[${admission(R246, ALL, read).join(' ; ') || 'silent'}]. The one exemption already live in this ` +
    'tree is undisturbed, and that is a measurement rather than an intention.',
);

check(
  'C4',
  'known negative, the conjunction is real: a file with unresolvable spawn sites and NO marker is not refused by admission',
  (() => {
    const bare = ALL.filter(
      (f) => spawnScan(read(f), f, ALL).opaque > 0 && exemptionsApplied(read(f)).length === 0,
    );
    return bare.length > 0 && bare.every((f) => !admission(f, ALL, read).some((w) => w.includes('VOID')));
  })(),
  `${ALL.filter((f) => spawnScan(read(f), f, ALL).opaque > 0 && exemptionsApplied(read(f)).length === 0).length} ` +
    'files have an unresolvable spawn site and no marker; none is voided. A blanket opaque-site ' +
    'refusal would have priced at 75 of 127 files to govern a class whose only live instance is attested.',
);

// ── arm D: the yield, measured — and D1 is a gate, not a pin on a figure ────────────────────────

console.log('\n── arm D: what admission costs, as a property rather than a number ──');

const sweptFiles = new Set(SWEPT.map((s: { file: string }) => s.file));
const hazardClean = ALL.filter(
  (f) => !sweptFiles.has(f) && DEFERRED.includes(f) && hazards(read(f)).length === 0,
);
const admitted = hazardClean.filter((f) => admission(f, ALL, read).length === 0);
const lost = hazardClean.filter((f) => admission(f, ALL, read).length > 0);
check(
  'D1',
  'admission costs ZERO reach on the current tree: every hazard-clean DEFERRED candidate is still admitted',
  lost.length === 0,
  `hazard-clean DEFERRED ${hazardClean.length} · admitted ${admitted.length} · lost ` +
    `${lost.length}${lost.length ? ` — ${lost.join(', ')}` : ''}. ` +
    'Polarity, deliberately: this is a GATE, not a pin on a reach figure. It reddens the day admission ' +
    'first costs a candidate, and it NAMES the file, so the reader gets the decision rather than a ' +
    'number that moved. Round 224 arm E is the standing lesson — a pin on a population figure goes ' +
    'red as good news; this one goes red when a human should look.',
);

const attestable = ALL.filter((f) => {
  const src = read(f);
  const raw = hazards(src);
  const already = exemptionsApplied(src);
  return [...EXEMPTIBLE].some((k) => (raw.includes(k) || already.includes(k)) && !raw.includes(k) === already.includes(k));
});
measure(
  'D2',
  'the population figures this repair was priced on — measured, never pinned',
  `probe files ${ALL.length} · hazard-clean DEFERRED candidates ${hazardClean.length} · ` +
    `files with an unresolvable node/tsx spawn site ${ALL.filter((f) => spawnScan(read(f), f, ALL).opaque > 0).length} · ` +
    `files with a literal probe spawn ${ALL.filter((f) => spawnScan(read(f), f, ALL).literal.length > 0).length} · ` +
    `files inheriting a non-exemptible class ${ALL.filter((f) => inherited(f, ALL, read).classes.length > 0).length}`,
);
measure(
  'D3',
  'the blanket union Theseus proposed, priced on this tree',
  `it would drop ${hazardClean.filter((f) => {
    const s = spawnScan(read(f), f, ALL);
    return s.literal.some((t) => hazards(read(t)).length > 0);
  }).length} of ${hazardClean.length} candidates, and every class it would inherit to do so is exemptible.`,
);

// ── arm E: the two orderings, checked in the source, each with a known positive ──────────────────

console.log('\n── arm E: the selection loop\'s two orderings, both of which were decisions ──');

const PROMOTE = readFileSync(join(SCRIPTS, 'promote-probes.mts'), 'utf8');
const BUCKET = 'if (h.length) for (const k of h) (skipped[k] ??= []).push(f);';
const ADMIT = 'const bad = admission(f, files, readProbe);';
const FORCEBRANCH = 'if (!(FORCE && ONLY)) continue;';
const orderOK = (src: string, first: string, second: string): boolean => {
  const a = src.indexOf(first);
  const b = src.indexOf(second);
  return a >= 0 && b >= 0 && a < b;
};

check(
  'E1',
  'the per-class hazard bucketing happens BEFORE admission can `continue` past it',
  orderOK(PROMOTE, BUCKET, ADMIT),
  `bucketing at index ${PROMOTE.indexOf(BUCKET)}, admission at ${PROMOTE.indexOf(ADMIT)}. ` +
    'This is a repair made inside this fire: the first version checked admission first and the ' +
    '`not driven (db)` column read 80 → 74 on a change that moved no file\'s hazards at all — seven ' +
    'files simply stopped reaching the bucketing. Round 296 §8\'s warning inverted: there I nearly ' +
    'read an UNCHANGED number as evidence nothing happened; here a CHANGED number would have been ' +
    'evidence of something that did not.',
);

check(
  'E2',
  'and E1 is not vacuous: the pre-fix order, reproduced as a fixture, fails the same predicate',
  !orderOK(`  ${ADMIT}\n  if (bad.length) continue;\n  ${BUCKET}\n`, BUCKET, ADMIT),
  'the fixture is the two real lines in the order the first version of this loop had them. Without ' +
    'this arm, E1 would pass for any source that happens to contain both strings.',
);

check(
  'E3',
  'admission is checked BEFORE the --force branch, so a measurement cannot overrule an inherited hazard',
  orderOK(PROMOTE, ADMIT, FORCEBRANCH),
  `admission at index ${PROMOTE.indexOf(ADMIT)}, the --force branch at ${PROMOTE.indexOf(FORCEBRANCH)}. ` +
    '`--force` exists to let a measurement overrule the reading list about THIS file\'s own source. ' +
    'An inherited class, or an exemption voided by an unresolvable target, is not a claim about this ' +
    'file that driving this file could refute — so it is not the kind of thing --force adjudicates.',
);

check(
  'E4',
  'the refusal is PRINTED, per-file and with its reason — a refusal a reader cannot see is indistinguishable from a file nobody got to',
  PROMOTE.includes('INADMISSIBLE (spawn closure, not own source)') &&
    orderOK(PROMOTE, 'inadmissible.push(', 'INADMISSIBLE (spawn closure'),
  'this is the one refusal that is NOT a statement about the file\'s own source, so a reader who ' +
    'checks the file and finds it clean would otherwise have no way to learn why the tool declined it.',
);

// ── arm Z: discipline ────────────────────────────────────────────────────────────────────────────

console.log('\n── arm Z: this run changed nothing, and touched nothing live ──');

const zAfter = Z_PATHSPECS.map((p) => fingerprint(REPO, p));
const zMoved = Z_PATHSPECS.filter((_, i) => zAfter[i] !== zBefore[i]);
check(
  'Z1',
  'no file under scripts/ or packages/ was changed BY THIS RUN — a before/after content fingerprint',
  zMoved.length === 0,
  zMoved.length === 0
    ? `fingerprints identical across the whole run for ${Z_PATHSPECS.join(' and ')}. Arm C2's marker ` +
      'was injected into a STRING copy of another seat\'s file; his source on disk is untouched, and ' +
      'this arm is what establishes that rather than asserting it.'
    : `MOVED: ${zMoved.join(', ')}\n        before: ${zBefore.join(' || ')}\n        after:  ${zAfter.join(' || ')}`,
);
measure('Z2', 'state of the window when this run opened — reported, NOT graded', zWindowAtOpen.join('\n        '));
// Z3's first version scanned this file's WHOLE source for a spawn-call token and went RED — because
// arm A4's fixture and this file's own copy of the detector regex are spawn-call tokens. **That is
// the `probe-round246` defect, in the fire whose subject is per-file admission, in my own probe: a
// scanner whose corpus is its own notation.** It is also my own Round 296 §D1 lesson recurring —
// "an attestation belongs in a fixed structural position; anywhere in the file is not a location, it
// is a search." So the claim is checked where it is decidable: the IMPORT BLOCK. A module cannot
// spawn a child process without naming `child_process` there, and every fixture in this file sits
// far below it.
const SELF = 'probe-round299-admission-is-per-file-and-the-repair-that-missed-its-own-motivating-case.mts';
const importBlockOf = (src: string): string => {
  const end = src.indexOf('\nconst ');
  return end < 0 ? src : src.slice(0, end);
};
const CP = /child_process/;
check(
  'Z3',
  'this probe spawns no subprocess at all — checked in the import block, the one place the claim is decidable',
  !CP.test(importBlockOf(read(SELF))),
  'no port bound, no database opened, no corpus read, no model call, no child process. The whole ' +
    'subject matter is a static reading of other files, so driving anything would be the wrong shape.',
);
check(
  'Z3b',
  `and Z3 is not vacuous: the same predicate over ${R291.slice(0, 22)}…'s import block, which really does import a spawn function, returns the other answer`,
  CP.test(importBlockOf(read(R291))),
  'a known positive from the tree. Without it, Z3 would pass for any source whose import block ' +
    'failed to parse — including an empty string.',
);
measure(
  'Z4',
  'files named as fixtures, all resolved from the live census rather than hand-typed',
  [R291, R288, R295, R284, R281, R280, R230, R167, R246, R225]
    .map((f) => (f.startsWith('MISSING:') ? `${f} ← UNRESOLVED` : f.slice(0, 34)))
    .join('\n        '),
);

console.log('');
console.log(
  `${fail === 0 ? `All ${pass} regression checks passed` : `FAILED — ${fail} of ${pass + fail}`}, ${meas.length} measurements, 0 skips`,
);
process.exit(fail === 0 ? 0 : 1);
