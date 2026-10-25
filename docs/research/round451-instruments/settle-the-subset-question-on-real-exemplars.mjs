/**
 * Round 451 — Daedalus's Round 450 §5 routed one open item here: his `W6` answered the
 * reader-coverage question off SYNTHESIZED padded exemplars, got "neither reader is a subset of the
 * other", and said so needs a **real-exemplar key**, which he had not built. This is that key.
 *
 * The question. My Round 448 §4 published "each reader is blind to a spelling the other reads",
 * then I corrected it to "448's coverage is a SUBSET of 446's". His `W6` says the first wording was
 * right and the correction wrong. Two keys, two answers, and he named the difference as the
 * exemplars — so the exemplars are the thing to replace.
 *
 * What is different here. His exemplars were built as `${pad4(tok)} G9  detail` — one synthesized
 * line per declared spelling, with the leg id **fixed at `G9`**. 446's reader is
 * `/^(?: ok |FAIL|REF ) G/`: it requires the id to begin with `G`. Fixing the id at `G9` satisfies
 * that constraint by construction, so his key could not see it. Real recordings name legs `H1`,
 * `W6`, `Q1`, `T3`. So there are TWO axes on which the readers differ — the token spelling his key
 * measured, and an id-prefix constraint it could not — and the realized asymmetry has to be
 * decomposed, not just counted (449 — separate position from property).
 *
 * Non-circularity. The two narrow readers are the SUBJECTS, so neither may select the population.
 * The population is every line of every committed `.out` file at a pinned rev, and each reader
 * simply answers on each line; the `neither` bucket is positively keyed as "both readers returned
 * false", not reached by fall-through (439). Where a decomposition needs a row/not-a-row key, that
 * key is `ROWISH`, declared below over the lib's own `LEGACY_ROW_TOKENS` table, with its own known
 * positive, its own control, and a leg asserting it is a strict SUPERSET of both subjects (411 —
 * a hand-typed reader is not a slice; 415 — a hand-typed KP is not a slice).
 *
 * Provenance of the figures. `recon-the-out-corpus.mjs` in this directory ran FIRST and measured
 * the 2x2 (227/2/46/21427). So T4 below is a re-derivation under a pinned rev and a sum gate, NOT
 * a prediction — dressing an already-measured number as a prediction teaches nothing (424). The
 * two predictions declared below are about things the recon did not measure.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderTail, readCorpusRows, LEGACY_ROW_TOKENS } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const git = (args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

/**
 * The population rev is a LITERAL, not `HEAD` and not `HEAD~1`. Round 450 §7.2 is the reason: a
 * reader pinned to `HEAD~1` goes vacuous on the commit that promotes it. This rev is the tree as it
 * stood before this round wrote anything, so the gated figures are stable across my own commit and
 * the post-commit re-drive can diff them (409 — stamp the rev AND select with `ls-tree`).
 */
const PRE_ROUND_REV = '38bc4927d8076ecde916fc806ad872f97c690ea2';
const SELF_DIR = 'docs/research/round451-instruments/';

// ── The declared row/not-a-row key, and the two subjects ────────────────────────────────────────

// Keyed on the lib's DECLARED token table rather than a character class, longest spelling first so
// `REF` cannot shadow `REFUSED` (331 — a character-class regex fails by returning a smaller
// number). The id is required uppercase-initial and the detail separated by TWO spaces, which is
// the column-aligned historical shape both subjects were written against.
const TOKENS = Object.keys(LEGACY_ROW_TOKENS).sort((a, b) => b.length - a.length);
const ROWISH = new RegExp(`^ ?(${TOKENS.join('|')}) +([A-Z][A-Z0-9]*)  `);

const legs = [];
const preds = [];
const notes = [];
const leg = (id, ok, what) => legs.push({ id, ok, what: String(what).replace(/\s+/g, ' ').trim() });
const pred = (id, landed, what) => preds.push({ id, landed, what: String(what).replace(/\s+/g, ' ').trim() });
const say = (s) => notes.push(s);

