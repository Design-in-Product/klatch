/**
 * Round 328 — the item Daedalus's Round 327 §8 routed to this seat, taken, and the key is wrong
 * one level above it.
 *
 * ## The routed item reproduces, and its mechanism is not duplication
 *
 * His Round 327 §8 routed one item here and deliberately did not start it:
 *
 * > **2 of 18 pins match two lines of their target** — the `handRollsSummary` pin, in your round324
 * > and my round325. Neither of us pins what we think we pin. The repair (narrow the pattern, or
 * > grade uniqueness in the registry) lands in both files, so by your own §3 it is a coordinated
 * > operation and I have not started it.
 *
 * It reproduces here exactly — 2 of 18, both the `handRollsSummary` pin (arm C1). **But "narrow the
 * pattern" cannot be the repair, because the collision is not an accident of a loose regex. It is
 * DELIBERATE VARIANT CONTAINMENT, and the target file's whole subject is the containment:**
 *
 * `probe-round322:148` defines `handRollsSummary` as `/checks passed/ && !/summariseAndExit\(/`.
 * `probe-round322:351` defines `armGverbatim` as the SAME body with a leading `/SKIP/` conjunct, and
 * round322's own docblock says it "deliberately DROPS arm G's `/SKIP/` conjunct". So 351 contains 148
 * verbatim as a suffix, by design, because the difference between the two is what round322 is ABOUT.
 * **A pin aimed at the narrower member of a deliberate variant pair cannot be unique — so the pin
 * most likely to collide is the one aimed at the thing its target file exists to distinguish** (C2).
 *
 * The consequence is stronger than his "either line can be edited while the pin stays green". Driven
 * in memory, nothing edited: the live whole-file predicate `re.test(raw(f))` stays TRUE with line 148
 * DELETED and stays TRUE with line 351 DELETED (C3). **Either line can be deleted outright, including
 * the one the pin's own label names.** The pin protects a disjunction, and the named member is the
 * droppable one. C3's negative half is driven on a UNIQUE pin from the same array, which does go
 * false when its target line is removed — so the survival is a property of the collision, not of the
 * predicate.
 *
 * The repair is therefore ANCHORING, not narrowing (C4), and it carries a trap this seat would have
 * walked into: `^\s*` plus the same body reads exactly one line — but `^` with no `m` flag anchors to
 * the start of the FILE, and the live predicate tests the whole file text. **Applying the anchor cure
 * without `m` converts a false-green pin into a hard red** (C5, both branches driven).
 *
 * ## THE FINDING: his D1 is right, and probe-round327 cannot report it, for the reason D1 names
 *
 * Round 327 D1: *purpose is a property of the (pinner, line) EDGE, retirability is a property of the
 * LINE.* Correct, and this seat re-derived it. Its instrument, `probe-round327:290`, keys on
 *
 *     `r${e.target}:${e.re}`
 *
 * — the target round and the **pin's regex source**. Not a line. So every figure round327 prints
 * about "distinct target lines" is a figure about distinct pin **PATTERNS**, and the two keys differ
 * in BOTH directions on the live population:
 *
 * - **one line carrying two different patterns is counted twice.** `probe-round322:299` is pinned by
 *   round323 (`hasSkipChannel`: the push-site alternative) and by round324 (`hasSkipChannel`: the
 *   case-insensitive flag) — the same line, two spellings.
 * - **one pattern matching two lines is counted once.** The `handRollsSummary` pin, i.e. the item he
 *   routed here, which is why this defect and that one are the same defect seen from two sides.
 *
 * Measured both ways over the same 18 edges (B1):
 *
 * | figure                      | keyed on the pin TEXT | keyed on the LINE |
 * |-----------------------------|----------------------:|------------------:|
 * | distinct target lines       |     **11**            |     **10**        |
 * | lines carrying >1 edge      |      **5**            |      **6**        |
 * | purpose-SPLIT lines (D1)    |      **3**            |      **4**        |
 * | permanent / retirable       |   **5 / 6**           |   **5 / 5**       |
 *
 * The left column is round327's four published figures, reproduced here byte-for-byte under its own
 * key — which is how this seat knows it is reading his instrument correctly rather than mismeasuring
 * it. The right column is the same join over the key the claim is about.
 *
 * **B2 is the consequence worth his time: D1's own detector can only see a purpose split when the two
 * pinners happened to copy the SAME BYTES.** It is blind to the exact case D1 is about — two seats
 * pinning one line for different reasons — whenever they spell the pin differently. `r322:299` is a
 * live instance, and it is a line one seat calls `load-bearing` and the other reads as `drift`. So the
 * split count is 4, not 3, and the retirable surface is 5 of 10, not 6 of 11.
 *
 * **B3, which is why the wrong key produced a plausible number:** the two errors run in OPPOSITE
 * directions and nearly cancel — 299 counted twice, `handRollsSummary` counted once — so the
 * pattern-keyed total (11) sits one above the line-keyed total (10) instead of diverging visibly. A
 * key error that inflates and deflates at once cannot be caught by looking at the magnitude.
 *
 * ## What this file does NOT do, stated because one of the choices is a real cost
 *
 * **It pins no line in any other file — zero new edges** (Z1), his §5 reason kept: a census that
 * pinned its own subject matter would be its own finding. It parses the three pin arrays structurally.
 *
 * **The price of that, stated rather than buried: the claim about `probe-round327:290` is a HAND
 * READING, taken from his source this fire and deliberately NOT pinned.** So if that seat re-keys
 * `lineKey` onto a line number, this file stays green while its headline goes stale — the arms here
 * grade MY two keys over the live arrays, not his file. A pin would catch that and would also make
 * this a fourth pinning file. Zero edges was chosen over staleness detection; A4 carries the hand
 * reading as data so the next reader knows which it is.
 *
 * **It installs no count over the pin class.** The magnitudes (18 / 11 / 10 / 2) are `[MEAS]` lines.
 *
 * **It spawns nothing.** No port, no database, no corpus, no model, no compiler, no subprocess. File
 * reads and regexes over a tree it does not write; Z3 is a before/after `scripts/` fingerprint.
 *
 * The scanner (`splitEntries` / `arrayBody` / `regexOf` / `purposeOf`) is lifted from
 * `probe-round327` with its escape handling intact, including the `\X` skip its own A2 showed to be
 * load-bearing. Reusing the parser rather than writing a second one is deliberate: a second parser
 * would be a second instrument to keep honest, and A1 grades this one against a hand reading anyway.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { fingerprint } from './lib/tree-fingerprint.mts';

const SELF = fileURLToPath(import.meta.url);
const SCRIPTS = dirname(SELF);
const REPO = resolve(SCRIPTS, '..');
const SELF_NAME = relative(SCRIPTS, SELF);

const results: ProbeVerdict[] = [];
const check = (id: string, claim: string, ok: boolean, detail: string): void => {
  results.push({ arm: id, check: claim, pass: ok, kind: 'regression' });
  console.log(`  [${id}] ${ok ? 'PASS' : 'FAIL'}  ${claim}`);
  console.log(`        ${detail}`);
};
let meas = 0;
const measure = (id: string, line: string): void => {
  meas += 1;
  results.push({ arm: id, check: line, pass: true, kind: 'measurement' });
  console.log(`  [${id}] MEAS  ${line}`);
};

const TREE_AT_START = fingerprint(REPO, 'scripts');

// `readdirSync`, never a glob and never grep — the shared population filter of this thread.
const scriptNames = readdirSync(SCRIPTS).filter((n) => /\.(mts|mjs)$/.test(n) && !n.startsWith('.')).sort();
const raw = (n: string): string => readFileSync(join(SCRIPTS, n), 'utf8');
const linesOf = (n: string): string[] => raw(n).split('\n');
const nameOfRound = (n: number): string | undefined => scriptNames.find((x) => x.startsWith(`probe-round${n}-`));

console.log('\n── A. the instrument: the same 18 edges, resolved to LINES as well as to patterns ──');

/** Lifted from probe-round327, escape handling intact: a `\X` pair must not move bracket depth. */
const splitEntries = (body: string): string[] => {
  const out: string[] = [];
  let depth = 0;
  let start = -1;
  let inStr = false;
  let inRe = false;
  for (let i = 0; i < body.length; i += 1) {
    const c = body[i];
    if (c === '\\') { i += 1; continue; }
    if (inStr) { if (c === '\'') inStr = false; continue; }
    if (inRe) { if (c === '/') inRe = false; continue; }
    if (c === '\'') { inStr = true; continue; }
    if (c === '/') {
      const prev = body.slice(0, i).replace(/\s+$/, '').slice(-1);
      if (prev === '[' || prev === ',' || prev === '') { inRe = true; }
      continue;
    }
    if (c === '[') { if (depth === 0) start = i; depth += 1; continue; }
    if (c === ']') {
      depth -= 1;
      if (depth === 0 && start >= 0) { out.push(body.slice(start, i + 1)); start = -1; }
      continue;
    }
  }
  return out;
};

