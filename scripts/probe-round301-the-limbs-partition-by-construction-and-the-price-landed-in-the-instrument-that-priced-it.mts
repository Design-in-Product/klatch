/**
 * Round 301 — the two limbs of `spawnScan` now PARTITION the sites they are read over, and the price
 * of getting there was zero in the verdicts and three arms in the probe that priced it at zero.
 *
 * Theseus's Round 300 §2 found the gap and §4 priced the repair: the `opaque` screen fired only on a
 * window matching one of five tokens, so a node/tsx spawn site that named no probe AND matched no
 * token was neither classified nor screened — **36 sites across 28 files, invisible**, the plainest
 * spawn shape in the repo. His §3 instance is the sharp one: `\bR\d{3}\b` matches `R246` and misses
 * `R223B`, so the ONE real probe drive in `probe-round225` (line 285) was invisible to the very limb
 * his Round 297 arm A4 was measured with. He routed the repair with the price attached — "no file's
 * admission verdict moves" — and deliberately did not patch the production copy, which is mine.
 *
 * Taken this fire. The token allowlist is deleted rather than extended, `opaque` is renamed
 * `unresolved` because the field no longer means what the old name said, and the two limbs now cover
 * their domain by construction: a node/tsx site either names a probe or it does not.
 *
 * **Three things this probe exists to hold, one of which is a correction to the pricing.**
 *
 * 1. The partition is a property, not an intention (arm A). Every node/tsx spawn site in every probe
 *    file is either named or counted, with nothing in between, and the previously-invisible class is
 *    empty. The classifier limb is unchanged — the literal targets production reports are still
 *    exactly the locally-computed ones — so this is a repair to the screen alone.
 *
 * 2. The verdicts really did not move (arm B), re-measured over the WHOLE population rather than the
 *    DEFERRED slice, and the price that WAS non-zero is named: 13 call sites broke at typecheck (10
 *    in my `probe-round299`, 3 in his `probe-round300`), and three of those were assertions, not
 *    message text. The rename is what made that loud. Had I redefined `opaque` in place, arm B1 of
 *    `probe-round300` would have gone from `=== 3` to a silent `=== 5` failure and the other two
 *    would have stayed green while becoming vacuous — the "wrong in a way a later step absorbs" shape
 *    Theseus and I have both flagged and neither of us has written down.
 *
 * 3. **The zero was measured over a population that excluded the only file the rule has ever fired
 *    on** (arm C). Round 300 §4 ranged `moved` over the DEFERRED files; `probe-round246`, the one
 *    file in the census with an honoured exemption, is SWEPT and therefore outside that range. The
 *    zero survives the wider population — but because round246 has ZERO node/tsx spawn sites of any
 *    kind, which is the same containment-by-luck he flagged on the 16 masked files, not coverage.
 *    A price measured over the candidates does not include the incumbents.
 *
 * **My own defect, caught inside this fire.** Arm B3 failed on its first run, reporting one file
 * still reading the superseded field — this one. Written as a plain regex literal, the field-access
 * notation appeared in this file's own source, so the scanner matched its own detector. That is Round
 * 299 §4's Z3 defect and Round 300's A1b, in a file whose header names the class twice. Arm A5 was
 * already naming this file's self-contribution and it did not help: A5 measures spawn SITES and B3
 * scans NOTATION, so accounting for one scanner's corpus says nothing about a second scanner in the
 * same file. The repair builds the pattern from parts and proves it live on a constructed fixture, so
 * the exclusion is a checked property rather than an obfuscation.
 *
 * Not taken, and whose: Round 297 arm A4's own repair is Theseus's, claimed in his §5 with the
 * stale-pin reason stated, first-one-there with Argus. `probe-round297` imports only `hazards` and
 * `literalOnly`, so nothing in this fire reaches it and the arm is still his to fix.
 *
 * Discipline: no port bound, no database opened, no corpus read, no model called, no subprocess. The
 * whole subject is a static reading of source.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnScan, admission, exemptionsApplied } from './promote-probes.mts';
import { SWEPT, DEFERRED } from './sweep-probes.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const SCRIPTS = join(REPO, 'scripts');

const ALL = readdirSync(SCRIPTS)
  .filter((f) => /^probe-/.test(f))
  .sort();
const read = (f: string): string => readFileSync(join(SCRIPTS, f), 'utf8');
/** Resolved from the live census, never hand-typed — Round 297's lesson about fixtures. */
const fileFor = (stem: string): string => {
  const f = ALL.find((x) => x.startsWith(stem));
  if (!f) throw new Error(`fixture ${stem} is not in the census — this probe will not guess`);
  return f;
};

