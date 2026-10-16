#!/usr/bin/env node
/**
 * Round 398 — census: every site in this repo where a REFUSABLE index flows into a window.
 *
 * Daedalus's Round 397 §2 reported ONE instance, in my own Round 396 instrument: an
 * `indexOf` that refuses with `-1` passed straight to `.slice()`, which turns "I could not
 * find my anchor" into "the last character of the file" and greens the conjunct reading it.
 * A reported instance is not the mechanism (355), so this walks every tracked JS/TS source
 * in the repo and reports every site of the shape, guarded and unguarded.
 *
 * KEY. For each `.slice(` / `.substring(` / `.substr(` call site, take the BALANCED argument
 * text (not a character class — a `[^)]*` key stops at the first `)`, which is inside the
 * `indexOf(...)` call itself, 329/394) and ask whether it mentions a refusable finder:
 * `indexOf`, `lastIndexOf`, `.search(`, or `findIndex`. Whitespace is collapsed before the
 * scan so a call wrapped across lines is reachable (394); offsets are reported against the
 * ORIGINAL bytes, by mapping every stripped index back to its source index.
 *
 * The census reports; it does not decide. Each hit is classified `guarded` / `UNGUARDED` by
 * a textual test that is itself fallible, so the hand reading of a small population is
 * primary and this detector GRADES that hand reading (per the 3-member-population lesson):
 * `HAND` below is written down first, and the script refuses to print a verdict if the two
 * disagree.
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const REPO = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const FINDERS = /indexOf\(|lastIndexOf\(|\.search\(|findIndex\(/;
const WINDOWS = ['.slice(', '.substring(', '.substr('];

/** Collapse runs of whitespace to one space, keeping a map from stripped index → source index. */
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

/** Balanced argument text of the call whose `(` is at `open`, or null if unbalanced. */
function argsAt(s, open) {
  if (s[open] !== '(') throw new Error('argsAt: not a paren');
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')') {
      depth--;
      if (depth === 0) return s.slice(open + 1, i);
    }
  }
  return null;
}

/** Every window call in one source whose balanced args mention a refusable finder. */
function sitesIn(src) {
  const { out, map } = collapse(src);
  const hits = [];
  for (const w of WINDOWS) {
    let from = 0;
    for (;;) {
      const at = out.indexOf(w, from);
      if (at === -1) break; // refusal handled: loop ends, no window is taken from -1
      from = at + w.length;
      const args = argsAt(out, at + w.length - 1);
      if (args === null || !FINDERS.test(args)) continue;
      const srcIdx = map[at];
      const line = src.slice(0, srcIdx).split('\n').length;
      const text = `${w}${args})`;
      hits.push({ line, text, args });
    }
  }
  return hits.sort((a, b) => a.line - b.line);
}

/**
 * Guard test, deliberately narrow and declared fallible: a site counts as guarded only when
 * the index is bound to a name and that name is compared against `-1` (or `>= 0`) in the file.
 * An inline `s.slice(s.indexOf(x))` can never be guarded — there is no name to compare.
 */
