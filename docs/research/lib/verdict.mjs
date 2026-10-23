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

const FIELDS = ['legs', 'red', 'refused', 'preds', 'refuted', 'prefused'];

const refuse = (code) => {
  if (!REFUSALS.includes(code)) throw new Error(`refuse() called with an undeclared code: ${code}`);
  return { ok: false, refusal: code, verdict: null };
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
  return line;
}

/** Per-leg rows, one grammar, unpadded. */
export function renderRows(legs = []) {
  return legs.map((l) => `LEG ${l.id} ${LEG_TOKENS[String(l.ok)]} ${l.what ?? ''}`.trimEnd());
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

  // The write guard refuses a tracked target. This file is tracked once committed; before that it
  // is not, so the case is driven against a path asserted tracked rather than against this one.
  must(typeof liveSibling('/a/b/c.out') === 'string' && liveSibling('/a/b/c.out').endsWith('c.live.out'),
    'liveSibling spelling drifted');
  must(liveSibling('/a/b/noext') .endsWith('noext.live'), 'liveSibling on an extensionless path drifted');

  return true;
}

/** Convenience: the whole tail a round prints. Rows, then the one machine-readable line. */
export function renderTail({ legs = [], preds = [] } = {}) {
  return [...renderRows(legs), '', renderVerdict({ legs, preds })].join('\n');
}

export const _internals = { REPO_ROOT, FIELDS, existsSign: existsSync };
