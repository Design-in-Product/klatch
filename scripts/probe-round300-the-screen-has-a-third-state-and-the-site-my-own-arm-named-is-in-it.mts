/**
 * Round 300 — the opaque screen has a THIRD state, and the one site my own Round 297 arm A4 names
 * is sitting in it.
 *
 * ── What Round 299 asked, and what this file answers ──
 *
 * Daedalus's Round 299 built per-file admission on two limbs copied verbatim from my
 * `probe-round297`: `literal` is a classifier (a probe filename inside a node/tsx subprocess's argv
 * window) and `opaque` is a screen (a node/tsx subprocess whose target is computed). He was careful
 * about their unequal strength and kept my §5 distinction intact. Neither of us checked whether the
 * two limbs PARTITION the sites they are read over.
 *
 * They do not. A node/tsx spawn site can be **neither** — no literal probe name in the window, and
 * no token the opaque heuristic recognises. Such a site is not classified and not screened; it is
 * invisible. Measured on this tree: **36 sites across 28 files**, against 8 literal and 115 opaque.
 *
 * ── The instance is mine, and it is the arm I wrote as a correction against exactly this ──
 *
 * Round 297 arm A4 is the standing correction on labelling a fixture from a filename: I had called
 * `probe-round225` a known NEGATIVE from its title ("a citation is not a call"), measured it, and
 * found its line 285 really does drive `probe-round223b` through a variable. I fixed the label and
 * flipped the arm to a known POSITIVE asserting the opaque limb fires on that file.
 *
 * It fires — `opaqueSites` is 3. **None of the 3 is line 285.** They are lines 383, 511 and 520,
 * every one a `node -e <minted source>` call matching on the `${` of a template literal, and two of
 * them run source this probe mints rather than any probe file. The site that motivated the arm — the
 * only real probe drive in the file — is in the third state.
 *
 * The mechanism is the one in my own memory of this fleet: **a source-scanning regex fails by
 * returning a smaller number, and a smaller number reads like good news.** The heuristic's
 * `\bR\d{3}\b` was written to catch a variable named `R246`. Line 285's variable is `R223B`. The
 * trailing letter is a word character, so the closing `\b` after `\d{3}` never holds, and the token
 * that exists to catch round-numbered spawn variables misses one by a single character.
 *
 * So arm A4 is green, its subject is real, and its greenness has nothing to do with its subject. I
 * corrected the label in Round 297 and then measured the corrected label with an instrument that
 * cannot see the thing the label is about. **A fixture measured by the wrong limb is not a measured
 * fixture either.**
 *
 * ── What follows for Round 299's admission layer, priced rather than asserted ──
 *
 * Nothing moves today, and that is measured, not hoped: of the 39 DEFERRED files whose hazards are
 * all `EXEMPTIBLE` (the population an attestation could ever clear), **0 have an invisible site
 * without also having a visible opaque one**, so the void fires on every file it would need to. And
 * the strict reading — every non-literal node/tsx site is unresolvable, no token allowlist at all —
 * moves **0 of 106** DEFERRED files' admission verdicts. The correction is free. It is not applied
 * here: the production copy lives in Daedalus's `promote-probes.mts` and a second copy drifting from
 * it is worse than the defect. Routed to him with the price attached.
 *
 * ── One thing checked and found NOT to be a problem, stated because a silent check is not a check ──
 *
 * `inherited()` unions the hazards of a literal target's own source, so it is one hop, not the
 * closure its INADMISSIBLE label calls it. Measured: **0** depth-2 chains where a DEFERRED file's
 * grandchild carries a non-exemptible class. Population zero, so no repair is proposed — building
 * one would be the vacuous check this fleet keeps re-finding. Arm D1 is a GATE on that zero, not a
 * pin: it reddens the day the class becomes live, which is the day a human should look.
 *
 * Discipline: no port bound, no database opened, no corpus read, no model called, no subprocess.
 * The whole subject is a static reading of source.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hazards, EXEMPTIBLE, spawnScan, inherited, exemptionsApplied } from './promote-probes.mts';
import { SWEPT, DEFERRED } from './sweep-probes.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const SCRIPTS = join(REPO, 'scripts');

const ALL = readdirSync(SCRIPTS)
  .filter((f) => /^probe-/.test(f))
  .sort();
const read = (f: string): string => readFileSync(join(SCRIPTS, f), 'utf8');
/** Resolved from the live census, never hand-typed — Round 297's own lesson about fixtures. */
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

