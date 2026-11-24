/**
 * unit-511 arm — the CONSUMER CENSUS that decides which cure for `tracked files read` is landable,
 * plus the two HEAD figures the cure's price depends on.
 *
 * ## What this grades, and what it cannot
 *
 * The defect (`unit-510` §4): `verify-decl-body-slicers.mjs` emits `tracked files read: N` where
 * `N = tracked.filter((f) => EXTS.has(extname(f))).length` — an **extension-filter survivor count,
 * not a read count**. A tracked code file in the index but absent from the worktree is dropped at
 * the loop's `catch { continue }` and still counted by that figure.
 *
 * Three cures were named. Each is priced by a DIFFERENT property of the 20-odd tracked code files
 * that key on that line, so the census below is the measurement that licenses one of them:
 *
 * - **R (rename the label)** breaks every site that matches the string at all.
 * - **V (keep the label, make the value honest)** breaks only sites whose matcher EMBEDS a value.
 * - **A (add an adjacent line)** breaks nothing and cures nothing — the line still asserts a read.
 *
 * **Three shapes, keyed on the bytes that follow the label in the ORIGINAL source:**
 *   `VALUE`      — `tracked files read: 1080`, a digit run after the colon. Breaks under V and R.
 *   `CAPTURE`    — `tracked files read: (\d+)` or an escaped equivalent. Survives V, breaks under R.
 *   `LABEL_ONLY` — the label with no value and no capture. Survives V, breaks under R.
 *
 * **And orthogonally, whether the site is a READER or PROSE**, read off `stripSource(src, false)`
 * (comments blanked, strings kept — the reading this repo's own module names for "the caller is
 * looking for a quoted literal", which is exactly this caller):
 *   `CODE`    — the label's bytes survive the comments-blanked reading, so they are in a literal.
 *   `BLANKED` — they do not. **This class fuses two things and the fusion is declared, not hidden:**
 *               a comment, and a REGEX literal body (which `strip-source` blanks in BOTH readings,
 *               by design). A `BLANKED` site whose shape is `CAPTURE` is therefore a live regex
 *               reader, not prose; that is the only disambiguation this arm claims, and it is keyed
 *               on the shape rather than on guessing at the delimiter.
 *
 * **What it does NOT grade:** whether a surviving consumer's PUBLISHED figures were right. A reader
 * that keys on the label fine may still hold a stale 1077. That is a pin question (pre-reg limit 3).
 *
 * **This file is itself a consumer** — it has to quote the key it censuses. The census is therefore
 * taken over the tree at the PRE-REGISTRATION commit, which predates this file, and the live tree is
 * reported beside it so the instrument's own contribution is visible rather than absorbed.
 *
 * brace-slicer-deliberate: this arm compares no braces at all; it reads a label and a digit run.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const CAPS = join(HERE, 'captures');
mkdirSync(CAPS, { recursive: true });

const LABEL = 'tracked files read';
const PRE_REG_COMMIT = '7ae1eb18';
const EXTS = new Set(['.ts', '.mts', '.js', '.mjs', '.cts', '.cjs', '.tsx']);
const GATE = 'scripts/verify-decl-body-slicers.mjs';
const SELF_DECLARED = ['scripts/verify-decl-body-slicers.mjs', 'scripts/decl-body-slicers.baseline'];

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const stamp = () => execFileSync('date', ['+%H:%M:%S'], { encoding: 'utf8', env: { ...process.env, TZ: 'America/Los_Angeles' } }).trim();

say(`unit-511 arm — consumer census + HEAD figures. started ${stamp()} PST`);
say('');

/* ------------------------------------------------- §1  the two HEAD figures (P1, P2) */
// Read the gate's own population inputs the way the gate reads them, so the figures are the gate's
// and not a re-derivation under a different key: `git ls-files -z` plus the same extension set.
const trackedLive = execFileSync('git', ['-C', ROOT, 'ls-files', '-z'], { encoding: 'utf8' })
  .split('\0').filter(Boolean);
const extFiltered = trackedLive.filter((f) => EXTS.has(extname(f)));
const selfInExt = SELF_DECLARED.filter((f) => EXTS.has(extname(f)));
const unreadable = [];
let readOk = 0;
for (const rel of extFiltered) {
  if (SELF_DECLARED.includes(rel)) continue;
  try { readFileSync(join(ROOT, rel), 'utf8'); readOk += 1; } catch { unreadable.push(rel); }
}
say('§1  HEAD figures — what the published figure counts vs what a read count would be');
say(`  ext-filter survivors (the PUBLISHED figure, = what the gate prints):  ${extFiltered.length}`);
say(`  of those, excluded by SELF before the loop body runs:                 ${selfInExt.length}  ${JSON.stringify(selfInExt)}`);
say(`  of those, unreadable at the loop's catch:                             ${unreadable.length}  ${JSON.stringify(unreadable)}`);
say(`  HONEST read count (successful readFileSync calls):                    ${readOk}`);
say(`  value price of cure V = published - honest:                           ${extFiltered.length - readOk}`);
say(`  SELF entries outside the ext filter (excluded by EXTENSION, not SELF): ${JSON.stringify(SELF_DECLARED.filter((f) => !EXTS.has(extname(f))))}`);
say('');

