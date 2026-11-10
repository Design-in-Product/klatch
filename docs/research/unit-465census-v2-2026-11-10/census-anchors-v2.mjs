#!/usr/bin/env node
/**
 * unit-465census-v2 — the anchor census, widened on the two blindnesses its own v1 declared.
 *
 * v1: `docs/research/unit-465anchor-census-2026-11-09/census-anchors.mjs` (Theseus), source and
 * capture a matched pair at rev `5ab2f758`. v1 is NOT edited (R3); this is a separate reader.
 *
 * Three widenings, each reported separately so a reader can see what each one bought:
 *   W1  parameter-bound anchors — v1 resolves an anchor id only as a top-level `const <id> = `, so
 *       `copyProbe`'s `sandboxDecl` (a function PARAMETER) printed UNREAD. v2 resolves it from the
 *       enclosing function's CALL SITES, recursively when an argument is itself a parameter.
 *   W2  non-`probe-` subjects — v1 keys the counted-against set on `const X = 'probe-*.mts'`, so
 *       `scripts/sweep-probes.mjs` sat outside the census. v2 admits any quoted filename in a
 *       copier that resolves to a real file in `scripts/`.
 *   W3  the column-0 blindness v1 did not declare — `startsWith('const <id> = ')` requires column
 *       0, so an INDENTED anchor const is invisible too. v2 matches the trimmed line and reports
 *       whether the population changed.
 *
 * R2 holds: no anchor value is typed here. Every value is extracted from a copier's own source, and
 * a cell that cannot be extracted prints UNREAD with its reason rather than being dropped or
 * filled in. That now binds W1's chain too: a call-site argument that does not resolve to a
 * top-level string-literal const is UNREAD, not hand-read into the totals.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const SCRIPTS = join(REPO, 'scripts');

// Refuse loudly rather than report empty cells from the wrong depth (v1's guard, kept).
if (!existsSync(join(SCRIPTS, 'sweep-probes.mjs'))) {
  console.log(`REFUSED — scripts/ not found at ${SCRIPTS} (resolved from ${HERE})`);
  process.exit(2);
}
console.log(`scripts/ resolved to: ${SCRIPTS}`);

const occ = (hay, needle) => (needle === '' ? -1 : hay.split(needle).length - 1);

// ---- 1. the copier population, by source scan for the uniqueness-assertion THROW ----------------
const files = readdirSync(SCRIPTS).filter((f) => f.endsWith('.mts') || f.endsWith('.mjs'));
const src = new Map(files.map((f) => [f, readFileSync(join(SCRIPTS, f), 'utf8')]));

const THROW = /throw new Error\(`anchor not unique/;
const copiers = files.filter((f) => src.get(f).split('\n').some((l) => THROW.test(l)));
console.log(`\n== 1. copiers (a line that THROWS on a non-unique anchor; prose mentions excluded) ==`);
console.log(`files scanned: ${files.length}`);
for (const c of copiers) {
  const lines = src.get(c).split('\n');
  console.log(`  ${c}  (throw at :${lines.findIndex((l) => THROW.test(l)) + 1})`);
}
const mentions = files.filter((f) => !copiers.includes(f) && src.get(f).includes('anchor not unique'));
for (const m of mentions) console.log(`  excluded (mentions, no throw): ${m}`);

// ---- helpers: top-level argument split, and the call sites of a named function -------------------
/** Walk from the '(' after `name` to its match, returning the top-level comma-separated arg texts. */
const argsAt = (text, openIdx) => {
  let depth = 0;
  let cur = '';
  const out = [];
  let quote = null;
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
  return null; // unbalanced — caller treats as unreadable
};

const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;

/** Every call `name(...)` in `text`, excluding the one at `declOpenIdx` (the declaration). */
const callSites = (text, name, declOpenIdx) => {
  const out = [];
  const re = new RegExp(`\\b${name}\\s*\\(`, 'g');
  let m;
  while ((m = re.exec(text)) !== null) {
    const open = m.index + m[0].length - 1;
    if (open === declOpenIdx) continue;
    const parsed = argsAt(text, open);
    if (parsed) out.push({ line: lineOf(text, open), args: parsed.args });
  }
  return out;
};

