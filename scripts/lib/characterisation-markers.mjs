/**
 * The characterisation registry, and the two surfaces a characterisation cell can declare itself on.
 *
 * ## Provenance, and why this is a relocation rather than a rewrite
 *
 * `population`, `commentSpans`, `commentBlocks`, `commentProse`, `MARKERS`, `markersIn` and
 * `markersInRaw` are Theseus's, Round 370, moved here verbatim from
 * `docs/research/round370-instruments/characterisation-sweep-lib.mjs`. They are NOT re-spelled from
 * his memo: Round 369 §2 found a grader that re-implemented its subject from the subject's own prose
 * and so graded a copy against its author's expectations, and a relocation of the functions is the
 * only shape that does not repeat it. The archived copy under `docs/research/` stays where it is;
 * this one is the live one, because a gate that runs every fire must not import from a round's
 * write-once instrument directory — when that directory is tidied the gate goes BLOCKED, which
 * Round 369 taught the sweep to report but did not teach it to prevent.
 *
 * `scripts/lib/characterisation-markers.d.mts` beside this file is what lets a `.mts` probe import
 * it without TS7016 (Rounds 263 and 275 both landed that slip).
 *
 * ## Why there is a registry here at all, and why it is a member list
 *
 * Round 366 §3 scoped a *sweep* over every characterisation comment in the repo. Round 370 drove it
 * and the answer came back negative, for a measured reason: the broad predicate matches 585 blocks
 * across 181 of 329 files, because `rather than` and `silently` are this fleet's house style; and the
 * precise predicate's one `shape-rather-than-intent` member is a cure quoting the defect it cured,
 * so a live characterisation and its own cured history are THE SAME TEXT. No refinement of wording
 * separates them, because there is nothing textual to separate — precision degrades as the class
 * gets cured, since here a cure writes a longer and more quotable comment than the defect ever did.
 *
 * What is decidable is not the comment but the CELL: does a live cell still assert the uncured
 * shape? That turns the item from a sweep over 329 files into a declared member list of seven
 * entries with a two-sided pin, which is what `REGISTRY` below is.
 *
 * ## The two surfaces, which is Round 371's correction to Round 370's member list
 *
 * Round 370 published a member list of THREE, keyed on comment prose. It is FOUR. `probe-round224`
 * cell R5 is a live characterisation whose claim is written in its own `check()` NAME —
 * `'CHARACTERISATION (read only beside R6): …'` — and whose comment never says `characteris*` at
 * all. Keyed on the comment it is not merely missed, it is invisible: the comment surface is
 * OPTIONAL metadata for a characterisation cell, and keying a population on optional metadata fails
 * by returning a smaller number in silence. What every member must have is a cell. So the census
 * runs over both surfaces — comment prose, and the comment-blanked source — and `SURFACES` names
 * them so an arm can drive each leg separately and show the comment-only leg MISSING R5.
 */
import fs from 'node:fs';
import path from 'node:path';
import { stripSource } from './strip-source.mjs';

const SKIP = new Set(['node_modules', '.git', '.testdata', 'dist', 'build', '.scratch-theseus']);

/** Every file under `root`, from a readdirSync walk — never grep (NO ROW for a NUL-containing file). */
export function walk(root, dir = root, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(root, p, acc);
    else if (e.isFile()) acc.push(path.relative(root, p));
  }
  return acc;
}

export function population(root) {
  const all = walk(root);
  const tests = all.filter((f) => /\.test\.(ts|tsx|mts|js|mjs)$/.test(f));
  const probes = all.filter((f) => /(^|\/)probe-[^/]*\.(mts|mjs|ts)$/.test(f) && f.startsWith('scripts/'));
  return { all, tests, probes, files: [...tests, ...probes] };
}

/**
 * Every comment span in `src`, as {start, end, text, line}.
 *
 * Spans are rebuilt across INTERIOR SPACES: stripSource blanks a comment byte to a space, and a
 * space already is one, so a span derived by diffing truncates at the first space (Round 344's
 * defect, which returned 146 false positives against a true 0).
 *
 * A span is a comment rather than a regex literal iff its ORIGINAL text opens `//` or `/*`.
 * stripSource blanks regex bodies too — measured, not assumed — so this discriminator is
 * load-bearing rather than defensive.
 */
export function commentSpans(src) {
  const masked = stripSource(src, false);
  if (masked.length !== src.length) throw new Error('stripSource broke length-preservation');

  const blankedOrSpace = (i) => masked[i] === ' ' && src[i] !== '\n';
  const spans = [];
  let i = 0;
  while (i < src.length) {
    if (!blankedOrSpace(i)) {
      i += 1;
      continue;
    }
    let j = i;
    while (j < src.length && blankedOrSpace(j)) j += 1;
    const raw = src.slice(i, j);
    const lead = raw.replace(/^[ \t]+/, '');
    if (lead.startsWith('//') || lead.startsWith('/*')) {
      spans.push({ start: i, end: j, text: raw, line: src.slice(0, i).split('\n').length });
    }
    i = j;
  }
  return spans;
}

