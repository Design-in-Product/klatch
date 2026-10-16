/**
 * Round 401 — the branch-polarity axis his Round 400 §4 states and does not count.
 *
 * ## What this takes
 *
 * His §4, verbatim, the only item either of us left on the table:
 *
 *   > **Branch polarity is unmeasured and I am not claiming it is absent.** A site can be guarded in
 *   > the wrong *sense* — `if (at === -1) { … s.slice(at) … }`, the slice inside the refusal branch —
 *   > and that reads GUARDED under all four of my modes, because `pos` accepts any guard above the
 *   > site and has no branch model. Measuring it needs a model neither of us has built. Stated, not
 *   > counted.
 *
 * He is right that none of the four modes can see it, and right about why: `pos` is offset order.
 * A guard at an offset below the site is rejected; a guard at an offset above it is accepted
 * **whatever branch the site is in**, including the branch that only runs when the index refused.
 * So this is the fifth mode, and it is the first one in this family that needs a *structure* model
 * rather than a position or a name.
 *
 * ## The model, in one paragraph
 *
 * Each accepted guard is asked two questions. **Polarity:** is the comparison true when the finder
 * REFUSED (`=== -1`, `< 0`, `0 > name`, `<= -1`) or true when it FOUND (`!== -1`, `>= 0`, `> -1`,
 * `~name`)? **Region:** does the site fall inside the consequent of the construct the guard heads,
 * inside its `else`, or after the whole thing? Cross the two and a guard protects the site iff the
 * site is reachable ONLY when the index was found:
 *
 *   | polarity      | site in consequent | site in `else` | site after the construct              |
 *   |---------------|--------------------|----------------|---------------------------------------|
 *   | refusal-true  | **WRONG SENSE**    | protects       | protects iff the branch EXITS/REPAIRS |
 *   | found-true    | protects           | **WRONG SENSE**| protects iff the `else` EXITS/REPAIRS |
 *
 * Two constructs carry it: `if (…) … else …` (and `while`), and the ternary `cond ? … : …`. The
 * ternary is not an optional extra — it is the shape of his own cure and of my KP-2, so a model
 * without it would call the cured form unguarded and report a false defect in the one place the
 * corpus is known to be right.
 *
 * **REPAIRS is a third outcome and leaving it out was the first thing that would have made this
 * leg lie.** `if (at === -1) at = 0;` is a refusal branch that neither exits nor contains the site,
 * and the site after it is *perfectly safe* — the name has been overwritten. A model with only
 * EXITS would have published it as a NON-EXITING defect. It gets its own fixture (S-7).
 *
 * ## Every refusal leans toward PROTECTS, deliberately
 *
 * A guard whose polarity the table above cannot classify (`name >= -1`, always true; `name < -1`,
 * never true), or whose condition is compound (`if (at === -1 || x)`), or whose consequent this
 * reader cannot span, is **counted as protecting** and reported in its own bucket. That is the only
 * direction a leg whose headline is "the floor is higher still" may fail in: a key that fails toward
 * a FALSE defect is the trap (340), and the previous two rounds in this thread both leaned this way
 * on purpose (my 399 §2, his 400 §4). The unmodelled bucket is printed with a count so a reader can
 * see how much of the corpus the model did not reach, rather than inferring it from silence.
 *
 * `exits()` and `repairs()` lean the same way: `exits()` matches a `return` anywhere in the
 * consequent including one inside a nested callback that does not leave the enclosing function, and
 * `repairs()` would accept an arrow parameter named for the index. Both over-accept, both make a
 * site read protected, both keep the count a floor.
 *
 * `guardedAtBinding` — the initializer testing the finder's own result — is untouched here exactly
 * as it was untouched in all four of his modes. It is correctly scoped already and a tightening that
 * reached it would be an overreach; S-12 is the fixture that says so.
 *
 * ## What is pinned and where
 *
 * GRADE A reproduces **his** Round 400 figures under **his** key, at the rev his own `.out` names —
 * not his counts, his rows: the four-mode table, the identity of the one mover, the two FAILS OPEN
 * members under `both`, and all eight bind-rejection rows, parsed out of his `.out` rather than
 * restated from his memo (395). It drives in a detached worktree at that rev (389), because this
 * file contains window calls on named bindings and joins the population the moment it is committed
 * — a member-level comparison against a live population would redden on its own promotion (377).
 *
 * ## Written down before anything drove
 *
 * My expectation for the live population: **0 wrong-sense sites and 0-2 non-exiting ones.** The
 * wrong-sense shape is the kind a reader catches, and four rounds of this thread have found the
 * corpus tighter than each round's caveat implied. Recording it because the only reason the
 * non-monotone row surfaced in Round 385 was that the expectation I wrote down was wrong (386).
 */

import { readFileSync, existsSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const REPO = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const HEAD = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO, encoding: 'utf8' }).trim();

const HIS_OUT = join(REPO, 'docs/research/round400-instruments/regrade-the-file-scoped-guard.out');