/** The enclosing function whose parameter list contains `id`, searched upward from `fromLine`. */
const FNDECL = /^\s*(?:export\s+)?(?:const\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?\(|function\s+([A-Za-z0-9_$]+)\s*\()/;
const enclosingFnFor = (text, id, fromLine) => {
  const lines = text.split('\n');
  for (let i = fromLine - 1; i >= 0; i--) {
    const m = FNDECL.exec(lines[i]);
    if (!m) continue;
    const name = m[1] ?? m[2];
    const openIdx = text.split('\n').slice(0, i).join('\n').length + (i > 0 ? 1 : 0) + lines[i].indexOf('(', lines[i].indexOf(name));
    const parsed = argsAt(text, openIdx);
    if (!parsed) continue;
    const params = parsed.args.map((p) => p.split(':')[0].trim().replace(/^\.\.\./, ''));
    const pos = params.indexOf(id);
    if (pos !== -1) return { name, pos, params, declLine: i + 1, declOpenIdx: openIdx };
  }
  return null;
};

// The RHS classifier, shared by the top-level route and W1's call-site route.
const classifyRhs = (rhs) => {
  const lit = /^(['"])((?:\\.|(?!\1)[^\\])*)\1;?\s*(\/\/.*)?$/.exec(rhs);
  if (!lit) return { kind: 'derived', value: null };
  try {
    const value = JSON.parse(lit[1] === '"' ? `${lit[1]}${lit[2]}${lit[1]}` : JSON.stringify(lit[2]).replace(/\\\\/g, '\\'));
    return value === null
      ? { kind: 'UNREAD', reason: 'quoted literal would not parse' }
      : { kind: 'hand-typed', value };
  } catch {
    return { kind: 'UNREAD', reason: 'quoted literal would not parse' };
  }
};

/** Resolve `id` as a top-level const in `lines`. W3: trimmed match, with v1's column-0 match beside it. */
const topLevelConst = (lines, id) => {
  const v1Idx = lines.findIndex((l) => l.startsWith(`const ${id} = `));
  const v2Idx = lines.findIndex((l) => l.trim().startsWith(`const ${id} = `));
  if (v2Idx === -1) return { found: false, v1Idx, v2Idx };
  const rhs = lines[v2Idx].trim().slice(`const ${id} = `.length);
  return { found: true, v1Idx, v2Idx, line: v2Idx + 1, rhs, ...classifyRhs(rhs) };
};

// ---- 2. anchors per copier: the 2nd argument of each once() call, resolved in that file ----------
const CALL = /\bonce\(\s*([A-Za-z0-9_.$]+)\s*,\s*([A-Za-z0-9_.$]+)\s*,/g;
const anchors = []; // {copier, id, line, rhs, kind, value, via}
const w3Divergences = [];

for (const c of copiers) {
  const text = src.get(c);
  const lines = text.split('\n');
  console.log(`\n== 2. once() call sites in ${c} ==`);
  const ids = new Map(); // id -> first line seen
  lines.forEach((l, i) => {
    CALL.lastIndex = 0;
    let m;
    while ((m = CALL.exec(l)) !== null) {
      console.log(`  :${i + 1}  ${l.trim().slice(0, 110)}`);
      if (!ids.has(m[2])) ids.set(m[2], i + 1);
    }
  });

  for (const [id, siteLine] of ids) {
    const top = topLevelConst(lines, id);
    if (top.found) {
      if (top.v1Idx !== top.v2Idx) w3Divergences.push({ copier: c, id, v1Idx: top.v1Idx, v2Idx: top.v2Idx });
      anchors.push({ copier: c, id, line: top.line, rhs: top.rhs, kind: top.kind, value: top.value, reason: top.reason, via: 'top-level const' });
      continue;
    }

    // ---- W1: no top-level const. Is `id` a parameter of an enclosing function? ----
    const fn = enclosingFnFor(text, id, siteLine);
    if (!fn) {
      anchors.push({ copier: c, id, line: null, rhs: null, kind: 'UNREAD', reason: 'no top-level `const <id> = ` declaration and no enclosing function with it as a parameter', via: 'W1 (failed)' });
      continue;
    }
    console.log(`  W1: ${id} is parameter ${fn.pos} of ${fn.name}() declared :${fn.declLine} — resolving from its call sites`);
    // Walk call sites, recursing while an argument is itself a parameter. Cycle-guarded, depth<=4.
    const seen = new Set();
    const resolved = new Map(); // argId -> {chain, ...classification}
    const walk = (fnInfo, chain, depth) => {
      if (depth > 4) return;
      const key = `${fnInfo.name}#${fnInfo.pos}`;
      if (seen.has(key)) return;
      seen.add(key);
      for (const site of callSites(text, fnInfo.name, fnInfo.declOpenIdx)) {
        const arg = site.args[fnInfo.pos];
        if (arg === undefined) continue;
        const argChain = [...chain, `${fnInfo.name}(…) :${site.line} arg${fnInfo.pos}=${arg}`];
        if (!/^[A-Za-z0-9_$]+$/.test(arg)) {
          resolved.set(`${arg}@${site.line}`, { kind: 'UNREAD', reason: `call-site argument is not a bare identifier: ${arg.slice(0, 48)}`, chain: argChain });
          continue;
        }
        const argTop = topLevelConst(lines, arg);
        if (argTop.found) {
          if (argTop.v1Idx !== argTop.v2Idx) w3Divergences.push({ copier: c, id: arg, v1Idx: argTop.v1Idx, v2Idx: argTop.v2Idx });
          resolved.set(arg, { ...argTop, chain: argChain });
          continue;
        }
        const argFn = enclosingFnFor(text, arg, site.line);
        if (argFn) { walk(argFn, argChain, depth + 1); continue; }
        resolved.set(arg, { kind: 'UNREAD', reason: `call-site argument \`${arg}\` resolves to neither a top-level const nor a parameter`, chain: argChain });
      }
    };
    walk(fn, [`once(…, ${id}, …) :${siteLine}`], 1);

    if (resolved.size === 0) {
      anchors.push({ copier: c, id, line: null, rhs: null, kind: 'UNREAD', reason: `parameter ${fn.pos} of ${fn.name}(), but no call site yielded an argument`, via: 'W1 (failed)' });
      continue;
    }
    for (const [argId, r] of resolved) {
      anchors.push({
        copier: c, id: `${id}←${argId}`, line: r.line ?? null, rhs: r.rhs ?? null,
        kind: r.kind, value: r.value, reason: r.reason,
        via: `W1: ${r.chain.join(' → ')}`,
      });
    }
  }
}

console.log(`\n== 3. anchors, with the declaration RHS printed verbatim so the classification is checkable ==`);
for (const a of anchors) {
  console.log(`  ${a.copier.slice(0, 18)}… ${a.id} @${a.line ?? '-'} [${a.kind}] ${a.kind === 'UNREAD' ? a.reason : a.rhs.slice(0, 96)}`);
  if (a.via.startsWith('W1')) console.log(`        via ${a.via}`);
}
const handTyped = anchors.filter((a) => a.kind === 'hand-typed');
const derived = anchors.filter((a) => a.kind === 'derived');
const unread = anchors.filter((a) => a.kind === 'UNREAD');
console.log(`  totals: ${anchors.length} anchors — ${handTyped.length} hand-typed, ${derived.length} derived, ${unread.length} UNREAD`);
console.log(`  of which reached by W1 (parameter-bound): ${anchors.filter((a) => a.via.startsWith('W1:')).length}`);

console.log(`\n== 3b. W3 — does relaxing v1's column-0 \`startsWith\` to a trimmed match change anything? ==`);
if (w3Divergences.length === 0) {
  console.log(`  no divergence: every anchor const resolved to the same line under both matches (v1's column-0 key lost nothing HERE).`);
} else {
  for (const d of w3Divergences) console.log(`  DIVERGENCE ${d.copier.slice(0, 18)}… ${d.id}: v1 idx ${d.v1Idx}, v2 idx ${d.v2Idx}  <-- v1 blindness #3`);
}

// ---- 4. candidate subject files -----------------------------------------------------------------
const subjects = new Map(); // filename -> how it entered the set
const V1SUBJ = /^const ([A-Za-z0-9_]+) = '(probe-[^']+\.mts)';/;
for (const c of copiers) {
  for (const l of src.get(c).split('\n')) {
    const m = V1SUBJ.exec(l);
    if (m && src.has(m[2])) subjects.set(m[2], `v1 key: ${c.slice(0, 18)}… declares it as ${m[1]}`);
  }
}
for (const c of copiers) if (!subjects.has(c)) subjects.set(c, 'v1 key: is itself a copier');
const v1Subjects = new Set(subjects.keys());

// W2: any single-quoted filename in a copier that resolves to a real file in scripts/.
const FNAME = /'([A-Za-z0-9_.@-]+\.(?:mts|mjs|ts|js))'/g;
for (const c of copiers) {
  const text = src.get(c);
  FNAME.lastIndex = 0;
  let m;
  while ((m = FNAME.exec(text)) !== null) {
    if (subjects.has(m[1])) continue;
    if (!existsSync(join(SCRIPTS, m[1]))) continue;
    subjects.set(m[1], `W2: quoted in ${c.slice(0, 18)}… :${lineOf(text, m.index)} and exists in scripts/`);
    if (!src.has(m[1])) src.set(m[1], readFileSync(join(SCRIPTS, m[1]), 'utf8'));
  }
}
console.log(`\n== 4. candidate files counted against (superset of the APPLIED pairs) ==`);
for (const [f, why] of subjects) console.log(`  ${f}  — ${why}`);
const w2New = [...subjects.keys()].filter((f) => !v1Subjects.has(f));
console.log(`  W2 admitted ${w2New.length} file(s) v1's key excluded: ${w2New.join(', ') || '(none)'}`);

// ---- 5. the census ------------------------------------------------------------------------------
console.log(`\n== 5. CENSUS — occ(file, anchor) for each hand-typed anchor ==`);
let collisions = 0, ones = 0, zeros = 0;
const collisionCells = [];
for (const a of handTyped) {
  console.log(`\n  anchor ${a.id} (${a.copier.slice(0, 18)}…:${a.line})`);
  for (const [f] of subjects) {
    const n = occ(src.get(f), a.value);
    const flag = n > 1 ? '  <-- COLLISION (>1)' : '';
    if (n > 1) { collisions++; collisionCells.push(`${a.id} × ${f} = ${n}`); } else if (n === 1) ones++; else zeros++;
    console.log(`    ${String(n).padStart(2)}  ${f}${flag}`);
  }
}
for (const a of derived) console.log(`\n  anchor ${a.id} (${a.copier.slice(0, 18)}…:${a.line}) — DERIVED, not counted: its value is computed from the subject at run time`);
for (const a of unread) console.log(`\n  anchor ${a.id} (${a.copier.slice(0, 18)}…) — UNREAD: ${a.reason}`);

console.log(`\n== 5b. COLLISION cells, as a member list rather than a count (for the v1 superset check) ==`);
for (const cell of collisionCells) console.log(`  ${cell}`);

console.log(`\n== 5c. the W2 column on its own — what a non-\`probe-\` subject actually costs ==`);
for (const f of w2New) {
  for (const a of handTyped) console.log(`  ${String(occ(src.get(f), a.value)).padStart(2)}  ${a.id} × ${f}`);
}
if (w2New.length === 0) console.log(`  (W2 admitted nothing, so there is no column to report)`);

console.log(`\n== 6. HEADLINE ==`);
console.log(`copiers: ${copiers.length} · anchors: ${anchors.length} (${handTyped.length} hand-typed, ${derived.length} derived, ${unread.length} UNREAD) · files: ${subjects.size}`);
console.log(`cells counted: ${collisions + ones + zeros} — ${collisions} at >1 (COLLISION), ${ones} at exactly 1, ${zeros} at 0`);
console.log(`W1 reached ${anchors.filter((a) => a.via.startsWith('W1:')).length} anchor(s) v1 printed UNREAD · W2 added ${w2New.length} subject file(s) · W3 divergences: ${w3Divergences.length}`);