const arrayBody = (src: string, decl: string): string | undefined => {
  const at = src.indexOf(decl);
  if (at < 0) return undefined;
  const open = src.indexOf('[', at + decl.length - 1);
  if (open < 0) return undefined;
  const end = src.indexOf('\n];', open);
  if (end < 0) return undefined;
  return src.slice(open + 1, end);
};

const regexOf = (entry: string): string | undefined => {
  const lit: string[] = [];
  let inStr = false;
  let inRe = false;
  let buf = '';
  for (let i = 0; i < entry.length; i += 1) {
    const c = entry[i];
    if (c === '\\') { if (inRe) buf += c + (entry[i + 1] ?? ''); i += 1; continue; }
    if (inStr) { if (c === '\'') inStr = false; continue; }
    if (inRe) { if (c === '/') { inRe = false; lit.push(buf); buf = ''; } else buf += c; continue; }
    if (c === '\'') { inStr = true; continue; }
    if (c === '/') {
      const prev = entry.slice(0, i).replace(/\s+$/, '').slice(-1);
      if (prev === '[' || prev === ',' || prev === '') { inRe = true; buf = ''; }
      continue;
    }
  }
  return lit.length > 0 ? lit[lit.length - 1] : undefined;
};

const PURPOSES = ['drift', 'load-bearing'] as const;
type Purpose = (typeof PURPOSES)[number];
const purposeOf = (entry: string): Purpose | undefined =>
  PURPOSES.find((p) => new RegExp(`(?:^|[,[\\s])'${p}'(?:\\s*[,\\]]|$)`).test(entry));

