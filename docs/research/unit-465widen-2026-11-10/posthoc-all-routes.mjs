#!/usr/bin/env node
/**
 * unit-465widen — POST-HOC. Written after reading `widen-run-1.txt`, which came back P6 FALSE.
 *
 * `widen-key.mjs` and `widen-run-1.txt` are NOT edited; they stay a matched source/capture pair.
 *
 * The diagnosis P6 earned: my walker returns the FIRST route it finds, while v2's W1 capture prints
 * the route IT found walking the other way. For `SB374` the file holds at least two real routes —
 * a `drive()` wrapper and a direct `copyProbe()` call — so comparing one against one can diverge
 * while neither is wrong. That is also my own R8 broken inside the instrument that declared it:
 * two keys sharing a denominator must be compared as MEMBER LISTS, in both directions.
 *
 * This leg enumerates ALL routes and does that comparison. It is POST-HOC and labelled so: the
 * prediction it repairs stays FALSE in `widen-run-1.txt`, which is the record.
 */
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
if (!existsSync(join(REPO, 'scripts', 'sweep-probes.mjs'))) { console.log('REFUSED — repo root not found'); process.exit(2); }
const V2 = join(REPO, 'docs/research/unit-465census-v2-2026-11-10/census-anchors-v2.mjs');
const PLANT = join(REPO, 'docs/research/unit-465plant-2026-11-10/posthoc-v2-repaired-population.mjs');
const V2CAP = join(REPO, 'docs/research/unit-465census-v2-2026-11-10/census-v2-run-1.txt');

function slice(file, startMarker, endMarker, label) {
  const src = readFileSync(file, 'utf8');
  for (const [m, which] of [[startMarker, 'start'], [endMarker, 'end']]) {
    const n = src.split(m).length - 1;
    if (n !== 1) { console.log(`REFUSED — ${label}: ${which} marker occurs ${n} times, not once`); process.exit(2); }
  }
  const text = src.slice(src.indexOf(startMarker), src.indexOf(endMarker));
  console.log(`sliced ${label}: ${text.split('\n').length} lines, both markers unique`);
  return text;
}
const helpersV2 = slice(V2, '// ---- helpers: top-level argument split, and the call sites of a named function',
  '// The RHS classifier, shared by the top-level route and W1\'s call-site route.', 'v2 helpers');
const keyPlant = slice(PLANT, 'const occ = (hay, needle)', "console.log('unit-465plant — POST-HOC v2", 'plant key span');
const SCRATCH = join(HERE, 'scratch');
mkdirSync(SCRATCH, { recursive: true });
const composedPath = join(SCRATCH, 'composed-slices-posthoc.mjs');
writeFileSync(composedPath, `import { execFileSync } from 'node:child_process';
const REPO = ${JSON.stringify(REPO)};
${helpersV2}
${keyPlant}
export { occ, git, blob, parseLiteral, literalDecls, keysFor, argsAt, lineOf, callSites, enclosingFnFor, FNDECL };
`);
const S = await import(composedPath);

function bodyOf(src, fname) {
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = S.FNDECL.exec(lines[i]);
    if (!m || (m[1] ?? m[2]) !== fname) continue;
    const openIdx = lines.slice(0, i).join('\n').length + (i > 0 ? 1 : 0) + lines[i].indexOf('(', lines[i].indexOf(fname));
    const parsed = S.argsAt(src, openIdx);
    if (!parsed) continue;
    const params = parsed.args.map((p) => p.split(':')[0].trim().replace(/^\.\.\./, ''));
    let end = lines.length;
    for (let j = i + 1; j < lines.length; j++) if (/^\};?\s*$/.test(lines[j])) { end = j + 1; break; }
    return { declLine: i + 1, params, body: lines.slice(i, end).join('\n'), bodyOffset: i };
  }
  return null;
}

