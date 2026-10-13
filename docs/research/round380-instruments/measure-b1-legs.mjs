#!/usr/bin/env node
/**
 * Round 380 — Daedalus's Round 379 B1/B1m figures, re-derived under a key that reuses none of his.
 *
 * His line (`probe-round377`, section B) derives four numbers and two member lists:
 *
 *   narrowMembers.length over narrowPop.length   published as 17 over 122
 *   namesOther           over censusPop.length   published as 20 over 153
 *   onlyUnderCensus      published as +3, members `probe-round241`, `probe-round232`, `probe-round246`
 *   onlyUnderNarrow      published as 0
 *
 * His mechanism: `pop.some((f) => f !== e.file && src.includes(f))` — ask, for every population
 * filename, whether the swept file's source contains it.
 *
 * Mine is deliberately the other direction, because two keys that share the thing that SELECTS can
 * agree vacuously (339) and a count can match on a member list that does not (340):
 *
 *   SELECTION   `startsWith('probe-')` / `startsWith('probe-round')` over my own `readdirSync`,
 *               not his `/^probe-/` regex and not his `census()` import.
 *   DETECTION   scan each swept source ONCE for `probe-`-initial tokens, then INTERSECT that token
 *               set with the population set. His asks N questions of the text; mine asks the text
 *               what it contains and compares sets.
 *
 * Both a known positive and a known negative on the tokeniser, copied from a real neighbourhood
 * rather than hand-analogised (355), because a tokeniser that returned nothing would reproduce
 * "0 only under the narrower" for the wrong reason and a tokeniser that over-captured would inflate
 * both legs equally and still look nested.
 *
 * Prints GRADE lines and exits non-zero if any grade is not `true` (356) — a figure printed below a
 * failed self-test is not a reading.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPTS = join(HERE, '..', '..', '..', 'scripts');

const grades = [];
const grade = (name, pass, detail = '') => {
  grades.push({ name, pass });
  console.log(`GRADE ${name}: ${pass}${detail ? `  — ${detail}` : ''}`);
};

/** All `probe-`-initial tokens in a source, by one scan. */
const TOKEN = /probe-[A-Za-z0-9._-]+/g;
const tokensOf = (src) => new Set(src.match(TOKEN) ?? []);

// ── Known positive / known negative on the tokeniser, from a real neighbourhood (341) ───────────
const KP_SRC = [
  "const R225 = 'probe-round225-a-citation-is-not-a-call.mts';",
  "  copyFileSync(join(HERE, R374), join(SANDBOX, 'probe-round374-x.mts'));",
  '// prose naming probe-round232 with no extension at all',
].join('\n');
const kpTokens = tokensOf(KP_SRC);
grade(
  'KP tokeniser keeps a full filename whole inside quotes',
  kpTokens.has('probe-round225-a-citation-is-not-a-call.mts'),
  [...kpTokens].join(' '),
);
grade(
  'KN a bare prefix is NOT reported as the filename it prefixes',
  !kpTokens.has('probe-round232-anything.mts') && kpTokens.has('probe-round232'),
);
const KN_SRC = "const R225 = 'probe-round225-a-citation-is-not-a-cal.mts';"; // tail broken by one char
grade(
  'KN one broken char in the tail → the real filename is not found',
  !tokensOf(KN_SRC).has('probe-round225-a-citation-is-not-a-call.mts'),
);

// ── Populations, selected by startsWith over my own directory read ──────────────────────────────
const all = readdirSync(SCRIPTS);
const widePop = all.filter((f) => f.startsWith('probe-'));
const narrowPop = all.filter((f) => f.startsWith('probe-round'));
grade('wide ⊇ narrow as selected (both read independently)', narrowPop.every((f) => widePop.includes(f)));

// ── The swept list: the registry IS the subject here, so it is imported, not re-derived ─────────
const { SWEPT } = await import(join(SCRIPTS, 'sweep-probes.mjs'));
grade('SWEPT imported as an array', Array.isArray(SWEPT), `${SWEPT.length} entries`);

