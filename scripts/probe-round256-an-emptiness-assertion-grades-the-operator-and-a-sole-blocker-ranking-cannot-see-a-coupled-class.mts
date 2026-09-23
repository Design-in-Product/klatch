/**
 * Round 256 — two items, both of which correct a rule rather than confirm one.
 *
 * ## Item 1 — Daedalus's Round 255 §4, routed to me because `probe-round225` is mine
 *
 * Mid-fire on 2026-09-22 my `scripts/probe-round225-a-citation-is-not-a-call.mts` reported
 * **2 of 22 FAILED**, both arm Z — *"packages/ still clean at exit"* — listing Daedalus's own
 * untracked deliverable. His probe spliced in memory and wrote nothing. His rule:
 *
 * > An emptiness assertion over a shared window grades everyone who touched it, not the run that
 * > made it. The invariant a probe is entitled to is *"I left the tree as I found it"* — a
 * > before/after porcelain comparison — not *"the tree is empty."*
 *
 * The rule is right and I am adopting it. **The remedy as literally stated has a hole, and this
 * round closes it rather than installing it unexamined.** `git status --porcelain` emits *status
 * letters and a path*. It does not emit content. So for a file that was **already dirty before the
 * probe ran**, a probe that then changes that file's content produces the **identical** porcelain
 * string at both ends — ` M packages/server/src/index.ts` before, ` M packages/server/src/index.ts`
 * after — and a before/after comparison of that string reports "I left the tree as I found it"
 * about a tree it just rewrote.
 *
 * That is not a hypothetical about an idle repo. The precondition for the hole is *pre-existing
 * dirt in the window*, which is **exactly the condition that motivated the repair**: Daedalus's
 * uncommitted file is what reddened arm Z in the first place. The naive remedy is weakest on the
 * state it was designed for.
 *
 * So the fingerprint here is porcelain **plus** the content of everything porcelain names:
 *   - `git status --porcelain -z -uall` — `-uall` expands untracked directories to files, so a
 *     path in the list is a file whose bytes can be hashed;
 *   - `git diff HEAD` over the same pathspec — the content of every tracked modification;
 *   - a sha256 of each untracked file's bytes.
 *
 * Arms A and B drive both shapes **two-sided on a minted throwaway git repository**. Nothing in
 * this round writes to the real `packages/` — the defect being studied is "a control that fires on
 * the wrong tree", and establishing it by dirtying the real product tree would be absurd.
 *
 * ## Item 2 — my own Round 254 §4 rule, and the hole in it I did not see when I wrote it
 *
 * Round 254 filed: *"rank a blocking class by the members it is the ONLY blocker for, not by how
 * many members it touches."* Round 254 §6 then left the ranking itself unmeasured.
 *
 * The prior recorded in `docs/logs/2026-09-22-1947-theseus-opus-log.md` **before this probe was
 * written** says the rule is incomplete and names the mechanism: the hazard model contains a
 * structural implication, `if (out.has('server')) out.add('port')`, so no file can ever carry
 * `server` alone. A class that implies another **cannot be anyone's sole blocker** and therefore
 * scores zero on my own ranking no matter how much it blocks. Arm S measures that and reports the
 * result whichever way it comes out.
 *
 * The generalisation, which is the unit rather than a caveat: the removable thing is a **set** of
 * classes, and the payoff of removing set S is `|{m : blockers(m) ⊆ S}|`. The sole-blocker count
 * is the `|S| = 1` case of that. Arm S computes the whole lattice over the observed sets.
 *
 * ## Safety
 *
 * No product write, no server, no port, no model call. Arms A/B operate inside a `git init`
 * repository under a `mkdtemp` directory. Arm S reads `scripts/` and runs Round 246 as a
 * subprocess (its normal read-only census). A before/after fingerprint of the real `packages/` —
 * this round's own remedy, dogfooded — brackets the whole run.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const SCRIPTS = path.join(REPO, 'scripts');

// Round 248: never `path.basename(fileURLToPath(import.meta.url))` — that names whichever file is
// EXECUTING, so a renamed copy re-admits the committed original to its own population. Built by
// concatenation so classifying on a substring cannot enrol this file in its own population.
const SELF = 'probe-round256-' +
  'an-emptiness-assertion-grades-the-operator-and-a-sole-blocker-ranking-cannot-see-a-coupled-class.mts';

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

const sha = (b: Buffer | string) => crypto.createHash('sha256').update(b).digest('hex');
const gitIn = (cwd: string, args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'klatch-round256-'));

console.log(`\nRound 256 — an emptiness assertion grades the operator; a sole-blocker ranking`);
console.log(`            cannot see a class that implies another`);
console.log(`Repo: ${REPO}`);
console.log(`Scratch: ${tmp}\n`);

// ─────────────────────────────────────────────────────────────────────────────
// The three shapes, as functions, so the arms drive them instead of describing them
// ─────────────────────────────────────────────────────────────────────────────

/** What arm Z of `probe-round225` does today: assert the window is EMPTY. */
export function emptinessShape(repo: string, pathspec: string): string {
  return gitIn(repo, ['status', '--porcelain', '--', pathspec]).trim();
}

/** The remedy as literally stated in Round 255 §4: compare porcelain before against after. */
export function naiveBeforeAfterShape(repo: string, pathspec: string): string {
  return gitIn(repo, ['status', '--porcelain', '--', pathspec]).trim();
}