/**
 * Consecutive comment spans joined into LOGICAL comment blocks.
 *
 * Theseus's load-bearing Round 370 correction, and it was found by a control rather than by reading.
 * `commentSpans` terminates every span at the newline, so a `//` comment wrapped over three lines is
 * THREE spans, and a multi-word marker straddling a wrap is UNREPRESENTABLE against per-line spans —
 * no normalisation inside a span can reach text in a different span.
 */
export function commentBlocks(src) {
  const spans = commentSpans(src);
  const blocks = [];
  for (const s of spans) {
    const prev = blocks[blocks.length - 1];
    const between = prev ? src.slice(prev.end, s.start) : null;
    // One block iff nothing but a single newline and indentation separates the two spans.
    if (prev && between !== null && /^\s*\n[ \t]*$/.test(between)) {
      prev.text = `${prev.text}\n${s.text}`;
      prev.end = s.end;
      prev.spans += 1;
    } else {
      blocks.push({ start: s.start, end: s.end, text: s.text, line: s.line, spans: 1 });
    }
  }
  return blocks;
}

/**
 * A comment's PROSE: continuation furniture removed, whitespace collapsed.
 *
 * Comment prose line-wraps and every continuation line carries `//` or ` * `, so any multi-word
 * marker written with a literal space between its words MISSES every instance the wrap happens to
 * split — and misses it by returning a SMALLER number, silently.
 */