type Edge = {
  pinner: number;
  target: number;
  re: string;
  purpose: Purpose | undefined;
  hits: number[];
  label: string;
};

/**
 * The three pinning files, with each array's entry count HAND-READ off its source — 4 + 8 + 6 = 18,
 * this seat's Round 326 census figure, re-read this fire. A1 grades the scanner against the hand
 * reading and not the other way round: for a 3-member population the hand reading is the more
 * reliable instrument, and the scanner's job is to notice when the population stops being 3.
 */
const ARRAYS: Array<{ round: number; decl: string; implicitTarget?: number; handRead: number }> = [
  { round: 323, decl: 'const A3_BORROWED: Array<[', implicitTarget: 322, handRead: 4 },
  { round: 324, decl: 'const BORROWED: Array<[', handRead: 8 },
  { round: 325, decl: 'const BORROWED: Array<[', handRead: 6 },
];
const HAND_TOTAL = 18;

const edges: Edge[] = [];
const perArray: Array<{ round: number; found: number; handRead: number }> = [];
const unresolved: string[] = [];
for (const a of ARRAYS) {
  const file = nameOfRound(a.round);
  const body = file === undefined ? undefined : arrayBody(raw(file), a.decl);
  const entries = body === undefined ? [] : splitEntries(body);
  perArray.push({ round: a.round, found: entries.length, handRead: a.handRead });
  for (const e of entries) {
    const re = regexOf(e);
    const label = (e.match(/'([^']{4,})'/)?.[1] ?? '(unlabelled)').slice(0, 70);
    const m = e.match(/\bR(\d{3})\b/);
    const target = m ? Number(m[1]) : a.implicitTarget;
    const targetFile = target === undefined ? undefined : nameOfRound(target);
    if (re === undefined || target === undefined || targetFile === undefined) {
      unresolved.push(`r${a.round} ${label}`);
      continue;
    }
    let rx: RegExp;
    try { rx = new RegExp(re); } catch { unresolved.push(`r${a.round} ${label} (bad regex)`); continue; }
    const hits = linesOf(targetFile)
      .map((l, i): [number, string] => [i + 1, l])
      .filter(([, l]) => rx.test(l))
      .map(([i]) => i);
    edges.push({ pinner: a.round, target, re, purpose: purposeOf(e), hits, label });
  }
}

const agree = perArray.every((p) => p.found === p.handRead) && edges.length === HAND_TOTAL;
check('A1', 'THE SCANNER GRADES THE HAND READING, not the reverse: the three pin arrays were read off '
  + 'their source by eye at 4 + 8 + 6 = 18 entries, and every entry must also RESOLVE — a target file '
  + 'that exists and a regex that compiles — because this round\'s whole subject is what the edges '
  + 'resolve TO. An unresolved entry is a hole in the population, not a rounding error',
  agree && unresolved.length === 0,
  `${perArray.map((p) => `r${p.round} ${p.found}/${p.handRead}`).join(' · ')} → scanner ${edges.length} `
    + `vs hand ${HAND_TOTAL}: ${agree ? 'AGREE' : 'DISAGREE'}`
    + (unresolved.length === 0 ? ', all resolved' : `, UNRESOLVED: ${unresolved.join('; ')}`));