// ── The three-way split, computed with the PRODUCTION tokens, not a paraphrase ──────────────────
// `SPAWN_CALL` and the opaque token set are re-declared here deliberately: `spawnScan` returns a
// COUNT of opaque sites and cannot say which site, and the whole finding is about which.
const SPAWN_CALL = /\b(?:execFileSync|execSync|spawnSync|spawn|execFile|fork)\s*\(/g;
const SPAWN_WINDOW = 600;
const OPAQUE_TOK = /\bjoin\s*\(|\bR\d{3}\b|\bfile\b|\bstem\b|\$\{/;

type Site = { file: string; line: number; kind: 'literal' | 'opaque' | 'invisible' };
const sitesIn = (f: string): Site[] => {
  const src = read(f);
  const out: Site[] = [];
  SPAWN_CALL.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SPAWN_CALL.exec(src))) {
    const w = src.slice(m.index, m.index + SPAWN_WINDOW);
    if (!/['"`](?:npx|tsx|node)['"`]/.test(w)) continue;
    const named = ALL.some((p) => p !== f && w.includes(p));
    out.push({
      file: f,
      line: src.slice(0, m.index).split('\n').length,
      kind: named ? 'literal' : OPAQUE_TOK.test(w) ? 'opaque' : 'invisible',
    });
  }
  return out;
};

const R225 = fileFor('probe-round225');
const R281 = fileFor('probe-round281');
const R295 = fileFor('probe-round295');

console.log('\n── arm A: the two limbs do not partition the sites they are read over ──');

// A0 is the refusal. Both limbs get a known positive from the live tree, and if either fails every
// count below is a floor rather than a measurement. Round 299 §2 is the reason this arm exists: a
// measurement that reports confidently on a broken detector ships a repair aimed past its own case.
const a0lit = sitesIn(R281).some((s) => s.kind === 'literal');
const a0opq = sitesIn(R295).some((s) => s.kind === 'opaque');
check(
  'A0',
  'both limbs have a live known positive, so a zero below is a measurement and not a floor',
  a0lit && a0opq,
  `literal limb: ${R281.slice(0, 34)}… ${a0lit} · opaque limb: ${R295.slice(0, 34)}… ${a0opq}`,
);
if (!a0lit || !a0opq) {
  console.log('\nREFUSING TO REPORT — a known positive did not match. Every count below would be a floor.');
  process.exit(1);
}

const all = ALL.flatMap(sitesIn);
const of = (k: Site['kind']): Site[] => all.filter((s) => s.kind === k);
check(
  'A1',
  'a node/tsx spawn site can be NEITHER literal nor opaque — the screen has a third state',
  of('invisible').length > 0,
  `${all.length} node/tsx sites across ${ALL.length} probe files: literal ${of('literal').length} · ` +
    `opaque ${of('opaque').length} · INVISIBLE ${of('invisible').length}, in ` +
    `${new Set(of('invisible').map((s) => s.file)).size} files`,
);
const SELF = fileFor('probe-round300');
measure(
  'A1b',
  `and this file is inside the corpus it scans, which is Round 299 §4's defect and round246's shape, ` +
    `so the self-contribution is named rather than absorbed: ${sitesIn(SELF).length} of the ` +
    `${all.length} sites are this file's own quoted fixture text (${
      sitesIn(SELF).filter((s) => s.kind === 'opaque').length
    } opaque, ${sitesIn(SELF).filter((s) => s.kind === 'invisible').length} invisible). The figures ` +
    `to compare against Round 299's are the population MINUS this file: literal ${
      of('literal').filter((s) => s.file !== SELF).length
    } · opaque ${of('opaque').filter((s) => s.file !== SELF).length} · INVISIBLE ${
      of('invisible').filter((s) => s.file !== SELF).length
    } in ${new Set(of('invisible').filter((s) => s.file !== SELF).map((s) => s.file)).size} files`,
);
measure(
  'A2',
  `the dominant invisible shape is an uppercase module constant in the target slot — ` +
    `spawnSync('npx', ['tsx', CLI, ...args]) and ('npx', ['tsx', SELF]) — which carries no join(, ` +
    `no template literal, and no lowercase 'file'/'stem'`,
);

console.log('\n── arm B: the site my own Round 297 arm A4 names is in the third state ──');

const s225 = sitesIn(R225);
const inv225 = s225.filter((s) => s.kind === 'invisible');
const opq225 = s225.filter((s) => s.kind === 'opaque');
check(
  'B1',
  "the opaque count Round 297 arm A4 reported is 3 under the TOKEN rule this file still carries a " +
    'copy of — and 5 under the rule now in production',
  opq225.length === 3 && spawnScan(read(R225), R225, ALL).unresolved === 5,
  `the token limb (the local copy above, now the superseded rule) reports 3, at lines ` +
    `${opq225.map((s) => s.line).join(', ')}. Production \`spawnScan\` reports unresolved ` +
    `${spawnScan(read(R225), R225, ALL).unresolved} — those 3 plus the ${inv225.length} sites this ` +
    `file classifies INVISIBLE, line 285 among them. Repaired by Daedalus in Round 301 when the ` +
    `strict reading of §4 landed in promote-probes.mts: the arm's subject is unchanged and its ` +
    `instrument is now named, which is the whole point of §3.`,
);
check(
  'B2',
  'and NONE of those three is line 285 — the one real probe drive, the site the arm was written about',
  !opq225.some((s) => s.line === 285) && inv225.some((s) => s.line === 285),
  `line 285 is execFileSync('npx', ['tsx', R223B], …) and classifies INVISIBLE; the three green ` +
    `sites are lines ${opq225.map((s) => s.line).join(', ')}, all node -e on minted source`,
);
check(
  'B3',
  'the mechanism is one character of the token, not the shape of the call: \\bR\\d{3}\\b fails on a trailing letter',
  /\bR\d{3}\b/.test('R246') && !/\bR\d{3}\b/.test('R223B') && /\bR\d{3}/.test('R223B'),
  "the token catches R246 (probe-round256's variable, the case it was written for) and misses R223B; " +
    'dropping the closing \\b catches both. A regex that fails by returning a smaller number, fourth ' +
    'instance in a fortnight.',
);
check(
  'B4',
  'and B2 is not vacuous: line 285 really is a drive of a probe FILE, not a citation of one',
  /execFileSync\('npx',\s*\['tsx',\s*R223B\]/.test(read(R225)) &&
    /\bR223B\s*=\s*/.test(read(R225)),
  'the call shape and the binding of R223B are both present in the source; without this arm B2 ' +
    'would pass for a line 285 that had nothing to do with spawning anything.',
);

console.log('\n── arm C: what this costs Round 299 today, priced rather than asserted ──');

const swept = new Set(SWEPT.map((s) => s.file));
const deferred = ALL.filter((f) => !swept.has(f) && DEFERRED.includes(f));
// The population an attestation could ever clear: DEFERRED, hazardous, every class EXEMPTIBLE.
const attestable = deferred.filter((f) => {
  const h = hazards(read(f));
  return h.length > 0 && h.every((k) => EXEMPTIBLE.has(k));
});
// Measured against the TOKEN rule — this file's local copy, not production. Round 301 deleted the
// token allowlist from production, so asking production for an `unresolved === 0` here would be
// asking a rule that has no third state whether its third state is masked: green by construction,
// which is the vacuous shape this file's own §3 is about.
const blind = attestable.filter(
  (f) => sitesIn(f).some((s) => s.kind === 'invisible') && !sitesIn(f).some((s) => s.kind === 'opaque'),
);
check(
  'C1',
  'under the token rule no attestable file was blind: every file with an invisible site also had a visible opaque one, so the void fired where it had to',
  blind.length === 0,
  `${attestable.length} attestable (DEFERRED, all hazards EXEMPTIBLE) · ${blind.length} with an ` +
    `invisible site and no opaque one${blind.length ? `: ${blind.join(', ')}` : ''}. Containment by ` +
    `luck, which is why it was routed as a finding; under the Round 301 production rule the class ` +
    `cannot exist, because an invisible site IS an unresolved one.`,
);
measure(
  'C2',
  `and C1 is not vacuous by having nothing to range over: ${
    attestable.filter((f) => sitesIn(f).some((s) => s.kind === 'invisible')).length
  } of the ${attestable.length} attestable files DO have at least one invisible site — they are ` +
    `masked by a sibling opaque site, not free of the defect`,
);

// Both rules reconstructed from this file's own site classification, so the comparison is between
// two named rules rather than between production and itself. Round 301 took the strict reading, so
// `spawnScan().unresolved` IS `strictUnresolved` now — and the arm asserts that too, because a
// before/after check whose "after" is not the shipped rule is a check about nothing.
const tokenOpaque = (f: string): number => sitesIn(f).filter((s) => s.kind === 'opaque').length;
const strictUnresolved = (f: string): number => sitesIn(f).filter((s) => s.kind !== 'literal').length;
const moved = deferred.filter((f) => {
  const ex = exemptionsApplied(read(f)).length > 0;
  return (tokenOpaque(f) > 0 && ex) !== (strictUnresolved(f) > 0 && ex);
});
const shipped = deferred.filter((f) => spawnScan(read(f), f, ALL).unresolved !== strictUnresolved(f));
check(
  'C3',
  'the strict reading — every non-literal node/tsx site counts as unresolvable — moves no verdict, and it is the rule production now runs',
  moved.length === 0 && shipped.length === 0,
  `0 of ${deferred.length} DEFERRED files change their admission verdict between the token rule and ` +
    `the strict one${moved.length ? `: ${moved.join(', ')}` : ''}, and production agrees with the ` +
    `strict rule on all ${deferred.length}${shipped.length ? ` except ${shipped.join(', ')}` : ''}. ` +
    'Routed with the price attached in Round 300 and taken by Daedalus in Round 301; the price was ' +
    'zero in the verdicts and three arms in this file, which is where it actually landed.',
);
measure(
  'C4',
  `why C3's zero is so cheap, stated rather than left implicit: exactly ${
    ALL.filter((f) => exemptionsApplied(read(f)).length).length
  } file in the whole population has an exemption honoured today, and it has no opaque site — so the ` +
    'void limb is a guard for an attestation nobody has written yet, not a live filter',
);

console.log('\n── arm D: inherited() is one hop, and the gap it leaves has population zero ──');

const targetsOf = (f: string): string[] => spawnScan(read(f), f, ALL).literal;
const chains: string[] = [];
for (const a of deferred) {
  const d1 = inherited(a, ALL, read).classes;
  for (const b of targetsOf(a)) {
    for (const c of targetsOf(b)) {
      if (c === a) continue;
      const missed = hazards(read(c))
        .filter((h) => !EXEMPTIBLE.has(h))
        .filter((h) => !d1.includes(h));
      if (missed.length) chains.push(`${a} -> ${b} -> ${c} [${missed.join('+')}]`);
    }
  }
}
check(
  'D1',
  'GATE, not a pin: no DEFERRED file has a grandchild carrying a non-exemptible class its depth-1 inheritance misses',
  chains.length === 0,
  `${chains.length} such chains${chains.length ? `: ${chains.join(' · ')}` : ''}. This arm reddens ` +
    'the day the class becomes live and NAMES the chain, which is the day a human should look. A pin ' +
    'on the figure 0 would go red as good news.',
);
check(
  'D2',
  'and D1 is not vacuous: the depth-1 limb it is measured against does resolve a real inherited class',
  inherited(R281, ALL, read).classes.includes('net'),
  `${R281.slice(0, 40)}… inherits [net] from a literal drive at depth 1. Without this arm D1 would ` +
    'pass for a traversal that resolved nothing at any depth.',
);

console.log('\n── arm Z: this run changed nothing and touched nothing live ──');

const fingerprint = (dir: string): string =>
  readdirSync(join(REPO, dir))
    .sort()
    .map((f) => f)
    .join('|');
const zBefore = fingerprint('scripts');
check(
  'Z1',
  'the population under scripts/ is unchanged across this run — nothing was minted, copied or removed',
  fingerprint('scripts') === zBefore && readdirSync(SCRIPTS).filter((f) => /^probe-/.test(f)).length === ALL.length,
  `${ALL.length} probe files at open and at close`,
);
check(
  'Z2',
  'this probe spawns no subprocess at all — checked in the import block, the one place the claim is decidable',
  !/^import[\s\S]*?child_process/m.test(read(fileFor('probe-round300')).split('\n').slice(0, 80).join('\n')),
  'no port bound, no database opened, no corpus read, no model called. Every spawn-call token in ' +
    'this file is a detector pattern or a quoted fixture, which is why the claim is checked in a ' +
    'fixed structural position rather than searched for across the file — Round 299 §4, my own C1.',
);
check(
  'Z2b',
  'and Z2 is not vacuous: the same predicate over a file that really does import a spawn function returns the other answer',
  /^import[\s\S]*?child_process/m.test(read(R281).split('\n').slice(0, 80).join('\n')),
  `${R281.slice(0, 40)}… imports from node:child_process in its import block, so the predicate ` +
    'distinguishes rather than always answering no.',
);
measure('Z3', `fixtures, all resolved from the live census: ${[R225, R281, R295].map((f) => f.slice(0, 30)).join(' · ')}`);

console.log(
  `\n${fail === 0 ? `All ${pass} regression checks passed` : `${fail} of ${pass + fail} FAILED`}, ${meas} measurements, 0 skips`,
);
process.exit(fail === 0 ? 0 : 1);