/**
 * The remedy with the content hole closed. Porcelain names WHICH paths are dirty; this adds WHAT
 * is in them, so a content change under an unchanged status letter cannot pass as "unmoved".
 *
 * Known limit, named rather than left for a reader to find: a rename entry under `-z` emits the
 * new path and the old path as two consecutive records, the second with no status prefix. It lands
 * in the porcelain hash (so a rename is still detected) but is not content-hashed. Nothing in this
 * repo's probe fleet renames inside `packages/` mid-run; if one ever does, this comment is the
 * place that already said what it would miss.
 */
export function fingerprintShape(repo: string, pathspec: string): string {
  const raw = gitIn(repo, ['status', '--porcelain', '-z', '-uall', '--', pathspec]);
  const entries = raw.split('\0').filter((s) => s.length > 0);
  const diff = gitIn(repo, ['diff', 'HEAD', '--', pathspec]);
  const parts = [`P:${sha(entries.join('\n'))}`, `D:${sha(diff)}`];
  const untracked = entries.filter((e) => e.startsWith('?? ')).map((e) => e.slice(3)).sort();
  for (const u of untracked) {
    const abs = path.join(repo, u);
    let h = 'ABSENT';
    try {
      const st = fs.statSync(abs);
      if (st.isFile()) h = sha(fs.readFileSync(abs));
    } catch { /* ABSENT */ }
    parts.push(`U:${u}:${h}`);
  }
  return parts.join('|');
}

// ─────────────────────────────────────────────────────────────────────────────
// The real-tree bracket — this round's own remedy, applied to this round
// ─────────────────────────────────────────────────────────────────────────────
//
// Deliberately NOT `=== ''`. If it were, this probe would commit the defect it is here to fix, on
// the same fire, in the file naming the fix. The pre-existing state is a MEASUREMENT (it is not
// mine to grade); the invariant is the comparison at the end.

const realBefore = fingerprintShape(REPO, 'packages/');
const realDirtBefore = emptinessShape(REPO, 'packages/');

// ─────────────────────────────────────────────────────────────────────────────
// ARM A — the defect Daedalus reported, reproduced two-sided on a minted repository
// ─────────────────────────────────────────────────────────────────────────────

console.log('── arm A: an emptiness assertion grades dirt it did not cause ───────────');

const mintRepo = (name: string): string => {
  const r = path.join(tmp, name);
  fs.mkdirSync(path.join(r, 'packages', 'server', 'src'), { recursive: true });
  gitIn(r, ['init', '-q']);
  gitIn(r, ['config', 'user.email', 'probe@example.invalid']);
  gitIn(r, ['config', 'user.name', 'Round 256 fixture']);
  fs.writeFileSync(path.join(r, 'packages', 'server', 'src', 'index.ts'), 'export const PORT = 3001;\n');
  fs.writeFileSync(path.join(r, 'README.md'), 'fixture\n');
  gitIn(r, ['add', '-A']);
  gitIn(r, ['commit', '-q', '-m', 'fixture']);
  return r;
};

const rA = mintRepo('armA');
const operatorDirt = path.join(rA, 'packages', 'server', 'src', '__tests__');

// A1 — the exact situation of 2026-09-22: another agent's untracked file, in the window,
// present BEFORE this hypothetical probe starts.
fs.mkdirSync(operatorDirt, { recursive: true });
fs.writeFileSync(path.join(operatorDirt, 'round255-shadow.test.ts'), 'it("x", () => {});\n');

const a1Empty = emptinessShape(rA, 'packages/');
check('A1', 'the CURRENT shape reddens on dirt the probe did not cause — the reported defect',
  a1Empty !== '',
  `A file written by someone else before the run makes "git status --porcelain packages/ is empty" ` +
    `false: ${JSON.stringify(a1Empty)}. This is what Daedalus saw as 2 of 22 FAILED. Reproduced ` +
    `on minted state rather than quoted from his memo.`);

// A2 — same dirt, probe writes NOTHING. The repaired shape must be silent.
const a2Before = fingerprintShape(rA, 'packages/');
/* ... a probe that splices in memory runs here and touches nothing ... */
const a2After = fingerprintShape(rA, 'packages/');
check('A2', 'the REPAIRED shape is silent about pre-existing dirt when the run writes nothing',
  a2After === a2Before,
  `Identical fingerprint across a no-write window that contains someone else's untracked file. ` +
    `The invariant asserted is "I left it as I found it", which is true, where "it is empty" is ` +
    `false about the same tree.`);

// A3 — the other side. A control that can only pass is not a control (my Round 254 §3).
fs.writeFileSync(path.join(rA, 'packages', 'server', 'src', 'leaked.ts'), 'export const x = 1;\n');
const a3After = fingerprintShape(rA, 'packages/');
check('A3', 'the REPAIRED shape still catches a real violation — a file the run itself introduced',
  a3After !== a2Before,
  `After the window writes packages/server/src/leaked.ts the fingerprint differs from the one ` +
    `taken at window open. The repair narrows WHO is graded; it does not weaken WHAT is caught.`);

// ─────────────────────────────────────────────────────────────────────────────
// ARM B — the hole in the remedy as literally stated, and the close
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── arm B: porcelain names paths, not contents ───────────────────────────');

const rB = mintRepo('armB');
const bTracked = path.join(rB, 'packages', 'server', 'src', 'index.ts');
const bUntracked = path.join(rB, 'packages', 'server', 'src', 'scratch.ts');

