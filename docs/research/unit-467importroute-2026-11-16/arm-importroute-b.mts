/**
 * unit-467importroute — arm B: the population Argus's census did not reach.
 *
 * Pre-registration: PRE-REGISTRATION.md (`cc3a74e1`) for B1–B4, PRE-REGISTRATION-B.md (`75f7d2df`)
 * for B5–B7. Both pushed before this file existed; arm A (`fd3672b5`) was landed first.
 *
 * `B1` runs FIRST and is a known positive. A zero on B3 is uninterpretable until the key has been
 * shown to fire on a case minted to be caught — the `Q4` defect from unit-467rawjson, one unit old.
 *
 * The fixture is minted in memory and never written under `scripts/`, so it cannot enter the census
 * it is measuring. Leg `B0b` asserts that by re-running the population predicate after minting.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const SCRIPTS = join(ROOT, 'scripts');

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
const read = (f: string) => readFileSync(join(SCRIPTS, f), 'utf8');
const population = () => readdirSync(SCRIPTS).filter((f) => /^probe-/.test(f)).sort();
const files = population();
leg('B0a', files.length === 155, `population: ${files.length} probe files`);

const inter = (a: string[], b: string[]) => a.filter((x) => b.includes(x));

// ── B1 — KNOWN POSITIVE, before anything rests on a zero ─────────────────────────────────────────
// A probe that reaches a live model call by importing the product's own export. Nothing in it names
// `Anthropic`, `ANTHROPIC_API_KEY` or `messages.create`; nothing in it is a `fetch(`/`listen(`/
// `request(`/`createServer(`. It would spend money against the API on the first line it runs.
const FIXTURE = `/**
 * A probe that calls the model in-process. No HTTP, no subprocess.
 */