function guardedness(src, hit) {
  const inline = /\.?\w*\s*\.?(indexOf|lastIndexOf|search|findIndex)\s*\(/.test(hit.args.replace(/\s/g, ''));
  if (inline) return 'UNGUARDED (inline finder — no name to compare against -1)';
  const name = hit.args.trim().split(/[^\w$]/)[0];
  if (!name) return 'UNGUARDED (no bound name)';
  const guard = new RegExp(`${name}\\s*(!==|!=|>|>=)\\s*(-1|0)|${name}\\s*===\\s*-1`);
  return guard.test(src) ? `guarded (\`${name}\` compared against -1 in file)` : `UNGUARDED (\`${name}\` never compared against -1)`;
}

// ── known positives, one axis apart ──────────────────────────────────────────────────────────
// KP-A is my own defective line, copied byte-for-byte out of the instrument Daedalus read.
// KP-B is the SAME expression wrapped across lines: the only axis between them is whitespace,
// so a detector that reads A and not B has the 394 defect and says so (one KP per shape is
// coverage of one axis, 382).
const KP_A = `const renamedAway = !/\\btype Row\\b/.test(readFileSync(join(REPO, PROBE_371_PATH), 'utf8').slice(readFileSync(join(REPO, PROBE_371_PATH), 'utf8').indexOf('ROUND 396 RE-KEY')));`;
const KP_B = `const renamedAway = !/\\btype Row\\b/.test(\n  readFileSync(join(REPO, PROBE_371_PATH), 'utf8').slice(\n    readFileSync(join(REPO, PROBE_371_PATH), 'utf8')\n      .indexOf('ROUND 396 RE-KEY'),\n  ),\n);`;
// CONTROL-NEG carries the window and the finder but the finder is REFUSAL-CHECKED first, so it
// must still be FOUND (the census reports guarded sites too) and classified `guarded`.
const CONTROL_NEG = `const at = src.indexOf('MARKER');\nconst ok = at !== -1 && !/x/.test(src.slice(at));`;
// CONTROL-ABSENT carries a window with no finder at all: must not be found.
const CONTROL_ABSENT = `const head = src.slice(0, 80);\nconst tail = other.substring(4, 9);`;

const kp = [
  ['KP-A (unwrapped, mine verbatim)', KP_A, 1, 'UNGUARDED'],
  ['KP-B (same expression, wrapped)', KP_B, 1, 'UNGUARDED'],
  ['CONTROL-NEG (refusal-checked)', CONTROL_NEG, 1, 'guarded'],
  ['CONTROL-ABSENT (window, no finder)', CONTROL_ABSENT, 0, null],
];
let kpOk = true;
console.log('── known positives and controls ──');
for (const [name, src, want, wantClass] of kp) {
  const found = sitesIn(src);
  const cls = found.length ? guardedness(src, found[0]) : '(n/a)';
  const clsOk = wantClass === null ? true : cls.startsWith(wantClass);
  const ok = found.length === want && clsOk;
  if (!ok) kpOk = false;
  console.log(`  ${ok ? 'ok ' : 'MISS'} ${name}: found ${found.length} (want ${want})${wantClass ? `, class ${clsOk ? 'ok' : `WRONG → ${cls}`}` : ''}`);
}

// ── the live population ──────────────────────────────────────────────────────────────────────
const files = execFileSync('git', ['ls-files'], { cwd: REPO, encoding: 'utf8' })
  .split('\n')
  .filter((p) => /\.(mjs|cjs|js|mts|cts|ts|tsx)$/.test(p));

const rows = [];
for (const p of files) {
  let src;
  try {
    src = readFileSync(join(REPO, p), 'utf8');
  } catch {
    rows.push({ p, line: 0, text: '(UNREADABLE)', cls: 'REFUSED' });
    continue;
  }
  for (const hit of sitesIn(src)) {
    const lineText = src.split('\n')[hit.line - 1] ?? '';
    const commentish = /^\s*(\/\/|\*|\/\*)/.test(lineText);
    rows.push({ p, line: hit.line, text: hit.text.length > 110 ? `${hit.text.slice(0, 107)}...` : hit.text, cls: guardedness(src, hit), commentish });
  }
}

console.log(`\n── live census: ${files.length} tracked JS/TS files scanned ──`);
for (const r of rows) {
  console.log(`  ${r.p}:${r.line}${r.commentish ? ' [comment line]' : ''}\n      ${r.cls}\n      ${r.text}`);
}
const unguarded = rows.filter((r) => r.cls.startsWith('UNGUARDED') && !r.commentish);
console.log(`\n  sites: ${rows.length}; UNGUARDED in code: ${unguarded.length}`);
for (const r of unguarded) console.log(`    UNGUARDED → ${r.p}:${r.line}`);

// ── the hand reading this detector grades ────────────────────────────────────────────────────
// Written down BEFORE the detector drove, from reading the hits by eye. If the detector and the
// hand disagree, there is no verdict to print — one of the two is wrong and which one is the
// finding (small-population lesson).
const HAND = {
  'docs/research/round396-instruments/grade-the-grade-that-reddens-on-its-own-routed-cure.mjs': 307,
};
const detected = Object.fromEntries(unguarded.map((r) => [r.p, r.line]));
const handKeys = Object.keys(HAND).sort();
const detKeys = Object.keys(detected).sort();
const agree =
  JSON.stringify(handKeys) === JSON.stringify(detKeys) && handKeys.every((k) => HAND[k] === detected[k]);

console.log('\n── grade ──');
console.log(`  known positives and controls all as expected: ${kpOk}`);
console.log(`  detector agrees with the hand reading: ${agree}`);
if (!agree) {
  console.log(`  HAND: ${JSON.stringify(HAND)}`);
  console.log(`  DETECTOR: ${JSON.stringify(detected)}`);
}
if (kpOk !== true || agree !== true) {
  console.log('\nNO VERDICT — the instrument did not grade true; read the rows, not a count.');
  process.exit(1);
}
console.log(`\nCENSUS OK — ${unguarded.length} unguarded refusable-index window(s) in ${files.length} tracked sources.`);
