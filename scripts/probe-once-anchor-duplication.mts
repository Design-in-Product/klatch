/**
 * The `once()` mutation helper (`probe-round374`/`375`/`377`, each copy-pasting the same six-line
 * function) throws `anchor not unique (N)` when its `from` argument does not occur exactly once in
 * the text it is applied to. `unit-465plant` (Daedalus, 11/10) and `unit-465widen` (Daedalus, 11/10,
 * widening Theseus's 11/10 §5.3 finding that the narrow key misses a parameter-forwarded anchor)
 * built and graded, across two research units and two seats, the screen this promotes: a literal
 * declaration consumed by `once(` — directly, or through a function parameter at depth <= 4 — whose
 * value already occurs more than once in the file that declares it.
 *
 * This is a DECLARING-FILE proxy, not a simulation of the real runtime target. `once()`'s `from`
 * argument is checked against whatever source text it is actually called on — for every live call
 * site in these three files, that is a DIFFERENT file (the one being copied/mutated), reached
 * through a parameter or a `readFileSync` the walker below does not resolve. The screen instead
 * checks occurrence **within the file that declares the anchor**. That is not the same question,
 * and it answers the real one only when a duplicate in the declaring file happens to coincide with
 * a duplicate in the actual target — which is exactly what happened in the one real bug this file
 * is grounded in (Section D): `C_SWEEP`'s value duplicates a line elsewhere IN THE SAME FILE
 * (`probe-round375:70`), not inside the text `once()` was actually called on. Named rather than
 * smoothed over, on the precedent Daedalus's own 11/11 `unit-465fixture` memo set for a sibling
 * guard: a check that is load-bearing by incidental geometry is still worth having, but is not the
 * same claim as a direct simulation, and a reader relying on it should know which one they have.
 * A target-tracking version is unclaimed, named, not attempted here.
 *
 * R4 (don't promote a finding in the fire that built it) is not in play: the finding being promoted
 * — `K-onceR` and the screen it widens — was built and graded by Daedalus in two prior fires
 * (11/10), not in this one. What is new in this file is the production form: a self-contained
 * implementation (not importing `docs/research/*` scratch paths, which are not a stable dependency
 * for a permanent gate leg) and a STATIC check over the live tree rather than a two-rev delta. The
 * delta framing ("ADDED since base") was the right shape for forensic analysis of when a bug
 * landed; a standing gate re-runs every sweep regardless of what just changed, so it asserts the
 * invariant directly — no `once()`-consumed anchor should have a value that already duplicates
 * inside its own file — which is a strict superset of "no such anchor was added by the latest
 * commit" and needs no commit-recency selector (the exact instability
 * `RECORDING-REPRICABILITY-CONVENTION.md` §2 test 2 warns about).
 *
 * The population is read live (Section B), not hardcoded to the files that hold the helper today —
 * `B1`'s own `[MEAS]` line reports the membership on every run, so no count is frozen here either.
 * A further copier is covered automatically **only if it pastes the helper byte-identically into a
 * `.mts` file.** The selector admits `.mjs` by extension and then requires `ONCE_HELPER`, a string
 * carrying TypeScript annotations (`: string`) — two conjuncts that cannot both hold, so the `.mjs`
 * branch is unsatisfiable by construction; and a `.mts` copy merely re-wrapped across lines by a
 * formatter is outside the population too. Both driven, with the matched positive (the typed slice
 * from a real member does satisfy the conjunct, so the negatives are about the selector and not a
 * broken slice): `docs/research/unit-465oncegate-2026-11-11` (Daedalus, 11/11 STOP). **Today this is
 * a reach limitation of this sentence, not a live blindness** — no `probe-*.mjs` declares a `once()`
 * helper under any spelling, and the selector reaches every file that does, both read live in that
 * unit. Widening the selector is a design call left to this file's author rather than taken here.
 *
 * **Why the gate is a baseline diff, not a bare "zero live flags" assertion.** Driving this file
 * against the real tree (Section F) found what `unit-465plant`'s own RESULTS.md §5 already named
 * and measured: "`occ(declaring file, v) >= 2` is a risk signal, not a crash prediction... of the 14
 * K-once flags in all of `scripts/` history, one (`C_SWEEP`) actually threw. The other 13 are
 * standing non-unique anchors." Some of those standing anchors are live in this file's own
 * population today. **The count is deliberately not written here** — `F1`'s own `[MEAS]` line
 * reports it on every single run (`… live flag(s) · … grandfathered · … new`), so a frozen number in
 * this docblock could only drift away from it in silence, the predicate being count-free and
 * therefore permanently green either way. (This sentence previously said "three", which was the
 * per-file figure; the population-wide figure F1 prints was already three times that on the day of
 * promotion. Daedalus, `unit-465oncegate-2026-11-11`, graded under `unit-465plant` §5's own key —
 * flagged declarations — and under both re-keyings that might have rescued it, distinct names and
 * distinct values. The cure is to delete the number, not to refresh it.) The live flags are
 * import-continuation fragments and single-line boilerplate — `const HERE = ...`, but also a
 * `readFileSync(...)` or `join(...)` line — duplicated between a copier's own header and the text it
 * quotes to redirect a sibling file's same header; flagging them on every sweep would redden
 * permanently on accepted, harmless state, which is not what either research unit asked for. Theseus's own §3 framed the
 * value as catching a new anchor "at a moment it can still be withdrawn" — i.e. a check on what
 * changes, not a standing audit of everything already shipped. So the gate asserts: no
 * once()-consumed (name, value) pair is flagged live that was not ALREADY flagged, identically, at
 * a fixed baseline rev. New members of the population (future copier files) are not grandfathered —
 * they have no baseline entry, so every flag on arrival is live, matching Theseus's own posthoc (c)
 * concern that a new file is "the highest-risk case there is."
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');

const results: ProbeVerdict[] = [];
const measurements: string[] = [];
const check = (arm: string, check_: string, pass: boolean) => {
  results.push({ arm, check: check_, pass, kind: 'regression' });
  console.log(`${pass ? '[ok]' : 'FAIL'} ${arm}  ${check_}`);
};
const meas = (arm: string, line: string) => {
  measurements.push(`${arm}  ${line}`);
  console.log(`[MEAS] ${arm}  ${line}`);
};

// ── shared apparatus — self-contained, not imported from docs/research/* scratch files ───────────

/** A substring count over the whole text — v1's own definition, reused by every unit since. */
const occ = (hay: string, needle: string) => (needle === '' ? -1 : hay.split(needle).length - 1);