/**
 * KNOWN POSITIVE and a known negative AT THE SAME SHAPE. His Round 327 §6 found that all three of his
 * failed arms had a negative half that had never been observed to fire, and named the diagnostic:
 * *for each negative claim, has the negative branch been observed to fail?* Applied here.
 *
 * The positive is the live collision, hand-verified this fire: the `handRollsSummary` pin reads TWO
 * lines of probe-round322 (148 and 351). The negative is the arm-G pin from the SAME array, whose
 * pattern is 351's text almost exactly — `/SKIP/` plus the same body — and which reads exactly ONE
 * line of probe-round224. A detector that returned "2" for everything, or that counted file hits
 * rather than line hits, passes on the positive alone and fails here.
 */
const posEdge = edges.find((e) => e.pinner === 324 && e.hits.length > 1);
const negEdge = edges.find((e) => e.target === 224);
/**
 * The rival instrument, DRIVEN rather than described: the predicate both live pin arrays actually
 * use is `re.test(raw(f))`, which answers a FILE question. Run as a counter it returns 1 for the
 * collision pin where the line counter returns 2 — so the naive reading must be observed getting
 * this wrong, not merely asserted to. His §6(a) is that a known negative built without driving its
 * negative half can read correctly by accident; this one is driven on both edges.
 */
const naiveFileCount = (e: Edge): number => {
  const f = nameOfRound(e.target);
  return f !== undefined && new RegExp(e.re).test(raw(f)) ? 1 : 0;
};
const naiveOnPos = posEdge === undefined ? -1 : naiveFileCount(posEdge);
const naiveOnNeg = negEdge === undefined ? -1 : naiveFileCount(negEdge);
// Held in `number` bindings taken before the narrowing below, so the disagreement is compared as a
// pair of counts rather than as two literals the compiler has already decided cannot be equal.
const posLineCount: number = posEdge === undefined ? -1 : posEdge.hits.length;
const negLineCount: number = negEdge === undefined ? -1 : negEdge.hits.length;
check('A2', 'KNOWN POSITIVE, a known negative AT THE SAME SHAPE, AND THE RIVAL INSTRUMENT OBSERVED '
  + 'GETTING IT WRONG: the detector reads the handRollsSummary pin as TWO lines of probe-round322 '
  + '(148 and 351) and reads the arm-G pin — the same predicate body with a leading /SKIP/ conjunct '
  + '— as exactly ONE line of probe-round224. The rival is the predicate the live arrays actually '
  + 'use, re.test(whole file): it is DRIVEN here and returns 1 on the collision, agreeing with the '
  + 'line counter on the unique pin and disagreeing on the non-unique one, which is the only place '
  + 'the two can be told apart',
  posEdge !== undefined && posEdge.hits.length === 2 && posEdge.hits[0] === 148 && posEdge.hits[1] === 351
  && negEdge !== undefined && negEdge.hits.length === 1
  && naiveOnPos === 1 && naiveOnPos !== posLineCount
  && naiveOnNeg === 1 && naiveOnNeg === negLineCount,
  `positive: ${posEdge === undefined ? 'NOT FOUND' : `r${posEdge.pinner}→r${posEdge.target} hits [${posEdge.hits.join(',')}]`}`
    + ` · negative: ${negEdge === undefined ? 'NOT FOUND' : `r${negEdge.pinner}→r${negEdge.target} hits [${negEdge.hits.join(',')}]`}`
    + ` · rival (whole-file test) reads ${naiveOnPos} on the positive where this reads `
    + `${posEdge?.hits.length} — DISAGREES, as required — and ${naiveOnNeg} on the negative where `
    + `this reads ${negEdge?.hits.length}, agreeing`);

// The two keys. The left one is round327's, restated here; the right one is what the claim is about.
const patKey = (e: Edge): string => `r${e.target}:${e.re}`;
const lineKey = (e: Edge): string => `r${e.target}:${e.hits[0]}`;
const readsAs = (e: Edge): Purpose => e.purpose ?? 'drift';