/**
 * PREDICTIONS, declared here in source before the run. Neither is answered by the recon.
 *
 * P1 — of the `only448` cell (lines 448 reads and 446 cannot), the **id-prefix** cause accounts for
 *      MORE lines than the token-spelling cause. If it lands, the asymmetry his `W6` attributed to
 *      spelling is on real data mostly the axis his key held constant.
 * P2 — the `RED` spelling has **zero** realized occurrences in the pinned corpus, which would make
 *      448's one spelling advantage over 446 vacuous on real data and the whole `only448` cell the
 *      id axis.
 *
 * These are PREDICTION rows. The legs below gate on their own keys and not on these (386 — gate
 * the figure on the key, not on the prediction).
 */
const P1_TEXT = 'of only448, cause=ID outnumbers cause=TOKEN';
const P2_TEXT = 'the RED spelling has 0 realized occurrences in the pinned corpus';

// ── T1 — the population, pinned, counted, and its self-exclusion READ ───────────────────────────
const outsPinned = git(['ls-tree', '-r', '--name-only', PRE_ROUND_REV])
  .split('\n').filter((n) => n.endsWith('.out'));
const headAll = git(['ls-tree', '-r', '--name-only', 'HEAD'])
  .split('\n').filter((n) => n.endsWith('.out'));
const headExcluded = headAll.filter((n) => n.startsWith(SELF_DIR));
const headKept = headAll.filter((n) => !n.startsWith(SELF_DIR));
const blob = (rev, path) => git(['cat-file', 'blob', `${rev}:${path}`]);
const linesOf = (rev, paths) => paths.flatMap((p) => blob(rev, p).split('\n'));

const POP = linesOf(PRE_ROUND_REV, outsPinned);
{
  // The exclusion COUNT is published, not just the verdict: before promotion this leg is vacuous,
  // and a verdict of `true` would hide that (434 — a self-exclusion leg is vacuous before
  // promotion; read the exclusion count).
  const vacuous = headExcluded.length === 0;
  leg('T1', outsPinned.length > 0 && POP.length > 0,
    `population = ${outsPinned.length} committed .out files / ${POP.length} lines at pinned rev `
    + `${PRE_ROUND_REV.slice(0, 8)} · at HEAD: ${headAll.length} .out, ${headExcluded.length} `
    + `excluded as this round's own, ${headKept.length} kept · self-exclusion leg VACUOUS `
    + `pre-promotion: ${vacuous}`);
  say(`     HEAD = ${git(['rev-parse', 'HEAD']).trim().slice(0, 8)}; gated figures are off the `
    + 'pinned rev, so they do not move when this round commits');
}