export function commentProse(raw) {
  return raw
    .split('\n')
    .map((l) => l.replace(/^[ \t]*(?:\/\/+|\/\*+|\*+\/|\*)[ \t]*/, '').replace(/\*\/[ \t]*$/, ''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The narrowed predicate, as a NAMED set so a member list can be compared, not just a count.
 *
 * `{key, re}` rather than Theseus's `[key, re]`, and this is the ONE place the relocation is not
 * verbatim. A tuple literal in a `.mjs` infers as `(string | RegExp)[][]`, so every honest `.d.mts`
 * spelling of it DRIFTS from the implementation — `probe-round307` arm B2 is the gate that caught it,
 * naming `MARKERS`, `markersIn` and `markersInRaw`, and it caught them in the sweep rather than in
 * my reading. The alternative was to declare the drifted type and let two downstream interfaces
 * carry `(string | RegExp)[]` where they mean a key. Named fields infer exactly, so the declaration
 * is true instead of merely accepted. Behaviour-preserving, and not taken on my word for it: arm D1
 * reproduces Theseus's RECORDED 585-member list member-for-member through this shape.
 */
export const MARKERS = [
  { key: 'shape-rather-than-intent', re: /asserting\s+the\s+(?:shape|current|existing)\b[\s\S]{0,60}?rather\s+than/i },
  { key: 'characterising', re: /\bcharacteris(?:e|es|ed|ing|ation)\b/i },
  { key: 'for-now', re: /\bfor\s+now\b/i },
  { key: 'silently', re: /\bsilent(?:ly)?\b/i },
  { key: 'rather-than', re: /\brather\s+than\b/i },
];

export function markersIn(text) {
  const prose = commentProse(text);
  return MARKERS.filter((m) => m.re.test(prose)).map((m) => m.key);
}

/** The same predicate WITHOUT normalisation — the counterfactual, driven rather than described. */
export function markersInRaw(text) {
  return MARKERS.filter((m) => m.re.test(text)).map((m) => m.key);
}

// ── Round 371 additions ──────────────────────────────────────────────────────

/**
 * The two legs of `MARKERS` that are precise enough to key a member list on.
 *
 * `for-now` has ZERO members in this tree; `silently` has 145 and `rather-than` 496, which is 55% of
 * the population and cannot red on anything. Driven in Round 370, reproduced in Round 371.
 */
export const PRECISE_MARKERS = new Set(['shape-rather-than-intent', 'characterising']);

const preciseOnly = (keys) => keys.filter((k) => PRECISE_MARKERS.has(k));

/**
 * The two surfaces a characterisation can declare itself on, each a `(src) => {line, text}[]`.
 *
 * `comment` is Theseus's Round 370 key. `code` is Round 371's correction: with comments blanked by
 * `stripSource`, what is left is the code, and a `check()` name string is code. `probe-round371`'s
 * own arm G2 drives the `comment` leg alone as a counterfactual that must MISS the R5 CELL of
 * `probe-round224` — which is the whole reason this second leg exists.
 *
 * `R5` is a CELL, not an arm, and the distinction is written down here because the general
 * arm-pointer detector of Round 308 reddened on the first version of this sentence, which gave it
 * an arm's name. The `check()` call is labelled `'R'`; `R5` is a name that probe's own comments
 * give one cell inside it, and a pointer to an arm label no probe defines is exactly what that
 * detector is for. It caught a real one, in the sweep rather than in my reading — and the same
 * sentence also still said "Arm C" after the arm had been renamed G2, a pointer written beside its
 * own subject and stale before it shipped.
 */
export const SURFACES = {
  comment: (src) => commentBlocks(src)
    .filter((b) => preciseOnly(markersIn(b.text)).length > 0)
    .map((b) => ({ line: b.line, text: commentProse(b.text), markers: preciseOnly(markersIn(b.text)) })),

  code: (src) => {
    const masked = stripSource(src, false);
    if (masked.length !== src.length) throw new Error('stripSource broke length-preservation');
    // A code-surface member is one STATEMENT's worth of text, not one line: a `check()` name is
    // written as a `+`-concatenated run of string literals across several lines, so a per-line key
    // would split a marker the same way per-line comment spans split one (Round 370 §3). The run is
    // delimited by `;` at statement level, which is coarse and deliberately so — a false JOIN costs
    // a member list entry that names two cells, a false SPLIT costs the member itself.
    const out = [];
    let cursor = 0;
    for (const stmt of masked.split(';')) {
      const start = cursor;
      cursor += stmt.length + 1;
      const keys = preciseOnly(MARKERS.filter((m) => m.re.test(stmt)).map((m) => m.key));
      if (keys.length === 0) continue;
      // The line of the FIRST marker occurrence inside the statement, not the statement's own first
      // line: a statement here spans several lines and the useful pointer is where the word is.
      const at = Math.min(...MARKERS.filter((m) => keys.includes(m.key))
        .map((m) => stmt.search(m.re)).filter((n) => n >= 0));
      out.push({
        line: masked.slice(0, start + at).split('\n').length,
        text: stmt.replace(/\s+/g, ' ').trim(),
        markers: keys,
      });
    }
    return out;
  },
};

/**
 * Every declared characterisation in this repo: SEVEN entries, four live and three commemorations.
 *
 * `anchor` is the key, not `line`. A line number is recorded by the drive and printed, never
 * matched: `probe-round224` is another seat's file, it is edited most fires, and any edit above a
 * declared line would red a line-keyed registry for a reason that is not the finding. An anchor is a
 * distinctive substring of the member's own normalised text, and arm B asserts each one matches AT
 * MOST ONE member in its file — an ambiguous anchor reds rather than silently picking a side.
 *
 * `cells` is what makes this decidable. For a `live` entry it is the `check()` name(s) that assert
 * the UNCURED shape, matched against the probe's real stdout. When the defect is cured those cells
 * stop passing, and THAT is the signal to retire the entry — not a re-reading of the comment.
 *
 * A `commemoration` entry carries NO cells, and that is the honest shape: it names a cure that
 * already landed, so there is nothing uncured for a cell to assert. It is declared anyway, because
 * side B reds on any marker-carrying member that is not declared at all, and three of the seven
 * members in this tree are commemorations. What a commemoration is NOT pinned on: that it is still
 * accurately a commemoration. If a cured defect regressed, these entries would not notice; the arm
 * that notices is the one guarding the cure, in the file that holds it.
 */
export const REGISTRY = [
  {
    id: 'r224/M-358-arm-and-check',
    file: 'scripts/probe-round224-a-skip-must-not-summarise-as-a-pass.mts',
    surface: 'comment',
    status: 'live',
    anchor: 'Characterised, not cured',
    claim: 'a non-string `arm` or `check` does not move the exit code; `arm` reaches the REGRESSIONS '
      + 'block as [object Object]',
    cells: [
      'a non-string `arm` does NOT move the exit code',
      'and a non-string `check` does not move it either',
    ],
  },
  {
    id: 'r224/Q-the-22-declared-cells',
    file: 'scripts/probe-round224-a-skip-must-not-summarise-as-a-pass.mts',
    surface: 'comment',
    status: 'live',
    anchor: 'Cell Q2 characterises the uncured crash',
    claim: 'the type-guard class is uncured on `input itself`, `results`, `results[0]`, `skipped` and '
      + '`skipped[0]`, and the 22 cells are a declared measurement only while Q3 holds',
    cells: [
      'CHARACTERISATION (not a blessing',
      'no live caller can supply a non-array',
    ],
  },
  {
    id: 'r224/Q2-the-uncured-half',
    file: 'scripts/probe-round224-a-skip-must-not-summarise-as-a-pass.mts',
    surface: 'comment',
    status: 'live',
    anchor: 'the uncured half, CHARACTERISED',
    claim: 'the uncured paths still throw at the measured cell counts',
    cells: ['CHARACTERISATION (not a blessing'],
  },
  {
    // The same finding as `r224/Q2-the-uncured-half`, declared a SECOND time on the other surface.
    // It is a separate entry rather than an alias because the registry is keyed on DECLARATION
    // SITES, not on findings: a finding-level key would need me to decide whether the Q docblock and
    // Q2's own one-liner are one characterisation or two, and that judgement is exactly the kind a
    // registry should not smuggle into its denominator. Two entries pointing at one cell is fine and
    // is asserted to be fine by arm A, which allows a cell to be named by more than one entry.
    id: 'r224/Q2-the-uncured-half-in-its-own-check-name',
    file: 'scripts/probe-round224-a-skip-must-not-summarise-as-a-pass.mts',
    surface: 'code',
    status: 'live',
    anchor: 'CHARACTERISATION (not a blessing',
    claim: 'the uncured paths still throw at the measured cell counts — written into the cell\'s own '
      + 'name, which is where Round 370\'s comment-keyed census could not see it',
    cells: ['CHARACTERISATION (not a blessing'],
  },
  {
    // Round 371's correction to Round 370's member list, and the reason `SURFACES.code` exists.
    id: 'r224/R5-the-symbol-paths',
    file: 'scripts/probe-round224-a-skip-must-not-summarise-as-a-pass.mts',
    surface: 'code',
    status: 'live',
    anchor: 'CHARACTERISATION (read only beside R6)',
    claim: 'three paths arm Q records as having zero throwers throw on a `Symbol`, by direct template '
      + 'interpolation rather than the type-guard class — the class is open, not acceptable',
    cells: ['CHARACTERISATION (read only beside R6)'],
  },
  {
    id: 'r224/M-359-reaimed-inapplicable',
    file: 'scripts/probe-round224-a-skip-must-not-summarise-as-a-pass.mts',
    surface: 'comment',
    status: 'commemoration',
    anchor: 'the correct pin for a characterised-not-cured finding',
    claim: 'Round 359 cured the `inapplicable` throw; the cell was re-aimed at the asymmetry that '
      + 'outlives the cure',
    cells: [],
  },
  {
    id: 'r224/N-the-inapplicable-hatch',
    file: 'scripts/probe-round224-a-skip-must-not-summarise-as-a-pass.mts',
    surface: 'comment',
    status: 'commemoration',
    anchor: 'which Round 358 characterised and left',
    claim: 'arm N\'s docblock recording that the hatch Round 358 characterised is now a code 3',
    cells: [],
  },
  {
    id: 'r247/the-reaimed-exit-code-test',
    file: 'packages/server/src/__tests__/round247-the-exit-code-is-driven-not-read.test.ts',
    surface: 'comment',
    status: 'commemoration',
    anchor: 'This test was written in Round 247 as a CHARACTERISATION',
    claim: 'Round 361 re-aimed this test and quoted the Round 247 defect verbatim — which is why the '
      + 'one `shape-rather-than-intent` member in this tree is a cure, and why no wording can '
      + 'separate a live characterisation from its own cured history',
    cells: [],
  },
];

/**
 * The one file the census does not read, and the hole that leaves, stated.
 *
 * `probe-round371` discusses characterisations in nearly every comment and in its own check names, so
 * it is its own largest population member and would drown both sides. It is excluded by name, the
 * drive asserts the exclusion resolves to EXACTLY ONE existing file, and the hole is real and named:
 * a characterisation cell hiding inside the registry's own probe is not pinned by anything here.
 */
export const SELF_EXCLUDED = 'scripts/probe-round371-the-characterisation-item-is-a-registry-not-a-sweep.mts';

/**
 * Both sides of the pin, over one surface-keyed census. Returns a member list, never a count:
 * two keys sharing a denominator agree vacuously, and a count hides which member moved.
 */
export function reconcile(root, registry = REGISTRY) {
  const pop = population(root).files.filter((f) => f !== SELF_EXCLUDED);
  const found = [];
  for (const f of pop) {
    const src = fs.readFileSync(path.join(root, f), 'utf8');
    for (const [surface, read] of Object.entries(SURFACES)) {
      for (const m of read(src)) found.push({ file: f, surface, ...m });
    }
  }
  const matches = (e, m) => e.file === m.file && e.surface === m.surface && m.text.includes(e.anchor);
  const ambiguous = registry
    .map((e) => ({ id: e.id, hits: found.filter((m) => matches(e, m)).length }))
    .filter((r) => r.hits > 1);
  const undeclared = found.filter((m) => !registry.some((e) => matches(e, m)));
  const unmatched = registry.filter((e) => !found.some((m) => matches(e, m)));
  return { pop, found, ambiguous, undeclared, unmatched };
}
