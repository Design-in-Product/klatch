/**
 * unit-466rhscap — arm B
 *
 * Subject: arm A's `A7` printed `members DIFFER` against the recording while the same line reported
 * `P12 membership unchanged` between its own two keys, and `P5` came back REFUTED. Arm A compared
 * the recording's **display** strings (`B5` prints members through `p.replace('docs/research/','')`)
 * against its own **join key**, the full repo-relative path. This arm normalises the two to one key
 * form, re-decides `P5`, and asserts the diagnosis rather than asserting it by eye.
 *
 * It also widens arm A's `A6` from the 2 named sites to **every** site, because "the cap is not
 * implicated for these two" is a weaker claim than the data may support.
 *
 * Arm A is not edited and not re-driven. `drive1.arma.out` stands verbatim with its `members DIFFER`
 * and its `REFUTED P5` in it.
 *
 * Revs as in arm A: subject pin `5966f86d`, answer-key rev `2694a13e`.
 */

import { execFileSync } from 'node:child_process';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const SUBJECT_PIN = '5966f86db3a650b2858448eccb8796f5517e03e2';
const KEY_REV = '2694a13e8188e1b189d95b5c2a6d36546ef84920';
const KEY_RECORDING = 'docs/research/unit-465p12site-2026-11-14/drive2.armb.out';
/** The display transform `B5` applies to its members, named here as the thing it is. */
const DISPLAY_PREFIX = 'docs/research/';
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

// ──────────────────────────────────────────── the answer key, captured again, same regexes

const recording = git('show', `${KEY_REV}:${KEY_RECORDING}`);
const capB5 = recording.match(/^\s*ok\s+B5\s+CORRECTED P12 over the pinned population:\s*(\d+)\s+of\s+(\d+)\s+members\s+(\[.*?\])\s+\((\d+) sites excluded/m);
const capR3 = recording.match(/^\s*LANDED\s+R3\s+.*?bound\s+(\d+),\s*unbound\s+(\d+)\s+(\[.*\])\s*$/m);
leg('B0', capB5 !== null && capR3 !== null,
  `recording re-captured at ${KEY_REV.slice(0, 8)} — B5 ${capB5?.[1]} of ${capB5?.[2]}, R3 unbound ${capR3?.[2]}`);
if (capB5 === null || capR3 === null) {
  console.log(`VERDICT/0 RED legs=${legs.length} red=${JSON.stringify(red)} refused=${JSON.stringify(refused)} preds=0 refuted=[] prefused=[]  — answer key unreadable`);
  process.exit(1);
}
const KEY_P12_DISPLAY = JSON.parse(capB5[3]);
const KEY_UNBOUND_SITES = JSON.parse(capR3[3]);

// ──────────────────────────────────── population and pipeline, arm A's code paths unchanged

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
    out.set(m[1], { rhs, rawRhs: src.split('\n').slice(i, j + 1).join(' '), at: i + 1 });
  });
  return { decls: out, capHit };
}

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
    out.set(m[1], { rhs: pieces.join(' '), rawRhs: rawLines.slice(i, endedAt + 1).join(' '), at: i + 1 });
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

function run(keyFn) {
  const rows = [];
  const capHitList = [];
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
    for (const h of (r.capHit ?? r.boundHit ?? [])) capHitList.push({ p, ...h });
    for (const s of bare) {
      const res = enclosingLoop(masked, s.n - 1);
      if (res.kind !== 'RESOLVED') { rows.push({ p, n: s.n, kind: res.kind, chain: [], hits: [], enumeratedIn: [], p12: false }); continue; }
      const chain = chainOf(res.ident, r.decls);
      const enumeratedIn = chain.filter((n) => r.decls.has(n) && ENUMERATOR.test(r.decls.get(n).rawRhs));
      const hits = denomSites(src, chain);
      rows.push({ p, n: s.n, kind: 'RESOLVED', ident: res.ident, chain, enumeratedIn, hits, p12: hits.length > 0 && enumeratedIn.length > 0 });
    }
  }
  const resolved = rows.filter((r) => r.kind === 'RESOLVED');
  return {
    rows, resolved, capHitList,
    bound: resolved.filter((r) => r.hits.length > 0),
    p12Members: [...new Set(rows.filter((r) => r.p12).map((r) => r.p))].sort(),
  };
}

