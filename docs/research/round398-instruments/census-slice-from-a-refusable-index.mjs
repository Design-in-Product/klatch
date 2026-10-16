#!/usr/bin/env node
/**
 * Round 398 — census: every site in this repo where a REFUSABLE index flows into a window, and
 * what the window BECOMES when the index refuses.
 *
 * Daedalus's Round 397 §2 reported ONE instance, in my own Round 396 instrument: an `indexOf`
 * that refuses with `-1` passed straight to `.slice()`, which turns "I could not find my anchor"
 * into "the last character of the file" and greens the conjunct reading it. A reported instance
 * is not the mechanism (355), so this walks every tracked JS/TS source in the repo.
 *
 * SELECTOR. For each `.slice(` / `.substring(` / `.substr(` call site, take the BALANCED,
 * QUOTE-AWARE argument text and ask whether any argument mentions a refusable finder: `indexOf`,
 * `lastIndexOf`, `.search(`, `findIndex`. Whitespace is collapsed first so a call wrapped across
 * lines is reachable (394), and every stripped offset is mapped back to the source byte. Three
 * things this key is deliberately NOT:
 *   - not a character class — `[^)]*` stops at the first `)`, which is inside the `indexOf(...)`
 *     call itself, so it cannot see the argument at all (329/394);
 *   - not quote-blind — `.slice(0, s.indexOf('\n);'))` carries a `)` INSIDE a string literal, and
 *     a paren counter that does not skip strings cuts the argument short. My first version of
 *     this file did exactly that. The strings in this corpus are full of parens;
 *   - not a guarded/unguarded classifier. My first version reported one, and it was vacuous: a
 *     correctly guarded site binds the index to a NAME (`const at = s.indexOf(x); at !== -1 && …`)
 *     and the finder is then nowhere near the window call, so it is invisible to this selector.
 *     Every site this key can find is inline by construction, so "UNGUARDED" was a conjunct a
 *     filter had already made true (380/381). The cured form is INVISIBLE here — which is also
 *     why this census cannot regress-test a cure, and the behavioural grade next door must.
 *
 * STRATUM. What the refusal yields, MEASURED and not reasoned (331): each finder subexpression is
 * textually substituted with `-1` (keeping any `+ k` it carries), numeric-literal arguments are
 * kept, and the resulting window is driven against a sample string with `new Function`. An
 * argument that is neither is UNRESOLVABLE and the site is reported for hand reading rather than
 * assigned a stratum by guesswork.
 *
 *   FAILS OPEN   — refusal window ≤ 1 char. A `!test(window)` conjunct goes TRUE: the reported
 *                  class, and the one that greens a grade.
 *   FAILS WIDE   — refusal window is all or nearly all of the string. Usually fails the other
 *                  way (more likely to match), which is why it is a separate stratum and not a
 *                  bigger headline number.
 *   UNRESOLVABLE — at least one argument this key cannot evaluate; hand-read.
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const REPO = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const FINDER = /(indexOf|lastIndexOf|search|findIndex)\s*\(/;
const WINDOWS = ['.slice(', '.substring(', '.substr('];
const SAMPLE = 'x'.repeat(200);

/** Collapse whitespace runs to one space, keeping stripped index → source index. */
function collapse(src) {
  let out = '';
  const map = [];
  let inWs = false;
  for (let i = 0; i < src.length; i++) {
    const ws = /\s/.test(src[i]);
    if (ws) {
      if (!inWs) {
        out += ' ';
        map.push(i);
      }
      inWs = true;
    } else {
      out += src[i];
      map.push(i);
      inWs = false;
    }
  }
  if (out.length !== map.length) throw new Error('collapse: map out of step');
  return { out, map };
}

/**
 * Balanced argument text of the call whose `(` is at `open`, skipping string and template
 * literals (and their escapes) so a `)` inside a literal does not close the call. Returns null
 * when the call does not balance — a refusal, not a truncation.
 */
function argsAt(s, open) {
  if (s[open] !== '(') throw new Error('argsAt: not a paren');
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    const c = s[i];
    if (c === "'" || c === '"' || c === '`') {
      i++;
      while (i < s.length && s[i] !== c) i += s[i] === '\\' ? 2 : 1;
      continue;
    }
    if (c === '(') depth++;
    else if (c === ')') {
      depth--;
      if (depth === 0) return s.slice(open + 1, i);
    }
  }
  return null;
}