const SIMPLE: Record<string, string> = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', '0': '\0' };

/**
 * Parse `rhs` as a single JS string literal that occupies the WHOLE of `rhs` (no trailing
 * concatenation or call). An unknown escape or any interpolation marks it UNREAD rather than
 * guessing a runtime value — a guessed value would silently change every `occ()` derived from it.
 */
function parseLiteral(rhs: string): { value: string } | { unread: string } {
  const q = rhs[0];
  if (q !== "'" && q !== '"' && q !== '`') return { unread: 'rhs is not a string literal' };
  let out = '';
  let i = 1;
  while (i < rhs.length) {
    const c = rhs[i];
    if (c === '\\') {
      const e = rhs[i + 1];
      if (e === undefined) return { unread: 'trailing backslash' };
      if (e in SIMPLE) { out += SIMPLE[e]; i += 2; continue; }
      if (e === '\\' || e === "'" || e === '"' || e === '`') { out += e; i += 2; continue; }
      if (e === 'x') {
        const h = rhs.slice(i + 2, i + 4);
        if (!/^[0-9a-fA-F]{2}$/.test(h)) return { unread: 'malformed \\x escape' };
        out += String.fromCharCode(parseInt(h, 16)); i += 4; continue;
      }
      if (e === 'u') {
        const h = rhs.slice(i + 2, i + 6);
        if (!/^[0-9a-fA-F]{4}$/.test(h)) return { unread: 'malformed \\u escape' };
        out += String.fromCharCode(parseInt(h, 16)); i += 6; continue;
      }
      return { unread: `unknown escape \\${e}` };
    }
    if (q === '`' && c === '$' && rhs[i + 1] === '{') return { unread: 'template interpolation' };
    if (c === q) return i === rhs.length - 1 ? { value: out } : { unread: 'rhs continues past the literal' };
    out += c;
    i++;
  }
  return { unread: 'unterminated literal' };
}

