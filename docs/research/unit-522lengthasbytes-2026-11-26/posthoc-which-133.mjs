#!/usr/bin/env node
/**
 * unit-522 POST-HOC — which of the arm's 133 `UNIT-LABEL` sites are real.
 *
 * Registered in PRE-REGISTRATION-ADDENDUM-WHICH-133.md at commit 3478cc2e1c10, before this file
 * existed. PH1–PH8.
 *
 * The key is NOT retyped here. It is SLICED out of the arm's own source, so this post-hoc grades
 * the sites the published arm produced rather than the sites a second hand-written reader finds.
 *
 * The discriminator is `scripts/lib/strip-source.mjs`, used in the direction §2 of the
 * pre-registration refused it for: two passes, comments-only and comments+strings, with the
 * blanking preserving length, so the unit token's INDEX survives and its region can be named.
 */

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

process.chdir(execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim());

const SELF = 'docs/research/unit-522lengthasbytes-2026-11-26/posthoc-which-133.mjs';
const ARM = 'docs/research/unit-522lengthasbytes-2026-11-26/arm-lengthasbytes.mjs';
const ARM_OUT = 'docs/research/unit-522lengthasbytes-2026-11-26/captures/ARM.out';
const HOST_SITE = 'docs/research/unit-520builtlabelreach-2026-11-25/posthoc-whose-plants.mjs';

const PH1 = [2, 25];      // IDENT-IN-CODE
const PH2 = [0, 5];       // IN-COMMENT
const PH3 = [100, 131];   // LABEL-IN-STRING
const PH4 = [30, 90];     // distinct files with a real label
const PH6 = [25, 75];     // B share, percent

const say = (...a) => console.log(...a);
const V = [];
const grade = (id, claim, got, lo, hi) => {
  const ok = got >= lo && got <= hi;
  V.push({ id, claim, got, lo, hi, verdict: ok ? 'HIT' : 'REFUTED' });
  say(`  ${ok ? 'HIT     ' : 'REFUTED '} ${id}  ${claim}`);
  say(`           registered [${lo}, ${hi}]   measured ${got}`);
};

/* ======================================================= §0 THE KEY, SLICED FROM THE ARM */

say('=== §0 THE ARM\'S OWN KEY, SLICED — not a second hand-written reader ===\n');

const armSrc = readFileSync(ARM, 'utf8');
const unitTailLiteral = armSrc.match(/const UNIT_TAIL = (\/.+?\/);/)?.[1] ?? null;
say(`  UNIT_TAIL sliced from ${ARM}: ${unitTailLiteral ?? '(NOT FOUND — ABORT)'}`);
if (!unitTailLiteral) { say('\n  ABORT — the arm\'s key could not be sliced; a retyped key would grade a different population.'); process.exit(1); }
const UNIT_TAIL = new RegExp(unitTailLiteral.slice(1, unitTailLiteral.lastIndexOf('/')));

/* The population filter, sliced from the arm's own §1 output rather than re-derived. */
const armOut = readFileSync(ARM_OUT, 'utf8');
const popLine = armOut.match(/population measured: (\d+)/)?.[1] ?? null;
const armUnitLabel = armOut.match(/UNIT-LABEL\s+(\d+)/)?.[1] ?? null;
say(`  the arm's published population: ${popLine ?? '(NOT FOUND)'}`);
say(`  the arm's published UNIT-LABEL: ${armUnitLabel ?? '(NOT FOUND)'}`);

const filterLiteral = armOut.match(/the population filter, four links out: (\/.+?\/)\s*$/m)?.[1] ?? null;
say(`  the population filter, read off the arm's capture: ${filterLiteral ?? '(NOT FOUND — ABORT)'}`);
if (!filterLiteral) { say('\n  ABORT'); process.exit(1); }
const extRe = new RegExp(filterLiteral.slice(1, filterLiteral.lastIndexOf('/')));

/* ======================================================= §1 THE DISCRIMINATOR, KP'd FIRST */

