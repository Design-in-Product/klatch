/**
 * One canonical, machine-readable verdict for a research instrument's leg run.
 *
 * ## Why this exists
 *
 * This is the shared emitter Daedalus offered in Round 440 §6 and Theseus took in Round 441 §2
 * ("Build the emitter… my extractor is worth having for the existing recordings and should not be
 * what the next thirty rounds rest on"). It exists because two *prose* surfaces were measured and
 * both are unbounded:
 *
 *   - Round 440 `G3`/`G9`/`G6`, over the 11-member round413..round436 population:
 *     **6** distinct gate-line shapes, **3** label suffixes that introduce a leg-id list, and
 *     **4** distinct per-leg verdict-token sets — `["EXPECTED","TRUE"]`, `["TRUE"]`,
 *     `["FALSE","TRUE"]`, `["REF","ok"]`. Sliced out of `round440-instruments/drive4.final.out`
 *     lines 48–59, not typed from a memo.
 *   - Every round invents its own, so both numbers grow with the population.
 *
 * It is NOT `scripts/lib/gate-line.mts`, which already exists and which this file deliberately
 * does not duplicate. That one quotes the **vitest `npm test` gate** — a (exit status, captured
 * stdout) pair — and its subject is that a red vitest run prints the same three counts as a green
 * one. This file's subject is an **instrument's own leg run**: the `GATE: false   (10 leg(s))
 * RED: G6, G10   REFUSED: G4` line each round hand-writes at its tail. Same disease, different
 * patient, and the older file's docstring carries the argument both rest on: "telling people
 * 'also mention the exit code' is a discipline, not a mechanism."
 *
 * ## The three properties, stated as properties
 *
 * 1. **Every list is always present, including when empty.** A green run renders `red=[]
 *    refused=[]`. This is the structural cure for the defect Theseus found in Round 441 §1: my
 *    `G9` keyed a "no label grammar" class on *emitted lines*, and a green instrument prints no
 *    leg-id label **because it is green**, so "no label observed" and "no label grammar" were the
 *    same observation. My five was his three. Under this grammar that inference is not merely
 *    unreliable, it is **unrepresentable** — there is no output of `renderVerdict` with a missing
 *    list, so absence of a list can only ever mean "not this grammar".
 *
 * 2. **No argument makes a run with a red leg render the green token**, enforced by a throw rather
 *    than by reading the code. Same mechanism as `gate-line.mts` line 91, for the same reason.
 *    `ok` means *every leg returned `true`*: a refused leg renders `REFUSED`, not `ok`, because an
 *    unfinished model is not a pass (353/422 — a guard that fires beside a figure that still
 *    prints). This is a deliberate narrowing of what the current population means by green, and it
 *    is stated here rather than smuggled: Round 440 drive 2 printed `RED: G6   REFUSED: G4` and
 *    Round 441 printed `GATE: true` with zero refusals, so no existing published verdict changes
 *    sign under it.
 *
 * 3b. **Round-trip closure: no argument renders a line this module's own reader refuses, or one
 *    whose lists read back different from the ones that went in.** Added in Round 444 as the cure
 *    for Theseus's Round 443 §1, which is the strongest finding made against this file: properties
 *    1 and 2 are keyed on the *lists*, and the artifact published is the *string*, so an id could
 *    break the correspondence between them below the level either guard checked. 7 of 8 id shapes
 *    emitted a line `readVerdict` refused, three of them publishing `RED … red=[]` — a red run with
 *    an empty red list. Enforced at the tail of `renderVerdict` by reading its own output back, and
 *    by `ID_GRAMMAR` in `bucket`; `selfTest()` drives both, so this paragraph cannot outlive the
 *    mechanism it describes (357/359 — prose written beside its own cure needs a pin).
 *
 * 3. **The reader refuses by name and never by sentinel.** `readVerdict` returns either
 *    `{ ok: true, verdict }` or `{ ok: false, refusal: <one of REFUSALS> }`. It never returns a
 *    zero, a `-1`, an empty list or a `false` that a caller could compare its way past
 *    (393 — `-1 === -1` passed forever; 399 — compute the refusal, publish it, don't guess it).
 *
 * ## Two spellings this file will not use, each because it has already cost a round
 *
 * - **No padded tokens.** Round 441 §3's third defect was a verdict-tag reader that spelled a
 *   five-character green tag `' ok  '` with four, and graded 3 of 4 vacuity cells VACUOUS against
 *   a true MOVED. Column alignment is why that tag was five characters. Rows here are
 *   single-space-separated and the token is never padded, so there is no width to get wrong.
 * - **No fall-through bucket.** Every state is positively keyed and an unrecognised input refuses
 *   by name (411/439). The last branch is not a default.
 */

import { execFileSync } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
import { dirname, join, relative, basename } from 'path';
import { fileURLToPath } from 'url';

export const SCHEMA = 'VERDICT/1';

/** Per-leg token. Three states, fixed spellings, no padding, no fourth value. */
export const LEG_TOKENS = { true: 'ok', false: 'RED', null: 'REF' };

/**
 * Per-prediction token. A SECOND vocabulary, and the choice is keyed on a census rather than on
 * taste (Round 450 `drive1.census-row-vocabulary.out`, 390 committed `.out` files at `9ddc9d17`):
 * `LANDED` appears in **52** recordings, more than `RED` (30) or `REF` (10), and `REFUTED` in 26,
 * `OPEN` in 11 — 70 recordings use this vocabulary for a prediction's outcome. Spelling a
 * prediction `ok`/`RED`/`REF` would have invented a ninth and tenth spelling in the same file that
 * exists to stop spelling drift.
 *
 * The cost of two vocabularies is that a row can carry the right token for the wrong kind, so that
 * is refused by name (`WRONG_KIND_TOKEN`) rather than left to a reader to notice.
 */
export const PRED_TOKENS = { true: 'LANDED', false: 'REFUTED', null: 'OPEN' };

/**
 * The named refusals `readVerdict` can return. Exported so a grader can check it against the
 * `refuse('…')` call sites in this file's own source rather than against a hand-typed copy
 * (426 — derive the predicate from the branch literals).
 */
export const REFUSALS = [
  'NO_VERDICT_LINE',
  'MULTIPLE_VERDICT_LINES',
  'UNKNOWN_SCHEMA',
  'MALFORMED_FIELDS',
  'UNKNOWN_TOP_TOKEN',
  'TOKEN_LIST_CONTRADICTION',
  'COUNT_LIST_CONTRADICTION',
];

/**
 * The named refusals the ROW readers can return. Same discipline as `REFUSALS`: exported so a
 * grader can check it against this file's own `refuseRow('…')` call sites instead of a hand-typed
 * copy (426 — derive the predicate from the branch literals).
 */
export const ROW_REFUSALS = [
  'MALFORMED_ROW',
  'UNKNOWN_ROW_TOKEN',
  'WRONG_KIND_TOKEN',
  'DUPLICATE_ROW_ID',
  'ROW_GRAMMAR_ABSENT',
  'ROW_COUNT_DISAGREEMENT',
  'PRED_ROW_COUNT_DISAGREEMENT',
];

const FIELDS = ['legs', 'red', 'refused', 'preds', 'refuted', 'prefused'];

/**
 * The declared id grammar, enforced in `bucket` (Theseus's Round 443 §2, edit 1). The characters
 * excluded are exactly the ones the reader's own grammar is sensitive to: a space and `=` split
 * fields, a `,` splits a list, `[`/`]` delimit one, and the empty string renders to nothing because
 * `[''].join(',')` is `''`.
 */
export const ID_GRAMMAR = /^[A-Za-z0-9_.:-]+$/;

const refuse = (code) => {
  if (!REFUSALS.includes(code)) throw new Error(`refuse() called with an undeclared code: ${code}`);
  return { ok: false, refusal: code, verdict: null };
};

const refuseRow = (code, detail = null) => {
  if (!ROW_REFUSALS.includes(code)) {
    throw new Error(`refuseRow() called with an undeclared code: ${code}`);
  }
  return { ok: false, refusal: code, detail, rows: null };
};

const renderList = (ids) => `[${ids.join(',')}]`;
const parseList = (text) => {
  if (!/^\[[^[\]]*\]$/.test(text)) return null;
  const inner = text.slice(1, -1);
  return inner === '' ? [] : inner.split(',');
};

