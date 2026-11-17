/**
 * unit-467importprice — arm A: the measured price of an import-route detector.
 *
 * Pre-registration: PRE-REGISTRATION.md, pushed to origin/main as `81ea947e` BEFORE this file
 * existed. Predictions P1–P6 and legs A0a–A9 are registered there and are not restated here except
 * where the code needs the predicate.
 *
 * `P1` (known positive) and `P2` (two-sided negative) run FIRST, on the same RegExp object, before
 * any count over the live corpus is reported. A price of zero is uninterpretable until the key is
 * shown to fire on a case minted to be caught and to stay silent on an import with no call.
 *
 * Everything the subject owns is read through `await import` of the subject: `hazards`,
 * `EXEMPTIBLE`, `admission` from `promote-probes.mts`; `SWEPT`/`DEFERRED` from `sweep-probes.mjs`
 * (whose `main()` is guarded by an `argv[1]` check, verified before importing it).
 *
 * This arm edits nothing under `packages/` or `scripts/`. `A9` asserts that.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
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
  console.log(`${ok === null ? 'REF' : ok ? 'ok ' : 'RED'} ${id.padEnd(5)} ${detail}`);
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

// ── subject, imported not copied ─────────────────────────────────────────────────────────────────
const subject = await import(join(SCRIPTS, 'promote-probes.mts'));
const { hazards, EXEMPTIBLE, admission } = subject;
const sweep = await import(join(SCRIPTS, 'sweep-probes.mjs'));
const { SWEPT, DEFERRED } = sweep;
leg(
  'A3',
  typeof hazards === 'function' && EXEMPTIBLE instanceof Set && typeof admission === 'function' &&
    Array.isArray(DEFERRED) && Array.isArray(SWEPT),
  `subject imported: hazards=${typeof hazards} EXEMPTIBLE=[${[...EXEMPTIBLE].join('+')}] ` +
    `admission=${typeof admission} DEFERRED=${DEFERRED.length} SWEPT=${SWEPT.length}`,
);

const readProbe = (f: string) => readFileSync(join(SCRIPTS, f), 'utf8');
const population = () => readdirSync(SCRIPTS).filter((f) => /^probe-/.test(f)).sort();
const files = population();
leg('A0a', files.length === 155, `population: ${files.length} probe files under scripts/`);

/**
 * My own crude string blanker — NOT the subject's `stripSource`, which is not exported. Blanks
 * quoted spans so a hit surviving the blank is outside every literal. Declared limit: it does not
 * model nested template interpolation or escaped quotes inside the same literal, so a "literal-only"
 * verdict here is a report, not a graded leg.
 */
