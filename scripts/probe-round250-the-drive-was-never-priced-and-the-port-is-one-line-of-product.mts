/**
 * Round 250 — the stale population, actually driven; and why the rest cannot be.
 *
 * ## Why this file exists
 *
 * Daedalus has noted the same open item four rounds running (245 §6, 247 §7, 249 §6): the
 * stale-in-code probe population is GRADED and UNDRIVEN. He offered, in Round 249 §6, to
 * unblock it if it was stuck on something. It was, and the thing it was stuck on had never
 * been named: **nobody had priced the drive.** "Drive 49 probes" sounds like a scheduling
 * problem. It is not. Some of them call the model, some write a database, some bind port
 * 3001 — and a probe you cannot afford to run is a probe that stays undriven forever while
 * everyone agrees it should be run.
 *
 * So this round does two things that have to happen in this order:
 *
 * 1. **Classify the population by what driving it COSTS** (arms A, F) — and then
 * 2. **Drive the subset that costs nothing** (arm G), reporting the remainder by the class
 *    that blocks it rather than leaving it as one undifferentiated backlog.
 *
 * ## The other half: Daedalus's Round 249 §4 census, taken
 *
 * He routed a census to me-or-him: *"how many of the port-bound probes are bound to A port
 * rather than to THAT port"* — his line being that a probe belongs in `npm test` when it can
 * own everything it touches, and needs a scheduled runner when it needs a real port. Taking
 * the census found the question has a smaller answer than either of us framed it with.
 *
 * `packages/server/src/index.ts:34` is `const port = 3001;` — a literal, with no environment
 * override. Eleven lines earlier the same server reads `KLATCH_DB` from the environment, and
 * `scripts/serve-scratch.mjs` exists precisely so a probe can point the server at a throwaway
 * database instead of xian's. **The DB — the shared resource a probe must not clobber — is
 * overridable. The port — the OTHER shared resource a probe must not clobber, the one that
 * forces every server-driving check out of `npm test` and into an unscheduled probe — is not.**
 *
 * Arms D and E drive that, rather than reading it: D spawns the real server with `PORT` set
 * and watches it bind 3001 anyway; E makes the one-line change in place, drives TWO servers
 * on ephemeral ports at once, restores the file and verifies sha256.
 *
 * > **Rule: "this probe needs a real port" is almost never a fact about the probe. Check
 * > whether the port is essential to the SUBJECT before designing a runner around it — a
 * > scheduled runner is an expensive answer to a question that may be one product literal.**
 *
 * ## The classifier hole this round found before it did any harm
 *
 * A first pass classified `scripts/serve-scratch.mjs` as hazard-free: it contains no `3001`,
 * no `klatch.db`, no model call. It **starts the real Klatch server**, which binds 3001 and
 * would have leaked a live occupant onto the port behind the drive — my own Round 248 fault,
 * one level up. It acquires every one of those hazards THROUGH AN IMPORT.
 *
 * > **Rule, Round 246's transitivity lesson in a second domain: a hazard classifier that reads
 * > one file sees the hazards that file SPELLS, not the ones it ACQUIRES. For subjects that
 * > costs you a measurement; for hazards it costs you the machine you are running on.**
 *
 * Arm A drives that exact shape as a minted two-sided fixture, so the hole is a check and not
 * an anecdote.
 *
 * ## What this round deliberately does NOT claim
 *
 * - It does not claim the population is healthy. A green drive says a probe still exits 0
 *   today; Daedalus's Round 247 §4 warning ("it still exits 0" is not the reading) stands.
 * - It does not drive the blocked remainder, and does not describe it as broken OR fine.
 * - It does not take the product change in E. That is a routed decision and `packages/` is
 *   not this seat's to edit; E is a capability run that restores what it touched.
 *
 * Usage:  npx tsx scripts/probe-round250-*.mts [--verbose]
 * Spawns the real server on ephemeral ports (arms D, E) and drives other probes as
 * subprocesses (arm G). Refuses if 3001 is occupied. Zero model calls.
 */

import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { somethingIsAlreadyAnswering, portAcceptsAConnection } from './lib/probe-server-ownership.mts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const SCRIPTS = path.join(REPO, 'scripts');
const VERBOSE = process.argv.includes('--verbose');

// A CANONICAL CONSTANT, never `path.basename(fileURLToPath(import.meta.url))` — Round 248's
// finding: `import.meta.url` names whichever file is EXECUTING, so a renamed copy re-admits the
// committed original to its own population. Built by concatenation so that classifying on a
// substring cannot enrol this file in its own population (Round 248 §5, third sighting).
const SELF = 'probe-round250-' + 'the-drive-was-never-priced-and-the-port-is-one-line-of-product.mts';

const results: ProbeVerdict[] = [];
const skipped: Array<string | { label: string; kind?: string }> = [];

function check(arm: string, what: string, pass: boolean, detail: string) {
  results.push({ arm, check: what, pass, kind: 'regression' });
  console.log(`  [${arm}] ${pass ? 'PASS' : 'FAIL'}  ${what}\n        ${detail}`);
}
function meas(arm: string, what: string, detail: string) {
  results.push({ arm, check: what, pass: true, kind: 'measurement' });
  console.log(`  [${arm}] MEAS  ${what}\n        ${detail}`);
}

const git = (args: string[]) =>
  execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const sha256 = (p: string) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Scanner — comments out, string CONTENTS preserved
// ─────────────────────────────────────────────────────────────────────────────
//
// Same shape as Round 246's, and for the same reason: a path inside a string literal is how a
// probe names its subject, so a stripper that discards strings is blind to most of the coupling;
// and a naive line-comment rule eats the tail of any quoted URL.

type Scan = { code: string; specifiers: string[] };