// ── T2 — both subjects SLICED from their pinned sources, compiled, and graded ───────────────────
const SUBJECTS = {
  446: { path: 'round446-instruments/grade-my-own-oracle-predicate.mjs', anchor: 'legLines', era: 'round444-instruments/' },
  448: { path: 'round448-instruments/record-cripples.mjs', anchor: 'l.match(', era: 'round447-instruments/' },
};
const sliced = {};
{
  const rows = [];
  for (const [name, s] of Object.entries(SUBJECTS)) {
    const src = readFileSync(join(HERE, '..', s.path), 'utf8');
    // Structural gate on the slice: the anchor must identify EXACTLY ONE regex-bearing line, so
    // "sliced once" is a property of the source and not of where my match happened to stop
    // (448 — `sliced exactly once` does not pin the start anchor).
    const cand = src.split('\n').filter((l) => l.includes(s.anchor) && l.includes('/^(?:'));
    const m = cand.length === 1 ? cand[0].match(/(\/\^\(\?:.*?\/)(?:\.test|\))/) : null;
    let re = null;
    if (m !== null) { try { re = new RegExp(m[1].slice(1, -1)); } catch { re = null; } }
    // Era-selected known positive: a real recording from the era this reader was WRITTEN to read,
    // chosen by directory and not by either reader's answer. If a reader cannot read a single row
    // in its own era's recordings, that is a finding, not an instrument fault.
    const eraFiles = outsPinned.filter((n) => n.includes(s.era));
    const eraLines = linesOf(PRE_ROUND_REV, eraFiles);
    const eraRowish = eraLines.filter((l) => ROWISH.test(l));
    const kpHits = re === null ? null : eraLines.filter((l) => re.test(l)).length;
    sliced[name] = { re, source: m === null ? null : m[1], kpHits, eraFiles: eraFiles.length, eraRowish: eraRowish.length };
    rows.push(`${name}: anchor lines=${cand.length} compiled=${re !== null} era=${s.era} `
      + `(${eraFiles.length} files, ${eraRowish.length} ROWISH lines) reads=${kpHits}`);
  }
  // A real prose control both must refuse. Selected so that its first word is NOT one of the
  // declared tokens — both subjects anchor on a token alternation at the start of the line, so a
  // control chosen only by "ROWISH refuses it" could still be read by a subject.
  const prose = POP.filter((l) => l.length > 80 && !ROWISH.test(l)
    && !TOKENS.includes(l.trim().split(' ')[0]))[0] ?? '';
  const proseRefused = Object.values(sliced).every((s) => s.re !== null && s.re.test(prose) === false);
  const bothCompiled = Object.values(sliced).every((s) => s.re !== null);
  const bothReadOwnEra = Object.values(sliced).every((s) => s.kpHits !== null && s.kpHits > 0);
  // A property pin, not a verbatim source pin (438): each slice must carry the token that is the
  // whole point of the comparison. A re-aimed slice that lost `FAIL` would pass a "compiles" gate.
  const propPin = sliced[446].source !== null && sliced[446].source.includes('FAIL')
    && sliced[448].source !== null && sliced[448].source.includes('RED');
  leg('T2', bothCompiled && bothReadOwnEra && proseRefused && propPin,
    `${rows.join(' | ')} · real prose control refused by both: ${proseRefused} · distinguishing `
    + `token present in each slice: ${propPin}`);
  say(`     slices: 446 ${JSON.stringify(sliced[446].source)} · 448 ${JSON.stringify(sliced[448].source)}`);
}
const re446 = sliced[446].re;
const re448 = sliced[448].re;

// ── T3 — capability, read off the sliced literals rather than off any exemplar ──────────────────
{
  const alts = (s) => {
    const m = s === null ? null : s.match(/\(\?:([^)]*)\)/);
    return m === null ? null : m[1].split('|');
  };
  const a446 = alts(sliced[446].source);
  const a448 = alts(sliced[448].source);
  const only446 = a446 === null || a448 === null ? null : a446.filter((t) => !a448.includes(t));
  const only448 = a446 === null || a448 === null ? null : a448.filter((t) => !a446.includes(t));
  leg('T3', only446 !== null && only446.length > 0 && only448 !== null && only448.length > 0,
    `token sets off the slices: 446=${JSON.stringify(a446)} 448=${JSON.stringify(a448)} · `
    + `446-only=${JSON.stringify(only446)} 448-only=${JSON.stringify(only448)} · INCOMPARABLE by `
    + 'construction, needing no exemplar at all');
}

// ── T4 — the realized 2x2 over every line, with the sum gated ──────────────────────────────────
const cell = { both: [], only446: [], only448: [], neither: 0 };
{
  for (const l of POP) {
    const a = re446 !== null && re446.test(l);
    const b = re448 !== null && re448.test(l);
    if (a && b) cell.both.push(l);
    else if (a) cell.only446.push(l);
    else if (b) cell.only448.push(l);
    else cell.neither += 1;
  }
  const sum = cell.both.length + cell.only446.length + cell.only448.length + cell.neither;
  leg('T4', sum === POP.length && cell.only446.length > 0 && cell.only448.length > 0,
    `both=${cell.both.length} only446=${cell.only446.length} only448=${cell.only448.length} `
    + `neither=${cell.neither} · sum===lines: ${sum === POP.length} (${sum}/${POP.length}) · on REAL `
    + 'exemplars the two readers are INCOMPARABLE, so his W6 conclusion holds and my 448 §4 '
    + 'correction was wrong on both keys');
}

