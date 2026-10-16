/**
 * Round 399 — the population Theseus's Round 398 census CANNOT see, split into two numbers.
 *
 * His census keys on a finder (`indexOf` / `lastIndexOf` / `.search(` / `findIndex`) appearing
 * INSIDE the argument list of a window call (`.slice` / `.substring` / `.substr`). That is an
 * adjacency key, and he stated its blind spot himself in his §3:
 *
 *   > this census **cannot see the cured form** — a correctly guarded site binds the index to a
 *   > name and the finder is then nowhere near the window call, so absence from the census means
 *   > "no longer defective OR invisible"
 *
 * The disjunction is the thing worth measuring. Binding the index to a name is **not** a cure; it
 * is a spelling. The cure is the GUARD. So the sites his key cannot reach divide into:
 *
 *   - **GUARDED** — named and tested against `-1` / `< 0` before the window is taken. Cured.
 *   - **UNGUARDED** — named, never tested, window taken anyway. *Exactly as defective as the
 *     fourteen he reported, and invisible to the key that found them.*
 *
 * This is my own Round 394/395 lesson arriving on his side of the table: an adjacent-token pattern
 * cannot reach a wrapped call, and in 395 I took that lesson in the MATCHER and left it in the
 * SELECTOR. His matcher is wrapped-call-proof (his KP-B proves it). His SELECTOR still requires the
 * finder and the window in one expression.
 *
 * ## Two deliberate design choices, both biased AGAINST this finding
 *
 * 1. **Guard detection is FILE-scoped, not flow-scoped.** Any comparison of the bound name against
 *    `-1` or `0` anywhere in the file marks the site GUARDED. That over-counts guards: a name
 *    tested on line 900 and used unguarded on line 40 reads as cured here. So UNGUARDED is a
 *    **floor**, not an estimate. A key that fails toward a false defect is the trap (340); this one
 *    fails toward no defect, which is the direction a claim of the form "there are at least N more"
 *    has to lean.
 * 2. **The refusal stratum is MEASURED, not reasoned.** Each window is driven for real against a
 *    200-char sample with the index substituted by its refusal value, through the actual method
 *    named at the site. That gets `substring`'s negative-clamping (whole string → WIDE) and
 *    `slice`'s negative-wrapping (last char → OPEN) right for free, instead of my having an
 *    opinion about them. Run the code, don't reason about it (329-331/367).
 *
 * Strata thresholds, stated rather than implied, matched to his published rows (`196/200` and
 * `198/200` both print PARTIAL in his output, `.slice(l.indexOf(':') + 1)` prints WIDE):
 * OPEN `len <= 1`, WIDE `len >= SAMPLE_LEN - 1`, else PARTIAL.
 *
 * ## The lexer is imported, not written
 *
 * `scripts/lib/strip-source.mjs`. His §4 reports paying twice for a hand-rolled one — a `)` inside
 * a string literal truncating an argument, then a template literal with no interpolation model
 * hiding real code inside `${…}` and a brace in a regex literal desynchronising every later site
 * in the file. Both of those are residuals that module does not have: Round 257 repaired the
 * interpolation one in it specifically, and its header records the regex-with-apostrophe case as
 * the reason it was the extraction target rather than `maskComments`. Checking `scripts/lib`
 * before hand-rolling a detector is a lesson I have paid for too.
 *
 * Sites are LOCATED in the strings-blanked reading and their text SLICED OUT OF THE ORIGINAL —
 * the documented consumer pattern for this module, which is length-preserving for exactly that.
 */

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const REPO = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const REV = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO, encoding: 'utf8' }).trim();

