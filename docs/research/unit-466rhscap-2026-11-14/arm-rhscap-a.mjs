/**
 * unit-466rhscap — arm A
 *
 * Subject: arm B of `unit-465p12site` joins a declaration's right-hand side over at most 4 physical
 * lines (`RHS_LINE_CAP = 4`) and gives up if no `;` is found. Its own `B2` leg printed 11 such
 * give-ups as a declared limit. This arm re-keys the join on **bracket balance** instead and
 * measures whether the cap cost the two unbound `RESOLVED` sites a chain member.
 *
 * ## Three revs, three jobs — see PRE-REGISTRATION.md
 *
 * - `SUBJECT_PIN` 5966f86d — every source byte measured. Same pin as arms A and B, so the baseline
 *   is matched rather than merely similar.
 * - `KEY_REV` 2694a13e — the only commit that has ever touched `arm-p12site-b.mjs` or
 *   `drive2.armb.out`. The baseline figures are **parsed out of that recording** by regex; nothing
 *   below hand-types 11, 7, 4 or 2.
 * - This fire's own pin is `e06c44d4`, the parent of this unit's first commit.
 *
 * ## The two keys
 *
 * `K-cap` is arm B's `declarations()` reproduced here. `A2`/`A3` are **gates**: if it does not
 * reproduce the recording's figures, the delta is uninterpretable and the later predictions prefuse
 * rather than silently reporting against an unmatched baseline.
 *
 * `K-bal` scans forward from the `=` over the strings-blanked reading, tracking `()[]{}` depth, and
 * stops at the first `;` at depth 0. No line cap, so `B2`'s failure mode cannot occur — at the price
 * named in the pre-registration: a function-bodied RHS now swallows its whole body, so the chain can
 * gain members by proximity rather than derivation. That price is measured (`A5`), and every newly
 * bound site is hand-sliced with its binding member's function-bodied flag printed (`A8`), because
 * "the re-key binds more" would not tell a recovered derivation from a spurious one.
 *
 * A declared safety bound on `K-bal`: the forward scan runs at most `BAL_LINE_BOUND` lines before
 * refusing that declaration. It is a refusal with a count, not a silent truncation, and the count is
 * printed whether or not it is zero.
 */

import { execFileSync } from 'node:child_process';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const SUBJECT_PIN = '5966f86db3a650b2858448eccb8796f5517e03e2';
const SUBJECT_PIN_SHORT = '5966f86d';
const KEY_REV = '2694a13e8188e1b189d95b5c2a6d36546ef84920';
const KEY_REV_SHORT = '2694a13e';
const KEY_RECORDING = 'docs/research/unit-465p12site-2026-11-14/drive2.armb.out';
const RHS_LINE_CAP = 4;
const CHAIN_DEPTH = 3;
const BAL_LINE_BOUND = 400;

const legs = [];
const red = [];
const refused = [];
const preds = [];
const refuted = [];
const prefused = [];

function leg(id, ok, detail) {
  legs.push(id);
  if (ok === null) { refused.push(id); console.log(`  REFUSED ${id}  ${detail}`); }
  else if (ok) console.log(`  ok      ${id}  ${detail}`);
  else { red.push(id); console.log(`  RED     ${id}  ${detail}`); }
}
function pred(id, held, detail) {
  preds.push(id);
  if (held === null) { prefused.push(id); console.log(`  PREFUSED ${id}  ${detail}`); }
  else if (held) console.log(`  LANDED  ${id}  ${detail}`);
  else { refuted.push(id); console.log(`  REFUTED ${id}  ${detail}`); }
}

const git = (...args) =>
  execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

console.log(`          --- subject pin ${SUBJECT_PIN_SHORT}; answer-key rev ${KEY_REV_SHORT}; K-cap lines ${RHS_LINE_CAP}, chain depth ${CHAIN_DEPTH}, K-bal bound ${BAL_LINE_BOUND}`);

// ───────────────────────────────── the answer key, CAPTURED from the recording rather than typed