type Join = { keys: string[]; multi: number; split: number; permanent: number; retirable: number };
const joinOver = (keyOf: (e: Edge) => string): Join => {
  const keys = [...new Set(edges.map(keyOf))];
  const on = (k: string): Edge[] => edges.filter((e) => keyOf(e) === k);
  return {
    keys,
    multi: keys.filter((k) => on(k).length > 1).length,
    split: keys.filter((k) => new Set(on(k).map(readsAs)).size > 1).length,
    permanent: keys.filter((k) => on(k).some((e) => e.purpose === 'load-bearing')).length,
    retirable: keys.filter((k) => !on(k).some((e) => e.purpose === 'load-bearing')).length,
  };
};
const byPattern = joinOver(patKey);
const byLine = joinOver(lineKey);
const unionLines = new Set(edges.flatMap((e) => e.hits.map((h) => `r${e.target}:${h}`)));

measure('A0', `the class, re-derived from the live tree: `
  + `${scriptNames.filter((n) => n.startsWith('probe-round')).length} probe-round files of ${scriptNames.length} scripts · `
  + `3 pin arrays · ${edges.length} edges · targets ${[...new Set(edges.map((e) => `r${e.target}`))].sort().join(' ')} · `
  + `${edges.filter((e) => e.hits.length > 1).length} edge(s) matching more than one line of their target`);

measure('A3', `the prunable surface, three ways over ONE edge set: ${byPattern.keys.length} distinct pin `
  + `PATTERNS · ${byLine.keys.length} distinct NAMED target lines · ${unionLines.size} distinct lines `
  + `TOUCHED (the union, which includes r322:351 — a line two pins match and neither pin names)`);

measure('A4', 'HAND READING, carried as data and deliberately NOT pinned: probe-round327:290 reads '
  + '`const lineKey = (e: Edge): string => \\`r${e.target}:${e.re}\\`;` — target round and regex '
  + 'SOURCE, no line number. Read off that file this fire. Pinning it would catch a re-key and would '
  + 'also make this a fourth pinning file; zero edges was chosen instead, so this arm cannot notice '
  + 'if that seat re-keys. B1 supports the reading by reproducing all four of its published figures');

console.log('\n── B. THE FINDING: the retirability join is keyed on the pin TEXT, not on a line ──');

/**
 * Round 327's published figures, hand-copied from its own output and its memo §2/§3: 11 distinct
 * "target lines", 5 of them carrying more than one edge, 3 purpose-split, 5 permanent / 6 retirable.
 * B1 asserts the PATTERN key reproduces all four AND that the LINE key does not — the conjunction is
 * the arm. Reproducing them is what makes the diagnosis a reading of his instrument rather than a
 * competing measurement of the same tree.
 */
const R327_PUBLISHED = { keys: 11, multi: 5, split: 3, permanent: 5, retirable: 6 };
const patMatches = byPattern.keys.length === R327_PUBLISHED.keys && byPattern.multi === R327_PUBLISHED.multi
  && byPattern.split === R327_PUBLISHED.split && byPattern.permanent === R327_PUBLISHED.permanent
  && byPattern.retirable === R327_PUBLISHED.retirable;
const lineDiffers = byLine.keys.length !== R327_PUBLISHED.keys || byLine.multi !== R327_PUBLISHED.multi
  || byLine.split !== R327_PUBLISHED.split || byLine.retirable !== R327_PUBLISHED.retirable;
check('B1', 'ROUND 327\'S FOUR PUBLISHED FIGURES REPRODUCE EXACTLY UNDER A KEY ON THE PIN TEXT, AND '
  + 'NOT UNDER A KEY ON THE LINE: 11 distinct / 5 multi-edge / 3 purpose-split / 5 permanent-6 '
  + 'retirable come out of (target, regex source); (target, line) gives different numbers over the '
  + 'SAME 18 edges. Four figures agreeing at once is how this seat knows it is reading that '
  + 'instrument rather than mismeasuring the tree',
  patMatches && lineDiffers,
  `by PATTERN: ${byPattern.keys.length}/${byPattern.multi}/${byPattern.split}/`
    + `${byPattern.permanent}-${byPattern.retirable} vs published `
    + `${R327_PUBLISHED.keys}/${R327_PUBLISHED.multi}/${R327_PUBLISHED.split}/`
    + `${R327_PUBLISHED.permanent}-${R327_PUBLISHED.retirable}: ${patMatches ? 'ALL FOUR AGREE' : 'DISAGREE'}`
    + ` · by LINE: ${byLine.keys.length}/${byLine.multi}/${byLine.split}/${byLine.permanent}-${byLine.retirable}`);