/** Split argument text at TOP-LEVEL commas, quote-aware. */
function splitArgs(a) {
  const parts = [];
  let depth = 0;
  let cur = '';
  for (let i = 0; i < a.length; i++) {
    const c = a[i];
    if (c === "'" || c === '"' || c === '`') {
      const q = c;
      cur += c;
      i++;
      while (i < a.length && a[i] !== q) {
        cur += a[i];
        i += a[i] === '\\' ? 2 : 1;
        if (a[i - 1] === '\\') cur += a[i - 1];
      }
      cur += q;
      continue;
    }
    if ('([{'.includes(c)) depth++;
    if (')]}'.includes(c)) depth--;
    if (c === ',' && depth === 0) {
      parts.push(cur);
      cur = '';
      continue;
    }
    cur += c;
  }
  if (cur.trim() !== '') parts.push(cur);
  return parts;
}

/**
 * One pass that returns the source with COMMENTS BLANKED TO SPACES — same length, so every
 * offset still maps to its original line — and a mask that is true inside string and template
 * literals. Both are needed and neither can be done with a regex over this corpus:
 *
 *   - without the literal mask, the census counts its own known-positive FIXTURES as live repo
 *     sites: the defective line is stored here as a string, and two of my own fixtures read as
 *     defects. Found by driving this census against itself;
 *   - without comment blanking, a mask built by scanning for quotes treats the apostrophe in
 *     "Daedalus's" as a string opener and masks everything to the next apostrophe — which in this
 *     corpus of prose-heavy comments silently HIDES real sites. A false negative in a census is
 *     the direction that produces no work at all (351).
 */