const recording = git('show', `${KEY_REV}:${KEY_RECORDING}`);
const capB2 = recording.match(/^\s*ok\s+B2\s+.*?cap without finding a `;`:\s*(\d+)\s*$/m);
const capB3 = recording.match(
  /^\s*ok\s+B3\s+bare-skip sites:\s*(\d+)\s+total\D+RESOLVED\s+(\d+)\D+bound\s+to the chain\s+(\d+)\D+reaches an enumeration\s+(\d+)\s*$/m,
);
const capB5 = recording.match(/^\s*ok\s+B5\s+CORRECTED P12 over the pinned population:\s*(\d+)\s+of\s+(\d+)\s+members\s+(\[.*?\])\s+\((\d+) sites excluded/m);
const capR3 = recording.match(/^\s*LANDED\s+R3\s+.*?bound\s+(\d+),\s*unbound\s+(\d+)\s+(\[.*\])\s*$/m);

const keyRead =
  capB2 !== null && capB3 !== null && capB5 !== null && capR3 !== null;
leg('A0', keyRead,
  `answer key captured from ${KEY_REV_SHORT}:${KEY_RECORDING} — ` +
  `B2=${capB2?.[1]} B3=${capB3 ? capB3.slice(1, 5).join('/') : null} ` +
  `B5=${capB5 ? `${capB5[1]} of ${capB5[2]}, ${capB5[4]} excluded` : null} ` +
  `R3=${capR3 ? `bound ${capR3[1]} unbound ${capR3[2]}` : null}`);
if (!keyRead) {
  console.log(`VERDICT/0 RED legs=${legs.length} red=${JSON.stringify(red)} refused=${JSON.stringify(refused)} preds=0 refuted=[] prefused=[]  — answer key unreadable, no measurement attempted`);
  process.exit(1);
}

const KEY_CAPHITS = Number(capB2[1]);
const KEY_TOTAL = Number(capB3[1]);
const KEY_RESOLVED = Number(capB3[2]);
const KEY_BOUND = Number(capB3[3]);
const KEY_ENUMERATED = Number(capB3[4]);
const KEY_P12_N = Number(capB5[1]);
const KEY_P12_MEMBERS = JSON.parse(capB5[3]);
const KEY_UNBOUND_SITES = JSON.parse(capR3[3]);
console.log(`          --- the two sites this unit was boarded for, captured from R3: ${JSON.stringify(KEY_UNBOUND_SITES)}`);

// ─────────────────────────────── population: arm B's key verbatim, at the same subject pin

const sources = git('ls-tree', '-r', '--name-only', SUBJECT_PIN, 'docs/research/', 'scripts/', 'packages/')
  .split('\n')
  .filter((p) => p.endsWith('.mjs') && basename(dirname(p)) !== 'lib');
const srcOf = new Map();
for (const p of sources) srcOf.set(p, git('show', `${SUBJECT_PIN}:${p}`));

const LIB_IMPORT = /import\s*\{([^}]*)\}\s*from\s*['"][^'"]*verdict\.mjs['"]/s;
const READERS = ['readVerdict', 'readTail', 'readRows', 'readCorpusRows'];
const population = [];
for (const p of sources) {
  const src = srcOf.get(p);
  const m = src.match(LIB_IMPORT);
  const imported = m === null ? [] : m[1].split(',').map((s) => s.trim().split(/\s+as\s+/)[0]).filter((s) => s !== '');
  if (imported.filter((n) => READERS.includes(n)).length === 0) continue;
  if (READERS.reduce((n, r) => n + (src.match(new RegExp(`\\b${r}\\s*\\(`, 'g')) || []).length, 0) === 0) continue;
  if ([...src.matchAll(/['"`][^'"`\n]*\.out['"`]/g)].length === 0) continue;
  if (!/readdirSync\s*\(|ls-tree|ls-files|globSync\s*\(/.test(src)) continue;
  population.push(p);
}
population.sort();
leg('A1', population.length === 20, `population at the subject pin reproduces arm B's B1 of 20: ${population.length}`);

// ──────────────────────────────── arm B's site/loop keys, reproduced verbatim

const BARE_SKIP = /\.ok\s*(?:!==\s*true|===\s*false|\)|\s*===\s*true)[^\n]*\b(?:continue|return)\b[^\n]*$/;
const OK_TEST = /\.ok\s*(?:!==|===)\s*(?:true|false)|\(\s*!\s*\w+\.ok\b|&&\s*!\s*\w+\.ok\b/;
const FOR_OF = /\bfor\s*\(\s*(?:const|let|var)\s+(?:\{[^}]*\}|\[[^\]]*\]|\w+)\s+of\s+([^)]+)\)/;
const FN_BOUNDARY = /\bfunction\b|=>\s*\{/;
const ENUMERATOR = /readdirSync\s*\(|ls-tree|ls-files|globSync\s*\(/;
const DECL_HEAD = /^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(.*)$/;

function enclosingLoop(masked, lineIdx) {
  const lines = masked.split('\n');
  const own = lines[lineIdx].match(FOR_OF);
  if (own !== null) {
    const e = own[1].trim();
    return /^[A-Za-z_$][\w$]*$/.test(e) ? { kind: 'RESOLVED', ident: e, at: lineIdx + 1 } : { kind: 'DERIVED', expr: e, at: lineIdx + 1 };
  }
  let depth = 0;
  for (let i = lineIdx - 1; i >= 0; i -= 1) {
    const ln = lines[i];
    depth += (ln.match(/\}/g) || []).length - (ln.match(/\{/g) || []).length;
    if (depth < 0) {
      const m = ln.match(FOR_OF);
      if (m !== null) {
        const e = m[1].trim();
        return /^[A-Za-z_$][\w$]*$/.test(e) ? { kind: 'RESOLVED', ident: e, at: i + 1 } : { kind: 'DERIVED', expr: e, at: i + 1 };
      }
      if (FN_BOUNDARY.test(ln)) return { kind: 'UNRESOLVED', why: 'nearest enclosing block is a function', at: i + 1 };
      depth = 0;
    }
  }
  return { kind: 'UNRESOLVED', why: 'no enclosing block found', at: null };
}

/** K-cap: arm B's `declarations()`, reproduced. Joins forward over at most RHS_LINE_CAP lines. */
function declarationsCap(src) {
  const masked = stripSource(src, true);
  const lines = masked.split('\n');
  const out = new Map();
  const capHit = [];
  lines.forEach((ln, i) => {
    const m = ln.match(DECL_HEAD);
    if (m === null) return;
    let rhs = m[2];
    let j = i;
    while (!rhs.includes(';') && j - i < RHS_LINE_CAP - 1 && j + 1 < lines.length) { j += 1; rhs += ` ${lines[j]}`; }
    if (!rhs.includes(';')) capHit.push({ ident: m[1], at: i + 1 });
    const rawRhs = src.split('\n').slice(i, j + 1).join(' ');
    out.set(m[1], { rhs, rawRhs, at: i + 1, spanTo: j + 1 });
  });
  return { decls: out, capHit };
}

/**
 * K-bal: scan forward tracking `()[]{}` depth over the strings-blanked reading, stop at the first
 * `;` at depth 0. `BAL_LINE_BOUND` is a declared refusal bound, not a silent truncation.
 */
function declarationsBal(src) {
  const masked = stripSource(src, true);
  const lines = masked.split('\n');
  const rawLines = src.split('\n');
  const out = new Map();
  const boundHit = [];
  lines.forEach((ln, i) => {
    const m = ln.match(DECL_HEAD);
    if (m === null) return;
    let depth = 0;
    let j = i;
    let endedAt = null;
    const pieces = [];
    for (; j < lines.length && j - i < BAL_LINE_BOUND; j += 1) {
      const text = j === i ? m[2] : lines[j];
      pieces.push(text);
      for (const ch of text) {
        if (ch === '(' || ch === '[' || ch === '{') depth += 1;
        else if (ch === ')' || ch === ']' || ch === '}') depth -= 1;
        else if (ch === ';' && depth <= 0) { endedAt = j; break; }
      }
      if (endedAt !== null) break;
    }
    if (endedAt === null) { boundHit.push({ ident: m[1], at: i + 1 }); endedAt = Math.min(j, lines.length - 1); }
    const rhs = pieces.join(' ');
    const rawRhs = rawLines.slice(i, endedAt + 1).join(' ');
    // Function-bodied: the head of the RHS opens a function before any `{` of an object literal.
    const head = m[2];
    const fnBodied = /(^|[^\w$])(?:function\b|async\s+function\b)/.test(head) || /=>\s*\{?\s*$/.test(head) || /\)\s*=>\s*\{/.test(rhs.slice(0, 200));
    out.set(m[1], { rhs, rawRhs, at: i + 1, spanTo: endedAt + 1, lines: endedAt - i + 1, fnBodied });
  });
  return { decls: out, boundHit };
}

function chainOf(ident, decls) {
  const seen = new Set([ident]);
  let frontier = [ident];
  for (let d = 0; d < CHAIN_DEPTH; d += 1) {
    const next = [];
    for (const name of frontier) {
      const dec = decls.get(name);
      if (dec === undefined) continue;
      for (const tok of dec.rhs.match(/[A-Za-z_$][\w$]*/g) || []) {
        if (decls.has(tok) && !seen.has(tok)) { seen.add(tok); next.push(tok); }
      }
    }
    frontier = next;
    if (frontier.length === 0) break;
  }
  return [...seen];
}

function denomSites(src, names) {
  const vis = stripSource(src, false);
  const raw = src.split('\n');
  const hits = [];
  vis.split('\n').forEach((ln, i) => {
    for (const n of names) {
      const esc = n.replace(/[$]/g, '\\$&');
      const re = new RegExp(`\\bof\\s*(?:\\$\\{\\s*${esc}\\.length|['"\`]\\s*\\+\\s*${esc}\\.length|${esc}\\.length)`);
      if (re.test(ln)) { hits.push({ n: i + 1, ident: n, text: raw[i].trim() }); return; }
    }
  });
  return hits;
}

/** The whole arm-B pipeline, parameterised on the declaration key. */
function run(keyFn) {
  const rows = [];
  let capHits = 0;
  const capHitList = [];
  const declsByFile = new Map();
  for (const p of population) {
    const src = srcOf.get(p);
    const masked = stripSource(src, true);
    const lines = src.split('\n');
    const bare = [];
    lines.forEach((ln, i) => {
      if (!OK_TEST.test(ln)) return;
      if (ln.replace(/^\s*(\/\/|\*).*$/, '') === '') return;
      if (BARE_SKIP.test(ln) && !/\.refusal/.test(ln)) bare.push({ n: i + 1, text: ln.trim() });
    });
    if (bare.length === 0) continue;
    const r = keyFn(src);
    declsByFile.set(p, r.decls);
    const hitList = r.capHit ?? r.boundHit ?? [];
    capHits += hitList.length;
    for (const h of hitList) capHitList.push({ p, ...h });
    for (const s of bare) {
      const res = enclosingLoop(masked, s.n - 1);
      if (res.kind !== 'RESOLVED') {
        rows.push({ p, n: s.n, kind: res.kind, chain: [], hits: [], enumeratedIn: [], enumerated: false, p12: false });
        continue;
      }
      const chain = chainOf(res.ident, r.decls);
      const enumeratedIn = chain.filter((n) => r.decls.has(n) && ENUMERATOR.test(r.decls.get(n).rawRhs));
      const hits = denomSites(src, chain);
      rows.push({
        p, n: s.n, kind: 'RESOLVED', ident: res.ident, chain, enumeratedIn, hits,
        enumerated: enumeratedIn.length > 0, p12: hits.length > 0 && enumeratedIn.length > 0,
        siteText: s.text, loopAt: res.at,
      });
    }
  }
  const resolved = rows.filter((r) => r.kind === 'RESOLVED');
  return {
    rows, resolved, capHits, capHitList, declsByFile,
    bound: resolved.filter((r) => r.hits.length > 0),
    enumerated: resolved.filter((r) => r.enumerated),
    p12Members: [...new Set(rows.filter((r) => r.p12).map((r) => r.p))].sort(),
  };
}

const CAP = run(declarationsCap);
const BAL = run(declarationsBal);
const siteId = (r) => `${basename(r.p)}@${r.n}`;

// ───────────────────────────────────────────── A2/A3: gates — does the baseline reproduce?

leg('A2', CAP.capHits === KEY_CAPHITS,
  `K-cap reproduced here vs the recording's B2 cap-hit count: ${CAP.capHits} vs ${KEY_CAPHITS}`);
leg('A3',
  CAP.rows.length === KEY_TOTAL && CAP.resolved.length === KEY_RESOLVED &&
  CAP.bound.length === KEY_BOUND && CAP.enumerated.length === KEY_ENUMERATED,
  `K-cap vs the recording's B3 — total ${CAP.rows.length}/${KEY_TOTAL} · RESOLVED ` +
  `${CAP.resolved.length}/${KEY_RESOLVED} · bound ${CAP.bound.length}/${KEY_BOUND} · ` +
  `enumerated ${CAP.enumerated.length}/${KEY_ENUMERATED}`);

const baselineMatched = CAP.capHits === KEY_CAPHITS && CAP.rows.length === KEY_TOTAL &&
  CAP.resolved.length === KEY_RESOLVED && CAP.bound.length === KEY_BOUND &&
  CAP.enumerated.length === KEY_ENUMERATED;

pred('P1', CAP.capHits === KEY_CAPHITS, `K-cap reproduces the recording's cap-hit count exactly: ${CAP.capHits} vs ${KEY_CAPHITS}`);
pred('P2',
  CAP.rows.length === KEY_TOTAL && CAP.resolved.length === KEY_RESOLVED &&
  CAP.bound.length === KEY_BOUND && CAP.enumerated.length === KEY_ENUMERATED,
  `K-cap reproduces all four B3 figures exactly: ${[CAP.rows.length, CAP.resolved.length, CAP.bound.length, CAP.enumerated.length].join('/')} ` +
  `vs ${[KEY_TOTAL, KEY_RESOLVED, KEY_BOUND, KEY_ENUMERATED].join('/')}`);

// ───────────────────────────── A4: the cap-hit declarations, enumerated rather than counted

console.log('          --- A4: every K-cap cap-hit declaration, with what K-bal makes of the same site');
const capHitDetail = [];
for (const h of CAP.capHitList) {
  const balDecl = BAL.declsByFile.get(h.p)?.get(h.ident);
  capHitDetail.push({ ...h, balLines: balDecl?.lines ?? null, fnBodied: balDecl?.fnBodied ?? null });
  console.log(`          ${h.p.replace('docs/research/', '')}`);
  console.log(`              \`${h.ident}\` @${h.at}  K-cap truncated at ${RHS_LINE_CAP} lines; K-bal spans ${balDecl?.lines ?? '?'} lines, fn-bodied=${balDecl?.fnBodied ?? '?'}`);
}
const capHitFnBodied = capHitDetail.filter((d) => d.fnBodied === true);
leg('A4', CAP.capHitList.length === KEY_CAPHITS,
  `cap-hit declarations enumerated: ${CAP.capHitList.length} (recording's B2: ${KEY_CAPHITS}) · ` +
  `of those, function-bodied under K-bal: ${capHitFnBodied.length} ` +
  `${JSON.stringify(capHitDetail.map((d) => `${basename(d.p)}:${d.ident}@${d.at}→${d.balLines}L fn=${d.fnBodied}`))}`);
pred('P3', !baselineMatched ? null : capHitFnBodied.length > 0,
  `at least one cap-hit declaration is function-bodied, so the cap is not purely long call chains: ` +
  `${capHitFnBodied.length} of ${capHitDetail.length}`);

// ───────────── A5: the price of the re-key — span lengths, fn-bodied share, refusal bound

const balDeclAll = [...BAL.declsByFile.values()].flatMap((m) => [...m.values()]);
const balFn = balDeclAll.filter((d) => d.fnBodied);
const balSpans = balDeclAll.map((d) => d.lines).sort((a, b) => b - a);
const balBoundHits = BAL.capHitList.length;
leg('A5', balBoundHits === 0,
  `K-bal over the same files: ${balDeclAll.length} declarations · function-bodied ${balFn.length} ` +
  `(${((balFn.length / Math.max(1, balDeclAll.length)) * 100).toFixed(1)}%) · longest spans ` +
  `${JSON.stringify(balSpans.slice(0, 5))} · declarations refused at the ${BAL_LINE_BOUND}-line ` +
  `safety bound: ${balBoundHits}`);

// ───────── A6: the two named sites — chain under each key, and whether the cap is implicated

console.log('          --- A6: the two sites this unit was boarded for, under both keys');
const namedRows = [];
for (const label of KEY_UNBOUND_SITES) {
  const m = label.match(/^(.*?)@(\d+)\s+loop=(\S+)$/);
  const file = m[1];
  const line = Number(m[2]);
  const c = CAP.resolved.find((r) => basename(r.p) === file && r.n === line);
  const b = BAL.resolved.find((r) => basename(r.p) === file && r.n === line);
  if (c === undefined || b === undefined) {
    namedRows.push({ label, found: false });
    console.log(`          ${label}  NOT FOUND under one of the keys — cap=${c !== undefined} bal=${b !== undefined}`);
    continue;
  }
  const added = b.chain.filter((n) => !c.chain.includes(n));
  const capHitInCapChain = c.chain.filter((n) => CAP.capHitList.some((h) => h.p === c.p && h.ident === n));
  const addedFnBodied = added.filter((n) => BAL.declsByFile.get(b.p)?.get(n)?.fnBodied === true);
  namedRows.push({
    label, found: true, file, line, loop: m[3],
    capChain: c.chain, balChain: b.chain, added, capHitInCapChain,
    capBound: c.hits.length > 0, balBound: b.hits.length > 0,
    balHits: b.hits, addedFnBodied,
  });
  console.log(`          ${file}@${line}  loop over \`${m[3]}\``);
  console.log(`              K-cap chain (${c.chain.length}): ${JSON.stringify(c.chain)}  bound=${c.hits.length > 0}`);
  console.log(`              K-bal chain (${b.chain.length}): ${JSON.stringify(b.chain)}  bound=${b.hits.length > 0}`);
  console.log(`              chain members added by K-bal: ${JSON.stringify(added)} (function-bodied: ${JSON.stringify(addedFnBodied)})`);
  console.log(`              cap-hit declarations inside the K-cap chain: ${JSON.stringify(capHitInCapChain)}  → cap ${capHitInCapChain.length === 0 ? 'NOT implicated' : 'IMPLICATED'} for this site`);
}
const bothFound = namedRows.every((r) => r.found);
leg('A6', bothFound,
  `both R3 sites located under both keys: ${namedRows.filter((r) => r.found).length} of ${namedRows.length} · ` +
  `cap implicated for: ${JSON.stringify(namedRows.filter((r) => r.found && r.capHitInCapChain.length > 0).map((r) => `${r.file}@${r.line}`))} · ` +
  `newly bound under K-bal: ${JSON.stringify(namedRows.filter((r) => r.found && !r.capBound && r.balBound).map((r) => `${r.file}@${r.line}`))}`);
pred('P4', !baselineMatched || !bothFound ? null : namedRows.every((r) => r.capHitInCapChain.length === 0),
  `neither named site has a cap-hit declaration in its K-cap chain, so the cap is not the cause of ` +
  `their unboundness: ${JSON.stringify(namedRows.map((r) => `${r.file}@${r.line}: ${r.capHitInCapChain.length}`))}`);

// ─────────────────────────── A7: the global delta — bound count and P12 under each key

const sameP12 = JSON.stringify(CAP.p12Members) === JSON.stringify(BAL.p12Members);
leg('A7', CAP.p12Members.length === KEY_P12_N,
  `K-cap P12 ${CAP.p12Members.length} of ${population.length} (recording's B5: ${KEY_P12_N}; members ` +
  `${JSON.stringify(CAP.p12Members) === JSON.stringify(KEY_P12_MEMBERS) ? 'identical' : 'DIFFER'}) · ` +
  `K-bal P12 ${BAL.p12Members.length} of ${population.length} · bound sites ${CAP.bound.length} → ` +
  `${BAL.bound.length} · P12 membership ${sameP12 ? 'unchanged' : `changed: +${JSON.stringify(BAL.p12Members.filter((p) => !CAP.p12Members.includes(p)).map((p) => basename(p)))} -${JSON.stringify(CAP.p12Members.filter((p) => !BAL.p12Members.includes(p)).map((p) => basename(p)))}`}`);
pred('P5', !baselineMatched ? null : sameP12 && JSON.stringify(CAP.p12Members) === JSON.stringify(KEY_P12_MEMBERS),
  `K-bal leaves P12 membership at the recording's ${KEY_P12_N} members: K-bal has ` +
  `${BAL.p12Members.length} ${JSON.stringify(BAL.p12Members.map((p) => basename(p)))}`);

// ───────────────── A8: every newly bound site hand-sliced, with its binding member's flag

console.log('          --- A8: HAND VERIFICATION of every site that binds under K-bal but not K-cap');
const newlyBound = BAL.resolved.filter((b) => {
  const c = CAP.resolved.find((r) => r.p === b.p && r.n === b.n);
  return b.hits.length > 0 && c !== undefined && c.hits.length === 0;
});
const newlyBoundDetail = [];
for (const b of newlyBound) {
  const c = CAP.resolved.find((r) => r.p === b.p && r.n === b.n);
  const lines = srcOf.get(b.p).split('\n');
  const h = b.hits[0];
  const via = h.ident;
  const viaDecl = BAL.declsByFile.get(b.p)?.get(via);
  const viaAddedByBal = !c.chain.includes(via);
  // Which chain member carried `via` in? The nearest added member whose RHS mentions it.
  const carriers = b.chain
    .filter((n) => !c.chain.includes(n) || n === via)
    .map((n) => ({ n, fnBodied: BAL.declsByFile.get(b.p)?.get(n)?.fnBodied === true }));
  const sliceOk = lines[b.loopAt - 1].includes('of ') && lines[b.n - 1].trim() === b.siteText && lines[h.n - 1].trim() === h.text;
  newlyBoundDetail.push({ site: siteId(b), via, viaAddedByBal, viaFnBodied: viaDecl?.fnBodied === true, carriers, sliceOk });
  console.log(`          ${b.p.replace('docs/research/', '')}@${b.n}`);
  console.log(`              loop  @${b.loopAt}  ${lines[b.loopAt - 1].trim().slice(0, 110)}`);
  console.log(`              drop  @${b.n}  ${b.siteText.slice(0, 110)}`);
  console.log(`              denom @${h.n}  via \`${via}\`  ${h.text.slice(0, 110)}`);
  console.log(`              \`${via}\` added to the chain by K-bal: ${viaAddedByBal}; its RHS function-bodied: ${viaDecl?.fnBodied === true}`);
  console.log(`              slices re-read from the pinned source and match: ${sliceOk}`);
}
const allSlicesOk = newlyBoundDetail.every((d) => d.sliceOk);
leg('A8', newlyBound.length === 0 ? true : allSlicesOk,
  `sites binding under K-bal but not K-cap: ${newlyBound.length} ` +
  `${JSON.stringify(newlyBoundDetail.map((d) => `${d.site} via ${d.via} (added-by-bal=${d.viaAddedByBal}, fn-bodied=${d.viaFnBodied})`))} · ` +
  `all slices re-read and matching: ${newlyBound.length === 0 ? 'n/a, none' : allSlicesOk}`);
pred('P6', !baselineMatched ? null : (newlyBound.length === 0 ? null : newlyBoundDetail.every((d) => d.viaFnBodied || d.carriers.some((c) => c.fnBodied))),
  `every newly bound site binds through a function-bodied chain member (over-report, not recovered ` +
  `derivation): ${JSON.stringify(newlyBoundDetail.map((d) => `${d.site}: viaFn=${d.viaFnBodied} carriersFn=${d.carriers.filter((c) => c.fnBodied).length}`))}`);

// ──────────────────────────────────────────────────────────────────────────── gate + verdict

const gate = git('status', '--porcelain', 'packages', 'scripts', 'docs/research/lib').trim();
leg('A-gate', gate === '', `git status --porcelain packages scripts docs/research/lib → ${JSON.stringify(gate)}`);

console.log(
  `VERDICT/0 ${red.length === 0 ? 'GREEN' : 'RED'} legs=${legs.length} red=${JSON.stringify(red)} ` +
  `refused=${JSON.stringify(refused)} preds=${preds.length} refuted=${JSON.stringify(refuted)} ` +
  `prefused=${JSON.stringify(prefused)}`);
process.exit(red.length === 0 ? 0 : 1);