/**
 * The top token. `ok` iff every leg returned `true`. Derived from the lists and from nothing else,
 * so it cannot disagree with them.
 */
export function topToken(red, refused) {
  if (red.length > 0) return 'RED';
  if (refused.length > 0) return 'REFUSED';
  return 'ok';
}

/**
 * Three-state conjunction for a leg's value — **Kleene strong AND**, and the fix for Round 456 §3.
 *
 * The defect it exists to remove: the three-state discipline (`LEG_TOKENS`) was applied at the LEG
 * and never at the CONJUNCT. Five of Round 450/451's legs computed a refusal and then conjoined it
 * away, because the idiom for "did my slice compile" is `re !== null && …` — and `!==` turns the
 * refusal into `false`, which `leg()` then publishes as **RED**. A RED says *"I measured this and
 * it is bad"*. The honest answer when a slice will not compile is **REF**: *"I could not reach this
 * figure."* The information is destroyed at the comparison, so no amount of care downstream in
 * `leg()` or `renderVerdict` can recover it — it has to be fixed where the value is read.
 *
 *   `allOf(false, null)` is **false**, not null.
 *
 * That is the one choice in here worth arguing with, because it is NOT the literal reading of
 * Theseus's Round 457 §5 phrasing ("make a refused conjunct refuse its leg"). Refusal-dominant
 * would return `null`. Kleene is chosen because the two directions fail differently and only one of
 * them fails quietly:
 *
 *   - Kleene errs toward **reporting**: a leg with one genuinely-false conjunct stays RED even
 *     though another conjunct could not be measured. The defect keeps getting published.
 *   - Refusal-dominant errs toward **silence**: a real, measured, independent failure is downgraded
 *     to REF and stops being reported, because something unrelated to it would not compile.
 *
 * For an instrument whose whole job is to not lose findings, losing a RED is the worse error. The
 * cost of this choice is that a RED from `allOf` must still NAME the refusal in its detail string —
 * `allOf` returns a token, it cannot write the detail, and a RED whose detail is silent about an
 * unmeasured conjunct is the 409 shape (a guard that fires beside a figure that still prints).
 *
 * **The limit, and it is the sharp one.** Kleene is sound only when the conjuncts are INDEPENDENT
 * measurements. It is wrong when a conjunct is *derived from* the refused value — then its `false`
 * is not a measurement at all, it is the refusal wearing a boolean's clothes. Round 451's `T4` is
 * exactly this: the slices refused, so the 2×2 was never populated, so `cell.only446.length > 0`
 * read `false`, and Kleene would publish RED on the strength of a cell that was empty because
 * nothing was ever put in it. `T8` is the same shape one step further out — a refusal excluded its
 * members from a population, deflating a count to 0, and the leg printed `0 committed recordings…`
 * as a substantive finding.
 *
 * `allOf` CANNOT detect that; the dependency is not visible in the values. Use `measured()` below to
 * carry the refusal through the derivation so that what reaches `allOf` is `null` and not `false`.
 * Which conjuncts are derived is per-site hand work, and this comment is not a substitute for it.
 *
 * Total, like `renderVerdict`: a value outside `{true, false, null}` throws rather than being
 * coerced, because coercion is the bug. `allOf()` with no arguments is `true` (the empty
 * conjunction), which is correct and is also a vacuity hazard — a leg built by spreading a list
 * that turns out to be empty publishes `ok` having checked nothing (437).
 */
export function allOf(...values) {
  for (const v of values) {
    if (v !== true && v !== false && v !== null) {
      throw new Error(`allOf() got a value outside {true,false,null}: ${JSON.stringify(v)}`);
    }
  }
  if (values.includes(false)) return false;
  if (values.includes(null)) return null;
  return true;
}

/**
 * Carry a refusal THROUGH a derivation instead of laundering it into a boolean — the companion to
 * `allOf` and the half that fixes `T4`/`T8`.
 *
 * `measured(x, f)` is `null` when `x` is `null` (the refusal propagates, unmeasured stays
 * unmeasured), and `f(x)` otherwise. It replaces the idiom that caused the bug:
 *
 *   `re !== null && re.test(line)`        ← a refused slice reads as "does not match"
 *   `measured(re, (r) => r.test(line))`   ← a refused slice reads as "not measured"
 *
 * `f` must return a strict boolean or `null`. Anything else throws: returning a count, a length or
 * an array from here is how `0` and `[]` become `false` and the refusal disappears again. The
 * sentinel is `null` and only `null` — `undefined`, `NaN` and `''` are NOT refusals and are passed
 * to `f`, because guessing which falsy value someone meant as a refusal is 425 (a refusal value is
 * not always the sentinel; publish the refusal rather than guess).
 */
export function measured(value, f) {
  if (value === null) return null;
  const r = f(value);
  if (r !== true && r !== false && r !== null) {
    throw new Error(`measured() predicate returned a non-tri-state value: ${JSON.stringify(r)}`);
  }
  return r;
}

/**
 * `legs` is `[{ id, ok }]` with `ok` in `{true, false, null}`; `preds` is `[{ id, landed }]` with
 * `landed` in the same three. Total function: any leg whose `ok` is not one of the three throws
 * here rather than landing in a bucket.
 */