// ── T5 — decompose only448 into its two causes, every line given a cell ────────────────────────
const cause = { ID: [], TOKEN: [], NOT_ROWISH: [] };
{
  for (const l of cell.only448) {
    const m = l.match(ROWISH);
    if (m === null) { cause.NOT_ROWISH.push(l); continue; }
    const id = m[2];
    // The mutation is minimal, applied to the REAL line, and length-preserving: swap the id's first
    // character for `G` so the column alignment and every other byte are untouched. Synthesizing a
    // line here instead is the exact mistake that made his first `W6` publish "0/8" — a reader must
    // be driven against the shape it was written for (415).
    const at = m[0].length - 2 - id.length;
    const mutated = `${l.slice(0, at)}G${l.slice(at + 1)}`;
    // Two-way and exhaustive: if G-prefixing the id is enough for 446 to read the real line, the id
    // prefix was what blocked it; if it still refuses, the token field is what blocks it.
    if (re446.test(mutated)) cause.ID.push(l); else cause.TOKEN.push(l);
  }
  const sum = cause.ID.length + cause.TOKEN.length + cause.NOT_ROWISH.length;
  leg('T5', sum === cell.only448.length && cause.NOT_ROWISH.length === 0,
    `only448 by cause (minimal length-preserving id mutation on the real line): `
    + `ID=${cause.ID.length} TOKEN=${cause.TOKEN.length} NOT_ROWISH=${cause.NOT_ROWISH.length} · `
    + `sum===only448: ${sum === cell.only448.length} (${sum}/${cell.only448.length})`);
  pred('P1', cause.ID.length > cause.TOKEN.length,
    `${P1_TEXT} — ID=${cause.ID.length} vs TOKEN=${cause.TOKEN.length}`);
}

// ── T6 — realized occurrence per declared spelling, with 0-occurrence spellings named ───────────
const occ = {};
{
  for (const t of TOKENS) occ[t] = 0;
  let canonical = 0;
  let rowish = 0;
  for (const l of POP) {
    const m = l.match(ROWISH);
    if (m !== null) { occ[m[1]] += 1; rowish += 1; }
    if (/^(?:LEG|PRED) \S+ \S+/.test(l)) canonical += 1;
  }
  // ROWISH must be a strict SUPERSET of both subjects, or the T5 decomposition is unsound.
  const union = [...cell.both, ...cell.only446, ...cell.only448];
  const missed = union.filter((l) => !ROWISH.test(l));
  // A spelling with no realized occurrence is UNMODELLED on this key, not "0 and therefore fine"
  // (399 — publish UNMODELLED rather than guess).
  const unmodelled = TOKENS.filter((t) => occ[t] === 0);
  leg('T6', missed.length === 0,
    `ROWISH reads ${rowish} lines and is a superset of both subjects' union `
    + `(${union.length} lines, ${missed.length} missed) · per-spelling realized counts `
    + `${JSON.stringify(occ)} · UNMODELLED on real data (0 occurrences): `
    + `${JSON.stringify(unmodelled)} · canonical LEG/PRED rows: ${canonical}`);
  pred('P2', occ.RED === 0, `${P2_TEXT} — realized RED count = ${occ.RED}`);
}

// ── T7 — the id-prefix axis, which his key held constant at G9 ──────────────────────────────────
{
  const ids = [];
  for (const l of POP) {
    const m = l.match(ROWISH);
    if (m !== null) ids.push(m[2]);
  }
  const prefixes = {};
  for (const id of ids) prefixes[id[0]] = (prefixes[id[0]] ?? 0) + 1;
  const nonG = ids.filter((id) => id[0] !== 'G').length;
  leg('T7', nonG > 0,
    `${ids.length} ROWISH rows carry ${Object.keys(prefixes).length} distinct id initials `
    + `${JSON.stringify(prefixes)} · ${nonG} of them are NOT G-prefixed, and 446's reader requires `
    + "` G` · his W6 fixed every exemplar's id at G9, so this axis was invisible to it");
}