/** Which blanked region the index `i` of `src` falls in. */
function regionOf(src, i) {
  const noComments = stripSource(src, false);
  const noStrings = stripSource(src, true);
  if (noComments.length !== src.length || noStrings.length !== src.length) return 'LENGTH-NOT-PRESERVED';
  if (noComments[i] !== src[i]) return 'IN-COMMENT';
  if (noStrings[i] !== src[i]) return 'LABEL-IN-STRING';
  return 'IDENT-IN-CODE';
}

say('\n=== §1 PH7 — the discriminator KP\'d in all three directions before any figure ===\n');

const kps = [
  { id: 'K-STR', want: 'LABEL-IN-STRING', src: 'const s = "x";\nsay(`cap ${s.length} B`);\n', note: 'a unit label inside a template literal — the real class' },
  { id: 'K-IDENT', want: 'IDENT-IN-CODE', src: 'const A = [], B = [];\nconst n = Math.max(A.length, B.length);\n', note: 'a variable named B across a comma — the false positive the arm printed' },
  { id: 'K-COMMENT', want: 'IN-COMMENT', src: 'const x = "y";\n// then ${x.length} bytes of it\n', note: 'L1 prose' },
];
for (const k of kps) {
  const li = k.src.indexOf('.length');
  const tail = k.src.slice(li + '.length'.length);
  const cut = tail.indexOf('${');
  const labelTail = cut === -1 ? tail : tail.slice(0, cut);
  const m = labelTail.match(UNIT_TAIL);
  if (!m) { k.got = '(THE ARM\'S KEY DOES NOT EVEN FIRE)'; k.ok = false; }
  else {
    const tokIdx = li + '.length'.length + labelTail.indexOf(m[1]);
    k.got = regionOf(k.src, tokIdx);
    k.ok = k.got === k.want;
  }
  say(`  ${k.ok ? 'PASS' : 'FAIL'}  ${k.id}  want ${k.want}  got ${k.got}`);
  say(`        ${k.note}`);
}
const kpOk = kps.every((k) => k.ok);
say(`\n  PH7: ${kps.filter((k) => k.ok).length} of 3 → ${kpOk ? 'the discriminator may separate the 133' : 'ABORT'}`);
if (!kpOk) { say('\n  ABORT — a separation is not published off an ungraded discriminator.'); process.exit(1); }

/* ======================================================= §2 RE-DERIVE AND SEPARATE */

say('\n=== §2 the arm\'s UNIT-LABEL sites, re-derived under its own sliced key, then separated ===\n');