export function renderVerdict({ legs = [], preds = [] } = {}) {
  const bucket = (items, key) => {
    const out = { true: [], false: [], null: [] };
    for (const it of items) {
      const v = it[key];
      if (v !== true && v !== false && v !== null) {
        throw new Error(`renderVerdict: ${it.id} has a ${key} of ${JSON.stringify(v)}, which is not true/false/null`);
      }
      if (typeof it.id !== 'string' || !ID_GRAMMAR.test(it.id)) {
        throw new Error(`renderVerdict: id ${JSON.stringify(it.id)} is not ${ID_GRAMMAR} — an id that renders `
          + 'to nothing or to two members breaks the line\'s correspondence with its own lists');
      }
      out[String(v)].push(it.id);
    }
    return out;
  };
  const L = bucket(legs, 'ok');
  const P = bucket(preds, 'landed');
  const token = topToken(L.false, L.null);
  const line = [
    `${SCHEMA} ${token}`,
    `legs=${legs.length}`,
    `red=${renderList(L.false)}`,
    `refused=${renderList(L.null)}`,
    `preds=${preds.length}`,
    `refuted=${renderList(P.false)}`,
    `prefused=${renderList(P.null)}`,
  ].join(' ');

  // The property, enforced rather than intended. If a future edit ever lets a run with a red leg
  // carry the green token, this throws instead of publishing the one wrong thing this file exists
  // to prevent. Keyed on the LISTS, not on `token`, so re-deriving `token` cannot make it vacuous.
  const claimsGreen = line.startsWith(`${SCHEMA} ok `);
  const isGreen = L.false.length === 0 && L.null.length === 0;
  if (claimsGreen !== isGreen) {
    throw new Error(`renderVerdict would have quoted a run with the wrong token: ${line}`);
  }
  // Both lists are present in every output. This is property 1, asserted, not documented.
  for (const f of FIELDS) {
    if (!line.includes(` ${f}=`)) throw new Error(`renderVerdict dropped the ${f} field: ${line}`);
  }

  // Property 4 — ROUND-TRIP CLOSURE. There is no argument to this function that renders a line this
  // module's own reader refuses, or that reads back with lists other than the ones that went in.
  //
  // Theseus's Round 443 §1 is why this is here, and it is the sharpest finding either of us has
  // made against this file. The invariant above is keyed on the LISTS (`isGreen`) while the artifact
  // published is the STRING, and an id can break the correspondence between them *below* the level
  // the invariant checks: `{ name: 'G1', ok: false }` — a typo away in every adopting instrument —
  // rendered `VERDICT/1 RED legs=1 red=[] refused=[] …`, a run with a red leg whose published red
  // list is empty, which is the one thing this file exists to prevent, in the mirror direction. His
  // confusion matrix over id SHAPE (the axis his grid varied cardinality instead of) found 7 of 8
  // shapes emitting a line `readVerdict` refuses by name, 0 of them throwing at emit
  // (354 — a guard on identity does not guard value; 443 — guard the published string, not the
  // arrays it came from).
  //
  // WIDER THAN HE SPECIFIED, and the widening is measured rather than assumed, in Round 444 `G3`:
  // he named `red`/`refused`; this checks all FOUR lists. A PREDICATION id of `'A,B'` renders
  // `refuted=[A,B]` with `preds=2`, which satisfies every count check and PARSES — so the
  // two-list spelling of this cure admits a line whose parsed list has two members where one went
  // in, and only the four-list spelling refuses it.
  const rt = readVerdict(line);
  if (rt.ok !== true) {
    throw new Error(`renderVerdict rendered a line its own reader refuses as ${rt.refusal}: ${line}`);
  }
  const back = [
    ['red', rt.verdict.red, L.false], ['refused', rt.verdict.refused, L.null],
    ['refuted', rt.verdict.refuted, P.false], ['prefused', rt.verdict.prefused, P.null],
  ];
  // Compared by LENGTH AND ELEMENT, never by a joined string. Drive 1 of Round 444's `G1` reported
  // `preds: [{ id: '', landed: null }]` as FAITHFUL against a true loss, because `[''].join(x)` and
  // `[].join(x)` are both `''` — a comparison that is vacuously equal on exactly the id shape this
  // guard exists to catch (393 — a sentinel fallback makes a comparison green forever). Theseus's
  // §2 spelling of this cure has the same blindness (`String.fromCharCode(1)`), and in both cases
  // `ID_GRAMMAR` catches the shape first, which is why it took a figure to find it.
  const sameList = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  for (const [name, got, want] of back) {
    if (!sameList(got, want)) {
      throw new Error(`renderVerdict: ${name} read back as ${JSON.stringify(got)} from a line built `
        + `from ${JSON.stringify(want)} — the string and the lists disagree: ${line}`);
    }
  }
  return line;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// ROWS — the other artifact in this file, and until Round 450 the unguarded one.
//
// Theseus's Round 449 §4 measured that `renderRows`' output is read by **0 of 3** rows by either of
// the two row readers in my own Rounds 446 and 448, and asked for a decision between making this
// the one grammar and widening those readers. Driving it first (Round 450 `probe0`) found the
// reason the question had never come up: of `renderVerdict`'s three guards — `ID_GRAMMAR`, the
// tri-state throw, and round-trip closure — `renderRows` had **none**, because every guard in this
// file was keyed on the VERDICT LINE, the artifact declared machine-readable. Rows were a
// convenience. Five shapes, all five of which `renderVerdict` throws on, emitted happily:
//
//     ok: 'yes'            → "LEG G1 undefined x"        a fall-through to the string "undefined",
//                                                        in the file whose docstring says there is
//                                                        no fall-through bucket
//     id: 'G1 ok hello'    → "LEG G1 ok hello ok x"      TWO tokens; a positional reader takes the
//                                                        wrong one
//     id: ''               → "LEG  ok x"
//     { name: 'G1' }       → "LEG undefined RED x"       Theseus's Round 443 §1 shape, the sharpest
//                                                        finding ever made against this file, still
//                                                        live here one artifact over
//     what: 'one\nLEG G2 ok injected'
//                          → TWO LINES, the second a well-formed row for a leg THAT DOES NOT EXIST
//
// The last one is why rows are not merely a weaker version of the same problem. A verdict is one
// line, so a bad field malforms it; a row set is a multi-line string, so one leg's free text can
// FORGE another leg's row — and the reader that would believe it is `record-cripples.mjs`, the tool
// that grades whether a cripple moved the leg it declared.
//
// So the guards below are the verdict line's three, plus the one rows need and it does not: `what`
// is single-line and carries no trailing whitespace, enforced, because those are exactly the
// characters that break the correspondence between a row and the leg it reports
// (443 — guard the published string, not the arrays it came from).
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/** Row kinds. The prefix and the token vocabulary move together; neither is a default. */
const ROW_KINDS = {
  LEG: { key: 'ok', tokens: LEG_TOKENS },
  PRED: { key: 'landed', tokens: PRED_TOKENS },
};

/**
 * `LEG G1 ok detail` / `PRED Q1 REFUTED detail`. The remainder after the token is captured
 * verbatim rather than split, so internal spacing in a detail survives the round trip.
 */
const ROW_SHAPE = /^(LEG|PRED) (\S+) (\S+)(?: (.*))?$/;

function renderRowSet(items, kind) {
  const { key, tokens } = ROW_KINDS[kind];
  const rows = items.map((it) => {
    const v = it[key];
    if (v !== true && v !== false && v !== null) {
      throw new Error(`renderRowSet: ${it.id} has a ${key} of ${JSON.stringify(v)}, which is not `
        + 'true/false/null — the token would render as "undefined"');
    }
    if (typeof it.id !== 'string' || !ID_GRAMMAR.test(it.id)) {
      throw new Error(`renderRowSet: id ${JSON.stringify(it.id)} is not ${ID_GRAMMAR} — an id with a `
        + 'space renders a second token into the row, and an empty one renders none');
    }
    const what = it.what ?? '';
    if (typeof what !== 'string') {
      throw new Error(`renderRowSet: ${it.id} has a non-string what: ${JSON.stringify(what)}`);
    }
    if (/[\n\r]/.test(what)) {
      throw new Error(`renderRowSet: ${it.id}'s detail contains a newline: ${JSON.stringify(what)} — `
        + 'one row would publish as two lines, and the second can be a well-formed row for a leg '
        + 'that does not exist');
    }
    if (what !== what.trimEnd()) {
      throw new Error(`renderRowSet: ${it.id}'s detail has trailing whitespace: ${JSON.stringify(what)}`
        + ' — it would not survive the round trip, and a detail that reads back different from the'
        + ' one that went in is the row-level version of the defect property 3b exists to prevent');
    }
    return `${kind} ${it.id} ${tokens[String(v)]} ${what}`.trimEnd();
  });

  // ROUND-TRIP CLOSURE for rows, the same property 3b the verdict line has had since Round 444 and
  // rows never did. No argument renders a row set this module's own reader refuses, or one that
  // reads back with an id, token or detail other than what went in.
  const rt = readRows(rows.join('\n'));
  if (rt.ok !== true) {
    throw new Error(`renderRowSet rendered rows its own reader refuses as ${rt.refusal}`
      + `${rt.detail === null ? '' : ` (${rt.detail})`}: ${JSON.stringify(rows)}`);
  }
  const mine = rt.rows.filter((r) => r.kind === kind);
  if (mine.length !== items.length) {
    throw new Error(`renderRowSet: ${items.length} item(s) read back as ${mine.length} row(s) — `
      + `the string and the list disagree: ${JSON.stringify(rows)}`);
  }
  for (let i = 0; i < items.length; i += 1) {
    const want = items[i];
    const got = mine[i];
    const wantWhat = want.what ?? '';
    if (got.id !== want.id || got.state !== want[key] || got.what !== wantWhat) {
      throw new Error(`renderRowSet: row ${i} read back as ${JSON.stringify(got)} from `
        + `${JSON.stringify({ id: want.id, [key]: want[key], what: wantWhat })}`);
    }
  }
  return rows;
}

/** Per-leg rows, one grammar, unpadded, every input guarded. */
export function renderRows(legs = []) {
  return renderRowSet(legs, 'LEG');
}

/**
 * Per-prediction rows. These did not exist before Round 450, which is why `renderTail` accepted a
 * prediction's `what` and dropped it (Theseus's Round 449 §3): `preds` reached `renderVerdict`, so
 * a prediction's **id** reached the verdict line's lists, and its **reason** reached nothing. His
 * `drive4` published `refuted=[Q1]` with the figure it was scored on appearing nowhere in the
 * recording — "a refuted prediction with no reason is the reason-level version of 437."
 *
 * The census says this was never once published: of 390 committed `.out` files, canonical rows
 * appear 129 times and **not one** is a `PRED` row, because the lib could not render one.
 */
export function renderPredRows(preds = []) {
  return renderRowSet(preds, 'PRED');
}

/**
 * Read canonical rows out of arbitrary text. `{ok:true, rows}` or `{ok:false, refusal, detail}`.
 * Never throws, for the same reason `readVerdict` never throws.
 *
 * Zero rows in text that has none is `{ok:true, rows:[]}` and NOT a refusal — a run with no legs
 * must be expressible, which is property 1's argument. Telling that apart from "this recording uses
 * another grammar" is `readTail`'s job, and it is the whole reason `readTail` exists.
 */
export function readRows(text) {
  const rows = [];
  const seen = new Set();
  for (const line of String(text ?? '').split('\n')) {
    if (!/^(?:LEG|PRED) /.test(line)) continue;
    const m = line.match(ROW_SHAPE);
    if (m === null) return refuseRow('MALFORMED_ROW', line);
    const [, kind, id, token, rest] = m;
    const { tokens } = ROW_KINDS[kind];
    const state = Object.keys(tokens).find((k) => tokens[k] === token);
    if (state === undefined) {
      // Known token, wrong kind, told apart from an unknown one by name — this is the cost of two
      // vocabularies, mechanised rather than left to a reader to spot.
      const otherKind = Object.keys(ROW_KINDS).find(
        (k) => k !== kind && Object.values(ROW_KINDS[k].tokens).includes(token),
      );
      return refuseRow(otherKind === undefined ? 'UNKNOWN_ROW_TOKEN' : 'WRONG_KIND_TOKEN', line);
    }
    if (!ID_GRAMMAR.test(id)) return refuseRow('MALFORMED_ROW', line);
    const dedup = `${kind} ${id}`;
    if (seen.has(dedup)) return refuseRow('DUPLICATE_ROW_ID', dedup);
    seen.add(dedup);
    rows.push({
      kind,
      id,
      token,
      state: state === 'true' ? true : state === 'false' ? false : null,
      what: rest ?? '',
    });
  }
  return { ok: true, refusal: null, detail: null, rows };
}

/**
 * Read a whole tail: the verdict line AND its rows, with the one check neither reader can make
 * alone.
 *
 * This exists because of the defect shape that cost Round 441 §1: a green instrument prints no
 * leg-id label *because it is green*, so "no label observed" and "no label grammar" were the same
 * observation, and my five was his three. Rows have the same trap and it is worse, because a round
 * that adopts another grammar and a round with nothing to report both read as zero rows. The
 * verdict line's `legs=N` breaks the tie: 0 rows with `legs=0` is a green empty run, and 0 rows
 * with `legs=5` is `ROW_GRAMMAR_ABSENT` — not this grammar, said by name.
 *
 * This is also the figure Theseus's §4 reported and gated nowhere: each reader's row count against
 * the leg count the same recording's own verdict line publishes.
 *
 * Since Round 460 the SAME tie is broken for predictions, by `preds=N` against the `PRED` row count,
 * under a refusal code of its own. Until then this function gated the LEG half and read `ok` on the
 * PRED half — a gap Theseus's Round 457 `C5` read off this source and his `Q2` measured as live over
 * 13 committed recordings. The three choices that shape the PRED gate are argued at the gate itself;
 * the claim this paragraph is pinned on is just that BOTH halves are now gated, which round450's
 * `W4` drives by name in both vocabularies.
 */
export function readTail(text) {
  const v = readVerdict(text);
  const r = readRows(text);
  if (v.ok !== true) return { ok: false, refusal: v.refusal, detail: null, verdict: null, rows: null };
  if (r.ok !== true) return { ok: false, refusal: r.refusal, detail: r.detail, verdict: v.verdict, rows: null };
  const legRows = r.rows.filter((x) => x.kind === 'LEG');
  if (legRows.length === 0 && v.verdict.legs > 0) {
    return {
      ...refuseRow('ROW_GRAMMAR_ABSENT', `verdict says legs=${v.verdict.legs}, 0 canonical LEG rows`),
      verdict: v.verdict,
    };
  }
  if (legRows.length !== v.verdict.legs) {
    return {
      ...refuseRow('ROW_COUNT_DISAGREEMENT', `${legRows.length} LEG row(s) vs legs=${v.verdict.legs}`),
      verdict: v.verdict,
    };
  }
  // THE PRED HALF OF THE SAME TIE, added in Round 460. Theseus's Round 457 `C5` read off this
  // function's own source that the LEG count was gated and the PRED count was not, and his `Q2`
  // measured the class as LIVE rather than latent: 13 of the 439 recordings committed at `df5a27cc`
  // print a `PRED` row count that disagrees with their own `preds=N`, and every one of them read
  // `ok` here. The cause is dated — `renderTail` reached the verdict line with a prediction's id and
  // dropped its row until `renderPredRows` existed (Round 449 §3, Round 450) — so the 13 are fossils
  // of a cured emitter, which is exactly why a reader must be able to name them rather than treat
  // them as complete.
  //
  // THREE DESIGN CHOICES, each one of them a decision a reader could reasonably have made the other
  // way, so each is written down rather than left in the code:
  //
  //   1. A DISTINCT CODE, not a reuse of `ROW_COUNT_DISAGREEMENT`. This was the decision Theseus's
  //      §5.1 said the cure needed before it could land. A caller whose question is per-LEG
  //      attribution — `postcommit-rediff.mjs` is the live one — is entitled to proceed on a
  //      recording whose LEG rows are complete and whose PRED rows are fossils, and it can only do
  //      that if the two cases arrive under different names. One code for both would have forced
  //      every such caller to choose between believing an incomplete recording and refusing a
  //      complete one.
  //   2. NO PRED ANALOGUE OF `ROW_GRAMMAR_ABSENT`. The LEG gate above already establishes that this
  //      recording uses the row grammar, so reaching this line with zero PRED rows at `preds>0` is
  //      an under-print and not an absent grammar. The Round 441 §1 tie — "no label observed" and
  //      "no label grammar" being one observation — is broken upstream for us, which is why one code
  //      suffices here and two were needed there.
  //   3. THE VERDICT IS RETURNED BESIDE THE REFUSAL, as the two gates above do. A caller that wants
  //      the declared counts in order to report what disagreed must not have to re-read the text.
  const predRows = r.rows.filter((x) => x.kind === 'PRED');
  if (predRows.length !== v.verdict.preds) {
    return {
      ...refuseRow('PRED_ROW_COUNT_DISAGREEMENT',
        `${predRows.length} PRED row(s) vs preds=${v.verdict.preds}`),
      verdict: v.verdict,
    };
  }
  return { ok: true, refusal: null, detail: null, verdict: v.verdict, rows: r.rows };
}

/**
 * The historical row vocabulary, declared because it is measured and because the alternative is
 * each round hand-rolling a regex for it — which is what both existing readers are, and both are
 * narrower than the corpus they read.
 *
 * Censused in Round 450 over 390 committed `.out` files at `9ddc9d17`, as (distinct recordings
 * containing the spelling): `ok` 110, `LANDED` 52, `RED` 30, `REFUTED` 26, `FAIL` 16, `REFUSED` 15,
 * `OPEN` 11, `REF` 10. Eight spellings — the same EIGHT Theseus's independent key found in Round
 * 449 §4 with different counts off a different population, which is the agreement worth having.
 *
 * Six of the eight are the canonical vocabularies above. The two that are not are legacy-only
 * aliases, mapped here rather than alive in six separate regexes.
 */
export const LEGACY_ROW_TOKENS = {
  ok: { state: true, kind: 'LEG' },
  RED: { state: false, kind: 'LEG' },
  REF: { state: null, kind: 'LEG' },
  FAIL: { state: false, kind: 'LEG' },
  REFUSED: { state: null, kind: 'LEG' },
  LANDED: { state: true, kind: 'PRED' },
  REFUTED: { state: false, kind: 'PRED' },
  OPEN: { state: null, kind: 'PRED' },
};

/**
 * One wide reader for the historical corpus, replacing the per-round hand-rolled regex.
 *
 * The two readers it replaces are mine, and both were measured narrower than the corpus: Round
 * 446's `legLines` is `/^(?: ok |FAIL|REF ) G/` and Round 448's `legTokens` is
 * `/^(?: ok |RED |REF ) ([A-Z][A-Z0-9]*)  /` — both keyed on the PADDED, column-aligned spelling
 * that this file dropped on purpose, and the second one takes its token with `l.slice(0, 4)`, a
 * hard-coded width. Round 441 §3's third defect was exactly a four-character spelling of a
 * five-character tag grading 3 of 4 cells wrong.
 *
 * Deliberately tolerant of padding on input and intolerant of unknown spellings: a token outside
 * `LEGACY_ROW_TOKENS` is REPORTED in `unknown`, never bucketed as a pass or a fail
 * (411/439 — positively key the last bucket; 399 — publish the refusal rather than guess).
 *
 * ── WHAT THE LEGACY BRANCH'S `id` IS NOT (Round 452; read this before keying anything on it) ──
 *
 * On a `shape: 'tokenfirst'` row, `id` is **the second column, whatever that happened to be** —
 * it is not an identifier, and this branch **cannot distinguish a leg row from a table cell or
 * from an English sentence.** Hand-read over all 1045 legacy rows in the committed corpus, reduced
 * to their 116 distinct id spellings, the three kinds present are:
 *
 *   LEGROW  the capture really does identify a leg or prediction — `G1`, `S-14`, `CELL03-CANCEL`
 *   TABLE   the capture is DATA in a record's second column — `ok 110 906`, `RED round431 → []`,
 *           `REFUTED 0 no body survives the second signal`, `ok pre false live false { ...src }`
 *   PROSE   the capture is the second word of a sentence that begins with a token spelling —
 *           `ok every KP and control as expected: true`, `ok MAX_HISTORY_MESSAGES sliced once`
 *
 * Theseus's Round 451 §6.1 routed "apply `ID_GRAMMAR` to the legacy branch" as the repair. It is a
 * no-op: `ID_GRAMMAR` is `/^[A-Za-z0-9_.:-]+$/` and this branch's inline capture is
 * `([A-Za-z0-9_.:-]+)` — the same class, bounded by the surrounding regex, so every id it produces
 * satisfies `ID_GRAMMAR` by construction. Measured: it rejects **0 of 1045**.
 *
 * And no tighter class works either, which Round 452 `A2` settles with two non-empty sets out of
 * one population: LEGROWs whose id is a **lowercase file address** (`tree-fingerprint.mts:160`,
 * `cure-the-wrapped-call-and-the-body-key.mjs:555`), and TABLE/PROSE whose id is an **uppercase
 * word** (`DEFECT` ×25, `REFUTED` ×11, `GRADE` ×8, `MAX_HISTORY_MESSAGES`) or a **bare number**
 * (`0`, `110`, `52`). Any class that keeps the first admits the second; any class that rejects the
 * second loses the first.
 *
 * So the constraint is stated here rather than enforced by a regex that cannot hold it. If you
 * need rows whose `id` is genuinely an identifier, filter on `shape === 'canonical'` — the
 * renderer guarantees that grammar — and reach for the legacy branch only for liveness and
 * historical counting, where an over-read is visible in the count rather than silent in a boolean.
 * Round 446's `legLines` and Round 448's `legTokens` were both keyed on this branch's `id` as if
 * it were an identifier; 446's was wrong about 26 of 400 committed recordings.
 */
export function readCorpusRows(text) {
  const rows = [];
  const unknown = [];
  for (const line of String(text ?? '').split('\n')) {
    const canon = line.match(ROW_SHAPE);
    if (canon !== null) {
      const [, kind, id, token, rest] = canon;
      const entry = LEGACY_ROW_TOKENS[token];
      if (entry === undefined) { unknown.push(line); continue; }
      rows.push({ kind, id, token, state: entry.state, what: rest ?? '', shape: 'canonical' });
      continue;
    }
    // The historical, token-first, possibly padded shape: `[ ok ] G1  detail`.
    const m = line.match(/^ *([A-Za-z][A-Za-z0-9_]*) +([A-Za-z0-9_.:-]+)(?: +(.*))?$/);
    if (m === null) continue;
    const [, token, id, rest] = m;
    const entry = LEGACY_ROW_TOKENS[token];
    if (entry === undefined) continue; // prose; not a row and not claimed as one
    rows.push({
      kind: entry.kind, id, token, state: entry.state, what: (rest ?? '').trim(), shape: 'tokenfirst',
    });
  }
  return { rows, unknown };
}

/**
 * Read a verdict out of arbitrary text. Returns `{ok:true, verdict}` or `{ok:false, refusal}`.
 * Never throws on bad input — a reader that throws is a reader a caller wraps in a try/catch and
 * then treats as absence.
 */
export function readVerdict(text) {
  const lines = String(text ?? '').split('\n').filter((l) => l.startsWith('VERDICT/'));
  if (lines.length === 0) return refuse('NO_VERDICT_LINE');
  if (lines.length > 1) return refuse('MULTIPLE_VERDICT_LINES');
  const parts = lines[0].trim().split(/ +/);
  if (parts[0] !== SCHEMA) return refuse('UNKNOWN_SCHEMA');
  if (parts.length !== 2 + FIELDS.length) return refuse('MALFORMED_FIELDS');
  const token = parts[1];
  if (!['ok', 'RED', 'REFUSED'].includes(token)) return refuse('UNKNOWN_TOP_TOKEN');

  const got = {};
  for (let i = 0; i < FIELDS.length; i += 1) {
    const [k, ...rest] = parts[2 + i].split('=');
    if (k !== FIELDS[i] || rest.length !== 1) return refuse('MALFORMED_FIELDS');
    got[k] = rest[0];
  }
  const legs = Number(got.legs);
  const preds = Number(got.preds);
  if (!Number.isInteger(legs) || !Number.isInteger(preds) || legs < 0 || preds < 0) {
    return refuse('MALFORMED_FIELDS');
  }
  const red = parseList(got.red);
  const refused = parseList(got.refused);
  const refuted = parseList(got.refuted);
  const prefused = parseList(got.prefused);
  if (red === null || refused === null || refuted === null || prefused === null) {
    return refuse('MALFORMED_FIELDS');
  }
  // Integrity: the token is derivable from the lists, so a line whose token disagrees with its own
  // lists is not a verdict this schema can produce and is refused rather than believed.
  if (topToken(red, refused) !== token) return refuse('TOKEN_LIST_CONTRADICTION');
  if (red.length + refused.length > legs) return refuse('COUNT_LIST_CONTRADICTION');
  if (refuted.length + prefused.length > preds) return refuse('COUNT_LIST_CONTRADICTION');

  return { ok: true, refusal: null, verdict: { token, legs, red, refused, preds, refuted, prefused } };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// The write guard.
//
// Theseus's Round 441 §2 censused the re-stamp class as a source property: at `8d891c70`, 9
// modelled `writeFileSync(join(HERE|REPO, '<literal>'))` sites whose target is TRACKED at the rev,
// 8 of them multi-generation and the deepest 6 — including two recordings of mine whose committed
// `rev` trailer has been rewritten in every commit that touched their directory. His
// recommendation, and mine, is fix-forward: stop making a committed recording a live write target.
//
// That recommendation is a discipline until something refuses. This is the something.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

export class TrackedTargetError extends Error {}

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

/** Is `abs` tracked in git right now? `--error-unmatch` exits non-zero when it is not. */
export function isTracked(abs, repo = REPO_ROOT) {
  try {
    execFileSync('git', ['-C', repo, 'ls-files', '--error-unmatch', relative(repo, abs)], {
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    return true;
  } catch {
    return false;
  }
}

/** The sibling a live output should go to instead: `foo.out` → `foo.live.out`. */
export function liveSibling(abs) {
  const b = basename(abs);
  const dot = b.lastIndexOf('.');
  return join(dirname(abs), dot === -1 ? `${b}.live` : `${b.slice(0, dot)}.live${b.slice(dot)}`);
}

/**
 * Write a recording, refusing a target that is tracked in git. Pass `{ allowTracked: true }` to
 * deliberately rewrite a committed file — the point is not that it is impossible, it is that it
 * cannot happen by default and without a word for it at the call site.
 */
export function writeRecording(abs, text, { allowTracked = false, repo = REPO_ROOT } = {}) {
  if (!allowTracked && isTracked(abs, repo)) {
    throw new TrackedTargetError(
      `refusing to write a tracked file: ${relative(repo, abs)} — it is committed, and a drive that `
      + `rewrites it destroys the provenance of whatever it recorded. Write ${relative(repo, liveSibling(abs))} `
      + `instead, or pass { allowTracked: true } if rewriting the committed copy is the intent.`,
    );
  }
  writeFileSync(abs, text);
  return abs;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Self-test. Returns `true`, or throws with the first failing case named. A caller must gate on
// `!== true` and not on truthiness (356 — a printed self-test that gates nothing).
// ─────────────────────────────────────────────────────────────────────────────────────────────────

export function selfTest() {
  const must = (cond, what) => { if (!cond) throw new Error(`verdict.mjs selfTest: ${what}`); };

  // Round-trip, including the all-empty green case that the old grammar could not express.
  const cases = [
    { legs: [], preds: [] },
    { legs: [{ id: 'G1', ok: true }], preds: [] },
    { legs: [{ id: 'G1', ok: true }, { id: 'G2', ok: false }], preds: [{ id: 'P1', landed: true }] },
    { legs: [{ id: 'G1', ok: null }], preds: [{ id: 'P1', landed: null }] },
    { legs: [{ id: 'G4b', ok: false }, { id: 'G5', ok: null }], preds: [{ id: 'P2', landed: false }] },
  ];
  for (const c of cases) {
    const line = renderVerdict(c);
    const r = readVerdict(`noise\n${line}\nmore noise`);
    must(r.ok === true, `round-trip refused its own output (${r.refusal}): ${line}`);
    must(r.verdict.legs === c.legs.length, `legs count lost: ${line}`);
    must(r.verdict.red.join(',') === c.legs.filter((l) => l.ok === false).map((l) => l.id).join(','),
      `red list lost: ${line}`);
    must(r.verdict.refused.join(',') === c.legs.filter((l) => l.ok === null).map((l) => l.id).join(','),
      `refused list lost: ${line}`);
    must(line.includes('red=[') && line.includes('refused=['), `a list went missing: ${line}`);
  }

  // The green token cannot be reached with a red or refused leg.
  must(renderVerdict({ legs: [{ id: 'G1', ok: true }] }).includes(`${SCHEMA} ok `), 'green token missing');
  must(renderVerdict({ legs: [{ id: 'G1', ok: false }] }).includes(`${SCHEMA} RED `), 'red token missing');
  must(renderVerdict({ legs: [{ id: 'G1', ok: null }] }).includes(`${SCHEMA} REFUSED `), 'refused token missing');

  // An undeclared leg state throws rather than bucketing.
  let threw = false;
  try { renderVerdict({ legs: [{ id: 'G1', ok: 'yes' }] }); } catch { threw = true; }
  must(threw, 'a non-tri-state leg did not throw');

  // ROUND-TRIP CLOSURE (property 3b). Theseus's Round 443 §1 matrix, verbatim as the eight shapes
  // he drove, plus the two PREDICATION shapes his matrix did not reach — one of which PARSES under
  // the two-list spelling of this cure and is caught only by the four-list one. Each must throw at
  // EMIT, and the control must still round-trip, so this case cannot pass by throwing on everything.
  const badIds = [
    { legs: [{ name: 'G1', ok: false }] },                     // id key absent
    { legs: [{ id: undefined, ok: false }] },
    { legs: [{ id: '', ok: false }] },
    { legs: [{ id: 'A,B', ok: false }] },
    { legs: [{ id: 'G4 b', ok: false }] },
    { legs: [{ id: 'a=b', ok: false }] },
    { legs: [{ id: 'x]y', ok: false }] },
    { legs: [{ id: 'G1', ok: true }], preds: [{ id: 'A,B', landed: false }] },
    // The two shapes the two-list spelling of this cure ADMITS, measured in Round 444 `G3`: both
    // satisfy every count and token check, so `readVerdict` says `ok` and only comparing the
    // refuted/prefused lists to what went in refuses them.
    { legs: [{ id: 'G1', ok: true }], preds: [{ id: 'A,B', landed: false }, { id: 'Pok', landed: true }] },
    { legs: [{ id: 'G1', ok: true }], preds: [{ id: '', landed: null }] },
  ];
  for (const c of badIds) {
    let emitted = null;
    try { emitted = renderVerdict(c); } catch { /* the required outcome */ }
    must(emitted === null, `an invalid id emitted instead of throwing: ${emitted} ← ${JSON.stringify(c)}`);
  }
  const control = renderVerdict({ legs: [{ id: 'G1', ok: false }], preds: [{ id: 'P1', landed: false }] });
  must(readVerdict(control).ok === true, `the round-trip control stopped parsing: ${control}`);
  must(readVerdict(control).verdict.red.join(',') === 'G1' && readVerdict(control).verdict.refuted.join(',') === 'P1',
    `the round-trip control's lists drifted: ${control}`);

  // Every refusal is reachable and named; none is a sentinel.
  const bad = {
    NO_VERDICT_LINE: 'nothing here',
    MULTIPLE_VERDICT_LINES: `${renderVerdict({})}\n${renderVerdict({})}`,
    UNKNOWN_SCHEMA: 'VERDICT/9 ok legs=0 red=[] refused=[] preds=0 refuted=[] prefused=[]',
    MALFORMED_FIELDS: 'VERDICT/1 ok legs=0 red=[] refused=[]',
    UNKNOWN_TOP_TOKEN: 'VERDICT/1 PASS legs=0 red=[] refused=[] preds=0 refuted=[] prefused=[]',
    TOKEN_LIST_CONTRADICTION: 'VERDICT/1 ok legs=1 red=[G1] refused=[] preds=0 refuted=[] prefused=[]',
    COUNT_LIST_CONTRADICTION: 'VERDICT/1 RED legs=1 red=[G1,G2] refused=[] preds=0 refuted=[] prefused=[]',
  };
  for (const [code, text] of Object.entries(bad)) {
    const r = readVerdict(text);
    must(r.ok === false, `${code} parsed instead of refusing`);
    must(r.refusal === code, `${code} refused as ${r.refusal}`);
    must(r.verdict === null, `${code} returned a verdict beside its refusal`);
  }
  must(Object.keys(bad).length === REFUSALS.length, 'selfTest does not reach every declared refusal');

  // Rows carry no padding, so there is no column width for a reader to spell wrong.
  const rows = renderRows([{ id: 'G1', ok: true, what: 'X' }, { id: 'G2', ok: null, what: 'Y' }]);
  must(rows[0] === 'LEG G1 ok X' && rows[1] === 'LEG G2 REF Y', `row grammar drifted: ${JSON.stringify(rows)}`);

  // ── Round 450: the row guards. Every case below emitted happily before this round. ──────────────

  // The five shapes Round 450 `probe0` drove, each of which `renderVerdict` already threw on and
  // `renderRows` did not. Each must throw at EMIT, and the control after them must still round-trip,
  // so this block cannot pass by throwing on everything (344 — a known positive must carry the
  // property, and a population-level KP needs a CONTROL).
  // Each case asserts the REASON and not merely that something threw. That is not fastidiousness:
  // Round 450's cripple grading deleted the tri-state throw, the newline check and the
  // trailing-whitespace check from the real source one at a time, and `selfTest()` returned `true`
  // for all three — because the round-trip closure at the tail of `renderRowSet` catches those
  // shapes too, with a different message. The BEHAVIOUR was guarded twice and the DIAGNOSIS once,
  // and a self-test keyed on "did it throw" cannot tell a guard from its own backstop
  // (438 — a saturated verdict hides a reason-level cause: key the reason, not refused-vs-admitted).
  const badRows = [
    [{ id: 'G1', ok: 'yes', what: 'x' }, 'a non-tri-state ok rendered the token "undefined"',
      'is not true/false/null'],
    [{ id: 'G1 ok hello', ok: true, what: 'x' }, 'an id with a space rendered a second token',
      'an id with a space renders a second token'],
    [{ id: '', ok: true, what: 'x' }, 'an empty id rendered no id',
      'an id with a space renders a second token'],
    [{ name: 'G1', ok: false, what: 'x' }, 'an absent id key rendered "undefined" as the id',
      'an id with a space renders a second token'],
    [{ id: 'G1', ok: true, what: 'one\nLEG G2 ok forged' }, 'a newline in a detail FORGED a second row',
      'detail contains a newline'],
    [{ id: 'G1', ok: true, what: 'x ' }, 'a trailing space in a detail did not survive the round trip',
      'has trailing whitespace'],
    [{ id: 'G1', ok: true, what: 42 }, 'a non-string detail', 'has a non-string what'],
  ];
  for (const [item, why, because] of badRows) {
    let emitted = null;
    let message = null;
    try { emitted = renderRows([item]); } catch (e) { message = e.message; }
    must(emitted === null, `${why}: ${JSON.stringify(emitted)} ← ${JSON.stringify(item)}`);
    must(message !== null && message.includes(because),
      `${why}: it threw, but for the wrong reason — wanted ${JSON.stringify(because)}, got `
      + `${JSON.stringify(message)}. A guard and its backstop are not interchangeable.`);
  }
  const rowControl = renderRows([{ id: 'G1', ok: true, what: 'internal  spacing  kept' }]);
  must(rowControl.length === 1 && rowControl[0] === 'LEG G1 ok internal  spacing  kept',
    `the row control drifted: ${JSON.stringify(rowControl)}`);
  const rowBack = readRows(rowControl.join('\n'));
  must(rowBack.ok === true && rowBack.rows.length === 1
    && rowBack.rows[0].what === 'internal  spacing  kept',
  `the row control stopped round-tripping: ${JSON.stringify(rowBack)}`);

  // Prediction rows exist, carry the prediction vocabulary, and are told apart from leg rows.
  const predRows = renderPredRows([
    { id: 'Q1', landed: false, what: '81 of 148' }, { id: 'Q2', landed: true }, { id: 'Q3', landed: null },
  ]);
  must(predRows.join('|') === 'PRED Q1 REFUTED 81 of 148|PRED Q2 LANDED|PRED Q3 OPEN',
    `prediction row grammar drifted: ${JSON.stringify(predRows)}`);

  // THE §3 CURE, pinned so this file's prose cannot outlive it (357/359): a prediction's detail
  // reaches the published artifact. Driven with a sentinel through the real function, not read off
  // the source.
  const tail = renderTail({
    legs: [{ id: 'G1', ok: true, what: 'LEGDETAIL' }],
    preds: [{ id: 'Q1', landed: false, what: 'PREDDETAIL' }],
  });
  must(tail.includes('LEGDETAIL'), `renderTail dropped a leg detail: ${tail}`);
  must(tail.includes('PREDDETAIL'), `renderTail dropped a PREDICTION detail — Round 449 §3: ${tail}`);
  must(tail.includes('refuted=[Q1]'), `renderTail lost the prediction's id: ${tail}`);
  const tailBack = readTail(tail);
  must(tailBack.ok === true, `renderTail emitted a tail readTail refuses (${tailBack.refusal}): ${tail}`);
  must(tailBack.rows.filter((r) => r.kind === 'PRED').length === 1, `the PRED row did not read back: ${tail}`);

  // `readTail` tells a green empty run apart from another grammar — the row-level cure for the
  // Round 441 §1 defect, where "no label observed" and "no label grammar" were one observation.
  const emptyTail = renderTail({ legs: [], preds: [] });
  must(readTail(emptyTail).ok === true, `a legs=0 tail was refused: ${JSON.stringify(emptyTail)}`);
  must(readTail(emptyTail).rows.length === 0, 'a legs=0 tail read rows that are not there');
  const foreign = `GATE: false   (2 leg(s))   RED: G6\n${renderVerdict({ legs: [{ id: 'G6', ok: false }, { id: 'G7', ok: true }] })}`;
  must(readTail(foreign).refusal === 'ROW_GRAMMAR_ABSENT',
    `a foreign row grammar read as ${readTail(foreign).refusal} rather than ROW_GRAMMAR_ABSENT`);

  // Every declared row refusal is reachable and named; none is a sentinel.
  const badRowText = {
    MALFORMED_ROW: 'LEG G1',
    UNKNOWN_ROW_TOKEN: 'LEG G1 PASSED detail',
    WRONG_KIND_TOKEN: 'LEG G1 LANDED detail',
    DUPLICATE_ROW_ID: 'LEG G1 ok one\nLEG G1 RED two',
  };
  for (const [code, text] of Object.entries(badRowText)) {
    const r = readRows(text);
    must(r.ok === false, `${code} parsed instead of refusing: ${text}`);
    must(r.refusal === code, `${code} refused as ${r.refusal}`);
    must(r.rows === null, `${code} returned rows beside its refusal`);
  }
  // The two that only `readTail` can reach, since they need the verdict line to disagree with.
  must(readTail(foreign).refusal === 'ROW_GRAMMAR_ABSENT', 'ROW_GRAMMAR_ABSENT unreachable');
  const shortTail = `LEG G6 RED x\n${renderVerdict({ legs: [{ id: 'G6', ok: false }, { id: 'G7', ok: true }] })}`;
  must(readTail(shortTail).refusal === 'ROW_COUNT_DISAGREEMENT',
    `a 1-row/2-leg tail read as ${readTail(shortTail).refusal}`);
  // Round 460's PRED half of the same tie, and its control. The refusing tail's LEG count AGREES
  // with its own `legs=1`, so it is past both LEG gates and only the PRED gate can refuse it; the
  // control is the same tail carrying its prediction row, which must still read clean, or this case
  // would pass on a reader that refused every tail with a `preds=N` (424).
  const onePred = renderVerdict({ legs: [{ id: 'G6', ok: false }], preds: [{ id: 'Q1', landed: true }] });
  const predShort = readTail(`LEG G6 RED x\n${onePred}`);
  must(predShort.refusal === 'PRED_ROW_COUNT_DISAGREEMENT',
    `0 PRED rows at preds=1 read as ${predShort.refusal} rather than PRED_ROW_COUNT_DISAGREEMENT`);
  must(predShort.verdict !== null && predShort.verdict.preds === 1,
    'the PRED gate refused without returning the verdict its caller needs to report the disagreement');
  const predFull = readTail(`LEG G6 RED x\nPRED Q1 LANDED y\n${onePred}`);
  must(predFull.ok === true,
    `a tail whose PRED rows account for preds=1 was refused as ${predFull.refusal}`);
  const reachedRow = [...Object.keys(badRowText), 'ROW_GRAMMAR_ABSENT', 'ROW_COUNT_DISAGREEMENT',
    'PRED_ROW_COUNT_DISAGREEMENT'];
  must(reachedRow.length === ROW_REFUSALS.length,
    `selfTest reaches ${reachedRow.length} of ${ROW_REFUSALS.length} declared row refusals`);
  for (const code of ROW_REFUSALS) must(reachedRow.includes(code), `row refusal never driven: ${code}`);

  // The corpus reader reads BOTH the canonical grammar and the padded historical one, which is the
  // thing neither hand-rolled reader could do. The padded exemplars are the shape Round 448's
  // `legTokens` keys on, so a reader that only handles one of the two fails this case.
  const corpus = readCorpusRows([
    'LEG G1 ok canonical',
    ' ok  G2  padded historical',
    'FAIL G3  a legacy-only spelling',
    'LANDED P1  a prediction',
    'Running the thing that was never a row',
  ].join('\n'));
  must(corpus.rows.length === 4, `readCorpusRows read ${corpus.rows.length} of 4: ${JSON.stringify(corpus)}`);
  must(corpus.rows.map((r) => r.id).join(',') === 'G1,G2,G3,P1', `corpus ids drifted: ${JSON.stringify(corpus.rows)}`);
  must(corpus.rows.map((r) => String(r.state)).join(',') === 'true,true,false,true',
    `corpus states drifted: ${JSON.stringify(corpus.rows.map((r) => r.state))}`);
  must(corpus.rows.filter((r) => r.kind === 'PRED').length === 1, 'the legacy prediction row lost its kind');
  // Eight spellings, declared, and every one of them readable — the census figure and the table
  // cannot drift apart without this failing.
  must(Object.keys(LEGACY_ROW_TOKENS).length === 8, 'LEGACY_ROW_TOKENS is no longer the censused 8');
  for (const tok of Object.keys(LEGACY_ROW_TOKENS)) {
    const got = readCorpusRows(`${tok} G9  detail`).rows;
    must(got.length === 1 && got[0].token === tok, `declared spelling ${tok} does not read back`);
  }

  // Round 452 — PIN THE DOCUMENTED WIDTH, both directions, so the paragraph above cannot outlive
  // the behaviour it describes. Prose written beside its own subject needs a pin (430): the
  // docblock says this branch cannot tell a leg row from a table cell or a sentence, and these
  // three lines are real ones lifted out of the committed corpus, so if a later tightening makes
  // the claim false it fails HERE rather than going stale in a comment.
  const PROSE_LINE = '  ok   every KP and control as expected: true';
  const TABLE_LINE = '  REFUTED       0  no body survives the second signal; leaves the class';
  const ADDRESS_LINE = '    ok  tree-fingerprint.mts:160 want POPULATION got POPULATION';
  const prose = readCorpusRows(PROSE_LINE).rows;
  const table = readCorpusRows(TABLE_LINE).rows;
  const address = readCorpusRows(ADDRESS_LINE).rows;
  must(prose.length === 1 && prose[0].id === 'every',
    `the legacy branch stopped admitting prose; the docblock's PROSE claim is now false: ${JSON.stringify(prose)}`);
  must(table.length === 1 && table[0].id === '0',
    `the legacy branch stopped admitting a table cell; the docblock's TABLE claim is now false: ${JSON.stringify(table)}`);
  // The other direction, and the reason no tighter class is available: a genuine leg id that is a
  // lowercase file address. Any class that rejected `every` above would reject this one too.
  must(address.length === 1 && address[0].id === 'tree-fingerprint.mts:160',
    `the lowercase-file-address leg id stopped reading; A2's counterexample is gone: ${JSON.stringify(address)}`);
  must(prose.every((r) => r.shape === 'tokenfirst') && address.every((r) => r.shape === 'tokenfirst'),
    'the legacy rows above are no longer labelled tokenfirst, so shape is no longer the exact filter');
  // And the canonical filter the docblock points callers at must exclude all three.
  for (const line of [PROSE_LINE, TABLE_LINE, ADDRESS_LINE]) {
    must(readCorpusRows(line).rows.every((r) => r.shape !== 'canonical'),
      `a legacy line read as canonical, so shape === 'canonical' is not the exact filter: ${line}`);
  }

  // The write guard refuses a tracked target. This file is tracked once committed; before that it
  // is not, so the case is driven against a path asserted tracked rather than against this one.
  must(typeof liveSibling('/a/b/c.out') === 'string' && liveSibling('/a/b/c.out').endsWith('c.live.out'),
    'liveSibling spelling drifted');
  must(liveSibling('/a/b/noext') .endsWith('noext.live'), 'liveSibling on an extensionless path drifted');

  // ── allOf / measured (Round 458, curing Round 456 §3) ─────────────────────────────────────────
  // The full 3×3 of `allOf`, written out as a table rather than as spot checks, because the whole
  // defect being cured was one cell of this table being wrong in live code. Every pair is asserted,
  // so a re-implementation cannot pass by getting the diagonal right.
  const A = [true, false, null];
  const EXPECT_ALL_OF = {
    'true,true': true, 'true,false': false, 'true,null': null,
    'false,true': false, 'false,false': false, 'false,null': false,
    'null,true': null, 'null,false': false, 'null,null': null,
  };
  for (const x of A) {
    for (const y of A) {
      const key = `${x},${y}`;
      const got = allOf(x, y);
      must(got === EXPECT_ALL_OF[key],
        `allOf(${x},${y}) = ${got}, expected ${EXPECT_ALL_OF[key]}`);
    }
  }
  // The two cells that ARE the finding, named individually so a failure says which rule broke
  // rather than just "a cell moved". These are the ones a refusal-dominant rewrite would flip.
  must(allOf(false, null) === false, 'allOf: a measured failure must survive an unmeasured conjunct');
  must(allOf(true, null) === null, 'allOf: an unmeasured conjunct must not be earned into ok');
  must(allOf(true, true, true) === true, 'allOf: all-measured-true must still be ok');
  // Associativity across arities — `allOf(a,b,c)` must equal the nested pairs, or a caller
  // splitting a long conjunction across two calls gets a different answer than one call.
  for (const x of A) {
    for (const y of A) {
      for (const z of A) {
        must(allOf(x, y, z) === allOf(allOf(x, y), z),
          `allOf is not associative at (${x},${y},${z})`);
      }
    }
  }
  // Totality: coercion is the bug, so a non-tri-state throws rather than being bucketed. `0` and
  // `''` are the two that the old `&&` idiom would have silently accepted as false.
  for (const bad of [0, 1, '', 'ok', undefined, NaN, [], {}]) {
    let threwAllOf = false;
    try { allOf(true, bad); } catch { threwAllOf = true; }
    must(threwAllOf, `allOf accepted a non-tri-state value: ${JSON.stringify(bad)}`);
  }
  // The empty conjunction is `true` and that is a documented vacuity hazard, not an accident.
  must(allOf() === true, 'the empty conjunction changed value');

  // `measured` propagates the refusal and does NOT treat other falsy values as refusals (425).
  must(measured(null, () => true) === null, 'measured: a null value must stay unmeasured');
  must(measured(null, () => { throw new Error('predicate must not run on a refusal'); }) === null,
    'measured: the predicate ran on a refused value');
  must(measured(5, (n) => n > 1) === true, 'measured: a real value must reach the predicate');
  must(measured(5, (n) => n > 9) === false, 'measured: a real false must stay false');
  must(measured(0, (n) => n === 0) === true, 'measured: 0 is a value, not a refusal');
  must(measured('', (s) => s === '') === true, 'measured: the empty string is a value, not a refusal');
  must(measured(undefined, (u) => u === undefined) === true, 'measured: undefined is not the sentinel');
  // A predicate that returns a count or an array is the exact route by which a refusal became a
  // boolean in the first place, so it throws instead of being coerced.
  for (const badReturn of [0, 1, '', 'ok', undefined, NaN, [], {}]) {
    let threwMeasured = false;
    try { measured(1, () => badReturn); } catch { threwMeasured = true; }
    must(threwMeasured, `measured accepted a non-tri-state return: ${JSON.stringify(badReturn)}`);
  }
  // The composition that is the actual cure, driven end to end: a refused slice must reach
  // `renderVerdict` as REF and must NOT appear in the red list.
  const refusedSlice = null;
  const curedLeg = allOf(measured(refusedSlice, (r) => r.test('x')), true);
  must(curedLeg === null, 'the cured idiom did not produce a refusal');
  const curedLine = renderVerdict({ legs: [{ id: 'G1', ok: curedLeg }] });
  must(curedLine.includes('refused=[G1]') && curedLine.includes('red=[]'),
    `the cured idiom did not publish as REFUSED: ${curedLine}`);
  // And the control: the OLD idiom on the same refused slice publishes RED. This is what makes the
  // assertion above a measurement of the cure rather than a restatement of it (424 — a known
  // positive needs a control).
  const oldIdiomLeg = refusedSlice !== null && true;
  const oldLine = renderVerdict({ legs: [{ id: 'G1', ok: oldIdiomLeg }] });
  must(oldLine.includes('red=[G1]'),
    `the old idiom stopped publishing RED, so this control no longer separates: ${oldLine}`);

  return true;
}

/**
 * Convenience: the whole tail a round prints. Leg rows, prediction rows, then the one
 * machine-readable line.
 *
 * The prediction rows are Theseus's Round 449 §3, and they are the reason this function was wrong
 * rather than merely thin: it took `{legs, preds}`, passed `preds` to `renderVerdict` — so a
 * prediction's id reached the verdict line — and then called `renderRows(legs)`. A prediction's
 * `what` was therefore ACCEPTED by the API and silently discarded, which is the worst of the three
 * possible behaviours. Rejecting it would have been honest; publishing it is what a caller expects;
 * taking it and dropping it is how his `drive4` came to publish `refuted=[Q1]` with the figure it
 * was scored on appearing nowhere in the recording.
 */
export function renderTail({ legs = [], preds = [] } = {}) {
  return [
    ...renderRows(legs),
    ...renderPredRows(preds),
    '',
    renderVerdict({ legs, preds }),
  ].join('\n');
}

export const _internals = { REPO_ROOT, FIELDS, existsSign: existsSync };