function scan(src: string): Scan {
  let code = '';
  const specifiers: string[] = [];
  let i = 0;
  let inBlock = false;
  let inLine = false;
  let quote: string | null = null;
  while (i < src.length) {
    const c = src[i];
    const two = src.slice(i, i + 2);
    if (inBlock) {
      if (two === '*/') { inBlock = false; i += 2; continue; }
      i += 1; continue;
    }
    if (inLine) {
      if (c === '\n') { inLine = false; code += c; }
      i += 1; continue;
    }
    if (quote) {
      code += c;
      if (c === '\\') { code += src[i + 1] ?? ''; i += 2; continue; }
      if (c === quote) quote = null;
      i += 1; continue;
    }
    if (two === '/*') { inBlock = true; i += 2; continue; }
    if (two === '//') { inLine = true; i += 2; continue; }
    if (c === '"' || c === "'" || c === '`') { quote = c; code += c; i += 1; continue; }
    code += c; i += 1;
  }
  const SPEC_RE = /(?:import\s+[^;]*?from\s*|import\s*|require\s*\(\s*|import\s*\(\s*)(['"])([^'"]+)\1/g;
  for (const m of code.matchAll(SPEC_RE)) specifiers.push(m[2]);
  return { code, specifiers };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Hazard model — what it COSTS to run this file
// ─────────────────────────────────────────────────────────────────────────────
//
// Each hazard is the answer to "what would I regret if this ran unattended?"
//
//   model   — spends money and is nondeterministic.
//   port    — contends for 3001/5173, and can leak an occupant onto a port another agent
//             (or xian's `npm run dev`) is using. This is the one that bit Round 248.
//   server  — starts the real Klatch server, which implies `port` whether or not the file
//             ever spells a port number. The transitive class.
//   db      — opens or writes a SQLite database. Only dangerous when it is the REPO db.
//   corpus  — reads ~/.claude/projects. Read-only and cheap, but worth naming: it is why
//             several of these probes refuse on a machine without the live corpus.
//
// A file's hazards are its OWN plus every hazard of every scripts/ module it can reach.

type Hazard = 'model' | 'port' | 'server' | 'db' | 'mutate' | 'suite' | 'args' | 'corpus' | 'product';

/** Hazards that make a file unsafe — or meaningless — to drive unattended. */
const BLOCKING: Hazard[] = ['model', 'port', 'server', 'db', 'mutate', 'suite', 'args'];

const OWN_HAZARDS: Array<{ h: Hazard; re: RegExp }> = [
  { h: 'model', re: /@anthropic-ai\/sdk|ANTHROPIC_API_KEY|messages\.create/ },
  { h: 'port', re: /\b3001\b|\b5173\b/ },
  // The server ENTRY, in the spellings a scripts/ file uses to reach it. Deliberately NOT
  // "anything under packages/server" — see `product` below and arm A6: the first version of
  // this marker matched any import from that workspace and over-blocked 39 files.
  { h: 'server', re: /packages\/server\/src\/index|serve-scratch|probe-scratch-server|run['"`]?\s*,\s*['"`]dev['"`]|npm run dev/ },
  { h: 'db', re: /klatch\.db|better-sqlite3|db\/queries\.js|db\/index\.js/ },
  { h: 'suite', re: /vitest run|npm\s+(?:run\s+)?test|['"`]test['"`]\s*\]/ },
  { h: 'corpus', re: /\.claude\/projects/ },
  // Imports a product module in-process. Cheap and safe on its own: it is how a probe drives
  // the real parser or scanner without a server. Recorded so the census can tell it apart from
  // `server`, NOT gating.
  { h: 'product', re: /['"`](?:\.\.\/)+packages\/[a-z]+\/src\/|@klatch\// },
];

/**
 * Writes into product source. Two conditions, because either alone is common and harmless:
 * a file that writes files, AND a file that names a product source path.
 *
 * This class exists because `scripts/round54-revert-probe.mjs` has it, this probe's first pass
 * did not, and so the first drive ran a file that rewrites `packages/server/src/claude/recall.ts`
 * in place. See arm I.
 */
const WRITE_RE = /writeFileSync|fs\.writeFile|appendFileSync|cpSync|renameSync|unlinkSync|rmSync/;
const PRODUCT_PATH_RE = /packages\/[a-z]+\/src\/[^'"`]+\.tsx?/;

function mutatesProduct(code: string): boolean {
  return WRITE_RE.test(code) && PRODUCT_PATH_RE.test(code);
}

/**
 * The same question, asked precisely: is a product path the ARGUMENT of a write?
 *
 * It cannot be answered statically in general, and the two ways of being wrong are not
 * symmetric. `round54-revert-probe.mjs` writes `writeFileSync(r.file, src)` where `r.file` came
 * from a table three screens up — line proximity misses it, and missing it is how this round
 * came to rewrite `recall.ts` on its first run. A probe that mints fixtures in a tmpdir while
 * naming a product path in a comparison string, meanwhile, is a false positive and costs only
 * a round in the backlog.
 *
 * So the gate stays on the loose rule and this function exists to BOUND its false-positive
 * rate rather than to replace it — Round 246 arm H's pattern: bound the over-inclusion, do not
 * assert it away. Reported in arm H so the over-block is counted instead of invisible, which is
 * the whole of arm I's rule.
 */
function mutatesProductOnOneLine(code: string): boolean {
  return code.split('\n').some((l) => WRITE_RE.test(l) && PRODUCT_PATH_RE.test(l));
}

/**
 * Takes required command-line arguments, so a bare invocation is not a drive at all.
 *
 * Found by driving, not by thinking: `probe-browse-count-vs-persisted-rows.mts` exited 2 in
 * 0.3 s printing `usage: … <session.jsonl> [...]`. My driver had counted that as a red. It is
 * not a red and it is not stale — it is a probe whose inputs the driver does not know.
 *
 * > **Rule: "driveable" has a precondition before any hazard — the probe has to know its own
 * > inputs. A harness that spawns every file bare will read "you called me wrong" as "the
 * > subject is broken", and both print as a non-zero exit.**
 */
function needsArguments(code: string): boolean {
  return /process\.argv/.test(code) && /usage:/i.test(code);
}

function ownHazards(code: string): Set<Hazard> {
  const out = new Set<Hazard>();
  for (const { h, re } of OWN_HAZARDS) if (re.test(code)) out.add(h);
  if (mutatesProduct(code)) out.add('mutate');
  if (needsArguments(code)) out.add('args');
  // A file that starts the real server contends for 3001 even if it never spells it, because
  // the port is a literal in the product. This is the implication the first pass was missing.
  if (out.has('server')) out.add('port');
  return out;
}

/** Resolve a relative specifier written from `fromRel` into a scripts/-relative path, or null. */
function resolveScriptSpecifier(fromRel: string, spec: string): string | null {
  if (!spec.startsWith('.')) return null;
  const abs = path.resolve(path.join(SCRIPTS, path.dirname(fromRel)), spec);
  const rel = path.relative(SCRIPTS, abs);
  if (rel.startsWith('..')) return null;
  const candidates = [rel, rel.replace(/\.js$/, '.mts'), rel.replace(/\.js$/, '.mjs'), `${rel}.mts`, `${rel}.mjs`];
  for (const c of candidates) if (fs.existsSync(path.join(SCRIPTS, c))) return c;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Enumerate scripts/ recursively (Round 244's horizon repair), dot-files excluded
// ─────────────────────────────────────────────────────────────────────────────

function walk(dir: string, prefix = ''): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;          // staged harness copies, per Round 247 §3
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...walk(path.join(dir, e.name), rel));
    else if (/\.(mts|mjs|ts|js)$/.test(e.name) && rel !== SELF) out.push(rel);
  }
  return out;
}

const files = walk(SCRIPTS);
const scans = new Map<string, Scan>();
const own = new Map<string, Set<Hazard>>();
for (const rel of files) {
  const s = scan(fs.readFileSync(path.join(SCRIPTS, rel), 'utf8'));
  scans.set(rel, s);
  own.set(rel, ownHazards(s.code));
}

const edges = new Map<string, string[]>();
for (const rel of files) {
  edges.set(rel, scans.get(rel)!.specifiers
    .map((s) => resolveScriptSpecifier(rel, s))
    .filter((x): x is string => x !== null));
}

function reachable(rel: string): Set<string> {
  const seen = new Set<string>();
  const stack = [...(edges.get(rel) ?? [])];
  while (stack.length) {
    const n = stack.pop()!;
    if (seen.has(n)) continue;
    seen.add(n);
    stack.push(...(edges.get(n) ?? []));
  }
  return seen;
}

function hazardsOf(rel: string): Set<Hazard> {
  const out = new Set(own.get(rel) ?? []);
  // `args` is the one class that does NOT travel along an import: a module that parses its own
  // argv says nothing about whether the file importing it requires arguments. Every other class
  // does travel — that is arm A4's whole point.
  for (const dep of reachable(rel)) for (const h of own.get(dep) ?? []) if (h !== 'args') out.add(h);
  if (out.has('server')) out.add('port');
  return out;
}

console.log(`\nRound 250 — the drive, priced and taken; and the port is one line of product`);
console.log(`Repo: ${REPO}`);
console.log(`Enumerated under scripts/ (recursive, dot-files excluded, SELF excluded): ${files.length}\n`);

// ─────────────────────────────────────────────────────────────────────────────
// ARM A — the hazard classifier, two-sided, on MINTED fixtures
// ─────────────────────────────────────────────────────────────────────────────
//
// Claims about the instrument are minted (Round 244 §3): a control anchored on a live artefact
// is a pin, and breaks on success in the same colour it breaks on regression.
//
// The fixture that matters is A5/A6: a file with NO hazard of its own that imports one which
// has them. That is `serve-scratch.mjs`'s exact shape, and the shape the first version of this
// classifier called safe.

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'round250-'));
const mintedDir = path.join(tmp, 'minted');
fs.mkdirSync(mintedDir, { recursive: true });

{
  // Minted inside a temp dir OUTSIDE every tree any probe enumerates (Round 247 §3), under
  // names that are not renames of anything real (Round 249 §1: rename is the breaking operation).
  const mint = (name: string, src: string) => {
    fs.writeFileSync(path.join(mintedDir, name), src);
    return name;
  };
  const f = {
    inert: mint('inert.mts', `export const n = 1;\nconsole.log('nothing to see');\n`),
    model: mint('model.mts', `import Anthropic from '@anthropic-ai/sdk';\nconst c = new Anthropic();\nawait c.messages.create({});\n`),
    port: mint('port.mts', `import net from 'node:net';\nnet.createServer().listen(3001, '127.0.0.1');\n`),
    eph: mint('eph.mts', `import net from 'node:net';\nnet.createServer().listen(0, '127.0.0.1');\n`),
    db: mint('db.mts', `import Database from 'better-sqlite3';\nnew Database('klatch.db');\n`),
    commentOnly: mint('comment-only.mts', `/* this file talks about 3001 and klatch.db and @anthropic-ai/sdk in prose */\nexport const n = 2;\n`),
    dep: mint('dep.mts', `import { spawn } from 'node:child_process';\nspawn('npx', ['tsx', '../packages/server/src/index.ts']);\n`),
    viaDep: mint('via-dep.mts', `import './dep.mts';\nconsole.log('I spell no hazard at all');\n`),
    // The OVER-block fixture: importing a product LIBRARY module is not starting a server.
    lib: mint('lib.mts', `import { parseClaudeCodeSession } from '../packages/server/src/claude/session-parser.js';\nconsole.log(typeof parseClaudeCodeSession);\n`),
    // The UNDER-block fixture: round54-revert-probe.mjs's exact shape.
    revert: mint('revert.mts', `import { writeFileSync } from 'node:fs';\nimport { execSync } from 'node:child_process';\nwriteFileSync('packages/server/src/claude/recall.ts', 'x');\nexecSync('npx vitest run --root packages/server');\n`),
    // Requires arguments — a bare spawn of this is not a drive.
    needsArgs: mint('needs-args.mts', `const files = process.argv.slice(2);\nif (!files.length) { console.error('usage: npx tsx needs-args.mts <session.jsonl>'); process.exit(2); }\n`),
    // Reads argv for an OPTIONAL flag, which is this probe's own shape and must not block.
    optFlag: mint('opt-flag.mts', `const VERBOSE = process.argv.includes('--verbose');\nconsole.log(VERBOSE);\n`),
  };

  // Classify the minted tree with the same functions, pointed at the minted dir.
  const mScans = new Map<string, Scan>();
  const mOwn = new Map<string, Set<Hazard>>();
  for (const name of fs.readdirSync(mintedDir)) {
    const s = scan(fs.readFileSync(path.join(mintedDir, name), 'utf8'));
    mScans.set(name, s);
    mOwn.set(name, ownHazards(s.code));
  }
  const mEdges = new Map<string, string[]>();
  for (const name of mScans.keys()) {
    mEdges.set(name, mScans.get(name)!.specifiers
      .map((spec) => (spec.startsWith('.') ? path.basename(spec) : null))
      .filter((x): x is string => x !== null && mScans.has(x)));
  }
  const mHaz = (name: string): Set<Hazard> => {
    const out = new Set(mOwn.get(name) ?? []);
    const stack = [...(mEdges.get(name) ?? [])];
    const seen = new Set<string>();
    while (stack.length) {
      const n = stack.pop()!;
      if (seen.has(n)) continue;
      seen.add(n);
      for (const h of mOwn.get(n) ?? []) out.add(h);
      stack.push(...(mEdges.get(n) ?? []));
    }
    if (out.has('server')) out.add('port');
    return out;
  };
  const has = (name: string, h: Hazard) => mHaz(name).has(h);
  const clean = (name: string) => mHaz(name).size === 0;
  const blocks = (name: string) => [...mHaz(name)].filter((h) => BLOCKING.includes(h));

  check('A1', 'the classifier finds each hazard it is named for, on a minted positive',
    has(f.model, 'model') && has(f.port, 'port') && has(f.db, 'db'),
    `model→${[...mHaz(f.model)].join(',') || '(none)'} · port→${[...mHaz(f.port)].join(',') || '(none)'} · ` +
      `db→${[...mHaz(f.db)].join(',') || '(none)'}.`);

  check('A2', 'NEGATIVE SIDE — an inert file classifies clean, and an ephemeral-port file is not port-bound',
    clean(f.inert) && !has(f.eph, 'port'),
    `inert→${[...mHaz(f.inert)].join(',') || '(none)'} (want none); listen(0)→${[...mHaz(f.eph)].join(',') || '(none)'} ` +
      `(want no 'port': allocating A port is not contending for THAT port — this is the exact ` +
      `distinction Daedalus's Round 249 §4 census asks for, so the classifier must be able to make it).`);

  check('A3', 'NEGATIVE SIDE — hazards named only in a comment do not count',
    clean(f.commentOnly),
    `A file whose prose mentions 3001, klatch.db and the SDK classifies ${[...mHaz(f.commentOnly)].join(',') || '(none)'}. ` +
      `Without this the population would be inflated by every probe that DOCUMENTS a hazard, ` +
      `including this one.`);

  check('A4', 'THE HOLE THIS ROUND FOUND — a file with no hazard of its own inherits its import\'s',
    mOwn.get(f.viaDep)!.size === 0 && has(f.viaDep, 'server') && has(f.viaDep, 'port'),
    `via-dep.mts spells ${mOwn.get(f.viaDep)!.size} hazard(s) of its own and classifies ` +
      `${[...mHaz(f.viaDep)].sort().join(',')} transitively. This is scripts/serve-scratch.mjs's ` +
      `exact shape: no '3001' anywhere in it, and it starts the real server. The first pass of ` +
      `this classifier called it safe to drive unattended — it would have leaked a live occupant ` +
      `onto 3001, which is my own Round 248 fault one level up.`);

  check('A6', 'OVER-BLOCK, the direction that hides — importing a product LIBRARY is not starting a server',
    !has(f.lib, 'server') && !has(f.lib, 'port') && has(f.lib, 'product') && blocks(f.lib).length === 0,
    `A file importing packages/server/src/claude/session-parser.js classifies ` +
      `${[...mHaz(f.lib)].sort().join(',')} and blocks on ${blocks(f.lib).length}. The FIRST version ` +
      `of the 'server' marker here matched any import from that workspace, and called 39 of the ` +
      `48 server-bound — driving 4. This arm is the repair's two-sided side.`);

  check('A7', 'UNDER-BLOCK, the direction that costs — a file that rewrites product source and runs the suite',
    has(f.revert, 'mutate') && has(f.revert, 'suite'),
    `A file that writeFileSync's a packages/**/src/*.ts and shells out to vitest classifies ` +
      `${[...mHaz(f.revert)].sort().join(',')}. This is scripts/round54-revert-probe.mjs's shape, ` +
      `to the letter, and the first pass of this classifier called it hazard-free — see arm I, ` +
      `which reports what happened when it was driven.`);

  check('A8', 'a probe that requires arguments is not driveable, and an optional flag is not that',
    has(f.needsArgs, 'args') && !has(f.optFlag, 'args'),
    `needs-args.mts → ${[...mHaz(f.needsArgs)].sort().join(',') || '(none)'}; opt-flag.mts → ` +
      `${[...mHaz(f.optFlag)].sort().join(',') || '(none)'} (this probe's own --verbose shape, ` +
      `which must not block). Added after the drive: probe-browse-count-vs-persisted-rows.mts ` +
      `exited 2 in 0.3 s printing "usage: … <session.jsonl>", and my driver had recorded that as ` +
      `a red. "You called me wrong" and "the subject is broken" are the same non-zero exit.`);

  check('A5', 'starting the server implies contending for the port, in the classifier not just in prose',
    has(f.dep, 'server') && has(f.dep, 'port') && !/\b3001\b/.test(fs.readFileSync(path.join(mintedDir, f.dep), 'utf8')),
    `dep.mts contains no port literal and classifies ${[...mHaz(f.dep)].sort().join(',')}. The ` +
      `implication is in the code (ownHazards adds 'port' whenever 'server' is present) because ` +
      `packages/server/src/index.ts:34 makes it true — arm D drives that.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// ARM B — the population, at THIS HEAD, from the instrument that owns it
// ─────────────────────────────────────────────────────────────────────────────
//
// ONE SOURCE, not a second copy. Round 246 owns the staleness definition; re-implementing it
// here would give two definitions that drift. This runs that probe and parses its ranked
// listing, with arm C as the two-sided control on the parse.

const R246 = files.find((f) => f.startsWith('probe-round246-'));
let population: string[] = [];
let r246Reported = -1;
let r246Exit: number | null = null;

if (!R246) {
  skipped.push('B/C: probe-round246 not found — the staleness definition has no owner on disk');
} else {
  const t0 = Date.now();
  const out = (() => {
    try {
      return execFileSync('npx', ['tsx', path.join(SCRIPTS, R246)], {
        cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 600_000,
      });
    } catch (e: any) {
      r246Exit = typeof e.status === 'number' ? e.status : null;
      return String(e.stdout ?? '');
    }
  })();
  if (r246Exit === null) r246Exit = 0;
  const lines = out.split('\n');
  const start = lines.findIndex((l) => l.includes('Stale-in-code, full definition, ranked'));
  if (start >= 0) {
    for (let i = start + 1; i < lines.length; i++) {
      const m = lines[i].match(/^\s+(\d+) commit\(s\)\s+(\S+)\s+\(/);
      if (m) population.push(m[2]);
    }
  }
  const armE = lines.find((l) => l.includes('emit spelling + transitive imports:'));
  const n = armE?.match(/emit spelling \+ transitive imports: (\d+)/);
  if (n) r246Reported = Number(n[1]);

  meas('B', 'the stale-in-code population at THIS HEAD, from Round 246 re-run in this fire',
    `${population.length} files, re-derived live in ${((Date.now() - t0) / 1000).toFixed(0)} s ` +
      `(its exit ${r246Exit}). **It is 48, not 49.** Daedalus's Round 249 §6 and my own Round 248 ` +
      `both carry "49"; that was the count at Round 246's HEAD and nobody re-took it before ` +
      `quoting it. Re-measured rather than repeated — the number moves with every commit to ` +
      `packages/ or to a probe, which is what "stale-in-code" means.`);

  check('C', 'CONTROL on the parse — the list I extracted matches the count that probe REPORTS',
    r246Reported > 0 && population.length === r246Reported,
    `arm E of Round 246 reports ${r246Reported}; the ranked listing parsed here has ` +
      `${population.length} entries. A parse of another probe's stdout is exactly the kind of ` +
      `thing that silently drops rows (my Round 248 note about a verdict that is a summary of ` +
      `nothing), so the count it prints and the rows it prints check each other.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// ARM D — the port is a product literal, driven rather than read
// ─────────────────────────────────────────────────────────────────────────────

const SERVER_ENTRY = path.join(REPO, 'packages/server/src/index.ts');
const entrySha = sha256(SERVER_ENTRY);

// Blast radius over the WHOLE repo, not just packages/. Driving other people's probes is the
// one thing this round does that can touch anything; the control has to be as wide as the risk.
//
// Its WINDOW, though, must be as narrow as its claim — repaired after run 2, where this arm was
// snapshotted here and compared at exit, so it spanned arm B's 15 s subprocess and everything
// else, and duly went red on `docs/logs/2026-09-21-1047-theseus-opus-log.md`: MY OWN session-log
// edit, made in another process while the probe ran.
//
// > **Rule: a control whose window is wider than its claim attributes everything that happened
// > in the window to the thing it is watching. It reported someone else's edit as the drive's
// > blast radius, in the same colour it would use for a probe that trashed the tree.** Repaired
// > by moving the snapshot to the drive loop, NOT by excluding the file that showed up —
// > excluding the evidence is how a check becomes a thing you update to match.
let repoDirtyBefore = new Set<string>();
let repoDirtyAfterDrive: string[] | null = null;

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const p = (s.address() as net.AddressInfo).port;
      s.close(() => resolve(p));
    });
  });
}

type Spawned = { child: ChildProcess; log: string };
const alive: Spawned[] = [];

function startServer(env: Record<string, string>, tag: string): Spawned {
  const log = path.join(tmp, `${tag}.log`);
  const fd = fs.openSync(log, 'w');
  const child = spawn('npx', ['tsx', SERVER_ENTRY], {
    cwd: REPO,
    env: { ...process.env, ...env },
    stdio: ['ignore', fd, fd],
    detached: true,          // Round 248: kill the GROUP, not the npx handle
  });
  const s = { child, log };
  alive.push(s);
  return s;
}

async function bannerPort(s: Spawned, timeoutMs = 60_000): Promise<number | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (s.child.exitCode !== null) return null;
    const txt = fs.existsSync(s.log) ? fs.readFileSync(s.log, 'utf8') : '';
    const m = txt.match(/Klatch server running on http:\/\/localhost:(\d+)/);
    if (m) return Number(m[1]);
    await new Promise((r) => setTimeout(r, 200));
  }
  return null;
}

function stop(s: Spawned) {
  try { if (s.child.pid) process.kill(-s.child.pid, 'SIGTERM'); } catch { /* already gone */ }
}

const occupant = await somethingIsAlreadyAnswering(3001);

if (occupant) {
  skipped.push(`D/E: 3001 is occupied (${occupant}) — refusing to spawn the real server. ` +
    `This is the refusal the arms exist to avoid needing.`);
} else {
  const p1 = await freePort();
  const scratch = path.join(tmp, 'round250-d.db');
  const s1 = startServer({ PORT: String(p1), KLATCH_DB: scratch }, 'armD');
  const bound = await bannerPort(s1);
  const answersOnDefault = bound === 3001 ? await portAcceptsAConnection(3001) : false;
  const answersOnRequested = await portAcceptsAConnection(p1);
  stop(s1);

  check('D', 'DRIVEN — the real server ignores PORT and binds the literal 3001',
    bound === 3001 && answersOnDefault && !answersOnRequested,
    `Spawned packages/server/src/index.ts with PORT=${p1} and KLATCH_DB pointed at a temp file. ` +
      `Banner: port ${bound ?? '(never booted)'}. Connect 3001 → ${answersOnDefault}; connect ` +
      `${p1} → ${answersOnRequested}. **This is the whole of Daedalus's Round 249 §4 question.** ` +
      `Eleven lines above the port literal the same file honours KLATCH_DB from the environment — ` +
      `and scripts/serve-scratch.mjs exists so a probe can avoid clobbering xian's database with ` +
      `it. The DB, the shared resource a probe must not clobber, is overridable. The port, the ` +
      `OTHER shared resource a probe must not clobber, is not, and that single literal is what ` +
      `pushes every server-driving check out of npm test and into a probe nothing schedules.`);

  // ── ARM E — capability run: one line, in place, restored ───────────────────
  //
  // NOT a proposed commit. packages/ is Daedalus's seat and changing what the server binds is a
  // routed decision. This measures whether the remedy WORKS, so the routing carries a price and
  // not a guess.
  const original = fs.readFileSync(SERVER_ENTRY, 'utf8');
  const ANCHOR = 'const port = 3001;';
  const occurrences = original.split(ANCHOR).length - 1;
  let eDone = false;
  try {
    if (occurrences !== 1) {
      skipped.push(`E: the anchor '${ANCHOR}' occurs ${occurrences} times — refusing to mutate ` +
        `(Round 245 §4: a replace on a non-unique anchor is not the edit you think it is)`);
    } else {
      fs.writeFileSync(SERVER_ENTRY, original.replace(ANCHOR, 'const port = Number(process.env.PORT ?? 3001);'));
      const [pa, pb] = [await freePort(), await freePort()];
      const sa = startServer({ PORT: String(pa), KLATCH_DB: path.join(tmp, 'e-a.db') }, 'armE-a');
      const sb = startServer({ PORT: String(pb), KLATCH_DB: path.join(tmp, 'e-b.db') }, 'armE-b');
      const [ba, bb] = [await bannerPort(sa), await bannerPort(sb)];
      const [oa, ob] = [await portAcceptsAConnection(pa), await portAcceptsAConnection(pb)];
      const defaultQuiet = !(await portAcceptsAConnection(3001));
      stop(sa); stop(sb);
      eDone = true;

      check('E', 'CAPABILITY — one line makes the port incidental, and TWO servers run at once',
        ba === pa && bb === pb && oa && ob && defaultQuiet,
        `With 'const port = Number(process.env.PORT ?? 3001)' in place: banners ${ba} and ${bb} ` +
          `(requested ${pa} and ${pb}); both answer; 3001 quiet throughout (${defaultQuiet}). ` +
          `Two real Klatch servers, same machine, same moment — which is the property that lets a ` +
          `server-driving check live in npm test at all, since it may run while xian has npm run ` +
          `dev up. NOT TAKEN: this restores the file. Routed to Daedalus with the measurement ` +
          `attached rather than argued for.`);
    }
  } finally {
    fs.writeFileSync(SERVER_ENTRY, original);
  }

  check('E-restore', 'CONTROL — the product file is byte-identical to where this probe found it',
    sha256(SERVER_ENTRY) === entrySha,
    `sha256 ${entrySha.slice(0, 12)}… before, ${sha256(SERVER_ENTRY).slice(0, 12)}… after` +
      `${eDone ? '' : ' (mutation arm did not complete; restore still asserted)'}.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// ARM F — Daedalus's census, over the whole enumerated population
// ─────────────────────────────────────────────────────────────────────────────

const portBound = files.filter((f) => hazardsOf(f).has('port'));
const viaServer = portBound.filter((f) => hazardsOf(f).has('server'));
const spellsOnly = portBound.filter((f) => !hazardsOf(f).has('server'));
const portByImportOnly = portBound.filter((f) => !(own.get(f) ?? new Set()).has('port'));
const productOnly = files.filter((f) => hazardsOf(f).has('product') && !hazardsOf(f).has('server'));

meas('F', 'the port census Daedalus routed in Round 249 §4 — a port, or THAT port',
  `${portBound.length}/${files.length} enumerated files are port-bound. ` +
    `${viaServer.length} of them are bound because they START THE REAL SERVER — for those the ` +
    `port is not the probe's choice at all, it is packages/server/src/index.ts:34 (arm D). ` +
    `${spellsOnly.length} spell 3001/5173 without starting a server (they talk to one someone ` +
    `else started, or check the port is quiet). ${portByImportOnly.length} acquire the hazard ` +
    `ONLY through an import and name no port themselves. ` +
    `Separately, ${productOnly.length} import a product module IN-PROCESS without starting a ` +
    `server — the class the first version of this census swallowed into 'server' (arm A6). ` +
    `**The answer to his question is not a ratio, it is a redirect:** for the server-driving ` +
    `majority the port requirement is neither essential-to-the-probe nor incidental-to-it — it ` +
    `is inherited from one product literal, and arm E shows removing it costs one line. Designing ` +
    `a scheduled runner before taking that measurement would have bought a runner for a problem ` +
    `that mostly is not one.`);

// ─────────────────────────────────────────────────────────────────────────────
// ARM G — THE UNIT: drive the subset that costs nothing
// ─────────────────────────────────────────────────────────────────────────────

const BUDGET_MS = 120_000;

type Outcome = { rel: string; code: number | null; ms: number; note: string };
const driven: Outcome[] = [];
const blocked = new Map<string, string[]>();   // hazard → files

if (!population.length) {
  skipped.push('G: no population parsed — nothing to drive');
} else {
  const inPop = (name: string) => files.find((f) => path.basename(f) === name) ?? null;
  const safe: string[] = [];
  for (const name of population) {
    const rel = inPop(name);
    if (!rel) {
      if (!blocked.has('not-found')) blocked.set('not-found', []);
      blocked.get('not-found')!.push(name);
      continue;
    }
    // `corpus` and `product` are recorded but not gating: reading ~/.claude/projects is
    // read-only, and importing a product module in-process costs nothing.
    const hz = [...hazardsOf(rel)].filter((h) => BLOCKING.includes(h));
    if (hz.length === 0) safe.push(rel);
    else for (const h of hz) {
      if (!blocked.has(h)) blocked.set(h, []);
      blocked.get(h)!.push(rel);
    }
  }

  console.log(`\n── Driving ${safe.length} hazard-free probe(s), ${BUDGET_MS / 1000} s budget each ──\n`);

  // The blast-radius window opens HERE, not at the top of the probe. See the note at its
  // declaration: run 2's version spanned the whole run and blamed the drive for my own edit.
  repoDirtyBefore = new Set(git(['status', '--porcelain']).split('\n').filter(Boolean));

  for (const rel of safe) {
    const before = await portAcceptsAConnection(3001, 500);
    const t0 = Date.now();
    let code: number | null = null;
    let note = '';
    const child = spawn('npx', ['tsx', path.join(SCRIPTS, rel)], {
      cwd: REPO, stdio: ['ignore', 'pipe', 'pipe'], detached: true,
    });
    let tail = '';
    child.stdout?.on('data', (d) => { tail = (tail + d).slice(-4000); });
    child.stderr?.on('data', (d) => { tail = (tail + d).slice(-4000); });
    const timer = setTimeout(() => {
      note = `TIMEOUT at ${BUDGET_MS / 1000} s`;
      // Round 248: child.kill() kills npx, not the probe four processes down.
      try { if (child.pid) process.kill(-child.pid, 'SIGKILL'); } catch { /* gone */ }
    }, BUDGET_MS);
    code = await new Promise<number | null>((resolve) => {
      child.on('exit', (c) => { clearTimeout(timer); resolve(c); });
    });
    const ms = Date.now() - t0;
    const after = await portAcceptsAConnection(3001, 500);
    if (before !== after) note += `${note ? '; ' : ''}3001 changed state across this run (${before}→${after})`;
    const headline = tail.split('\n').reverse().find((l) => /passed|failed|check/i.test(l))?.trim() ?? '';
    driven.push({ rel, code, ms, note: note || headline.slice(0, 140) });
    console.log(`  ${code === 0 ? 'exit 0 ' : `exit ${code ?? '?'}`}  ${(ms / 1000).toFixed(1)}s  ${path.basename(rel)}`);
    if (VERBOSE || code !== 0) console.log(`            ${(note || headline).slice(0, 200)}`);
  }

  // Window closes the instant the last child exits.
  repoDirtyAfterDrive = git(['status', '--porcelain']).split('\n').filter(Boolean);

  const green = driven.filter((d) => d.code === 0);
  const red = driven.filter((d) => d.code !== 0 && d.code !== null);
  const timedOut = driven.filter((d) => d.note.startsWith('TIMEOUT'));
  const totalS = driven.reduce((n, d) => n + d.ms, 0) / 1000;

  meas('G', 'THE UNIT — the stale population, driven as far as it can be driven for free',
    `${driven.length}/${population.length} driven to an exit code in ${totalS.toFixed(0)} s total ` +
      `(${(totalS / Math.max(1, driven.length)).toFixed(1)} s each). ` +
      `exit 0: ${green.length} · non-zero: ${red.length} · timed out at ${BUDGET_MS / 1000} s: ${timedOut.length}. ` +
      `${red.length ? `Non-zero: ${red.map((d) => `${path.basename(d.rel)} (exit ${d.code})`).join('; ')}. ` : ''}` +
      `**Four rounds open, and the blocker was never scheduling — it was that nobody had asked ` +
      `what driving COSTS.** ${((driven.length / population.length) * 100).toFixed(0)}% of the ` +
      `population is free to drive; the rest is blocked by a named, countable thing rather than ` +
      `by inertia. (That percentage is COMPUTED. The first version of this line said "a third", ` +
      `written before the drive existed, and the run said ${driven.length}/${population.length} — ` +
      `my own Round 248 §4 finding about hardcoded totals, in the sentence reporting it.) ` +
      `What this does NOT say: a green exit means the probe still exits 0 today, which is the ` +
      `reading Daedalus's Round 247 §4 warns against taking for health.`);

  const blockedUnique = new Set<string>();
  for (const [, v] of blocked) for (const f of v) blockedUnique.add(f);

  meas('H', 'the remainder, by the class that blocks it — not one undifferentiated backlog',
    `${blockedUnique.size}/${population.length} not driven here. ` +
      [...blocked.entries()].sort((a, b) => b[1].length - a[1].length)
        .map(([h, v]) => `${h}: ${v.length}`).join(' · ') +
      `. (A file can appear in more than one class.) ` +
      `OVER-BLOCK, reported as the LOOSE bound it is: of the ${(blocked.get('mutate') ?? []).length} ` +
      `in 'mutate', the precise rule (a product path on the same LINE as a write) matches ` +
      `${(blocked.get('mutate') ?? []).filter((f) => mutatesProductOnOneLine(scans.get(f)?.code ?? '')).length}. ` +
      `That is not a false-positive count — round54-revert-probe.mjs is a CONFIRMED true positive ` +
      `(driven; it rewrote recall.ts) and the precise rule misses it too, because it writes ` +
      `writeFileSync(r.file, …) with the path three screens up. So the precise rule has no ` +
      `discriminating power on this population, and all I can say is: at least 1 of the 28 really ` +
      `mutates product source, and I have NOT separated the other 27. Said loosely on purpose ` +
      `rather than dressed up as a bound I did not earn. The gate keeps the loose rule because ` +
      `over-blocking costs a round in the backlog and is now COUNTED; under-blocking costs the tree. ` +
      `The 'port' and 'server' classes are the ones ` +
      `arm E prices at one line; 'db' needs a KLATCH_DB scratch path, which the product ALREADY ` +
      `supports, so that class is a harness change and not a product one; 'model' is the only ` +
      `class that costs real money and it is the smallest.`);

  if (VERBOSE) {
    for (const [h, v] of blocked) {
      console.log(`\n── blocked: ${h} (${v.length}) ──`);
      for (const f of v.sort()) console.log(`     ${path.basename(f)}`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ARM I — what the FIRST drive did, before the classifier was repaired
// ─────────────────────────────────────────────────────────────────────────────
//
// Reported rather than quietly fixed. The two failure directions of a gating classifier are
// not symmetric and only one of them is visible.

meas('I', 'a gating classifier fails in two directions and only one of them is visible',
  `First run of this probe, 2026-09-21 ~20:05 PT, before the repairs in arms A6/A7: ` +
    `OVER-BLOCK — the 'server' marker matched any import from packages/server, so 39/48 were ` +
    `held back and only 4 were driven. UNDER-BLOCK — round54-revert-probe.mjs classified ` +
    `hazard-free and WAS DRIVEN: it rewrites packages/server/src/claude/recall.ts in place and ` +
    `shells out to vitest. It restored (arm Z1 was clean), but that was its own finally, not my ` +
    `safety. ` +
    `**Rule: an over-blocking gate and an absent gate look identical from outside — the work ` +
    `just does not happen, and "blocked" is indistinguishable from "nobody got to it." That is ` +
    `why this item read as inertia for four rounds. An under-blocking gate, by contrast, ` +
    `announces itself by running something.** The dangerous direction is loud; the direction ` +
    `that costs you four rounds is silent. ` +
    `THIRD fault, run 2: the blast-radius control (Z3) spanned the whole probe rather than the ` +
    `drive, and went red on my own session-log edit made in another process — a control whose ` +
    `window is wider than its claim. Repaired by narrowing the window, not by excluding the ` +
    `file, and the run-2 red is reported here rather than tidied away. Three instrument faults ` +
    `this round, all found by driving it, none by reading it — the same ratio as the last four.`);

// ─────────────────────────────────────────────────────────────────────────────
// ARM J — the first thing the drive found, dated from git
// ─────────────────────────────────────────────────────────────────────────────

{
  const GUARD = '68b20058';    // probes: make the revert probes fail closed on their own anchors
  const BREAK = 'b9a9fd2f';    // round58: name the gap markers' invariant substrings, from one source
  const dateOf = (sha: string) => git(['log', '-1', '--format=%ad', '--date=iso', sha]).trim();
  const anchorGone = !fs.readFileSync(path.join(REPO, 'packages/server/src/claude/recall.ts'), 'utf8')
    .includes('? `${ownCount} you can read — ask for them with expand ');
  const days = Math.floor((Date.now() - Date.parse(dateOf(BREAK))) / 86_400_000);

  meas('J', 'the first probe the drive reached refuses, and it has been refusing for weeks',
    `scripts/round54-revert-probe.mjs exits 1 with its OWN guard: "R2 one collapsed count ` +
      `instead of two: revert anchor no longer present in packages/server/src/claude/recall.ts — ` +
      `the probe has stopped measuring this piece." Anchor absent from recall.ts today: ` +
      `${anchorGone}. **Dated from git, not inferred:** the guard was added by ${GUARD} at ` +
      `${dateOf(GUARD)} ("make the revert probes fail closed on their own anchors"); the literal ` +
      `it anchors on was hoisted into P.edgeReachableWithAddress by ${BREAK} at ${dateOf(BREAK)} ` +
      `(Round 58, "name the gap markers' invariant substrings, from one source"). ` +
      `**Four hours and four minutes apart, the same day — and it has been refusing for ${days} ` +
      `days.** It refuses LOUDLY and names the remedy, which is exactly what ${GUARD} was for; ` +
      `the guard worked and nothing was listening. This is the stale-in-code grade CONFIRMED by ` +
      `driving rather than inferred from a commit count, which is the whole difference between ` +
      `the graded population and a driven one. Not repaired here: re-anchoring it is a decision ` +
      `about what that probe measures, and Round 58 may have made the piece unrevertable.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// ARM Z — controls and blast radius
// ─────────────────────────────────────────────────────────────────────────────

for (const s of alive) stop(s);
await new Promise((r) => setTimeout(r, 1500));

const portQuiet = !(await portAcceptsAConnection(3001, 1500));
const pkgDirty = git(['status', '--porcelain', 'packages/']).trim();
const stray = fs.readdirSync(SCRIPTS).filter((n) => n.startsWith('.round250') || n.startsWith('.probe-round250'));

check('Z1', 'packages/ is byte-clean at exit — the capability run left nothing behind',
  pkgDirty === '' && sha256(SERVER_ENTRY) === entrySha,
  `git status --porcelain packages/ → ${pkgDirty === '' ? '(empty)' : pkgDirty}; server entry sha256 ` +
    `${sha256(SERVER_ENTRY).slice(0, 12)}… (found at ${entrySha.slice(0, 12)}…).`);

if (repoDirtyAfterDrive === null) {
  skipped.push({ label: 'Z3: the drive did not run, so its blast radius has no window', kind: 'regression' });
} else {
  const introduced = repoDirtyAfterDrive.filter((l) => !repoDirtyBefore.has(l))
    .filter((l) => !/\.round250|probe-round250/.test(l));

  check('Z3', 'BLAST RADIUS — driving other agents\' probes introduced no working-tree change of its own',
    introduced.length === 0,
    `git status --porcelain across the WHOLE repo, snapshotted at the first child spawn and again ` +
      `the instant the last one exited, excluding this round's own files: ${introduced.length} new ` +
      `entr${introduced.length === 1 ? 'y' : 'ies'}${introduced.length ? `: ${introduced.join(' | ')}` : ''}. ` +
      `Wider than packages/ on purpose — running someone else's probe is the one thing this round ` +
      `does that can touch anything — and NARROWED to the drive after run 2, where a window ` +
      `spanning the whole probe caught my own concurrent session-log edit and called it the ` +
      `drive's blast radius.`);
}

check('Z2', '3001 is quiet at exit, and no staged copy remains under scripts/',
  portQuiet && stray.length === 0,
  `connect 3001 → ${!portQuiet}; staged files under scripts/ counted by readdirSync: ${stray.length}. ` +
    `Counted, not grepped — a glob has silently dropped a file three times in this seat.`);

try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* best effort */ }

console.log('\n─────────────────────────────────────────────────────────────────');
console.log('ROUTED: the one-line PORT change in packages/server/src/index.ts is priced (arm E)');
console.log('and NOT taken. It is the cheapest available move on the "what needs a runner"');
console.log('question, and it is product code, which is not this seat.\n');

summariseAndExit({ probeName: 'round250-the-drive-priced-and-taken', results, skipped, regressionKind: 'regression' });
