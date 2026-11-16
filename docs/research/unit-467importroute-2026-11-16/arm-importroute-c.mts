/**
 * unit-467importroute — arm C: lift arm B's declared limit 2 by computing the reach.
 *
 * Pre-registration: PRE-REGISTRATION-C.md (`271f5144`), pushed before this file existed.
 *
 * Arm B keyed on direct import of two `client.ts` export names and read 0. A zero over a narrow key
 * is the one result that cannot be published as an absence, so here the import graph of
 * `packages/server/src` is built from source and walked to the `messages.create` sink. `C0` is the
 * control that the walk is seeded and non-empty before any count below it means anything.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const SCRIPTS = join(ROOT, 'scripts');
const SERVER_SRC = join(ROOT, 'packages', 'server', 'src');

const legs: string[] = [];
const red: string[] = [];
const refused: string[] = [];
function leg(id: string, ok: boolean | null, detail: string) {
  legs.push(id);
  if (ok === null) refused.push(id);
  else if (!ok) red.push(id);
  console.log(`${ok === null ? 'REF' : ok ? 'ok ' : 'RED'} ${id.padEnd(9)} ${detail}`);
}
const preds: string[] = [];
const refuted: string[] = [];
const prefused: string[] = [];
function pred(id: string, held: boolean | null, detail: string) {
  preds.push(id);
  if (held === null) prefused.push(id);
  else if (!held) refuted.push(id);
  console.log(`${held === null ? 'OPEN   ' : held ? 'LANDED ' : 'REFUTED'} ${id.padEnd(4)} ${detail}`);
}

const subject = await import(join(SCRIPTS, 'promote-probes.mts'));
const { hazards, EXEMPTIBLE } = subject;
const readFile = (p: string) => readFileSync(p, 'utf8');
const inter = (a: string[], b: string[]) => a.filter((x) => b.includes(x));

// ── the server source tree ───────────────────────────────────────────────────────────────────────
const walk = (dir: string, acc: string[] = []): string[] => {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (/\.(ts|mts|js|mjs)$/.test(e) && !/\.test\.|__tests__/.test(p)) acc.push(p);
  }
  return acc;
};
const modules = walk(SERVER_SRC).sort();
const rel = (p: string) => relative(SERVER_SRC, p);
leg('C0a', modules.length > 0, `packages/server/src modules in the graph: ${modules.length}`);

// Resolve a specifier to a module in the tree. `.js` → `.ts` is the repo's NodeNext idiom.
const resolveSpec = (fromFile: string, spec: string): string | null => {
  if (!spec.startsWith('.')) return null;
  const base = resolve(dirname(fromFile), spec);
  const cands = [
    base,
    base.replace(/\.js$/, '.ts'),
    base.replace(/\.mjs$/, '.mts'),
    `${base}.ts`,
    `${base}.mts`,
    join(base, 'index.ts'),
  ];
  for (const c of cands) if (existsSync(c) && statSync(c).isFile()) return c;
  return null;
};
const SPEC = /(?:from\s*|import\s*\(\s*)['"]([^'"]+)['"]/g;
const edges = new Map<string, string[]>();
for (const m of modules) {
  const src = readFile(m);
  const outs: string[] = [];
  for (const mm of src.matchAll(SPEC)) {
    const r = resolveSpec(m, mm[1]);
    if (r) outs.push(r);
  }
  edges.set(m, [...new Set(outs)]);
}
leg('C0b', [...edges.values()].some((v) => v.length > 0), `resolved intra-tree edges: ${[...edges.values()].reduce((a, v) => a + v.length, 0)}`);

// ── the sink, and the reaching set ───────────────────────────────────────────────────────────────
// ── REPAIR, mandated by C0's own stated consequence ──────────────────────────────────────────────
// Drive 4 (`drive4.armc.out`, kept) ran with `SINK = /\bmessages\s*\.\s*create\b/` — declared limit
// 9 — and **C0 REFUTED**: `claude/client.ts` was not in the reaching set, because the product does
// not call the model that way. `packages/server/src/claude/client.ts:933` is
// `getAnthropicClient().beta.messages.stream({…})` and `:967` is `getAnthropicClient().messages.stream({…})`.
// The pre-registration said a refuted C0 makes every count below it uninterpretable, so this is the
// repair that consequence requires, not a widening chosen after seeing a number I disliked. Drive 4
// is kept as the record of the refutation and `C0d` prints the spelling in force so the two
// recordings cannot be mistaken for each other.
//
// This is also a finding about `DETECTORS.model` itself, one step past where I left it this morning:
// its third alternative is `messages\s*\.\s*create`, and **the product's live call site is
// `messages.stream`**. unit-467rawjson's `T3` measured `messages.create` at 0 of 155 live sites and
// published the count; the cause is that the token names a spelling this codebase does not use.
const SINK = /\bmessages\s*\.\s*(create|stream)\b/;
const SINK_LABEL = String(SINK);
const direct = modules.filter((m) => SINK.test(readFile(m)));
leg('C0d', true, `SINK in force for this recording: ${SINK_LABEL}`);
leg('C0c', direct.length > 0, `modules with a DIRECT sink site: ${direct.length} — ${direct.map(rel).join(', ')}`);

// Reverse reachability: everything that can get to a direct sink module.
const reverse = new Map<string, string[]>();
for (const [from, tos] of edges) for (const to of tos) reverse.set(to, [...(reverse.get(to) ?? []), from]);
const sinkReachers = new Set<string>(direct);
const queue = [...direct];
while (queue.length) {
  const cur = queue.shift()!;
  for (const pre of reverse.get(cur) ?? []) {
    if (!sinkReachers.has(pre)) {
      sinkReachers.add(pre);
      queue.push(pre);
    }
  }
}
const reachers = [...sinkReachers].sort();
pred(
  'C0',
  reachers.some((m) => rel(m) === join('claude', 'client.ts')),
  `KNOWN POSITIVE: claude/client.ts in the reaching set: ${reachers.some((m) => rel(m) === join('claude', 'client.ts'))}`,
);
pred('C1', reachers.length >= 2, `modules transitively reaching messages.create: ${reachers.length}`);
for (const m of reachers) console.log(`     · ${rel(m)}`);

// ── which probes import one ──────────────────────────────────────────────────────────────────────
const probes = readdirSync(SCRIPTS).filter((f) => /^probe-/.test(f)).sort();
leg('C1b', probes.length === 155, `probe population: ${probes.length}`);
const probeReachers: { f: string; mods: string[] }[] = [];
for (const f of probes) {
  const p = join(SCRIPTS, f);
  const src = readFile(p);
  const hit: string[] = [];
  for (const mm of src.matchAll(SPEC)) {
    const r = resolveSpec(p, mm[1]);
    if (r && sinkReachers.has(r)) hit.push(rel(r));
  }
  if (hit.length) probeReachers.push({ f, mods: [...new Set(hit)] });
}
pred('C2', probeReachers.length >= 1, `probes importing a transitively model-reaching module: ${probeReachers.length}`);
for (const { f, mods } of probeReachers) {
  console.log(`     · ${f} → ${mods.join(', ')}  hazards [${hazards(readFile(join(SCRIPTS, f))).join('+') || '(none)'}]`);
}

const cleanReachers = probeReachers.filter(
  ({ f }) => inter(hazards(readFile(join(SCRIPTS, f))), ['model', 'net']).length === 0,
);
pred(
  'C3',
  cleanReachers.length >= 1,
  `of those, carrying NEITHER model NOR net: ${cleanReachers.length}` +
    (cleanReachers.length ? ` — ${cleanReachers.map((c) => c.f).join(', ')}` : ''),
);
const declarable = cleanReachers.filter(({ f }) =>
  hazards(readFile(join(SCRIPTS, f))).every((k: string) => EXEMPTIBLE.has(k)),
);
leg(
  'C3b',
  true,
  `of the clean reachers, whose whole hazard set is author-exemptible: ${declarable.length}` +
    (declarable.length ? ` — ${declarable.map((c) => c.f).join(', ')}` : ''),
);

// ── the six the tool will drive today ────────────────────────────────────────────────────────────
const tsx = (args: string[]): { out: string; code: number } => {
  try {
    return {
      out: execFileSync('npx', ['tsx', join(SCRIPTS, 'promote-probes.mts'), ...args], {
        encoding: 'utf8',
        cwd: ROOT,
        maxBuffer: 64 * 1024 * 1024,
      }),
      code: 0,
    };
  } catch (e) {
    const err = e as { status?: number; stdout?: string };
    if (err.status === 2 && typeof err.stdout === 'string') return { out: err.stdout, code: 2 };
    throw e;
  }
};
const listOut = tsx(['--list', '--n', '20']).out;
const pool = [...(listOut.split('driving this run:')[1] ?? '').matchAll(/^\s+· (probe-\S+)$/gm)].map((m) => m[1]);
leg('C4a', pool.length > 0, `unattended candidate pool, read from --list by name: ${pool.length}`);
const poolReachers = pool.filter((f) => probeReachers.some((p) => p.f === f));
pred(
  'C4',
  poolReachers.length === 0,
  `pool members importing a transitively model-reaching module: ${poolReachers.length}` +
    (poolReachers.length ? ` — ${poolReachers.join(', ')} ← LIVE INSTANCE` : ' (LANDED = none, which is the safe reading)'),
);

const porcelain = execFileSync('git', ['-C', ROOT, 'status', '--porcelain', 'packages', 'scripts'], {
  encoding: 'utf8',
});
leg('C5', porcelain.trim() === '', `git status --porcelain packages scripts: ${JSON.stringify(porcelain)}`);

const { renderVerdict } = await import(join(ROOT, 'docs', 'research', 'lib', 'verdict.mjs'));
console.log(
  '\n' +
    renderVerdict({
      legs: legs.map((id) => ({ id, ok: red.includes(id) ? false : refused.includes(id) ? null : true })),
      preds: preds.map((id) => ({ id, landed: refuted.includes(id) ? false : prefused.includes(id) ? null : true })),
    }),
);
process.exit(red.length ? 1 : 0);
