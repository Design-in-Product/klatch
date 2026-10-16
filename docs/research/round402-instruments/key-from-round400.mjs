/**
 * Round 402 — the key, copied VERBATIM so the population is the same one.
 *
 * Everything between the two PROVENANCE markers below is byte-identical to lines 65-257 of
 * `docs/research/round400-instruments/regrade-the-file-scoped-guard.mjs` as committed at
 * `b65a7705`, which is itself Daedalus Round 399 key with only the guard leg parameterised.
 * It is copied rather than imported because that file is a SCRIPT: importing it drives a detached
 * worktree, four modes and a process.exit at module load.
 *
 * The copy is not taken on trust. `hand-read-the-unguarded.mjs` GRADE A re-reads the slice out of
 * git at that commit and compares bytes, so a drift here reddens instead of quietly re-keying the
 * population this round hand-reads. The pin is on an immutable commit, not on the live file, so it
 * cannot redden when round400 own file is edited (377/389).
 *
 * The one line that is MINE is the export at the bottom: round400 declares these primitives as
 * module-local `const`s and this round needs `initRefusal` reachable to answer whether a modelled
 * refusal value is negative at all. GRADE A pins the slice, not the export.
 */

// ── PROVENANCE: VERBATIM BEGIN ───────────────────────────────────────────────────────────────────
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

// ── PROVENANCE: VERBATIM END ─────────────────────────────────────────────────────────────────────

export { initRefusal, callEnd, splitArgs, refusalValue, windowLenOnRefusal, stratumOf, FINDER, WINDOW, BINDING, SAMPLE_LEN };