const CAP = run(declarationsCap);
const BAL = run(declarationsBal);

// ───────────── B1: ONE key form for both sides, and `P5` re-decided on the normalised lists

/** Lift the recording's display strings up to the join key by restoring the stripped prefix. */
const liftToKey = (display) => (display.startsWith(DISPLAY_PREFIX) ? display : `${DISPLAY_PREFIX}${display}`);
const KEY_P12 = KEY_P12_DISPLAY.map(liftToKey).sort();
const capEqKey = JSON.stringify(CAP.p12Members) === JSON.stringify(KEY_P12);
const balEqKey = JSON.stringify(BAL.p12Members) === JSON.stringify(KEY_P12);

console.log('          --- B1: the recording\'s display strings lifted to the join key, both sides compared in one form');
console.log(`              recording B5 as printed : ${JSON.stringify(KEY_P12_DISPLAY)}`);
console.log(`              lifted to the join key  : ${JSON.stringify(KEY_P12)}`);
console.log(`              K-cap p12Members        : ${JSON.stringify(CAP.p12Members)}`);
console.log(`              K-bal p12Members        : ${JSON.stringify(BAL.p12Members)}`);
leg('B1', capEqKey && balEqKey,
  `normalised comparison: K-cap ${capEqKey ? 'identical to' : 'DIFFERS from'} the recording, ` +
  `K-bal ${balEqKey ? 'identical to' : 'DIFFERS from'} it`);
pred('Q1', capEqKey,
  `arm A's REFUTED P5 was an artefact of its own comparison — normalised, K-cap's P12 membership ` +
  `is ${capEqKey ? 'identical' : 'NOT identical'} to the recording's`);

// B2: the prefix is the SOLE cause — the basename-keyed comparison must also agree, and the raw
// (unlifted) comparison must be the only one that fails.
const rawEq = JSON.stringify(CAP.p12Members) === JSON.stringify(KEY_P12_DISPLAY.slice().sort());
// `.map(basename)` would hand `basename` the array index as its `suffix` argument and throw; the
// first drive of this arm did exactly that and is kept as `drive2-crash1.armb.{out,err}`.
const baseEq = JSON.stringify(CAP.p12Members.map((p) => basename(p)).sort()) === JSON.stringify(KEY_P12_DISPLAY.map((p) => basename(p)).sort());
const soleCause = rawEq === false && baseEq === true && capEqKey === true;
leg('B2', soleCause,
  `the display prefix is the sole cause: raw comparison ${rawEq ? 'agrees' : 'fails'} · basename ` +
  `comparison ${baseEq ? 'agrees' : 'fails'} · lifted comparison ${capEqKey ? 'agrees' : 'fails'} ` +
  `→ ${soleCause ? 'exactly the prefix, nothing else' : 'NOT only the prefix'}`);
pred('Q2', soleCause, `no member differs for any reason other than \`${DISPLAY_PREFIX}\`: ${soleCause}`);

// ──────────────────── B3: the chain delta across ALL sites, not just the 2 named ones