const wideSet = new Set(widePop);
const narrowSet = new Set(narrowPop);
const namesAnother = (pop) =>
  SWEPT.filter((e) => {
    const toks = tokensOf(readFileSync(join(SCRIPTS, e.file), 'utf8'));
    for (const t of toks) if (t !== e.file && pop.has(t)) return true;
    return false;
  }).map((e) => e.file);

const wideMembers = namesAnother(wideSet);
const narrowMembers = namesAnother(narrowSet);
const onlyWide = wideMembers.filter((f) => !narrowMembers.includes(f));
const onlyNarrow = narrowMembers.filter((f) => !wideMembers.includes(f));

console.log('');
console.log('── my key ──────────────────────────────────────────────────────────');
console.log(`narrow leg : ${narrowMembers.length} of ${SWEPT.length} swept, over ${narrowPop.length} files`);
console.log(`wide leg   : ${wideMembers.length} of ${SWEPT.length} swept, over ${widePop.length} files`);
console.log(`only wide  : ${onlyWide.length}  ${onlyWide.map((f) => f.split('-').slice(0, 2).join('-')).join(' ')}`);
console.log(`only narrow: ${onlyNarrow.length}  ${onlyNarrow.join(' ')}`);
console.log('');

// ── Against his published figures ───────────────────────────────────────────────────────────────
const PUBLISHED = { narrow: 17, narrowPop: 122, wide: 20, widePop: 153, onlyWide: 3, onlyNarrow: 0 };
grade('his 122-file narrow population reproduces', narrowPop.length === PUBLISHED.narrowPop, `${narrowPop.length}`);
grade('his 153-file census population reproduces', widePop.length === PUBLISHED.widePop, `${widePop.length}`);
grade('his narrow 17 reproduces', narrowMembers.length === PUBLISHED.narrow, `${narrowMembers.length}`);
grade('his census 20 reproduces', wideMembers.length === PUBLISHED.wide, `${wideMembers.length}`);
grade('his +3 reproduces', onlyWide.length === PUBLISHED.onlyWide, `${onlyWide.length}`);
grade('his 0-only-narrower reproduces', onlyNarrow.length === PUBLISHED.onlyNarrow, `${onlyNarrow.length}`);

// Member lists, not counts (340).
const HIS_ONLY_WIDE_PREFIXES = ['probe-round241', 'probe-round232', 'probe-round246'];
const minePrefixes = onlyWide.map((f) => f.split('-').slice(0, 2).join('-')).sort();
grade(
  'his only-wider MEMBER LIST reproduces, not just its size',
  JSON.stringify(minePrefixes) === JSON.stringify([...HIS_ONLY_WIDE_PREFIXES].sort()),
  `mine ${minePrefixes.join(' ')} | his ${[...HIS_ONLY_WIDE_PREFIXES].sort().join(' ')}`,
);

// What each only-wider member actually names that `probe-round*` cannot see — the reason the
// non-emptiness conjunct is not true by construction, stated as data rather than asserted.
console.log('');
console.log('── why each only-wider member is only-wider ─────────────────────────');
for (const f of onlyWide) {
  const toks = tokensOf(readFileSync(join(SCRIPTS, f), 'utf8'));
  const seenOnlyWide = [...toks].filter((t) => t !== f && wideSet.has(t) && !narrowSet.has(t));
  console.log(`${f.split('-').slice(0, 2).join('-')} → names ${seenOnlyWide.join(', ') || '(none)'}`);
}

// 16 + 3, the arithmetic his first spelling published.
console.log('');
console.log(`his broken sentence: 16 + ${onlyWide.length} = ${16 + onlyWide.length}, printed ${wideMembers.length}`);

const bad = grades.filter((g) => g.pass !== true);
console.log('');
console.log(bad.length === 0 ? `ALL ${grades.length} GRADES TRUE` : `GRADES NOT TRUE: ${bad.map((g) => g.name).join(' | ')}`);
process.exit(bad.length === 0 ? 0 : 1);
