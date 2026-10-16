/**
 * Round 400 — the guard leg of his Round 399 census, re-scoped.
 *
 * ## What this grades
 *
 * His Round 399 census partitions 51 named-binding window sites into 37 GUARDED and 14 UNGUARDED,
 * and his memo states the approximation in the guard leg plainly:
 *
 *   > Guard detection is FILE-scoped: any comparison of the bound name against `-1` or `0` anywhere
 *   > in the file marks the site cured, so a name tested on line 900 and used unguarded on line 40
 *   > reads as GUARDED here. **14 is a floor, not an estimate.**
 *
 * I agree with the direction and I am not disputing it. The number I want is **how high the floor
 * is**, because "14, floor" and "14, floor, and the true value is 30" are different audit
 * instructions and his memo cannot tell them apart.
 *
 * ## Why this is the lever and not a nitpick
 *
 * He took the nearest-preceding-binding lesson (341) in the RESOLVER — that is §3's first
 * correction, 62 → 51 sites, and it is right. `guardedInFile` is the same key on the same corpus
 * with none of it: a bare `\bname\b` comparison test over the whole masked file, position-blind and
 * binding-blind. That is my own Round 395 lesson in his instrument — *the lesson went into the
 * matcher and stayed out of the selector* — and the reason it is worth measuring rather than
 * asserting is that the two halves of the approximation are separable and only one of them is
 * cheap to see by hand.
 *
 * ## The three modes
 *
 * `guardedAtBinding` (the initializer itself tests the finder's result) is correctly scoped already
 * and is untouched in every mode. Only `guardedInFile` is re-keyed:
 *
 *   - `file`  — his: a guard comparison of `name` anywhere in the masked source.
 *   - `pos`   — the guard must occur at an offset BEFORE the window site. Straight-line reachability
 *               only; this is not a flow model and does not claim to be one.
 *   - `bind`  — the guard's own nearest-preceding binding of `name` must be the SAME binding the
 *               site resolved to. His resolver, applied to the guard.
 *   - `both`  — conjunction.
 *
 * Each is a pure filter on one disjunct of `guarded`, so each mode's GUARDED set is a SUBSET of
 * `file`'s by construction, and the total site count is invariant at his 51. Both are asserted
 * rather than argued (380/385: a leg written as a filter is monotone, a leg that QUANTIFIES is not,
 * and these are filters).
 *
 * ## What is pinned, and at which rev
 *
 * GRADE A reproduces his published member list — not his counts — under his own key. It drives at
 * **the rev his own recording names**, read out of his `.out` file rather than restated from his
 * memo (395), in a detached worktree (389). That matters for a reason that is not pedantry: this
 * file becomes tracked the moment it is committed, it contains window calls on named bindings, and
 * a member-list comparison pinned to a LIVE population would redden on its own promotion (377).
 * Pinning the grade to his rev makes it checkable forever. The live regrade at HEAD is printed
 * afterwards as the finding, and nothing gates on its size.
 *
 * ## Residuals, stated
 *
 * `pos` is offset order, not control flow: a guard inside a function declared above the site but
 * called below it reads as preceding. `bind` has no block-scope model, inherited from his resolver
 * unchanged. Both approximations make a site read GUARDED when it may not be — so every mode here
 * leans the same way his does, and the regraded UNGUARDED count is a floor for the same reason his
 * 14 is. A key whose headline is "the floor is higher than reported" has to lean that way.
 *
 * The lexer is his and his is `scripts/lib/strip-source.mjs`; I import the same module.
 */

import { readFileSync, existsSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const REPO = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const HEAD = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO, encoding: 'utf8' }).trim();

const HIS_OUT = join(REPO, 'docs/research/round399-instruments/census-the-named-binding-form.out');