type Decl = { value: string; line: number };

/** Every one-line `const NAME = <pure string literal>;` in `src`. */
function literalDecls(src: string): Map<string, Decl> {
  const decls = new Map<string, Decl>();
  const lines = src.split('\n');
  for (let n = 0; n < lines.length; n++) {
    const m = /^const ([A-Za-z_$][\w$]*) = (.*);[ \t]*$/.exec(lines[n]);
    if (!m) continue;
    const p = parseLiteral(m[2]);
    if ('unread' in p) continue;
    decls.set(m[1], { value: p.value, line: n + 1 });
  }
  return decls;
}

/** Walk from the '(' after a call to its match, returning the top-level comma-split argument texts. */
function argsAt(text: string, openIdx: number): { args: string[]; end: number } | null {
  let depth = 0;
  let cur = '';
  const out: string[] = [];
  let quote: string | null = null;
  for (let i = openIdx; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      cur += ch;
      if (ch === '\\') { cur += text[++i] ?? ''; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; cur += ch; continue; }
    if (ch === '(' || ch === '[' || ch === '{') { depth++; if (depth === 1 && ch === '(') continue; cur += ch; continue; }
    if (ch === ')' || ch === ']' || ch === '}') {
      depth--;
      if (depth === 0) { out.push(cur.trim()); return { args: out, end: i }; }
      cur += ch;
      continue;
    }
    if (ch === ',' && depth === 1) { out.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  return null;
}

const lineOf = (text: string, idx: number) => text.slice(0, idx).split('\n').length;

const FNDECL = /^\s*(?:export\s+)?(?:const\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?\(|function\s+([A-Za-z0-9_$]+)\s*\()/;

/** The body span of function `fname` in `src`: its declaration line to the first line `^};?\s*$`. */
function bodyOf(src: string, fname: string): { declLine: number; params: string[]; body: string; bodyOffset: number } | null {
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = FNDECL.exec(lines[i]);
    if (!m) continue;
    if ((m[1] ?? m[2]) !== fname) continue;
    const openIdx = lines.slice(0, i).join('\n').length + (i > 0 ? 1 : 0) + lines[i].indexOf('(', lines[i].indexOf(fname));
    const parsed = argsAt(src, openIdx);
    if (!parsed) continue;
    const params = parsed.args.map((p) => p.split(':')[0].trim().replace(/^\.\.\./, ''));
    let end = lines.length;
    for (let j = i + 1; j < lines.length; j++) if (/^\};?\s*$/.test(lines[j])) { end = j + 1; break; }
    return { declLine: i + 1, params, body: lines.slice(i, end).join('\n'), bodyOffset: i };
  }
  return null;
}

type Chain = { key: boolean; chain: string[] };

/**
 * `K-onceR` (Daedalus, `unit-465widen-2026-11-10`): is `name`, declared at `declLine`, consumed by
 * `once(` — directly, or through a function parameter, depth <= 4, cycle-guarded?
 */
function consumedByOnce(
  src: string,
  name: string,
  declLine: number,
  depth = 0,
  seen: Set<string> = new Set(),
  scope: { body: string; bodyOffset: number } | null = null,
): Chain {
  const lines = (scope ? scope.body : src).split('\n');
  const lineBase = scope ? scope.bodyOffset : 0;
  const re = new RegExp(`\\b${name}\\b`);
  for (let i = 0; i < lines.length; i++) {
    const absolute = lineBase + i + 1;
    if (absolute === declLine) continue;
    if (!re.test(lines[i])) continue;
    if (/\bonce\s*\(/.test(lines[i])) return { key: true, chain: [`once(… ${name} …) :${absolute}`] };
  }
  if (depth >= 4) return { key: false, chain: [] };
  const callRe = /\b([A-Za-z_$][\w$]*)\s*\(/g;
  const text = scope ? scope.body : src;
  let m: RegExpExecArray | null;
  while ((m = callRe.exec(text)) !== null) {
    const fname = m[1];
    if (fname === 'once' || fname === 'if' || fname === 'for' || fname === 'while' || fname === 'return') continue;
    const open = m.index + m[0].length - 1;
    const parsed = argsAt(text, open);
    if (!parsed) continue;
    const pos = parsed.args.findIndex((a) => a.trim() === name);
    if (pos === -1) continue;
    const callLine = lineBase + lineOf(text, open);
    const fn = bodyOf(src, fname);
    if (!fn) continue;
    const param = fn.params[pos];
    if (param === undefined) continue;
    const cycleKey = `${fname}#${param}`;
    if (seen.has(cycleKey)) continue;
    seen.add(cycleKey);
    const inner = consumedByOnce(src, param, fn.declLine, depth + 1, seen, fn);
    if (inner.key) {
      return { key: true, chain: [...inner.chain, `${fname}(…) :${callLine} arg${pos}=${name} → param${pos}=${param}`] };
    }
  }
  return { key: false, chain: [] };
}

/** FLAG iff the declared name reaches `once(` and its value already occurs >=2 times in `src`. */
function flagsIn(src: string): Array<{ name: string; value: string; line: number; occ: number; chain: string[] }> {
  const flags: Array<{ name: string; value: string; line: number; occ: number; chain: string[] }> = [];
  for (const [name, d] of literalDecls(src)) {
    const k = consumedByOnce(src, name, d.line);
    if (!k.key) continue;
    const n = occ(src, d.value);
    if (n >= 2) flags.push({ name, value: d.value, line: d.line, occ: n, chain: k.chain });
  }
  return flags;
}

// ── Section A — apparatus self-check ──────────────────────────────────────────────────────────────

check('A1', 'parseLiteral round-trips a plain single-quoted literal', (() => {
  const p = parseLiteral("'hello'");
  return 'value' in p && p.value === 'hello';
})());
check('A2', 'parseLiteral refuses a template literal carrying interpolation, rather than guessing', (() => {
  const p = parseLiteral('`a${b}c`');
  return 'unread' in p && p.unread === 'template interpolation';
})());
check('A3', 'occ counts a known-2 toy string as 2 and a known-1 toy string as 1', (() => {
  const two = 'const X = 1;\nfoo(X);\nconst X = 1;\n'; // same literal text occurring twice
  return occ(two, 'const X = 1;') === 2 && occ('only once here', 'once') === 1;
})());
check('A4', 'literalDecls finds a pure one-line literal and skips a derived (non-literal) RHS', (() => {
  const toy = "const A = 'lit';\nconst B = A.toUpperCase();\n";
  const d = literalDecls(toy);
  return d.get('A')?.value === 'lit' && !d.has('B');
})());

// ── Section B — the population is read live, not hardcoded ───────────────────────────────────────

// The defining line, built from parts so this file's OWN source does not itself contain the
// literal text being searched for — a probe that greps for its own search string finds itself.
const ONCE_HELPER = ['const once = (src', ': string, from', ': string, to', ': string) => {'].join('');
const SELF = 'probe-once-anchor-duplication.mts';
const scriptsDir = join(REPO, 'scripts');
const population = readdirSync(scriptsDir)
  .filter((f) => /^probe-/.test(f) && (f.endsWith('.mts') || f.endsWith('.mjs')) && f !== SELF)
  .filter((f) => readFileSync(join(scriptsDir, f), 'utf8').includes(ONCE_HELPER))
  .sort();

check('B1', 'at least one scripts/probe-*.mts file defines the once() mutation helper — a leg that ' +
  'cannot see its own population must not score clean', population.length >= 1);
meas('B1', `${population.length} file(s) define the once() helper: ${population.join(', ')}`);

// ── Section C — the walker reaches the live population it is meant to cover ──────────────────────

const liveFlagsByFile = new Map<string, ReturnType<typeof flagsIn>>();
for (const f of population) liveFlagsByFile.set(f, flagsIn(readFileSync(join(scriptsDir, f), 'utf8')));
check('C1', 'every file in the live population has at least one once()-consumed literal declaration ' +
  'findable by the walker (sanity that it reaches real anchors, not an assertion of zero risk)', (() => {
  if (population.length === 0) return false;
  return population.every((f) => {
    const src = readFileSync(join(scriptsDir, f), 'utf8');
    return [...literalDecls(src).entries()].some(([name, d]) => consumedByOnce(src, name, d.line).key);
  });
})());

// ── Section D — the real bug, read at a pinned rev (not a recency-keyed selector) ────────────────
// `unit-465plant`'s KP-REAL / CTRL-REAL pair (Daedalus, 11/10), read directly rather than retyped.

const blob = (rev: string, path: string): string | null => {
  try {
    return execFileSync('git', ['-C', REPO, 'show', `${rev}:${path}`], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  } catch {
    return null;
  }
};

const R375 = 'scripts/probe-round375-the-guard-on-the-routed-cure-reddens-on-the-cure-and-passes-on-a-comment.mts';
const KP_REV = 'e501d6af78199be22c0972a08ee2cc9c1e0582ec'; // the commit that introduced the real bug
const CURE_REV = '3489290f5887f32f3a7a6e289f1ad92dcbf23106'; // Daedalus's own cure, same day

const kpSrc = blob(KP_REV, R375);
const cureSrc = blob(CURE_REV, R375);
check('D1', `at the pinned KP rev (${KP_REV.slice(0, 8)}), C_SWEEP is among the once()-consumed ` +
  'literal declarations the screen flags, with its value occurring twice in its own file — the ' +
  'anchor that actually threw (other flags at this rev are the standing boilerplate-echo class ' +
  'named in Section F, not asserted away here, since D1 is about C_SWEEP specifically)', (() => {
  if (kpSrc === null) return false;
  const flags = flagsIn(kpSrc);
  const c = flags.find((f) => f.name === 'C_SWEEP');
  return c !== undefined && c.occ === 2;
})());
check('D2', `at the pinned cure rev (${CURE_REV.slice(0, 8)}), C_SWEEP is no longer a pure literal ` +
  'declaration at all — the cure moved it to a regex-derived value, which is why the screen reports ' +
  'no flag on it there (the matched negative is structural, not an occurrence count that happened ' +
  'to move; the unrelated boilerplate-echo flags persist at this rev too and are not the claim)', (() => {
  if (cureSrc === null) return false;
  return !literalDecls(cureSrc).has('C_SWEEP') && !flagsIn(cureSrc).some((f) => f.name === 'C_SWEEP');
})());

// ── Section E — the planted pair, additive, for the route K-once (narrow) cannot see ─────────────
// Theseus's 11/10 §5.3 finding, widened by Daedalus's K-onceR: a declaration reaching `once(`
// through a function PARAMETER, not only directly.

const PLANT_PARAM = `const SB = "const SANDBOX = 'dup';";
const ECHO = "const SANDBOX = 'dup';";
const copy = (file, decl) => {
  let s = readFileSync(file, 'utf8');
  s = once(s, decl, 'replacement');
  return s;
};
copy('f.mts', SB);
`;
const CTRL_UNIQUE_PARAM = `const SB = "const SANDBOX = 'uniq';";
const copy = (file, decl) => {
  let s = readFileSync(file, 'utf8');
  s = once(s, decl, 'replacement');
  return s;
};
copy('f.mts', SB);
`;
const CTRL_DIRECT_DUP = `const DD = "const SANDBOX = 'dup';";
const ECHO = "const SANDBOX = 'dup';";
let s = readFileSync('f.mts', 'utf8');
s = once(s, DD, 'replacement');
`;

check('E1', 'PLANT (parameter route, duplicated value) flags — this is the case K-once (narrow) ' +
  'cannot see and K-onceR was built to widen into', flagsIn(PLANT_PARAM).length === 1 && flagsIn(PLANT_PARAM)[0].name === 'SB');
check('E2', 'CTRL-unique (parameter route, unique value) does not flag — the matched negative on E1', flagsIn(CTRL_UNIQUE_PARAM).length === 0);
check('E3', 'CTRL-direct (direct route, duplicated value) flags — the direct route both keys agree on', flagsIn(CTRL_DIRECT_DUP).length === 1 && flagsIn(CTRL_DIRECT_DUP)[0].name === 'DD');

// ── Section F — the live gate: NEW flags beyond a fixed, grandfathered baseline ──────────────────
//
// `occ(declaring file, v) >= 2` is a risk signal, not a crash prediction (unit-465plant RESULTS.md
// §5, measured: of 14 K-once flags in scripts/ history, 1 threw and 13 are standing non-unique
// anchors — boilerplate a copier's own header shares with the text it quotes to redirect a
// sibling's same header). A bare "zero live flags" gate would redden permanently on those 13's
// live descendants. So the gate grandfathers every (name, value) pair already flagged, identically,
// at a fixed baseline rev chosen once at promotion — a literal rev, not a recency-keyed selector
// (`RECORDING-REPRICABILITY-CONVENTION.md` §2 test 2) — and fails only on a flag that is NEW since
// then. A brand-new copier file has no baseline entry, so every one of its flags is new by
// construction — Theseus's own posthoc (c): an added file is the highest-risk case there is.

const BASELINE_REV = '467b8209052394096ea59679e735f2937992c64a'; // Argus's own checkpoint, this fire, pre-dating this file

type FlagKey = string; // `${file}\u0000${name}\u0000${value}`
const flagKey = (file: string, name: string, value: string): FlagKey => `${file}\u0000${name}\u0000${value}`;

const baselineKeys = new Set<FlagKey>();
for (const f of population) {
  const base = blob(BASELINE_REV, `scripts/${f}`);
  if (base === null) continue; // no baseline entry at all — every live flag on this file is new
  for (const flag of flagsIn(base)) baselineKeys.add(flagKey(f, flag.name, flag.value));
}

const liveFlags = population.flatMap((f) => (liveFlagsByFile.get(f) ?? []).map((flag) => ({ file: f, ...flag })));
const grandfathered = liveFlags.filter((f) => baselineKeys.has(flagKey(f.file, f.name, f.value)));
const newFlags = liveFlags.filter((f) => !baselineKeys.has(flagKey(f.file, f.name, f.value)));

for (const f of liveFlags) {
  const tag = baselineKeys.has(flagKey(f.file, f.name, f.value)) ? 'grandfathered' : 'NEW';
  console.log(`  LIVE FLAG [${tag}]  ${f.file}  ${f.name} :${f.line}  occ=${f.occ}`);
  for (const hop of f.chain) console.log(`      chain: ${hop}`);
}
check('F1', `every live once()-consumed duplicate-value anchor across the ${population.length}-file ` +
  `population was already flagged, identically, at the baseline rev (${BASELINE_REV.slice(0, 8)}) — ` +
  'no new one has landed since', newFlags.length === 0);
meas('F1', `${liveFlags.length} live flag(s) · ${grandfathered.length} grandfathered · ${newFlags.length} new`);

console.log('');
for (const m of measurements) console.log(`[MEAS] ${m}`);

summariseAndExit({ probeName: 'probe-once-anchor-duplication', results });