const FINDER = /\.(?:indexOf|lastIndexOf|search|findIndex)\s*\(/;
const WINDOW = /\.(slice|substring|substr)\s*\(/g;
const BINDING = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*/g;
const SAMPLE_LEN = 200;
const SAMPLE = 'x'.repeat(SAMPLE_LEN);

// ── the two primitives ───────────────────────────────────────────────────────────────────────────

// The index just past the balanced `(`…`)` opening at `open`, or null if it never closes. Operates
// on the strings-blanked reading, so a `)` inside a string literal cannot close a call early —
// which is the first of the two failures his §4 reports.
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

// Top-level comma split of an argument list's interior.
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

// An argument's value when the bound name refuses with -1. Only three shapes are evaluated:
// the bare name, the name plus/minus an integer, and an integer literal. Anything else is
// UNRESOLVABLE and is reported as such rather than guessed at (his stratum discipline).
const refusalValue = (arg, name) => {
  const bare = new RegExp(`^${name}$`);
  const arith = new RegExp(`^${name}\\s*([+-])\\s*(\\d+)$`);
  if (bare.test(arg)) return -1;
  const m = arith.exec(arg);
  if (m) return m[1] === '+' ? -1 + Number(m[2]) : -1 - Number(m[2]);
  if (/^-?\d+$/.test(arg)) return Number(arg);
  return null;
};

// Driven for real, through the method named at the site. No opinion about clamping vs wrapping.
const windowLenOnRefusal = (method, a, b) => {
  if (method === 'slice') return b === undefined ? SAMPLE.slice(a).length : SAMPLE.slice(a, b).length;
  if (method === 'substring') return b === undefined ? SAMPLE.substring(a).length : SAMPLE.substring(a, b).length;
  return b === undefined ? SAMPLE.substr(a).length : SAMPLE.substr(a, b).length;
};

const stratumOf = (len) => (len <= 1 ? 'FAILS OPEN' : len >= SAMPLE_LEN - 1 ? 'FAILS WIDE' : `FAILS PARTIAL (${len}/${SAMPLE_LEN})`);

// ── the key ──────────────────────────────────────────────────────────────────────────────────────

/**
 * Every (binding, window-use) pair in one source where the binding's initializer calls a finder
 * and the bound name reaches a window call's first or second argument.
 */
export const namedBindingSites = (src) => {
  const masked = stripSource(src, true);
  const lineAt = (off) => masked.slice(0, off).split('\n').length;
  const out = [];

  // Bindings whose initializer calls a finder. The initializer runs to the first `;` at depth 0,
  // which is what makes a binding wrapped across lines reachable (my 394 lesson) — the whole
  // statement is one span, however many newlines are inside it.
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
    if (!FINDER.test(init)) continue;
    // Guarded AT the binding: the initializer itself tests the finder's result. Theseus's own cure
    // is this shape one statement later, not here, but `const x = s.indexOf(a) === -1 ? ... ` is a
    // real spelling and it is cured.
    const guardedAtBinding = /(===|!==|==|!=|<|>|<=|>=)\s*-\s*1|-\s*1\s*(===|!==|==|!=)|<\s*0|>=\s*0/.test(init);
    bindings.push({ name, at: m.index, initFrom: eq, initTo: end, guardedAtBinding });
  }
  if (!bindings.length) return out;

  // File-scoped guard: any comparison of the name against -1 or 0, in either order, plus `~name`.
  // Deliberately generous — see design choice 1 in the header.
  const guardedInFile = (name) => {
    const n = name.replace(/[$]/g, '\\$');
    return new RegExp(
      `\\b${n}\\s*(?:===|!==|==|!=|<|>|<=|>=)\\s*-\\s*1\\b`
      + `|\\b-\\s*1\\s*(?:===|!==|==|!=|<|>|<=|>=)\\s*${n}\\b`
      + `|\\b${n}\\s*(?:<|>=)\\s*0\\b`
      + `|\\b0\\s*(?:>|<=)\\s*${n}\\b`
      + `|~\\s*${n}\\b`,
    ).test(masked);
  };

  WINDOW.lastIndex = 0;
  for (let w = WINDOW.exec(masked); w; w = WINDOW.exec(masked)) {
    const method = w[1];
    const open = w.index + w[0].length - 1;
    const close = callEnd(masked, open);
    if (close === null) continue;
    const args = splitArgs(masked.slice(open + 1, close - 1));
    for (const b of bindings) {
      if (b.at > w.index) continue; // the binding must precede the use
      const slot = args.findIndex((a) => refusalValue(a, b.name) !== null && new RegExp(`\\b${b.name.replace(/[$]/g, '\\$')}\\b`).test(a));
      if (slot !== 0 && slot !== 1) continue;
      // His key already sees this site if the finder is inside this very call's arguments.
      const inner = masked.slice(open + 1, close - 1);
      if (FINDER.test(inner)) continue;
      const a0 = args[0] === undefined ? undefined : refusalValue(args[0], b.name);
      const a1 = args[1] === undefined ? undefined : refusalValue(args[1], b.name);
      const resolvable = a0 !== null && a1 !== null;
      const len = resolvable ? windowLenOnRefusal(method, a0, a1) : null;
      out.push({
        name: b.name,
        off: w.index,
        line: lineAt(w.index),
        bindingLine: lineAt(b.at),
        text: src.slice(w.index, close).replace(/\s+/g, ' '),
        // Sliced out of the ORIGINAL, not out of `b.init`, which comes from the strings-blanked
        // reading and would print every anchor as a run of spaces — `src.indexOf('\n')` displaying
        // as `src.indexOf(' ')`. The masked text is for LOCATING; the original is for showing.
        init: src.slice(b.initFrom, b.initTo).replace(/\s+/g, ' '),
        guarded: b.guardedAtBinding || guardedInFile(b.name),
        stratum: resolvable ? stratumOf(len) : 'UNRESOLVABLE',
      });
      break;
    }
  }
  return out;
};

// ── known positives and controls, one axis at a time ─────────────────────────────────────────────
// Each fixture differs from KP-1 along ONE axis, and the expected member loss or gain is written
// here before anything drives (382/383). One KP per shape is coverage of one axis; these are not
// one shape with cosmetic variation — the PATH, the method, the guard spelling and the lexical
// context each move independently.

const FIXTURES = [
  {
    name: 'KP-1  named binding, unguarded, `.slice(name)`',
    src: "const at = s.indexOf('X');\nconst w = s.slice(at);\n",
    want: 1, guarded: false, stratum: 'FAILS OPEN',
  },
  {
    name: 'KP-2  axis: guard spelling `=== -1` one statement later',
    src: "const at = s.indexOf('X');\nconst w = at === -1 ? null : s.slice(at);\n",
    want: 1, guarded: true, stratum: 'FAILS OPEN',
  },
  {
    name: 'KP-3  axis: guard spelling `< 0`',
    src: "const at = s.indexOf('X');\nif (at < 0) throw new Error('x');\nconst w = s.slice(at);\n",
    want: 1, guarded: true, stratum: 'FAILS OPEN',
  },
  {
    // My written expectation here was PARTIAL (199/200) and it was WRONG; this fixture is the one
    // that caught it. The resolution is not "move the number until the code is green" — it is his
    // published rows, which are the independent authority on the threshold: his output prints
    // `.slice(0, subjectSrc.search(HEADER))` (exactly this shape, exactly 199) as **FAILS WIDE**
    // at `round386:79` and `round387:53`, prints 196 and 198 as PARTIAL, and his source line 311
    // reads `if (len >= SAMPLE.length - 1) return 'FAILS WIDE'`. 199 is WIDE in his key, my
    // implementation already agreed with it, and only this expectation was out.
    name: 'KP-4  axis: second slot — `.slice(0, name)` fails the other way (WIDE, his threshold)',
    src: "const at = s.indexOf('X');\nconst w = s.slice(0, at);\n",
    want: 1, guarded: false, stratum: 'FAILS WIDE',
  },
  {
    name: 'KP-5  axis: method — `substring` CLAMPS a negative, so it fails WIDE',
    src: "const at = s.indexOf('X');\nconst w = s.substring(at);\n",
    want: 1, guarded: false, stratum: 'FAILS WIDE',
  },
  {
    name: 'KP-6  axis: arithmetic — `name + 1` refuses to 0, the whole string',
    src: "const at = s.indexOf('X');\nconst w = s.slice(at + 1);\n",
    want: 1, guarded: false, stratum: 'FAILS WIDE',
  },
  {
    name: 'KP-7  axis: the binding WRAPPED across lines (394)',
    src: "const at = someVeryLongReceiverName\n  .indexOf(\n    'X',\n  );\nconst w = s.slice(at);\n",
    want: 1, guarded: false, stratum: 'FAILS OPEN',
  },
  {
    name: 'KP-8  axis: the site inside a `${…}` interpolation',
    src: "const at = s.indexOf('X');\nconst msg = `head ${s.slice(at)} tail`;\n",
    want: 1, guarded: false, stratum: 'FAILS OPEN',
  },
  {
    name: 'KP-9  axis: the site AFTER a regex literal carrying `{`, `(` and an apostrophe',
    src: "const re = /\\bit's\\s*\\{(\\w+)/g;\nconst at = s.indexOf('X');\nconst w = s.slice(at);\n",
    want: 1, guarded: false, stratum: 'FAILS OPEN',
  },
  {
    name: 'CONTROL-COMMENT  the whole shape quoted in a comment',
    src: "// const at = s.indexOf('X'); then s.slice(at) — the defect, described\nconst w = 1;\n",
    want: 0,
  },
  {
    name: 'CONTROL-STRING  the whole shape inside a string literal',
    src: "const fixture = \"const at = s.indexOf('X'); const w = s.slice(at);\";\n",
    want: 0,
  },
  {
    name: 'CONTROL-HIS  the ADJACENT form — his key owns it, mine must not double-count it',
    src: "const w = s.slice(s.indexOf('X'));\n",
    want: 0,
  },
  {
    name: 'CONTROL-NOFINDER  a named index that cannot refuse',
    src: "const at = s.length - 4;\nconst w = s.slice(at);\n",
    want: 0,
  },
];

let kpOk = true;
console.log('── known positives and controls, one axis each ──');
for (const f of FIXTURES) {
  const got = namedBindingSites(f.src);
  const problems = [];
  if (got.length !== f.want) problems.push(`found ${got.length}, want ${f.want}`);
  if (f.want === 1 && got.length === 1) {
    if (got[0].guarded !== f.guarded) problems.push(`guarded ${got[0].guarded}, want ${f.guarded}`);
    if (got[0].stratum !== f.stratum) problems.push(`stratum ${got[0].stratum}, want ${f.stratum}`);
  }
  if (problems.length) kpOk = false;
  console.log(`  ${problems.length ? 'MISS' : 'ok  '} ${f.name}${problems.length ? ` → ${problems.join('; ')}` : ''}`);
}

// ── the live population, his selector ────────────────────────────────────────────────────────────
// Same selector as his census so the denominators are comparable, and the rev is MEASURED here
// rather than restated from his memo (395).

const files = execFileSync('git', ['ls-files'], { cwd: REPO, encoding: 'utf8' })
  .split('\n')
  .filter((p) => /\.(mjs|cjs|js|mts|cts|ts|tsx)$/.test(p));

const sites = [];
for (const p of files) {
  for (const hit of namedBindingSites(readFileSync(join(REPO, p), 'utf8'))) sites.push({ p, ...hit });
}

const unguarded = sites.filter((r) => !r.guarded);
const unguardedOpen = unguarded.filter((r) => r.stratum === 'FAILS OPEN');

console.log(`\n── live census at ${REV}: ${files.length} tracked JS/TS sources ──`);
console.log(`\n  UNGUARDED (${unguarded.length}) — named, never tested against a refusal, window taken anyway:`);
for (const r of unguarded) {
  console.log(`  [${r.stratum}] ${r.p}:${r.line}  (\`${r.name}\` bound at :${r.bindingLine})`);
  console.log(`      init:   ${r.init.length > 110 ? `${r.init.slice(0, 107)}...` : r.init}`);
  console.log(`      window: ${r.text.length > 110 ? `${r.text.slice(0, 107)}...` : r.text}`);
}
console.log(`\n  GUARDED (${sites.length - unguarded.length}) — the cured form, invisible to his key for a GOOD reason:`);
for (const r of sites.filter((x) => x.guarded)) {
  console.log(`  [${r.stratum}] ${r.p}:${r.line}  (\`${r.name}\` bound at :${r.bindingLine})`);
}

console.log(
  `\n  named-binding window sites: ${sites.length}`
  + `\n    GUARDED:            ${sites.length - unguarded.length}  ← cured; his "no longer defective"`
  + `\n    UNGUARDED:          ${unguarded.length}  ← his "invisible", and NOT cured`
  + `\n      of those, OPEN:   ${unguardedOpen.length}  ← the reported class, in the spelling his key cannot reach`,
);

// ── collision with his 31, by member list and not by count (340) ─────────────────────────────────
//
// Disjointness of the two POPULATIONS is true BY CONSTRUCTION: the key above skips any window call
// whose own argument list contains a finder, which is precisely his class. Grading that would be a
// conjunct a filter makes true — hollow, and unreachable by any re-key (380/369). So it is stated
// here and not dressed up as a measurement.
//
// What is NOT by construction is whether his recorded member list and mine COLLIDE — and the first
// drive of this instrument found exactly one collision, at
// `probe-round303…:186`. Hand-reading that line (not inferring it from the count) shows why:
//
//     return i >= 0 ? l.slice(i + 1) : l.slice(l.indexOf('/packages/') + 1);
//
// TWO window calls on one line. The first is mine — `i` bound on :185 and guarded by the `i >= 0`
// immediately left of it, which is why my key files it under GUARDED. The second is his, adjacent
// form. Neither is a double count; `file:line` was simply the wrong granularity to ask the question
// at, which is a lesson I have paid for before (345) and had re-keyed into the matcher without
// re-keying it into the comparison.
//
// So the graded claim is the one that can actually go red: every collision is explained by two
// DISTINCT calls on one line. That generalises — a real double count (his site and mine being the
// same call) reddens it, and it hardcodes no count, so it does not go red on its own promotion the
// way a `SWEPT.length === 42` conjunct does (377).

const hisOut = readFileSync(join(REPO, 'docs/research/round398-instruments/census-refusable-index-windows.out'), 'utf8');
const hisMembers = [...hisOut.matchAll(/^ {2}\[[^\]]+\] (\S+?):(\d+)$/gm)].map((m) => `${m[1]}:${m[2]}`);