// The precondition is the very state that motivated the repair: dirt already in the window.
fs.writeFileSync(bTracked, 'export const PORT = 3001; // operator was mid-edit\n');
fs.writeFileSync(bUntracked, 'export const a = 1;\n');

const b_naiveBefore = naiveBeforeAfterShape(rB, 'packages/');
const b_fpBefore = fingerprintShape(rB, 'packages/');

// The window now rewrites BOTH already-dirty files. Status letters do not move: a modified
// tracked file stays " M", an untracked file stays "??".
fs.writeFileSync(bTracked, 'export const PORT = 9999; // THE WINDOW DID THIS\n');
fs.writeFileSync(bUntracked, 'export const a = 2; // AND THIS\n');

const b_naiveAfter = naiveBeforeAfterShape(rB, 'packages/');
const b_fpAfter = fingerprintShape(rB, 'packages/');

check('B1', 'THE HOLE — the remedy as literally stated reports "unmoved" about a tree it rewrote',
  b_naiveAfter === b_naiveBefore,
  `Before and after porcelain are byte-identical (${JSON.stringify(b_naiveBefore)}) across a ` +
    `window that changed the contents of one tracked and one untracked file in the pathspec. ` +
    `A before/after comparison of porcelain alone is blind to every change that does not move a ` +
    `status letter — and its blind spot is conditioned on pre-existing dirt, which is the exact ` +
    `state the repair was designed for.`);

check('B2', 'the content-carrying fingerprint catches what B1 misses',
  b_fpAfter !== b_fpBefore,
  `Same window, same two writes: the fingerprint differs. The tracked change is carried by the ` +
    `git-diff component, the untracked change by the per-file sha256.`);

// B3 — separate the two channels, so "it caught it" cannot rest on one of them silently.
const rB3 = mintRepo('armB3');
const b3Untracked = path.join(rB3, 'packages', 'server', 'src', 'scratch.ts');
fs.writeFileSync(b3Untracked, 'export const a = 1;\n');
const b3Before = fingerprintShape(rB3, 'packages/');
fs.writeFileSync(b3Untracked, 'export const a = 2;\n');
const b3After = fingerprintShape(rB3, 'packages/');
check('B3', 'the untracked channel alone is two-sided — an untracked-only content change is caught',
  b3After !== b3Before && naiveBeforeAfterShape(rB3, 'packages/') === '?? packages/server/src/scratch.ts',
  `With no tracked modification at all (git diff HEAD is empty, so the diff channel contributes ` +
    `nothing), changing an untracked file's bytes still moves the fingerprint. Porcelain for this ` +
    `repo reads "?? packages/server/src/scratch.ts" at both ends.`);

const rB4 = mintRepo('armB4');
const b4Tracked = path.join(rB4, 'packages', 'server', 'src', 'index.ts');
fs.writeFileSync(b4Tracked, 'export const PORT = 3001; // mid-edit\n');
const b4Before = fingerprintShape(rB4, 'packages/');
fs.writeFileSync(b4Tracked, 'export const PORT = 4002; // rewritten\n');
const b4After = fingerprintShape(rB4, 'packages/');
check('B4', 'the tracked channel alone is two-sided — a tracked content change under an unchanged " M" is caught',
  b4After !== b4Before && naiveBeforeAfterShape(rB4, 'packages/') === 'M packages/server/src/index.ts',
  `No untracked file exists in this fixture, so the untracked channel contributes nothing; the ` +
    `git-diff channel alone moves the fingerprint while porcelain reads "M packages/server/src/` +
    `index.ts" at both ends.`);

// B5 — the negative direction for the fingerprint itself: it must not be a hash that always moves.
const rB5 = mintRepo('armB5');
fs.writeFileSync(path.join(rB5, 'packages', 'server', 'src', 'scratch.ts'), 'export const a = 1;\n');
const b5a = fingerprintShape(rB5, 'packages/');
const b5b = fingerprintShape(rB5, 'packages/');
check('B5', 'CONTROL — the fingerprint is stable across two calls with no write between them',
  b5a === b5b,
  `Taken twice over a dirty tree with nothing changed in between: identical. Without this, A2 ` +
    `and B5 would be the only evidence the function is not simply always-equal or always-different, ` +
    `and A2 could pass for the wrong reason.`);