const blankStrings = (src: string): string =>
  src
    .replace(/`(?:[^`\\]|\\.)*`/g, '``')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""');

// ── A1/A2 — derive S1 from client.ts source, assemble the key from the derived names ─────────────
const clientSrc = readFileSync(CLIENT_TS, 'utf8');

/**
 * Brace-match a function body.
 *
 * **Drive 1 defect, repaired here.** The first version took the first `{` at or after the
 * declaration, which for every annotated signature in this codebase is a **type literal inside the
 * parameter list** (`opts: { … }`), so the "body" was a parameter type and `messages.stream` was
 * never in it. `S1` came back EMPTY and the key assembled from it was `\b()\s*\(`, which matches
 * every call in every file. Drive 1 is kept as the recording. The repair: paren-match the parameter
 * list first, then take the first `{` after its closing `)`.
 */
const bodyFrom = (src: string, from: number): string => {
  const lp = src.indexOf('(', from);
  let after = from;
  if (lp >= 0) {
    let d = 0;
    for (let i = lp; i < src.length; i++) {
      if (src[i] === '(') d++;
      else if (src[i] === ')') {
        d--;
        if (d === 0) {
          after = i + 1;
          break;
        }
      }
    }
  }
  const open = src.indexOf('{', after);
  if (open < 0) return '';
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(open, i + 1);
    }
  }
  return src.slice(open);
};

type Fn = { name: string; exported: boolean; body: string };
const fnsOf = (src: string): Fn[] => {
  const out: Fn[] = [];
  const re = /(export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*[(<]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    out.push({ name: m[2], exported: Boolean(m[1]), body: bodyFrom(src, m.index) });
  }
  return out;
};

const MODEL_CALL = /\bmessages\s*\.\s*(create|stream)\s*\(/;
const clientFns = fnsOf(clientSrc);
// direct reach
const directReach = clientFns.filter((f) => MODEL_CALL.test(f.body)).map((f) => f.name);
// one hop inside the same file
const oneHop = clientFns
  .filter((f) => !directReach.includes(f.name))
  .filter((f) => directReach.some((d) => new RegExp(`\\b${d}\\s*\\(`).test(f.body)))
  .map((f) => f.name);
const reaching = new Set([...directReach, ...oneHop]);
const S1 = clientFns
  .filter((f) => f.exported && reaching.has(f.name))
  .map((f) => f.name)
  .sort();
leg(
  'A1',
  S1.length > 0,
  `S1 derived from client.ts: direct=[${directReach.join(',')}] one-hop=[${oneHop.join(',')}] ` +
    `EXPORTED-and-reaching S1=[${S1.join(',')}] (of ${clientFns.length} functions, ` +
    `${clientFns.filter((f) => f.exported).length} exported)`,
);

/**
 * **Drive 1's second defect, and it is the one worth carrying out of this unit.** An alternation
 * assembled from an EMPTY array is not an empty key — it is a SATURATED one: `\b()\s*\(` matches
 * every call in every file. Drive 1's `A2` passed (the key *was* assembled from the array, not
 * typed) while the key it blessed flagged 56 of 155 probes and 141 server exports. A builder that
 * can return a saturated key needs a throw, not a comment.
 */
const buildKey = (names: string[]): RegExp => {
  if (!names.length) throw new Error('buildKey: empty name array would assemble the SATURATED key \\b()\\s*\\(');
  return new RegExp(`\\b(${names.join('|')})\\s*\\(`);
};
leg(
  'A2c',
  new RegExp('\\b()\\s*\\(').test('anythingAtAll(') === true,
  'drive 1 mechanism, measured not asserted: the empty alternation \\b()\\s*\\( matches an arbitrary call',
);
let S1_EMPTY = false;
try {
  buildKey([]);
} catch {
  S1_EMPTY = true;
}
leg('A2b', S1_EMPTY, `buildKey refuses an empty array rather than returning a saturated key: throws=${S1_EMPTY}`);
if (!S1.length) {
  leg('A2', null, 'REFUSED: S1 is empty, so there is no key to assemble and no price to report');
  const { renderVerdict: rv } = await import(join(ROOT, 'docs', 'research', 'lib', 'verdict.mjs'));
  console.log('\n' + rv({ legs: legs.map((id) => ({ id, ok: red.includes(id) ? false : refused.includes(id) ? null : true })), preds: [] }));
  process.exit(1);
}
const KEY_S1 = buildKey(S1);
leg(
  'A2',
  KEY_S1.source === `\\b(${S1.join('|')})\\s*\\(`,
  `candidate key assembled from the derived array, not typed: ${KEY_S1.source}`,
);

// ── P1/P2 — known positive and two-sided negative, on the SAME RegExp object ─────────────────────
const FIX_CALL = `import { streamClaude } from '../packages/server/src/claude/client.js';
const emitter = await streamClaude(channel, entity, history, 'm1');
`;
const FIX_IMPORT_ONLY = `import { streamClaude } from '../packages/server/src/claude/client.js';
console.log(typeof streamClaude);
`;
pred('P1', KEY_S1.test(FIX_CALL) === true, `KNOWN POSITIVE: key fires on import+call fixture = ${KEY_S1.test(FIX_CALL)}`);
pred(
  'P2',
  KEY_S1.test(FIX_IMPORT_ONLY) === false,
  `two-sided negative: key fires on import-WITHOUT-call fixture = ${KEY_S1.test(FIX_IMPORT_ONLY)}`,
);
leg('A4', KEY_S1 === KEY_S1, `P1 and P2 graded by one RegExp object: ${KEY_S1.source}`);
leg('A0b', population().length === files.length, `fixtures stayed in memory: still ${population().length} probe files`);
// And the subject's own detectors see NEITHER fixture — that is the gap, restated as a measurement.
const hazCall = hazards(FIX_CALL) as string[];
leg(
  'A4b',
  true,
  `subject's view of the KP: hazards(import+call fixture) = [${hazCall.join('+') || '(none)'}]`,
);

// ── P3 — is the surface wider than the two names unit-467importroute hand-typed? ─────────────────
const B1_TYPED = ['streamClaude', 'streamClaudeRoundtable'];
pred(
  'P3',
  S1.length >= 3,
  `|S1| = ${S1.length} [${S1.join(',')}] vs B1's hand-typed pair [${B1_TYPED.join(',')}] — ` +
    `symmetric difference = [${[...S1.filter((n) => !B1_TYPED.includes(n)), ...B1_TYPED.filter((n) => !S1.includes(n))].join(',') || 'EMPTY'}]`,
);

// ── S2 — one cross-file hop: server modules exporting a function that calls an S1 member ─────────
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
const serverFiles = walk(SERVER_SRC).filter((p) => p !== CLIENT_TS);
const S1_CALL = buildKey(S1);
const s2: { name: string; file: string }[] = [];
for (const p of serverFiles) {
  const src = readFileSync(p, 'utf8');
  if (!S1_CALL.test(blankStrings(src))) continue;
  for (const f of fnsOf(src)) {
    if (!f.exported) continue;
    if (S1_CALL.test(blankStrings(f.body))) s2.push({ name: f.name, file: relative(ROOT, p) });
  }
}
const S2 = [...new Set(s2.map((x) => x.name))].sort();
leg(
  'A1b',
  true,
  `S2 (one cross-file hop, exported): ${S2.length} name(s) [${S2.join(',') || 'EMPTY'}] from ` +
    `${[...new Set(s2.map((x) => x.file))].join(', ') || '(no file)'}; ` +
    `${serverFiles.length} non-test .ts files under packages/server/src scanned`,
);

// ── the price, at bucket granularity, for each surface ────────────────────────────────────────────
const sweptSet = new Set((SWEPT as { file: string }[]).map((s) => s.file));
const drivable = (f: string) => !sweptSet.has(f) && (DEFERRED as string[]).includes(f);

type Hit = { file: string; name: string; line: number; text: string; literalOnly: boolean; haz: string[]; nonExempt: string[]; drivable: boolean; mover: boolean };
const scan = (names: string[]): Hit[] => {
  if (!names.length) return [];
  const key = buildKey(names);
  const hits: Hit[] = [];
  for (const f of files) {
    const src = readProbe(f);
    if (!key.test(src)) continue;
    const lines = src.split('\n');
    const i = lines.findIndex((l) => key.test(l));
    const m = key.exec(src);
    const haz = hazards(src) as string[];
    const nonExempt = haz.filter((h) => !(EXEMPTIBLE as Set<string>).has(h));
    const lit = !key.test(blankStrings(src));
    const dr = drivable(f);
    hits.push({
      file: f,
      name: m ? m[1] : '?',
      line: i + 1,
      text: (lines[i] ?? '').trim().slice(0, 110),
      literalOnly: lit,
      haz,
      nonExempt,
      drivable: dr,
      mover: dr && nonExempt.length === 0 && !lit,
    });
  }
  return hits;
};

const hitsS1 = scan(S1);
const hitsS2 = scan(S2);
const moversS1 = hitsS1.filter((h) => h.mover);
const moversS2 = hitsS2.filter((h) => h.mover);

for (const [label, hs] of [['S1', hitsS1], ['S2', hitsS2]] as const) {
  console.log(`\n── ${label} hits over the 155 (${hs.length}) ──`);
  for (const h of hs) {
    console.log(
      `   ${h.file}:${h.line} ${h.name}( literalOnly=${h.literalOnly} drivable=${h.drivable} ` +
        `hazards=[${h.haz.join('+') || '(none)'}] nonExempt=[${h.nonExempt.join('+') || '(none)'}] ` +
        `MOVER=${h.mover}\n      ${h.text}`,
    );
  }
  if (!hs.length) console.log('   (none)');
}
leg('A5', true, `every hit printed with file, line, literal-only status and bucket: S1=${hitsS1.length} S2=${hitsS2.length}`);

pred('P4', moversS1.length === 0, `price at S1 granularity: ${hitsS1.length} hit(s), ${moversS1.length} mover(s) [${moversS1.map((h) => h.file).join(', ') || 'EMPTY'}]`);
pred('P5', hitsS2.length > 0, `S2 matches over the 155: ${hitsS2.length} [${hitsS2.map((h) => h.file).join(', ') || 'EMPTY'}] — movers ${moversS2.length}`);

const all = [...hitsS1, ...hitsS2];
pred(
  'P6',
  all.length === 0 ? null : all.some((h) => h.literalOnly),
  all.length === 0
    ? 'REFUSED by registration: the match set is empty, so "at least one is literal-only" is unsatisfiable, not false'
    : `literal-only among ${all.length} match(es): ${all.filter((h) => h.literalOnly).length}`,
);

// ── the headline number, in the currency Argus used for the `stream` widening ─────────────────────
const names = [...new Set([...S1, ...S2])].sort();
const moversAll = [...new Set([...moversS1, ...moversS2].map((h) => h.file))];
console.log(
  `\nPRICE — a DETECTORS key of /\\b(${names.join('|')})\\s*\\(/ over today's 155:\n` +
    `   hits ${new Set(all.map((h) => h.file)).size} file(s) · drivable-and-clean movers ${moversAll.length} [${moversAll.join(', ') || 'EMPTY'}]`,
);

const porcelain = execFileSync('git', ['-C', ROOT, 'status', '--porcelain', 'packages', 'scripts'], { encoding: 'utf8' });
leg('A9', porcelain.trim() === '', `git status --porcelain packages scripts: ${JSON.stringify(porcelain)}`);

const { renderVerdict } = await import(join(ROOT, 'docs', 'research', 'lib', 'verdict.mjs'));
console.log(
  '\n' +
    renderVerdict({
      legs: legs.map((id) => ({ id, ok: red.includes(id) ? false : refused.includes(id) ? null : true })),
      preds: preds.map((id) => ({ id, landed: refuted.includes(id) ? false : prefused.includes(id) ? null : true })),
    }),
);
process.exit(red.length ? 1 : 0);
