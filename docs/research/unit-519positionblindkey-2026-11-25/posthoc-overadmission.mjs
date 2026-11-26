/**
 * unit-519 post-hoc — PH1–PH4, registered at `9c54ce2b` before this file existed.
 *
 * Names the 6 over-admitted sites, classifies each off its own captured line, and settles whether
 * the `error` 11 → 12 difference between this unit's reproduction and `unit-517`'s published
 * figure is population growth or a reader difference.
 *
 * Readers sliced out of the published `posthoc-hazard.mjs` exactly as the arm does; the cured key
 * is re-declared here identically because it is 1 line and slicing a 1-line declaration out of a
 * sibling in the same unit is not provenance, it is ceremony. §0 asserts the two spellings match
 * by comparing the two files' source text for the same key string.
 *
 * No character comparison against a brace, paren or colon. Asserted in §0.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const CAPS = join(HERE, 'captures');
mkdirSync(CAPS, { recursive: true });
const lines = [];
const say = (s) => { lines.push(s); console.log(s); };
let failures = 0;
const fail = (m) => { failures += 1; say(`  FAIL  ${m}`); };
const rev = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' });

say(`unit-519 post-hoc — PH1–PH4 — HEAD ${rev}`);
say('');

say('§0  preconditions');
const dirty = git('diff', '--stat', 'HEAD', '--', 'packages/', 'scripts/');
say(`  git diff --stat HEAD -- packages/ scripts/ : ${dirty.trim() === '' ? 'EMPTY' : 'NON-EMPTY'}`);
if (dirty.trim() !== '') fail('packages/ or scripts/ is dirty');
const SELF = readFileSync(join(HERE, 'posthoc-overadmission.mjs'), 'utf8');
const CMP_KEY = /[=!]==?\s*['"`]\\?\{['"`]|['"`]\\?\{['"`]\s*[=!]==?/;
say(`  brace-comparison present in this file: ${CMP_KEY.test(stripSource(SELF, false))}`);
if (CMP_KEY.test(stripSource(SELF, false))) fail('would join verify-decl-body-slicers\' population');

const KEY_SRC = '`(^|[^\\\\w$.])(${name})\\\\s*:`';
const ARM = readFileSync(join(HERE, 'arm-positionblindkey.mjs'), 'utf8');
say(`  the cured key spelled identically in the arm and here: ${ARM.includes(KEY_SRC) && SELF.includes(KEY_SRC)}`);
if (!(ARM.includes(KEY_SRC) && SELF.includes(KEY_SRC))) fail('the two spellings of the cured key differ — the rung does not measure the arm\'s cure');
say('');

const SUBJ = readFileSync(join(ROOT, 'docs/research/unit-517branchorder-2026-11-25/posthoc-hazard.mjs'), 'utf8');
const START = 'const AT = (s, ch, i) =>';
const END_ANCHOR = '  return out;\n};';
const s0 = SUBJ.indexOf(START);
const s1 = SUBJ.indexOf(END_ANCHOR, SUBJ.indexOf('const sitesOf = (src, name, v2 = false) =>'));
const SPAN = SUBJ.slice(s0, s1 + END_ANCHOR.length);
const H = new Function('stripSource', `${SPAN}\nreturn { valueSpanV2, ternaryQV2, sitesOf };`)(stripSource);

const CURED_KEY = (name) => new RegExp(`(^|[^\\w$.])(${name})\\s*:`, 'gm');
const curedSites = (src, name) => {
  const code = stripSource(src, true);
  const out = [];
  for (const m of code.matchAll(CURED_KEY(name))) out.push(m.index + m[1].length);
  return out;
};
const blindSites = (src, name) => {
  const code = stripSource(src, true);
  const out = [];
  for (const m of code.matchAll(new RegExp(`\\b${name}\\s*:`, 'g'))) out.push(m.index);
  return out;
};

const NAMES = ['p', 'cls', 'error', 'file', 'conversation'];
const EXTS = (p) => p.endsWith('.mjs') || p.endsWith('.js') || p.endsWith('.mts');
const trackedNow = git('ls-files', 'docs/research', 'scripts').split('\n').filter(EXTS);

// ───────────────────────────────────────────── PH4 — name and classify all 6

say('§1  PH4 — every over-admitted site, named, with its preceding character and its line');
const over = [];
for (const name of NAMES) {
  for (const rel of trackedNow) {
    let src;
    try { src = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
    if (!src.includes(name)) continue;
    const cured = new Set(curedSites(src, name));
    for (const at of blindSites(src, name)) {
      if (cured.has(at)) continue;
      const line = src.slice(0, at).split('\n').length;
      const text = src.split('\n')[line - 1];
      over.push({ name, rel, line, prev: src[at - 1], text: text.trim() });
    }
  }
}
say(`  over-admitted sites across all five names: ${over.length}`);
say('');
const MECH = (o) => {
  if (o.prev === '.') return 'MEMBER-TAIL   (`x.name` before a ternary\'s else-colon, or before a type/label colon)';
  if (/[A-Za-z0-9_$]/.test(o.prev)) return 'IDENT-SUFFIX  (`name` is the tail of a longer identifier)';
  return `OTHER         (preceded by ${JSON.stringify(o.prev)})`;
};
const byMech = {};
for (const o of over) {
  const m = MECH(o).split('  ')[0];
  byMech[m] = (byMech[m] ?? 0) + 1;
  say(`  [${o.name}]  ${o.rel}:${o.line}   prev ${JSON.stringify(o.prev)}`);
  say(`        ${MECH(o)}`);
  say(`        ${o.text.slice(0, 110)}`);
}
say('');
say(`  mechanisms present: ${Object.entries(byMech).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
const PH4 = Object.keys(byMech).length >= 2;
say(`  PH4 (≥2 distinct mechanisms among the over-admitted sites): ${PH4 ? 'HIT' : 'REFUTED'} — ${Object.keys(byMech).length}`);
say('');

// ───────────────────────────────────────────── PH3 — rate by name

say('§2  PH3 — over-admission rate by name');
const rate = {};
for (const name of NAMES) {
  let blind = 0;
  let cured = 0;
  for (const rel of trackedNow) {
    let src;
    try { src = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
    if (!src.includes(name)) continue;
    blind += blindSites(src, name).length;
    cured += curedSites(src, name).length;
  }
  rate[name] = { blind, cured, over: blind - cured, pct: blind === 0 ? 0 : (100 * (blind - cured)) / blind };
  say(`  ${name.padEnd(14)} position-blind ${String(blind).padStart(5)}  cured ${String(cured).padStart(5)}  over ${String(blind - cured).padStart(3)}   ${rate[name].pct.toFixed(2)}%`);
}
const big = NAMES.filter((n) => rate[n].blind >= 100);
const bigWorst = Math.max(...big.map((n) => rate[n].pct));
const worstName = NAMES.reduce((a, b) => (rate[a].pct >= rate[b].pct ? a : b));
const fewest = NAMES.reduce((a, b) => (rate[a].blind <= rate[b].blind ? a : b));
say(`  names with ≥100 sites: ${big.join(', ')} — worst rate among them ${bigWorst.toFixed(2)}%`);
say(`  highest rate overall: ${worstName} (${rate[worstName].pct.toFixed(2)}%)   fewest sites: ${fewest}`);
const PH3 = bigWorst <= 1 && worstName === fewest;
say(`  PH3 (no name with ≥100 sites above 1%, AND the highest rate is the name with the fewest sites): ${PH3 ? 'HIT' : 'REFUTED'}`);
say('');

// ───────────────────────────────────────────── PH1/PH2 — the population delta

say('§3  PH1/PH2 — the `error` 11 → 12 difference');
const U517_COMMIT = 'e0c9f88e';
const trackedThen = git('ls-tree', '-r', '--name-only', U517_COMMIT, 'docs/research', 'scripts').split('\n').filter(EXTS);
say(`  population at ${U517_COMMIT}: ${trackedThen.length}   at ${rev}: ${trackedNow.length}   delta ${trackedNow.length - trackedThen.length}`);
const thenSet = new Set(trackedThen);
const added = trackedNow.filter((p) => !thenSet.has(p));
const nowSet = new Set(trackedNow);
const removed = trackedThen.filter((p) => !nowSet.has(p));
say(`  added ${added.length}   removed ${removed.length}`);
const PH2authors = [];
for (const p of added) {
  const who = git('log', '-1', '--format=%an', '--', p).trim();
  const errHere = (() => { try { return curedSites(readFileSync(join(ROOT, p), 'utf8'), 'error').length; } catch { return 0; } })();
  PH2authors.push({ p, who, errHere });
  say(`      + ${p}`);
  say(`          author ${who}   cured \`error:\` sites in it: ${errHere}`);
}
for (const p of removed) say(`      - ${p}`);
const carriers = PH2authors.filter((x) => x.errHere > 0);
say('');
// the published figure, recomputed over the THEN population with the published reader
let errThen = 0;
for (const rel of trackedThen) {
  let src;
  try { src = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
  if (!src.includes('error:')) continue;
  errThen += H.sitesOf(src, 'error', true).length;
}
say(`  \`error\` v2 recomputed over the ${trackedThen.length}-file population with the PUBLISHED reader: ${errThen}`);
say(`  (published in POSTHOC-HAZARD.out: 11)`);
const PH1 = errThen === 11 && carriers.length === 1;
say(`  PH1 (population growth, not a reader difference; exactly one new file carries an \`error:\` site): ${PH1 ? 'HIT' : 'REFUTED'}`);
say(`      recomputed-then equals published: ${errThen === 11}   new carriers: ${carriers.length}`);
const allTheseus = added.length === 3 && PH2authors.every((x) => /theseus/i.test(x.who));
say(`  PH2 (delta is 3 and all 3 are Theseus's by commit author): ${allTheseus ? 'HIT' : 'REFUTED'} — delta ${added.length}, authors ${[...new Set(PH2authors.map((x) => x.who))].join(', ')}`);
say('');

say(`§4  ${failures === 0 ? 'ALL ASSERTIONS PASSED' : `${failures} FAILURE(S)`}`);
const v = { PH1, PH2: allTheseus, PH3, PH4 };
say(`  verdicts: ${Object.entries(v).map(([k, x]) => `${k} ${x ? 'HIT' : 'REFUTED'}`).join(' · ')}`);
say(`  HIT ${Object.values(v).filter(Boolean).length} of 4`);

writeFileSync(join(CAPS, 'POSTHOC-OVERADMISSION.out'), `${lines.join('\n')}\n`);
writeFileSync(join(CAPS, 'POSTHOC-OVERADMISSION.json'), `${JSON.stringify({
  rev, verdicts: v, failures, over, byMech, rate,
  populationThen: trackedThen.length, populationNow: trackedNow.length, added: PH2authors, removed,
  errorThenRecomputed: errThen,
}, null, 2)}\n`);
process.exit(failures === 0 ? 0 : 1);