// ─────────────────────────────────────────────────────────────────────────────
// Scanner and hazard model — Round 250's, copied unchanged (as Rounds 252 and 254 copied it)
// ─────────────────────────────────────────────────────────────────────────────
//
// A COPY, not an import. Round 250/252/254 are filed artifacts whose figures are cited in
// docs/research and in memos; importing from any of them would give this round the power to move
// their published numbers — the trap Round 244 §7 named.

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
      if (two === '*' + '/') { inBlock = false; i += 2; continue; }
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
    if (two === '/' + '*') { inBlock = true; i += 2; continue; }
    if (two === '//') { inLine = true; i += 2; continue; }
    if (c === '"' || c === "'" || c === '`') { quote = c; code += c; i += 1; continue; }
    code += c; i += 1;
  }
  const SPEC_RE = /(?:import\s+[^;]*?from\s*|import\s*|require\s*\(\s*|import\s*\(\s*)(['"])([^'"]+)\1/g;
  for (const m of code.matchAll(SPEC_RE)) specifiers.push(m[2]);
  return { code, specifiers };
}

type Hazard = 'model' | 'port' | 'server' | 'db' | 'mutate' | 'suite' | 'args' | 'corpus' | 'product';

const BLOCKING: Hazard[] = ['model', 'port', 'server', 'db', 'mutate', 'suite', 'args'];

const OWN_HAZARDS: Array<{ h: Hazard; re: RegExp }> = [
  { h: 'model', re: /@anthropic-ai\/sdk|ANTHROPIC_API_KEY|messages\.create/ },
  { h: 'port', re: /\b3001\b|\b5173\b/ },
  { h: 'server', re: /packages\/server\/src\/index|serve-scratch|probe-scratch-server|run['"`]?\s*,\s*['"`]dev['"`]|npm run dev/ },
  { h: 'db', re: /klatch\.db|better-sqlite3|db\/queries\.js|db\/index\.js/ },
  { h: 'suite', re: /vitest run|npm\s+(?:run\s+)?test|['"`]test['"`]\s*\]/ },
  { h: 'corpus', re: /\.claude\/projects/ },
  { h: 'product', re: /['"`](?:\.\.\/)+packages\/[a-z]+\/src\/|@klatch\// },
];

const WRITE_RE = /writeFileSync|fs\.writeFile|appendFileSync|cpSync|renameSync|unlinkSync|rmSync/;
const PRODUCT_PATH_RE = /packages\/[a-z]+\/src\/[^'"`]+\.tsx?/;
const mutatesProduct = (code: string) => WRITE_RE.test(code) && PRODUCT_PATH_RE.test(code);
const needsArguments = (code: string) => /process\.argv/.test(code) && /usage:/i.test(code);

/** The implication under test in arm S. Copied from Round 250/252/254 verbatim. */
const SERVER_IMPLIES_PORT = true;

function ownHazards(code: string): Set<Hazard> {
  const out = new Set<Hazard>();
  for (const { h, re } of OWN_HAZARDS) if (re.test(code)) out.add(h);
  if (mutatesProduct(code)) out.add('mutate');
  if (needsArguments(code)) out.add('args');
  if (SERVER_IMPLIES_PORT && out.has('server')) out.add('port');
  return out;
}

function resolveScriptSpecifier(fromRel: string, spec: string): string | null {
  if (!spec.startsWith('.')) return null;
  const abs = path.resolve(path.join(SCRIPTS, path.dirname(fromRel)), spec);
  const rel = path.relative(SCRIPTS, abs);
  if (rel.startsWith('..')) return null;
  const candidates = [rel, rel.replace(/\.js$/, '.mts'), rel.replace(/\.js$/, '.mjs'), `${rel}.mts`, `${rel}.mjs`];
  for (const c of candidates) if (fs.existsSync(path.join(SCRIPTS, c))) return c;
  return null;
}

function walkScripts(dir: string, prefix = ''): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...walkScripts(path.join(dir, e.name), rel));
    else if (/\.(mts|mjs|ts|js)$/.test(e.name) && rel !== SELF) out.push(rel);
  }
  return out;
}

const files = walkScripts(SCRIPTS);
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
  for (const dep of reachable(rel)) for (const h of own.get(dep) ?? []) if (h !== 'args') out.add(h);
  if (SERVER_IMPLIES_PORT && out.has('server')) out.add('port');
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// ARM C — the population, re-derived live from the instrument that owns the definition
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── arm C: the population, from probe-round246 run live ──────────────────');

const R246 = files.find((f) => f.startsWith('probe-round246-'));
let population: string[] = [];
let r246Reported = -1;
let r246Exit: number | null = null;

if (!R246) {
  skipped.push('C: probe-round246 not found — the staleness definition has no owner on disk');
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

  check('C', 'CONTROL on the parse — the rows extracted match the count that probe REPORTS',
    r246Reported > 0 && population.length === r246Reported,
    `Round 246 re-run live in ${((Date.now() - t0) / 1000).toFixed(0)} s (exit ${r246Exit}); its ` +
      `arm E reports ${r246Reported}, the ranked listing parsed here has ${population.length} ` +
      `entries. One source for the definition, not a second copy. Round 250 measured 48 on ` +
      `2026-09-21, Round 252 measured 51, Round 254 measured 51 — re-taken here, not quoted.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// ARM S — THE UNIT: the sole-blocker ranking Round 254 §6 left unmeasured,
//         and whether my own Round 254 §4 rule can see a coupled class
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── arm S: rank by sole-blocker, then by removable SET ───────────────────');

type Member = { rel: string; blockers: Hazard[] };
const members: Member[] = [];

if (!population.length) {
  skipped.push('S: no population parsed — the ranking has nothing to rank');
} else {
  for (const name of population) {
    const rel = files.find((f) => f === name || f.endsWith('/' + name) ||
      f.replace(/\.(mts|mjs|ts|js)$/, '') === name.replace(/\.(mts|mjs|ts|js)$/, ''));
    if (!rel) continue;
    const hz = hazardsOf(rel);
    members.push({ rel, blockers: BLOCKING.filter((h) => hz.has(h)) });
  }

  // --- S1: the membership ranking (what Round 250 arm H filed and every round since read
  //         as a queue) next to the sole-blocker ranking (what Round 254 §4 said to use).
  const membership = new Map<Hazard, number>();
  const sole = new Map<Hazard, number>();
  for (const h of BLOCKING) { membership.set(h, 0); sole.set(h, 0); }
  for (const m of members) {
    for (const h of m.blockers) membership.set(h, membership.get(h)! + 1);
    if (m.blockers.length === 1) sole.set(m.blockers[0], sole.get(m.blockers[0])! + 1);
  }
  const free = members.filter((m) => m.blockers.length === 0);

  const fmt = (mp: Map<Hazard, number>) =>
    [...mp.entries()].sort((a, b) => b[1] - a[1]).map(([h, n]) => `${h} ${n}`).join(' · ');

  meas('S1', 'THE RANKING Round 254 §6 left unmeasured — membership vs sole-blocker, side by side',
    `population ${members.length} resolved of ${population.length} listed; ${free.length} carry ` +
      `NO blocking hazard.\n        by MEMBERSHIP (the ranking in circulation): ${fmt(membership)}` +
      `\n        by SOLE BLOCKER (Round 254 §4's rule): ${fmt(sole)}`);

  const topMembership = [...membership.entries()].sort((a, b) => b[1] - a[1])[0];
  const topSole = [...sole.entries()].sort((a, b) => b[1] - a[1])[0];
  meas('S2', 'the two rankings do not agree at the top',
    `membership says take "${topMembership[0]}" (${topMembership[1]} members); sole-blocker says ` +
      `take "${topSole[0]}" (${topSole[1]} members unblocked by removing it alone). ` +
      (topMembership[0] === topSole[0]
        ? `They name the SAME class this run — reported as agreement, which is not the same as the ` +
          `distinction being unreal; Round 254 measured them disagreeing 31 vs 3 on 'mutate'.`
        : `They name DIFFERENT classes. Removing the membership winner buys ` +
          `${sole.get(topMembership[0])} member(s), not ${topMembership[1]}.`));

  // --- S3: the prior. A class that implies another cannot be a sole blocker.
  const serverMembers = members.filter((m) => m.blockers.includes('server'));
  const serverAlsoPort = serverMembers.filter((m) => m.blockers.includes('port'));
  check('S3', 'PREDICTED, and it falsifies my own Round 254 §4 rule as written',
    sole.get('server') === 0 && serverMembers.length > 0 &&
      serverAlsoPort.length === serverMembers.length,
    `'server' is the sole blocker for ${sole.get('server')} of ${serverMembers.length} members ` +
      `that carry it, and ${serverAlsoPort.length}/${serverMembers.length} of them carry 'port' ` +
      `too. The cause is structural, not empirical: ownHazards() ends with ` +
      `"if (out.has('server')) out.add('port')", so no file can carry 'server' alone. ` +
      `A CLASS THAT IMPLIES ANOTHER SCORES ZERO ON MY OWN RANKING NO MATTER HOW MUCH IT BLOCKS. ` +
      `Recorded as a prior in the session log at 19:48, BEFORE this probe was written.`);

  // --- S4: the generalisation. The removable unit is a SET.
  //     payoff(S) = |{m : blockers(m) ≠ ∅ AND blockers(m) ⊆ S}|, over the sets observed.
  //
  // The `blockers(m) ≠ ∅` clause is NOT a detail. Run 1 of this probe omitted it here while the
  // control at S6 included it, so every set was credited with the 3 members that were already
  // driveable and `{db}` printed 16 against a sole-blocker count of 13 in the arm directly above
  // it. The fault was not the arithmetic — it was that S6 exercised a SEPARATE implementation of
  // the same idea, so a passing control said nothing about the function that produced the
  // headline. One function now, used by both.
  //
  // **Rule: a control has to call the same function the finding does. Two implementations of one
  // idea is a control that grades its own twin.** Companion to Daedalus's Round 255 §3 — there an
  // arm tested its fixture's layout, here an arm tested a copy of its subject.
  const key = (hs: Hazard[]) => hs.slice().sort().join('+') || '(none)';
  const payoffOf = (pool: Member[], S: Hazard[]) =>
    pool.filter((m) => m.blockers.length > 0 && m.blockers.every((h) => S.includes(h))).length;

  const observed = new Map<string, Hazard[]>();
  for (const m of members) observed.set(key(m.blockers), m.blockers);

  const lattice: Array<{ set: Hazard[]; payoff: number; cost: number }> = [];
  for (const [, S] of observed) {
    if (S.length === 0) continue;
    lattice.push({ set: S, payoff: payoffOf(members, S), cost: S.length });
  }
  // Also price every singleton, including ones no member carries alone — that is the point.
  for (const h of BLOCKING) {
    if (!lattice.some((e) => e.cost === 1 && e.set[0] === h)) {
      lattice.push({ set: [h], payoff: payoffOf(members, [h]), cost: 1 });
    }
  }
  lattice.sort((a, b) => (b.payoff - a.payoff) || (a.cost - b.cost));

  // The tie that makes the unification checkable rather than asserted: for every singleton, the
  // set-payoff and the independently-counted sole-blocker tally must agree. They are computed by
  // different code paths from the same data, and in run 1 they did not.
  const singletonMismatches = BLOCKING.filter((h) =>
    payoffOf(members, [h]) !== sole.get(h)!);
  check('S4b', 'CONTROL — set-payoff at |S|=1 equals the independently counted sole-blocker tally',
    singletonMismatches.length === 0,
    singletonMismatches.length === 0
      ? `All ${BLOCKING.length} singletons agree between the lattice and the tally in S1 ` +
        `(db ${payoffOf(members, ['db'])}, mutate ${payoffOf(members, ['mutate'])}, ` +
        `args ${payoffOf(members, ['args'])}, model/port/server/suite 0). This check did not ` +
        `exist in run 1; adding it is what caught the fault described above.`
      : `DISAGREE on: ${singletonMismatches.map((h) => `${h} lattice ${payoffOf(members, [h])} vs tally ${sole.get(h)}`).join(', ')}`);

  const top = lattice.slice(0, 8)
    .map((e) => `${key(e.set)} → ${e.payoff} (cost ${e.cost})`).join('\n          ');
  meas('S4', 'THE CORRECTED UNIT — payoff of removing a SET, |S|=1 is the sole-blocker case',
    `payoff(S) = members with at least one blocker, all of them in S — i.e. MARGINAL unblock, ` +
      `excluding the ${free.length} already driveable. Top ${Math.min(8, lattice.length)} of ` +
      `${lattice.length} candidate sets:\n          ${top}`);

  const bestPair = lattice.find((e) => e.cost === 2);
  const bestSingle = lattice.find((e) => e.cost === 1);
  meas('S5', 'what the correction changes about what to take next',
    bestSingle && bestPair
      ? `best single class: ${key(bestSingle.set)} → ${bestSingle.payoff}. Best PAIR: ` +
        `${key(bestPair.set)} → ${bestPair.payoff}. ` +
        (bestPair.payoff > bestSingle.payoff
          ? `The pair unblocks ${bestPair.payoff - bestSingle.payoff} more for one extra class of ` +
            `work, and NO single-class ranking — membership or sole-blocker — can surface it.`
          : `No pair beats the best single this run, so the sole-blocker ranking happens to be ` +
            `adequate here. Reported as a fact about this population, not as the rule being safe.`)
      : `not enough distinct sets observed to compare a pair against a single.`);

  // --- S6: two-sided control on the lattice computation itself, on minted membership.
  //     Without this, S4 is a number with nothing behind it. It now calls the SAME `payoffOf`
  //     the lattice does — in run 1 it called a local twin, which is the fault noted at S4.
  //     The sixth member is the one run 1's twin disagreed about: a zero-blocker file, which
  //     no removal can be credited with unblocking.
  const synth: Member[] = [
    { rel: 'x1', blockers: ['db'] },
    { rel: 'x2', blockers: ['db'] },
    { rel: 'x3', blockers: ['port'] },
    { rel: 'x4', blockers: ['db', 'port'] },
    { rel: 'x5', blockers: ['db', 'port', 'suite'] },
    { rel: 'x6', blockers: [] },
  ];
  const pDb = payoffOf(synth, ['db']);
  const pDbPort = payoffOf(synth, ['db', 'port']);
  const pAll = payoffOf(synth, ['db', 'port', 'suite']);
  check('S6', 'CONTROL — the set-payoff function is right on minted membership, in both directions',
    pDb === 2 && pDbPort === 4 && pAll === 5,
    `On a hand-built 6-member pool (5 blocked, 1 free): {db} unblocks 2 (got ${pDb}), {db,port} ` +
      `unblocks 4 (got ${pDbPort}) — monotone increase — and {db,port,suite} unblocks all 5 ` +
      `blocked members but NOT the free one (got ${pAll}, not 6). Two negative directions, both ` +
      `load-bearing: {db} must not count x4/x5, which carry 'db' but are not unblocked by ` +
      `removing it — a membership-counting function reports 4 here; and no set may count x6, ` +
      `which was never blocked — the function run 1 used reported 6 for the full set.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// ARM E — is `probe-round225` the only one, or is the shape fleet-wide?
// ─────────────────────────────────────────────────────────────────────────────
//
// Daedalus's memo lists three sightings across three rounds and repairs the one in his own file;
// I repaired mine. Neither of us asked how many OTHER probes assert emptiness over a shared
// window. A repair to two files is worth much less if the answer is twenty.
//
// Counted by walking `scripts/` (the `files` array above, built with readdirSync), NOT by grep —
// a glob dropped a file from a count three times in one session on 2026-09-02 and the discipline
// since has been to derive file counts from a directory walk.

console.log('\n── arm E: how many probes assert EMPTINESS over a shared window? ────────');

/**
 * Detect the shape in source: a binding whose value comes from `git status --porcelain`, later
 * compared against the empty string. Deliberately syntactic and deliberately loose — this reports
 * a LIST for a human to adjudicate, not a verdict. An over-report here is cheap; a missed file is
 * the thing that costs another agent a red fire.
 */
function emptinessSites(src: string): string[] {
  const code = scan(src).code;
  const hits: string[] = [];
  const PORCELAIN = /status['"`]\s*,\s*['"`]--porcelain|status\s+--porcelain/;
  if (!PORCELAIN.test(code)) return hits;
  // Names bound to a porcelain result, either as a const or as a function returning one.
  const names = new Set<string>();
  for (const m of code.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([^\n;]*)/g)) {
    if (PORCELAIN.test(m[2])) names.add(m[1]);
  }
  for (const m of code.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)[^{]*\{([\s\S]{0,400}?)\}/g)) {
    if (PORCELAIN.test(m[2])) names.add(m[1]);
  }
  // Plus any binding assigned FROM one of those names (the `const after = dirty()` pattern).
  for (const m of code.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$]*)\s*\(\s*\)/g)) {
    if (names.has(m[2])) names.add(m[1]);
  }
  for (const n of names) {
    const cmp = new RegExp(`\\b${n}\\b\\s*(?:\\(\\s*\\))?\\s*(?:\\.trim\\(\\))?\\s*(?:===|!==)\\s*(['"\`])\\1`);
    if (cmp.test(code)) hits.push(n);
  }
  return hits;
}

/**
 * The refinement the first census forced. `emptinessSites` finds the COMPARISON; a comparison is
 * only a defect when something ASSERTS on it. Two files proved that the hard way on this run's
 * first pass: `probe-round253` prints `gitPackages === '' ? '(empty)' : …` as a diagnostic and
 * scopes its actual assertion to one path — Daedalus had already repaired it — and the
 * freshly-repaired `probe-round225` keeps the identical comparison inside the MEASUREMENT that
 * reports the baseline. Both were flagged. Neither is a defect.
 *
 * **Rule: a census of a defect has to detect the thing that makes it a defect, not the syntax it
 * usually appears in.** The syntax here is `x === ''`; the defect is *asserting* on `x === ''`.
 *
 * This balances parentheses rather than using a character window, and it does so because BOTH
 * regex windows were driven and BOTH were wrong:
 *
 *  - `[^;]{0,400}` cannot span a statement, so it scored `probe-round254`'s
 *    `check('Z0', …, (() => { const dirty = …; return dirty === ''; })())` as a *diagnostic*.
 *    That is my own probe and it asserts. Found by hand-reading two rows of the census output
 *    instead of trusting the classifier that produced it.
 *  - `[\s\S]{0,400}` fixes that and then flags a `check()` about something else followed 180
 *    characters later by an unasserted comparison. **Arm E1c went RED on exactly that**, on
 *    minted source, on the run where I widened the window.
 *
 * So the window was never the right instrument: "inside this call" is a bracket-matching question,
 * not a distance question, and a distance is what you reach for when you have not said out loud
 * what you actually mean. Both failures were cheap only because the negative direction was minted
 * before the census figure was quoted anywhere.
 *
 * **Rule: when two settings of a tuning parameter fail in opposite directions, the parameter is
 * not mis-tuned — it is the wrong parameter.**
 */
function assertionArgumentSpans(code: string): string[] {
  const spans: string[] = [];
  const OPEN = /\b(?:check|assert|expect|ok)\s*\(/g;
  for (const m of code.matchAll(OPEN)) {
    let i = m.index! + m[0].length;
    let depth = 1;
    let quote: string | null = null;
    const start = i;
    while (i < code.length && depth > 0) {
      const c = code[i];
      if (quote) {
        if (c === '\\') { i += 2; continue; }
        if (c === quote) quote = null;
      } else if (c === '"' || c === "'" || c === '`') {
        quote = c;
      } else if (c === '(') depth += 1;
      else if (c === ')') depth -= 1;
      i += 1;
    }
    if (depth === 0) spans.push(code.slice(start, i - 1));
  }
  return spans;
}

function assertedEmptinessSites(src: string): string[] {
  const code = scan(src).code;
  const spans = assertionArgumentSpans(code);
  return emptinessSites(src).filter((n) => {
    const cmp = new RegExp(`\\b${n}\\b\\s*(?:\\(\\s*\\))?\\s*(?:\\.trim\\(\\))?\\s*===\\s*(['"\`])\\1`);
    return spans.some((s) => cmp.test(s));
  });
}

// Two-sided on minted source FIRST, so the census figure rests on a detector that has been shown
// to work in both directions rather than on one that merely produced a number.
const POS = `const before = execFileSync('git', ['status', '--porcelain', '--', 'packages/']);\n` +
  `check('Z', 'clean', before === '', before);\n`;
const POS2 = `function dirty() { return execFileSync('git', ['status','--porcelain']).trim(); }\n` +
  `const after = dirty();\ncheck('Z', 'clean', after === '', after);\n`;
const NEG = `const before = execFileSync('git', ['status', '--porcelain', '--', 'packages/']);\n` +
  `const after = execFileSync('git', ['status', '--porcelain', '--', 'packages/']);\n` +
  `check('Z', 'unmoved', after === before, after);\n`;
const NEG2 = `// const before = execFileSync('git', ['status','--porcelain']); before === ''\n` +
  `const x = 1;\n`;
// The diagnostic case, minted: the comparison exists but only feeds a console.log. This is
// `probe-round253`'s shape, written out by hand so the distinction is driven, not merely observed.
const DIAG = `const g = execFileSync('git', ['status','--porcelain','packages/']).trim();\n` +
  `console.log(g === '' ? '  (empty)' : g);\n` +
  `check('Z', 'no .env leak', !/packages\\/server\\/\\.env/.test(g), g);\n`;

check('E1', 'CONTROL — the emptiness detector is two-sided on minted source',
  emptinessSites(POS).length === 1 && emptinessSites(POS2).length === 1 &&
    emptinessSites(NEG).length === 0 && emptinessSites(NEG2).length === 0,
  `positives: a direct const compared to '' (${emptinessSites(POS).length}), and a helper ` +
    `function whose result is compared to '' (${emptinessSites(POS2).length}). negatives: a ` +
    `before/after comparison with no empty-string test (${emptinessSites(NEG).length}), and the ` +
    `whole shape inside a COMMENT (${emptinessSites(NEG2).length}) — the comment case is here ` +
    `because Daedalus's Round 255 is about a comment being read as a declaration.`);

check('E1b', 'CONTROL — the ASSERTED-emptiness detector separates a check from a diagnostic',
  assertedEmptinessSites(POS).length === 1 && assertedEmptinessSites(DIAG).length === 0 &&
    emptinessSites(DIAG).length === 1,
  `On minted source: the assertion form is flagged as asserted (${assertedEmptinessSites(POS).length}), ` +
    `and the diagnostic form — compared only inside a console.log, with the real check scoped to ` +
    `one path — is flagged by the loose detector (${emptinessSites(DIAG).length}) and NOT by the ` +
    `asserted one (${assertedEmptinessSites(DIAG).length}). Both directions matter: without the ` +
    `first this arm proves nothing, without the second the census over-reports by counting ` +
    `probes that are already correct.`);

// The IIFE case that the first window missed, minted from the real shape in probe-round254:878.
const IIFE = `check('Z0', 'tree byte-identical', restoreFailure === null && (() => {\n` +
  `  const dirty = git(['status','--porcelain','packages/']).trim();\n` +
  `  return dirty === '';\n})(), 'detail');\n`;
// The precision risk the looser window buys: an assertion about something else, followed later by
// an unrelated emptiness comparison that nothing asserts on.
const FARAPART = `const dirty = execFileSync('git', ['status','--porcelain']).trim();\n` +
  `check('A', 'unrelated', 1 + 1 === 2, 'x');\n` +
  `console.log('padding'.repeat(60));\n` +
  `console.log(dirty === '' ? 'clean' : dirty);\n`;

check('E1c', 'CONTROL — bracket matching catches the IIFE case AND rejects the far-apart one',
  assertedEmptinessSites(IIFE).length === 1 && assertedEmptinessSites(FARAPART).length === 0 &&
    emptinessSites(FARAPART).length === 1,
  `The assertion nested inside an IIFE argument — the shape at probe-round254:878, which the ` +
    `"[^;]" window scored as diagnostic because it cannot cross a statement — is flagged ` +
    `(${assertedEmptinessSites(IIFE).length}). The comparison 180+ characters AFTER an unrelated ` +
    `check(), which the "[\\s\\S]{0,400}" window wrongly flagged and which reddened this arm on ` +
    `the run that introduced it, is NOT flagged (${assertedEmptinessSites(FARAPART).length}) ` +
    `while the loose detector still sees it (${emptinessSites(FARAPART).length}). Both regex ` +
    `windows failed one of these two; balancing parentheses passes both, because "inside this ` +
    `call" was never a question about distance.`);

const fleet: Array<{ rel: string; names: string[]; asserted: string[] }> = [];
let porcelainUsers = 0;
for (const rel of files) {
  const src = fs.readFileSync(path.join(SCRIPTS, rel), 'utf8');
  if (/--porcelain/.test(scan(src).code)) porcelainUsers += 1;
  const names = emptinessSites(src);
  if (names.length) fleet.push({ rel, names, asserted: assertedEmptinessSites(src) });
}
const hard = fleet.filter((f) => f.asserted.length > 0);

meas('E2', 'CENSUS — the shape is NOT three files, and neither of us counted it',
  `${files.length} files walked under scripts/ (readdirSync, dot-files and SELF excluded; NOT ` +
    `grep). ${porcelainUsers} invoke "git status --porcelain". ${fleet.length} compare a ` +
    `porcelain result against the empty string, and ${hard.length} of those ASSERT on it:\n          ` +
    (fleet.length
      ? fleet.map((f) => `${f.asserted.length ? 'ASSERTED' : 'diagnostic'}  ${f.rel} ` +
          `(${f.names.join(', ')})`).join('\n          ')
      : '(none)') +
    `\n        Daedalus's Round 255 §4 lists three sightings across three rounds; he repaired his ` +
    `and routed mine, and NEITHER of us asked how many others there are. An emptiness test is ` +
    `only a defect where the window is SHARED — a probe asserting its own mkdtemp scratch is ` +
    `empty is right — so this is a list to adjudicate. The "diagnostic" rows are the detector ` +
    `being honest about its own limit, not a backlog.`);

// ─────────────────────────────────────────────────────────────────────────────
// ARM Z — this round's own window, bracketed by this round's own remedy
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── arm Z: I left packages/ as I found it ────────────────────────────────');

const realAfter = fingerprintShape(REPO, 'packages/');
check('Z', 'packages/ is as this run found it — a before/after comparison, not an emptiness claim',
  realAfter === realBefore,
  realAfter === realBefore
    ? `fingerprint identical across the whole run. Nothing here writes to packages/ at all; arms ` +
      `A and B operate inside "git init" repositories under ${tmp}.`
    : `MOVED.\n        before: ${realBefore}\n        after:  ${realAfter}`);

meas('Z2', 'pre-existing state of the window — reported, NOT graded',
  realDirtBefore === ''
    ? `git status --porcelain packages/ was empty when this run opened. Recorded so a later ` +
      `reader knows the comparison above was taken over a clean tree this time — which is luck, ` +
      `not an invariant, and is exactly what the old arm mistook for one.`
    : `git status --porcelain packages/ was NOT empty at open:\n        ${realDirtBefore}\n        ` +
      `Whoever put it there, it is not this run's doing and arm Z does not grade it.`);

// ─────────────────────────────────────────────────────────────────────────────

fs.rmSync(tmp, { recursive: true, force: true });

summariseAndExit({
  probeName: SELF,
  results,
  skipped,
});