function lex(src) {
  const out = src.split('');
  const inLiteral = new Array(src.length).fill(false);
  const stack = [{ kind: 'code', depth: 0 }];
  let lastCode = ''; // last significant code character, for the regex-vs-division decision
  let i = 0;
  const blank = (at) => {
    if (src[at] !== '\n') out[at] = ' ';
  };
  while (i < src.length) {
    const top = stack[stack.length - 1];
    const c = src[i];
    const d = src[i + 1];
    if (top.kind === 'code') {
      if (c === '/' && d === '/') {
        while (i < src.length && src[i] !== '\n') blank(i++);
        continue;
      }
      if (c === '/' && d === '*') {
        while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) blank(i++);
        if (i < src.length) {
          blank(i);
          blank(i + 1);
          i += 2;
        }
        continue;
      }
      // A regex literal. Without this the corpus desynchronises the lexer: `/\btry\s*\{/g` and
      // `/\n\);/` carry an unbalanced brace, paren and quote each, and a brace counted inside a
      // regex makes the `}` that closes an interpolation decrement a depth instead of popping.
      if (c === '/' && /^$|[(,=:[!&|?{};+\-*%~^]|return|typeof/.test(lastCode)) {
        i++;
        let klass = false;
        while (i < src.length) {
          if (src[i] === '\\') {
            i += 2;
            continue;
          }
          if (src[i] === '[') klass = true;
          else if (src[i] === ']') klass = false;
          else if (src[i] === '/' && !klass) break;
          else if (src[i] === '\n') break; // not a regex after all; bail rather than run away
          i++;
        }
        i++;
        lastCode = '/';
        continue;
      }
      if (c === "'" || c === '"') {
        inLiteral[i] = true;
        stack.push({ kind: 'str', q: c });
        i++;
        continue;
      }
      if (c === '`') {
        inLiteral[i] = true;
        stack.push({ kind: 'tmpl' });
        i++;
        continue;
      }
      if (c === '{') {
        top.depth++;
        lastCode = c;
        i++;
        continue;
      }
      if (c === '}') {
        if (top.depth === 0 && stack.length > 1) {
          // closes a `${…}` interpolation: back into the template literal
          inLiteral[i] = true;
          stack.pop();
          i++;
          continue;
        }
        top.depth--;
        lastCode = c;
        i++;
        continue;
      }
      if (!/\s/.test(c)) lastCode = c;
      i++;
      continue;
    }
    if (top.kind === 'str') {
      inLiteral[i] = true;
      if (c === '\\') {
        inLiteral[i + 1] = true;
        i += 2;
        continue;
      }
      if (c === top.q) stack.pop();
      i++;
      continue;
    }
    // template literal: its text is a literal, but a `${…}` interpolation is CODE — real
    // computation lives in interpolations all over this corpus, and masking it is a false
    // negative (the shape `probe-round257` is named for: no model of interpolation).
    inLiteral[i] = true;
    if (c === '\\') {
      inLiteral[i + 1] = true;
      i += 2;
      continue;
    }
    if (c === '$' && d === '{') {
      inLiteral[i + 1] = true;
      stack.push({ kind: 'code', depth: 0 });
      lastCode = '{';
      i += 2;
      continue;
    }
    if (c === '`') stack.pop();
    i++;
    continue;
  }
  return { code: out.join(''), inLiteral };
}

/** Every window call in one source whose balanced args mention a refusable finder. */
function sitesIn(src) {
  const { code, inLiteral: litBySrcIdx } = lex(src);
  if (code.length !== src.length) throw new Error('lex: length not preserved — the offset map would lie');
  const { out, map } = collapse(code);
  const inLiteral = map.map((srcIdx) => litBySrcIdx[srcIdx]);
  const hits = [];
  for (const w of WINDOWS) {
    let from = 0;
    for (;;) {
      const at = out.indexOf(w, from);
      if (at === -1) break; // the refusal: the loop ends; no window is ever taken from -1
      from = at + w.length;
      if (inLiteral[at]) continue; // code-shaped text inside a string literal is not a site
      const args = argsAt(out, at + w.length - 1);
      if (args === null || !FINDER.test(args)) continue;
      hits.push({ line: src.slice(0, map[at]).split('\n').length, args, method: w.slice(1, -1), text: `${w}${args})` });
    }
  }
  return hits.sort((a, b) => a.line - b.line);
}

/**
 * Drive what each argument becomes when its finder refuses. `-1` for a bare finder call,
 * `-1 + k` when the argument adds a constant, the literal itself for a numeric literal, and
 * `null` (UNRESOLVABLE) for anything else.
 */
function canonical(arg) {
  const a = arg.trim();
  if (/^-?\d+$/.test(a)) return a;
  if (!FINDER.test(a)) return null;
  const tail = a.match(/\)\s*([+-]\s*\d+)\s*$/);
  if (/^[\w$.[\]'"`]+\s*\.\s*(indexOf|lastIndexOf|search|findIndex)\s*\(/.test(a) || /^\(?[\w$.]+\(/.test(a)) {
    return tail ? `(-1 ${tail[1].replace(/\s+/g, ' ')})` : '(-1)';
  }
  return null;
}

function stratumOf(hit) {
  const args = splitArgs(hit.args).map(canonical);
  if (args.includes(null) || args.length === 0) return { stratum: 'UNRESOLVABLE', window: null };
  let len;
  try {
    // The method name is carried on the hit, not re-found with an `indexOf` — this line used to
    // read `hit.text.slice(0, hit.text.indexOf('('))`, which is the shape this file censuses,
    // inside the function that strata it. It could not actually refuse here (the text is built
    // as `${method}(`), so it is a shape instance and not a live defect; it is gone anyway.
    len = new Function('S', `return S.${hit.method}(${args.join(', ')}).length;`)(SAMPLE);
  } catch (e) {
    return { stratum: 'UNRESOLVABLE', window: null };
  }
  if (len <= 1) return { stratum: 'FAILS OPEN', window: len };
  if (len >= SAMPLE.length - 1) return { stratum: 'FAILS WIDE', window: len };
  return { stratum: `FAILS PARTIAL (${len}/${SAMPLE.length})`, window: len };
}

// ── known positives and controls, one axis apart each ────────────────────────────────────────
// KP-A is my own defective line, byte-for-byte. KP-B is the SAME expression wrapped across lines
// (whitespace is the only axis, 394). KP-C carries a `)` inside a string literal (the quote axis
// my first version got wrong). CONTROL-WIDE is the shape with a different refusal behaviour, and
// must be found but stratified apart. CONTROL-CURED is the cured form, which this selector CANNOT
// see and must not claim to — its expectation is 0 (382: one KP per shape covers one axis).
const KP_A = `const renamedAway = !/\\btype Row\\b/.test(readFileSync(join(REPO, PROBE_371_PATH), 'utf8').slice(readFileSync(join(REPO, PROBE_371_PATH), 'utf8').indexOf('ROUND 396 RE-KEY')));`;
const KP_B = `const renamedAway = !/\\btype Row\\b/.test(\n  readFileSync(join(REPO, P), 'utf8').slice(\n    readFileSync(join(REPO, P), 'utf8')\n      .indexOf('ROUND 396 RE-KEY'),\n  ),\n);`;
const KP_C = `const head = rest.slice(0, rest.indexOf('\\n);'));`;
// KP-D and KP-E are the two axes the lexer added, isolated one at a time (382): a site quoted in
// a COMMENT is not a site, and a site in code must still be found when the comment above it
// carries an apostrophe — the possessive that a quote-scanning mask reads as a string opener.
// KP-F is a site inside a STRING literal, which is how this census first counted its own
// fixtures as repo defects.
const KP_D = `// quoting the defect: rest.slice(0, rest.indexOf('x'))\nconst n = 1;`;
const KP_E = `/** Daedalus's note — don't adopt a pre-existing tree. */\nconst w = s.slice(s.indexOf('MARK'));`;
const KP_F = `const FIXTURE = "const w = s.slice(s.indexOf('MARK'));";`;
// KP-G and KP-H are the two axes the interpolation/regex model added, isolated (382). KP-G is a
// real site INSIDE a `${…}` interpolation — found in this corpus at round388:102, and a false
// negative in my first lexer. KP-H puts an unbalanced brace, paren and quote inside a regex
// literal ahead of a real site: if the lexer counts those, the `}` that ends the interpolation
// pops the wrong state and every site after it in the file is lost.
const KP_G = 'const claim = `the window holds ${count(src.slice(src.indexOf(\'ANCHOR\')))} hits`;';
const KP_H = 'const TRY = /\\btry\\s*\\{/g;\nconst x = `${a}`;\nconst w = s.slice(s.indexOf("MARK"));';
const CONTROL_CURED = `const at = src.indexOf('MARKER');\nconst ok = at !== -1 && !/x/.test(src.slice(at));`;
const CONTROL_ABSENT = `const head = src.slice(0, 80);\nconst tail = other.substring(4, 9);`;

const kp = [
  ['KP-A  mine, unwrapped', KP_A, 1, 'FAILS OPEN'],
  ['KP-B  same expression, wrapped', KP_B, 1, 'FAILS OPEN'],
  ['KP-C  `)` inside a string literal in the args', KP_C, 1, 'FAILS WIDE'],
  ['KP-D  the defect quoted in a comment', KP_D, 0, null],
  ['KP-E  real site under a comment with an apostrophe', KP_E, 1, 'FAILS OPEN'],
  ['KP-F  the defect inside a string literal (my own fixtures)', KP_F, 0, null],
  ['KP-G  real site inside a `${…}` interpolation', KP_G, 1, 'FAILS OPEN'],
  ['KP-H  real site after a regex literal carrying `{`, `(`, `\'`', KP_H, 1, 'FAILS OPEN'],
  ['CONTROL-CURED  invisible to this key by construction', CONTROL_CURED, 0, null],
  ['CONTROL-ABSENT window, no finder', CONTROL_ABSENT, 0, null],
];
let kpOk = true;
console.log('── known positives and controls ──');
for (const [name, src, want, wantStratum] of kp) {
  const found = sitesIn(src);
  const got = found.length === 1 ? stratumOf(found[0]).stratum : '(n/a)';
  const ok = found.length === want && (wantStratum === null || got === wantStratum);
  if (!ok) kpOk = false;
  console.log(`  ${ok ? 'ok  ' : 'MISS'} ${name}: found ${found.length}/${want}${wantStratum ? `, stratum ${got === wantStratum ? got : `WRONG → ${got} (want ${wantStratum})`}` : ''}`);
}

// ── the live population ──────────────────────────────────────────────────────────────────────
const files = execFileSync('git', ['ls-files'], { cwd: REPO, encoding: 'utf8' })
  .split('\n')
  .filter((p) => /\.(mjs|cjs|js|mts|cts|ts|tsx)$/.test(p));

// Comments are blanked and string literals masked by `lex` above, so every row here is a site in
// CODE — the earlier version's "is this line comment-ish" heuristic (which keyed on the line's
// first character and therefore missed a site sharing a line with anything else) is gone.
const code = [];
for (const p of files) {
  const src = readFileSync(join(REPO, p), 'utf8');
  for (const hit of sitesIn(src)) code.push({ p, line: hit.line, text: hit.text, ...stratumOf(hit) });
}

const byStratum = (s) => code.filter((r) => r.stratum.startsWith(s));
const open = byStratum('FAILS OPEN');

console.log(`\n── live census: ${files.length} tracked JS/TS sources ──`);
for (const r of code) {
  console.log(`  [${r.stratum}] ${r.p}:${r.line}\n      ${r.text.length > 120 ? `${r.text.slice(0, 117)}...` : r.text}`);
}
console.log(
  `\n  sites in code: ${code.length}` +
    `\n    FAILS OPEN:   ${open.length}  ← the reported class: a refused anchor greens a \`!test(window)\`` +
    `\n    FAILS WIDE:   ${byStratum('FAILS WIDE').length}` +
    `\n    PARTIAL:      ${byStratum('FAILS PARTIAL').length}` +
    `\n    UNRESOLVABLE: ${byStratum('UNRESOLVABLE').length}  ← hand-read, not assigned a stratum by guesswork`,
);

// ── the hand reading this detector grades ────────────────────────────────────────────────────
// HAND is the FAILS OPEN stratum, and its provenance is worth stating exactly rather than
// implying more independence than it has. My FIRST version of this list was written before
// anything drove and held ONE member: the site Daedalus reported. The detector refused to agree
// with it, and that refusal is the entire reason I know the shape is not one site — so the
// mechanism did its job in the direction that matters. This list is the detector's own output
// after I read all 32 rows and checked each FAILS OPEN expression by eye for being an unguarded
// refusable index; it therefore guards against DRIFT (a site appearing or a cure landing silently
// changes the list and the grade goes red) and not against a shared blind spot. Two revisions
// are recorded in it: `round396:307` left the list because I cured it this fire, and
// `round388:98` left because it sits inside a quoted claim, not in code — both checked by
// reading the lines, not inferred from the count moving.
const HAND = [
  'docs/research/round378-instruments/measure-population-keys.mjs:30',
  'docs/research/round388-instruments/grade-the-uncaught-drive-and-the-window.mjs:92',
  'docs/research/round389-instruments/grade-the-census-key-and-the-asymmetric-pins.mjs:115',
  'docs/research/round391-instruments/grade-the-machine-state-conjunct-and-the-floor-of-the-explicit-cure.mjs:343',
  'docs/research/round391-instruments/grade-the-machine-state-conjunct-and-the-floor-of-the-explicit-cure.mjs:346',
  'docs/research/round392-instruments/grade-the-finding-that-is-its-own-finding.mjs:154',
  'scripts/probe-accepted-multipart-allocation.mts:237',
  'scripts/probe-parse-stage-allocation.mts:262',
  'scripts/probe-round203-the-corpus-is-lineages-and-the-sheet-warns-about-one-of-them.mts:257',
  'scripts/probe-round224-a-skip-must-not-summarise-as-a-pass.mts:1441',
  'scripts/probe-round280-the-client-half-of-the-pair-and-what-it-leaves-behind.mts:455',
  'scripts/probe-round369-the-verdict-line-carries-the-blocked-kind.mts:348',
  'scripts/probe-round372-the-rows-are-keyed-on-the-limb-and-the-contradiction-is-latent.mts:397',
  'scripts/verify-tsx-guard.mjs:1484',
];
const detected = open.map((r) => `${r.p}:${r.line}`);
const missedByHand = detected.filter((d) => !HAND.includes(d));
const handOnly = HAND.filter((h) => !detected.includes(h));
// Member LISTS, not counts — two keys agreeing on a total can share zero members (340).
const agree = missedByHand.length === 0 && handOnly.length === 0;

console.log('\n── grade ──');
console.log(`  known positives and controls all as expected: ${kpOk}`);
console.log(`  detector's FAILS OPEN list === the hand reading: ${agree}`);
if (!agree) {
  console.log(`  in the detector, not in the hand reading (${missedByHand.length}): ${missedByHand.join(', ') || '(none)'}`);
  console.log(`  in the hand reading, not in the detector (${handOnly.length}): ${handOnly.join(', ') || '(none)'}`);
}
if (kpOk !== true || agree !== true) {
  console.log('\nNO VERDICT — this census did not grade true; read the rows, not a count.');
  process.exit(1);
}
console.log(
  `\nCENSUS OK — ${code.length} refusable-index window(s) in ${files.length} tracked sources; ` +
    `${open.length} of them FAIL OPEN, which is the class his Round 397 §2 reported one member of.`,
);