import { streamClaude } from '../packages/server/src/claude/client.js';
const emitter = await streamClaude(channel, entity, history, 'm1');
`;
const fixHaz: string[] = hazards(FIXTURE);
pred(
  'B1',
  inter(fixHaz, ['model', 'net']).length === 0,
  `KNOWN POSITIVE: hazards(fixture) = [${fixHaz.join('+') || '(none)'}] — model/net intersection ` +
    `= [${inter(fixHaz, ['model', 'net']).join('+') || 'EMPTY'}]`,
);
leg('B0b', population().length === files.length, `fixture did not enter the census: still ${population().length} files`);
// Two-sided: the same key DOES fire on a file that names the SDK, so B1's empty intersection is a
// property of the import route and not of a dead `hazards()`.
const POSITIVE_CONTROL = `import Anthropic from '@anthropic-ai/sdk';\nawait client.messages.create({});\n`;
leg(
  'B1b',
  inter(hazards(POSITIVE_CONTROL), ['model']).length === 1,
  `two-sided: hazards(sdk-naming fixture) = [${hazards(POSITIVE_CONTROL).join('+')}] — the key is live`,
);

// ── B2/B3/B4 — the live corpus ───────────────────────────────────────────────────────────────────
const CLIENT_IMPORT = /from\s+['"][^'"]*claude\/client(\.js|\.ts|\.mjs)?['"]/;
const MODEL_EXPORT_CALL = /\b(streamClaude|streamClaudeRoundtable)\s*\(/;
const MODEL_EXPORT_NAME = /\b(streamClaude|streamClaudeRoundtable)\b/;
const importers: string[] = [];
const callers: string[] = [];
for (const f of files) {
  const src = read(f);
  if (!CLIENT_IMPORT.test(src) && !MODEL_EXPORT_NAME.test(src)) continue;
  importers.push(f);
  if (MODEL_EXPORT_CALL.test(src)) callers.push(f);
}
pred('B2', importers.length >= 1, `probes naming a client.ts model export or importing claude/client: ${importers.length}`);
// Declared limit 1 from the pre-registration, measured rather than asserted: an import is not a call.
leg('B2b', true, `of those, with a CALL-shaped site: ${callers.length}${callers.length ? ` — ${callers.join(', ')}` : ''}`);

const cleanImporters = importers.filter((f) => inter(hazards(read(f)), ['model', 'net']).length === 0);
pred(
  'B3',
  cleanImporters.length >= 1,
  `importers carrying NEITHER model NOR net: ${cleanImporters.length}` +
    (cleanImporters.length ? ` — ${cleanImporters.join(', ')}` : ' — Argus\'s reach claim survives on this population'),
);
const declarableAway = cleanImporters.filter((f) =>
  hazards(read(f)).every((k: string) => EXEMPTIBLE.has(k)),
);
pred(
  'B4',
  declarableAway.length >= 1,
  `of those, whose WHOLE hazard set is exemptible by author declaration: ${declarableAway.length}` +
    (declarableAway.length ? ` — ${declarableAway.join(', ')}` : ''),
);
for (const f of cleanImporters) console.log(`     · ${f} — hazards [${hazards(read(f)).join('+') || '(none)'}]`);

// ── B5 — the app module, which binds a port on import ────────────────────────────────────────────
const APP_IMPORT = /from\s+['"][^'"]*server\/src\/index(\.js|\.ts|\.mjs)?['"]|import\s*\(\s*['"][^'"]*server\/src\/index/;
const appImporters = files.filter((f) => APP_IMPORT.test(read(f)));
pred(
  'B5',
  appImporters.length === 0,
  `probes importing packages/server/src/index.ts (serve() at module top level, line 66): ` +
    `${appImporters.length}${appImporters.length ? ` — ${appImporters.join(', ')}` : ''}`,
);

// ── B6 — the six the tool will actually drive ────────────────────────────────────────────────────
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
// Read the pool from the tool, by NAME, not from Argus's memo and not from a count.
const listOut = tsx(['--list', '--n', '20']).out;
const poolSection = listOut.split('driving this run:')[1] ?? '';
const pool = [...poolSection.matchAll(/^\s+· (probe-\S+)$/gm)].map((m) => m[1]);
leg('B6a', pool.length > 0, `unattended candidate pool read from --list by name: ${pool.length} — ${pool.join(', ')}`);
const SERVER_IMPORT = /from\s+['"][^'"]*packages\/server\/src\/|import\s*\(\s*['"][^'"]*packages\/server\/src\//;
const poolImporters = pool.filter((f) => files.includes(f) && SERVER_IMPORT.test(read(f)));
pred(
  'B6',
  poolImporters.length >= 1,
  `pool members importing packages/server/src/*: ${poolImporters.length}` +
    (poolImporters.length ? ` — ${poolImporters.join(', ')}` : ''),
);
for (const f of poolImporters) {
  const spec = [...read(f).matchAll(/from\s+['"]([^'"]*packages\/server\/src\/[^'"]*)['"]/g)].map((m) => m[1]);
  console.log(`     · ${f} → ${[...new Set(spec)].join(', ')}  hazards [${hazards(read(f)).join('+') || '(none)'}]`);
}

// ── B7 — close arm A's refutations into a quotable figure ────────────────────────────────────────
// Arm A's 32, minus the two hand-read classifier-fixture files, is the corrected population.
const FIXTURE_ONLY = [
  'probe-round252-the-db-class-is-unblocked-by-a-variable-the-product-already-reads.mts',
  'probe-round254-the-mutate-class-is-an-unanchored-conjunction-and-most-of-it-never-writes-the-product.mts',
];
const { stripSource } = await import(join(SCRIPTS, 'lib', 'strip-source.mjs'));
const SPAWNCALL = /\b(spawn|spawnSync|execFile|execFileSync|exec|fork)\s*\(/;
const INDEX_TS = /src\/index\.ts/;
const armASpawners: string[] = [];
for (const f of files) {
  const stripped = stripSource(read(f), false);
  if (!INDEX_TS.test(stripped)) continue;
  const lines = stripped.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (SPAWNCALL.test(lines[i]) && lines.slice(i, i + 4).some((l: string) => INDEX_TS.test(l))) {
      armASpawners.push(f);
      break;
    }
  }
}
leg('B7a', armASpawners.length === 32, `arm A's key reproduces: ${armASpawners.length} (arm A read 32)`);
const trueSpawners = armASpawners.filter((f) => !FIXTURE_ONLY.includes(f));
const netRefusedTrue: string[] = [];
for (const f of trueSpawners) {
  const { out } = tsx(['--list', '--only', f]);
  if (new RegExp(`not driven \\(net\\):[\\s\\S]*?· ${f.replace(/\./g, '\\.')} —`).test(out)) netRefusedTrue.push(f);
}
pred(
  'B7',
  trueSpawners.length === 30 && netRefusedTrue.length === 30,
  `corrected spawn population ${trueSpawners.length}; net-refused by name ${netRefusedTrue.length}`,
);

const porcelain = execFileSync('git', ['-C', ROOT, 'status', '--porcelain', 'packages', 'scripts'], {
  encoding: 'utf8',
});
leg('B8', porcelain.trim() === '', `git status --porcelain packages scripts: ${JSON.stringify(porcelain)}`);

const { renderVerdict } = await import(join(ROOT, 'docs', 'research', 'lib', 'verdict.mjs'));
console.log(
  '\n' +
    renderVerdict({
      legs: legs.map((id) => ({ id, ok: red.includes(id) ? false : refused.includes(id) ? null : true })),
      preds: preds.map((id) => ({ id, landed: refuted.includes(id) ? false : prefused.includes(id) ? null : true })),
    }),
);
process.exit(red.length ? 1 : 0);