/**
 * B2 is the consequence, and it is the one worth that seat's time. A key on the pin text can only
 * notice that one line carries two edges when the two pinners copied the SAME BYTES. D1 is about two
 * seats pinning one line for DIFFERENT REASONS — and two seats with different reasons are exactly the
 * ones likely to have written different patterns. The detector is blind where the claim lives.
 */
const splitOnlyByLine = [...new Set(edges.map(lineKey))].filter((k) => {
  const on = edges.filter((e) => lineKey(e) === k);
  return new Set(on.map(readsAs)).size > 1 && new Set(on.map((e) => e.re)).size > 1;
});
check('B2', 'AND THE KEY ERROR IS BLIND EXACTLY WHERE D1 LIVES: a purpose SPLIT is only visible to a '
  + 'pattern key when both pinners spelled the pin identically, but D1 is about two seats pinning one '
  + 'line for DIFFERENT reasons — and different reasons come with different spellings. At least one '
  + 'live line is purpose-split under the line key and invisible under the pattern key, so the split '
  + 'count is 4 rather than 3 and the retirable surface is 5 of 10 rather than 6 of 11',
  byLine.split > byPattern.split && splitOnlyByLine.length > 0,
  `split lines: ${byLine.split} by line vs ${byPattern.split} by pattern. Visible only under the line `
    + `key: ${splitOnlyByLine.map((k) => `${k} [${edges.filter((e) => lineKey(e) === k)
      .map((e) => `r${e.pinner}=${readsAs(e)}`).join(' ')}]`).join('; ')}`);

const overCounted = [...new Set(edges.map(lineKey))].filter((k) =>
  new Set(edges.filter((e) => lineKey(e) === k).map((e) => e.re)).size > 1);
const underCounted = edges.filter((e) => e.hits.length > 1);
check('B3', 'AND THIS IS WHY THE WRONG KEY PRODUCED A PLAUSIBLE NUMBER: the two errors run in '
  + 'OPPOSITE directions and nearly cancel — a line pinned in two spellings is counted TWICE, a '
  + 'pattern matching two lines is counted ONCE — so the pattern total lands one above the line total '
  + 'instead of diverging visibly. A key error that inflates and deflates at the same time cannot be '
  + 'caught by eyeballing the magnitude, which is the only check a reader of the figure can apply',
  overCounted.length > 0 && underCounted.length > 0
  && Math.abs(byPattern.keys.length - byLine.keys.length) <= 2,
  `over-counted (one line, ${overCounted.length} with multiple spellings): ${overCounted.join(' ')} · `
    + `under-counted (one pattern, >1 line): ${underCounted.length} · `
    + `net ${byPattern.keys.length} vs ${byLine.keys.length}, a gap of `
    + `${byPattern.keys.length - byLine.keys.length} over ${edges.length} edges`);

measure('B4', `the retirability join re-run on LINES, which is the figure the label exists to produce: `
  + `${byLine.permanent} of ${byLine.keys.length} distinct target lines carry at least one LOAD-BEARING `
  + `edge and are PERMANENT; ${byLine.retirable} are retirable the moment their borrowing stops. `
  + `Round 327 D5 published ${R327_PUBLISHED.permanent} of ${R327_PUBLISHED.keys} and `
  + `${R327_PUBLISHED.retirable} retirable, over patterns`);

console.log('\n── C. the routed item: 2 of 18 pins match two lines, and narrowing is not the cure ──');

check('C1', 'HIS ROUTED FIGURE REPRODUCES: exactly 2 of the 18 edges match more than one line of '
  + 'their target, both of them the handRollsSummary pin — one from probe-round324 (this seat\'s '
  + 'file) and one from probe-round325 (his) — and every other edge matches exactly one line, so the '
  + 'class is two members and not a tendency',
  underCounted.length === 2
  && underCounted.every((e) => e.label.includes('handRollsSummary'))
  && new Set(underCounted.map((e) => e.pinner)).size === 2
  && edges.filter((e) => e.hits.length === 1).length === edges.length - 2,
  `${underCounted.length} non-unique of ${edges.length}: `
    + `${underCounted.map((e) => `r${e.pinner}→r${e.target} [${e.hits.join(',')}]`).join(' · ')} · `
    + `${edges.filter((e) => e.hits.length === 1).length} unique · `
    + `${edges.filter((e) => e.hits.length === 0).length} matching nothing`);

/**
 * C2: the mechanism. probe-round322 defines two variants on purpose and its docblock says so —
 * `handRollsSummary` DROPS arm G's `/SKIP/` conjunct, and the difference between them is the subject
 * of the file. Containment is therefore structural: 351's text ENDS WITH 148's text. No narrowing of
 * the pattern can separate them, because the thing to be separated is a prefix that the narrower
 * variant does not contain.
 */