// His constants, unchanged — a different threshold would make the strata incomparable.
const FINDER = /\.(?:indexOf|lastIndexOf|search|findIndex)\s*\(/;
const WINDOW = /\.(slice|substring|substr)\s*\(/g;
const BINDING = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*/g;
const SAMPLE_LEN = 200;
const SAMPLE = 'x'.repeat(SAMPLE_LEN);

// ── his primitives, unchanged ────────────────────────────────────────────────────────────────────

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

// ── the key, with the guard leg parameterised ────────────────────────────────────────────────────

// His guard alternation, verbatim in content, with `g` so the OFFSETS of the matches are reachable.
// That is the only change the re-scoping needs: his version asks whether a guard exists, mine asks
// where each one is.
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

  // Every guard comparison of `name`, with its offset. Collected for ALL candidates and filtered
  // afterwards — not filtered before resolving, which is the mechanism behind 341/399 and the one
  // way this re-key could have reproduced his bug in a new place.
  const guardsOf = (name) => {
    const re = guardRe(name);
    const hits = [];
    for (let g = re.exec(masked); g; g = re.exec(masked)) hits.push(g.index);
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
    const accepted = hits.filter((g) => {
      if ((mode === 'pos' || mode === 'both') && !(g < w.index)) return false;
      if (mode === 'bind' || mode === 'both') {
        const gb = resolve(name, g);
        if (gb === null || gb.at !== b.at) return false;
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
      stratum: nameVal === null ? 'UNMODELLED (compound initializer)' : resolvable ? stratumOf(len) : 'UNRESOLVABLE',
    });
  }
  return out;
};

// ── known positives for the NEW legs, one axis each, expectations written here first ─────────────
//
// KP-1 and KP-4 below are his KP-1 and KP-3 unchanged: the floor and ceiling of the guard leg, and
// they must not move under any re-key. The two new axes are isolated to one each, and each is the
// OTHER's control against a mode that has degenerated to "always false":
//
//   - G-POS moves only under `pos`  → so `bind` reading true here proves `bind` still finds guards.
//   - G-BIND moves only under `bind` → so `pos` reading true here proves `pos` still finds guards.
//
// Keying a control on the defect's CONTENT rather than its bytes (383) is what that pairing is.

const GUARD_FIXTURES = [
  {
    name: 'KP-1   his: unguarded stays unguarded under every mode',
    src: "const at = s.indexOf('X');\nconst w = s.slice(at);\n",
    want: 1, guarded: { file: false, pos: false, bind: false, both: false },
  },
  {
    name: 'KP-4   his KP-3: guard precedes the site, same binding — cured under every mode',
    src: "const at = s.indexOf('X');\nif (at < 0) throw new Error('x');\nconst w = s.slice(at);\n",
    want: 1, guarded: { file: true, pos: true, bind: true, both: true },
  },
  {
    // AXIS: position only. Same binding, same name, guard is simply BELOW the use. His memo's own
    // "tested on line 900 and used unguarded on line 40".
    name: 'G-POS  axis: the guard is AFTER the window site',
    src: "const at = s.indexOf('X');\nconst w = s.slice(at);\nif (at < 0) throw new Error('x');\n",
    want: 1, guarded: { file: true, pos: false, bind: true, both: false },
  },
  {
    // AXIS: binding identity only. The guard PRECEDES the site in offset order, so `pos` accepts
    // it; it guards a different binding of the same name, so `bind` does not. Ordered deliberately
    // with the guarded function FIRST so that exactly one axis moves.
    name: 'G-BIND axis: the guard tests a DIFFERENT binding of the same name',
    src: "function b(s) {\n  const at = s.lastIndexOf('Y');\n  if (at < 0) return '';\n  return at;\n}\nfunction a(s) {\n  const at = s.indexOf('X');\n  return s.slice(at);\n}\n",
    want: 1, guarded: { file: true, pos: true, bind: false, both: false },
  },
  {
    // The leg I am NOT touching. If a tightening reaches `guardedAtBinding` the re-key has
    // overreached, and this is the fixture that says so.
    name: 'G-INIT control: `guardedAtBinding` is correctly scoped and must survive every mode',
    src: "const at = s.indexOf('X') < 0 ? 0 : 1;\nconst w = s.slice(at);\n",
    want: 1, guarded: { file: true, pos: true, bind: true, both: true },
  },
  {
    name: 'G-NONE control: no guard anywhere — every mode agrees, and none invents one',
    src: "const at = s.indexOf('X');\nconst w = s.substring(at, at + 4);\n",
    want: 1, guarded: { file: false, pos: false, bind: false, both: false },
  },
];

const MODES = ['file', 'pos', 'bind', 'both'];

let kpOk = true;
console.log('── known positives for the re-scoped guard, one axis each ──');
for (const f of GUARD_FIXTURES) {
  const problems = [];
  for (const mode of MODES) {
    const got = namedBindingSites(f.src, mode);
    if (got.length !== f.want) { problems.push(`${mode}: found ${got.length}, want ${f.want}`); continue; }
    if (got.length === 1 && got[0].guarded !== f.guarded[mode]) {
      problems.push(`${mode}: guarded ${got[0].guarded}, want ${f.guarded[mode]}`);
    }
  }
  if (problems.length) kpOk = false;
  console.log(`  ${problems.length ? 'MISS' : 'ok  '} ${f.name}${problems.length ? ` → ${problems.join('; ')}` : ''}`);
}

// ── GRADE A: his published member list, under his key, at the rev his own recording names ────────

// Read out of his .out, not restated from his memo. Refuses with null rather than falling back to a
// sentinel that would make the comparison green forever (393).
const hisRecording = () => {
  if (!existsSync(HIS_OUT)) return null;
  const lines = readFileSync(HIS_OUT, 'utf8').split('\n');
  const revLine = lines.find((l) => /── live census at [0-9a-f]{40}: \d+ tracked JS\/TS sources ──/.test(l));
  if (revLine === undefined) return null;
  const rm = /live census at ([0-9a-f]{40}): (\d+) tracked/.exec(revLine);
  if (rm === null) return null;

  const members = { UNGUARDED: [], GUARDED: [] };
  const headers = {};
  let section = null;
  for (const l of lines) {
    const h = /^ {2}(UNGUARDED|GUARDED) \((\d+)\)/.exec(l);
    if (h) { section = h[1]; headers[section] = Number(h[2]); continue; }
    if (section === null) continue;
    const m = /^ {2}\[(.+?)\] (\S+):(\d+) {2}\(`([^`]+)` bound at :(\d+)\)$/.exec(l);
    if (m) members[section].push(`${m[2]}:${m[3]}:${m[4]}@${m[5]}:${m[1]}`);
  }
  // Internal consistency: his own header counts must equal the rows he printed under them. A
  // section that parsed to nothing is a parse failure, not a finding.
  if (members.UNGUARDED.length === 0 || members.GUARDED.length === 0) return null;
  if (headers.UNGUARDED !== members.UNGUARDED.length) return null;
  if (headers.GUARDED !== members.GUARDED.length) return null;
  return { rev: rm[1], files: Number(rm[2]), ...members };
};

const his = hisRecording();

// A detached worktree at HIS rev, so this grade cannot redden when this very file becomes tracked
// and starts contributing sites of its own (377).
const WT = join(REPO, '.testdata/round400-his399-rev');
const driveAtRev = (rev, mode) => {
  if (existsSync(WT)) {
    execFileSync('git', ['worktree', 'remove', '--force', WT], { cwd: REPO, encoding: 'utf8' });
  }
  execFileSync('git', ['worktree', 'add', '--detach', '--quiet', WT, rev], { cwd: REPO, encoding: 'utf8' });
  const at = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: WT, encoding: 'utf8' }).trim();
  const files = execFileSync('git', ['ls-files'], { cwd: WT, encoding: 'utf8' })
    .split('\n')
    .filter((p) => /\.(mjs|cjs|js|mts|cts|ts|tsx)$/.test(p));
  const sites = [];
  for (const p of files) {
    for (const hit of namedBindingSites(readFileSync(join(WT, p), 'utf8'), mode)) sites.push({ p, ...hit });
  }
  return { at, files: files.length, sites };
};

const sameMultiset = (a, b) => {
  const x = [...a].sort();
  const y = [...b].sort();
  return x.length === y.length && x.every((v, i) => v === y[i]);
};

const keyOf = (r) => `${r.p}:${r.line}:${r.name}@${r.bindingLine}:${r.stratum}`;

let gradeA = null;
let atRev = null;
if (his !== null) {
  atRev = driveAtRev(his.rev, 'file');
  const mine = {
    UNGUARDED: atRev.sites.filter((r) => !r.guarded).map(keyOf),
    GUARDED: atRev.sites.filter((r) => r.guarded).map(keyOf),
  };
  gradeA = atRev.at === his.rev
    && atRev.files === his.files
    && sameMultiset(mine.UNGUARDED, his.UNGUARDED)
    && sameMultiset(mine.GUARDED, his.GUARDED);
  console.log(`\n── GRADE A: his member list, his key, at the rev his .out names ──`);
  console.log(`  his recording: ${his.rev} — ${his.files} sources, ${his.GUARDED.length} GUARDED, ${his.UNGUARDED.length} UNGUARDED`);
  console.log(`  my drive:      ${atRev.at} — ${atRev.files} sources, ${mine.GUARDED.length} GUARDED, ${mine.UNGUARDED.length} UNGUARDED`);
  console.log(`  GRADE A (member lists identical, not counts): ${gradeA}`);
  if (gradeA !== true) {
    for (const k of mine.UNGUARDED.filter((k2) => !his.UNGUARDED.includes(k2))) console.log(`    mine-only UNGUARDED: ${k}`);
    for (const k of his.UNGUARDED.filter((k2) => !mine.UNGUARDED.includes(k2))) console.log(`    his-only  UNGUARDED: ${k}`);
    for (const k of mine.GUARDED.filter((k2) => !his.GUARDED.includes(k2))) console.log(`    mine-only GUARDED:   ${k}`);
    for (const k of his.GUARDED.filter((k2) => !mine.GUARDED.includes(k2))) console.log(`    his-only  GUARDED:   ${k}`);
  }
} else {
  console.log('\n  GRADE A: his recording could not be parsed — REFUSED, no figure published off it');
}

// ── GRADE B: monotonicity and site-count invariance across the four modes, at his rev ────────────
//
// Written down before this drove: every mode's GUARDED set is a SUBSET of `file`'s, `both` is the
// intersection of `pos` and `bind`, and the site TOTAL is invariant — the re-key touches which
// sites are called cured, never which sites exist. A filter on a disjunct is monotone (380); a leg
// that quantified would not be (385), and none of these quantify.

let gradeB = null;
const byMode = {};
if (atRev !== null) {
  for (const mode of MODES) byMode[mode] = mode === 'file' ? atRev.sites : driveAtRev(his.rev, mode).sites;
  const g = (mode) => new Set(byMode[mode].filter((r) => r.guarded).map((r, i) => `${keyOf(r)}#${i}`));
  const gu = (mode) => byMode[mode].filter((r) => r.guarded).map(keyOf);
  const totals = MODES.map((m) => byMode[m].length);
  const subset = (a, b) => gu(a).every((k) => gu(b).includes(k)) && gu(a).length <= gu(b).length;
  const inter = sameMultiset(
    gu('both'),
    gu('pos').filter((k) => gu('bind').includes(k)),
  );
  gradeB = totals.every((t) => t === totals[0])
    && subset('pos', 'file') && subset('bind', 'file') && subset('both', 'pos') && subset('both', 'bind')
    && inter;
  console.log('\n── GRADE B: subset + invariance across modes (at his rev) ──');
  for (const m of MODES) {
    console.log(`  ${m.padEnd(5)} sites ${byMode[m].length}  GUARDED ${gu(m).length}  UNGUARDED ${byMode[m].length - gu(m).length}`);
  }
  console.log(`  GRADE B (totals invariant, every mode ⊆ file, both = pos ∩ bind): ${gradeB}`);
  void g;
}

// ── the gate, BEFORE any headline ────────────────────────────────────────────────────────────────
// A printed self-test that gates nothing is how I read a false grade's figure as a reading (356).
// Gate on `!== true`, so `undefined` from a leg that never ran refuses too.

if (kpOk !== true || gradeA !== true || gradeB !== true) {
  console.log(`\nREFUSED — kpOk ${kpOk}, GRADE A ${gradeA}, GRADE B ${gradeB}. No figure published.`);
  if (existsSync(WT)) execFileSync('git', ['worktree', 'remove', '--force', WT], { cwd: REPO, encoding: 'utf8' });
  process.exit(1);
}

// ── the finding: the regrade, at his rev (pinned) and live at HEAD (informational) ────────────────

const unguardedOf = (sites) => sites.filter((r) => !r.guarded);
const pinned = byMode.both;
const movers = pinned.filter((r) => !r.guarded && !r.guardedAtBinding && r.guardsInFile > 0);

console.log(`\n── the regrade at ${his.rev} (his population, his strata, the guard leg re-scoped) ──`);
console.log(`  his  file-scoped:  ${unguardedOf(byMode.file).length} UNGUARDED of ${pinned.length}`);
console.log(`  + position only:   ${unguardedOf(byMode.pos).length} UNGUARDED`);
console.log(`  + binding only:    ${unguardedOf(byMode.bind).length} UNGUARDED`);
console.log(`  + both:            ${unguardedOf(byMode.both).length} UNGUARDED`);
// Measured, not added up. His §4 reports ONE remaining FAILS OPEN; the re-scoped count is this
// number, and deriving it as "his 1 plus my 1 mover" is the arithmetic I have got wrong in my own
// published sentence before (379).
const openUnder = (mode) => unguardedOf(byMode[mode]).filter((r) => r.stratum === 'FAILS OPEN');
console.log(`\n  UNGUARDED + FAILS OPEN: ${openUnder('file').length} under his file-scoped guard, ${openUnder('both').length} under BOTH:`);
for (const r of openUnder('both')) console.log(`    ${r.p}:${r.line}  (\`${r.name}\` bound at :${r.bindingLine})`);

console.log(`\n  sites his key called GUARDED that lose their guard under BOTH (${movers.length}):`);
for (const r of movers) {
  const whyPos = byMode.pos.find((x) => keyOf(x) === keyOf(r) && x.off === r.off);
  const whyBind = byMode.bind.find((x) => keyOf(x) === keyOf(r) && x.off === r.off);
  const why = [whyPos && !whyPos.guarded ? 'guard is BELOW the site' : null,
    whyBind && !whyBind.guarded ? 'guard tests a DIFFERENT binding' : null].filter(Boolean).join(' + ');
  console.log(`  [${r.stratum}] ${r.p}:${r.line}  (\`${r.name}\` bound at :${r.bindingLine}) — ${r.guardsInFile} guard(s) in file, ${r.guardsAccepted} accepted — ${why}`);
}

// Is the `bind` leg's zero MEASURED or VACUOUS? Two keys that agree because neither can see the
// thing agree for no reason (339). `bind` moved nothing live; that is only a finding if the leg
// actually rejected guards somewhere and the sites survived on a different accepted guard. If it
// rejected nothing at all, the honest word is "this corpus has no shadowed guards", not "zero".
const bindRejections = byMode.bind
  .filter((r) => r.guardsInFile > r.guardsAccepted)
  .map((r) => `${r.p}:${r.line} (\`${r.name}\`) ${r.guardsInFile} in file, ${r.guardsAccepted} accepted`);
const posRejections = byMode.pos.filter((r) => r.guardsInFile > r.guardsAccepted).length;

console.log(`\n  is the bind leg's zero measured or vacuous? guards REJECTED by bind at ${bindRejections.length} site(s):`);
for (const l of bindRejections) console.log(`    ${l}`);
if (bindRejections.length === 0) console.log('    none — the leg fires on its fixture and finds nothing here: no shadowed guard exists in this corpus');
console.log(`  (for contrast, the pos leg rejected at least one guard at ${posRejections} site(s))`);

const live = [];
const liveFiles = execFileSync('git', ['ls-files'], { cwd: REPO, encoding: 'utf8' })
  .split('\n')
  .filter((p) => /\.(mjs|cjs|js|mts|cts|ts|tsx)$/.test(p));
for (const p of liveFiles) {
  for (const hit of namedBindingSites(readFileSync(join(REPO, p), 'utf8'), 'both')) live.push({ p, ...hit });
}

console.log(`\n── live at ${HEAD}: ${liveFiles.length} tracked sources, ${live.length} sites, ${unguardedOf(live).length} UNGUARDED under BOTH ──`);
console.log('  (informational — nothing above gates on this number, which grows as instruments land)');

if (existsSync(WT)) execFileSync('git', ['worktree', 'remove', '--force', WT], { cwd: REPO, encoding: 'utf8' });
if (existsSync(WT)) rmSync(WT, { recursive: true, force: true });

// Derived once, then read as constants — a verdict sentence that recomputes its own figures mid-
// clause is how one character in another file made a published sentence contradict itself (380/397).
const TOTAL = pinned.length;
const HIS_GUARDED = byMode.file.filter((r) => r.guarded).length;
const HIS_UNGUARDED = unguardedOf(byMode.file).length;
const MY_UNGUARDED = unguardedOf(byMode.both).length;
const MOVED = movers.length;

console.log(
  `\nREGRADE OK at ${his.rev} — his guard leg is file-scoped; re-keying it to straight-line position `
  + `AND binding identity moves ${MOVED} of his ${HIS_GUARDED} GUARDED sites to UNGUARDED, taking the `
  + `not-cured count from ${HIS_UNGUARDED} to ${MY_UNGUARDED} of ${TOTAL}. His "14 is a floor" is `
  + `confirmed and quantified. Still a floor: both of my re-keys lean the same way his does.`,
);