// ── T8 — the consumer consequence: a LIVE run with non-G ids scores as a DEAD one ───────────────
{
  // 446's `legLines(pinOut) === 0` is a conjunct of its `pinDied` finding. Count the committed
  // recordings that are demonstrably ALIVE (they publish a verdict line) and on which that same
  // conjunct is nevertheless satisfied, because their legs are not G-prefixed.
  const alive = [];
  for (const p of outsPinned) {
    const text = blob(PRE_ROUND_REV, p);
    const hasVerdict = /^VERDICT/m.test(text);
    const rows = text.split('\n').filter((l) => ROWISH.test(l) || /^(?:LEG|PRED) \S+ \S+/.test(l));
    const read446 = re446 === null ? null : text.split('\n').filter((l) => re446.test(l)).length;
    if (hasVerdict && rows.length > 0 && read446 === 0) alive.push([p, rows.length]);
  }
  leg('T8', alive.length > 0,
    `${alive.length} committed recordings publish a VERDICT line AND >0 rows AND are read by 446 as `
    + `ZERO leg lines · so 446's \`legLines(x) === 0\` conjunct cannot tell a run that DIED from a `
    + `live run whose legs are not G-prefixed · first: ${alive.length === 0 ? 'n/a' : `${alive[0][0]} (${alive[0][1]} rows)`}`);
}

// ── T9 — the new shared reader over-reads real prose ────────────────────────────────────────────
{
  // The gap between the wide shared reader and my strict `ROWISH`, over the real corpus. The first
  // version of this leg called the whole gap an OVER-READ of prose, on the theory that
  // `readCorpusRows`'s legacy branch keys the id as `[A-Za-z0-9_.:-]+` with no uppercase and no
  // two-space requirement. Its own first three examples refuted that: ` ok KP-A mine, unwrapped:`
  // is a REAL row, in a single-space shape with a hyphenated id, which `ROWISH` is too narrow to
  // read. So the gap runs in BOTH directions and a single number cannot be attributed to either —
  // it is decomposed here instead, and the two directions are different defects in different files
  // (451 — a terminal bucket reached by fall-through absorbs every blindness).
  const ROW_ID = /^[A-Za-z][A-Za-z0-9_.:-]*$/;
  const gap = { ROWISH_TOO_NARROW: [], READER_TOO_WIDE: [] };
  let read = null;
  try {
    read = 0;
    for (const l of POP) {
      if (ROWISH.test(l) || /^(?:LEG|PRED) \S+ \S+/.test(l)) continue;
      const r = readCorpusRows(l);
      if (r.rows.length === 0) continue;
      read += 1;
      // An id that is a single id-shaped token with no internal space, on a line whose remainder
      // reads as a detail, is a genuine row in a shape ROWISH misses. An id that is a lowercase
      // English word in running prose is the reader claiming a row that is not one.
      const { id } = r.rows[0];
      const idShaped = ROW_ID.test(id) && /[A-Z0-9]/.test(id);
      (idShaped ? gap.ROWISH_TOO_NARROW : gap.READER_TOO_WIDE).push(l);
    }
  } catch { read = null; }
  const sum = read === null ? null : gap.ROWISH_TOO_NARROW.length + gap.READER_TOO_WIDE.length;
  const ex = (a) => (a.length === 0 ? 'none' : JSON.stringify(a[0].slice(0, 68)));
  leg('T9', read !== null && sum === read,
    `readCorpusRows reads ${read} corpus lines ROWISH refuses that are not canonical rows, and the `
    + `gap runs BOTH ways: ROWISH_TOO_NARROW=${gap.ROWISH_TOO_NARROW.length} (genuine rows in a `
    + `single-space or hyphenated-id shape, e.g. ${ex(gap.ROWISH_TOO_NARROW)}) · `
    + `READER_TOO_WIDE=${gap.READER_TOO_WIDE.length} (prose claimed as a row, e.g. `
    + `${ex(gap.READER_TOO_WIDE)}) · sum===read: ${sum === read}`);
  say(`     so T7's 161 non-G rows is a FLOOR, not a total: ROWISH is measurably narrower than the `
    + `row population by at least ${gap.ROWISH_TOO_NARROW.length} lines, and every one of those is `
    + 'a row 446 cannot read either (437 — a refusing signal only raises a floor; say which end it '
    + 'can move)');
}

// ── publish ─────────────────────────────────────────────────────────────────────────────────────
console.log(renderTail({ legs, preds }));
for (const n of notes) console.log(n);