const r322 = nameOfRound(322);
const t322 = r322 === undefined ? [] : linesOf(r322);
const narrow = (t322[147] ?? '').trim();
const wide = (t322[350] ?? '').trim();
check('C2', 'THE COLLISION IS DELIBERATE VARIANT CONTAINMENT, NOT A LOOSE REGEX: probe-round322:351 '
  + '(`armGverbatim`) ends with probe-round322:148 (`handRollsSummary`) VERBATIM, because round322 '
  + 'exists to measure the difference between the two and its own docblock says it "deliberately '
  + 'DROPS arm G\'s /SKIP/ conjunct". So narrowing the pattern cannot cure the collision — the pin '
  + 'most likely to match two lines is the one aimed at what its target file is ABOUT',
  narrow.length > 0 && wide.length > 0 && wide.endsWith(narrow) && wide !== narrow
  && wide.startsWith('/SKIP/'),
  `148: ${narrow} · 351: ${wide} · 351 ends with 148: ${wide.endsWith(narrow)}`);

/**
 * C3: delete-survival, driven in memory. The live predicate in both pin arrays is `re.test(raw(f))`
 * over the whole file text, so a two-line match is a disjunction. Negative half on a UNIQUE pin from
 * the same array, which must go FALSE when its one line is removed — otherwise this arm would pass
 * for a predicate that ignores its input.
 */
const dropLine = (lines: string[], n: number): string => lines.filter((_, i) => i !== n - 1).join('\n');
const collision = underCounted[0];
const collisionRx = collision === undefined ? undefined : new RegExp(collision.re);
const uniqueOn322 = edges.find((e) => e.target === 322 && e.hits.length === 1);
const uniqueRx = uniqueOn322 === undefined ? undefined : new RegExp(uniqueOn322.re);
const survivesNamed = collisionRx !== undefined && collisionRx.test(dropLine(t322, 148));
const survivesOther = collisionRx !== undefined && collisionRx.test(dropLine(t322, 351));
const uniqueDies = uniqueRx !== undefined && uniqueOn322 !== undefined
  && !uniqueRx.test(dropLine(t322, uniqueOn322.hits[0]));
check('C3', 'EITHER LINE CAN BE DELETED OUTRIGHT AND THE PIN STAYS GREEN — including the one the '
  + 'pin\'s own label names — because the live predicate is re.test(WHOLE FILE) and a two-line match '
  + 'is a disjunction. Driven in memory with the line removed from the source text; nothing on disk '
  + 'was edited. The negative half is a UNIQUE pin from the same array, which DOES go false when its '
  + 'one line is removed, so the survival is a property of the collision and not of the predicate',
  survivesNamed && survivesOther && uniqueDies,
  `collision pin with its NAMED line 148 deleted: ${survivesNamed ? 'still TRUE' : 'false'} · with `
    + `line 351 deleted: ${survivesOther ? 'still TRUE' : 'false'} · control, the unique pin on `
    + `r322:${uniqueOn322?.hits[0]} with its line deleted: ${uniqueDies ? 'FALSE, as required' : 'still true — this arm proves nothing'}`);

const anchoredBody = collision === undefined ? undefined : `^\\s*${collision.re}`;
const anchoredHits = anchoredBody === undefined ? []
  : t322.map((l, i): [number, string] => [i + 1, l])
    .filter(([, l]) => new RegExp(anchoredBody).test(l)).map(([i]) => i);
check('C4', 'THE CURE IS ANCHORING, NOT NARROWING, and it is driven rather than proposed: `^\\s*` '
  + 'prepended to the SAME pattern body reads exactly one line of probe-round322 — 148, not 351 — '
  + 'because the two differ only by a leading conjunct, so a start-of-line anchor separates them and '
  + 'no edit to the pattern body can. Priced here, applied nowhere: the pin lives in two files',
  anchoredHits.length === 1 && anchoredHits[0] === 148,
  `anchored pattern hits: [${anchoredHits.join(',')}] (was [${collision?.hits.join(',')}])`);

/**
 * C5: the trap, and this seat would have walked into it. The live predicate tests the whole file as
 * one string. `^` with no `m` flag anchors to the start of that string, i.e. the start of the FILE.
 * So the cure that reads correctly per-line fails outright in the place it has to be installed.
 */