// His constants, unchanged across three rounds now. A different threshold makes the strata
// incomparable and a different WINDOW set makes the denominators incomparable.
const FINDER = /\.(?:indexOf|lastIndexOf|search|findIndex)\s*\(/;
const WINDOW = /\.(slice|substring|substr)\s*\(/g;
const BINDING = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*/g;
const SAMPLE_LEN = 200;
const SAMPLE = 'x'.repeat(SAMPLE_LEN);

// ── primitives, unchanged from 399/400 ───────────────────────────────────────────────────────────

const callEnd = (masked, open) => {
  let depth = 0;
  for (let i = open; i < masked.length; i += 1) {
    const c = masked[i];
    if (c === '(' || c === '[' || c === '{') depth += 1;
    else if (c === ')' || c === ']' || c === '}') {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
  }
  return null;
};

const splitArgs = (inner) => {
  const args = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < inner.length; i += 1) {
    const c = inner[i];
    if (c === '(' || c === '[' || c === '{') depth += 1;
    else if (c === ')' || c === ']' || c === '}') depth -= 1;
    else if (c === ',' && depth === 0) { args.push(inner.slice(start, i)); start = i + 1; }
  }
  args.push(inner.slice(start));
  return args.map((a) => a.trim());
};

const initRefusal = (init) => {
  const m = /\.(?:indexOf|lastIndexOf|search|findIndex)\s*\(/.exec(init);
  if (!m) return null;
  const open = m.index + m[0].length - 1;
  const end = callEnd(init, open);
  if (end === null) return null;
  const before = init.slice(0, m.index).trim();
  const after = init.slice(end).trim();
  if (/[+\-*/%?:]/.test(before)) return null;
  if (after === '') return -1;
  const a = /^([+-])\s*(\d+)$/.exec(after);
  if (!a) return null;
  return a[1] === '+' ? -1 + Number(a[2]) : -1 - Number(a[2]);
};

const refusalValue = (arg, name, nameVal) => {
  const bare = new RegExp(`^${name}$`);
  const arith = new RegExp(`^${name}\\s*([+-])\\s*(\\d+)$`);
  if (bare.test(arg)) return nameVal;
  const m = arith.exec(arg);
  if (m) return m[1] === '+' ? nameVal + Number(m[2]) : nameVal - Number(m[2]);
  if (/^-?\d+$/.test(arg)) return Number(arg);
  return null;
};

const windowLenOnRefusal = (method, a, b) => {
  if (method === 'slice') return b === undefined ? SAMPLE.slice(a).length : SAMPLE.slice(a, b).length;
  if (method === 'substring') return b === undefined ? SAMPLE.substring(a).length : SAMPLE.substring(a, b).length;
  return b === undefined ? SAMPLE.substr(a).length : SAMPLE.substr(a, b).length;
};

const stratumOf = (len) => (len <= 1 ? 'FAILS OPEN' : len >= SAMPLE_LEN - 1 ? 'FAILS WIDE' : `FAILS PARTIAL (${len}/${SAMPLE_LEN})`);

// His guard alternation with `g`, so each match's OFFSET and TEXT are both reachable. The text is
// what the polarity model reads; his version only ever asked whether a match existed.
const guardRe = (name) => {
  const n = name.replace(/[$]/g, '\\$');
  return new RegExp(
    `\\b${n}\\s*(?:===|!==|==|!=|<|>|<=|>=)\\s*-\\s*1\\b`
    + `|\\b-\\s*1\\s*(?:===|!==|==|!=|<|>|<=|>=)\\s*${n}\\b`
    + `|\\b${n}\\s*(?:<|>=)\\s*0\\b`
    + `|\\b0\\s*(?:>|<=)\\s*${n}\\b`
    + `|~\\s*${n}\\b`,
    'g',
  );
};

// ── the branch-polarity model ────────────────────────────────────────────────────────────────────

/**
 * REFUSAL-TRUE: the comparison holds when the finder refused. FOUND-TRUE: it holds when the finder
 * found something. `null`: neither — `name >= -1` is always true and `name < -1` never is, and
 * assigning either of them a sense would be exactly the guess my own 399 refused to make about a
 * compound initializer. Whitespace is stripped first so `at === - 1` and `at===-1` are one shape.
 *
 * Two-character operators are listed before one-character ones in every alternation; a class that
 * matched `<` before `<=` would silently classify `at <= -1` as the unmodelled `at < -1`, which is
 * the shape of a detector failing by returning a smaller number (398).
 */
const polarityOf = (text) => {
  const t = text.replace(/\s+/g, '');
  if (/^~/.test(t)) return 'found-true';
  let m = /^[A-Za-z_$][\w$]*(===|!==|==|!=|<=|>=|<|>)-1$/.exec(t);
  if (m) {
    return ({
      '===': 'refusal-true', '==': 'refusal-true', '<=': 'refusal-true',
      '!==': 'found-true', '!=': 'found-true', '>': 'found-true',
      '<': null, '>=': null,
    })[m[1]] ?? null;
  }
  m = /^-1(===|!==|==|!=|<=|>=|<|>)[A-Za-z_$][\w$]*$/.exec(t);
  if (m) {
    return ({
      '===': 'refusal-true', '==': 'refusal-true', '>=': 'refusal-true',
      '!==': 'found-true', '!=': 'found-true', '<': 'found-true',
      '>': null, '<=': null,
    })[m[1]] ?? null;
  }
  m = /^[A-Za-z_$][\w$]*(<|>=)0$/.exec(t);
  if (m) return m[1] === '<' ? 'refusal-true' : 'found-true';
  m = /^0(>|<=)[A-Za-z_$][\w$]*$/.exec(t);
  if (m) return m[1] === '>' ? 'refusal-true' : 'found-true';
  return null;
};

// The innermost bracket still open at `off`, scanning left. Returns its offset, or -1.
const innermostOpen = (masked, off) => {
  let depth = 0;
  for (let i = off - 1; i >= 0; i -= 1) {
    const c = masked[i];
    if (c === ')' || c === ']' || c === '}') depth += 1;
    else if (c === '(' || c === '[' || c === '{') {
      if (depth === 0) return i;
      depth -= 1;
    }
  }
  return -1;
};

// The identifier immediately left of `i`, whitespace skipped. '' if the char there is not a word char.
const prevToken = (masked, i) => {
  let j = i - 1;
  while (j >= 0 && /\s/.test(masked[j])) j -= 1;
  const end = j + 1;
  while (j >= 0 && /[\w$]/.test(masked[j])) j -= 1;
  return masked.slice(j + 1, end);
};

// The statement starting at or after `from`: a balanced `{…}` block, or a single statement running
// to the first `;` at depth 0. `null` when neither can be spanned — which is the UNMODELLED path and
// therefore the lenient one.
const stmtSpan = (masked, from) => {
  let i = from;
  while (i < masked.length && /\s/.test(masked[i])) i += 1;
  if (masked[i] === '{') {
    const e = callEnd(masked, i);
    return e === null ? null : { from: i, to: e };
  }
  let depth = 0;
  for (let j = i; j < masked.length; j += 1) {
    const c = masked[j];
    if (c === '(' || c === '[' || c === '{') depth += 1;
    else if (c === ')' || c === ']' || c === '}') { if (depth === 0) return null; depth -= 1; }
    else if (c === ';' && depth === 0) return { from: i, to: j + 1 };
  }
  return null;
};

// The `else` arm after a consequent ending at `to`, or null. An `else if (…)` chain spans to the
// first `;` at depth 0 and usually fails to span at all, which lands in UNMODELLED.
const elseAfter = (masked, to) => {
  let i = to;
  while (i < masked.length && /\s/.test(masked[i])) i += 1;
  if (masked.slice(i, i + 4) !== 'else') return null;
  if (/[\w$]/.test(masked[i + 4] ?? '')) return null;
  return stmtSpan(masked, i + 4);
};

/**
 * The ternary whose TEST is exactly the guard at [gAt, gEnd). Returns the consequent and alternate
 * spans, or null.
 *
 * "Exactly" is checked by OFFSET, not by removing the guard's text from the test: a correction that
 * re-spells what it grades is how a detector re-trips on its own repair (371). Left of the guard
 * there must be an expression opener (`=`, `(`, `{`, `,`, `;`, `return`, `=>`); right of it,
 * whitespace up to the `?`. Anything else is a compound test and lands in UNMODELLED.
 *
 * `??` and `?.` are excluded — a nullish coalescing operator is not a ternary and reading one as a
 * ternary would hand this model an alternate span that is not an alternate.
 */
const ternaryOn = (masked, gAt, gEnd) => {
  const left = prevToken(masked, gAt);
  let p = gAt - 1;
  while (p >= 0 && /\s/.test(masked[p])) p -= 1;
  const leftChar = p >= 0 ? masked[p] : '';
  const openerChar = ['=', '(', '{', ',', ';', '>'].includes(leftChar) && masked[p - 1] !== '=';
  if (!openerChar && left !== 'return') return null;

  let q = -1;
  for (let i = gEnd; i < masked.length; i += 1) {
    const c = masked[i];
    if (/\s/.test(c)) continue;
    if (c === '?' && masked[i + 1] !== '?' && masked[i + 1] !== '.') { q = i; break; }
    // A closer or a separator ends the expression: there is no ternary here at all.
    if (')];},;'.includes(c)) return null;
    // Anything else is an operator continuing the test, which makes it COMPOUND. That is a
    // different refusal from "no ternary here", and the two were one label until a hand-read of
    // `round382:453` — `v2From < 0 || v2To < 0 ? null : v2Src.slice(v2From, …)` — printed as
    // "heads neither an if/while nor a ternary" when it heads a ternary whose test this reader
    // cannot compose. Same verdict, different audit instruction.
    return { compound: true };
  }
  if (q === -1) return null;

  let nested = 0;
  let depth = 0;
  for (let j = q + 1; j < masked.length; j += 1) {
    const c = masked[j];
    if (c === '(' || c === '[' || c === '{') depth += 1;
    else if (c === ')' || c === ']' || c === '}') { if (depth === 0) return null; depth -= 1; }
    else if (depth === 0 && c === '?' && masked[j + 1] !== '?' && masked[j + 1] !== '.') nested += 1;
    else if (depth === 0 && c === ':') {
      if (nested > 0) { nested -= 1; continue; }
      let d = 0;
      for (let e = j + 1; e < masked.length; e += 1) {
        const z = masked[e];
        if (z === '(' || z === '[' || z === '{') d += 1;
        else if (z === ')' || z === ']' || z === '}') {
          if (d === 0) return { consequent: { from: q + 1, to: j }, alternate: { from: j + 1, to: e } };
          d -= 1;
        } else if (d === 0 && (z === ';' || z === ',')) {
          return { consequent: { from: q + 1, to: j }, alternate: { from: j + 1, to: e } };
        }
      }
      return null;
    }
  }
  return null;
};

const exits = (t) => /\b(?:return|throw|continue|break)\b/.test(t) || /\bprocess\s*\.\s*exit\s*\(/.test(t);
const repairs = (t, name) => new RegExp(`\\b${name.replace(/[$]/g, '\\$')}\\s*=[^=]`).test(t);

/**
 * Does this one guard actually keep the site off the refusal path? Returns
 * `{ protects, why, bucket }`. `bucket` is `'sense'` for a classified decision, `'unmodelled'` for
 * a guard the model could not reach — and an unmodelled guard always protects, so the bucket exists
 * to be COUNTED rather than to change the verdict.
 */
export const guardProtects = (masked, gAt, gText, siteOff, name) => {
  const pol = polarityOf(gText);
  if (pol === null) return { protects: true, why: `UNMODELLED polarity: \`${gText.replace(/\s+/g, ' ')}\``, bucket: 'unmodelled' };
  const gEnd = gAt + gText.length;

  const open = innermostOpen(masked, gAt);
  const head = open >= 0 && masked[open] === '(' ? prevToken(masked, open) : '';
  const isCond = /^(?:if|while)$/.test(head);

  // A `for` header is three clauses, not one condition, so the offset-emptiness test below would
  // call every one of them "compound" — true of the header, false of the clause, and a label that
  // is false about the construct sends an audit to the wrong place. Both live instances are a guard
  // filling clause 2 exactly (`for (let i = kept.indexOf('MEAS'); i !== -1; i = …)`), hand-read as
  // genuinely cured because the body runs only while the finder found something. They keep the
  // lenient PROTECTS default and get an honest name.
  //
  // RESIDUAL, stated rather than built: a three-clause model would classify these instead of
  // excusing them, and would then catch the one shape this leniency cannot — a loop that runs only
  // while the index refused, `for (let i = s.indexOf('X'); i === -1; …)`, with a window inside. That
  // is representable and absurd, it does not occur here, and it is an open item of mine.
  if (head === 'for') return { protects: true, why: 'UNMODELLED: a for-loop header clause', bucket: 'unmodelled' };

  let cons = null;
  let alt = null;
  let ternary = false;
  if (isCond) {
    const close = callEnd(masked, open);
    if (close === null) return { protects: true, why: 'UNMODELLED: condition never closes', bucket: 'unmodelled' };
    if (masked.slice(open + 1, gAt).trim() !== '' || masked.slice(gEnd, close - 1).trim() !== '') {
      return { protects: true, why: 'UNMODELLED: compound condition', bucket: 'unmodelled' };
    }
    cons = stmtSpan(masked, close);
    if (cons === null) return { protects: true, why: 'UNMODELLED: consequent cannot be spanned', bucket: 'unmodelled' };
    alt = elseAfter(masked, cons.to);
  } else {
    const t = ternaryOn(masked, gAt, gEnd);
    if (t === null) return { protects: true, why: 'UNMODELLED: guard heads neither an if/while nor a ternary', bucket: 'unmodelled' };
    if (t.compound === true) return { protects: true, why: 'UNMODELLED: compound ternary test', bucket: 'unmodelled' };
    cons = t.consequent;
    alt = t.alternate;
    ternary = true;
  }

  const inCons = siteOff >= cons.from && siteOff < cons.to;
  const inAlt = alt !== null && siteOff >= alt.from && siteOff < alt.to;
  const consText = masked.slice(cons.from, cons.to);
  const altText = alt === null ? '' : masked.slice(alt.from, alt.to);

  // A TERNARY is an expression, not a statement: code outside its two arms was never under its
  // control, so "the site is somewhere else in the function" is OUT OF SCOPE and not NON-EXITING.
  // Both refuse to protect, so the verdict is the same either way — but the first version of this
  // model printed `backfill-entity-bindings.mts:190` as "refusal branch neither exits nor repairs"
  // about `const typed = (eq === -1 ? token : token.slice(0, eq))`, which has no branch to fall out
  // of. A row whose reason is wrong sends an audit to the wrong line even when its verdict is right.
  const outOfScope = ternary && !inCons && !inAlt;

  if (pol === 'refusal-true') {
    if (inCons) return { protects: false, why: 'WRONG SENSE: the site is inside the refusal branch', bucket: 'sense' };
    if (inAlt) return { protects: true, why: 'site is in the else/alternate of a refusal test', bucket: 'sense' };
    if (outOfScope) return { protects: false, why: 'OUT OF SCOPE: a ternary test, and the site is in neither arm', bucket: 'sense' };
    if (exits(consText)) return { protects: true, why: 'refusal branch exits', bucket: 'sense' };
    if (repairs(consText, name)) return { protects: true, why: 'refusal branch repairs the index', bucket: 'sense' };
    return { protects: false, why: 'NON-EXITING: refusal branch neither exits nor repairs, and the site is after it', bucket: 'sense' };
  }
  if (inCons) return { protects: true, why: 'site is inside the found branch', bucket: 'sense' };
  if (inAlt) return { protects: false, why: 'WRONG SENSE: the site is inside the else/alternate of a found test', bucket: 'sense' };
  if (outOfScope) return { protects: false, why: 'OUT OF SCOPE: a ternary test, and the site is in neither arm', bucket: 'sense' };
  if (altText !== '' && (exits(altText) || repairs(altText, name))) {
    return { protects: true, why: 'the other arm of the found test exits or repairs', bucket: 'sense' };
  }
  return { protects: false, why: 'NON-EXITING: the found test does not exit on the refusal path, and the site is after it', bucket: 'sense' };
};

// ── the key: his four modes plus `sense` ─────────────────────────────────────────────────────────

export const namedBindingSites = (src, mode) => {
  const masked = stripSource(src, true);
  const lineAt = (off) => masked.slice(0, off).split('\n').length;
  const out = [];

  const bindings = [];
  BINDING.lastIndex = 0;
  for (let m = BINDING.exec(masked); m; m = BINDING.exec(masked)) {
    const name = m[1];
    const eq = m.index + m[0].length;
    let depth = 0;
    let end = -1;
    for (let i = eq; i < masked.length; i += 1) {
      const c = masked[i];
      if (c === '(' || c === '[' || c === '{') depth += 1;
      else if (c === ')' || c === ']' || c === '}') depth -= 1;
      else if (c === ';' && depth === 0) { end = i; break; }
    }
    if (end === -1) continue;
    const init = masked.slice(eq, end);
    const guardedAtBinding = /(===|!==|==|!=|<|>|<=|>=)\s*-\s*1|-\s*1\s*(===|!==|==|!=)|<\s*0|>=\s*0/.test(init);
    bindings.push({ name, at: m.index, initFrom: eq, initTo: end, guardedAtBinding, hasFinder: FINDER.test(init) });
  }
  if (!bindings.some((b) => b.hasFinder)) return out;

  const resolve = (name, off) => {
    let best = null;
    for (const b of bindings) {
      if (b.name !== name || b.at >= off) continue;
      if (best === null || b.at > best.at) best = b;
    }
    return best;
  };

  // Every candidate guard collected FIRST, filtered after — the 341/399 mechanism is a filter that
  // runs before the resolve, and it is the one way a re-key reproduces that bug in a new place.
  const guardsOf = (name) => {
    const re = guardRe(name);
    const hits = [];
    for (let g = re.exec(masked); g; g = re.exec(masked)) hits.push({ at: g.index, text: g[0] });
    return hits;
  };

  WINDOW.lastIndex = 0;
  for (let w = WINDOW.exec(masked); w; w = WINDOW.exec(masked)) {
    const method = w[1];
    const open = w.index + w[0].length - 1;
    const close = callEnd(masked, open);
    if (close === null) continue;
    const inner = masked.slice(open + 1, close - 1);
    if (FINDER.test(inner)) continue;
    const args = splitArgs(inner);

    let name = null;
    let slot = -1;
    for (const s of [0, 1]) {
      const m = args[s] === undefined ? null : /^([A-Za-z_$][\w$]*)\s*(?:[+-]\s*\d+)?$/.exec(args[s]);
      if (m) { name = m[1]; slot = s; break; }
    }
    if (name === null) continue;

    const b = resolve(name, w.index);
    if (b === null || !b.hasFinder) continue;

    const hits = guardsOf(name);
    const reasons = [];
    const unmodelled = [];
    const accepted = hits.filter((g) => {
      if ((mode === 'pos' || mode === 'both' || mode === 'sense') && !(g.at < w.index)) return false;
      if (mode === 'bind' || mode === 'both' || mode === 'sense') {
        const gb = resolve(name, g.at);
        if (gb === null || gb.at !== b.at) return false;
      }
      if (mode === 'sense') {
        const v = guardProtects(masked, g.at, g.text, w.index, name);
        if (v.bucket === 'unmodelled') unmodelled.push(`${lineAt(g.at)}: ${v.why}`);
        if (!v.protects) { reasons.push(`${lineAt(g.at)}: ${v.why}`); return false; }
      }
      return true;
    });

    const nameVal = initRefusal(masked.slice(b.initFrom, b.initTo));
    const a0 = args[0] === undefined || nameVal === null ? undefined : refusalValue(args[0], name, nameVal);
    const a1 = args[1] === undefined || nameVal === null ? undefined : refusalValue(args[1], name, nameVal);
    const resolvable = nameVal !== null && a0 !== null && a1 !== null;
    const len = resolvable ? windowLenOnRefusal(method, a0, a1) : null;
    out.push({
      name,
      slot,
      off: w.index,
      line: lineAt(w.index),
      bindingLine: lineAt(b.at),
      text: src.slice(w.index, close).replace(/\s+/g, ' '),
      init: src.slice(b.initFrom, b.initTo).replace(/\s+/g, ' '),
      guarded: b.guardedAtBinding || accepted.length > 0,
      guardedAtBinding: b.guardedAtBinding,
      guardsInFile: hits.length,
      guardsAccepted: accepted.length,
      senseRejections: reasons,
      unmodelledGuards: unmodelled.length,
      unmodelledWhy: unmodelled,
      stratum: nameVal === null ? 'UNMODELLED (compound initializer)' : resolvable ? stratumOf(len) : 'UNRESOLVABLE',
    });
  }
  return out;
};

// ── GRADE C: fixtures for the new leg, one axis each, expectations written here first ────────────
//
// S-1/S-2/S-11/S-12 are the CONTROLS, and they are the half of this table that matters most: the
// `sense` leg is a tightening, so the risk it carries is a false defect on a cured site. S-2 is the
// ternary cure — his own spelling — and if it moved, this instrument would be reporting the corpus's
// correct code as broken. The expected verdict under EVERY mode is written for each row, not just
// under `sense`, so a fixture that stopped isolating its axis shows up as a row that moved twice.

const SENSE_FIXTURES = [
  {
    name: 'S-1  control: `if (at < 0) throw` — refusal branch exits, site after it',
    src: "const at = s.indexOf('X');\nif (at < 0) throw new Error('x');\nconst w = s.slice(at);\n",
    want: 1, guarded: { file: true, pos: true, bind: true, both: true, sense: true },
  },
  {
    name: 'S-2  control: the TERNARY cure `at === -1 ? null : s.slice(at)` — site in the alternate',
    src: "const at = s.indexOf('X');\nconst w = at === -1 ? null : s.slice(at);\n",
    want: 1, guarded: { file: true, pos: true, bind: true, both: true, sense: true },
  },
  {
    name: 'S-3  AXIS: wrong sense, `if` — the site is inside the refusal branch',
    src: "const at = s.indexOf('X');\nif (at === -1) {\n  const w = s.slice(at);\n  use(w);\n}\n",
    want: 1, guarded: { file: true, pos: true, bind: true, both: true, sense: false },
  },
  {
    name: 'S-4  AXIS: wrong sense, `else` — found test, site in the else',
    src: "const at = s.indexOf('X');\nif (at >= 0) {\n  use(at);\n} else {\n  const w = s.slice(at);\n}\n",
    want: 1, guarded: { file: true, pos: true, bind: true, both: true, sense: false },
  },
  {
    name: 'S-5  AXIS: wrong sense, ternary — the site is in the CONSEQUENT of a refusal test',
    src: "const at = s.indexOf('X');\nconst w = at === -1 ? s.slice(at) : '';\n",
    want: 1, guarded: { file: true, pos: true, bind: true, both: true, sense: false },
  },
  {
    name: 'S-6  AXIS: NON-EXITING — the refusal branch logs and falls through to the site',
    src: "const at = s.indexOf('X');\nif (at === -1) {\n  log('missing');\n}\nconst w = s.slice(at);\n",
    want: 1, guarded: { file: true, pos: true, bind: true, both: true, sense: false },
  },
  {
    // The outcome a model with only EXITS would have published as a NON-EXITING defect. The site
    // after this branch is safe because the name was overwritten.
    name: 'S-7  AXIS: REPAIRS — the refusal branch assigns to the index, so the site is safe',
    src: "let at = s.indexOf('X');\nif (at === -1) at = 0;\nconst w = s.slice(at);\n",
    want: 1, guarded: { file: true, pos: true, bind: true, both: true, sense: true },
  },
  {
    name: 'S-8  control: found test, site inside the consequent — the ordinary cure',
    src: "const at = s.indexOf('X');\nif (at >= 0) {\n  const w = s.slice(at);\n}\n",
    want: 1, guarded: { file: true, pos: true, bind: true, both: true, sense: true },
  },
  {
    name: 'S-9  AXIS: a COMPOUND condition is unmodelled, and unmodelled PROTECTS',
    src: "const at = s.indexOf('X');\nif (at === -1 || other) {\n  log('x');\n}\nconst w = s.slice(at);\n",
    want: 1, guarded: { file: true, pos: true, bind: true, both: true, sense: true },
  },
  {
    // A distinct axis from S-9: the condition is simple and it is the POLARITY that has no sense.
    // `at >= -1` is always true, so no branch model can say what it protects.
    name: 'S-10 AXIS: an unclassifiable POLARITY (`at >= -1`, always true) is unmodelled, so protects',
    src: "const at = s.indexOf('X');\nif (at >= -1) {\n  log('x');\n}\nconst w = s.slice(at);\n",
    want: 1, guarded: { file: true, pos: true, bind: true, both: true, sense: true },
  },
  {
    name: 'S-11 control: no guard anywhere — `sense` must not invent one',
    src: "const at = s.indexOf('X');\nconst w = s.substring(at, at + 4);\n",
    want: 1, guarded: { file: false, pos: false, bind: false, both: false, sense: false },
  },
  {
    name: 'S-12 control: `guardedAtBinding` is untouched by the sense leg too',
    src: "const at = s.indexOf('X') < 0 ? 0 : 1;\nconst w = s.slice(at);\n",
    want: 1, guarded: { file: true, pos: true, bind: true, both: true, sense: true },
  },
  {
    name: 'S-13 AXIS: found test whose OTHER arm exits — site after the construct is protected',
    src: "const at = s.indexOf('X');\nif (at >= 0) {\n  use(at);\n} else {\n  return '';\n}\nconst w = s.slice(at);\n",
    want: 1, guarded: { file: true, pos: true, bind: true, both: true, sense: true },
  },
  {
    // His G-POS, carried forward: the sense leg inherits `pos`, so a guard below the site must still
    // be rejected here and the rejection must be attributed to position, not to polarity.
    name: 'S-14 control: his G-POS — a guard BELOW the site stays rejected under `sense`',
    src: "const at = s.indexOf('X');\nconst w = s.slice(at);\nif (at < 0) throw new Error('x');\n",
    want: 1, guarded: { file: true, pos: false, bind: true, both: false, sense: false },
  },
  {
    // AXIS: the OUT OF SCOPE label. The live shape is `backfill-entity-bindings.mts:186/190`:
    // a ternary test earlier in the function, and a window site that is in neither of its arms.
    // Verdict: not protected — correct, and the reason must not read NON-EXITING.
    name: 'S-15 AXIS: a ternary test whose arms do not contain the site is OUT OF SCOPE',
    src: "const at = s.indexOf('X');\nconst t = at === -1 ? 'none' : 'some';\nconst w = s.slice(at);\n",
    want: 1, guarded: { file: true, pos: true, bind: true, both: true, sense: false },
    rejectionWhy: /^OUT OF SCOPE: a ternary test/,
  },
  {
    // AXIS: the compound-ternary-test label. The live shape is `round382:453`,
    // `v2From < 0 || v2To < 0 ? null : v2Src.slice(v2From, …)` — genuinely cured, and the model
    // cannot compose the disjunction, so it must land in UNMODELLED and protect.
    name: 'S-16 AXIS: a COMPOUND ternary test is unmodelled (not "neither if nor ternary") and protects',
    src: "const at = s.indexOf('X');\nconst w = at < 0 || other ? null : s.slice(at);\n",
    want: 1, guarded: { file: true, pos: true, bind: true, both: true, sense: true },
    unmodelledWhy: /^UNMODELLED: compound ternary test$/,
  },
  {
    // AXIS: the for-header label. The live shape is `round269:428/429`. The guard is clause 2 of a
    // three-clause header and the site is in the body — genuinely cured, excused rather than
    // classified, and now named for what it is.
    name: 'S-17 AXIS: a guard in a `for` header clause is unmodelled by that name, and protects',
    src: "for (let i = s.indexOf('X'); i !== -1; i = s.indexOf('X', i + 1)) {\n  use(s.slice(i, i + 4));\n}\n",
    want: 1, guarded: { file: true, pos: true, bind: true, both: true, sense: true },
    unmodelledWhy: /^UNMODELLED: a for-loop header clause$/,
  },
];

const MODES = ['file', 'pos', 'bind', 'both', 'sense'];

let kpOk = true;
console.log('── GRADE C: fixtures for the branch-polarity leg, one axis each ──');
for (const f of SENSE_FIXTURES) {
  const problems = [];
  for (const mode of MODES) {
    const got = namedBindingSites(f.src, mode);
    if (got.length !== f.want) { problems.push(`${mode}: found ${got.length}, want ${f.want}`); continue; }
    if (got.length === 1 && got[0].guarded !== f.guarded[mode]) {
      problems.push(`${mode}: guarded ${got[0].guarded}, want ${f.guarded[mode]}`);
    }
    // The REASON is graded, not just the verdict, on the two fixtures that exist because a reason
    // was wrong. A verdict-only fixture cannot catch a mislabel, which is exactly the defect the
    // S-15/S-16 pair was written for.
    if (mode === 'sense' && got.length === 1) {
      if (f.rejectionWhy !== undefined) {
        const whys = got[0].senseRejections.map((w) => w.replace(/^\d+: /, ''));
        if (!(whys.length === 1 && f.rejectionWhy.test(whys[0]))) problems.push(`sense: rejection reason ${JSON.stringify(whys)} does not match ${f.rejectionWhy}`);
      }
      if (f.unmodelledWhy !== undefined) {
        const whys = got[0].unmodelledWhy.map((w) => w.replace(/^\d+: /, ''));
        if (!(whys.length === 1 && f.unmodelledWhy.test(whys[0]))) problems.push(`sense: unmodelled reason ${JSON.stringify(whys)} does not match ${f.unmodelledWhy}`);
      }
    }
  }
  if (problems.length) kpOk = false;
  console.log(`  ${problems.length ? 'MISS' : 'ok  '} ${f.name}${problems.length ? ` → ${problems.join('; ')}` : ''}`);
}

// ── GRADE A: HIS Round 400 rows, under HIS key, at the rev HIS .out names ───────────────────────
//
// Parsed out of his `.out`, refusing with `null` rather than a sentinel if any section comes back
// empty — `-1 === -1` passing beside a printed "unmoved" is a lesson already paid for (393). Four
// row-level populations, not four counts: the mode table, the mover, the FAILS OPEN members under
// `both`, and the eight bind-rejection rows.

const hisRecording = () => {
  if (!existsSync(HIS_OUT)) return null;
  const txt = readFileSync(HIS_OUT, 'utf8');
  const lines = txt.split('\n');

  const rm = /REGRADE OK at ([0-9a-f]{40}) —/.exec(txt);
  if (rm === null) return null;

  // His mode table: `  file  sites 51  GUARDED 37  UNGUARDED 14`
  const table = {};
  for (const l of lines) {
    const m = /^ {2}(file|pos|bind|both) +sites (\d+) {2}GUARDED (\d+) {2}UNGUARDED (\d+)$/.exec(l);
    if (m) table[m[1]] = { sites: Number(m[2]), guarded: Number(m[3]), unguarded: Number(m[4]) };
  }
  if (Object.keys(table).length !== 4) return null;

  // `    docs/…:88  (`eol` bound at :87)` under the FAILS OPEN heading
  const openHdr = lines.findIndex((l) => /^ {2}UNGUARDED \+ FAILS OPEN: \d+ under his file-scoped guard, (\d+) under BOTH:$/.test(l));
  if (openHdr === -1) return null;
  const openWant = Number(/under BOTH: ?(\d+)|, (\d+) under BOTH:/.exec(lines[openHdr])?.[2] ?? NaN);
  const openMembers = [];
  for (let i = openHdr + 1; i < lines.length; i += 1) {
    const m = /^ {4}(\S+):(\d+) {2}\(`([^`]+)` bound at :(\d+)\)$/.exec(lines[i]);
    if (!m) break;
    openMembers.push(`${m[1]}:${m[2]}:${m[3]}@${m[4]}`);
  }
  if (openMembers.length === 0 || !Number.isInteger(openWant) || openWant !== openMembers.length) return null;

  // `  [FAILS OPEN] docs/…:108  (`idx` bound at :107) — 2 guard(s) in file, 0 accepted — …`
  const movers = [];
  for (const l of lines) {
    const m = /^ {2}\[(.+?)\] (\S+):(\d+) {2}\(`([^`]+)` bound at :(\d+)\) — (\d+) guard\(s\) in file, (\d+) accepted/.exec(l);
    if (m) movers.push(`${m[2]}:${m[3]}:${m[4]}@${m[5]}:${m[1]}:${m[6]}/${m[7]}`);
  }
  const moverHdr = lines.find((l) => /^ {2}sites his key called GUARDED that lose their guard under BOTH \((\d+)\):$/.test(l));
  if (moverHdr === undefined) return null;
  const moverWant = Number(/\((\d+)\):$/.exec(moverHdr)[1]);
  if (movers.length !== moverWant || movers.length === 0) return null;

  // `    packages/…:287 (`boundaryIdx`) 2 in file, 1 accepted`
  const rejections = [];
  for (const l of lines) {
    const m = /^ {4}(\S+):(\d+) \(`([^`]+)`\) (\d+) in file, (\d+) accepted$/.exec(l);
    if (m) rejections.push(`${m[1]}:${m[2]}:${m[3]}:${m[4]}/${m[5]}`);
  }
  const rejHdr = lines.find((l) => /guards REJECTED by bind at (\d+) site\(s\):$/.test(l));
  if (rejHdr === undefined) return null;
  const rejWant = Number(/at (\d+) site\(s\):$/.exec(rejHdr)[1]);
  if (rejections.length !== rejWant || rejections.length === 0) return null;

  return { rev: rm[1], table, openMembers, movers, rejections };
};

const his = hisRecording();

const WT = join(REPO, '.testdata/round401-his400-rev');
const cleanup = () => {
  if (existsSync(WT)) {
    try { execFileSync('git', ['worktree', 'remove', '--force', WT], { cwd: REPO, encoding: 'utf8' }); } catch { /* fall through */ }
  }
  if (existsSync(WT)) rmSync(WT, { recursive: true, force: true });
};

const driveAtRev = (rev, mode) => {
  cleanup();
  execFileSync('git', ['worktree', 'add', '--detach', '--quiet', WT, rev], { cwd: REPO, encoding: 'utf8' });
  const at = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: WT, encoding: 'utf8' }).trim();
  const files = execFileSync('git', ['ls-files'], { cwd: WT, encoding: 'utf8' })
    .split('\n')
    .filter((p) => /\.(mjs|cjs|js|mts|cts|ts|tsx)$/.test(p));
  const sites = [];
  for (const p of files) {
    for (const hit of namedBindingSites(readFileSync(join(WT, p), 'utf8'), mode)) sites.push({ p, ...hit });
  }
  cleanup();
  return { at, files: files.length, sites };
};

const sameMultiset = (a, b) => {
  const x = [...a].sort();
  const y = [...b].sort();
  return x.length === y.length && x.every((v, i) => v === y[i]);
};

const keyOf = (r) => `${r.p}:${r.line}:${r.name}@${r.bindingLine}`;

const byMode = {};
let gradeA = null;
if (his !== null) {
  for (const mode of MODES) byMode[mode] = driveAtRev(his.rev, mode);

  const mineTable = {};
  for (const mode of ['file', 'pos', 'bind', 'both']) {
    const s = byMode[mode].sites;
    mineTable[mode] = { sites: s.length, guarded: s.filter((r) => r.guarded).length, unguarded: s.filter((r) => !r.guarded).length };
  }
  const tableSame = ['file', 'pos', 'bind', 'both'].every((m) => his.table[m].sites === mineTable[m].sites
    && his.table[m].guarded === mineTable[m].guarded
    && his.table[m].unguarded === mineTable[m].unguarded);

  const mineOpen = byMode.both.sites.filter((r) => !r.guarded && r.stratum === 'FAILS OPEN').map(keyOf);
  const mineMovers = byMode.both.sites
    .filter((r) => !r.guarded && !r.guardedAtBinding && r.guardsInFile > 0)
    .map((r) => `${keyOf(r)}:${r.stratum}:${r.guardsInFile}/${r.guardsAccepted}`);
  const mineRej = byMode.bind.sites
    .filter((r) => r.guardsInFile > r.guardsAccepted)
    .map((r) => `${r.p}:${r.line}:${r.name}:${r.guardsInFile}/${r.guardsAccepted}`);

  gradeA = byMode.file.at === his.rev
    && tableSame
    && sameMultiset(mineOpen, his.openMembers)
    && sameMultiset(mineMovers, his.movers)
    && sameMultiset(mineRej, his.rejections);

  console.log('\n── GRADE A: his Round 400 rows, his key, at the rev his .out names ──');
  console.log(`  rev: ${his.rev} (his .out) vs ${byMode.file.at} (my drive)`);
  for (const m of ['file', 'pos', 'bind', 'both']) {
    console.log(`  ${m.padEnd(5)} his ${his.table[m].sites}/${his.table[m].guarded}/${his.table[m].unguarded}`
      + `  mine ${mineTable[m].sites}/${mineTable[m].guarded}/${mineTable[m].unguarded}  (sites/GUARDED/UNGUARDED)`);
  }
  console.log(`  FAILS OPEN members under both: his ${his.openMembers.length}, mine ${mineOpen.length}, identical ${sameMultiset(mineOpen, his.openMembers)}`);
  console.log(`  movers under both:             his ${his.movers.length}, mine ${mineMovers.length}, identical ${sameMultiset(mineMovers, his.movers)}`);
  console.log(`  bind-rejection rows:           his ${his.rejections.length}, mine ${mineRej.length}, identical ${sameMultiset(mineRej, his.rejections)}`);
  console.log(`  GRADE A (his ROWS reproduce, not his counts): ${gradeA}`);
  if (gradeA !== true) {
    for (const k of mineOpen.filter((x) => !his.openMembers.includes(x))) console.log(`    mine-only OPEN:   ${k}`);
    for (const k of his.openMembers.filter((x) => !mineOpen.includes(x))) console.log(`    his-only  OPEN:   ${k}`);
    for (const k of mineMovers.filter((x) => !his.movers.includes(x))) console.log(`    mine-only MOVER:  ${k}`);
    for (const k of his.movers.filter((x) => !mineMovers.includes(x))) console.log(`    his-only  MOVER:  ${k}`);
    for (const k of mineRej.filter((x) => !his.rejections.includes(x))) console.log(`    mine-only REJECT: ${k}`);
    for (const k of his.rejections.filter((x) => !mineRej.includes(x))) console.log(`    his-only  REJECT: ${k}`);
  }
} else {
  console.log('\n  GRADE A: his recording could not be parsed — REFUSED, no figure published off it');
}

// ── GRADE B: `sense` ⊆ `both`, and the site total invariant at his 51 ───────────────────────────
//
// Written down before this drove, and stated as BY CONSTRUCTION rather than dressed up as a
// measurement (380/369): `sense` is a filter on the same accepted-guard list `both` produces, so its
// GUARDED set is a subset and the site TOTAL cannot move. What makes the assertion worth having is
// the direction it catches if it fails: a `sense` leg that somehow GAINED a guarded site, or changed
// how many sites exist, would mean the polarity model had leaked into the selector — which is the
// 395 mechanism, the lesson landing in the matcher and not the selector, in reverse.
//
// 385 is why this is an assertion and not a proof: a leg that QUANTIFIES is not monotone. This one
// does not quantify — it is `hits.filter(...)` with one more predicate — but the Round 386 finding
// was that "it's a filter so it's monotone" was a property of the LIST of legs I had written, not of
// the space, so it gets asserted anyway.

let gradeB = null;
if (his !== null) {
  const gu = (mode) => byMode[mode].sites.filter((r) => r.guarded).map((r) => `${keyOf(r)}#${r.off}`);
  const totals = MODES.map((m) => byMode[m].sites.length);
  gradeB = totals.every((t) => t === totals[0])
    && totals[0] === his.table.file.sites
    && gu('sense').every((k) => gu('both').includes(k))
    && gu('sense').length <= gu('both').length;
  console.log('\n── GRADE B: sense ⊆ both, totals invariant ──');
  for (const m of MODES) {
    const s = byMode[m].sites;
    console.log(`  ${m.padEnd(5)} sites ${s.length}  GUARDED ${s.filter((r) => r.guarded).length}  UNGUARDED ${s.filter((r) => !r.guarded).length}`);
  }
  console.log(`  GRADE B (sense ⊆ both, every total === his ${his.table.file.sites}): ${gradeB}`);
}

// ── GRADE D: the label repair moved a REASON and no VERDICT ─────────────────────────────────────
//
// The first drive of this instrument published two rejection rows whose verdicts were right and
// whose reasons were wrong: a ternary test printed as "NON-EXITING", and a compound ternary test
// printed as "heads neither an if/while nor a ternary". The repair is a relabel, and a relabel that
// quietly moved a verdict would be a far worse bug than the one it fixed.
//
// So the repair is graded against the state it replaced, read out of the recording the pre-repair
// drive left behind — a cure graded only in its own post-cure tree cannot catch what it moved
// (397). Everything that is a VERDICT must be identical across the two; only the reason strings may
// differ. A control that cannot be found at all refuses rather than passing vacuously (393).

const CONTROL = join(REPO, 'docs/research/round401-instruments/control-pre-label-repair.out');

// Hoisted ABOVE both consumers so the grade and the headline read the SAME accumulator. A grade
// that recomputes the figure it is grading is hollow (369), and two copies of this filter would be
// free to drift apart with nothing to notice.
const movers = his === null ? [] : byMode.sense.sites.filter((r) => !r.guarded && !r.guardedAtBinding
  && r.senseRejections.length > 0
  && byMode.both.sites.some((x) => x.p === r.p && x.off === r.off && x.guarded));

const controlRecording = () => {
  if (!existsSync(CONTROL)) return null;
  const lines = readFileSync(CONTROL, 'utf8').split('\n');
  const table = {};
  for (const l of lines) {
    const m = /^ {2}(file|pos|bind|both|sense) +sites (\d+) {2}GUARDED (\d+) {2}UNGUARDED (\d+)$/.exec(l);
    if (m) table[m[1]] = `${m[2]}/${m[3]}/${m[4]}`;
  }
  if (Object.keys(table).length !== 5) return null;
  const moverHdr = lines.find((l) => /^ {2}sites the polarity model moves OUT of GUARDED \((\d+)\):$/.test(l));
  if (moverHdr === undefined) return null;
  const rejected = [];
  for (const l of lines) {
    const m = /^ {6}(\S+):(\d+) \(`([^`]+)`\) — guard at :(\d+): /.exec(l);
    if (m) rejected.push(`${m[1]}:${m[2]}:${m[3]}@guard:${m[4]}`);
  }
  const unmodelled = [];
  for (const l of lines) {
    const m = /^ {6}(\S+):(\d+) \(`([^`]+)`\) — (\d+) unmodelled of (\d+) in file$/.exec(l);
    if (m) unmodelled.push(`${m[1]}:${m[2]}:${m[3]}:${m[4]}/${m[5]}`);
  }
  if (rejected.length === 0 || unmodelled.length === 0) return null;
  return { table, movers: Number(/\((\d+)\):$/.exec(moverHdr)[1]), rejected, unmodelled };
};

const control = controlRecording();
let gradeD = null;
if (control !== null && his !== null) {
  const nowTable = {};
  for (const m of MODES) {
    const s = byMode[m].sites;
    nowTable[m] = `${s.length}/${s.filter((r) => r.guarded).length}/${s.filter((r) => !r.guarded).length}`;
  }
  const nowRejected = [];
  for (const r of byMode.sense.sites) {
    for (const why of r.senseRejections) nowRejected.push(`${r.p}:${r.line}:${r.name}@guard:${/^(\d+):/.exec(why)[1]}`);
  }
  const nowUnmodelled = byMode.sense.sites
    .filter((r) => r.unmodelledGuards > 0)
    .map((r) => `${r.p}:${r.line}:${r.name}:${r.unmodelledGuards}/${r.guardsInFile}`);
  const nowMovers = movers.length;

  gradeD = MODES.every((m) => control.table[m] === nowTable[m])
    && control.movers === nowMovers
    && sameMultiset(control.rejected, nowRejected)
    && sameMultiset(control.unmodelled, nowUnmodelled);
  console.log('\n── GRADE D: the label repair vs the recording it replaced (verdicts must not move) ──');
  for (const m of MODES) console.log(`  ${m.padEnd(5)} pre ${control.table[m]}  post ${nowTable[m]}  ${control.table[m] === nowTable[m]}`);
  console.log(`  movers: pre ${control.movers}, post ${nowMovers}`);
  console.log(`  rejected (site@guard-line): pre ${control.rejected.length}, post ${nowRejected.length}, identical ${sameMultiset(control.rejected, nowRejected)}`);
  console.log(`  unmodelled (site, n/total): pre ${control.unmodelled.length}, post ${nowUnmodelled.length}, identical ${sameMultiset(control.unmodelled, nowUnmodelled)}`);
  console.log(`  GRADE D (every verdict identical across the relabel): ${gradeD}`);
  if (gradeD !== true) {
    for (const k of nowRejected.filter((x) => !control.rejected.includes(x))) console.log(`    post-only rejected:   ${k}`);
    for (const k of control.rejected.filter((x) => !nowRejected.includes(x))) console.log(`    pre-only  rejected:   ${k}`);
    for (const k of nowUnmodelled.filter((x) => !control.unmodelled.includes(x))) console.log(`    post-only unmodelled: ${k}`);
    for (const k of control.unmodelled.filter((x) => !nowUnmodelled.includes(x))) console.log(`    pre-only  unmodelled: ${k}`);
  }
} else {
  console.log('\n  GRADE D: the pre-repair recording could not be parsed — REFUSED, no figure published off it');
}

// ── the gate, BEFORE any headline ────────────────────────────────────────────────────────────────
// Gate on `!== true` so a leg that never ran refuses too (356), and refuse before printing any
// figure rather than printing the figure and the grade side by side (353).

if (kpOk !== true || gradeA !== true || gradeB !== true || gradeD !== true) {
  console.log(`\nREFUSED — GRADE C ${kpOk}, GRADE A ${gradeA}, GRADE B ${gradeB}, GRADE D ${gradeD}. No figure published.`);
  cleanup();
  process.exit(1);
}

// ── the finding ──────────────────────────────────────────────────────────────────────────────────

const pinnedBoth = byMode.both.sites;
const pinnedSense = byMode.sense.sites;
const unguardedOf = (sites) => sites.filter((r) => !r.guarded);

console.log(`\n── the branch-polarity regrade at ${his.rev} ──`);
console.log(`  his file-scoped (399):   ${unguardedOf(byMode.file.sites).length} UNGUARDED of ${pinnedBoth.length}`);
console.log(`  pos + bind (400):        ${unguardedOf(pinnedBoth).length} UNGUARDED`);
console.log(`  + branch polarity (401): ${unguardedOf(pinnedSense).length} UNGUARDED`);

console.log(`\n  sites the polarity model moves OUT of GUARDED (${movers.length}):`);
for (const r of movers) {
  console.log(`  [${r.stratum}] ${r.p}:${r.line}  (\`${r.name}\` bound at :${r.bindingLine})`);
  console.log(`      window: ${r.text.length > 110 ? `${r.text.slice(0, 107)}...` : r.text}`);
  for (const why of r.senseRejections) console.log(`      guard at :${why}`);
}
if (movers.length === 0) console.log('    none');

// Is the zero (or the number) MEASURED or VACUOUS? Two keys that agree because neither can see the
// thing agree for no reason (339). The leg fires on four fixtures; the question here is whether it
// did any work on the LIVE corpus. Three populations answer it: guards it classified and rejected,
// guards it classified and ACCEPTED (so the model reached them and said "cured"), and guards it
// could not classify at all.
const rejected = pinnedSense.filter((r) => r.senseRejections.length > 0);
const unmodelledSites = pinnedSense.filter((r) => r.unmodelledGuards > 0);
const classifiedAccept = pinnedSense.filter((r) => r.guardsAccepted > 0 && r.unmodelledGuards === 0);

console.log('\n  is the polarity leg\'s result measured or vacuous?');
console.log(`    sites where it rejected at least one otherwise-accepted guard: ${rejected.length}`);
for (const r of rejected) {
  for (const why of r.senseRejections) console.log(`      ${r.p}:${r.line} (\`${r.name}\`) — guard at :${why}`);
}
console.log(`    sites where it classified every guard and ACCEPTED them (model reached them, verdict cured): ${classifiedAccept.length}`);
console.log(`    sites carrying at least one guard the model could NOT classify (all given the benefit of the doubt): ${unmodelledSites.length}`);
// The REASON, not just the count. This bucket is where a wrong-sense site would hide if one were
// hiding anywhere — the leg counts these as cured — so a reader auditing the zero needs to see what
// the model could not classify, by line, and not have to take "10 sites" on trust.
for (const r of unmodelledSites) {
  console.log(`      ${r.p}:${r.line} (\`${r.name}\`) — ${r.unmodelledGuards} unmodelled of ${r.guardsInFile} in file`);
  for (const why of r.unmodelledWhy) console.log(`        guard at :${why}`);
}
const reasonTally = {};
for (const r of pinnedSense) for (const why of r.unmodelledWhy) {
  const k = why.replace(/^\d+: /, '');
  reasonTally[k] = (reasonTally[k] ?? 0) + 1;
}
console.log('    unmodelled guards by reason:');
for (const [k, n] of Object.entries(reasonTally).sort((a, b) => b[1] - a[1])) console.log(`      ${n}  ${k}`);

const liveFiles = execFileSync('git', ['ls-files'], { cwd: REPO, encoding: 'utf8' })
  .split('\n')
  .filter((p) => /\.(mjs|cjs|js|mts|cts|ts|tsx)$/.test(p));
const live = [];
for (const p of liveFiles) {
  for (const hit of namedBindingSites(readFileSync(join(REPO, p), 'utf8'), 'sense')) live.push({ p, ...hit });
}
console.log(`\n── live at ${HEAD}: ${liveFiles.length} tracked sources, ${live.length} sites, ${unguardedOf(live).length} UNGUARDED under SENSE ──`);
console.log('  (informational — nothing above gates on this number, which grows as instruments land)');

cleanup();

// Derived once, then read as constants. A verdict sentence that recomputes its own figures mid-
// clause is how one character in another file made a published sentence contradict itself (380/397).
const TOTAL = pinnedBoth.length;
const HIS_399 = unguardedOf(byMode.file.sites).length;
const HIS_400 = unguardedOf(pinnedBoth).length;
const MINE_401 = unguardedOf(pinnedSense).length;
const MOVED = movers.length;
const REACHED = classifiedAccept.length;
const UNREACHED = unmodelledSites.length;

console.log(
  `\nPOLARITY OK at ${his.rev} — the branch-polarity axis his §4 states and does not count is `
  + `MEASURED: it moves ${MOVED} of the ${TOTAL - HIS_400} sites still called GUARDED under his `
  + `pos+bind guard, taking the not-cured count from ${HIS_399} (399, file-scoped) to ${HIS_400} `
  + `(400, pos+bind) to ${MINE_401} of ${TOTAL}. Not vacuous: the model classified every guard at `
  + `${REACHED} site(s) and accepted them, and could not classify a guard at ${UNREACHED} site(s), `
  + `all of which it counted as cured. Still a floor, now for a fourth reason: every unmodelled `
  + `polarity, compound condition and unspanned consequent is counted as a cure.`,
);