/** EVERY route from `name` to a `once(` call. Each route: { onceLine, hops: [{fn, callLine, pos, param}] }. */
function allRoutes(src, name, declLine, depth = 0, seen = new Set(), scope = null) {
  const text = scope ? scope.body : src;
  const lines = text.split('\n');
  const base = scope ? scope.bodyOffset : 0;
  const re = new RegExp(`\\b${name}\\b`);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const absolute = base + i + 1;
    if (absolute === declLine) continue;
    if (re.test(lines[i]) && /\bonce\s*\(/.test(lines[i])) out.push({ onceLine: absolute, hops: [] });
  }
  if (depth >= 4) return out;
  const callRe = /\b([A-Za-z_$][\w$]*)\s*\(/g;
  let m;
  while ((m = callRe.exec(text)) !== null) {
    const fname = m[1];
    if (['once', 'if', 'for', 'while', 'return', 'switch', 'catch'].includes(fname)) continue;
    const open = m.index + m[0].length - 1;
    const parsed = S.argsAt(text, open);
    if (!parsed) continue;
    const pos = parsed.args.findIndex((a) => a.trim() === name);
    if (pos === -1) continue;
    const callLine = base + S.lineOf(text, open);
    const fn = bodyOf(src, fname);
    if (!fn) continue;
    const param = fn.params[pos];
    if (param === undefined) continue;
    const cycleKey = `${fname}#${param}#${depth}`;
    if (seen.has(cycleKey)) continue;
    const inner = allRoutes(src, param, fn.declLine, depth + 1, new Set([...seen, cycleKey]), fn);
    for (const r of inner) out.push({ onceLine: r.onceLine, hops: [{ fn: fname, callLine, pos, param }, ...r.hops] });
  }
  return out;
}

console.log('\nunit-465widen — POST-HOC: all routes, and the member-list comparison R8 asked for');
const r377rel = execFileSync('git', ['-C', REPO, 'ls-files', 'scripts/probe-round377*.mts'], { encoding: 'utf8' }).trim().split('\n')[0];
const r377 = readFileSync(join(REPO, r377rel), 'utf8');
const decls = S.literalDecls(r377);

// v2's recording, parsed out of the capture rather than typed
const want = new Map();
for (const line of readFileSync(V2CAP, 'utf8').split('\n')) {
  const m = /via W1: once\(…, (\w+), …\) :(\d+) → (\w+)\(…\) :(\d+) arg(\d+)=(\w+)/.exec(line);
  if (m) want.set(m[6], { key: `once:${m[2]} ${m[3]}:${m[4]} arg${m[5]} param=${m[1]}` });
}
if (want.size === 0) { console.log('REFUSED — no W1 chain parsed from v2 capture'); process.exit(2); }

let allOk = true;
for (const name of ['SB374', 'SB375']) {
  const d = decls.get(name);
  const routes = allRoutes(r377, name, d.line);
  const mine = new Set(routes.map((r) => `once:${r.onceLine} ${r.hops.map((h) => `${h.fn}:${h.callLine} arg${h.pos} param=${h.param}`).join(' <- ')}`));
  // Normalise to the LAST hop, which is the one v2 prints (the call that binds once()'s argument),
  // plus the FIRST hop's call site, which is where the declaration itself is passed.
  const mineV2Shape = new Set(routes.map((r) => {
    const first = r.hops[0];
    const last = r.hops[r.hops.length - 1];
    return `once:${r.onceLine} ${first.fn}:${first.callLine} arg${first.pos} param=${last ? last.param : first.param}`;
  }));
  const w = want.get(name).key;
  const inV2Only = mineV2Shape.has(w) ? [] : [w];
  console.log(`\n${name} :${d.line} — ${routes.length} route(s) to once(), occ(value)=${S.occ(r377, d.value)}`);
  for (const r of [...mine].sort()) console.log(`   route: ${r}`);
  console.log(`   v2's printed chain: ${w}`);
  console.log(`   in v2 only (should be empty — v2 recorded one real route, mine must contain it): [${inV2Only.join(', ')}]`);
  console.log(`   in mine only: ${mineV2Shape.size - (inV2Only.length ? 0 : 1)} further route(s)`);
  if (inV2Only.length) allOk = false;
}

console.log(`\nPOST-HOC VERDICT: ${allOk ? 'v2\'s recording is a SUBSET of the all-routes enumeration' : 'v2 recorded a route the enumeration does NOT contain — a real walker defect, not an ordering artefact'}`);
console.log('P6 stays FALSE in widen-run-1.txt. This leg says WHY, it does not re-grade it.');
process.exit(allOk ? 0 : 1);