let pass = 0;
let fail = 0;
let meas = 0;
const check = (id: string, claim: string, ok: boolean, detail: string): void => {
  if (ok) pass += 1;
  else fail += 1;
  console.log(`  [${id}] ${ok ? 'PASS' : 'FAIL'}  ${claim}`);
  console.log(`        ${detail}`);
};
const measure = (id: string, line: string): void => {
  meas += 1;
  console.log(`  [${id}] MEAS  ${line}`);
};

/**
 * Content fingerprint of `scripts/`, hand-rolled rather than taken from `lib/tree-fingerprint.mts`
 * for one stated reason: the lib version shells out to `git status`/`git diff`, which would
 * contradict arm Z2's claim that this probe spawns nothing. It hashes contents, not just names, so it
 * is strictly stronger than `probe-round300`'s local name-list version.
 */
const fingerprint = (dir: string): string => {
  const base = join(REPO, dir);
  const h = createHash('sha256');
  for (const f of readdirSync(base).sort()) {
    h.update(f);
    h.update('\0');
    try {
      h.update(readFileSync(join(base, f)));
    } catch {
      h.update('<dir-or-unreadable>');
    }
  }
  return h.digest('hex');
};
const zBefore = fingerprint('scripts');

// ── Site-level scan, and the SUPERSEDED token rule kept as a historical fixture ──────────────────
// Production returns a COUNT and cannot say which site, and both arms A and C are about which. The
// token regex below is the rule Round 301 deleted; it lives here now, where it is a fixture rather
// than a decision, and `probe-round300` carries the other copy for the same reason.
const SPAWN_CALL = /\b(?:execFileSync|execSync|spawnSync|spawn|execFile|fork)\s*\(/g;
const SPAWN_WINDOW = 600;
const SUPERSEDED_TOK = /\bjoin\s*\(|\bR\d{3}\b|\bfile\b|\bstem\b|\$\{/;

type Site = { file: string; line: number; named: string[]; tokenOpaque: boolean };
const sitesIn = (f: string): Site[] => {
  const src = read(f);
  const out: Site[] = [];
  SPAWN_CALL.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SPAWN_CALL.exec(src))) {
    const w = src.slice(m.index, m.index + SPAWN_WINDOW);
    if (!/['"`](?:npx|tsx|node)['"`]/.test(w)) continue;
    const named = ALL.filter((p) => p !== f && w.includes(p));
    out.push({
      file: f,
      line: src.slice(0, m.index).split('\n').length,
      named,
      tokenOpaque: named.length === 0 && SUPERSEDED_TOK.test(w),
    });
  }
  return out;
};

const SELF = fileFor('probe-round301');
const R225 = fileFor('probe-round225');
const R246 = fileFor('probe-round246');
const R281 = fileFor('probe-round281');
const R280 = fileFor('probe-round280');
const R295 = fileFor('probe-round295');

console.log('\n── arm A: the two limbs partition the sites they are read over ──');

// A0 is the refusal. Round 299 §2 and Round 300 arm A0 are the standing reason it exists: a
// measurement that reports confidently on a dead detector ships a repair aimed past its own case.
const a0lit = spawnScan(read(R281), R281, ALL).literal.includes(R280);
const a0unres = spawnScan(read(R295), R295, ALL).unresolved > 0;
check(
  'A0',
  'both limbs have a live known positive, so a zero below is a measurement and not a floor',
  a0lit && a0unres,
  `literal limb: ${R281.slice(0, 28)}… names ${R280.slice(0, 28)}… → ${a0lit} · unresolved limb: ` +
    `${R295.slice(0, 28)}… has a computed target → ${a0unres}`,
);
if (!a0lit || !a0unres) {
  console.log('\nREFUSING TO REPORT — a known positive did not match. Every count below would be a floor.');
  process.exit(1);
}

const all = ALL.flatMap(sitesIn);
const namedSites = all.filter((s) => s.named.length > 0);
const gaps = ALL.filter((f) => {
  const sites = sitesIn(f);
  const prod = spawnScan(read(f), f, ALL);
  return sites.filter((s) => s.named.length === 0).length !== prod.unresolved;
});
check(
  'A1',
  'every node/tsx spawn site is either NAMED or UNRESOLVED, per file, with nothing in between — the two limbs now cover their domain by construction',
  gaps.length === 0,
  `${all.length} node/tsx sites across ${ALL.length} probe files: ${namedSites.length} name a probe, ` +
    `${all.length - namedSites.length} do not, and production's \`unresolved\` equals the second ` +
    `figure in all ${ALL.length} files${gaps.length ? ` except ${gaps.join(', ')}` : ''}. Before ` +
    'Round 301 this was false by 36 sites in 28 files.',
);

const wouldBeInvisible = all.filter((s) => s.named.length === 0 && !s.tokenOpaque);
const nowCounted = wouldBeInvisible.filter(
  (s) => spawnScan(read(s.file), s.file, ALL).unresolved > sitesIn(s.file).filter((x) => x.tokenOpaque).length,
);
check(
  'A2',
  'the class Round 300 §2 found — a site the token rule could not see — is now inside the count, and it is not an empty class',
  wouldBeInvisible.length > 0 && nowCounted.length === wouldBeInvisible.length,
  `${wouldBeInvisible.length} sites in ${new Set(wouldBeInvisible.map((s) => s.file)).size} files ` +
    `matched neither the literal limb nor the superseded token; all ${nowCounted.length} are counted ` +
    'by production now. Stated as a non-empty class deliberately: "no site is invisible" would also ' +
    'be true of a tree with no spawn sites at all.',
);

const body = ((): string => {
  const src = read('promote-probes.mts');
  const i = src.indexOf('export const spawnScan = (');
  const j = src.indexOf('\n};', i);
  if (i < 0 || j < 0) throw new Error('cannot locate spawnScan in promote-probes.mts — refusing to guess');
  return src.slice(i, j);
})();
check(
  'A3',
  'the token allowlist is gone from the production decision path, checked in the extracted function body rather than searched for across the file',
  !SUPERSEDED_TOK.source.split('|').some((alt) => body.includes(alt)) && /if \(!named\) unresolved \+= 1;/.test(body),
  `none of the five superseded alternations appears in the extracted \`spawnScan\` body (${body.length} ` +
    'chars), and the decision reads `if (!named) unresolved += 1;`. Extracted at a fixed structural ' +
    'position because this probe quotes the token itself — Round 299 §4, Round 300 arm Z2.',
);
check(
  'A3b',
  'and A3 is not vacuous: the same extraction over the copy that still carries the token returns the other answer',
  ((): boolean => {
    const src = read(fileFor('probe-round300'));
    const i = src.indexOf('const OPAQUE_TOK');
    return i >= 0 && SUPERSEDED_TOK.source.split('|').some((alt) => src.slice(i, i + 200).includes(alt));
  })(),
  `${fileFor('probe-round300').slice(0, 34)}… still declares the token as a fixture, so the predicate ` +
    'distinguishes a deleted rule from a rule it merely failed to find.',
);

const s225 = sitesIn(R225);
check(
  'A4',
  "the site Round 297 arm A4 was written about — probe-round225 line 285 — is now inside the instrument the arm is measured with",
  s225.find((s) => s.line === 285) !== undefined &&
    s225.find((s) => s.line === 285)!.tokenOpaque === false &&
    spawnScan(read(R225), R225, ALL).unresolved === s225.filter((s) => s.named.length === 0).length &&
    spawnScan(read(R225), R225, ALL).unresolved === 5,
  `line 285 is a drive of a probe FILE through a variable and the superseded token scored it false; ` +
    `production now reports unresolved 5 for this file — the 3 the token saw plus line 285 and line ` +
    `428. The arm's greenness no longer comes from three sites that are not the phenomenon.`,
);
measure(
  'A5',
  `this file is inside the corpus it scans, so the self-contribution is named rather than absorbed ` +
    `(Round 300 arm A1b, round246's shape): ${sitesIn(SELF).length} of the ${all.length} sites are ` +
    `this file's own quoted fixture text. Population MINUS this file: ${
      all.filter((s) => s.file !== SELF && s.named.length > 0).length
    } named · ${all.filter((s) => s.file !== SELF && s.named.length === 0).length} unresolved. And ` +
    'this zero did not protect arm B3, which failed on its own notation in the same run: A5 accounts ' +
    'for spawn SITES, B3 scans NOTATION, and one scanner\'s self-audit says nothing about another\'s.',
);

console.log('\n── arm B: the verdicts did not move, over the whole population and not the DEFERRED slice ──');

const voidedNow = (f: string): boolean => admission(f, ALL, read).some((w) => w.includes('VOID'));
const voidedUnderToken = (f: string): boolean =>
  sitesIn(f).some((s) => s.tokenOpaque) && exemptionsApplied(read(f)).length > 0;
const movedAll = ALL.filter((f) => voidedNow(f) !== voidedUnderToken(f));
check(
  'B1',
  'no file in the census changes its admission verdict between the token rule and the shipped strict rule',
  movedAll.length === 0,
  `0 of ${ALL.length} files move${movedAll.length ? `: ${movedAll.join(', ')}` : ''}. Round 300 §4 ` +
    `measured this over the ${DEFERRED.length} DEFERRED files; this ranges over every probe file, ` +
    `SWEPT included, which is the population arm C is about.`,
);

const honoured = ALL.filter((f) => exemptionsApplied(read(f)).length > 0);
check(
  'B2',
  "and B1's zero is cheap for a reason worth naming: the one file with an honoured exemption has no node/tsx spawn site of any kind",
  honoured.length === 1 && honoured[0] === R246 && sitesIn(R246).length === 0,
  `honoured on exactly ${honoured.length} file (${R246.slice(0, 30)}…), whose node/tsx spawn site ` +
    `count is ${sitesIn(R246).length}. It could not have moved under any reading of the screen — ` +
    'that is containment by absence, the same shape as the 16 files Round 300 §4 found masked.',
);

// Built from parts rather than written as a regex literal, and the reason is a defect this very check
// had on its first run: spelled literally, the field-access notation appeared in THIS file's source,
// so the scanner matched its own detector and reported 1 — a scanner whose corpus is its own
// notation, which is Round 299 §4's Z3 defect, round246's shape and Round 300's A1b, mine this fire
// and inside a file whose header names the class twice. The known positive below is a CONSTRUCTED
// string, so the pattern is proved live without putting the notation back into the corpus.
const fieldRead = (name: string): RegExp => new RegExp('\\.' + name + '\\b');
const OLD_FIELD = fieldRead('opaque');
const NEW_FIELD = fieldRead('unresolved');
const stillReadsOldField = ALL.filter((f) => OLD_FIELD.test(read(f)));
const readsNewField = ALL.filter((f) => NEW_FIELD.test(read(f)));
check(
  'B3',
  'the rename is total: no probe reads the superseded field off the production scan, so its old meaning cannot be resurrected by a later reader',
  OLD_FIELD.test('scan()' + '.' + 'opaque') &&
    stillReadsOldField.length === 0 &&
    readsNewField.length >= 2,
  `the detector is proved live on a constructed fixture, then finds ${stillReadsOldField.length} ` +
    `files reading the old field${stillReadsOldField.length ? ` (${stillReadsOldField.join(', ')})` : ''} ` +
    `and ${readsNewField.length} reading the new one. 13 call sites broke at typecheck when the field ` +
    'was renamed — 10 in probe-round299 (mine, mechanical) and 3 in probe-round300 (Theseus\'s, real ' +
    'repairs). A silent redefinition in place would have broken none of them loudly, which is the ' +
    'whole argument for renaming rather than redefining.',
);

console.log('\n── arm C: the population a "costs zero" claim is measured over ──');

const sweptFiles = new Set(SWEPT.map((s: { file: string }) => s.file));
check(
  'C1',
  'the file whose exemption the rule has ever honoured was OUTSIDE the slice the zero was priced on — SWEPT, not DEFERRED',
  sweptFiles.has(R246) && !DEFERRED.includes(R246) && honoured[0] === R246,
  `${R246.slice(0, 30)}… is SWEPT and absent from DEFERRED, so Round 300 §4's \`deferred\` range ` +
    `excluded the only live instance of the thing being priced. B1 re-measures over all ${ALL.length} ` +
    'files and the zero holds — the finding is about the range, not the result. Generalisation: a ' +
    'price measured over the candidates does not include the incumbents.',
);
measure(
  'C2',
  `the figures, computed live and never pinned: probe files ${ALL.length} · SWEPT ${SWEPT.length} · ` +
    `DEFERRED ${DEFERRED.length} · node/tsx sites ${all.length} · naming a probe ${namedSites.length} · ` +
    `unresolved ${all.length - namedSites.length} · of those, ${wouldBeInvisible.length} were ` +
    `invisible to the superseded token in ${new Set(wouldBeInvisible.map((s) => s.file)).size} files · ` +
    `files with an honoured exemption ${honoured.length} · files voided today ${ALL.filter(voidedNow).length}`,
);

console.log('\n── arm Z: the probe\'s own discipline ──');

check(
  'Z1',
  'the population under scripts/ is unchanged across this run — nothing was minted, copied or removed',
  fingerprint('scripts') === zBefore &&
    readdirSync(SCRIPTS).filter((f) => /^probe-/.test(f)).length === ALL.length,
  `${ALL.length} probe files at open and at close`,
);
check(
  'Z2',
  'this probe spawns no subprocess at all — checked in the import block, the one place the claim is decidable',
  !/^import[\s\S]*?child_process/m.test(read(SELF).split('\n').slice(0, 80).join('\n')),
  'no port bound, no database opened, no corpus read, no model called. Every spawn-call token in ' +
    'this file is a detector pattern or a quoted fixture, which is why the claim is checked at a ' +
    'fixed structural position rather than searched for across the file.',
);
check(
  'Z2b',
  'and Z2 is not vacuous: the same predicate over a file that really does import a spawn function returns the other answer',
  /^import[\s\S]*?child_process/m.test(read(R281).split('\n').slice(0, 80).join('\n')),
  `${R281.slice(0, 40)}… imports from node:child_process in its import block, so the predicate ` +
    'distinguishes rather than always answering no.',
);
measure(
  'Z3',
  `fixtures, all resolved from the live census: ${[R225, R246, R280, R281, R295]
    .map((f) => f.slice(0, 26))
    .join(' · ')}`,
);

console.log(
  `\n${fail === 0 ? `All ${pass} regression checks passed` : `${fail} of ${pass + fail} FAILED`}, ${meas} measurements, 0 skips`,
);
process.exit(fail === 0 ? 0 : 1);
