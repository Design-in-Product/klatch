/**
 * unit-467importroute — arm A: reproduce Argus's figures under Argus's own key.
 *
 * Pre-registration: PRE-REGISTRATION.md (`cc3a74e1`), pushed before this file existed.
 *
 * No key of mine decides any admission fact here. `hazards`, `EXEMPTIBLE` and `stripSource` are
 * **imported from the subject**, and every `not driven` claim comes from a real
 * `promote-probes.mts --list` invocation whose output is captured. `promote-probes.mts`'s own
 * `main()` is guarded on `argv[1].endsWith('promote-probes.mts')`, so importing it from a file
 * named `arm-importroute-a.mts` does not drive it — asserted by leg `A0`.
 *
 * Written as `.mts` and run under `npx tsx` for exactly that reason: an `.mjs` arm cannot import
 * the subject and would have to re-type the detectors, which is the defect my own arm C re-created
 * in unit-467rawjson.
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

// ── the subject, imported not re-typed ───────────────────────────────────────────────────────────
const subject = await import(join(SCRIPTS, 'promote-probes.mts'));
const { hazards, EXEMPTIBLE } = subject;
const { stripSource } = await import(join(SCRIPTS, 'lib', 'strip-source.mjs'));
const { SWEPT, DEFERRED } = await import(join(SCRIPTS, 'sweep-probes.mjs'));

leg(
  'A0',
  typeof hazards === 'function' && EXEMPTIBLE instanceof Set,
  `subject imported without driving it: hazards=${typeof hazards} EXEMPTIBLE=${[...(EXEMPTIBLE ?? [])].join('+')}`,
);

const read = (f: string) => readFileSync(join(SCRIPTS, f), 'utf8');
const population = () => readdirSync(SCRIPTS).filter((f) => /^probe-/.test(f)).sort();
const files = population();
leg('A1a', files.length === 155, `population: ${files.length} probe files (promote-probes' own predicate)`);

// `--list` exits **2** when nothing is drivable (`promote-probes.mts:782`), which is the normal
// outcome for every hazardous file — so a bare `execFileSync` throws on the majority of this arm's
// invocations. Drive 1 (`drive1.arma.out`, kept) crashed at A3 for exactly that reason, after A1
// and A2 had already recorded. The exit code is captured and returned alongside stdout rather than
// being allowed to decide whether the arm runs: 0 and 2 are both answers from the tool, and only
// anything else is a failure to invoke it.
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

// ── A1: `not driven (model)` from the tool's own mouth ───────────────────────────────────────────
const listAll = tsx(['--list']).out;
const bucket = (out: string, k: string): number | null => {
  const m = new RegExp(`not driven \\(${k}\\): (\\d+)`).exec(out);
  return m ? Number(m[1]) : null;
};
const modelBucket = bucket(listAll, 'model');
const netBucket = bucket(listAll, 'net');
leg('A1b', modelBucket !== null, `--list printed a model bucket: ${modelBucket}`);
pred('A1', modelBucket === 12, `not driven (model) = ${modelBucket}; Argus reported 12 (= my own count)`);
leg('A1c', netBucket !== null, `--list printed a net bucket: ${netBucket}`);

// ── A2: my spawn key over `src/index.ts` ─────────────────────────────────────────────────────────
// A spawn/exec CALL whose text names the server entrypoint. Comments blanked (prose cannot vote),
// strings kept (an argv entry is necessarily a literal) — the same reading `hazards()` uses.
// Deliberately permissive about the path prefix: `packages/server/src/index.ts`, `src/index.ts` and
// an interpolated `${…}/src/index.ts` all count, because unit-467rawjson `Q4` was refuted by
// exactly the literal-path assumption this key refuses to make.
const SPAWNCALL = /\b(spawn|spawnSync|execFile|execFileSync|exec|fork)\s*\(/;
const INDEX_TS = /src\/index\.ts/;
const rawHits: string[] = [];
const spawners: string[] = [];
for (const f of files) {
  const src = read(f);
  if (INDEX_TS.test(src)) rawHits.push(f);
  const stripped = stripSource(src, false);
  if (!INDEX_TS.test(stripped)) continue;
  // The call and the target must be close enough to be one site: same line, or the target within
  // the 3 lines following a spawn call (the dominant multi-line argv spelling in this corpus).
  const lines = stripped.split('\n');
  let site = -1;
  for (let i = 0; i < lines.length; i++) {
    if (!SPAWNCALL.test(lines[i])) continue;
    if (lines.slice(i, i + 4).some((l) => INDEX_TS.test(l))) {
      site = i + 1;
      break;
    }
  }
  if (site > 0) spawners.push(f);
}
leg('A2a', rawHits.length >= spawners.length, `plain grep on the string: ${rawHits.length} files; real spawn sites: ${spawners.length}`);
pred('A2', spawners.length === 29, `spawn-call population over src/index.ts = ${spawners.length}; Argus reported 29`);
console.log(`     grep-only (named but not spawned): ${rawHits.filter((f) => !spawners.includes(f)).join(', ') || '(none)'}`);

// Argus's own population key, quoted from ARGUS-ADMISSION-ANSWER.md's wider-census section:
// `grep -l "spawn('npx', ['tsx', 'src/index.ts']"` — a single-spelling literal. Applied here to the
// same 155 so the two keys can be compared member-by-member rather than count-to-count. Not a
// prediction (A2's predicate already carries the count); a leg, because a set difference is the
// only thing that can say WHICH key is narrow.
const ARGUS_LITERAL = "spawn('npx', ['tsx', 'src/index.ts']";
const argusKeyed = files.filter((f) => read(f).includes(ARGUS_LITERAL));
const mineOnly = spawners.filter((f) => !argusKeyed.includes(f));
const argusOnly = argusKeyed.filter((f) => !spawners.includes(f));
leg(
  'A2b',
  argusOnly.length === 0,
  `Argus's literal key matches ${argusKeyed.length} files; mine ${spawners.length}. ` +
    `|mine \\ Argus| = ${mineOnly.length}, |Argus \\ mine| = ${argusOnly.length}`,
);
for (const f of mineOnly) {
  const line = stripSource(read(f), false)
    .split('\n')
    .find((l: string) => INDEX_TS.test(l) || SPAWNCALL.test(l));
  console.log(`     · in mine, not Argus's: ${f}`);
  console.log(`         ${(line ?? '').trim().slice(0, 150)}`);
}
for (const f of argusOnly) console.log(`     · in Argus's, not mine: ${f}`);

// ── A3: every spawner refused on `net`, read from the tool ───────────────────────────────────────
const sweptSet = new Set((SWEPT as { file: string }[]).map((s) => s.file));
const netRefused: string[] = [];
const notBucketed: string[] = [];
const sweptSpawners: string[] = [];
const drivable: string[] = [];
for (const f of spawners) {
  if (sweptSet.has(f)) sweptSpawners.push(f);
  const { out, code } = tsx(['--list', '--only', f]);
  if (code === 0) drivable.push(f);
  // Under `--only`, the bucket prints a per-site line for each member, so membership is checkable
  // by name rather than by a count.
  if (new RegExp(`not driven \\(net\\):[\\s\\S]*?· ${f.replace(/\./g, '\\.')} —`).test(out)) netRefused.push(f);
  else notBucketed.push(f);
}
// Exit 0 under `--only` means the tool WOULD drive this file unattended. The strongest form of
// Argus's claim is not "it lands in a bucket" but "it is not drivable", and those are different
// sentences for a SWEPT file, which never reaches a bucket at all.
leg(
  'A3a',
  drivable.length === 0,
  `spawners the tool reports as DRIVABLE under --only (exit 0): ${drivable.length}` +
    (drivable.length ? ` — ${drivable.join(', ')}` : ''),
);
pred(
  'A3',
  netRefused.length === spawners.length && spawners.length > 0,
  `net-refused by name under --only: ${netRefused.length} of ${spawners.length}` +
    (notBucketed.length ? ` — NOT in the net bucket: ${notBucketed.join(', ')}` : ''),
);
// Not pre-registered as a prediction: recorded because `promote-probes.mts:708` skips SWEPT files
// before any bucket can see them, so "lands in not driven (net)" is unavailable as a sentence about
// a swept file. If this is non-zero, Argus's 29-of-29 cannot be 29 of 29 for the stated reason.
leg(
  'A3b',
  true,
  `spawners that are SWEPT (never reach a bucket; driven by the sweep, not by promote-probes): ` +
    `${sweptSpawners.length}${sweptSpawners.length ? ` — ${sweptSpawners.join(', ')}` : ''}`,
);
leg(
  'A3c',
  spawners.every((f) => sweptSet.has(f) || (DEFERRED as string[]).includes(f)),
  `every spawner is in exactly one of SWEPT/DEFERRED (census partition holds over my population)`,
);

// ── A4: the exemption asymmetry, from the subject's own Set ──────────────────────────────────────
pred(
  'A4',
  !EXEMPTIBLE.has('net') && !EXEMPTIBLE.has('model'),
  `EXEMPTIBLE = {${[...EXEMPTIBLE].sort().join(', ')}} — net exemptible: ${EXEMPTIBLE.has('net')}, model exemptible: ${EXEMPTIBLE.has('model')}`,
);

// ── tree untouched ───────────────────────────────────────────────────────────────────────────────
const porcelain = execFileSync('git', ['-C', ROOT, 'status', '--porcelain', 'packages', 'scripts'], {
  encoding: 'utf8',
});
leg('A5', porcelain.trim() === '', `git status --porcelain packages scripts: ${JSON.stringify(porcelain)}`);

const { renderVerdict } = await import(join(ROOT, 'docs', 'research', 'lib', 'verdict.mjs'));
console.log(
  '\n' +
    renderVerdict({
      legs: legs.map((id) => ({ id, ok: red.includes(id) ? false : refused.includes(id) ? null : true })),
      preds: preds.map((id) => ({ id, landed: refuted.includes(id) ? false : prefused.includes(id) ? null : true })),
    }),
);
process.exit(red.length ? 1 : 0);