console.log('          --- B3: per-site chain delta under the two keys, every site in the measurement');
const deltas = [];
for (const b of BAL.rows) {
  const c = CAP.rows.find((r) => r.p === b.p && r.n === b.n);
  if (c === undefined) { deltas.push({ site: `${basename(b.p)}@${b.n}`, missing: true }); continue;}
  const same = JSON.stringify(c.chain) === JSON.stringify(b.chain);
  const named = KEY_UNBOUND_SITES.some((s) => s.startsWith(`${basename(b.p)}@${b.n} `));
  deltas.push({
    site: `${basename(b.p)}@${b.n}`, kind: b.kind, same, named,
    added: b.chain.filter((n) => !c.chain.includes(n)),
    dropped: c.chain.filter((n) => !b.chain.includes(n)),
    capBound: c.hits.length > 0, balBound: b.hits.length > 0,
  });
  console.log(`              ${basename(b.p)}@${b.n}  ${b.kind.padEnd(10)} chain ${same ? 'IDENTICAL' : `CHANGED +${JSON.stringify(b.chain.filter((n) => !c.chain.includes(n)))} -${JSON.stringify(c.chain.filter((n) => !b.chain.includes(n)))}`}  bound ${c.hits.length > 0}→${b.hits.length > 0}${named ? '   ← one of R3\'s two' : ''}`);
}
const changed = deltas.filter((d) => d.missing !== true && d.same === false);
const resolvedDeltas = deltas.filter((d) => d.kind === 'RESOLVED');
leg('B3', deltas.every((d) => d.missing !== true),
  `sites compared under both keys: ${deltas.length} (RESOLVED ${resolvedDeltas.length}) · chains that ` +
  `changed: ${changed.length} ${JSON.stringify(changed.map((d) => d.site))} · bound verdicts that ` +
  `moved: ${deltas.filter((d) => d.missing !== true && d.capBound !== d.balBound).length}`);
pred('Q3', resolvedDeltas.every((d) => d.same),
  `no RESOLVED site's chain differs between the keys — the 11 cap hits are inert across the whole ` +
  `measurement, not just for R3's two: ${resolvedDeltas.filter((d) => !d.same).length} of ${resolvedDeltas.length} changed`);

// ───────────── B4: how far the 11 cap-hit declarations actually reach into this measurement

const allChainMembers = new Map();
for (const r of CAP.resolved) {
  for (const n of r.chain) {
    const k = `${r.p}::${n}`;
    allChainMembers.set(k, (allChainMembers.get(k) ?? 0) + 1);
  }
}
const reach = CAP.capHitList.map((h) => ({
  site: `${basename(h.p)}:${h.ident}@${h.at}`,
  inChains: allChainMembers.get(`${h.p}::${h.ident}`) ?? 0,
}));
const unreached = reach.filter((r) => r.inChains === 0);
leg('B4', true,
  `cap-hit declarations: ${reach.length} · appearing in NO chain of any site: ${unreached.length} · ` +
  `appearing in at least one: ${reach.length - unreached.length} ` +
  `${JSON.stringify(reach.filter((r) => r.inChains > 0))}`);
pred('Q4', unreached.length > 0,
  `the cap-hit count overstates the cap's reach into this measurement — ${unreached.length} of ` +
  `${reach.length} cap-hit declarations are in no chain at all`);

// ───────────────────────────────────────── B5: the corrected P12, and the promotion call

const promote = !(capEqKey && balEqKey && resolvedDeltas.every((d) => d.same) &&
  CAP.bound.length === BAL.bound.length);
leg('B5', capEqKey && balEqKey,
  `CORRECTED P12, both keys, normalised: ${CAP.p12Members.length} of ${population.length} under K-cap ` +
  `and ${BAL.p12Members.length} of ${population.length} under K-bal, membership identical to the ` +
  `recording's — bound sites ${CAP.bound.length} vs ${BAL.bound.length}. K-bal promotion: ` +
  `${promote ? 'ARGUABLE — it moved something' : 'DECLINED — it moves nothing on this question'}`);
pred('Q5', CAP.p12Members.length === 2 && BAL.p12Members.length === 2 && capEqKey && balEqKey,
  `the corrected P12 is 2 of 20 under either key, so the re-key buys nothing here: K-cap ` +
  `${CAP.p12Members.length}, K-bal ${BAL.p12Members.length}`);

const gate = git('status', '--porcelain', 'packages', 'scripts', 'docs/research/lib').trim();
leg('B-gate', gate === '', `git status --porcelain packages scripts docs/research/lib → ${JSON.stringify(gate)}`);

console.log(
  `VERDICT/0 ${red.length === 0 ? 'GREEN' : 'RED'} legs=${legs.length} red=${JSON.stringify(red)} ` +
  `refused=${JSON.stringify(refused)} preds=${preds.length} refuted=${JSON.stringify(refuted)} ` +
  `prefused=${JSON.stringify(prefused)}`);
process.exit(red.length === 0 ? 0 : 1);