/* ------------------------------------------------- §2  the consumer census (P3) */
const classify = (src, rel) => {
  // Shape is keyed on the bytes AFTER the label in the ORIGINAL source. Reader-vs-prose is keyed on
  // whether the label's bytes survive the comments-blanked / strings-KEPT reading.
  const kept = stripSource(src, false);
  const sites = [];
  let i = src.indexOf(LABEL);
  while (i !== -1) {
    const after = src.slice(i + LABEL.length, i + LABEL.length + 24);
    const shape = /^:?\s*\(?\\+d\+?\)?/.test(after) || /^:?\s*\(\\d\+\)/.test(after) ? 'CAPTURE'
      : /^:\s*\d/.test(after) ? 'VALUE'
        : 'LABEL_ONLY';
    // A length-preserving reading means the offset is the same offset in both strings — the
    // property `strip-source`'s header calls load-bearing, and the reason this comparison is a
    // slice rather than a search.
    const context = kept.slice(i, i + LABEL.length) === LABEL ? 'CODE' : 'BLANKED';
    const line = src.slice(0, i).split('\n').length;
    sites.push({ rel, line, shape, context, after: after.replace(/\n[\s\S]*$/, '') });
    i = src.indexOf(LABEL, i + 1);
  }
  return sites;
};

const codeFilesAt = (commit) => execFileSync('git', ['-C', ROOT, 'ls-tree', '-r', '--name-only', '-z', commit], { encoding: 'utf8' })
  .split('\0').filter(Boolean).filter((f) => EXTS.has(extname(f)));