const pop = execFileSync('git', ['ls-files'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  .split('\n').filter((p) => extRe.test(p))
  .filter((p) => p !== SELF && p !== ARM);

const sites = [];
for (const p of pop) {
  let src;
  try { src = readFileSync(p, 'utf8'); } catch { continue; }
  const lines = src.split('\n');
  let off = 0;
  for (let n = 0; n < lines.length; n++) {
    const line = lines[n];
    let i = line.indexOf('.length');
    while (i !== -1) {
      const after = i + '.length'.length;
      const rawTail = line.slice(after);
      const cut = rawTail.indexOf('${');
      const labelTail = cut === -1 ? rawTail : rawTail.slice(0, cut);
      const m = labelTail.match(UNIT_TAIL);
      if (m) {
        const tokIdx = off + after + labelTail.indexOf(m[1]);
        sites.push({ p, n: n + 1, line, tok: m[1], region: regionOf(src, tokIdx) });
      }
      i = line.indexOf('.length', i + 1);
    }
    off += line.length + 1;
  }
}

say(`  population re-derived (arm and this file both excluded): ${pop.length}`);
say(`  UNIT-LABEL sites re-derived: ${sites.length}   (the arm published ${armUnitLabel} with itself excluded and this file not yet existing)\n`);

const byRegion = { 'LABEL-IN-STRING': [], 'IDENT-IN-CODE': [], 'IN-COMMENT': [], 'LENGTH-NOT-PRESERVED': [] };
for (const s of sites) byRegion[s.region].push(s);
for (const [k, v] of Object.entries(byRegion)) say(`    ${k.padEnd(22)} ${String(v.length).padStart(4)}`);

say('\n  IDENT-IN-CODE — the false positives, named in full:');
for (const s of byRegion['IDENT-IN-CODE']) { say(`    ${s.p}:${s.n}   token ${JSON.stringify(s.tok)}`); say(`      ${s.line}`); }
say('\n  IN-COMMENT — L1 prose sites, named in full:');
if (!byRegion['IN-COMMENT'].length) say('    (none)');
for (const s of byRegion['IN-COMMENT']) { say(`    ${s.p}:${s.n}   token ${JSON.stringify(s.tok)}`); say(`      ${s.line}`); }

/* ======================================================= §3 THE REAL LABELS */

const real = byRegion['LABEL-IN-STRING'];
const files = new Set(real.map((s) => s.p));
const hostSites = real.filter((s) => s.p === HOST_SITE);
const tokSplit = real.reduce((a, s) => { a[s.tok] = (a[s.tok] ?? 0) + 1; return a; }, {});
const bShare = real.length === 0 ? 0 : ((tokSplit.B ?? 0) / real.length) * 100;

say('\n=== §3 the real unit labels ===\n');
say(`  real unit-label sites: ${real.length} across ${files.size} file(s)`);
say(`  token split: ${Object.entries(tokSplit).map(([k, v]) => `${k}=${v}`).join(' · ')}`);
say(`  B share: ${bShare.toFixed(2)}%`);
say(`  unit-520's own host site (${HOST_SITE}): ${hostSites.length} occurrence(s) — ${hostSites.map((s) => s.n).join(', ') || 'NONE'}`);

/* PH8 — the Buffer residual. The subject name is all the line gives; it is printed, not judged. */
const SUBJ = /([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\.length$/;
const subjects = real.map((s) => s.line.slice(0, s.line.indexOf('.length') + '.length'.length).match(SUBJ)?.[1] ?? '(unparsed)');
const subjTally = subjects.reduce((a, s) => { a[s] = (a[s] ?? 0) + 1; return a; }, {});
const bufferish = Object.entries(subjTally).filter(([k]) => /buf|byte/i.test(k));
say('\n  PH8 RESIDUAL — subject names of the real labels, printed for hand-reading, not judged by this reader:');
say(`    distinct subjects: ${Object.keys(subjTally).length}`);
say(`    subjects whose NAME suggests a Buffer (so the B label could be CORRECT): ${bufferish.length ? bufferish.map(([k, v]) => `${k}×${v}`).join(' · ') : 'NONE'}`);
say(`    top subjects: ${Object.entries(subjTally).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `${k}×${v}`).join(' · ')}`);

/* ======================================================= §4 GRADING */

say('\n=== §4 GRADING against the ADDENDUM ===\n');
grade('PH1', 'IDENT-IN-CODE false positives — the B-as-variable class', byRegion['IDENT-IN-CODE'].length, ...PH1);
grade('PH2', 'IN-COMMENT (L1 prose) sites', byRegion['IN-COMMENT'].length, ...PH2);
grade('PH3', 'LABEL-IN-STRING — the corrected census figure', real.length, ...PH3);
grade('PH4', 'distinct FILES holding a real unit label', files.size, ...PH4);
grade('PH5', 'unit-520\'s own site is a member of its own census', hostSites.length, 1, 1);
grade('PH6', 'B share among real labels, percent', Number(bShare.toFixed(2)), ...PH6);
grade('PH7', 'discriminator KP, all three directions', kps.filter((k) => k.ok).length, 3, 3);
say('  RESIDUAL PH8  whether a given real label is CORRECT (a Buffer) or LATENTLY WRONG (a utf8 string) is not decidable from the line — subject names printed above, not judged');

const hits = V.filter((v) => v.verdict === 'HIT').length;
const refs = V.filter((v) => v.verdict === 'REFUTED').length;
say(`\n  graded here: ${V.length} — ${hits} HIT, ${refs} REFUTED; 1 residual (PH8)`);
if (refs) { say('\n  REFUTED, named:'); for (const v of V.filter((x) => x.verdict === 'REFUTED')) say(`    ${v.id}  ${v.claim}: registered [${v.lo}, ${v.hi}], measured ${v.got}`); }
say('\n=== END POST-HOC ===');
