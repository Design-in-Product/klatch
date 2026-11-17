/**
 * unit-467importprice — arm B: the hop keyed on the FILE, the probe side keyed on the IMPORT.
 *
 * Pre-registration: PRE-REGISTRATION-B.md, pushed to origin/main as `9cb52037` BEFORE this file
 * existed. Arm A (`69650467`) and its results (`0619c967`) came first; this arm takes arm A's own
 * declared blind spot (RESULTS §2) rather than boarding it.
 *
 * `Q1` (known positive) and `Q2` (two-sided negative) run FIRST, on one RegExp object. Arm A's
 * drive 1 is the reason the negative limb is not optional: an alternation built from an empty
 * derived array is SATURATED, and the KP alone cannot see that.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const SCRIPTS = join(ROOT, 'scripts');
const SERVER_SRC = join(ROOT, 'packages', 'server', 'src');
const CLIENT_TS = join(SERVER_SRC, 'claude', 'client.ts');

const legs: string[] = [];
const red: string[] = [];
const refused: string[] = [];
function leg(id: string, ok: boolean | null, detail: string) {
  legs.push(id);
  if (ok === null) refused.push(id);
  else if (!ok) red.push(id);
  console.log(`${ok === null ? 'REF' : ok ? 'ok ' : 'RED'} ${id.padEnd(4)} ${detail}`);
}
const preds: string[] = [];
const refuted: string[] = [];
const prefused: string[] = [];
function pred(id: string, held: boolean | null, detail: string) {
  preds.push(id);
  if (held === null) prefused.push(id);
  else if (!held) refuted.push(id);
  console.log(`${held === null ? 'REFUSED' : held ? 'LANDED ' : 'REFUTED'} ${id.padEnd(3)} ${detail}`);
}

const subject = await import(join(SCRIPTS, 'promote-probes.mts'));
const { hazards, EXEMPTIBLE } = subject;
const { SWEPT, DEFERRED } = await import(join(SCRIPTS, 'sweep-probes.mjs'));
leg(
  'B3',
  typeof hazards === 'function' && EXEMPTIBLE instanceof Set && Array.isArray(DEFERRED) && Array.isArray(SWEPT),
  `subject imported: EXEMPTIBLE=[${[...EXEMPTIBLE].join('+')}] DEFERRED=${DEFERRED.length} SWEPT=${SWEPT.length}`,
);

const readProbe = (f: string) => readFileSync(join(SCRIPTS, f), 'utf8');
const population = () => readdirSync(SCRIPTS).filter((f) => /^probe-/.test(f)).sort();
const files = population();
leg('B0a', files.length === 155, `population: ${files.length} probe files`);

const blankStrings = (src: string): string =>
  src.replace(/`(?:[^`\\]|\\.)*`/g, '``').replace(/'(?:[^'\\\n]|\\.)*'/g, "''").replace(/"(?:[^"\\\n]|\\.)*"/g, '""');

// ── B1 — M, derived: server modules whose source CALLS an S1 member, plus client.ts ──────────────
const S1 = ['streamClaude', 'streamClaudeRoundtable']; // arm A derived these from client.ts; `Q3`
// re-checks the reach set this names, and arm A's `A1`/`A2` are the provenance for the pair itself.
const S1_CALL = new RegExp(`\\b(${S1.join('|')})\\s*\\(`);
const walk = (dir: string): string[] => {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) {
      if (e === '__tests__' || e === 'node_modules') continue;
      out.push(...walk(p));
    } else if (/\.ts$/.test(e) && !/\.test\.ts$/.test(e)) out.push(p);
  }
  return out;
};
const serverFiles = walk(SERVER_SRC);
const callers = serverFiles.filter((p) => p !== CLIENT_TS && S1_CALL.test(blankStrings(readFileSync(p, 'utf8'))));
const M = [CLIENT_TS, ...callers].map((p) => relative(ROOT, p)).sort();
leg(
  'B1',
  M.length > 0,
  `M derived (modules that call an S1 member, + client.ts): ${M.length} [${M.join(', ')}] over ` +
    `${serverFiles.length} non-test .ts files`,
);
// Per-site detail, so a reader grades the derivation rather than trusting the count.
for (const p of callers) {
  const src = readFileSync(p, 'utf8').split('\n');
  const sites = src.map((l, i) => [i + 1, l] as const).filter(([, l]) => S1_CALL.test(l)).map(([i]) => i);
  leg('B1b', true, `${relative(ROOT, p)} — S1 call sites at ${sites.join(',')}`);
}

// ── B2 — the import-specifier key, assembled and non-degenerate ──────────────────────────────────
const buildImportKey = (mods: string[]): RegExp => {
  if (!mods.length) throw new Error('buildImportKey: empty module array would assemble a saturated key');
  // Match the module path as written in a probe's import/require specifier: the product path with
  // any extension, e.g. `../packages/server/src/routes/messages.js`.
  const alts = mods.map((m) => m.replace(/^packages\//, '').replace(/\.ts$/, '').replace(/[/.]/g, (c) => `\\${c}`));
  return new RegExp(`from\\s*['"\`][^'"\`]*(?:${alts.join('|')})(?:\\.[jt]s)?['"\`]|require\\s*\\(\\s*['"\`][^'"\`]*(?:${alts.join('|')})(?:\\.[jt]s)?['"\`]|import\\s*\\(\\s*['"\`][^'"\`]*(?:${alts.join('|')})(?:\\.[jt]s)?['"\`]`);
};
let EMPTY_THROWS = false;
try {
  buildImportKey([]);
} catch {
  EMPTY_THROWS = true;
}
const KEY_IMP = buildImportKey(M);
leg('B2', EMPTY_THROWS && KEY_IMP.source.includes('routes'), `key assembled from M, builder throws on empty=${EMPTY_THROWS}`);
console.log(`     KEY_IMP = ${KEY_IMP.source}`);

const FIX_POS = `import { mountApiRoutes } from '../packages/server/src/routes/messages.js';\n`;
const FIX_NEG = `import { getDb } from '../packages/server/src/db/queries.js';\n`;
pred('Q1', KEY_IMP.test(FIX_POS) === true, `KNOWN POSITIVE: key fires on a routes/messages import = ${KEY_IMP.test(FIX_POS)}`);
pred('Q2', KEY_IMP.test(FIX_NEG) === false, `two-sided negative: key fires on a db/queries import = ${KEY_IMP.test(FIX_NEG)}`);
leg('B0b', population().length === files.length, `fixtures stayed in memory: still ${population().length} files`);
pred('Q3', M.length === 3, `|M| = ${M.length} [${M.join(', ')}]`);

// ── the price ────────────────────────────────────────────────────────────────────────────────────
const sweptSet = new Set((SWEPT as { file: string }[]).map((s) => s.file));
const hits: { file: string; line: number; text: string; literalOnly: boolean; haz: string[]; nonExempt: string[]; drivable: boolean; mover: boolean }[] = [];
for (const f of files) {
  const src = readProbe(f);
  if (!KEY_IMP.test(src)) continue;
  const lines = src.split('\n');
  const i = lines.findIndex((l) => KEY_IMP.test(l));
  const haz = hazards(src) as string[];
  const nonExempt = haz.filter((h) => !(EXEMPTIBLE as Set<string>).has(h));
  const lit = !KEY_IMP.test(blankStrings(src));
  const drivable = !sweptSet.has(f) && (DEFERRED as string[]).includes(f);
  // **Drive 3 defect, repaired here, and it is this arm's finding against itself.** The mover test
  // was `drivable && nonExempt.length === 0 && !lit` — carried over from arm A, where the key
  // matches a CALL. An **import specifier IS a string literal**, so `literalOnly` is VACUOUSLY TRUE
  // for every hit this key can ever produce, and `!lit` made `movers` structurally empty: drive 3's
  // zero price was right by accident and could not have come out any other way. `KEY_IMP` already
  // requires an import/require/dynamic-import POSITION by construction, which is the distinction
  // literal-blanking cannot make (`promote-probes.mts:201-211`, Round 296, same lesson for a
  // different key shape). Corrected predicate: drivable AND no non-exemptible hazard.
  hits.push({ file: f, line: i + 1, text: (lines[i] ?? '').trim().slice(0, 100), literalOnly: lit, haz, nonExempt, drivable, mover: drivable && nonExempt.length === 0 });
}
// The vacuity, measured rather than asserted: every hit of an import-specifier key is literal-only.
leg(
  'B4b',
  hits.length === 0 ? null : hits.every((h) => h.literalOnly),
  hits.length === 0
    ? 'REFUSED: no hits, so the literal-only vacuity claim has no population'
    : `all ${hits.length} hit(s) are literalOnly — an import specifier IS a string literal, so a ` +
      `!literalOnly conjunct makes the price structurally zero for this key shape`,
);
console.log(`\n── import-route hits over the 155 (${hits.length}) ──`);
for (const h of hits) {
  console.log(
    `   ${h.file}:${h.line} literalOnly=${h.literalOnly} drivable=${h.drivable} hazards=[${h.haz.join('+') || '(none)'}] ` +
      `nonExempt=[${h.nonExempt.join('+') || '(none)'}] MOVER=${h.mover}\n      ${h.text}`,
  );
}
if (!hits.length) console.log('   (none)');
leg('B4', true, `every hit printed with file, line, literal-only status and bucket: ${hits.length}`);

const movers = hits.filter((h) => h.mover);
pred('Q4', hits.length > 0, `probes importing a member of M: ${hits.length}`);
pred(
  'Q5',
  hits.length === 0 ? null : movers.length < hits.length,
  hits.length === 0
    ? 'REFUSED by registration: unsatisfiable over an empty hit set'
    : `movers ${movers.length} < hits ${hits.length}: ${movers.length < hits.length} — the rest are already refused by a non-exemptible hazard or are literal-only`,
);
pred('Q6', movers.length > 0, `PRICE: ${movers.length} mover(s) [${movers.map((h) => h.file).join(', ') || 'EMPTY'}]`);

const porcelain = execFileSync('git', ['-C', ROOT, 'status', '--porcelain', 'packages', 'scripts'], { encoding: 'utf8' });
leg('B9', porcelain.trim() === '', `git status --porcelain packages scripts: ${JSON.stringify(porcelain)}`);

const { renderVerdict } = await import(join(ROOT, 'docs', 'research', 'lib', 'verdict.mjs'));
console.log(
  '\n' +
    renderVerdict({
      legs: legs.map((id) => ({ id, ok: red.includes(id) ? false : refused.includes(id) ? null : true })),
      preds: preds.map((id) => ({ id, landed: refuted.includes(id) ? false : prefused.includes(id) ? null : true })),
    }),
);
process.exit(red.length ? 1 : 0);