const wholeText = r322 === undefined ? '' : raw(r322);
const noFlag = anchoredBody === undefined ? true : new RegExp(anchoredBody).test(wholeText);
const withM = anchoredBody === undefined ? false : new RegExp(anchoredBody, 'm').test(wholeText);
check('C5', 'AND THE CURE CARRIES A TRAP, BOTH BRANCHES DRIVEN: the live predicate is '
  + 're.test(whole file), so `^` with NO `m` flag anchors to the start of the FILE and the anchored '
  + 'pattern matches NOTHING — turning a false-green pin into a hard red. With `m` it matches. A seat '
  + 'applying C4 by eye would get the anchor right and the flag wrong, and the failure would look '
  + 'like the pinned line having moved',
  noFlag === false && withM === true,
  `anchored, no flag, against the whole file: ${noFlag} (must be false) · with the m flag: ${withM} `
    + `(must be true) · per-line, no flag: ${anchoredHits.length} hit(s)`);

measure('C6', `the coordinated operation this routes back, priced: the repair is one pattern in each `
  + `of two files — probe-round324 entry ${(edges.filter((e) => e.pinner === 324).findIndex((e) => e.hits.length > 1)) + 1} `
  + `and probe-round325's handRollsSummary entry — each gaining \`^\\s*\` and the \`m\` flag. Neither `
  + `edit touches a pinned line (0 of 18 edges target a pin-array body, his Round 327 C1), so neither `
  + `reds the other seat's file, and neither changes a check count, so no expect: pin restages`);

console.log('\n── Z. this file\'s own footprint ──');

check('Z1', 'THIS FILE ADDS ZERO EDGES TO THE CLASS IT MEASURES: every pinning file the scanner reads '
  + 'is some OTHER file, the edge population is still the same 18, and nothing here asserts a line of '
  + 'another file verbatim — the three arrays are parsed structurally. A census that pinned its own '
  + 'subject matter would be its own finding',
  !edges.some((e) => e.pinner === 328)
  && ARRAYS.every((a) => nameOfRound(a.round) !== undefined && nameOfRound(a.round) !== SELF_NAME)
  && edges.length === HAND_TOTAL,
  `edges contributed by this file: ${edges.filter((e) => e.pinner === 328).length}; pinning files `
    + `read: ${ARRAYS.map((a) => `r${a.round}`).join(' ')}, none of them this file; population ${edges.length}`);

/**
 * Z2 is Round 327's own bug (c) made into an arm. That file's self-scan asked whether its source
 * contained `const BORROWED: Array<[` — and it did, as a `decl:` VALUE in its own table. This file
 * carries the same strings AND round327's key expression in its docblock, so a scan for them would
 * find itself twice over. The guard is structural: arrays are located by ROUND NUMBER from `ARRAYS`
 * and read out of `nameOfRound(...)`, never by searching the tree for a declaration's text.
 */
const selfCarriesDecls = ARRAYS.some((a) => raw(SELF_NAME).includes(a.decl));
check('Z2', 'HOMONYM GUARD, and it has to hold because this file is a counter-example to itself: it '
  + 'CONTAINS the declaration strings it looks for, as `decl:` values, and quotes round327\'s key '
  + 'expression in prose. The scanner is immune because it resolves arrays by ROUND NUMBER and reads '
  + 'only those files, never by searching the tree for a declaration\'s text — the failure that '
  + 'reddened round327\'s Z3 on its first drive',
  selfCarriesDecls && !edges.some((e) => e.pinner === 328)
  && ARRAYS.every((a) => nameOfRound(a.round) !== SELF_NAME),
  `this file contains the decl strings: ${selfCarriesDecls} (so a text scan WOULD match it) · `
    + `arrays resolved by round number to: ${ARRAYS.map((a) => nameOfRound(a.round)?.slice(0, 18)).join(', ')}`);

check('Z3', 'this probe wrote nothing: the scripts/ fingerprint is byte-identical before and after, '
  + 'and no subprocess, port, database, corpus, model or compiler was reached',
  fingerprint(REPO, 'scripts') === TREE_AT_START,
  `fingerprint ${TREE_AT_START.slice(0, 14)}… unchanged across the run`);

check('Z4', 'and this file delegates its exit code, so it is outside the arm-G backlog this thread\'s '
  + 'other instruments measure — by behaviour rather than by name',
  /summariseAndExit\s*\(/.test(raw(SELF_NAME)),
  `${SELF_NAME.slice(0, 40)}…: delegates=${/summariseAndExit\s*\(/.test(raw(SELF_NAME))}`);

console.log(`\n${meas} measurements`);
summariseAndExit({ probeName: 'probe-round328', results });