const censusAt = (commit) => {
  const rows = [];
  for (const rel of codeFilesAt(commit)) {
    let src;
    try { src = execFileSync('git', ['-C', ROOT, 'show', `${commit}:${rel}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); } catch { continue; }
    if (!src.includes(LABEL)) continue;
    rows.push(...classify(src, rel));
  }
  return rows;
};

const tally = (rows) => {
  const t = {};
  for (const r of rows) {
    const k = `${r.shape}/${r.context}`;
    t[k] = (t[k] || 0) + 1;
  }
  return t;
};

const atPreReg = censusAt(PRE_REG_COMMIT);
const atHead = censusAt('HEAD');
const filesOf = (rows) => [...new Set(rows.map((r) => r.rel))];

say(`§2  consumer census over TRACKED CODE FILES at the pre-registration commit ${PRE_REG_COMMIT}`);
say(`  files carrying the label: ${filesOf(atPreReg).length}   sites: ${atPreReg.length}`);
say(`  tally shape/context: ${JSON.stringify(tally(atPreReg))}`);
say('');
say('  per-site, the gate itself separated out (it is the EMITTER, not a consumer):');
for (const r of atPreReg.filter((x) => x.rel !== GATE)) {
  say(`    ${r.shape.padEnd(10)} ${r.context.padEnd(7)} ${r.rel}:${r.line}   after="${r.after.slice(0, 40)}"`);
}
say('');
say('  the emitter\'s own sites:');
for (const r of atPreReg.filter((x) => x.rel === GATE)) {
  say(`    ${r.shape.padEnd(10)} ${r.context.padEnd(7)} ${r.rel}:${r.line}   after="${r.after.slice(0, 40)}"`);
}
say('');

/* ------------------------------------------------- §3  survival verdicts per cure */
const consumers = atPreReg.filter((r) => r.rel !== GATE);
const codeConsumers = consumers.filter((r) => r.context === 'CODE' || r.shape === 'CAPTURE');
const breaksUnderV = codeConsumers.filter((r) => r.shape === 'VALUE');
const breaksUnderR = codeConsumers;
say('§3  what each cure costs, counted off §2 rather than argued');
say(`  live consumer sites (CODE, or a CAPTURE inside a regex body):   ${codeConsumers.length}`);
say(`  sites that BREAK under V (label kept, value honest) — shape VALUE in a matcher: ${breaksUnderV.length}`);
for (const r of breaksUnderV) say(`      ${r.rel}:${r.line}  after="${r.after.slice(0, 40)}"`);
say(`  sites that BREAK under R (label renamed) — every live consumer site:            ${breaksUnderR.length}`);
say(`  distinct FILES that break under R: ${[...new Set(breaksUnderR.map((r) => r.rel))].length}`);
say('');

/* ------------------------------------------------- §4  the instrument's own contribution */
const headFiles = filesOf(atHead);
const preRegFiles = filesOf(atPreReg);
const added = headFiles.filter((f) => !preRegFiles.includes(f));
say('§4  this instrument is itself a consumer — declared, not absorbed');
say(`  files carrying the label at HEAD: ${headFiles.length}   at ${PRE_REG_COMMIT}: ${preRegFiles.length}`);
say(`  added by this unit: ${JSON.stringify(added)}`);
say('');

/* ------------------------------------------------- §5  KP for the census key itself */
// A classifier returning counts needs a known positive that CARRIES the property, not an analogy.
// These three lines are SLICED OUT OF REAL CONSUMER FILES at the pre-reg commit — not hand-typed —
// so the KP cannot drift from the corpus it grades. The fourth is the one shape the corpus may not
// contain, and it is marked as hand-built where it is.
const sliceRealLine = (shape) => {
  const hit = atPreReg.find((r) => r.shape === shape && r.rel !== GATE)
    || atPreReg.find((r) => r.shape === shape);
  if (!hit) return null;
  const src = execFileSync('git', ['-C', ROOT, 'show', `${PRE_REG_COMMIT}:${hit.rel}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const line = src.split('\n')[hit.line - 1];
  return { shape, from: `${hit.rel}:${hit.line}`, line };
};
const kps = ['VALUE', 'CAPTURE', 'LABEL_ONLY'].map(sliceRealLine).filter(Boolean);
say('§5  KP — each shape re-classified from a line SLICED out of a real consumer, in isolation');
let kpHit = 0;
let kpMiss = 0;
for (const kp of kps) {
  // Re-classify the single line on its own. A VALUE line sliced out of a comment arrives here with
  // no comment around it, so its CONTEXT legitimately changes; the SHAPE is what this KP grades.
  const got = classify(kp.line, kp.from);
  const ok = got.length >= 1 && got[0].shape === kp.shape;
  if (ok) kpHit += 1; else kpMiss += 1;
  say(`  ${ok ? 'HIT ' : 'MISS'} expected ${kp.shape.padEnd(10)} got ${(got[0] ? got[0].shape : 'NONE').padEnd(10)} from ${kp.from}`);
}
say(`  KP: ${kpHit} hit, ${kpMiss} miss, shapes covered ${JSON.stringify(kps.map((k) => k.shape))}`);
const missingShapes = ['VALUE', 'CAPTURE', 'LABEL_ONLY'].filter((s) => !kps.some((k) => k.shape === s));
say(`  shapes with NO live instance to slice (so unKP'd by this corpus): ${JSON.stringify(missingShapes)}`);
say('');

/* ------------------------------------------------- §6  cripple: can the census go wrong green? */
// A census that returns a number needs a drive where the number MUST change. Blank the label in a
// copy of a known consumer and assert the site count drops by exactly that file's sites.
const victim = consumers[0];
if (victim) {
  const vsrc = execFileSync('git', ['-C', ROOT, 'show', `${PRE_REG_COMMIT}:${victim.rel}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const expected = atPreReg.filter((r) => r.rel === victim.rel).length;
  const crippled = classify(vsrc.split(LABEL).join('tracked files XXXX'), victim.rel);
  say('§6  cripple — blank the label in one real consumer and the census MUST lose exactly its sites');
  say(`  ${victim.rel}: sites intact ${expected} → crippled ${crippled.length}  ${crippled.length === 0 && expected > 0 ? 'CRIPPLE LIVE' : 'CRIPPLE DEAD — the census is not keyed on what it says it is'}`);
} else {
  say('§6  cripple — SKIPPED: no consumer site found, which would itself refute P3');
}
say('');
say(`arm finished ${stamp()} PST`);

writeFileSync(join(CAPS, 'ARM-CENSUS.out'), `${out.join('\n')}\n`);
writeFileSync(join(CAPS, 'ARM-CENSUS.json'), `${JSON.stringify({
  headFigures: {
    published: extFiltered.length, selfInExt, unreadable, honestRead: readOk,
    priceOfV: extFiltered.length - readOk,
  },
  censusAtPreReg: atPreReg,
  tallyAtPreReg: tally(atPreReg),
  breaksUnderV: breaksUnderV.map((r) => `${r.rel}:${r.line}`),
  breaksUnderR: [...new Set(breaksUnderR.map((r) => r.rel))],
  addedByThisUnit: added,
  kp: { hit: kpHit, miss: kpMiss, missingShapes },
}, null, 2)}\n`);