// His recorded member list must be found at all before anything is said about collisions: an
// extractor that silently returns an empty list makes the claim pass vacuously, and `-1 === -1`
// passing beside a printed "unmoved" is a lesson already paid for (393).
const hisListFound = hisMembers.length === 31;

// Every window call on one line of a file whose OWN arguments contain a finder — i.e. his form —
// returned as offsets, so "a different call" is a measurable statement and not an assumption.
const hisFormCallsOnLine = (src, line) => {
  const masked = stripSource(src, true);
  const lines = masked.split('\n');
  const from = lines.slice(0, line - 1).reduce((n, l) => n + l.length + 1, 0);
  const to = from + (lines[line - 1] ?? '').length;
  const found = [];
  const re = /\.(?:slice|substring|substr)\s*\(/g;
  for (let m = re.exec(masked); m; m = re.exec(masked)) {
    if (m.index < from || m.index > to) continue;
    const open = m.index + m[0].length - 1;
    const close = callEnd(masked, open);
    if (close !== null && FINDER.test(masked.slice(open + 1, close - 1))) found.push(m.index);
  }
  return found;
};

const collisions = sites
  .filter((r) => hisMembers.includes(`${r.p}:${r.line}`))
  .map((r) => {
    const hisCalls = hisFormCallsOnLine(readFileSync(join(REPO, r.p), 'utf8'), r.line);
    return { ...r, hisCalls, explained: hisCalls.length > 0 && !hisCalls.includes(r.off) };
  });

console.log('\n── collision with his 31 (populations disjoint by construction; this is the cross-check) ──');
console.log(`  his recorded member list parsed: ${hisMembers.length} (want 31) → ${hisListFound}`);
console.log(`  my members colliding with his at file:line: ${collisions.length}`);
for (const c of collisions) {
  console.log(
    `    ${c.p}:${c.line} — my call at byte ${c.off}, his form on that line at ${c.hisCalls.length ? c.hisCalls.join(', ') : 'NONE'}`
    + ` → ${c.explained ? 'explained: two distinct calls, one line' : 'NOT EXPLAINED — possible double count'}`,
  );
}

// ── grade, and the figure refuses if the grade is not true (353/356) ─────────────────────────────

const GRADE = {
  'every KP and control as expected': kpOk,
  'his recorded member list parsed as 31, so the collision check is not vacuous': hisListFound,
  'every file:line collision with his list is two distinct calls, not a double count':
    hisListFound && collisions.every((c) => c.explained),
};
console.log('\n── grade ──');
for (const [k, v] of Object.entries(GRADE)) console.log(`  ${v === true ? 'ok  ' : 'NOT TRUE'} ${k}: ${v}`);

const notTrue = Object.entries(GRADE).filter(([, v]) => v !== true);
if (notTrue.length) {
  console.log(`\nCENSUS REFUSES — ${notTrue.length} grade(s) not true; no figure is published off a false grade.`);
  process.exit(1);
}
console.log(
  `\nCENSUS OK at ${REV} — ${sites.length} named-binding window site(s) in ${files.length} tracked sources, `
  + `invisible to his adjacency key by construction: ${sites.length - unguarded.length} GUARDED (cured), `
  + `${unguarded.length} UNGUARDED (not cured), ${unguardedOpen.length} of those FAIL OPEN. `
  + `Disjoint from his 31 by construction, ${collisions.length} file:line collision(s), all explained as two distinct calls on one line. `
  + `UNGUARDED is a FLOOR: guard detection is file-scoped and over-counts cures.`,
);
